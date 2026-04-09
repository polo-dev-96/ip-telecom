import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone, Clock, User, Users, MessageSquare, Headphones, Timer, Activity, Search,
  RefreshCw, AlertCircle, Loader2,
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

  const [queueMap, setQueueMap] = useState<Map<string, string>>(new Map());
  const [agentMap, setAgentMap] = useState<Map<string, string>>(new Map());

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
      const resolved = resolveNames(data, queueMap, agentMap);
      setAttendances(resolved);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [queueMap, agentMap]);

  // Initial load + 60s refresh
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">Em Atendimento</p>
                <p className="text-3xl font-bold number-display tabular-nums tracking-tight">{attendances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
          <CardContent className="relative p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                <Timer size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">Aguardando na Fila</p>
                <p className="text-3xl font-bold number-display tabular-nums tracking-tight text-amber-400">{inQueue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Agent */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
          <CardContent className="relative p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <Users size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">Com Agente</p>
                <p className="text-3xl font-bold number-display tabular-nums tracking-tight text-emerald-400">{withAgent.length}</p>
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
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">Canais Ativos</p>
                <p className="text-3xl font-bold number-display tabular-nums tracking-tight text-cyan-400">
                  {new Set(attendances.map((a) => a.channel)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Attendance list - Premium */}
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
                    {/* Status indicator with glow */}
                    <div className={cn(
                      "w-1 h-14 rounded-full shrink-0 shadow-[0_0_10px]",
                      a.phase === "fila"
                        ? "bg-amber-500 shadow-amber-500/30"
                        : "bg-emerald-500 shadow-emerald-500/30"
                    )} />

                    {/* Contact info */}
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

                    {/* Destino: Agente ou Fila */}
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

                    {/* Duration */}
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

      {/* Agent volume chart - Premium */}
      {agentChartData.length > 0 && (
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-1/5 pointer-events-none" />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-3 shadow-[0_0_8px_hsl(var(--chart-3))]" />
              Atendimentos por Agente
            </CardTitle>
            <p className="text-xs text-muted-foreground/70">Top agentes em tempo real</p>
          </CardHeader>
          <CardContent className="relative">
            <ResponsiveContainer width="100%" height={Math.max(200, agentChartData.length * 40)}>
              <BarChart data={agentChartData} layout="vertical" margin={{ left: 10, right: 20 }} barSize={24}>
                <defs>
                  <linearGradient id="agentGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={130} axisLine={false} tickLine={false} />
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
                  itemStyle={{ color: "#8b5cf6", fontWeight: 500 }}
                  formatter={(value: number) => [`${value} atendimento${value !== 1 ? "s" : ""}`, "Total"]}
                />
                <Bar dataKey="total" name="Atendimentos" fill="url(#agentGradient)" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="total" position="right" className="fill-foreground text-[10px] font-medium" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
