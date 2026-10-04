import FirecrawlApp from "@mendable/firecrawl-js";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer-core";
import { PageContent } from "@/types";
import { getUrlError } from "@/lib/url-safety";
import { pageContentSchema, safeTruncate } from "@/lib/validator";

const MOCK_PAGE: PageContent = {
  headline: "Improve your conversion flow with sharper landing page copy",
  subheadline:
    "This is fallback content used when the live page cannot be scraped reliably.",
  body: "We preserve the original structure and focus on rewriting only high-impact hero copy so ad clicks land on messaging that feels relevant, clear, and ready to convert.",
  cta: "Review personalized copy",
  badge: "CRO-safe fallback",
  testimonial: "",
  source: "fallback"
};

const SCRAPE_TIMEOUT_MS = 20000;

// Text that scrapers pick up from widgets rather than page copy.
const NOISE_PATTERN = /recaptcha|cookie|consent|privacy policy|accept all/i;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out.`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

type ExtractedFields = Omit<PageContent, "source">;

function cleanText(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function collectCandidateText($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const text = cleanText($(selector).first().text());
    if (text && !NOISE_PATTERN.test(text)) {
      return text;
    }
  }

  return "";
}

function extractFromHtml(html: string): ExtractedFields {
  const $ = cheerio.load(html);
  const headline = collectCandidateText($, ["main h1", "h1", "[data-hero] h1"]);

  let subheadline = "";
  if (headline) {
    const headlineNode = $("h1")
      .filter((_, el) => cleanText($(el).text()) === headline)
      .first();
    subheadline = cleanText(headlineNode.nextAll("p").first().text());
  }
  if (!subheadline) {
    subheadline = collectCandidateText($, ["main p", "header p", "section p"]);
  }

  const body =
    collectCandidateText($, ["main section p", "article p", "[role='main'] p"]) ||
    subheadline;

  const cta =
    collectCandidateText($, [
      "main a",
      "main button",
      "header a",
      "a[href*='signup']",
      "a[href*='demo']"
    ]) || "Get started";

  const badge = collectCandidateText($, [
    "[class*='badge']",
    "[class*='eyebrow']",
    "[data-badge]",
    "main strong"
  ]);

  const testimonial = collectCandidateText($, [
    "[class*='testimonial']",
    "blockquote",
    "[aria-label*='testimonial']"
  ]);

  return {
    headline,
    subheadline,
    body,
    cta,
    badge,
    testimonial,
    page_url: undefined
  };
}

function normalizePageContent(
  fields: Partial<PageContent>,
  source: PageContent["source"],
  pageUrl: string
) {
  return pageContentSchema.parse({
    headline: safeTruncate(fields.headline ?? "", 180),
    subheadline: safeTruncate(fields.subheadline ?? "", 280),
    body: safeTruncate(fields.body ?? "", 560),
    cta: safeTruncate(fields.cta ?? "", 80),
    badge: safeTruncate(fields.badge ?? "", 90),
    testimonial: safeTruncate(fields.testimonial ?? "", 220),
    source,
    page_url: pageUrl
  });
}

async function scrapeWithFirecrawl(url: string) {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("Firecrawl API key missing.");
  }

  const app = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY
  });

  const result = await withTimeout(
    app.scrapeUrl(url, {
      formats: ["html", "markdown"],
      timeout: SCRAPE_TIMEOUT_MS
    }),
    SCRAPE_TIMEOUT_MS + 5000,
    "Firecrawl"
  );

  if (!result.success) {
    throw new Error(result.error || "Firecrawl returned an error.");
  }

  if (!result.html && !result.markdown) {
    throw new Error("Firecrawl returned no content.");
  }

  const extracted = result.html
    ? extractFromHtml(result.html)
    : extractFromHtml(`<main>${result.markdown ?? ""}</main>`);

  return normalizePageContent(extracted, "firecrawl", url);
}

async function scrapeWithPuppeteer(url: string) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  if (!executablePath) {
    throw new Error("PUPPETEER_EXECUTABLE_PATH is not configured.");
  }

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: SCRAPE_TIMEOUT_MS });
    const html = await page.content();
    return normalizePageContent(extractFromHtml(html), "puppeteer", url);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeWithFetch(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`Fetch fallback failed with status ${response.status}.`);
  }

  const html = await response.text();
  return extractFromHtml(html);
}

export async function scrapeLandingPage(url: string): Promise<PageContent> {
  const urlError = getUrlError(url);
  if (urlError) {
    throw new Error(urlError);
  }

  try {
    return await scrapeWithFirecrawl(url);
  } catch {
    try {
      return await scrapeWithPuppeteer(url);
    } catch {
      try {
        const extracted = await scrapeWithFetch(url);
        return normalizePageContent(extracted, "fetch", url);
      } catch {
        return {
          ...MOCK_PAGE,
          page_url: url,
          body: safeTruncate(
            `${MOCK_PAGE.body} Live scraping failed, so this placeholder helps the personalization flow remain stable.`,
            560
          )
        };
      }
    }
  }
}
