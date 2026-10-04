"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChangeLogItem } from "@/types";

type ChangeLogProps = {
  changes: ChangeLogItem[];
  reasoning: string;
};

export function ChangeLog({ changes, reasoning }: ChangeLogProps) {
  const [activeTab, setActiveTab] = useState<"changes" | "reasoning">("changes");

  const tabs = [
    { id: "changes", label: `Changes made (${changes.length})` },
    { id: "reasoning", label: "AI reasoning" }
  ] as const;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Explanation" className="inline-flex rounded-xl border border-white/10 bg-slate-950/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition",
              activeTab === tab.id ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "changes" ? (
        <ul className="grid gap-2">
          {changes.length ? (
            changes.map((change, index) => (
              <li key={`${change.section}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="capitalize tracking-normal">{change.section}</Badge>
                  <Badge variant="secondary" className="tracking-normal">
                    {change.type}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{change.reason}</p>
              </li>
            ))
          ) : (
            <li className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              No copy changes were applied. The original copy was kept.
            </li>
          )}
        </ul>
      ) : (
        <p className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-300">
          {reasoning || "No reasoning was returned."}
        </p>
      )}
    </div>
  );
}
