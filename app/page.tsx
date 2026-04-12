"use client";

import { FormEvent, useState } from "react";
import { ChangeLog } from "@/components/ChangeLog";
import { InputForm } from "@/components/InputForm";
import { OutputPreview } from "@/components/OutputPreview";
import { ScoreCard } from "@/components/ScoreCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdAnalysis, PageContent, PersonalizationResult } from "@/types";

type UploadState = {
  ad_image_base64?: string;
  ad_mime_type?: string;
};

const loadingSteps = [
  "Analyzing Ad",
  "Scraping Page",
  "Applying CRO",
  "Validating Output"
];

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export default function HomePage() {
  const [adCreative, setAdCreative] = useState("");
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PersonalizationResult | null>(null);
  const [originalContent, setOriginalContent] = useState<PageContent | null>(null);
  const [adAnalysis, setAdAnalysis] = useState<AdAnalysis | null>(null);

  async function handleFileSelect(file: File | null) {
    if (!file) {
      setUploadState({});
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const base64 = await fileToBase64(file);
      setUploadState({
        ad_image_base64: base64,
        ad_mime_type: file.type || "image/png"
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to read the selected image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setOriginalContent(null);
    setAdAnalysis(null);

    if (!landingPageUrl.trim()) {
      setError("Please provide a landing page URL.");
      return;
    }

    const trimmedCreative = adCreative.trim();
    const directImageUrl =
      !uploadState.ad_image_base64 &&
      /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i.test(trimmedCreative)
        ? trimmedCreative
        : "";
    const adText = directImageUrl ? "" : trimmedCreative;

    if (!adText && !directImageUrl && !uploadState.ad_image_base64) {
      setError("Add ad text, upload an image, or provide a direct image URL.");
      return;
    }

    setIsRunning(true);

    try {
      setActiveStep(0);
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ad_creative: adText || undefined,
          ad_image_url: directImageUrl || undefined,
          ...uploadState
        })
      });

      const analyzePayload = await analyzeResponse.json();
      if (!analyzeResponse.ok) {
        throw new Error(analyzePayload.details || analyzePayload.error || "Ad analysis failed.");
      }

      const parsedAdAnalysis = analyzePayload as AdAnalysis;
      setAdAnalysis(parsedAdAnalysis);

      setActiveStep(1);
      setActiveStep(2);
      const personalizeResponse = await fetch("/api/personalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ad_context: parsedAdAnalysis,
          page_url: landingPageUrl
        })
      });

      setActiveStep(3);
      const personalizePayload = await personalizeResponse.json();
      if (!personalizeResponse.ok) {
        throw new Error(personalizePayload.details || personalizePayload.error || "Personalization failed.");
      }

      setResult(personalizePayload as PersonalizationResult);
      setOriginalContent((personalizePayload as PersonalizationResult).page_content ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsRunning(false);
      setActiveStep(-1);
    }
  }

  function handleReset() {
    setAdCreative("");
    setLandingPageUrl("");
    setUploadState({});
    setResult(null);
    setOriginalContent(null);
    setAdAnalysis(null);
    setError("");
    setActiveStep(-1);
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex max-w-4xl flex-col gap-7 px-5 py-8 sm:px-8 sm:py-10">
        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Turn your ad into a converting landing page
          </h1>
          <p className="max-w-4xl text-lg leading-8 text-[#c0b9b1]">
            Paste an ad and a landing page URL to see how AI can rewrite your hero copy for better
            message match, clearer value, and stronger conversions without rebuilding the page.
          </p>
          <Badge variant="outline" className="px-4 py-1 text-[#cfc9ff]">
            AI Personalization Demo
          </Badge>
        </div>

        <InputForm
          adCreative={adCreative}
          landingPageUrl={landingPageUrl}
          uploading={isUploading}
          hasUploadedImage={Boolean(uploadState.ad_image_base64)}
          onAdCreativeChange={setAdCreative}
          onLandingPageUrlChange={setLandingPageUrl}
          onFileSelect={handleFileSelect}
          onSubmit={handleSubmit}
        />

        {isRunning ? (
          <div className="rounded-[1.6rem] border border-white/10 bg-[#26221f] p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#cfc9ff]">
              Processing
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {loadingSteps.map((step, index) => {
                const state =
                  activeStep === index
                    ? "active"
                    : activeStep > index
                      ? "done"
                      : "idle";

                return (
                  <div
                    key={step}
                    className={`rounded-2xl border p-4 text-sm font-medium ${
                      state === "active"
                        ? "border-primary/50 bg-primary text-[#282333]"
                        : state === "done"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-[#1d1a18] text-[#8d877f]"
                    }`}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {result && originalContent ? (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-ink">Personalization Result</h2>
                <p className="mt-2 text-sm text-[#a59e96]">
                  Ad tone:{" "}
                  <span className="font-semibold capitalize text-ink">{adAnalysis?.tone || "n/a"}</span>
                  {" | "}
                  Page source:{" "}
                  <span className="font-semibold uppercase text-ink">{originalContent.source}</span>
                </p>
              </div>

              <Button variant="outline" onClick={handleReset}>
                Start New Run
              </Button>
            </div>

            <ScoreCard scores={result.scores} />
            <OutputPreview original={originalContent} personalized={result.personalized_content} />
            <ChangeLog changes={result.changes_made} reasoning={result.ai_reasoning} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
