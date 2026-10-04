import { z } from "zod";
import { getUrlError } from "@/lib/url-safety";

export const MAX_AD_TEXT_LENGTH = 3000;
// ~4MB of decoded image data once base64-encoded.
const MAX_IMAGE_BASE64_LENGTH = 5_600_000;

const publicUrlSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const message = getUrlError(value);
    if (message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });

/** Turns thrown errors (notably Zod validation errors) into a short, user-facing message. */
export function toUserMessage(error: unknown, fallback = "Unknown error") {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join(" ");
  }

  return error instanceof Error ? error.message : fallback;
}

const toneSchema = z.union([
  z.literal("professional"),
  z.literal("playful"),
  z.literal("urgent"),
  z.literal("aspirational"),
  z.literal("friendly"),
  z.literal("")
]);

const sanitizedString = z
  .string()
  .transform((value) => value.trim())
  .catch("");

const scoreSchema = z
  .number()
  .min(0)
  .max(100)
  .transform((value) => Math.round(value));

export const analyzeRequestSchema = z
  .object({
    ad_creative: z
      .string()
      .trim()
      .max(MAX_AD_TEXT_LENGTH, `Ad text must be ${MAX_AD_TEXT_LENGTH} characters or fewer.`)
      .optional()
      .default(""),
    ad_image_url: publicUrlSchema.optional(),
    ad_image_base64: z
      .string()
      .max(MAX_IMAGE_BASE64_LENGTH, "Image is too large. Please upload a smaller image.")
      .optional(),
    ad_mime_type: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.ad_creative && !value.ad_image_url && !value.ad_image_base64) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide ad text, an image upload, or a direct image URL."
      });
    }
  });

export const adAnalysisSchema = z.object({
  tone: toneSchema,
  audience: sanitizedString,
  value_prop: sanitizedString,
  cta_intent: sanitizedString
});

export const pageContentSchema = z.object({
  headline: sanitizedString,
  subheadline: sanitizedString,
  body: sanitizedString,
  cta: sanitizedString,
  badge: sanitizedString,
  testimonial: sanitizedString,
  source: z.union([
    z.literal("firecrawl"),
    z.literal("puppeteer"),
    z.literal("fetch"),
    z.literal("fallback")
  ]),
  page_url: z.string().url().optional()
});

const changeLogSchema = z.object({
  section: z.union([
    z.literal("headline"),
    z.literal("subheadline"),
    z.literal("body"),
    z.literal("cta"),
    z.literal("badge"),
    z.literal("testimonial")
  ]),
  type: z.union([
    z.literal("CRO"),
    z.literal("tone"),
    z.literal("clarity"),
    z.literal("urgency"),
    z.literal("relevance")
  ]),
  reason: sanitizedString
});

const personalizedContentSchema = z.object({
  headline: sanitizedString,
  subheadline: sanitizedString,
  body: sanitizedString,
  cta: sanitizedString,
  badge: sanitizedString,
  testimonial: sanitizedString
});

export const personalizeResponseSchema = z.object({
  personalized_content: personalizedContentSchema,
  scores: z.object({
    message_match_before: scoreSchema,
    message_match_after: scoreSchema,
    cro_score: scoreSchema,
    estimated_conversion_lift: z.union([
      z.literal("low"),
      z.literal("medium"),
      z.literal("high")
    ])
  }),
  changes_made: z.array(changeLogSchema).catch([]),
  ai_reasoning: sanitizedString
});

export const personalizeRequestSchema = z
  .object({
    ad_context: adAnalysisSchema,
    page_content: pageContentSchema.optional(),
    page_url: publicUrlSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (!value.page_content && !value.page_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide page_content or page_url."
      });
    }
  });

export function safeTruncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}
