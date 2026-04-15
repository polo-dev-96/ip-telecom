import { NavLink } from "@/components/layout/NavLink";
import {
  LayoutDashboard,
  CheckCircle2,
  Radio,
  Users,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Visão Geral", icon: LayoutDashboard },
  { path: "/atendimentos", label: "Atendimentos", icon: CheckCircle2 },
  { path: "/canais", label: "Canais", icon: Radio },
  { path: "/agentes", label: "Agentes", icon: Users },
  { path: "/acompanhamento", label: "Acompanhamento", icon: Activity, highlight: true },
  { path: "/ramais", label: "Monitorar Ramais", icon: Phone },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-white/10 bg-[#0f1b3d] text-white transition-all duration-300 ease-out shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo section */}
      <div
        className={cn(
          "relative flex items-center gap-3 px-4 py-5 border-b border-white/[0.08]",
          collapsed && "justify-center px-3"
        )}
      >
        <div className="relative">
          <img
            src="/Icone_Logo.png"
            alt="Logo"
            className="w-8 h-8 rounded-lg shrink-0 object-contain"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0f1b3d]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight truncate text-white">IP Telecom</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-medium">Analytics</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 py-4 px-2.5 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon, highlight }) => (
          <NavLink
            key={path}
            to={path}
            collapsed={collapsed}
            icon={<Icon size={18} />}
            label={label}
            highlight={highlight}
          />
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 pb-4">
          <div className="rounded-lg bg-white/[0.06] border border-white/[0.08] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-amber-400 shrink-0" />
              <p className="text-[10px] text-white/60 leading-tight font-medium">
                Dados em tempo real
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full border border-white/20 bg-[#0f1b3d] text-white/70 shadow-md hover:text-white hover:border-white/40 transition-all duration-200"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
