import { NextResponse } from "next/server";
import { personalizePage } from "@/lib/ai";
import { scrapeLandingPage } from "@/lib/scraper";
import { personalizeRequestSchema, toUserMessage } from "@/lib/validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = personalizeRequestSchema.parse(body);
    const pageContent =
      input.page_content ?? (input.page_url ? await scrapeLandingPage(input.page_url) : undefined);

    if (!pageContent) {
      return NextResponse.json(
        {
          error: "No landing page content available for personalization."
        },
        { status: 400 }
      );
    }

    // The scraper only returns the "fallback" source when the live page could not be read.
    // Scoring placeholder copy would produce misleading results, so fail clearly instead.
    if (pageContent.source === "fallback" || (!pageContent.headline && !pageContent.body)) {
      return NextResponse.json(
        {
          error: "Unable to read landing page.",
          details:
            "We couldn't read any copy from that page. It may be blocking scrapers, require a login, or be unreachable. Try a different URL."
        },
        { status: 422 }
      );
    }

    const result = await personalizePage(input.ad_context, pageContent);
    return NextResponse.json({
      ...result,
      page_content: pageContent
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to personalize landing page.",
        details: toUserMessage(error)
      },
      { status: 400 }
    );
  }
}
