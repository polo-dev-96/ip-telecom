import { useState, useMemo } from "react";
import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, LabelList } from "recharts";
import { fmtNumber, fmtMinutes } from "@/lib/utils/formatters";
import { Clock, User, ArrowLeft, CalendarDays } from "lucide-react";

interface AgentsProps {
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

export function Agents({ dashboard }: AgentsProps) {
  const { agentMetrics, closedAttendances } = dashboard;
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const chartData = agentMetrics.slice(0, 15).map((a) => ({ name: a.agentName, total: a.total }));
  const chartHeight = Math.max(300, chartData.length * 40);

  const agentDetail = useMemo(() => {
    if (!selectedAgent) return null;

    const agentAttendances = closedAttendances.filter((a) => a.agentName === selectedAgent);
    if (agentAttendances.length === 0) return null;

    const tmaValues = agentAttendances.map((a) => Math.max(a.ttrMinutes - (a.frtMinutes ?? 0), 0));
    const tmeValues = agentAttendances.filter((a) => a.frtMinutes !== null).map((a) => a.frtMinutes!);

    const tmaMean = tmaValues.length > 0 ? tmaValues.reduce((s, v) => s + v, 0) / tmaValues.length : 0;
    const tmeMean = tmeValues.length > 0 ? tmeValues.reduce((s, v) => s + v, 0) / tmeValues.length : 0;

    const dates = agentAttendances.map((a) => a.closedAt.slice(0, 10));
    const uniqueDays = new Set(dates).size;
    const uniqueMonths = new Set(dates.map((d) => d.slice(0, 7))).size;

    const avgPerDay = uniqueDays > 0 ? agentAttendances.length / uniqueDays : 0;
    const avgPerMonth = uniqueMonths > 0 ? agentAttendances.length / uniqueMonths : 0;

    const metric = agentMetrics.find((m) => m.agentName === selectedAgent);

    return {
      name: selectedAgent,
      team: metric?.team ?? "",
      total: agentAttendances.length,
      tmaMean,
      tmeMean,
      avgPerDay,
      avgPerMonth,
      attendances: agentAttendances,
    };
  }, [selectedAgent, closedAttendances, agentMetrics]);

  const handleBarClick = (data: { name: string }) => {
    if (data?.name) setSelectedAgent(data.name);
  };

  if (selectedAgent && agentDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)} className="h-8 gap-1.5 text-xs">
            <ArrowLeft size={14} />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{agentDetail.name}</h1>
              {agentDetail.team && (
                <Badge variant="outline" className="text-[10px] font-medium border-border/60 dark:border-white/10 text-muted-foreground">{agentDetail.team}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{fmtNumber(agentDetail.total)} atendimentos finalizados</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">TMA</p>
                  <p className="text-xl font-extrabold tabular-nums text-foreground">{fmtMinutes(agentDetail.tmaMean)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">TME</p>
                  <p className="text-xl font-extrabold tabular-nums text-foreground">{fmtMinutes(agentDetail.tmeMean)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Média/Dia</p>
                  <p className="text-xl font-extrabold tabular-nums text-foreground">{agentDetail.avgPerDay.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Média/Mês</p>
                  <p className="text-xl font-extrabold tabular-nums text-foreground">{fmtNumber(Math.round(agentDetail.avgPerMonth))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-chart-1" />
              Atendimentos Finalizados
            </CardTitle>
            <p className="text-xs text-muted-foreground">{fmtNumber(agentDetail.total)} atendimentos</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 dark:border-white/[0.06]">
                    <TableHead className="text-muted-foreground font-semibold text-xs">Protocolo</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Canal</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Cliente</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Fila</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Fechamento</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">TMA</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">TME</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentDetail.attendances.slice(0, 100).map((att) => (
                    <TableRow key={att.id} className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs whitespace-nowrap text-foreground/90">{att.protocol}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium">{att.channel}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground/90">{att.customerNameMasked}</TableCell>
                      <TableCell className="text-foreground/90">{att.queue}</TableCell>
                      <TableCell className="whitespace-nowrap text-foreground/90">
                        {new Date(att.closedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-semibold">
                        {fmtMinutes(Math.max(att.ttrMinutes - (att.frtMinutes ?? 0), 0))}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {att.frtMinutes !== null ? fmtMinutes(att.frtMinutes) : <span className="text-foreground/50 italic">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {agentDetail.attendances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Nenhum atendimento encontrado</TableCell>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Agentes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Desempenho por agente — atendimentos finalizados</p>
      </div>

      <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
        <CardHeader className="pb-2 space-y-0">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            Volume por Agente
          </CardTitle>
          <p className="text-xs text-muted-foreground">Top 15 agentes por quantidade de atendimentos — clique para ver detalhes</p>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" barSize={22} margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} width={130} />
              <RechartTooltip {...tooltipStyle} />
              <Bar dataKey="total" name="Atendimentos" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} fillOpacity={0.85} className="cursor-pointer" onClick={(_: unknown, index: number) => handleBarClick(chartData[index])}>
                <LabelList dataKey="total" position="right" className="fill-foreground text-[10px] font-semibold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Full ranking table */}
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
                  <TableHead className="text-muted-foreground font-semibold text-xs">Equipe</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentMetrics.map((a, i) => (
                  <TableRow key={a.agentId} className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedAgent(a.agentName)}>
                    <TableCell className="text-muted-foreground font-mono font-semibold w-10">{i + 1}</TableCell>
                    <TableCell className="font-semibold whitespace-nowrap text-foreground">{a.agentName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium border-border/60 dark:border-white/10 text-muted-foreground">{a.team}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">{fmtNumber(a.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
