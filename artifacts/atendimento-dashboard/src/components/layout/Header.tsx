import { Moon, Sun, SlidersHorizontal, Sparkles, Settings, LogOut, ChevronDown, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { FilterBar } from "@/components/dashboard/FilterBar";
import type { DashboardState } from "@/hooks/useDashboard";
import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  dashboard: DashboardState;
}

const HIDE_FILTERS_ROUTES = ["/acompanhamento", "/ramais", "/usuarios", "/monitoramento-geral"];
const TELEFONIA_ROUTES = ["/telefonia", "/chamadas", "/agentes-telefonia"];

export function Header({ dashboard }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const showFilters = !HIDE_FILTERS_ROUTES.includes(location);
  const isTelefonia = TELEFONIA_ROUTES.some((r) => location.startsWith(r));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 border-b bg-card/80 backdrop-blur-md border-border/60 dark:border-white/[0.06] shadow-sm">
      <div className="flex-1 flex items-center gap-4 min-w-0">
        {/* Page indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 dark:bg-primary/10">
          <Sparkles size={13} className="text-primary" />
          <span className="text-xs text-primary/80 font-semibold uppercase tracking-wider">
            Dashboard
          </span>
        </div>

        {/* Quick filters visible on large screens */}
        {showFilters && (
          <div className="hidden xl:flex items-center gap-2 flex-wrap">
            <FilterBar dashboard={dashboard} compact hideChanQueue={isTelefonia} />
          </div>
        )}
      </div>

      {/* Mobile filters sheet */}
      {showFilters && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="xl:hidden gap-2 text-xs"
            >
              <SlidersHorizontal size={14} />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="text-foreground">Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterBar dashboard={dashboard} hideChanQueue={isTelefonia} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-200"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
        </Button>

        {/* User menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-lg transition-all duration-200",
                "hover:bg-accent hover:shadow-sm border border-transparent",
                menuOpen && "bg-accent border-border/60 shadow-inner"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                user.role === "admin"
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                  : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
              )}>
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-xs font-semibold text-foreground max-w-[100px] truncate">{user.name}</span>
                <span className="text-[9px] text-muted-foreground capitalize">{user.role === "admin" ? "Administrador" : "Usuário"}</span>
              </div>
              <ChevronDown size={12} className={cn("text-muted-foreground transition-transform duration-200 hidden sm:block", menuOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl shadow-black/10 dark:shadow-black/30 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User info */}
                <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0",
                      user.role === "admin"
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                        : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                    )}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <ShieldCheck size={9} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <User size={9} /> Usuário
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin settings */}
                {user.role === "admin" && (
                  <Link
                    to="/usuarios"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    <Settings size={14} className="text-muted-foreground" />
                    Gerenciar Usuários
                  </Link>
                )}

                {/* Logout */}
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
