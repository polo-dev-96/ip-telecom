import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import type { DashboardState } from "@/hooks/useDashboard";
import { fetchAgents } from "@/data/api/activeChats";
import {
  fetchCalls,
  withoutCanceled,
  fmtDuration,
  computeAgentMetrics,
  type AgentTelefoniaMetrics,
  type CallRecord,
  CALL_STATUS_MAP,
} from "@/lib/telefonia";
import { AgenteTelefoniaDrawer } from "@/components/telefonia/AgenteTelefoniaDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  ArrowLeft,
  RefreshCw,
  XCircle,
  AlertCircle,
  Clock,
  CalendarDays,
  Phone,
  CheckCircle2,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentesTelefoniaProps {
  dashboard: DashboardState;
}

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

function DirectionBadge({ direction }: { direction: "IN" | "OUT" }) {
  return direction === "IN" ? (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30 font-semibold text-[10px]">
      <PhoneIncoming className="w-3 h-3" /> IN
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/30 font-semibold text-[10px]">
      <PhoneOutgoing className="w-3 h-3" /> OUT
    </Badge>
  );
}

function StatusBadge({ status }: { status: CallRecord["status"] }) {
  const info = CALL_STATUS_MAP[status];
  if (!info) return null;
  return <Badge variant="outline" className={cn("text-[10px] font-semibold", info.color)}>{info.label}</Badge>;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
  bgClass,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-[26px] leading-tight font-extrabold mt-1.5 text-foreground">{value}</p>
          </div>
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", bgClass)}>
            <Icon className={cn("w-5 h-5", iconClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentesTelefonia({ dashboard }: AgentesTelefoniaProps) {
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

  const agentQueuesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const agent of agentList) {
      if (agent.queues && agent.queues.length > 0) {
        map.set(agent.id, agent.queues.map((q) => q.queue));
      }
    }
    return map;
  }, [agentList]);

  const agentMap = useMemo(
    () => new Map(agentList.map((a) => [a.id, a.name])),
    [agentList]
  );

  const calls = useMemo(() => {
    const cleaned = withoutCanceled(rawCalls);
    
    // Apply queue restrictions
    if (user?.restrictTelefoniaQueues && user.allowedTelefoniaQueues && user.allowedTelefoniaQueues.length > 0) {
      return cleaned.filter((c) => {
        if (!c.agent || c.agent === "-" || c.agent === "") return false;
        const agentQueueIds = agentQueuesMap.get(c.agent);
        if (!agentQueueIds) return false;
        return agentQueueIds.some((qid) => user.allowedTelefoniaQueues!.includes(qid));
      });
    } else if (user?.restrictTelefoniaQueues) {
      return [];
    }
    
    return cleaned;
  }, [rawCalls, user, agentQueuesMap]);

  const agentMetrics = useMemo(
    () => computeAgentMetrics(calls, agentMap),
    [calls, agentMap]
  );

  const [selectedAgent, setSelectedAgent] = useState<AgentTelefoniaMetrics | null>(null);

  const chartData = agentMetrics.slice(0, 15).map((a) => ({
    name: a.agentName,
    total: a.total,
  }));
  const chartHeight = Math.max(300, chartData.length * 40);

  if (selectedAgent) {
    const recentCalls = selectedAgent.calls
      .slice()
      .sort((a, b) => b.start.localeCompare(a.start))
      .slice(0, 100);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)} className="h-8 gap-1.5 text-xs">
            <ArrowLeft size={14} />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{selectedAgent.agentName}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{selectedAgent.total} chamadas no período</p>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Total" value={selectedAgent.total} icon={Phone} iconClass="text-primary" bgClass="bg-primary/10 dark:bg-primary/15" />
          <KpiCard label="Completadas" value={selectedAgent.completadas} icon={CheckCircle2} iconClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-500/10" />
          <KpiCard label="Abandonadas" value={selectedAgent.abandonadas} icon={PhoneMissed} iconClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-500/10" />
          <KpiCard label="Duração Média" value={fmtDuration(Math.round(selectedAgent.avgDuration))} icon={Clock} iconClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-500/10" />
          <KpiCard label="Entrada" value={selectedAgent.entradas} icon={PhoneIncoming} iconClass="text-[hsl(var(--chart-2))]" bgClass="bg-[hsl(var(--chart-2))]/10" />
          <KpiCard label="Saída" value={selectedAgent.saidas} icon={PhoneOutgoing} iconClass="text-[hsl(var(--chart-1))]" bgClass="bg-[hsl(var(--chart-1))]/10" />
          <KpiCard label="Média/Dia" value={selectedAgent.callsPerDay.toFixed(1)} icon={CalendarDays} iconClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-500/10" />
          <KpiCard label="Média/Mês" value={Math.round(selectedAgent.callsPerMonth)} icon={CalendarDays} iconClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-500/10" />
        </div>

        {/* Calls table */}
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-chart-1" />
              Chamadas do Agente
            </CardTitle>
            <p className="text-xs text-muted-foreground">Mostrando {Math.min(recentCalls.length, 100)} chamadas</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 dark:border-white/[0.06]">
                    <TableHead className="text-muted-foreground font-semibold text-xs">Origem</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Destino</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Direção</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Tipo</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Tronco</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Status</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs whitespace-nowrap">Início</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Duração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.map((c) => (
                    <TableRow key={c.callid} className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs text-foreground/90">{c.source}</TableCell>
                      <TableCell className="font-mono text-xs text-foreground/90">{c.destination}</TableCell>
                      <TableCell><DirectionBadge direction={c.direction} /></TableCell>
                      <TableCell className="text-foreground/80">{c.type}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{c.trunk || "—"}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="whitespace-nowrap text-foreground/80">{c.start}</TableCell>
                      <TableCell className="whitespace-nowrap text-foreground">{fmtDuration(Number(c.duration))}</TableCell>
                    </TableRow>
                  ))}
                  {recentCalls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                        Nenhuma chamada encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agentes · Telefonia</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Desempenho por agente — chamadas do período</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-2 shrink-0">
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {rangeExceeded && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>O intervalo selecionado excede 30 dias. Reduza o período no filtro acima.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-foreground font-medium">Carregando...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <XCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground font-medium">Erro ao carregar dados</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardHeader className="pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
                <span className="w-2 h-2 rounded-full bg-chart-1" />
                Volume por Agente
              </CardTitle>
              <p className="text-xs text-muted-foreground">Top {Math.min(15, chartData.length)} agentes — clique para ver detalhes</p>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barSize={22}
                  margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />
                  <RechartTooltip {...tooltipStyle} />
                  <Bar
                    dataKey="total"
                    name="Chamadas"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 6, 6, 0]}
                    fillOpacity={0.85}
                    className="cursor-pointer"
                    onClick={(_: unknown, index: number) => {
                      const a = agentMetrics[index];
                      if (a) setSelectedAgent(a);
                    }}
                  >
                    <LabelList dataKey="total" position="right" className="fill-foreground text-[10px] font-semibold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ranking table */}
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardHeader className="pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
                <span className="w-2 h-2 rounded-full bg-chart-3" />
                Ranking de Agentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 dark:border-white/[0.06]">
                      <TableHead className="text-muted-foreground font-semibold text-xs">#</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs">Agente</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs">Total</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs">Completadas</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs">Abandonadas</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs whitespace-nowrap">Dur. Média</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs">Entrada</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs">Saída</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentMetrics.map((a, i) => (
                      <TableRow
                        key={a.agentId + a.agentName}
                        className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedAgent(a)}
                      >
                        <TableCell className="text-muted-foreground font-mono font-semibold w-8">{i + 1}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap text-foreground">{a.agentName}</TableCell>
                        <TableCell className="font-bold text-foreground">{a.total}</TableCell>
                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-semibold">{a.completadas}</TableCell>
                        <TableCell className="text-amber-600 dark:text-amber-400 font-semibold">{a.abandonadas}</TableCell>
                        <TableCell className="whitespace-nowrap text-blue-600 dark:text-blue-400 font-semibold">{fmtDuration(Math.round(a.avgDuration))}</TableCell>
                        <TableCell className="text-foreground/80">{a.entradas}</TableCell>
                        <TableCell className="text-foreground/80">{a.saidas}</TableCell>
                      </TableRow>
                    ))}
                    {agentMetrics.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                          Nenhum agente encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
