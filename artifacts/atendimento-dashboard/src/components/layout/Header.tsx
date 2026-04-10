import { Moon, Sun, SlidersHorizontal, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { FilterBar } from "@/components/dashboard/FilterBar";
import type { DashboardState } from "@/hooks/useDashboard";
import { useState } from "react";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface HeaderProps {
  dashboard: DashboardState;
}

const HIDE_FILTERS_ROUTES = ["/acompanhamento"];

export function Header({ dashboard }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const showFilters = !HIDE_FILTERS_ROUTES.includes(location);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 h-16 px-5 border-b border-white/[0.15] bg-[#16537e] text-white">
      <div className="flex-1 flex items-center gap-4 min-w-0">
        {/* Page indicator */}
        <div className="hidden lg:flex items-center gap-2">
          <Sparkles size={14} className="text-white/80" />
          <span className="text-xs text-white/70 uppercase tracking-wider">
            Dashboard
          </span>
        </div>

        {/* Quick filters visible on large screens */}
        {showFilters && (
          <div className="hidden xl:flex items-center gap-2 flex-wrap [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button:hover]:bg-white/20">
            <FilterBar dashboard={dashboard} compact />
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
              className="xl:hidden gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <SlidersHorizontal size={14} />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-xl border-border/50 dark:bg-[#0B0F1A]/95 dark:border-white/[0.06]">
            <SheetHeader>
              <SheetTitle className="text-foreground">Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterBar dashboard={dashboard} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell with indicator */}
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0 text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="shrink-0 text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>
    </header>
  );
}
