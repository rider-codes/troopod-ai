import { cn } from "@/lib/utils";
import { ScoreSummary } from "@/types";

type ScoreCardProps = {
  scores: ScoreSummary;
};

const liftStyles = {
  low: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  medium: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  high: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
} as const;

function Meter({ label, value, tone }: { label: string; value: number; tone: "muted" | "good" | "brand" }) {
  const bar = tone === "muted" ? "bg-slate-500" : tone === "good" ? "bg-emerald-400" : "bg-indigo-400";

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
        {value}
        <span className="ml-1 text-sm font-normal text-slate-500">/100</span>
      </p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-all duration-700", bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ScoreCard({ scores }: ScoreCardProps) {
  const delta = scores.message_match_after - scores.message_match_before;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Meter label="Message match · before" value={scores.message_match_before} tone="muted" />
      <div className="relative">
        <Meter label="Message match · after" value={scores.message_match_after} tone="good" />
        {delta !== 0 ? (
          <span
            className={cn(
              "absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              delta > 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        ) : null}
      </div>
      <Meter label="CRO score" value={scores.cro_score} tone="brand" />
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
        <p className="text-xs font-medium text-slate-400">Estimated conversion lift</p>
        <span
          className={cn(
            "mt-3 inline-flex rounded-full px-3 py-1 text-lg font-semibold capitalize ring-1",
            liftStyles[scores.estimated_conversion_lift]
          )}
        >
          {scores.estimated_conversion_lift}
        </span>
        <p className="mt-3 text-xs text-slate-500">AI estimate, not measured traffic.</p>
      </div>
    </div>
  );
}
