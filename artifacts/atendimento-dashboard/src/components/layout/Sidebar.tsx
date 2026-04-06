import { NavLink } from "@/components/layout/NavLink";
import {
  LayoutDashboard,
  CheckCircle2,
  Radio,
  Users,
  Bot,
  Star,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Visão Geral", icon: LayoutDashboard },
  { path: "/atendimentos", label: "Atendimentos", icon: CheckCircle2 },
  { path: "/canais", label: "Canais", icon: Radio },
  { path: "/agentes", label: "Agentes", icon: Users },
  { path: "/automacao", label: "Automação", icon: Bot },
  { path: "/qualidade", label: "Qualidade", icon: Star },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
          <BarChart3 size={16} />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm truncate">Atendimento Analytics</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} collapsed={collapsed} icon={<Icon size={18} />} label={label} />
        ))}
      </nav>

      {/* Footer tag */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">Apenas atendimentos finalizados</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 z-10 flex items-center justify-center w-6 h-6 rounded-full border bg-background text-foreground shadow-sm hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
