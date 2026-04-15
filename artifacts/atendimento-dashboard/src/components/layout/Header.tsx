import { Moon, Sun, SlidersHorizontal, Sparkles } from "lucide-react";
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

const HIDE_FILTERS_ROUTES = ["/acompanhamento", "/ramais"];

export function Header({ dashboard }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const showFilters = !HIDE_FILTERS_ROUTES.includes(location);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 border-b bg-card border-border/60 dark:border-white/[0.06]">
      <div className="flex-1 flex items-center gap-4 min-w-0">
        {/* Page indicator */}
        <div className="hidden lg:flex items-center gap-2">
          <Sparkles size={13} className="text-primary" />
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Dashboard
          </span>
        </div>

        {/* Quick filters visible on large screens */}
        {showFilters && (
          <div className="hidden xl:flex items-center gap-2 flex-wrap">
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
              <FilterBar dashboard={dashboard} />
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
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </div>
    </header>
  );
}
