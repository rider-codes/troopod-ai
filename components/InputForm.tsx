"use client";

import { ChangeEvent, FormEvent, ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type InputFormProps = {
  adCreative: string;
  landingPageUrl: string;
  uploading: boolean;
  hasUploadedImage: boolean;
  onAdCreativeChange: (value: string) => void;
  onLandingPageUrlChange: (value: string) => void;
  onFileSelect: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const focusCards = [
  {
    title: "Message match",
    description: "Align headline and hero with ad promise",
    active: true
  },
  {
    title: "CRO enhancements",
    description: "Urgency, social proof, friction reduction",
    active: true
  },
  {
    title: "Tone & persona fit",
    description: "Match ad voice to page copy",
    active: true
  },
  {
    title: "CTA optimization",
    description: "Stronger calls to action placement",
    active: false
  }
] as const;

function Step({
  number,
  title,
  children
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      <div className="flex pt-10">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.02] text-sm font-semibold text-[#d8d2ca]">
          {number}
        </span>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function InputForm({
  adCreative,
  landingPageUrl,
  uploading,
  hasUploadedImage,
  onAdCreativeChange,
  onLandingPageUrlChange,
  onFileSelect,
  onSubmit
}: InputFormProps) {
  const [creativeMode, setCreativeMode] = useState<"text" | "image">("text");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
    event.target.value = "";
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <Step number={1} title="Ad creative">
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <Button
            variant={creativeMode === "text" ? "outline" : "ghost"}
            className={cn(
              "rounded-xl border-0 px-5",
              creativeMode === "text" && "bg-[#2d2a26] text-ink hover:bg-[#2d2a26]"
            )}
            onClick={() => setCreativeMode("text")}
          >
            Paste text / URL
          </Button>
          <Button
            variant={creativeMode === "image" ? "outline" : "ghost"}
            className={cn(
              "rounded-xl border-0 px-5",
              creativeMode === "image" && "bg-[#2d2a26] text-ink hover:bg-[#2d2a26]"
            )}
            onClick={() => setCreativeMode("image")}
          >
            Upload image
          </Button>
        </div>

        {creativeMode === "text" ? (
          <div className="space-y-3">
            <Textarea
              value={adCreative}
              onChange={(event) => onAdCreativeChange(event.target.value)}
              placeholder="Paste your ad copy, Google Ads headline, Facebook ad text, or a direct image URL.&#10;E.g. 'Turn more clicks into demo requests with landing pages that match each campaign.'"
              className="min-h-36 text-lg leading-8"
            />
            <p className="text-sm text-[#9f988f]">
              Paste plain ad copy or a direct image URL ending in `.png`, `.jpg`, `.jpeg`, `.gif`, or `.webp`.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white transition-all duration-200 ease-in-out hover:border-slate-500 group-focus-within:border-blue-500 group-focus-within:ring-2 group-focus-within:ring-blue-500">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <span className="text-lg font-semibold text-white">
                {uploading
                  ? "Reading image..."
                  : hasUploadedImage
                    ? "Image ready for analysis"
                    : "Upload your ad creative image"}
              </span>
              <span className="text-sm text-[#9f988f]">
                PNG, JPG, GIF, and WEBP work best for the current flow.
              </span>
            </label>
            <p className="text-sm text-[#9f988f]">
              Use this when the ad meaning is mostly visual and not just headline copy.
            </p>
          </div>
        )}
      </Step>

      <Step number={2} title="Landing page URL">
        <div className="space-y-3">
          <Input
            value={landingPageUrl}
            onChange={(event) => onLandingPageUrlChange(event.target.value)}
            placeholder="https://yoursite.com/landing-page"
            className="h-14 text-lg"
          />
          <p className="text-sm text-[#9f988f]">
            The AI will fetch and analyze your existing page, then enhance it rather than replace it.
          </p>
        </div>
      </Step>

      <Step number={3} title="Optimization focus">
        <div className="grid gap-3 sm:grid-cols-2">
          {focusCards.map((card) => (
            <Card
              key={card.title}
              className={cn(
                "rounded-2xl px-5 py-4 shadow-none",
                card.active
                  ? "border-primary/70 bg-accent text-[#36306b]"
                  : "border-white/10 bg-[#201d1a] text-ink"
              )}
            >
              <p className="text-lg font-semibold">{card.title}</p>
              <p className={`mt-1 text-sm ${card.active ? "text-[#8d8873]" : "text-[#beb7af]"}`}>
                {card.description}
              </p>
            </Card>
          ))}
        </div>
      </Step>

      <Button type="submit" variant="outline" size="lg" className="text-lg">
        Personalize landing page <span className="ml-2 text-xl">-&gt;</span>
      </Button>

      <Card className="rounded-2xl bg-white/[0.04] shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline">Assumptions</Badge>
            <CardTitle className="text-base">How this demo behaves</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-6 text-[#9d968d]">
            This demo simulates page fetching when a live scrape is unavailable, keeps your existing
            page structure intact, and can use uploaded ad images for visual analysis.
          </CardDescription>
        </CardContent>
      </Card>
    </form>
  );
}
