export type Channel = "WhatsApp" | "Instagram" | "Webchat" | "Email" | "Telegram" | "Facebook";
export type AttendanceStatus = "finalizado" | "fechado" | "resolvido";
export type ResolutionType = "humano" | "bot" | "hibrido";
export type Sentiment = "positivo" | "neutro" | "negativo";

export interface ClosedAttendance {
  id: string;
  protocol: string;
  customerIdMasked: string;
  customerNameMasked: string;
  channel: Channel;
  queue: string;
  team: string;
  agentId: string | null;
  agentName: string | null;
  openedAt: string;
  firstResponseAt: string | null;
  botEscalatedAt: string | null;
  firstHumanResponseAt: string | null;
  closedAt: string;
  status: AttendanceStatus;
  resolutionType: ResolutionType;
  hadBot: boolean;
  automatedOnly: boolean;
  hadHandoff: boolean;
  handoffSeconds: number | null;
  transferCount: number;
  acwSeconds: number;
  ttrMinutes: number;
  frtMinutes: number | null;
  slaResolutionTargetMinutes: number;
  withinResolutionSla: boolean;
  resolvedFirstContact: boolean;
  reopenedWithin7Days: boolean;
  csatScore: number | null;
  npsScore: number | null;
  tags: string[];
  sentiment: Sentiment;
  complianceRecordComplete: boolean;
  issueType: string;
  campaignSource: string | null;
}

export interface Agent {
  id: string;
  name: string;
  team: string;
  avatar: string;
}

export interface Queue {
  id: string;
  name: string;
  team: string;
  slaTargetMinutes: number;
}

export interface SlaConfig {
  channel?: Channel;
  queue?: string;
  targetMinutes: number;
}

export interface DashboardFilters {
  dateFrom: string;
  dateTo: string;
  channels: Channel[];
  queues: string[];
  agents: string[];
  tags: string[];
  resolutionType: ResolutionType | "";
  withinSla: boolean | null;
  withCsat: boolean | null;
  withReopening: boolean | null;
}

export interface ExecutiveSummary {
  totalClosed: number;
  totalClosedPrev: number;
  variationPct: number;
  ttrMean: number;
  ttrMedian: number;
  ttrP90: number;
  slaCompliancePct: number;
  fcrPct: number;
  csatPct: number;
  nps: number;
  automationRate: number;
  transferRate: number;
  avgHandoffSeconds: number;
  avgAcwSeconds: number;
  compliancePct: number;
  tmaMean: number;
  tmeMean: number;
  tmrMean: number;
  tmaVariationPct: number;
  tmeVariationPct: number;
  tmrVariationPct: number;
  avgPerDay: number;
  avgPerMonth: number;
}

export interface ChannelMetric {
  channel: Channel;
  total: number;
  ttrMean: number;
  slaCompliancePct: number;
  csatPct: number;
  automationRate: number;
  transferRate: number;
}

export interface AgentMetric {
  agentId: string;
  agentName: string;
  team: string;
  total: number;
  ttrMean: number;
  slaCompliancePct: number;
  csatPct: number;
  fcrPct: number;
  transferRate: number;
}

export interface AutomationMetric {
  botOnly: number;
  humanOnly: number;
  hybrid: number;
  avgHandoffSeconds: number;
  handoffByFlow: { flow: string; avgSeconds: number }[];
  transferByTeam: { team: string; rate: number }[];
}

export interface QualityMetric {
  csatPct: number;
  npsByPeriod: { period: string; nps: number }[];
  fcrByTag: { tag: string; fcrPct: number }[];
  csatByChannel: { channel: string; csatPct: number }[];
  csatByAgent: { agentName: string; csatPct: number }[];
  tagPareto: { tag: string; count: number; cumPct: number }[];
  reopenRate: number;
  completionRate: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface HeatmapCell {
  day: number;
  hour: number;
  value: number;
}
