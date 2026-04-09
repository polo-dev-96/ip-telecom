import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, CalendarDays, X, Check, ChevronFirst, ChevronLast } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface PeriodFilterProps {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
}

type Shortcut = {
  label: string;
  icon?: string;
  getValue: () => { from: Date; to: Date };
};

const SHORTCUTS: Shortcut[] = [
  {
    label: "Hoje",
    getValue: () => ({ from: new Date(), to: new Date() }),
  },
  {
    label: "Ontem",
    getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }),
  },
  {
    label: "Esta semana",
    getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 0 }), to: endOfWeek(new Date(), { weekStartsOn: 0 }) }),
  },
  {
    label: "Semana passada",
    getValue: () => {
      const lastWeek = subDays(new Date(), 7);
      return { from: startOfWeek(lastWeek, { weekStartsOn: 0 }), to: endOfWeek(lastWeek, { weekStartsOn: 0 }) };
    },
  },
  {
    label: "Últimos 7 dias",
    getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "Últimos 30 dias",
    getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "Este mês",
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: "Mês passado",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  {
    label: "Este ano",
    getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
];

function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseISODate(date: string): Date | undefined {
  if (!date) return undefined;
  const parsed = new Date(date + "T00:00:00");
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export function PeriodFilter({ dateFrom, dateTo, onChange }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const initialFrom = parseISODate(dateFrom) || new Date();
  const initialTo = parseISODate(dateTo) || new Date();
  
  const [monthLeft, setMonthLeft] = useState(initialFrom);
  const [monthRight, setMonthRight] = useState(addMonths(initialFrom, 1));

  const [range, setRange] = useState<DateRange | undefined>({
    from: initialFrom,
    to: initialTo,
  });

  const displayText = useMemo(() => {
    if (dateFrom && dateTo) {
      const from = parseISODate(dateFrom);
      const to = parseISODate(dateTo);
      if (from && to) {
        if (format(from, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
          return format(from, "dd/MM/yyyy", { locale: ptBR });
        }
        return `${format(from, "dd/MM/yyyy", { locale: ptBR })} — ${format(to, "dd/MM/yyyy", { locale: ptBR })}`;
      }
    }
    return "Selecionar período";
  }, [dateFrom, dateTo]);

  const daysCount = useMemo(() => {
    if (range?.from && range?.to) {
      const diffTime = range.to.getTime() - range.from.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  }, [range]);

  const handleRangeSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    // Sync month views if range is set
    if (newRange?.from) {
      setMonthLeft(newRange.from);
      if (newRange.to) {
        const nextMonth = new Date(newRange.from);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setMonthRight(nextMonth);
      }
    }
  };

  const handleShortcut = (shortcut: Shortcut) => {
    const { from, to } = shortcut.getValue();
    setRange({ from, to });
    setMonthLeft(from);
    setMonthRight(addMonths(from, 1));
  };

  const handleApply = () => {
    if (range?.from && range?.to) {
      onChange(toISODate(range.from), toISODate(range.to));
      setOpen(false);
    }
  };

  const handleClear = () => {
    setRange(undefined);
  };

  const isSelected = (shortcut: Shortcut) => {
    const { from, to } = shortcut.getValue();
    return (
      range?.from &&
      range?.to &&
      format(from, "yyyy-MM-dd") === format(range.from, "yyyy-MM-dd") &&
      format(to, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-2 text-sm font-medium border-border/60 bg-background/50 hover:bg-accent",
            "dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:bg-white/[0.06]",
            !dateFrom && !dateTo && "text-muted-foreground"
          )}
        >
          <CalendarDays size={16} className="text-muted-foreground" />
          <span>{displayText}</span>
          {dateFrom && dateTo && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary font-semibold">
              {daysCount}d
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 min-w-[800px]" align="start">
        <div className="flex">
          {/* Shortcuts sidebar */}
          <div className="w-56 border-r border-border/50 bg-muted/30 p-5 space-y-2 dark:bg-white/[0.02] dark:border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-5 px-1">
              Atalhos
            </p>
            {SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut.label}
                onClick={() => handleShortcut(shortcut)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] rounded-lg transition-all text-left font-medium",
                  "hover:bg-accent dark:hover:bg-white/[0.06]",
                  isSelected(shortcut) && "bg-primary/10 text-primary dark:bg-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                )}
              >
                {shortcut.label}
                {isSelected(shortcut) && <Check size={14} className="ml-auto" />}
              </button>
            ))}
          </div>

          {/* Calendar section */}
          <div className="p-8">
            {/* Selected period header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                  Período selecionado
                </p>
                <p className="text-base font-semibold tracking-tight">
                  {range?.from && range?.to ? (
                    <span className="text-foreground">
                      {format(range.from, "dd MMM yyyy", { locale: ptBR })} —{" "}
                      {format(range.to, "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  ) : range?.from ? (
                    <span className="text-foreground">
                      {format(range.from, "dd MMM yyyy", { locale: ptBR })} — <span className="text-muted-foreground">Selecione o fim</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Selecione um período</span>
                  )}
                </p>
              </div>
              {range?.from && range?.to && (
                <span className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  {daysCount} dias
                </span>
              )}
            </div>

            {/* Double calendar */}
            {/* Double calendar with range selection */}
            <div className="flex gap-10">
              {/* Left calendar */}
              <div className="space-y-4 min-w-[280px]">
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setMonthLeft((m) => addMonths(m, -1))}
                    className="p-2 rounded-lg hover:bg-accent dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-bold capitalize">
                    {format(monthLeft, "MMMM yyyy", { locale: ptBR })}
                  </span>
                  <div className="w-8" />
                </div>
                <Calendar
                  mode="range"
                  month={monthLeft}
                  onMonthChange={setMonthLeft}
                  selected={range}
                  onSelect={handleRangeSelect}
                  locale={ptBR}
                  numberOfMonths={1}
                  className="border-0 [&_.rdp-day]:w-10 [&_.rdp-day]:h-10 [&_.rdp-cell]:p-1"
                  showOutsideDays={false}
                />
              </div>

              {/* Divider */}
              <div className="w-px bg-border/50 dark:bg-white/[0.06] self-stretch my-4" />

              {/* Right calendar */}
              <div className="space-y-4 min-w-[280px]">
                <div className="flex items-center justify-between px-2">
                  <div className="w-8" />
                  <span className="text-sm font-bold capitalize">
                    {format(monthRight, "MMMM yyyy", { locale: ptBR })}
                  </span>
                  <button
                    onClick={() => setMonthRight((m) => addMonths(m, 1))}
                    className="p-2 rounded-lg hover:bg-accent dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <Calendar
                  mode="range"
                  month={monthRight}
                  onMonthChange={setMonthRight}
                  selected={range}
                  onSelect={handleRangeSelect}
                  locale={ptBR}
                  numberOfMonths={1}
                  className="border-0 [&_.rdp-day]:w-10 [&_.rdp-day]:h-10 [&_.rdp-cell]:p-1"
                  showOutsideDays={false}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50 dark:border-white/[0.06]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-sm text-muted-foreground hover:text-foreground px-4"
              >
                <X size={18} className="mr-2" />
                Limpar
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!range.from || !range.to}
                className="text-sm px-5 py-2.5 h-10"
              >
                <Check size={18} className="mr-2" />
                Aplicar filtro
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
