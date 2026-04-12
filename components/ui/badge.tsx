import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary/12 text-primary border border-primary/20",
  secondary: "bg-[#151b2f] text-[#b8c2ff] border border-[#202946]",
  outline: "border border-white/10 bg-transparent text-[#b7b0a8]"
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
