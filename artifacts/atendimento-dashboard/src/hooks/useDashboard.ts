import { useState, useMemo } from "react";
import type { DashboardFilters } from "@/lib/types";
import { dataProvider } from "@/data/adapters/mockAdapter";
import {
  calcDailyTimeSeries,
  calcTtrTimeSeries,
  calcHeatmap,
} from "@/lib/utils/calculations";

// Mock data spans Jan 2025 - Apr 2025, so default to that range
export const DEFAULT_FILTERS: DashboardFilters = {
  dateFrom: "2025-01-01",
  dateTo: "2025-04-30",
  channels: [],
  queues: [],
  agents: [],
  tags: [],
  resolutionType: "",
  withinSla: null,
  withCsat: null,
  withReopening: null,
};

export function useDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const closedAttendances = useMemo(() => dataProvider.getClosedAttendances(filters), [filters]);
  const executiveSummary = useMemo(() => dataProvider.getExecutiveSummary(filters), [filters]);
  const channelMetrics = useMemo(() => dataProvider.getChannelMetrics(filters), [filters]);
  const agentMetrics = useMemo(() => dataProvider.getAgentMetrics(filters), [filters]);
  const automationMetrics = useMemo(() => dataProvider.getAutomationMetrics(filters), [filters]);
  const qualityMetrics = useMemo(() => dataProvider.getQualityMetrics(filters), [filters]);

  const dailyTimeSeries = useMemo(() => calcDailyTimeSeries(closedAttendances), [closedAttendances]);
  const ttrTimeSeries = useMemo(() => calcTtrTimeSeries(closedAttendances), [closedAttendances]);
  const heatmap = useMemo(() => calcHeatmap(closedAttendances), [closedAttendances]);

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
    closedAttendances,
    executiveSummary,
    channelMetrics,
    agentMetrics,
    automationMetrics,
    qualityMetrics,
    dailyTimeSeries,
    ttrTimeSeries,
    heatmap,
  };
}

export type DashboardState = ReturnType<typeof useDashboard>;
