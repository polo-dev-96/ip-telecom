import { Card, CardContent } from "@/components/ui/card";
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
    text: "text-foreground",
    iconBg: "bg-white/5",
    iconText: "text-foreground/70",
    glow: "",
    gradient: "from-white/5 to-transparent",
  },
  success: {
    text: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    glow: "glow-success",
    gradient: "from-emerald-500/10 to-transparent",
  },
  danger: {
    text: "text-red-400",
    iconBg: "bg-red-500/10",
    iconText: "text-red-400",
    glow: "glow-danger",
    gradient: "from-red-500/10 to-transparent",
  },
  primary: {
    text: "text-blue-400",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-400",
    glow: "glow-primary",
    gradient: "from-blue-500/10 to-transparent",
  },
  warning: {
    text: "text-amber-400",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    glow: "glow-warning",
    gradient: "from-amber-500/10 to-transparent",
  },
  purple: {
    text: "text-purple-400",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-400",
    glow: "",
    gradient: "from-purple-500/10 to-transparent",
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
    <Card
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-white/[0.1]",
        styles.glow,
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", styles.gradient)} />

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full opacity-50" />

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title with tooltip */}
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-bold text-foreground tracking-wide uppercase truncate">
                {title}
              </p>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle size={12} className="text-foreground/60 shrink-0 cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-60 text-xs bg-popover/95 backdrop-blur-sm border-white/10"
                  >
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Main value */}
            <p
              className={cn(
                "font-bold tracking-tight number-display tabular-nums transition-all duration-300",
                size === "lg" ? "text-3xl" : "text-2xl",
                styles.text
              )}
            >
              {value}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-foreground/80 font-medium mt-1.5 truncate">
                {subtitle}
              </p>
            )}

            {/* Trend indicator */}
            {trend !== undefined && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide",
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : isNegative
                    ? "bg-red-500/10 text-red-400"
                    : "bg-white/5 text-muted-foreground"
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
                "shrink-0 flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 group-hover:scale-110",
                styles.iconBg,
                styles.iconText
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
