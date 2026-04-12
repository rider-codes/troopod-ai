import { NextResponse } from "next/server";
import { analyzeAd } from "@/lib/ai";
import { analyzeRequestSchema } from "@/lib/validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = analyzeRequestSchema.parse(body);
    const analysis = await analyzeAd(input);
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to analyze ad creative.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
