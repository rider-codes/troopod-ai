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

const cardStyle = "bg-slate-900 text-slate-100 border border-slate-700 rounded-xl";

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
    <Card className={cn(cardStyle)}>
      <CardHeader className="mb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[1.75rem]">
          {title}
        </CardTitle>
        {highlight ? (
          <Badge className="bg-slate-800 text-slate-300 border border-slate-600">Personalized</Badge>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-4">
        {sections.map((section) => (
          <div
            key={section}
            className="rounded-xl border border-slate-800 bg-slate-800/50 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {labelize(section)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-8 text-slate-200">
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
