export type Tone =
  | "professional"
  | "playful"
  | "urgent"
  | "aspirational"
  | "friendly"
  | "";

export type ConversionLift = "low" | "medium" | "high";

export type AdAnalysis = {
  tone: Tone;
  audience: string;
  value_prop: string;
  cta_intent: string;
};

export type PageContent = {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  badge: string;
  testimonial: string;
  source: "firecrawl" | "puppeteer" | "mock";
  page_url?: string;
};

export type PersonalizedContent = {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  badge: string;
  testimonial: string;
};

export type ScoreSummary = {
  message_match_before: number;
  message_match_after: number;
  cro_score: number;
  estimated_conversion_lift: ConversionLift;
};

export type ChangeLogItem = {
  section: "headline" | "subheadline" | "body" | "cta" | "badge" | "testimonial";
  type: "CRO" | "tone" | "clarity" | "urgency" | "relevance";
  reason: string;
};

export type PersonalizationResult = {
  personalized_content: PersonalizedContent;
  scores: ScoreSummary;
  changes_made: ChangeLogItem[];
  ai_reasoning: string;
  page_content?: PageContent;
  ad_analysis?: AdAnalysis;
};

export type ApiError = {
  error: string;
  details?: string;
};
