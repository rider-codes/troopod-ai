import { AdAnalysis, PageContent, PersonalizationResult } from "@/types";
import {
  adAnalysisSchema,
  personalizeResponseSchema,
  safeTruncate
} from "@/lib/validator";

const CRO_SYSTEM_PROMPT = `You are a CRO (Conversion Rate Optimization) expert.

Your job is to improve a landing page by aligning it with an ad creative.

Rules:

* DO NOT change layout or structure
* ONLY rewrite headline, subheadline, body, CTA
* DO NOT invent fake claims, statistics, or companies
* DO NOT introduce external knowledge
* Use only the information provided
* Keep content concise, persuasive, and aligned with ad tone

Ensure:

* Strong message match
* Clear value proposition
* Urgency if applicable
* Improved CTA clarity

Output MUST be valid JSON only.`;

type GeminiPart =
  | {
      text: string;
    }
  | {
      inline_data: {
        mime_type: string;
        data: string;
      };
    };

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
};

const GEMINI_TIMEOUT_MS = 45000;
const MAX_AD_IMAGE_BYTES = 4 * 1024 * 1024;

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function extractJson<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Model did not return JSON.");
  }

  return JSON.parse(match[0]) as T;
}

function extractTextFromResponse(response: GeminiResponse) {
  const text = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (text) {
    return text;
  }

  if (response.error?.message) {
    throw new Error(response.error.message);
  }

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the prompt: ${response.promptFeedback.blockReason}.`);
  }

  throw new Error("Gemini returned no text.");
}

async function callGemini(parts: GeminiPart[]) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${getModel()}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getApiKey()
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: CRO_SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        },
        contents: [
          {
            role: "user",
            parts
          }
        ]
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS)
    }
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini request failed with status ${response.status}.`);
  }

  return extractTextFromResponse(payload);
}

type AnalyzeInput = {
  ad_creative?: string;
  ad_image_url?: string;
  ad_image_base64?: string;
  ad_mime_type?: string;
};

async function createAnalyzeContent(input: AnalyzeInput) {
  const content: GeminiPart[] = [];

  if (input.ad_creative?.trim()) {
    content.push({
      text: `Analyze the following ad creative and extract structured information.

Return only valid JSON:
{
  "tone": "",
  "audience": "",
  "value_prop": "",
  "cta_intent": ""
}

Use one of these tone values only: professional, playful, urgent, aspirational, friendly.

Ad creative:
${safeTruncate(input.ad_creative, 2400)}`
    });
  } else {
    content.push({
      text: `Analyze this ad creative image and extract structured information.

Return only valid JSON:
{
  "tone": "",
  "audience": "",
  "value_prop": "",
  "cta_intent": ""
}

Use one of these tone values only: professional, playful, urgent, aspirational, friendly.`
    });
  }

  function normalizeImageMediaType(value: string) {
    const normalized = value.toLowerCase();

    if (normalized === "image/jpg") {
      return "image/jpeg";
    }
    if (
      normalized === "image/jpeg" ||
      normalized === "image/png" ||
      normalized === "image/gif" ||
      normalized === "image/webp"
    ) {
      return normalized;
    }

    throw new Error("Unsupported ad image format. Use JPEG, PNG, GIF, or WEBP.");
  }

  if (input.ad_image_base64 && input.ad_mime_type) {
    content.push({
      inline_data: {
        mime_type: normalizeImageMediaType(input.ad_mime_type),
        data: input.ad_image_base64
      }
    });
  } else if (input.ad_image_url) {
    const response = await fetch(input.ad_image_url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      throw new Error(`Couldn't load the ad image (status ${response.status}). Check the image URL.`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error("Only direct image URLs are supported for ad input.");
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_AD_IMAGE_BYTES) {
      throw new Error("The ad image is too large. Use an image under 4MB.");
    }
    content.push({
      inline_data: {
        mime_type: normalizeImageMediaType(contentType),
        data: bytes.toString("base64")
      }
    });
  }

  return content;
}

export async function analyzeAd(input: AnalyzeInput): Promise<AdAnalysis> {
  const parsed = extractJson<AdAnalysis>(await callGemini(await createAnalyzeContent(input)));
  return adAnalysisSchema.parse({
    tone: parsed.tone ?? "",
    audience: parsed.audience ?? "",
    value_prop: parsed.value_prop ?? "",
    cta_intent: parsed.cta_intent ?? ""
  });
}

function buildPersonalizationPrompt(adContext: AdAnalysis, pageContent: PageContent) {
  return `You are Troopod’s CRO personalization engine.

Your task is to rewrite an existing landing page so it better matches the ad creative and improves conversion, while preserving the original page structure and brand tone.

### INPUT

Ad analysis:
${JSON.stringify(adContext, null, 2)}

Landing page content:
${JSON.stringify(pageContent, null, 2)}

Your job:
1) Understand the ad’s core promise.
2) Identify the target audience, tone, and user intent.
3) Rewrite only the provided landing page fields to improve message match and conversion.
4) Return only valid JSON in the exact schema expected by the app.

Hard rules:
- Do not invent facts, statistics, awards, user counts, guarantees, or company claims.
- Do not use vague marketing filler.
- Do not change page structure.
- Do not introduce new sections.
- Do not write output that sounds generic, inflated, or “AI-ish”.
- If a detail is not clearly supported by the ad or page content, leave it unchanged or keep it empty.
- If the page content is invalid, empty, or clearly broken (for example: "--", "403", "error"), do not force personalization. Keep the original content as-is and reduce confidence in the scores.

Priority order for rewriting:
1. Exact or near-exact phrases from the ad
2. Strong paraphrases of the ad
3. Only then, minimal supporting copy that stays faithful to the ad

Writing rules:
- Headline must directly reflect the ad’s core promise.
- Headline should be specific, not abstract.
- Subheadline should add one clear supporting benefit or feature.
- Body should be short, concrete, and grounded.
- CTA should be action-oriented and match the user intent from the ad.
- Prefer simple, human, believable copy over clever copy.
- Keep the brand voice consistent with the page.

Anti-generic filter:
Avoid phrases like:
- “Unlock your potential”
- “Experience the future”
- “Take your journey to the next level”
- “Powerful solution”
- “Transform your experience”
- “Elevate your brand”

If your draft contains generic language, rewrite it using more specific wording from the ad.

Message-match rule:
The first thing a user should understand from the rewritten headline is the same promise they saw in the ad.
If the ad says “ad-free”, “free trial”, “save time”, “fast delivery”, “learn in 10 minutes”, or similar, the headline should preserve that exact promise or a very close paraphrase.

Scoring rules:
- message_match_after must be higher than before when the rewrite truly improves alignment.
- Do not give “High” conversion lift unless the new copy clearly and directly matches the ad promise.
- conversion lift mapping must be:
  0–20 = low
  21–50 = medium
  51–100 = high

Quality check before returning:
- Is the headline directly tied to the ad promise?
- Is any sentence too vague or generic?
- Did you avoid adding unsupported claims?
- Are the scores believable and logically consistent?

If the input is too weak to improve safely, make only minimal edits and keep the output conservative.

Return only valid JSON using the existing schema. No markdown, no explanations, no extra text:
{
  "personalized_content": {
    "headline": "",
    "subheadline": "",
    "body": "",
    "cta": "",
    "badge": "",
    "testimonial": ""
  },
  "scores": {
    "message_match_before": 0,
    "message_match_after": 0,
    "cro_score": 0,
    "estimated_conversion_lift": "low"
  },
  "changes_made": [
    {
      "section": "headline",
      "type": "CRO",
      "reason": ""
    }
  ],
  "ai_reasoning": ""
}`;
}

function buildFallback(pageContent: PageContent, reason: string): PersonalizationResult {
  return personalizeResponseSchema.parse({
    personalized_content: {
      headline: pageContent.headline,
      subheadline: pageContent.subheadline,
      body: pageContent.body,
      cta: pageContent.cta,
      badge: pageContent.badge,
      testimonial: pageContent.testimonial
    },
    scores: {
      message_match_before: 45,
      message_match_after: 45,
      cro_score: 45,
      estimated_conversion_lift: "low"
    },
    changes_made: [],
    ai_reasoning: reason
  });
}

export async function personalizePage(
  adContext: AdAnalysis,
  pageContent: PageContent
): Promise<PersonalizationResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const parsed = extractJson<PersonalizationResult>(
        await callGemini([{ text: buildPersonalizationPrompt(adContext, pageContent) }])
      );
      return personalizeResponseSchema.parse(parsed);
    } catch (error) {
      if (attempt === 1) {
        return buildFallback(
          pageContent,
          `Personalization fell back to original copy after validation failed twice. ${error instanceof Error ? error.message : "Unknown error."}`
        );
      }
    }
  }

  return buildFallback(pageContent, "Personalization fallback used.");
}
