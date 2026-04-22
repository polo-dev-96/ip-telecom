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
        "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
        "hover:bg-white/[0.08]",
        collapsed && "justify-center",
        isActive
          ? "text-white bg-white/[0.12] shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
          : "text-white/70 hover:text-white"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      )}

      {/* Icon */}
      <span
        className={cn(
          "relative shrink-0 transition-colors duration-200",
          isActive
            ? "text-blue-400"
            : highlight
            ? "text-amber-400"
            : "text-white/60 group-hover:text-white/90"
        )}
      >
        {icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span className="relative truncate">
          {label}
          {highlight && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/25">
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
