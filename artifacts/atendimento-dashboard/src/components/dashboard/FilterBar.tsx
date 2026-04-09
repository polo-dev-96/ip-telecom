import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import type { DashboardState } from "@/hooks/useDashboard";
import type { Channel } from "@/lib/types";
import { MOCK_CHANNELS, MOCK_QUEUES, MOCK_AGENTS } from "@/data/mock/seed";
import { PeriodFilter } from "@/components/filters/PeriodFilter";

const CHANNELS: Channel[] = MOCK_CHANNELS;

interface FilterBarProps {
  dashboard: DashboardState;
  compact?: boolean;
}

export function FilterBar({ dashboard, compact }: FilterBarProps) {
  const { filters, updateFilter, resetFilters } = dashboard;

  const hasActiveFilters =
    filters.channels.length > 0 ||
    filters.queues.length > 0 ||
    filters.agents.length > 0;

  return (
    <div className={compact ? "flex items-center gap-2 flex-wrap" : "flex flex-col gap-3"}>
      {/* Period filter */}
      <PeriodFilter
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onChange={(from, to) => {
          updateFilter("dateFrom", from);
          updateFilter("dateTo", to);
        }}
      />

      {/* Channel */}
      <div className={compact ? "" : "flex flex-col gap-1"}>
        {!compact && <label className="text-xs font-medium text-muted-foreground">Canal</label>}
        <Select
          value={filters.channels[0] ?? "_all"}
          onValueChange={(v) => updateFilter("channels", v === "_all" ? [] : [v as Channel])}
        >
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="Todos os canais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os canais</SelectItem>
            {CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Queue */}
      <div className={compact ? "" : "flex flex-col gap-1"}>
        {!compact && <label className="text-xs font-medium text-muted-foreground">Fila</label>}
        <Select
          value={filters.queues[0] ?? "_all"}
          onValueChange={(v) => updateFilter("queues", v === "_all" ? [] : [v])}
        >
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Todas as filas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas as filas</SelectItem>
            {MOCK_QUEUES.map((q) => (
              <SelectItem key={q.id} value={q.name}>{q.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agent */}
      <div className={compact ? "" : "flex flex-col gap-1"}>
        {!compact && <label className="text-xs font-medium text-muted-foreground">Agente</label>}
        <Select
          value={filters.agents[0] ?? "_all"}
          onValueChange={(v) => updateFilter("agents", v === "_all" ? [] : [v])}
        >
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Todos os agentes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os agentes</SelectItem>
            {MOCK_AGENTS.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X size={12} />
          Limpar
        </Button>
      )}
    </div>
  );
}
