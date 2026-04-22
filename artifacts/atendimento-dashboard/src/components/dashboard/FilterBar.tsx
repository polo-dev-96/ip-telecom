import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import type { DashboardState } from "@/hooks/useDashboard";
import type { Channel } from "@/lib/types";
import { PeriodFilter } from "@/components/filters/PeriodFilter";
import { useQuery } from "@tanstack/react-query";

interface FilterOption {
  value: string;
  label: string;
}

interface FiltersResponse {
  channels: FilterOption[];
  queues: FilterOption[];
  agents: FilterOption[];
}

async function fetchFilterOptions(): Promise<FiltersResponse> {
  const token = localStorage.getItem("ip_token");
  const res = await fetch("/api/filters", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return { channels: [], queues: [], agents: [] };
  return res.json();
}

interface FilterBarProps {
  dashboard: DashboardState;
  compact?: boolean;
}

export function FilterBar({ dashboard, compact }: FilterBarProps) {
  const { filters, updateFilter, resetFilters } = dashboard;
  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
    staleTime: 300_000,
  });

  const channels = filterOptions?.channels ?? [];
  const queues = filterOptions?.queues ?? [];
  const agents = filterOptions?.agents ?? [];

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
          dashboard.setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
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
            {channels.map((c) => (
              <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>
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
            {queues.map((q) => (
              <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
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
            {agents.map((a) => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
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
