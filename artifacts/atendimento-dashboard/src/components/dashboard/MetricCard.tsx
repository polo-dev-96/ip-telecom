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
  color?: "default" | "green" | "red" | "blue" | "amber" | "purple";
  className?: string;
}

const COLOR_MAP = {
  default: "text-foreground",
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
  purple: "text-purple-600 dark:text-purple-400",
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
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle size={11} className="text-muted-foreground shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-56 text-xs">{tooltip}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className={cn("text-2xl font-bold tracking-tight", COLOR_MAP[color])}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
            {trend !== undefined && (
              <div className={cn("flex items-center gap-0.5 mt-1 text-xs font-medium",
                isPositive ? "text-emerald-600 dark:text-emerald-400" :
                isNegative ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}>
                {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
                <span>{trendLabel ?? `${Math.abs(trend).toFixed(1)}% vs período anterior`}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
