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
  ResponsiveContainer,
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Headphones size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Atendimento</p>
                <p className="text-2xl font-bold">{attendances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Timer size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aguardando na Fila</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inQueue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Com Agente</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{withAgent.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Canais Ativos</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Set(attendances.map((a) => a.channel)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading state */}
      {loading && attendances.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Carregando atendimentos...</p>
        </div>
      )}

      {/* Attendance list */}
      {(!loading || attendances.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Atendimentos em Andamento ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              <div className="divide-y">
                {filtered.length === 0 && (
                  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                    Nenhum atendimento encontrado
                  </div>
                )}
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Status indicator */}
                    <div className={cn(
                      "w-1 h-12 rounded-full shrink-0",
                      a.phase === "fila" ? "bg-amber-500" : "bg-emerald-500"
                    )} />

                    {/* Contact info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <User size={13} className="text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{a.contactName}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getChannelColor(a.channel))}>
                          {a.channel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone size={11} className="shrink-0" />
                        <span>{a.contactPhone}</span>
                      </div>
                    </div>

                    {/* Destino: Agente ou Fila */}
                    <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[160px]">
                      <span className="text-xs text-muted-foreground font-mono">{a.dst}</span>
                      {a.phase === "agente" ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Headphones size={11} />
                          {a.dstName}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Timer size={11} />
                          {a.dstName || "Aguardando na fila"}
                        </span>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[90px]">
                      <div className="flex items-center gap-1 text-xs font-mono">
                        <Clock size={11} className="text-muted-foreground" />
                        <span className={cn(
                          "font-medium",
                          a.durationSeconds > 1800 ? "text-red-600 dark:text-red-400" :
                          a.durationSeconds > 900 ? "text-amber-600 dark:text-amber-400" :
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos por Agente (tempo real)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(180, agentChartData.length * 36)}>
              <BarChart data={agentChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={130}
                />
                <RechartTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`${value} atendimento${value !== 1 ? "s" : ""}`, "Total"]}
                />
                <Bar dataKey="total" name="Atendimentos" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
