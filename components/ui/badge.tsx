import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-indigo-400/10 text-indigo-200 border border-indigo-400/20",
  secondary: "bg-slate-800/70 text-slate-300 border border-slate-700",
  outline: "border border-white/10 bg-transparent text-slate-400"
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
