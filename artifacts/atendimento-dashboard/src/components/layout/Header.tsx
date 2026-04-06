import { Moon, Sun, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { FilterBar } from "@/components/dashboard/FilterBar";
import type { DashboardState } from "@/hooks/useDashboard";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  dashboard: DashboardState;
}

export function Header({ dashboard }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 border-b bg-background/95 backdrop-blur">
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {/* Quick filters visible on large screens */}
        <div className="hidden xl:flex items-center gap-2 flex-wrap">
          <FilterBar dashboard={dashboard} compact />
        </div>
      </div>

      {/* Mobile filters sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="xl:hidden gap-2">
            <SlidersHorizontal size={14} />
            Filtros
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FilterBar dashboard={dashboard} />
          </div>
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="shrink-0"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </Button>
    </header>
  );
}
