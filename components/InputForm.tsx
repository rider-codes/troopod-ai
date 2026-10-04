"use client";

import { ChangeEvent, DragEvent, FormEvent, ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_AD_TEXT_LENGTH } from "@/lib/validator";

type InputFormProps = {
  adCreative: string;
  landingPageUrl: string;
  uploading: boolean;
  running: boolean;
  hasUploadedImage: boolean;
  onAdCreativeChange: (value: string) => void;
  onLandingPageUrlChange: (value: string) => void;
  onFileSelect: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUseExample: () => void;
};

const focusAreas = [
  { title: "Message match", description: "Headline mirrors the ad promise" },
  { title: "CRO enhancements", description: "Clearer value, less friction" },
  { title: "Tone & persona fit", description: "Ad voice carried into the copy" },
  { title: "CTA optimization", description: "Action-oriented, intent-matched" }
] as const;

function Step({
  number,
  title,
  hint,
  children
}: {
  number: number;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/15 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
            {number}
          </span>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        {hint}
      </div>
      {children}
    </section>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function InputForm({
  adCreative,
  landingPageUrl,
  uploading,
  running,
  hasUploadedImage,
  onAdCreativeChange,
  onLandingPageUrlChange,
  onFileSelect,
  onSubmit,
  onUseExample
}: InputFormProps) {
  const [creativeMode, setCreativeMode] = useState<"text" | "image">("text");
  const [dragging, setDragging] = useState(false);

  // Only the active input mode is submitted, so clear the other one when switching.
  function switchMode(mode: "text" | "image") {
    if (mode === creativeMode) {
      return;
    }

    if (mode === "image") {
      onAdCreativeChange("");
    } else {
      onFileSelect(null);
    }
    setCreativeMode(mode);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  }

  const tabs = [
    { id: "text", label: "Paste text / URL" },
    { id: "image", label: "Upload image" }
  ] as const;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-7">
      <Step
        number={1}
        title="Ad creative"
        hint={
          <button
            type="button"
            onClick={() => {
              setCreativeMode("text");
              onUseExample();
            }}
            className="text-xs font-medium text-indigo-300 underline-offset-4 hover:text-indigo-200 hover:underline"
          >
            Try an example
          </button>
        }
      >
        <div
          role="tablist"
          aria-label="Ad creative input"
          className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-950/50 p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={creativeMode === tab.id}
              onClick={() => switchMode(tab.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                creativeMode === tab.id
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {creativeMode === "text" ? (
          <div className="space-y-2">
            <Textarea
              value={adCreative}
              onChange={(event) => onAdCreativeChange(event.target.value)}
              placeholder="Paste your ad copy, Google Ads headline, Facebook ad text, or a direct image URL. E.g. 'Turn more clicks into demo requests with landing pages that match each campaign.'"
              maxLength={MAX_AD_TEXT_LENGTH}
              className="min-h-32 resize-y text-base leading-7"
            />
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>Plain ad copy, or a direct image URL (.png, .jpg, .gif, .webp).</span>
              <span className="tabular-nums">
                {adCreative.length}/{MAX_AD_TEXT_LENGTH}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition focus-within:ring-2 focus-within:ring-indigo-400/40",
                dragging || hasUploadedImage
                  ? "border-indigo-400 bg-indigo-400/10"
                  : "border-slate-700 bg-slate-950/40 hover:border-slate-500"
              )}
            >
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
              <span className="text-sm font-semibold text-white">
                {uploading
                  ? "Reading image..."
                  : hasUploadedImage
                    ? "Image ready for analysis ✓"
                    : "Drop your ad image here, or click to browse"}
              </span>
              <span className="text-xs text-slate-400">
                {hasUploadedImage
                  ? "Click to replace it."
                  : "PNG, JPG, GIF or WEBP. Large images are compressed automatically."}
              </span>
            </label>
            {hasUploadedImage ? (
              <button
                type="button"
                onClick={() => onFileSelect(null)}
                className="text-xs text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
              >
                Remove image
              </button>
            ) : null}
          </div>
        )}
      </Step>

      <Step number={2} title="Landing page URL">
        <div className="space-y-2">
          <Input
            type="url"
            inputMode="url"
            autoComplete="url"
            value={landingPageUrl}
            onChange={(event) => onLandingPageUrlChange(event.target.value)}
            placeholder="https://yoursite.com/landing-page"
            className="h-12 text-base"
          />
          <p className="text-xs text-slate-500">
            We fetch the live page and enhance its hero copy rather than replace it.
          </p>
        </div>
      </Step>

      <Step number={3} title="What we optimize">
        <ul className="grid gap-2 sm:grid-cols-2">
          {focusAreas.map((area) => (
            <li
              key={area.title}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">{area.title}</p>
                <p className="text-xs text-slate-400">{area.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Step>

      <Button type="submit" size="lg" disabled={running || uploading} className="w-full gap-2 text-base">
        {running ? (
          <>
            <Spinner /> Personalizing...
          </>
        ) : (
          <>
            Personalize landing page <span aria-hidden="true">→</span>
          </>
        )}
      </Button>

      <p className="text-center text-xs text-slate-500">
        If a live scrape isn&apos;t possible we&apos;ll tell you instead of guessing. Your page structure is never
        changed.
      </p>
    </form>
  );
}
