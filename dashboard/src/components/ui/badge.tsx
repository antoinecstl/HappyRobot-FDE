import { cn } from "@/lib/utils";

const OUTCOME_STYLES: Record<string, string> = {
  booked: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  transferred: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  price_rejected: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  no_load_found: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  carrier_ineligible: "bg-red-500/10 text-red-400 border-red-500/20",
  hung_up: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  negative: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface BadgeProps {
  variant: "outcome" | "sentiment";
  value: string;
  className?: string;
}

export function Badge({ variant, value, className }: BadgeProps) {
  const styles =
    variant === "outcome" ? OUTCOME_STYLES : SENTIMENT_STYLES;
  const label = value.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[value] || "bg-slate-500/10 text-slate-400 border-slate-500/20",
        className
      )}
    >
      {label}
    </span>
  );
}
