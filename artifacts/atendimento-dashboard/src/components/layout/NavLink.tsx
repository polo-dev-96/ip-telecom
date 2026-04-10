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
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
        "hover:bg-white/[0.12] hover:text-white",
        collapsed ? "justify-center" : "",
        isActive
          ? "text-white bg-white/[0.15] shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          : "text-white/95 hover:text-white"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
      )}

      {/* Icon with enhanced styling */}
      <span
        className={cn(
          "relative shrink-0 transition-all duration-200",
          isActive
            ? "text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
            : highlight
            ? "text-amber-300"
            : "text-white/90 group-hover:text-white"
        )}
      >
        {icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span className="relative truncate text-white font-bold tracking-wide">
          {label}
          {highlight && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/30 text-amber-200 border border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]">
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
          className="bg-[#1E3E88] border-white/30 text-white font-semibold"
        >
          <span className="flex items-center gap-2">
            {label}
            {highlight && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
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
