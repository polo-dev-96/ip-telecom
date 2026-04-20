import { useState, useMemo } from "react";
import type { DashboardState } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  CheckCircle2, Clock, Hourglass, CalendarDays, CalendarRange, ArrowLeft
} from "lucide-react";
import { fmtMinutes, fmtNumber } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LabelList,
} from "recharts";
import { fmtShortDate } from "@/lib/utils/formatters";

interface OverviewProps {
  dashboard: DashboardState;
}

const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  accent: "hsl(var(--chart-4))",
};

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

export function Overview({ dashboard }: OverviewProps) {
  const { executiveSummary: s, dailyTimeSeries, channelMetrics, queueMetrics, agentMetrics, hourlyPeaks, closedAttendances } = dashboard;
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const queueData = queueMetrics.slice(0, 10).map((q) => ({
    name: q.queue,
    total: q.total,
  }));

  const channelData = channelMetrics.map((c) => ({
    name: c.channel,
    total: c.total,
  }));

  const agentData = agentMetrics.slice(0, 10).map((a) => ({
    name: a.agentName,
    total: a.total,
  }));

  const dailyData = dailyTimeSeries;

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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumo executivo — atendimentos no período</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Total de Atendimentos"
          value={fmtNumber(s.totalClosed)}
          trend={s.variationPct}
          icon={<CheckCircle2 size={20} />}
          tooltip="Total de atendimentos finalizados no período selecionado"
        />
        <MetricCard
          title="TMA"
          value={fmtMinutes(s.tmaMean)}
          icon={<Clock size={20} />}
          tooltip="Tempo Médio de Atendimento — duração média do atendimento pelo agente"
          color="primary"
        />
        <MetricCard
          title="TME"
          value={fmtMinutes(s.tmeMean)}
          icon={<Hourglass size={20} />}
          tooltip="Tempo Médio de Espera — tempo médio até a primeira resposta"
          color="warning"
        />
        <MetricCard
          title="Média / Dia"
          value={fmtNumber(Math.round(s.avgPerDay))}
          icon={<CalendarDays size={20} />}
          tooltip="Média de atendimentos finalizados por dia no período"
          color="purple"
        />
        <MetricCard
          title="Média / Mês"
          value={fmtNumber(Math.round(s.avgPerMonth))}
          icon={<CalendarRange size={20} />}
          tooltip="Média de atendimentos finalizados por mês no período"
          color="success"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* By Queue */}
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Atendimentos por Fila
            </CardTitle>
            <p className="text-xs text-muted-foreground">Top 10 filas por volume</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={Math.max(280, queueData.length * 48)}>
              <BarChart data={queueData} barSize={28} layout="vertical" margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
                <RechartTooltip {...tooltipStyle} />
                <Bar dataKey="total" name="Atendimentos" fill="hsl(var(--destructive))" radius={[0, 6, 6, 0]} fillOpacity={0.85}>
                  <LabelList dataKey="total" position="right" className="fill-foreground text-[10px] font-semibold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Channel */}
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-chart-2" />
              Atendimentos por Canal
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição por canal de atendimento</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData} barSize={48} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartTooltip {...tooltipStyle} />
                <Bar dataKey="total" name="Total" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} fillOpacity={0.85}>
                  <LabelList dataKey="total" position="top" className="fill-foreground text-[10px] font-semibold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Agents */}
        <Card className="xl:col-span-2 rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-chart-1" />
              Volume por Agente
            </CardTitle>
            <p className="text-xs text-muted-foreground">Top 10 agentes por quantidade de atendimentos — clique para ver detalhes</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={Math.max(280, agentData.length * 40)}>
              <BarChart data={agentData} barSize={28} layout="vertical" margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} width={130} />
                <RechartTooltip {...tooltipStyle} />
                <Bar dataKey="total" name="Atendimentos" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} fillOpacity={0.85} className="cursor-pointer" onClick={(_: unknown, index: number) => handleBarClick(agentData[index])}>
                  <LabelList dataKey="total" position="right" className="fill-foreground text-[10px] font-semibold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily volume */}
        <Card className="xl:col-span-2 rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Volume Diário
            </CardTitle>
            <p className="text-xs text-muted-foreground">Atendimentos finalizados por dia no período</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartTooltip {...tooltipStyle} labelFormatter={(l) => `Data: ${l}`} />
                <Area type="monotone" dataKey="value" name="Finalizados" stroke="none" fill="url(#lineGradient)" />
                <Line type="monotone" dataKey="value" name="Finalizados" stroke={CHART_COLORS.primary} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: CHART_COLORS.primary, fill: "hsl(var(--card))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly peaks */}
        <Card className="xl:col-span-2 rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-chart-4" />
              Picos de Atendimentos
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição por hora do dia</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyPeaks}>
                <defs>
                  <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartTooltip {...tooltipStyle} labelFormatter={(l) => `Horário: ${l}`} />
                <Area type="monotone" dataKey="total" name="Atendimentos" stroke={CHART_COLORS.accent} strokeWidth={2.5} fill="url(#peakGradient)" activeDot={{ r: 5, strokeWidth: 2, stroke: CHART_COLORS.accent, fill: "hsl(var(--card))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
