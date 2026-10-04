"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { ChangeLog } from "@/components/ChangeLog";
import { InputForm } from "@/components/InputForm";
import { OutputPreview } from "@/components/OutputPreview";
import { ScoreCard } from "@/components/ScoreCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUrlError } from "@/lib/url-safety";
import { MAX_AD_TEXT_LENGTH } from "@/lib/validator";
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

// Non-JSON responses (e.g. a platform timeout page) should not surface as a cryptic parse error.
async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an unreadable response."
        : `The request failed (status ${response.status}). Please try again.`
    );
  }
}

async function compressAndEncodeImage(file: File, maxSizeMB: number = 3): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Resize if too large
        const maxDimension = 1600;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress
        const dataUrl = canvas.toDataURL("image/jpeg", 0.70);
        
        // Base64 size check
        const base64Str = dataUrl.split(",")[1];
        if (!base64Str) return reject(new Error("Compression failed."));
        
        const sizeInBytes = Math.ceil((base64Str.length * 3) / 4);
        
        if (sizeInBytes > maxSizeMB * 1024 * 1024) {
          reject(new Error(`Even after compression, the image is too large. Please upload an image smaller than ${maxSizeMB}MB.`));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image for compression."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export default function HomePage() {
  const [adCreative, setAdCreative] = useState("");
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [result, setResult] = useState<PersonalizationResult | null>(null);
  const [originalContent, setOriginalContent] = useState<PageContent | null>(null);
  const [adAnalysis, setAdAnalysis] = useState<AdAnalysis | null>(null);

  async function handleFileSelect(file: File | null) {
    if (!file) {
      setUploadState({});
      return;
    }

    setIsUploading(true);

    try {
      const base64 = await compressAndEncodeImage(file);
      setUploadState({
        ad_image_base64: base64,
        ad_mime_type: "image/jpeg"
      });
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Unable to read the selected image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.dismiss();
    setResult(null);
    setOriginalContent(null);
    setAdAnalysis(null);

    if (!landingPageUrl.trim()) {
      toast.error("Please provide a landing page URL.");
      return;
    }

    const urlError = getUrlError(landingPageUrl);
    if (urlError) {
      toast.error(urlError);
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
      toast.error("Add ad text, upload an image, or provide a direct image URL.");
      return;
    }

    if (adText.length > MAX_AD_TEXT_LENGTH) {
      toast.error(`Ad text must be ${MAX_AD_TEXT_LENGTH} characters or fewer.`);
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

      const analyzePayload = await readJson<AdAnalysis & { details?: string; error?: string }>(analyzeResponse);
      if (!analyzeResponse.ok) {
        throw new Error(analyzePayload.details || analyzePayload.error || "Ad analysis failed.");
      }

      const parsedAdAnalysis = analyzePayload as AdAnalysis;
      setAdAnalysis(parsedAdAnalysis);

      // Scraping and rewriting happen in one request, so advance the step on a timer.
      setActiveStep(1);
      const stepTimer = setTimeout(() => setActiveStep(2), 6000);
      let personalizeResponse: Response;
      try {
        personalizeResponse = await fetch("/api/personalize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ad_context: parsedAdAnalysis,
            page_url: landingPageUrl
          })
        });
      } finally {
        clearTimeout(stepTimer);
      }

      setActiveStep(3);
      const personalizePayload = await readJson<PersonalizationResult & { details?: string; error?: string }>(personalizeResponse);
      if (!personalizeResponse.ok) {
        throw new Error(personalizePayload.details || personalizePayload.error || "Personalization failed.");
      }

      setResult(personalizePayload as PersonalizationResult);
      setOriginalContent((personalizePayload as PersonalizationResult).page_content ?? null);
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsRunning(false);
      setActiveStep(-1);
    }
  }

  function handleReset() {
    toast.dismiss();
    setAdCreative("");
    setLandingPageUrl("");
    setUploadState({});
    setResult(null);
    setOriginalContent(null);
    setAdAnalysis(null);
    setActiveStep(-1);
  }

  function handleUseExample() {
    setUploadState({});
    setAdCreative("Turn more clicks into demo requests with landing pages that match each campaign.");
    setLandingPageUrl("https://asana.com");
  }

  return (
    <main className="min-h-screen w-full">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <header className="mb-8 max-w-3xl space-y-3">
          <Badge className="border-indigo-400/30 text-indigo-200">AI personalization demo</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Turn your ad into a converting landing page
          </h1>
          <p className="text-base leading-relaxed text-slate-400">
            Paste an ad and a landing page URL. AI rewrites the hero copy for stronger message match and clearer
            value, without rebuilding the page.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* INPUT PANEL */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-panel backdrop-blur sm:p-6 lg:sticky lg:top-6">
            <InputForm
              adCreative={adCreative}
              landingPageUrl={landingPageUrl}
              uploading={isUploading}
              running={isRunning}
              hasUploadedImage={Boolean(uploadState.ad_image_base64)}
              onAdCreativeChange={setAdCreative}
              onLandingPageUrlChange={setLandingPageUrl}
              onFileSelect={handleFileSelect}
              onSubmit={handleSubmit}
              onUseExample={handleUseExample}
            />
          </div>

          {/* RESULTS PANEL */}
          <div className="min-h-[420px] rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-panel backdrop-blur sm:p-6">
            {isRunning ? (
              <div className="animate-fade-up" role="status" aria-live="polite">
                <p className="text-sm font-semibold text-indigo-200">Working on it…</p>
                <p className="mt-1 text-sm text-slate-400">This usually takes 20 to 30 seconds.</p>
                <ol className="mt-6 grid gap-3">
                  {loadingSteps.map((step, index) => {
                    const state = activeStep === index ? "active" : activeStep > index ? "done" : "idle";

                    return (
                      <li
                        key={step}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                          state === "active"
                            ? "border-indigo-400/50 bg-indigo-400/10 text-white"
                            : state === "done"
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                              : "border-white/10 bg-slate-950/40 text-slate-500"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                            state === "active"
                              ? "animate-pulse bg-indigo-400 text-slate-950"
                              : state === "done"
                                ? "bg-emerald-400 text-slate-950"
                                : "bg-slate-800 text-slate-500"
                          }`}
                          aria-hidden="true"
                        >
                          {state === "done" ? "✓" : index + 1}
                        </span>
                        {step}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : result && originalContent ? (
              <div className="animate-fade-up space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Personalization result</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Ad tone:{" "}
                      <span className="font-medium capitalize text-slate-200">{adAnalysis?.tone || "n/a"}</span>
                      {" · "}
                      Page source:{" "}
                      <span className="font-medium capitalize text-slate-200">{originalContent.source}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Start new run
                  </Button>
                </div>

                <ScoreCard scores={result.scores} />
                <OutputPreview original={originalContent} personalized={result.personalized_content} />
                <ChangeLog changes={result.changes_made} reasoning={result.ai_reasoning} />
              </div>
            ) : (
              <div className="flex min-h-[380px] flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-400/10 ring-1 ring-indigo-400/20">
                  <svg
                    className="h-7 w-7 text-indigo-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M9.8 4.2 11 7l2.8 1.2L11 9.4 9.8 12.2 8.6 9.4 5.8 8.2 8.6 7l1.2-2.8ZM17 13l.8 1.9 1.9.8-1.9.8L17 18.4l-.8-1.9-1.9-.8 1.9-.8L17 13Z"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-white">Your before/after preview appears here</p>
                  <p className="max-w-sm text-sm text-slate-400">
                    Add an ad and a landing page, or{" "}
                    <button
                      type="button"
                      onClick={handleUseExample}
                      className="text-indigo-300 underline-offset-4 hover:underline"
                    >
                      try an example
                    </button>{" "}
                    to fill it in for you.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
