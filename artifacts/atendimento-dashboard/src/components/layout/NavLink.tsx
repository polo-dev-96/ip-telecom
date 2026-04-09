import { useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface NavLinkProps {
  to: string;
  label: string;
  icon: ReactNode;
  collapsed?: boolean;
  highlight?: boolean;
}

export function NavLink({ to, label, icon, collapsed, highlight }: NavLinkProps) {
  const [isActive] = useRoute(to === "/" ? "/" : `${to}*`);

  const inner = (
    <Link
      to={to}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        "hover:bg-white/[0.06] hover:text-foreground",
        collapsed ? "justify-center" : "",
        isActive
          ? "text-foreground"
          : "text-muted-foreground/70 hover:text-foreground"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_hsl(var(--primary))]" />
      )}

      {/* Background glow for active/highlight */}
      {(isActive || highlight) && (
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Icon with enhanced styling */}
      <span
        className={cn(
          "relative shrink-0 transition-all duration-200",
          isActive
            ? "text-primary"
            : highlight
            ? "text-amber-400"
            : "text-muted-foreground/60 group-hover:text-foreground"
        )}
      >
        {icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span className="relative truncate">
          {label}
          {highlight && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              LIVE
            </span>
          )}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="bg-popover/95 backdrop-blur-sm border-white/10"
        >
          <span className="flex items-center gap-2">
            {label}
            {highlight && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                LIVE
              </span>
            )}
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}
