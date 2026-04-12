import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScoreSummary } from "@/types";

type ScoreCardProps = {
  scores: ScoreSummary;
};

const items = [
  {
    key: "message_match_before",
    label: "Message Match Before"
  },
  {
    key: "message_match_after",
    label: "Message Match After"
  },
  {
    key: "cro_score",
    label: "CRO Score"
  }
] as const;

export function ScoreCard({ scores }: ScoreCardProps) {
  return (
    <Card className="rounded-[30px] p-6">
      <CardContent className="grid gap-4 p-0 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className="rounded-[22px] bg-[#141a2d] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {scores[item.key]}
            <span className="ml-1 text-base text-slate-400">/100</span>
          </p>
        </div>
      ))}

      <div className={cn("rounded-[22px] bg-accent p-5", "text-[#3b356d]")}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c4bcff]">
          Estimated Conversion Lift
        </p>
        <p className="mt-3 text-2xl font-semibold capitalize text-[#f7f4ff]">
          {scores.estimated_conversion_lift}
        </p>
      </div>
      </CardContent>
    </Card>
  );
}
