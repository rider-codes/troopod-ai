"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
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
    setResult(null);
    setOriginalContent(null);
    setAdAnalysis(null);

    if (!landingPageUrl.trim()) {
      toast.error("Please provide a landing page URL.");
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
      toast.error(submitError instanceof Error ? submitError.message : "Something went wrong.");
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
    setActiveStep(-1);
  }

  return (
    <div className="min-h-screen w-full bg-[#0B1220] text-white">
      <div className="w-full px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT PANEL */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 overflow-y-auto max-h-[calc(100vh-48px)] space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Turn your ad into a converting landing page
              </h1>
              <p className="text-base leading-relaxed text-slate-300">
                Paste an ad and a landing page URL to see how AI can rewrite your hero copy for better
                message match, clearer value, and stronger conversions without rebuilding the page.
              </p>
              <Badge variant="outline" className="px-4 py-1 text-[#cfc9ff] border-slate-700">
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
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 overflow-y-auto max-h-[calc(100vh-48px)] space-y-6 flex flex-col">
            {!isRunning && (!result || !originalContent) ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-400 min-h-[400px]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
                  <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p>Run a personalization analysis to view results here.</p>
              </div>
            ) : null}

            {isRunning ? (
              <div className="rounded-[1.6rem] border border-white/10 bg-[#26221f] p-6 shadow-panel">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#cfc9ff]">
                  Processing
                </p>
                <div className="mt-5 grid gap-3 grid-cols-2">
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

            {result && originalContent ? (
              <div className="grid gap-6 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Personalization Result</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Ad tone:{" "}
                      <span className="font-semibold capitalize text-white">{adAnalysis?.tone || "n/a"}</span>
                      {" | "}
                      Page source:{" "}
                      <span className="font-semibold uppercase text-white">{originalContent.source}</span>
                    </p>
                  </div>

                  <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={handleReset}>
                    Start New Run
                  </Button>
                </div>

                <ScoreCard scores={result.scores} />
                <OutputPreview original={originalContent} personalized={result.personalized_content} />
                <ChangeLog changes={result.changes_made} reasoning={result.ai_reasoning} />
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}
