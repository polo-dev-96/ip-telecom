import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { DashboardState } from "@/hooks/useDashboard";
import { fetchAgents } from "@/data/api/activeChats";
import {
  fetchCalls,
  withoutCanceled,
  fmtDuration,
  CALL_STATUS_MAP,
  computeAgentMetrics,
  type AgentTelefoniaMetrics,
} from "@/lib/telefonia";
import { AgenteTelefoniaDrawer } from "@/components/telefonia/AgenteTelefoniaDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";


const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 },
};

interface TelefoneOverviewProps {
  dashboard: DashboardState;
}

export function TelefoneOverview({ dashboard }: TelefoneOverviewProps) {
  const { user } = useAuth();
  const dateIni = dashboard.filters.dateFrom;
  const dateEnd = dashboard.filters.dateTo;

  const diffDays = useMemo(() => {
    if (!dateIni || !dateEnd) return 0;
    return (new Date(dateEnd).getTime() - new Date(dateIni).getTime()) / (1000 * 60 * 60 * 24);
  }, [dateIni, dateEnd]);

  const rangeExceeded = diffDays > 30;

  const { data: rawCalls = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["telefone-calls", dateIni, dateEnd],
    queryFn: () => fetchCalls(dateIni ?? "", dateEnd ?? ""),
    enabled: !!dateIni && !!dateEnd && !rangeExceeded,
  });

  const { data: agentList = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 5 * 60 * 1000,
  });

  const agentMap = useMemo(
    () => new Map(agentList.map((a) => [a.id, a.name])),
    [agentList]
  );

  // Build set of allowed agent IDs based on user's telefonia queue restrictions
  const allowedAgentIds = useMemo(() => {
    if (!user?.restrictTelefoniaQueues || !user.allowedTelefoniaQueues?.length) return null;
    const allowed = new Set<string>();
    for (const agent of agentList) {
      if (agent.queues?.some((q) => user.allowedTelefoniaQueues!.includes(q.queue))) {
        allowed.add(agent.id);
      }
    }
    return allowed;
  }, [user, agentList]);

  // Exclude canceled calls, then filter by allowed agents if restriction is set
  const calls = useMemo(() => {
    const filtered = withoutCanceled(rawCalls);
    if (!allowedAgentIds) return filtered;
    return filtered.filter((c) => !c.agent || allowedAgentIds.has(c.agent));
  }, [rawCalls, allowedAgentIds]);

  const inCalls = useMemo(() => calls.filter((c) => c.direction === "IN"), [calls]);
  const outCalls = useMemo(() => calls.filter((c) => c.direction === "OUT"), [calls]);

  function dirMetrics(subset: typeof calls) {
    const total = subset.length;
    const completadas = subset.filter((c) => c.status === "2").length;
    const abandonadas = subset.filter((c) => c.status === "1").length;
    const durations = subset
      .filter((c) => c.status === "2")
      .map((c) => Number(c.duration))
      .filter((d) => !isNaN(d) && d > 0);
    const avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return { total, completadas, abandonadas, avgDuration };
  }

  const inMetrics = useMemo(() => dirMetrics(inCalls), [inCalls]);
  const outMetrics = useMemo(() => dirMetrics(outCalls), [outCalls]);

  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; total: number; completadas: number; abandonadas: number }> = {};
    calls.forEach((c) => {
      const day = c.start?.slice(0, 10) ?? "?";
      if (!map[day]) map[day] = { date: day, total: 0, completadas: 0, abandonadas: 0 };
      map[day].total++;
      if (c.status === "2") map[day].completadas++;
      if (c.status === "1") map[day].abandonadas++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [calls]);

  const allAgentMetrics = useMemo(
    () => computeAgentMetrics(calls, agentMap),
    [calls, agentMap]
  );

  const agentData = useMemo(
    () => allAgentMetrics.slice(0, 10).map((a) => ({ agent: a.agentName, total: a.total })),
    [allAgentMetrics]
  );

  const [drawerAgent, setDrawerAgent] = useState<AgentTelefoniaMetrics | null>(null);

  const directionData = [
    { name: "Entrada", value: inCalls.length, fill: "hsl(var(--chart-2))" },
    { name: "Saída", value: outCalls.length, fill: "hsl(var(--chart-1))" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral · Telefonia</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Histórico de chamadas PABX uTech</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-2 shrink-0">
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {rangeExceeded && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>O intervalo selecionado excede 30 dias. Reduza o período no filtro acima para carregar os dados.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-foreground font-medium">Carregando chamadas...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <XCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground font-medium">Erro ao carregar chamadas</p>
          <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          {/* KPI Groups: Entrada + Saída */}
          {[
            {
              label: "Entrada",
              icon: PhoneIncoming,
              iconColor: "text-[hsl(var(--chart-2))]",
              bgColor: "bg-[hsl(var(--chart-2))]/10",
              metrics: inMetrics,
            },
            {
              label: "Saída",
              icon: PhoneOutgoing,
              iconColor: "text-[hsl(var(--chart-1))]",
              bgColor: "bg-[hsl(var(--chart-1))]/10",
              metrics: outMetrics,
            },
          ].map(({ label, icon: DirIcon, iconColor, bgColor, metrics: m }) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center gap-2">
                <DirIcon className={cn("w-4 h-4", iconColor)} />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total {label}</p>
                        <p className="text-[28px] leading-tight font-extrabold mt-2 text-foreground">{m.total}</p>
                      </div>
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bgColor)}>
                        <DirIcon className={cn("w-5 h-5", iconColor)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Completadas</p>
                        <p className="text-[28px] leading-tight font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{m.completadas}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Abandonadas</p>
                        <p className="text-[28px] leading-tight font-extrabold text-amber-600 dark:text-amber-400 mt-2">{m.abandonadas}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center">
                        <PhoneMissed className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Duração Média</p>
                        <p className="text-[22px] leading-tight font-extrabold text-blue-600 dark:text-blue-400 mt-2">{fmtDuration(Math.round(m.avgDuration))}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chamadas por dia */}
            <Card className="lg:col-span-2 rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Chamadas por Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <RechartTooltip {...tooltipStyle} />
                    <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--chart-1))" fill="url(#gradTotal)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="completadas" name="Completadas" stroke="hsl(var(--chart-2))" fill="url(#gradComp)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Entrantes vs Saintes */}
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Direção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={directionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <RechartTooltip {...tooltipStyle} />
                    <Bar dataKey="value" name="Chamadas" radius={[6, 6, 0, 0]}>
                      {directionData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PhoneIncoming className="w-3.5 h-3.5 text-[hsl(var(--chart-2))]" />
                    <span>Entrada: <strong className="text-foreground">{inCalls.length}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PhoneOutgoing className="w-3.5 h-3.5 text-[hsl(var(--chart-1))]" />
                    <span>Saída: <strong className="text-foreground">{outCalls.length}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agentes */}
          {agentData.length > 0 && (
            <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Agentes que Mais Atenderam
                </CardTitle>
                <p className="text-xs text-muted-foreground">Clique em uma barra para ver o detalhe do agente</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, agentData.length * 32)}>
                  <BarChart
                    data={agentData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="agent" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                    <RechartTooltip {...tooltipStyle} />
                    <Bar
                      dataKey="total"
                      name="Chamadas"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 6, 6, 0]}
                      className="cursor-pointer"
                      onClick={(_: unknown, index: number) => {
                        const m = allAgentMetrics[index];
                        if (m) setDrawerAgent(m);
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <AgenteTelefoniaDrawer
            agent={drawerAgent}
            open={drawerAgent !== null}
            onClose={() => setDrawerAgent(null)}
          />

          {/* Status summary (Abandonadas vs Completadas only) */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(CALL_STATUS_MAP).map(([key, { label, color }]) => {
              const count = calls.filter((c) => c.status === key).length;
              const pct = calls.length > 0 ? ((count / calls.length) * 100).toFixed(1) : "0.0";
              return (
                <Card key={key} className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm flex-1 min-w-[160px]">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold mb-2", color)}>{label}</Badge>
                      <p className="text-xl font-extrabold text-foreground">{count}</p>
                      <p className="text-xs text-muted-foreground">{pct}% do total</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
