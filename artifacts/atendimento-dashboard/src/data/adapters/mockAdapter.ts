// TODO: Replace MockDashboardDataProvider with DatabaseDashboardDataProvider or ApiDashboardDataProvider
// when connecting to a real data source.

import type { ClosedAttendance, DashboardFilters, ExecutiveSummary, ChannelMetric, AgentMetric, AutomationMetric, QualityMetric } from "@/lib/types";
import { MOCK_ATTENDANCES } from "@/data/mock/seed";
import {
  calcExecutiveSummary,
  calcChannelMetrics,
  calcAgentMetrics,
  calcAutomationMetrics,
  calcQualityMetrics,
  calcQueueMetrics,
  type QueueMetric,
} from "@/lib/utils/calculations";

export interface DashboardDataProvider {
  getClosedAttendances(filters: DashboardFilters): ClosedAttendance[];
  getExecutiveSummary(filters: DashboardFilters): ExecutiveSummary;
  getChannelMetrics(filters: DashboardFilters): ChannelMetric[];
  getQueueMetrics(filters: DashboardFilters): QueueMetric[];
  getAgentMetrics(filters: DashboardFilters): AgentMetric[];
  getAutomationMetrics(filters: DashboardFilters): AutomationMetric;
  getQualityMetrics(filters: DashboardFilters): QualityMetric;
  getAttendanceById(id: string): ClosedAttendance | undefined;
}

function applyFilters(data: ClosedAttendance[], filters: DashboardFilters): ClosedAttendance[] {
  return data.filter((a) => {
    const closedDate = a.closedAt.slice(0, 10);
    if (filters.dateFrom && closedDate < filters.dateFrom) return false;
    if (filters.dateTo && closedDate > filters.dateTo) return false;
    if (filters.channels.length > 0 && !filters.channels.includes(a.channel)) return false;
    if (filters.queues.length > 0 && !filters.queues.includes(a.queue)) return false;
    if (filters.agents.length > 0 && (!a.agentId || !filters.agents.includes(a.agentId))) return false;
    if (filters.tags.length > 0 && !filters.tags.some((t) => a.tags.includes(t))) return false;
    if (filters.resolutionType && a.resolutionType !== filters.resolutionType) return false;
    if (filters.withinSla !== null && a.withinResolutionSla !== filters.withinSla) return false;
    if (filters.withCsat !== null) {
      if (filters.withCsat && a.csatScore === null) return false;
      if (!filters.withCsat && a.csatScore !== null) return false;
    }
    if (filters.withReopening !== null && a.reopenedWithin7Days !== filters.withReopening) return false;
    return true;
  });
}

function getPreviousPeriod(data: ClosedAttendance[], filters: DashboardFilters): ClosedAttendance[] {
  if (!filters.dateFrom || !filters.dateTo) return [];
  const from = new Date(filters.dateFrom);
  const to = new Date(filters.dateTo);
  const duration = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - duration).toISOString().slice(0, 10);
  const prevTo = new Date(to.getTime() - duration).toISOString().slice(0, 10);
  return applyFilters(data, { ...filters, dateFrom: prevFrom, dateTo: prevTo });
}

export class MockDashboardDataProvider implements DashboardDataProvider {
  private data = MOCK_ATTENDANCES;

  getClosedAttendances(filters: DashboardFilters): ClosedAttendance[] {
    return applyFilters(this.data, filters);
  }

  getExecutiveSummary(filters: DashboardFilters): ExecutiveSummary {
    const current = applyFilters(this.data, filters);
    const previous = getPreviousPeriod(this.data, filters);
    return calcExecutiveSummary(current, previous);
  }

  getChannelMetrics(filters: DashboardFilters): ChannelMetric[] {
    return calcChannelMetrics(applyFilters(this.data, filters));
  }

  getQueueMetrics(filters: DashboardFilters): QueueMetric[] {
    return calcQueueMetrics(applyFilters(this.data, filters));
  }

  getAgentMetrics(filters: DashboardFilters): AgentMetric[] {
    return calcAgentMetrics(applyFilters(this.data, filters));
  }

  getAutomationMetrics(filters: DashboardFilters): AutomationMetric {
    return calcAutomationMetrics(applyFilters(this.data, filters));
  }

  getQualityMetrics(filters: DashboardFilters): QualityMetric {
    return calcQualityMetrics(applyFilters(this.data, filters));
  }

  getAttendanceById(id: string): ClosedAttendance | undefined {
    return this.data.find((a) => a.id === id);
  }
}

// Singleton instance
export const dataProvider: DashboardDataProvider = new MockDashboardDataProvider();
