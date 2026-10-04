"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageContent, PersonalizedContent } from "@/types";

type OutputPreviewProps = {
  original: PageContent;
  personalized: PersonalizedContent;
};

type View = "before" | "after";

const fields: Array<{ key: keyof PersonalizedContent; label: string }> = [
  { key: "headline", label: "Headline" },
  { key: "subheadline", label: "Subheadline" },
  { key: "body", label: "Body" },
  { key: "cta", label: "CTA" },
  { key: "badge", label: "Badge" },
  { key: "testimonial", label: "Testimonial" }
];

function hostname(url?: string) {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "yoursite.com";
  } catch {
    return "yoursite.com";
  }
}

function HeroMock({
  content,
  view,
  url
}: {
  content: PersonalizedContent;
  view: View;
  url?: string;
}) {
  const after = view === "after";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-slate-950 transition-colors",
        after ? "border-indigo-400/40 shadow-lg shadow-indigo-500/10" : "border-white/10"
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="mx-auto max-w-[70%] truncate rounded-md bg-slate-800 px-3 py-0.5 text-xs text-slate-400">
          {hostname(url)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            after ? "bg-indigo-400/20 text-indigo-200" : "bg-slate-800 text-slate-400"
          )}
        >
          {after ? "Personalized" : "Original"}
        </span>
      </div>

      <div className="space-y-4 px-6 py-10 text-center sm:px-10">
        {content.badge ? (
          <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {content.badge}
          </span>
        ) : null}
        <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
          {content.headline || <span className="text-slate-600">No headline found</span>}
        </h3>
        {content.subheadline ? <p className="mx-auto max-w-prose text-base text-slate-300">{content.subheadline}</p> : null}
        {content.body && content.body !== content.subheadline ? (
          <p className="mx-auto max-w-prose text-sm leading-6 text-slate-400">{content.body}</p>
        ) : null}
        {content.cta ? (
          <span
            className={cn(
              "inline-block rounded-lg px-5 py-2.5 text-sm font-semibold",
              after ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-900"
            )}
          >
            {content.cta}
          </span>
        ) : null}
        {content.testimonial ? (
          <blockquote className="mx-auto max-w-prose border-t border-white/10 pt-4 text-xs italic text-slate-500">
            “{content.testimonial}”
          </blockquote>
        ) : null}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context); the copy is simply skipped.
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} aria-live="polite">
      {copied ? "Copied ✓" : "Copy new copy"}
    </Button>
  );
}

export function OutputPreview({ original, personalized }: OutputPreviewProps) {
  const [view, setView] = useState<View>("after");
  const originalContent: PersonalizedContent = {
    headline: original.headline,
    subheadline: original.subheadline,
    body: original.body,
    cta: original.cta,
    badge: original.badge,
    testimonial: original.testimonial
  };

  const copyText = fields
    .filter(({ key }) => personalized[key])
    .map(({ key, label }) => `${label}: ${personalized[key]}`)
    .join("\n\n");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Preview version" className="inline-flex rounded-xl border border-white/10 bg-slate-950/50 p-1">
          {(["before", "after"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={view === option}
              onClick={() => setView(option)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition",
                view === option ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <CopyButton text={copyText} />
      </div>

      <HeroMock
        content={view === "after" ? personalized : originalContent}
        view={view}
        url={original.page_url}
      />

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="hidden grid-cols-[7rem_1fr_1fr] bg-slate-950/60 px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-500 md:grid">
          <span>Field</span>
          <span>Original</span>
          <span className="text-indigo-300">Personalized</span>
        </div>
        {fields.map(({ key, label }) => {
          const before = originalContent[key];
          const after = personalized[key];
          const changed = before.trim() !== after.trim();

          return (
            <div
              key={key}
              className="grid gap-2 border-t border-white/10 px-4 py-3 text-sm md:grid-cols-[7rem_1fr_1fr] md:gap-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 md:block md:space-y-1">
                <span>{label}</span>
                {changed ? (
                  <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] text-emerald-300 md:block md:w-fit">
                    Changed
                  </span>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap text-slate-400">{before || "—"}</p>
              <p className={cn("whitespace-pre-wrap", changed ? "text-white" : "text-slate-400")}>{after || "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
