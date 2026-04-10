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
        "relative flex flex-col border-r border-white/[0.15] bg-[#1E3E88] text-white transition-all duration-300 ease-out shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-purple-500/[0.02] pointer-events-none" />

      {/* Logo section with premium styling */}
      <div
        className={cn(
          "relative flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]",
          collapsed && "justify-center px-3"
        )}
      >
        <div className="relative">
          <img
            src="/Icone_Logo.png"
            alt="Logo"
            className="w-9 h-9 rounded-xl shrink-0 object-contain shadow-lg shadow-primary/10"
          />
          {/* Status indicator pulse */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1E3E88] animate-pulse-soft" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm tracking-tight truncate text-white">IP Telecom</span>
            <span className="text-[10px] text-white/70 uppercase tracking-wider">Analytics</span>
          </div>
        )}
      </div>

      {/* Navigation with enhanced styling */}
      <nav className="relative flex-1 py-6 px-3 space-y-1">
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

      {/* Footer tag with premium card */}
      {!collapsed && (
        <div className="px-4 py-4 mx-4 mb-4">
          <div className="relative overflow-hidden rounded-lg border border-white/[0.15] bg-white/[0.08] p-3">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative flex items-center gap-2">
              <Zap size={14} className="text-amber-300" />
              <p className="text-[10px] text-white leading-tight font-medium">
                Dados atualizados em tempo real
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle - premium button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-7 h-7 rounded-full border border-white/30 bg-[#16537e] text-white shadow-lg hover:bg-[#1a6491] hover:border-white/50 hover:scale-110 transition-all duration-200"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
