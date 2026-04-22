import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Phone, Clock, User, Users, MessageSquare, Headphones, Timer, Activity, Search,
  RefreshCw, AlertCircle, Wifi, WifiOff, Server, PhoneCall, ChevronDown, ChevronRight,
  PhoneIncoming, PhoneOutgoing, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchActiveChats, fetchQueues, fetchAgents, resolveNames,
  type LiveAttendance,
} from "@/data/api/activeChats";

// ======================== TYPES ========================

interface CallEntry {
  caller: string;
  called: string;
  state: "answered" | "unanswered" | "proceeding" | "calling" | "diverted" | "transferred";
  start: string;
  duration: number;
  held: boolean;
  type: "in" | "out";
  trunk: string;
}

interface RamalData {
  exten: string;
  name: string;
  status: "Reachable" | "Unreachable";
  adrress?: string;
  address?: string;
  inuse?: boolean;
  calls?: number;
  calllist?: Record<string, CallEntry>;
}

interface ApiResponse {
  status: string;
  list: {
    extens: Record<string, RamalData>;
  };
}

// ======================== CONSTANTS ========================

const REFRESH_INTERVAL_MS = 30_000;
const TOKEN = "055e3548897785ebe18d691473fff7ab604f273e";
const RAMAIS_API_URL = "https://ipfibra.ippolopabx.com.br/utech/v1/exten/extenmonitor";

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Instagram: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
  Webchat: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Email: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Telegram: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
};

const CALL_STATE_MAP: Record<CallEntry["state"], { label: string; color: string }> = {
  answered:    { label: "Atendida",    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  unanswered:  { label: "Não Atendida", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  proceeding:  { label: "Originando",  color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  calling:     { label: "Chamando",    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  diverted:    { label: "Desviada",    color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  transferred: { label: "Transferida", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30" },
};

// ======================== HELPERS ========================

function getChannelColor(channel: string): string {
  return CHANNEL_COLORS[channel] ?? "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function fmtDurationSec(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

async function fetchRamais(): Promise<RamalData[]> {
  const response = await fetch(`${RAMAIS_API_URL}?token=${TOKEN}&page=0`);
  if (!response.ok) throw new Error("Erro ao buscar ramais");
  const data: ApiResponse = await response.json();
  if (data.status !== "ok" || !data.list?.extens) throw new Error("Resposta inválida da API");
  return Object.values(data.list.extens).sort((a, b) => parseInt(a.exten) - parseInt(b.exten));
}

// ======================== COMPONENT ========================

export function MonitoramentoGeral() {
  // ===== CHAT STATE =====
  const [attendances, setAttendances] = useState<LiveAttendance[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [queueMap, setQueueMap] = useState<Map<string, string>>(new Map());
  const [agentMap, setAgentMap] = useState<Map<string, string>>(new Map());

  const queueMapRef = useRef(queueMap);
  const agentMapRef = useRef(agentMap);
  useEffect(() => { queueMapRef.current = queueMap; }, [queueMap]);
  useEffect(() => { agentMapRef.current = agentMap; }, [agentMap]);

  // ===== TELEFONIA STATE =====
  const [ramalSearch, setRamalSearch] = useState("");
  const [expandedRamais, setExpandedRamais] = useState<Set<string>>(new Set());

  // ===== LOAD CHAT DATA =====
  useEffect(() => {
    (async () => {
      try {
        const [qList, aList] = await Promise.all([fetchQueues(), fetchAgents()]);
        const qm = new Map(qList.map((q) => [q.id, q.name]));
        const am = new Map(aList.map((a) => [a.id, a.name]));
        setQueueMap(qm);
        setAgentMap(am);
      } catch (err) {
        console.warn("Erro ao carregar listas de filas/agentes:", err);
      }
    })();
  }, []);

  const loadChatData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setChatLoading(true);
      setChatError(null);
      const data = await fetchActiveChats();
      const resolved = resolveNames(data, queueMapRef.current, agentMapRef.current);
      setAttendances(resolved);
      setLastUpdate(new Date());
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queueMap.size > 0 || agentMap.size > 0) {
      setAttendances((prev) => prev.length > 0 ? resolveNames(prev.map((a) => ({ ...a })), queueMap, agentMap) : prev);
    }
  }, [queueMap, agentMap]);

  useEffect(() => {
    loadChatData(true);
    const interval = setInterval(() => loadChatData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadChatData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAttendances((prev) => prev.map((a) => ({ ...a, durationSeconds: a.durationSeconds + 1 })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ===== LOAD RAMAIS DATA =====
  const {
    data: ramais = [],
    isLoading: ramaisLoading,
    error: ramaisError,
    refetch: refetchRamais,
    isRefetching: ramaisRefetching,
  } = useQuery({
    queryKey: ["ramais"],
    queryFn: fetchRamais,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  // ===== DERIVED CHAT =====
  const inQueue = attendances.filter((a) => a.phase === "fila");
  const withAgent = attendances.filter((a) => a.phase === "agente");

  const filteredChat = useMemo(() => {
    if (!chatSearch) return attendances;
    const q = chatSearch.toLowerCase();
    return attendances.filter((a) =>
      a.contactName.toLowerCase().includes(q) ||
      a.contactPhone.includes(q) ||
      a.dstName.toLowerCase().includes(q) ||
      a.dst.includes(q)
    );
  }, [attendances, chatSearch]);

  // ===== DERIVED RAMAIS =====
  const filteredRamais = useMemo(() => {
    return ramais
      .filter(
        (r) =>
          r.exten.toLowerCase().includes(ramalSearch.toLowerCase()) ||
          r.name.toLowerCase().includes(ramalSearch.toLowerCase())
      )
      .sort((a, b) => {
        if (a.inuse && !b.inuse) return -1;
        if (!a.inuse && b.inuse) return 1;
        return parseInt(a.exten) - parseInt(b.exten);
      });
  }, [ramais, ramalSearch]);

  const totalRamais = ramais.length;
  const registrados = ramais.filter((r) => r.status === "Reachable" && !r.inuse).length;
  const emUso = ramais.filter((r) => r.inuse).length;
  const naoRegistrados = ramais.filter((r) => r.status === "Unreachable").length;

  function toggleExpand(exten: string) {
    setExpandedRamais((prev) => {
      const next = new Set(prev);
      next.has(exten) ? next.delete(exten) : next.add(exten);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Monitoramento Geral</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão unificada de Chat e Telefonia em tempo real
            {lastUpdate && (
              <span className="ml-2 opacity-60">(atualizado às {lastUpdate.toLocaleTimeString("pt-BR")})</span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => { loadChatData(true); refetchRamais(); }}
          disabled={chatLoading || ramaisLoading}
        >
          <RefreshCw size={13} className={cn((chatLoading || ramaisLoading) && "animate-spin")} />
          Atualizar Tudo
        </Button>
      </div>

      {/* Errors */}
      {(chatError || ramaisError) && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{chatError || (ramaisError as Error)?.message || "Erro ao carregar dados"}</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => { loadChatData(true); refetchRamais(); }}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Two columns with vertical divider */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-5">
        {/* LEFT: CHAT */}
        <div className="space-y-4">
          {/* Chat KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Em Atend.</p>
                    <p className="text-xl font-extrabold tabular-nums text-foreground">{attendances.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fila / Com Agente</p>
                    <p className="text-xl font-extrabold tabular-nums">
                      <span className="text-amber-600 dark:text-amber-400">{inQueue.length}</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{withAgent.length}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Canais</p>
                    <p className="text-xl font-extrabold tabular-nums text-cyan-600 dark:text-cyan-400">
                      {new Set(attendances.map((a) => a.channel)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat List */}
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50 dark:border-white/[0.06]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  Chat · Atendimentos
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{attendances.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px] scrollbar-thin">
                {chatLoading && attendances.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Carregando atendimentos...</p>
                  </div>
                ) : attendances.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User size={18} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-sm">Nenhum atendimento</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30 dark:divide-white/[0.04]">
                    {attendances.map((a) => (
                      <div
                        key={a.id}
                        className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className={cn(
                          "w-1 h-10 rounded-full shrink-0",
                          a.phase === "fila" ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold truncate">{a.contactName}</span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium border-white/10", getChannelColor(a.channel))}>
                              {a.channel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                            <Phone size={10} className="shrink-0" />
                            <span>{a.contactPhone}</span>
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[100px]">
                          <span className="text-[9px] text-muted-foreground/50 font-mono uppercase">{a.phase === "agente" ? "Agente" : "Fila"}</span>
                          {a.phase === "agente" ? (
                            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                              <Headphones size={10} />{a.dstName}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                              <Timer size={10} />{a.dstName || "Aguardando"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
                          <Clock size={10} className={cn(
                            a.durationSeconds > 1800 ? "text-red-400" :
                            a.durationSeconds > 900 ? "text-amber-400" :
                            "text-emerald-400"
                          )} />
                          <span className={cn(
                            "font-semibold",
                            a.durationSeconds > 1800 ? "text-red-400" :
                            a.durationSeconds > 900 ? "text-amber-400" :
                            "text-foreground"
                          )}>
                            {formatDuration(a.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* VERTICAL DIVIDER */}
        <div className="hidden xl:flex items-center justify-center">
          <div className="w-px h-full bg-border/50 dark:bg-white/[0.08] min-h-[500px]" />
        </div>

        {/* RIGHT: TELEFONIA */}
        <div className="space-y-4">
          {/* Telefonia KPI Cards */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-lg font-extrabold text-foreground mt-0.5">{totalRamais}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Registrados</p>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{registrados}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Em Uso</p>
                  <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{emUso}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="text-[9px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Não Reg.</p>
                  <p className="text-lg font-extrabold text-red-600 dark:text-red-400 mt-0.5">{naoRegistrados}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ramais Table */}
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50 dark:border-white/[0.06]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Telefonia · Ramais
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{ramais.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px] scrollbar-thin">
                {ramaisLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Carregando ramais...</p>
                  </div>
                ) : ramais.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <WifiOff className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm">Nenhum ramal</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 dark:border-white/[0.06]">
                        <TableHead className="w-6 p-2" />
                        <TableHead className="w-16 text-muted-foreground font-semibold text-[10px] p-2">Ramal</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-[10px] p-2">Nome</TableHead>
                        <TableHead className="w-24 text-muted-foreground font-semibold text-[10px] p-2">Estado</TableHead>
                        <TableHead className="w-16 text-muted-foreground font-semibold text-[10px] p-2">Cham.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ramais.map((ramal) => {
                        const callEntries = ramal.calllist ? Object.entries(ramal.calllist) : [];
                        const alwaysExpanded = ramal.inuse && callEntries.length > 0;
                        const canCollapse = alwaysExpanded;
                        const isExpanded = alwaysExpanded ? !expandedRamais.has(ramal.exten) : expandedRamais.has(ramal.exten);

                        return (
                          <>
                            <TableRow
                              key={ramal.exten}
                              className={cn(
                                "text-xs border-border/30 dark:border-white/[0.04] transition-colors",
                                canCollapse ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/30",
                                isExpanded && "bg-amber-500/[0.03]"
                              )}
                              onClick={() => canCollapse && toggleExpand(ramal.exten)}
                            >
                              <TableCell className="p-2">
                                {canCollapse ? (
                                  isExpanded
                                    ? <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
                                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                ) : <span />}
                              </TableCell>
                              <TableCell className="font-mono text-[11px] font-semibold text-foreground p-2">{ramal.exten}</TableCell>
                              <TableCell className="font-semibold text-foreground text-[11px] p-2 truncate max-w-[140px]">{ramal.name}</TableCell>
                              <TableCell className="p-2">
                                {ramal.status === "Unreachable" ? (
                                  <Badge variant="outline" className="gap-1 font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                                    <WifiOff className="w-3 h-3" />Não Reg.
                                  </Badge>
                                ) : ramal.inuse ? (
                                  <Badge variant="outline" className="gap-1 font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                    <PhoneCall className="w-3 h-3" />Em Uso
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1 font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                    <Wifi className="w-3 h-3" />Registrado
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-[11px] p-2">{ramal.calls ?? 0}</TableCell>
                            </TableRow>

                            {isExpanded && callEntries.length > 0 && (
                              <TableRow className="bg-amber-500/[0.02]">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="px-4 py-2">
                                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                                      <PhoneCall className="w-3 h-3" />
                                      Chamadas ativas — {ramal.name}
                                    </p>
                                    <div className="rounded-lg border border-border/40 dark:border-white/[0.06] overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="border-border/30 dark:border-white/[0.04] bg-muted/30">
                                            <TableHead className="text-[9px] text-muted-foreground font-semibold p-2">Origem</TableHead>
                                            <TableHead className="text-[9px] text-muted-foreground font-semibold p-2">Destino</TableHead>
                                            <TableHead className="text-[9px] text-muted-foreground font-semibold p-2">Estado</TableHead>
                                            <TableHead className="text-[9px] text-muted-foreground font-semibold p-2">Tipo</TableHead>
                                            <TableHead className="text-[9px] text-muted-foreground font-semibold p-2">Duração</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {callEntries.map(([callId, call]) => (
                                            <TableRow key={callId} className="text-[10px] border-border/20 dark:border-white/[0.02]">
                                              <TableCell className="font-mono text-[10px] p-2">{call.caller}</TableCell>
                                              <TableCell className="font-mono text-[10px] p-2">{call.called}</TableCell>
                                              <TableCell className="p-2">
                                                <Badge variant="outline" className={cn("text-[9px] px-1 py-0", CALL_STATE_MAP[call.state].color)}>
                                                  {CALL_STATE_MAP[call.state].label}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="p-2">
                                                {call.type === "in" ? (
                                                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                                                    <PhoneIncoming className="w-3 h-3" />Entrada
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400">
                                                    <PhoneOutgoing className="w-3 h-3" />Saída
                                                  </span>
                                                )}
                                              </TableCell>
                                              <TableCell className="p-2 font-mono">{fmtDurationSec(call.duration)}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
