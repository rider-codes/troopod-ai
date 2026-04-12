import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageContent, PersonalizedContent } from "@/types";

type OutputPreviewProps = {
  original: PageContent;
  personalized: PersonalizedContent;
};

const sections: Array<keyof PersonalizedContent> = [
  "headline",
  "subheadline",
  "body",
  "cta",
  "badge",
  "testimonial"
];

function labelize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ContentColumn({
  title,
  content,
  highlight
}: {
  title: string;
  content: Record<string, string>;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "rounded-[30px]",
        highlight ? "border-primary/30 bg-accent/95" : "bg-white/[0.03]"
      )}
    >
      <CardHeader className="mb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className={cn("text-[1.75rem]", highlight ? "text-[#f7f4ff]" : "text-ink")}>
          {title}
        </CardTitle>
        {highlight ? (
          <Badge className="bg-[#e9e4ff] text-[#bdb5ff]">Personalized</Badge>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-4">
        {sections.map((section) => (
          <div
            key={section}
            className={cn(
              "rounded-[22px] p-4 ring-1",
              highlight ? "bg-[#5a6078] ring-white/10" : "bg-[#141a2d] ring-white/5"
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.18em]",
                highlight ? "text-[#98a0be]" : "text-slate-500"
              )}
            >
              {labelize(section)}
            </p>
            <p
              className={cn(
                "mt-2 whitespace-pre-wrap text-sm leading-8",
                highlight ? "text-[#f7f4ff]" : "text-slate-100"
              )}
            >
              {content[section] || "--"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OutputPreview({ original, personalized }: OutputPreviewProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ContentColumn
        title="Original Page Copy"
        content={{
          headline: original.headline,
          subheadline: original.subheadline,
          body: original.body,
          cta: original.cta,
          badge: original.badge,
          testimonial: original.testimonial
        }}
      />

      <ContentColumn
        title="Personalized Copy"
        highlight
        content={{
          headline: personalized.headline,
          subheadline: personalized.subheadline,
          body: personalized.body,
          cta: personalized.cta,
          badge: personalized.badge,
          testimonial: personalized.testimonial
        }}
      />
    </div>
  );
}
