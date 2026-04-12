import { z } from "zod";

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
    ad_creative: z.string().trim().optional().default(""),
    ad_image_url: z.string().url().optional(),
    ad_image_base64: z.string().optional(),
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
    z.literal("mock")
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
    page_url: z.string().url().optional()
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
