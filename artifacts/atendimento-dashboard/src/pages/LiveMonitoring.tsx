import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone, Clock, User, Users, MessageSquare, Headphones, Timer, Activity, Search,
  RefreshCw, AlertCircle, Loader2, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fetchActiveChats, fetchQueues, fetchAgents, resolveNames,
  type LiveAttendance,
} from "@/data/api/activeChats";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LabelList,
} from "recharts";

type SubTab = "acompanhamento" | "filas" | "agentes";

const REFRESH_INTERVAL_MS = 60_000;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  Instagram: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
  Webchat: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Email: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Telegram: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
};

function getChannelColor(channel: string): string {
  return CHANNEL_COLORS[channel] ?? "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
}

export function LiveMonitoring() {
  const [attendances, setAttendances] = useState<LiveAttendance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("acompanhamento");
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const [queueMap, setQueueMap] = useState<Map<string, string>>(new Map());
  const [agentMap, setAgentMap] = useState<Map<string, string>>(new Map());

  // Use refs so loadData doesn't change when maps update
  const queueMapRef = useRef(queueMap);
  const agentMapRef = useRef(agentMap);
  useEffect(() => { queueMapRef.current = queueMap; }, [queueMap]);
  useEffect(() => { agentMapRef.current = agentMap; }, [agentMap]);

  // Load queue and agent lists once on mount
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

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await fetchActiveChats();
      const resolved = resolveNames(data, queueMapRef.current, agentMapRef.current);
      setAttendances(resolved);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-resolve names when maps arrive
  useEffect(() => {
    if (queueMap.size > 0 || agentMap.size > 0) {
      setAttendances((prev) => prev.length > 0 ? resolveNames(prev.map((a) => ({ ...a })), queueMap, agentMap) : prev);
    }
  }, [queueMap, agentMap]);

  // Initial load + 60s refresh (stable — no dependency on maps)
  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  // Tick durations locally every second
  useEffect(() => {
    const interval = setInterval(() => {
      setAttendances((prev) =>
        prev.map((a) => ({
          ...a,
          durationSeconds: a.durationSeconds + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const inQueue = attendances.filter((a) => a.phase === "fila");
  const withAgent = attendances.filter((a) => a.phase === "agente");

  const agentChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of withAgent) {
      const name = a.dstName || a.dst;
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [withAgent]);

  // Queue breakdown — ONLY phase === "fila"
  const queueBreakdown = useMemo(() => {
    const counts: Record<string, { name: string; total: number }> = {};
    for (const a of inQueue) {
      const queueName = a.dstName || a.dst;
      if (!counts[queueName]) counts[queueName] = { name: queueName, total: 0 };
      counts[queueName].total++;
    }
    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [inQueue]);

  const queueAttendances = useMemo(() => {
    if (!selectedQueue) return [];
    return inQueue.filter((a) => (a.dstName || a.dst) === selectedQueue);
  }, [inQueue, selectedQueue]);

  // Agent breakdown — ONLY phase === "agente"
  const agentBreakdown = useMemo(() => {
    const counts: Record<string, { name: string; total: number }> = {};
    for (const a of withAgent) {
      const agentName = a.dstName || a.dst;
      if (!counts[agentName]) counts[agentName] = { name: agentName, total: 0 };
      counts[agentName].total++;
    }
    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [withAgent]);

  const agentAttendances = useMemo(() => {
    if (!selectedAgent) return [];
    return withAgent.filter((a) => (a.dstName || a.dst) === selectedAgent);
  }, [withAgent, selectedAgent]);

  const filtered = useMemo(() => {
    if (!search) return attendances;
    const q = search.toLowerCase();
    return attendances.filter((a) =>
      a.contactName.toLowerCase().includes(q) ||
      a.contactPhone.includes(q) ||
      a.dstName.toLowerCase().includes(q) ||
      a.dst.includes(q)
    );
  }, [attendances, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-primary" />
            Acompanhamento de Atendimentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento em tempo real dos atendimentos em andamento
            {lastUpdate && (
              <span className="ml-2 text-[10px] opacity-60">
                (atualizado às {lastUpdate.toLocaleTimeString("pt-BR")})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contato, agente ou fila..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs w-64 pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => loadData(true)}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => loadData(true)}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Summary cards - Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <CardContent className="relative p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                <Headphones size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/90 font-bold">Em Atendimento</p>
                <p className="text-3xl font-bold number-display tabular-nums tracking-tight">{attendances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue / With Agent - MERGED */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
          <CardContent className="relative p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <Timer size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/90 font-bold">Aguardando na Fila / Com Agente</p>
                <p className="text-3xl font-bold number-display tabular-nums tracking-tight">
                  <span className="text-amber-400">{inQueue.length}</span>
                  <span className="text-muted-foreground/60 mx-1">/</span>
                  <span className="text-emerald-400">{withAgent.length}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
          <CardContent className="relative p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <MessageSquare size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/90 font-bold">Canais Ativos</p>
                <p className="text-3xl font-bold number-display tabular-nums tracking-tight text-cyan-400">
                  {new Set(attendances.map((a) => a.channel)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0">
        <button
          onClick={() => { setSubTab("acompanhamento"); setSelectedQueue(null); setSelectedAgent(null); }}
          className={cn(
            "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2",
            subTab === "acompanhamento"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
          )}
        >
          Acompanhamento
          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-5">LIVE</Badge>
        </button>
        <button
          onClick={() => { setSubTab("filas"); setSelectedQueue(null); setSelectedAgent(null); }}
          className={cn(
            "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2",
            subTab === "filas"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
          )}
        >
          Atendimentos em Fila
        </button>
        <button
          onClick={() => { setSubTab("agentes"); setSelectedQueue(null); setSelectedAgent(null); }}
          className={cn(
            "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2",
            subTab === "agentes"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
          )}
        >
          Atendimento com Agente
        </button>
      </div>

      {/* Loading state - Premium */}
      {loading && attendances.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-primary/10 blur-xl" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Carregando atendimentos...</p>
        </div>
      )}

      {/* ═══ TAB: Acompanhamento ═══ */}
      {subTab === "acompanhamento" && (
        <>
          {/* Attendance list */}
          {(!loading || attendances.length > 0) && (
            <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative pb-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </span>
                    Atendimentos em Andamento
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {filtered.length}
                    </span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative p-0">
                <ScrollArea className="h-[480px] scrollbar-thin">
                  <div className="divide-y divide-white/[0.04]">
                    {filtered.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">
                          <User size={20} className="text-muted-foreground/50" />
                        </div>
                        <p className="text-sm">Nenhum atendimento encontrado</p>
                      </div>
                    )}
                    {filtered.map((a) => (
                      <div
                        key={a.id}
                        className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-all duration-200"
                      >
                        <div className={cn(
                          "w-1 h-14 rounded-full shrink-0 shadow-[0_0_10px]",
                          a.phase === "fila"
                            ? "bg-amber-500 shadow-amber-500/30"
                            : "bg-emerald-500 shadow-emerald-500/30"
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold truncate">{a.contactName}</span>
                            <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-medium border-white/10", getChannelColor(a.channel))}>
                              {a.channel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                            <Phone size={11} className="shrink-0" />
                            <span>{a.contactPhone}</span>
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-1 min-w-[160px]">
                          <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">{a.phase === "agente" ? "Agente" : "Fila"}</span>
                          {a.phase === "agente" ? (
                            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                              <Headphones size={12} />
                              {a.dstName}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                              <Timer size={12} />
                              {a.dstName || "Aguardando"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[90px]">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Clock size={11} className={cn(
                              a.durationSeconds > 1800 ? "text-red-400" :
                              a.durationSeconds > 900 ? "text-amber-400" :
                              "text-emerald-400"
                            )} />
                            <span className={cn(
                              "font-semibold number-display",
                              a.durationSeconds > 1800 ? "text-red-400" :
                              a.durationSeconds > 900 ? "text-amber-400" :
                              "text-foreground"
                            )}>
                              {formatDuration(a.durationSeconds)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Agent volume chart */}
          {agentChartData.length > 0 && (
            <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 via-transparent to-slate-500/5 pointer-events-none" />
              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]" />
                  Atendimentos por Agente
                </CardTitle>
                <p className="text-xs text-muted-foreground/70">Top agentes em tempo real</p>
              </CardHeader>
              <CardContent className="relative">
                <ResponsiveContainer width="100%" height={Math.max(200, agentChartData.length * 40)}>
                  <BarChart data={agentChartData} layout="vertical" margin={{ left: 10, right: 20 }} barSize={24}>
                    <defs>
                      <linearGradient id="agentGradientNeutral" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 600 }} width={130} axisLine={false} tickLine={false} />
                    <RechartTooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                      contentStyle={{
                        background: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                      }}
                      labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                      itemStyle={{ color: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                      formatter={(value: number) => [`${value} atendimento${value !== 1 ? "s" : ""}`, "Total"]}
                    />
                    <Bar dataKey="total" name="Atendimentos" fill="url(#agentGradientNeutral)" radius={[0, 6, 6, 0]}>
                      <LabelList dataKey="total" position="right" className="fill-foreground text-[10px] font-medium" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ═══ TAB: Atendimentos em Fila ═══ */}
      {subTab === "filas" && !selectedQueue && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {queueBreakdown.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Timer size={32} className="text-muted-foreground/30" />
              <p className="text-sm">Nenhum atendimento em fila no momento</p>
            </div>
          )}
          {queueBreakdown.map((q) => (
            <Card
              key={q.name}
              onClick={() => setSelectedQueue(q.name)}
              className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg group cursor-pointer hover:border-primary/30 hover:shadow-primary/10 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                      <Timer size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{q.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">atendimentos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">{q.total}</span>
                    <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ TAB: Filas → Detalhe de uma fila selecionada ═══ */}
      {subTab === "filas" && selectedQueue && (
        <>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedQueue(null)} className="h-8 gap-1.5 text-xs">
              ← Voltar
            </Button>
            <h2 className="text-lg font-bold">{selectedQueue}</h2>
            <Badge variant="outline" className="text-xs">{queueAttendances.length} atendimento{queueAttendances.length !== 1 ? "s" : ""}</Badge>
          </div>
          <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-lg">
            <CardContent className="relative p-0">
              <ScrollArea className="h-[500px] scrollbar-thin">
                <div className="divide-y divide-white/[0.04]">
                  {queueAttendances.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                      <User size={20} className="text-muted-foreground/50" />
                      <p className="text-sm">Nenhum atendimento nesta fila</p>
                    </div>
                  )}
                  {queueAttendances.map((a) => (
                    <div
                      key={a.id}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-all duration-200"
                    >
                      <div className="w-1 h-14 rounded-full shrink-0 shadow-[0_0_10px] bg-amber-500 shadow-amber-500/30" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold truncate">{a.contactName}</span>
                          <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-medium border-white/10", getChannelColor(a.channel))}>
                            {a.channel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                          <Phone size={11} className="shrink-0" />
                          <span>{a.contactPhone}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1 min-w-[160px]">
                        <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">Fila</span>
                        <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                          <Timer size={12} />
                          {a.dstName || "Aguardando"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[90px]">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Clock size={11} className={cn(
                            a.durationSeconds > 1800 ? "text-red-400" :
                            a.durationSeconds > 900 ? "text-amber-400" :
                            "text-emerald-400"
                          )} />
                          <span className={cn(
                            "font-semibold number-display",
                            a.durationSeconds > 1800 ? "text-red-400" :
                            a.durationSeconds > 900 ? "text-amber-400" :
                            "text-foreground"
                          )}>
                            {formatDuration(a.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══ TAB: Atendimento com Agente ═══ */}
      {subTab === "agentes" && !selectedAgent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agentBreakdown.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Headphones size={32} className="text-muted-foreground/30" />
              <p className="text-sm">Nenhum atendimento com agente no momento</p>
            </div>
          )}
          {agentBreakdown.map((ag) => (
            <Card
              key={ag.name}
              onClick={() => setSelectedAgent(ag.name)}
              className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg group cursor-pointer hover:border-emerald-500/30 hover:shadow-emerald-500/10 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Headphones size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{ag.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">atendimentos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums text-emerald-400">{ag.total}</span>
                    <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ TAB: Agentes → Detalhe de um agente selecionado ═══ */}
      {subTab === "agentes" && selectedAgent && (
        <>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)} className="h-8 gap-1.5 text-xs">
              ← Voltar
            </Button>
            <h2 className="text-lg font-bold">{selectedAgent}</h2>
            <Badge variant="outline" className="text-xs">{agentAttendances.length} atendimento{agentAttendances.length !== 1 ? "s" : ""}</Badge>
          </div>
          <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-lg">
            <CardContent className="relative p-0">
              <ScrollArea className="h-[500px] scrollbar-thin">
                <div className="divide-y divide-white/[0.04]">
                  {agentAttendances.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                      <User size={20} className="text-muted-foreground/50" />
                      <p className="text-sm">Nenhum atendimento com este agente</p>
                    </div>
                  )}
                  {agentAttendances.map((a) => (
                    <div
                      key={a.id}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-all duration-200"
                    >
                      <div className="w-1 h-14 rounded-full shrink-0 shadow-[0_0_10px] bg-emerald-500 shadow-emerald-500/30" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold truncate">{a.contactName}</span>
                          <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-medium border-white/10", getChannelColor(a.channel))}>
                            {a.channel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                          <Phone size={11} className="shrink-0" />
                          <span>{a.contactPhone}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1 min-w-[160px]">
                        <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">Agente</span>
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                          <Headphones size={12} />
                          {a.dstName}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[90px]">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Clock size={11} className={cn(
                            a.durationSeconds > 1800 ? "text-red-400" :
                            a.durationSeconds > 900 ? "text-amber-400" :
                            "text-emerald-400"
                          )} />
                          <span className={cn(
                            "font-semibold number-display",
                            a.durationSeconds > 1800 ? "text-red-400" :
                            a.durationSeconds > 900 ? "text-amber-400" :
                            "text-foreground"
                          )}>
                            {formatDuration(a.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
