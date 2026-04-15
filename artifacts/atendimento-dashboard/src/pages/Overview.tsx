import type { DashboardState } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  CheckCircle2, Clock, Hourglass, CalendarDays, CalendarRange
} from "lucide-react";
import { fmtMinutes, fmtNumber } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { executiveSummary: s, dailyTimeSeries, channelMetrics, queueMetrics, hourlyPeaks } = dashboard;

  const queueData = queueMetrics.slice(0, 10).map((q) => ({
    name: q.queue,
    total: q.total,
  }));

  const channelData = channelMetrics.map((c) => ({
    name: c.channel,
    total: c.total,
  }));

  const dailyData = dailyTimeSeries;

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
