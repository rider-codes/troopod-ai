"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChangeLogItem } from "@/types";

type ChangeLogProps = {
  changes: ChangeLogItem[];
  reasoning: string;
};

export function ChangeLog({ changes, reasoning }: ChangeLogProps) {
  const [activeTab, setActiveTab] = useState<"changes" | "reasoning">("changes");

  return (
    <Card className="rounded-[30px] p-6">
      <CardContent className="p-0">
        <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant={activeTab === "changes" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("changes")}
        >
          Changes Made
        </Button>
        <Button
          variant={activeTab === "reasoning" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("reasoning")}
        >
          AI Reasoning
        </Button>
      </div>

      {activeTab === "changes" ? (
        <div className="grid gap-3">
          {changes.length ? (
            changes.map((change, index) => (
              <div key={`${change.section}-${index}`} className="rounded-[22px] bg-[#141a2d] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default" className="tracking-[0.12em] normal-case">
                    {change.section}
                  </Badge>
                  <Badge variant="secondary" className="tracking-[0.12em] normal-case">
                    {change.type}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{change.reason}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] bg-[#141a2d] p-4 text-sm text-slate-300">
              No structural copy changes were applied in fallback mode.
            </div>
          )}
        </div>
      ) : (
        <div className={cn("rounded-[22px] bg-[#141a2d] p-4 text-sm leading-7 text-slate-300")}>
          {reasoning || "No reasoning was returned."}
        </div>
      )}
      </CardContent>
    </Card>
  );
}
