import { NextResponse } from "next/server";
import { personalizePage } from "@/lib/ai";
import { scrapeLandingPage } from "@/lib/scraper";
import { personalizeRequestSchema } from "@/lib/validator";

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

    const result = await personalizePage(input.ad_context, pageContent);
    return NextResponse.json({
      ...result,
      page_content: pageContent
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to personalize landing page.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
