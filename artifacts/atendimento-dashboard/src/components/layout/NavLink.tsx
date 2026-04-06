import { useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface NavLinkProps {
  to: string;
  label: string;
  icon: ReactNode;
  collapsed?: boolean;
}

export function NavLink({ to, label, icon, collapsed }: NavLinkProps) {
  const [isActive] = useRoute(to === "/" ? "/" : `${to}*`);

  const inner = (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70"
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}
