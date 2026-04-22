export const TOKEN = "055e3548897785ebe18d691473fff7ab604f273e";
export const API_URL = "/api/utech/v1/call/calllist";

export const CALL_TYPE_MAP: Record<string, string> = {
  "0": "Interna",
  "1": "Fixo Local",
  "2": "Fixo LD",
  "3": "Celular VC1",
  "4": "Celular VC2",
  "5": "Celular VC3",
  "6": "Internacional",
  "7": "Serviço",
};

export const CALL_DIRECTION_MAP: Record<string, { label: string; short: string }> = {
  IN: { label: "Entrada", short: "IN" },
  OUT: { label: "Saída", short: "OUT" },
};

export const CALL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  "1": { label: "Abandonada", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  "2": { label: "Completada", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
};

export interface CallRecord {
  source: string;
  destination: string;
  direction: "IN" | "OUT";
  type: string;
  start: string;
  answer: string;
  end: string;
  duration: string;
  agent: string;
  trunk: string;
  status: "0" | "1" | "2";
  callid: string;
  cause: string;
  account: string;
  released: string;
  csc: string;
  record: string;
}

interface ApiResponse {
  status: string;
  cause?: string;
  calls?: {
    list?: Record<string, CallRecord>;
    total?: number;
    count?: number;
    page?: number;
  } & Record<string, CallRecord | number>;
}

export function toApiDate(value: string): string {
  return `${value} 00:00:00`;
}

export function fmtDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function extractRecords(raw: ApiResponse["calls"]): CallRecord[] {
  if (!raw) return [];
  const source: Record<string, unknown> =
    raw.list && typeof raw.list === "object" ? (raw.list as Record<string, unknown>) : raw;
  return Object.values(source).filter(
    (v): v is CallRecord => typeof v === "object" && v !== null && "source" in (v as object)
  );
}

async function fetchPage(dateIni: string, dateEnd: string, page: number): Promise<ApiResponse> {
  const token = localStorage.getItem("ip_token") ?? "";
  const res = await fetch(`${API_URL}?token=${TOKEN}&page=${page}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      date_ini: toApiDate(dateIni),
      date_end: toApiDate(dateEnd),
    }),
  });
  if (!res.ok) throw new Error("Erro ao buscar chamadas");
  const data: ApiResponse = await res.json();
  if (data.status !== "ok") throw new Error(data.cause ?? "Erro da API");
  return data;
}

export async function fetchCalls(dateIni: string, dateEnd: string): Promise<CallRecord[]> {
  const first = await fetchPage(dateIni, dateEnd, 0);
  const records = extractRecords(first.calls);

  const total: number = (first.calls as Record<string, unknown>)?.total as number ?? 0;
  const count: number = (first.calls as Record<string, unknown>)?.count as number ?? records.length;

  if (total > count && count > 0) {
    const remainingPages = Math.ceil((total - count) / count);
    const pageNumbers = Array.from({ length: remainingPages }, (_, i) => i + 1);
    const rest = await Promise.all(
      pageNumbers.map((p) => fetchPage(dateIni, dateEnd, p).then((d) => extractRecords(d.calls)))
    );
    return [...records, ...rest.flat()];
  }

  return records;
}

/** Filter out canceled calls (status "0") */
export function withoutCanceled(calls: CallRecord[]): CallRecord[] {
  return calls.filter((c) => c.status !== "0");
}

export interface AgentTelefoniaMetrics {
  agentId: string;
  agentName: string;
  total: number;
  completadas: number;
  abandonadas: number;
  avgDuration: number;
  entradas: number;
  saidas: number;
  callsPerDay: number;
  callsPerMonth: number;
  calls: CallRecord[];
}

export function computeAgentMetrics(
  calls: CallRecord[],
  agentMap: Map<string, string>
): AgentTelefoniaMetrics[] {
  const map = new Map<string, AgentTelefoniaMetrics>();

  for (const c of calls) {
    if (!c.agent || c.agent === "-" || c.agent === "") continue;
    const name = agentMap.get(c.agent) ?? c.agent;
    if (!map.has(name)) {
      map.set(name, {
        agentId: c.agent,
        agentName: name,
        total: 0,
        completadas: 0,
        abandonadas: 0,
        avgDuration: 0,
        entradas: 0,
        saidas: 0,
        callsPerDay: 0,
        callsPerMonth: 0,
        calls: [],
      });
    }
    const m = map.get(name)!;
    m.total++;
    m.calls.push(c);
    if (c.status === "2") m.completadas++;
    if (c.status === "1") m.abandonadas++;
    if (c.direction === "IN") m.entradas++;
    if (c.direction === "OUT") m.saidas++;
  }

  for (const m of map.values()) {
    const durations = m.calls
      .filter((c) => c.status === "2")
      .map((c) => Number(c.duration))
      .filter((d) => !isNaN(d) && d > 0);
    m.avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const dates = m.calls.map((c) => c.start?.slice(0, 10)).filter(Boolean);
    const uniqueDays = new Set(dates).size;
    const uniqueMonths = new Set(dates.map((d) => d.slice(0, 7))).size;
    m.callsPerDay = uniqueDays > 0 ? m.total / uniqueDays : 0;
    m.callsPerMonth = uniqueMonths > 0 ? m.total / uniqueMonths : 0;
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}
