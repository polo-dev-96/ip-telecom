import React from "react";
import { NavLink } from "@/components/layout/NavLink";
import {
  LayoutDashboard,
  CheckCircle2,
  Radio,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
  Zap,
  Phone,
  PhoneCall,
  MessageCircle,
  BarChart2,
  MonitorPlay,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const CHAT_ITEMS = [
  { path: "/", label: "Visão Geral - Chat", icon: LayoutDashboard },
  { path: "/atendimentos", label: "Atendimentos", icon: CheckCircle2 },
  { path: "/canais", label: "Canais", icon: Radio },
  { path: "/agentes", label: "Agentes", icon: Users },
  { path: "/acompanhamento", label: "Acompanhamento", icon: Activity, highlight: true },
];

const TELEFONIA_ITEMS = [
  { path: "/telefonia", label: "Visão Geral - Telefonia", icon: BarChart2 },
  { path: "/chamadas", label: "Chamadas", icon: PhoneCall },
  { path: "/agentes-telefonia", label: "Agentes", icon: Users },
  { path: "/ramais", label: "Monitorar Ramais", icon: Phone },
];

const BOTTOM_ITEMS = [
  { path: "/monitoramento-geral", label: "Monitoramento Geral", icon: MonitorPlay, highlight: true },
];

// Top items (empty now - moved into groups above)

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [telefoniaOpen, setTelefoniaOpen] = useState(false);
  const { user } = useAuth();

  function canSee(path: string) {
    return user?.role === "admin" || user?.permissions?.includes(path);
  }

  const visibleChat = CHAT_ITEMS.filter((i) => canSee(i.path));
  const visibleTelefonia = TELEFONIA_ITEMS.filter((i) => canSee(i.path));
  const visibleBottom = BOTTOM_ITEMS.filter((i) => canSee(i.path));

  function SidebarGroup({
    label,
    icon: Icon,
    open,
    onToggle,
    children,
  }: {
    label: string;
    icon: React.ElementType;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) {
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={() => !collapsed && onToggle()}
          className={cn(
            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.07] transition-all duration-150 select-none",
            collapsed && "justify-center"
          )}
        >
          <Icon size={16} className="shrink-0 text-white/50" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-widest truncate">
                {label}
              </span>
              <ChevronDown
                size={13}
                className={cn(
                  "shrink-0 transition-transform duration-200 text-white/40",
                  !open && "-rotate-90"
                )}
              />
            </>
          )}
        </button>
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            open || collapsed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className={cn("space-y-0.5 mt-0.5", !collapsed && "pl-2")}>
            {children}
          </div>
        </div>
      </div>
    );
  }

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
      <nav className="relative flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
        {/* Chat group */}
        {visibleChat.length > 0 && (
          <SidebarGroup
            label="Chat"
            icon={MessageCircle}
            open={chatOpen}
            onToggle={() => setChatOpen((o) => !o)}
          >
            {visibleChat.map(({ path, label, icon: Icon, highlight }) => (
              <NavLink
                key={path}
                to={path}
                collapsed={collapsed}
                icon={<Icon size={18} />}
                label={label}
                highlight={highlight}
              />
            ))}
          </SidebarGroup>
        )}

        {/* Telefonia group */}
        {visibleTelefonia.length > 0 && (
          <SidebarGroup
            label="Telefonia"
            icon={Phone}
            open={telefoniaOpen}
            onToggle={() => setTelefoniaOpen((o) => !o)}
          >
            {visibleTelefonia.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                collapsed={collapsed}
                icon={<Icon size={18} />}
                label={label}
              />
            ))}
          </SidebarGroup>
        )}

        {/* Divider */}
        {!collapsed && visibleBottom.length > 0 && <div className="my-3 border-t border-white/[0.08]" />}

        {/* Bottom standalone items */}
        {visibleBottom.map(({ path, label, icon: Icon, highlight }) => (
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
