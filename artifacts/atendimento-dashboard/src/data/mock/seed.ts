import type { ClosedAttendance, Agent, Queue, Channel, ResolutionType, Sentiment, AttendanceStatus } from "@/lib/types";

const CHANNELS: Channel[] = ["WhatsApp", "Instagram", "Webchat", "Email", "Telegram"];

const AGENTS: Agent[] = [
  { id: "ag1", name: "Ana Souza", team: "Suporte N1", avatar: "AS" },
  { id: "ag2", name: "Bruno Lima", team: "Suporte N1", avatar: "BL" },
  { id: "ag3", name: "Carla Mendes", team: "Suporte N2", avatar: "CM" },
  { id: "ag4", name: "Diego Ferreira", team: "Suporte N2", avatar: "DF" },
  { id: "ag5", name: "Eduarda Rocha", team: "Vendas", avatar: "ER" },
  { id: "ag6", name: "Felipe Santos", team: "Vendas", avatar: "FS" },
  { id: "ag7", name: "Gabriela Costa", team: "Financeiro", avatar: "GC" },
  { id: "ag8", name: "Henrique Nunes", team: "Financeiro", avatar: "HN" },
  { id: "ag9", name: "Isabela Martins", team: "Suporte N1", avatar: "IM" },
  { id: "ag10", name: "João Oliveira", team: "Suporte N2", avatar: "JO" },
];

const QUEUES: Queue[] = [
  { id: "q1", name: "Suporte Técnico", team: "Suporte N1", slaTargetMinutes: 120 },
  { id: "q2", name: "Suporte Avançado", team: "Suporte N2", slaTargetMinutes: 240 },
  { id: "q3", name: "Vendas Ativas", team: "Vendas", slaTargetMinutes: 60 },
  { id: "q4", name: "Financeiro", team: "Financeiro", slaTargetMinutes: 480 },
  { id: "q5", name: "Reclamações", team: "Suporte N2", slaTargetMinutes: 180 },
  { id: "q6", name: "Onboarding", team: "Vendas", slaTargetMinutes: 90 },
];

const TAGS = [
  "cobrança", "senha", "cancelamento", "produto-defeituoso", "entrega",
  "nota-fiscal", "reembolso", "dúvida-técnica", "upgrade", "downgrade",
  "onboarding", "integração", "bug", "acesso", "cadastro",
  "segunda-via", "boleto", "cartão", "proposta", "parceria"
];

const ISSUE_TYPES = [
  "Suporte Técnico", "Dúvida Comercial", "Reclamação", "Solicitação",
  "Cancelamento", "Financeiro", "Onboarding", "Bug"
];

const CAMPAIGN_SOURCES = [null, null, null, "campanha-black-friday", "campanha-natal", "email-marketing", "google-ads", null];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rndFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function fmt(date: Date): string {
  return date.toISOString();
}

const CHANNEL_WEIGHTS = [40, 15, 20, 15, 10];
const CHANNEL_TTR_BASE: Record<Channel, [number, number]> = {
  WhatsApp: [15, 180],
  Instagram: [20, 240],
  Webchat: [5, 90],
  Email: [60, 720],
  Telegram: [10, 120],
};
const CHANNEL_SLA: Record<Channel, number> = {
  WhatsApp: 120,
  Instagram: 180,
  Webchat: 60,
  Email: 480,
  Telegram: 90,
};

function generateAttendance(index: number): ClosedAttendance {
  const channel = pickWeighted(CHANNELS, CHANNEL_WEIGHTS);
  const queue = pick(QUEUES);
  const agentOrNull = Math.random() > 0.12 ? pick(AGENTS) : null;

  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-04-30");
  const openedAt = randomDate(startDate, endDate);

  const frtBase = channel === "Email" ? rnd(10, 120) : rnd(1, 30);
  const frtMinutes = Math.random() > 0.05 ? frtBase : null;

  const hadBot = Math.random() < 0.6;
  const automatedOnly = hadBot && Math.random() < 0.3;
  const hadHandoff = hadBot && !automatedOnly && Math.random() < 0.7;

  const [ttrMin, ttrMax] = CHANNEL_TTR_BASE[channel];
  const ttrMinutes = rnd(ttrMin, ttrMax);

  const closedAt = addMinutes(openedAt, ttrMinutes);
  const firstResponseAt = frtMinutes ? addMinutes(openedAt, frtMinutes) : null;

  let botEscalatedAt: string | null = null;
  let firstHumanResponseAt: string | null = null;
  let handoffSeconds: number | null = null;

  if (hadHandoff) {
    const botMins = rnd(2, 15);
    const escalated = addMinutes(openedAt, botMins);
    botEscalatedAt = fmt(escalated);
    const handoffSecs = rnd(30, 600);
    handoffSeconds = handoffSecs;
    firstHumanResponseAt = fmt(addSeconds(escalated, handoffSecs));
  }

  const slaTarget = CHANNEL_SLA[channel];
  const withinResolutionSla = ttrMinutes <= slaTarget;

  const transferCount = Math.random() < 0.2 ? rnd(1, 3) : 0;
  const acwSeconds = automatedOnly ? 0 : rnd(30, 300);

  const reopened = Math.random() < 0.08;
  const fcr = !reopened;

  const csatAnswered = Math.random() < 0.55;
  const csatScore: number | null = csatAnswered ? rnd(1, 5) : null;

  const npsAnswered = Math.random() < 0.35;
  const npsScore: number | null = npsAnswered ? rnd(0, 10) : null;

  const tagCount = rnd(1, 3);
  const tags = Array.from(new Set(Array.from({ length: tagCount }, () => pick(TAGS))));

  const sentiments: Sentiment[] = ["positivo", "neutro", "negativo"];
  const sentimentWeights = csatScore ? (csatScore >= 4 ? [60, 30, 10] : csatScore === 3 ? [20, 50, 30] : [10, 30, 60]) : [33, 34, 33];
  const sentiment = pickWeighted(sentiments, sentimentWeights);

  const resTypes: ResolutionType[] = ["bot", "humano", "hibrido"];
  let resolutionType: ResolutionType;
  if (automatedOnly) resolutionType = "bot";
  else if (hadHandoff || hadBot) resolutionType = "hibrido";
  else resolutionType = "humano";

  const statuses: AttendanceStatus[] = ["finalizado", "fechado", "resolvido"];
  const status = pick(statuses);

  const compliance = Math.random() < 0.85;
  const campaign = pick(CAMPAIGN_SOURCES);

  const maskedNames = [
    "Ana ****", "Bruno ****", "Carlos ****", "Diana ****", "Eduardo ****",
    "Fernanda ****", "Gustavo ****", "Helena ****", "Igor ****", "Julia ****",
    "Lucas ****", "Mariana ****", "Nicolas ****", "Olivia ****", "Paulo ****"
  ];

  const protocolYear = openedAt.getFullYear();
  const protocolMonth = String(openedAt.getMonth() + 1).padStart(2, "0");
  const protocol = `ATD-${protocolYear}${protocolMonth}-${String(index + 1).padStart(5, "0")}`;

  return {
    id: `att-${index + 1}`,
    protocol,
    customerIdMasked: `CLI-${String(rnd(10000, 99999))}`,
    customerNameMasked: pick(maskedNames),
    channel,
    queue: queue.name,
    team: queue.team,
    agentId: agentOrNull ? agentOrNull.id : null,
    agentName: agentOrNull ? agentOrNull.name : null,
    openedAt: fmt(openedAt),
    firstResponseAt: firstResponseAt ? fmt(firstResponseAt) : null,
    botEscalatedAt,
    firstHumanResponseAt,
    closedAt: fmt(closedAt),
    status,
    resolutionType,
    hadBot,
    automatedOnly,
    hadHandoff,
    handoffSeconds,
    transferCount,
    acwSeconds,
    ttrMinutes,
    frtMinutes,
    slaResolutionTargetMinutes: slaTarget,
    withinResolutionSla,
    resolvedFirstContact: fcr,
    reopenedWithin7Days: reopened,
    csatScore,
    npsScore,
    tags,
    sentiment,
    complianceRecordComplete: compliance,
    issueType: pick(ISSUE_TYPES),
    campaignSource: campaign,
  };
}

export const MOCK_ATTENDANCES: ClosedAttendance[] = Array.from(
  { length: 600 },
  (_, i) => generateAttendance(i)
);

export const MOCK_AGENTS: Agent[] = AGENTS;
export const MOCK_QUEUES: Queue[] = QUEUES;
export const MOCK_TAGS: string[] = TAGS;
export const MOCK_CHANNELS: Channel[] = CHANNELS;
