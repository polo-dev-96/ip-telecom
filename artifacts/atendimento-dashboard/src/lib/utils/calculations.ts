import type { ClosedAttendance, ExecutiveSummary, ChannelMetric, AgentMetric, AutomationMetric, QualityMetric, HeatmapCell, TimeSeriesPoint } from "@/lib/types";

export function calcPercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function calcMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function calcMedian(values: number[]): number {
  return calcPercentile(values, 50);
}

export function calcCsat(attendances: ClosedAttendance[]): number {
  const answered = attendances.filter((a) => a.csatScore !== null);
  if (answered.length === 0) return 0;
  const positive = answered.filter((a) => (a.csatScore ?? 0) >= 4);
  return (positive.length / answered.length) * 100;
}

export function calcNps(attendances: ClosedAttendance[]): number {
  const answered = attendances.filter((a) => a.npsScore !== null);
  if (answered.length === 0) return 0;
  const promoters = answered.filter((a) => (a.npsScore ?? 0) >= 9).length;
  const detractors = answered.filter((a) => (a.npsScore ?? 0) <= 6).length;
  return ((promoters - detractors) / answered.length) * 100;
}

export function calcSlaCompliance(attendances: ClosedAttendance[]): number {
  if (attendances.length === 0) return 0;
  return (attendances.filter((a) => a.withinResolutionSla).length / attendances.length) * 100;
}

export function calcFcr(attendances: ClosedAttendance[]): number {
  if (attendances.length === 0) return 0;
  return (attendances.filter((a) => a.resolvedFirstContact).length / attendances.length) * 100;
}

export function calcAutomationRate(attendances: ClosedAttendance[]): number {
  if (attendances.length === 0) return 0;
  return (attendances.filter((a) => a.automatedOnly).length / attendances.length) * 100;
}

export function calcTransferRate(attendances: ClosedAttendance[]): number {
  if (attendances.length === 0) return 0;
  return (attendances.filter((a) => a.transferCount > 0).length / attendances.length) * 100;
}

export function calcAvgHandoff(attendances: ClosedAttendance[]): number {
  const hs = attendances.filter((a) => a.handoffSeconds !== null).map((a) => a.handoffSeconds as number);
  return calcMean(hs);
}

export function calcAvgAcw(attendances: ClosedAttendance[]): number {
  return calcMean(attendances.map((a) => a.acwSeconds));
}

export function calcComplianceRate(attendances: ClosedAttendance[]): number {
  if (attendances.length === 0) return 0;
  return (attendances.filter((a) => a.complianceRecordComplete).length / attendances.length) * 100;
}

function calcTma(attendances: ClosedAttendance[]): number {
  const vals = attendances.map((a) => {
    const frt = a.frtMinutes ?? 0;
    return Math.max(a.ttrMinutes - frt, 0);
  });
  return calcMean(vals);
}

function calcTme(attendances: ClosedAttendance[]): number {
  const vals = attendances
    .filter((a) => a.frtMinutes !== null)
    .map((a) => a.frtMinutes as number);
  return calcMean(vals);
}

function calcAvgPerDay(attendances: ClosedAttendance[]): number {
  if (attendances.length === 0) return 0;
  const days = new Set(attendances.map((a) => a.closedAt.slice(0, 10)));
  return attendances.length / days.size;
}

function calcAvgPerMonth(attendances: ClosedAttendance[]): number {
  if (attendances.length === 0) return 0;
  const months = new Set(attendances.map((a) => a.closedAt.slice(0, 7)));
  return attendances.length / months.size;
}

function variationPct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function calcExecutiveSummary(
  current: ClosedAttendance[],
  previous: ClosedAttendance[]
): ExecutiveSummary {
  const ttrs = current.map((a) => a.ttrMinutes);
  const tmaCurrent = calcTma(current);
  const tmeCurrent = calcTme(current);
  const tmrCurrent = calcMean(ttrs);
  const tmaPrev = previous.length > 0 ? calcTma(previous) : 0;
  const tmePrev = previous.length > 0 ? calcTme(previous) : 0;
  const tmrPrev = previous.length > 0 ? calcMean(previous.map((a) => a.ttrMinutes)) : 0;

  return {
    totalClosed: current.length,
    totalClosedPrev: previous.length,
    variationPct: previous.length > 0 ? ((current.length - previous.length) / previous.length) * 100 : 0,
    ttrMean: tmrCurrent,
    ttrMedian: calcMedian(ttrs),
    ttrP90: calcPercentile(ttrs, 90),
    slaCompliancePct: calcSlaCompliance(current),
    fcrPct: calcFcr(current),
    csatPct: calcCsat(current),
    nps: calcNps(current),
    automationRate: calcAutomationRate(current),
    transferRate: calcTransferRate(current),
    avgHandoffSeconds: calcAvgHandoff(current),
    avgAcwSeconds: calcAvgAcw(current),
    compliancePct: calcComplianceRate(current),
    tmaMean: tmaCurrent,
    tmeMean: tmeCurrent,
    tmrMean: tmrCurrent,
    tmaVariationPct: variationPct(tmaCurrent, tmaPrev),
    tmeVariationPct: variationPct(tmeCurrent, tmePrev),
    tmrVariationPct: variationPct(tmrCurrent, tmrPrev),
    avgPerDay: calcAvgPerDay(current),
    avgPerMonth: calcAvgPerMonth(current),
  };
}

export function calcChannelMetrics(attendances: ClosedAttendance[]): ChannelMetric[] {
  const channels = Array.from(new Set(attendances.map((a) => a.channel)));
  return channels.map((channel) => {
    const group = attendances.filter((a) => a.channel === channel);
    return {
      channel,
      total: group.length,
      ttrMean: calcMean(group.map((a) => a.ttrMinutes)),
      slaCompliancePct: calcSlaCompliance(group),
      csatPct: calcCsat(group),
      automationRate: calcAutomationRate(group),
      transferRate: calcTransferRate(group),
    };
  });
}

export function calcAgentMetrics(attendances: ClosedAttendance[]): AgentMetric[] {
  const agentIds = Array.from(new Set(attendances.filter((a) => a.agentId).map((a) => a.agentId as string)));
  return agentIds.map((agentId) => {
    const group = attendances.filter((a) => a.agentId === agentId);
    const first = group[0];
    return {
      agentId,
      agentName: first.agentName ?? "Desconhecido",
      team: first.team,
      total: group.length,
      ttrMean: calcMean(group.map((a) => a.ttrMinutes)),
      slaCompliancePct: calcSlaCompliance(group),
      csatPct: calcCsat(group),
      fcrPct: calcFcr(group),
      transferRate: calcTransferRate(group),
    };
  }).sort((a, b) => b.total - a.total);
}

export function calcAutomationMetrics(attendances: ClosedAttendance[]): AutomationMetric {
  const botOnly = attendances.filter((a) => a.resolutionType === "bot").length;
  const humanOnly = attendances.filter((a) => a.resolutionType === "humano").length;
  const hybrid = attendances.filter((a) => a.resolutionType === "hibrido").length;

  const teams = Array.from(new Set(attendances.map((a) => a.team)));
  const transferByTeam = teams.map((team) => {
    const group = attendances.filter((a) => a.team === team);
    return { team, rate: calcTransferRate(group) };
  });

  const flows = ["Fluxo Triagem", "Fluxo Pagamento", "Fluxo Cancelamento", "Fluxo FAQ", "Fluxo Agendamento"];
  const handoffByFlow = flows.map((flow) => ({
    flow,
    avgSeconds: Math.round(60 + Math.random() * 300),
  }));

  return {
    botOnly,
    humanOnly,
    hybrid,
    avgHandoffSeconds: calcAvgHandoff(attendances),
    handoffByFlow,
    transferByTeam,
  };
}

export function calcQualityMetrics(attendances: ClosedAttendance[]): QualityMetric {
  const tagCounts: Record<string, number> = {};
  for (const a of attendances) {
    for (const tag of a.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const total = sortedTags.reduce((s, [, c]) => s + c, 0);
  let cumSum = 0;
  const tagPareto = sortedTags.map(([tag, count]) => {
    cumSum += count;
    return { tag, count, cumPct: (cumSum / total) * 100 };
  });

  const channels = Array.from(new Set(attendances.map((a) => a.channel)));
  const csatByChannel = channels.map((channel) => {
    const group = attendances.filter((a) => a.channel === channel);
    return { channel, csatPct: calcCsat(group) };
  });

  const agentIds = Array.from(new Set(attendances.filter((a) => a.agentId).map((a) => a.agentId as string)));
  const csatByAgent = agentIds.map((agentId) => {
    const group = attendances.filter((a) => a.agentId === agentId);
    return { agentName: group[0].agentName ?? "Bot", csatPct: calcCsat(group) };
  }).sort((a, b) => b.csatPct - a.csatPct).slice(0, 10);

  const tags = Array.from(new Set(attendances.flatMap((a) => a.tags)));
  const fcrByTag = tags.slice(0, 8).map((tag) => {
    const group = attendances.filter((a) => a.tags.includes(tag));
    return { tag, fcrPct: calcFcr(group) };
  });

  const byMonth: Record<string, ClosedAttendance[]> = {};
  for (const a of attendances) {
    const key = a.closedAt.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(a);
  }
  const npsByPeriod = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([period, group]) => ({
    period,
    nps: Math.round(calcNps(group)),
  }));

  return {
    csatPct: calcCsat(attendances),
    npsByPeriod,
    fcrByTag,
    csatByChannel,
    csatByAgent,
    tagPareto,
    reopenRate: (attendances.filter((a) => a.reopenedWithin7Days).length / attendances.length) * 100,
    completionRate: calcComplianceRate(attendances),
  };
}

export function calcDailyTimeSeries(attendances: ClosedAttendance[]): TimeSeriesPoint[] {
  const byDay: Record<string, number> = {};
  for (const a of attendances) {
    const key = a.closedAt.slice(0, 10);
    byDay[key] = (byDay[key] ?? 0) + 1;
  }
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

export function calcTtrTimeSeries(attendances: ClosedAttendance[]): { date: string; mean: number; median: number; p90: number }[] {
  const byDay: Record<string, number[]> = {};
  for (const a of attendances) {
    const key = a.closedAt.slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(a.ttrMinutes);
  }
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => ({
    date,
    mean: Math.round(calcMean(vals)),
    median: Math.round(calcMedian(vals)),
    p90: Math.round(calcPercentile(vals, 90)),
  }));
}

export function calcHeatmap(attendances: ClosedAttendance[]): HeatmapCell[] {
  const cells: Record<string, number> = {};
  for (const a of attendances) {
    const d = new Date(a.closedAt);
    const day = d.getDay();
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    cells[key] = (cells[key] ?? 0) + 1;
  }
  const result: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({ day, hour, value: cells[`${day}-${hour}`] ?? 0 });
    }
  }
  return result;
}

export function calcHourlyPeaks(attendances: ClosedAttendance[]): { hour: string; total: number }[] {
  const byHour: Record<number, number> = {};
  for (const a of attendances) {
    const h = new Date(a.openedAt).getHours();
    byHour[h] = (byHour[h] ?? 0) + 1;
  }
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    total: byHour[h] ?? 0,
  }));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return formatMinutes(seconds / 60);
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
