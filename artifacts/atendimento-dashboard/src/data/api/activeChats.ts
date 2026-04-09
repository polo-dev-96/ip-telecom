export type AttendancePhase = "fila" | "agente";
export type ChannelType = "WhatsApp" | "Instagram" | "Webchat" | "Email" | "Telegram" | string;

export interface LiveAttendance {
  id: string;
  contactName: string;
  contactPhone: string;
  channel: ChannelType;
  dst: string;
  dstName: string;
  phase: AttendancePhase;
  duration: string;
  durationSeconds: number;
}

interface ApiChat {
  id: string;
  src: string;
  src_name: string;
  dst: string;
  dst_name: string;
  status: string;
  duration: string;
  type: string;
  date: string;
  module: string;
  [key: string]: unknown;
}

interface ApiResponse {
  status: string;
  chats: ApiChat[];
}

function parseChannelType(type: string): ChannelType {
  const lower = type.toLowerCase();
  if (lower.includes("whatsapp")) return "WhatsApp";
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("webchat") || lower.includes("web")) return "Webchat";
  if (lower.includes("email")) return "Email";
  if (lower.includes("telegram")) return "Telegram";
  return type;
}

function parseDurationToSeconds(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  }
  return 0;
}

function mapChat(chat: ApiChat): LiveAttendance {
  const isQueued = chat.status?.toLowerCase() === "queued";

  return {
    id: chat.id ?? `${chat.src}-${chat.dst}-${chat.date}`,
    contactName: chat.src_name || chat.src || "Desconhecido",
    contactPhone: chat.src || "",
    channel: parseChannelType(chat.type),
    dst: chat.dst || "",
    dstName: chat.dst_name || chat.dst || "",
    phase: isQueued ? "fila" : "agente",
    duration: chat.duration || "00:00:00",
    durationSeconds: parseDurationToSeconds(chat.duration),
  };
}

function getToken(): string {
  const token = import.meta.env.VITE_UTECH_API_TOKEN;
  if (!token) throw new Error("VITE_UTECH_API_TOKEN não configurado no .env");
  return token;
}

export interface QueueInfo {
  id: string;
  name: string;
}

export interface AgentInfo {
  id: string;
  name: string;
}

function dictToArray(obj: unknown): { _key: string; [k: string]: unknown }[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  return Object.entries(obj as Record<string, unknown>)
    .filter(([, v]) => v && typeof v === "object" && !Array.isArray(v))
    .map(([k, v]) => ({ _key: k, ...(v as Record<string, unknown>) }));
}

function findItemDict(data: unknown, ...path: string[]): { _key: string; [k: string]: unknown }[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  for (const p of path) {
    const val = obj[p];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>;
      for (const innerKey of Object.keys(inner)) {
        const nested = inner[innerKey];
        if (nested && typeof nested === "object" && !Array.isArray(nested)) {
          const items = dictToArray(nested);
          if (items.length > 0) return items;
        }
        if (Array.isArray(nested) && nested.length > 0) {
          return nested.map((item, i) => ({ _key: String(i), ...(typeof item === "object" ? item : {}) }));
        }
      }
      return dictToArray(val);
    }
  }
  return [];
}

export async function fetchQueues(): Promise<QueueInfo[]> {
  const token = getToken();
  const res = await fetch(`/api/utech/v1/queue/queuelist?token=${encodeURIComponent(token)}&page=0`);
  if (!res.ok) throw new Error(`Queue API retornou status ${res.status}`);
  const data = await res.json();
  console.debug("[fetchQueues] raw:", data);
  const list = findItemDict(data, "queues", "data", "queue");
  console.debug("[fetchQueues] items:", list);
  return list
    .map((q) => ({
      id: String(q.queue ?? q._key ?? q.id ?? q.number ?? ""),
      name: String(q.name ?? q.description ?? q._key ?? ""),
    }))
    .filter((q) => q.id);
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  const token = getToken();
  const res = await fetch(`/api/utech/v1/agents/agentlist?token=${encodeURIComponent(token)}&page=0`);
  if (!res.ok) throw new Error(`Agent API retornou status ${res.status}`);
  const data = await res.json();
  console.debug("[fetchAgents] raw:", data);
  const list = findItemDict(data, "agents", "data", "agent");
  console.debug("[fetchAgents] items:", list);
  return list
    .map((a) => ({
      id: String(a.agentid ?? a.agent_id ?? a._key ?? a.id ?? a.number ?? ""),
      name: String(a.name ?? a.agent_name ?? a._key ?? ""),
    }))
    .filter((a) => a.id);
}

export function resolveNames(
  chats: LiveAttendance[],
  queueMap: Map<string, string>,
  agentMap: Map<string, string>,
): LiveAttendance[] {
  return chats.map((c) => {
    const resolvedName =
      c.phase === "fila"
        ? queueMap.get(c.dst) ?? c.dstName
        : agentMap.get(c.dst) ?? c.dstName;
    return { ...c, dstName: resolvedName || c.dstName };
  });
}

export async function fetchActiveChats(): Promise<LiveAttendance[]> {
  const token = getToken();

  const url = `/api/utech/v1/chats/activechats?token=${encodeURIComponent(token)}&page=0`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API retornou status ${res.status}`);
  }

  const data: ApiResponse = await res.json();

  if (data.status !== "ok" || !Array.isArray(data.chats)) {
    throw new Error(`Resposta inesperada da API: ${data.status}`);
  }

  return data.chats.map(mapChat);
}
