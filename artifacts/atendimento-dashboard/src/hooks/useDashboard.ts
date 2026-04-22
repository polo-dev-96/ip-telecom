import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardFilters, ClosedAttendance } from "@/lib/types";
import {
  calcExecutiveSummary,
  calcChannelMetrics,
  calcQueueMetrics,
  calcAgentMetrics,
  calcAutomationMetrics,
  calcQualityMetrics,
  calcDailyTimeSeries,
  calcTtrTimeSeries,
  calcHeatmap,
  calcHourlyPeaks,
} from "@/lib/utils/calculations";

// Default date range: first day of current month → today
function getDefaultFilters(): DashboardFilters {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return {
    dateFrom: toISO(firstOfMonth),
    dateTo: toISO(now),
    channels: [],
    queues: [],
    agents: [],
    tags: [],
    resolutionType: "",
    withinSla: null,
    withCsat: null,
    withReopening: null,
  };
}

export const DEFAULT_FILTERS: DashboardFilters = getDefaultFilters();

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("ip_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchAttendances(filters: DashboardFilters): Promise<ClosedAttendance[]> {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.channels.length) params.set("channels", filters.channels.map((c) => c.toLowerCase()).join(","));
  if (filters.queues.length) params.set("queues", filters.queues.join(","));
  if (filters.agents.length) params.set("agents", filters.agents.join(","));

  const url = `/api/attendances?${params}`;
  console.log("[Dashboard] Fetching:", url);
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error("Erro ao buscar atendimentos");
  const json = await response.json();
  console.log("[Dashboard] Received", json.data?.length ?? 0, "records for", filters.dateFrom, "→", filters.dateTo);
  return json.data as ClosedAttendance[];
}

function getPreviousFilters(filters: DashboardFilters): DashboardFilters {
  if (!filters.dateFrom || !filters.dateTo) return filters;
  const from = new Date(filters.dateFrom);
  const to = new Date(filters.dateTo);
  const duration = to.getTime() - from.getTime();
  return {
    ...filters,
    dateFrom: new Date(from.getTime() - duration - 86400000).toISOString().slice(0, 10),
    dateTo: new Date(from.getTime() - 86400000).toISOString().slice(0, 10),
  };
}

export function useDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  // Keep a ref so queryFn always reads the latest filters
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // Fetch current period (auto-refresh every 1 min)
  const { data: closedAttendances = [], isLoading, error } = useQuery({
    queryKey: ["attendances", filters.dateFrom, filters.dateTo, filters.channels, filters.queues, filters.agents],
    queryFn: () => fetchAttendances(filtersRef.current),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchInterval: 60_000,
  });

  // Fetch previous period (for variation %)
  const prevFilters = useMemo(() => getPreviousFilters(filters), [filters]);
  const prevFiltersRef = useRef(prevFilters);
  useEffect(() => { prevFiltersRef.current = prevFilters; }, [prevFilters]);

  const { data: previousAttendances = [] } = useQuery({
    queryKey: ["attendances-prev", prevFilters.dateFrom, prevFilters.dateTo, prevFilters.channels, prevFilters.queues, prevFilters.agents],
    queryFn: () => fetchAttendances(prevFiltersRef.current),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchInterval: 60_000,
  });

  // All calculations reuse existing logic
  const executiveSummary = useMemo(() => calcExecutiveSummary(closedAttendances, previousAttendances), [closedAttendances, previousAttendances]);
  const channelMetrics = useMemo(() => calcChannelMetrics(closedAttendances), [closedAttendances]);
  const queueMetrics = useMemo(() => calcQueueMetrics(closedAttendances), [closedAttendances]);
  const agentMetrics = useMemo(() => calcAgentMetrics(closedAttendances), [closedAttendances]);
  const automationMetrics = useMemo(() => calcAutomationMetrics(closedAttendances), [closedAttendances]);
  const qualityMetrics = useMemo(() => calcQualityMetrics(closedAttendances), [closedAttendances]);

  const dailyTimeSeries = useMemo(() => calcDailyTimeSeries(closedAttendances), [closedAttendances]);
  const ttrTimeSeries = useMemo(() => calcTtrTimeSeries(closedAttendances), [closedAttendances]);
  const heatmap = useMemo(() => calcHeatmap(closedAttendances), [closedAttendances]);
  const hourlyPeaks = useMemo(() => calcHourlyPeaks(closedAttendances), [closedAttendances]);

  function updateFilter<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    isLoading,
    error,
    closedAttendances,
    executiveSummary,
    channelMetrics,
    queueMetrics,
    agentMetrics,
    automationMetrics,
    qualityMetrics,
    dailyTimeSeries,
    ttrTimeSeries,
    heatmap,
    hourlyPeaks,
  };
}

export type DashboardState = ReturnType<typeof useDashboard>;
