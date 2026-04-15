import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  color?: "default" | "success" | "danger" | "primary" | "warning" | "purple";
  className?: string;
  size?: "default" | "lg";
}

const COLOR_STYLES = {
  default: {
    value: "text-foreground",
    iconBg: "bg-slate-500/10 dark:bg-white/[0.06]",
    iconText: "text-slate-500 dark:text-white/60",
    border: "border-border/60 dark:border-white/[0.08]",
    accent: "bg-slate-500/5 dark:bg-white/[0.03]",
  },
  success: {
    value: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/60 dark:border-emerald-500/20",
    accent: "bg-emerald-500/5 dark:bg-emerald-500/5",
  },
  danger: {
    value: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10 dark:bg-red-500/15",
    iconText: "text-red-600 dark:text-red-400",
    border: "border-red-200/60 dark:border-red-500/20",
    accent: "bg-red-500/5 dark:bg-red-500/5",
  },
  primary: {
    value: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
    iconText: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200/60 dark:border-blue-500/20",
    accent: "bg-blue-500/5 dark:bg-blue-500/5",
  },
  warning: {
    value: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/60 dark:border-amber-500/20",
    accent: "bg-amber-500/5 dark:bg-amber-500/5",
  },
  purple: {
    value: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/15",
    iconText: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200/60 dark:border-purple-500/20",
    accent: "bg-purple-500/5 dark:bg-purple-500/5",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  tooltip,
  trend,
  trendLabel,
  icon,
  color = "default",
  className,
  size = "default",
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const styles = COLOR_STYLES[color];

  return (
    <div
      className={cn(
        "group relative flex-1 min-w-[200px] overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        styles.border,
        className
      )}
    >
      {/* Top accent line */}
      <div className={cn("absolute top-0 inset-x-0 h-[2px]", styles.accent)} />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title with tooltip */}
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase truncate">
                {title}
              </p>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle size={12} className="text-muted-foreground/50 shrink-0 cursor-help hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-60 text-xs"
                  >
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Main value */}
            <p
              className={cn(
                "font-extrabold tracking-tight number-display tabular-nums",
                size === "lg" ? "text-3xl" : "text-[28px] leading-tight",
                styles.value
              )}
            >
              {value}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {subtitle}
              </p>
            )}

            {/* Trend indicator */}
            {trend !== undefined && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide",
                  isPositive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : isNegative
                    ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isPositive ? (
                  <TrendingUp size={10} />
                ) : isNegative ? (
                  <TrendingDown size={10} />
                ) : (
                  <Minus size={10} />
                )}
                <span>{trendLabel ?? `${Math.abs(trend).toFixed(1)}%`}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div
              className={cn(
                "shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group-hover:scale-105",
                styles.iconBg,
                styles.iconText
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
