import type { DashboardState } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  CheckCircle2, Clock, Hourglass, Timer, TrendingUp, TrendingDown, CalendarDays, CalendarRange
} from "lucide-react";
import { fmtMinutes, fmtPct, fmtNumber } from "@/lib/utils/formatters";
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

  const dailySlice = dailyTimeSeries.slice(-30);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
            Visão Geral
          </h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Resumo executivo — atendimentos no período</p>
        </div>
      </div>

      {/* KPI cards - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total de Atendimentos no Período"
          value={fmtNumber(s.totalClosed)}
          trend={s.variationPct}
          icon={<CheckCircle2 size={18} />}
          tooltip="Total de atendimentos finalizados no período selecionado"
        />
        <MetricCard
          title="TMA"
          value={fmtMinutes(s.tmaMean)}
          icon={<Clock size={18} />}
          tooltip="Tempo Médio de Atendimento — duração média do atendimento pelo agente"
          color="primary"
        />
        <MetricCard
          title="TME"
          value={fmtMinutes(s.tmeMean)}
          icon={<Hourglass size={18} />}
          tooltip="Tempo Médio de Espera — tempo médio até a primeira resposta"
          color="warning"
        />
        <MetricCard
          title="TMR"
          value={fmtMinutes(s.tmrMean)}
          icon={<Timer size={18} />}
          tooltip="Tempo Médio de Resolução — tempo total médio de abertura até fechamento"
          color="purple"
        />
        <MetricCard
          title="TMA%"
          value={fmtPct(s.tmaVariationPct)}
          icon={s.tmaVariationPct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          tooltip="Variação percentual do TMA em relação ao período anterior"
          color={s.tmaVariationPct <= 0 ? "success" : "danger"}
        />
      </div>

      {/* KPI cards - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TME%"
          value={fmtPct(s.tmeVariationPct)}
          icon={s.tmeVariationPct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          tooltip="Variação percentual do TME em relação ao período anterior"
          color={s.tmeVariationPct <= 0 ? "success" : "danger"}
        />
        <MetricCard
          title="TMR%"
          value={fmtPct(s.tmrVariationPct)}
          icon={s.tmrVariationPct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          tooltip="Variação percentual do TMR em relação ao período anterior"
          color={s.tmrVariationPct <= 0 ? "success" : "danger"}
        />
        <MetricCard
          title="Média de Atendimentos/Dia"
          value={fmtNumber(Math.round(s.avgPerDay))}
          icon={<CalendarDays size={18} />}
          tooltip="Média de atendimentos finalizados por dia no período"
        />
        <MetricCard
          title="Média de Atendimentos/Mês"
          value={fmtNumber(Math.round(s.avgPerMonth))}
          icon={<CalendarRange size={18} />}
          tooltip="Média de atendimentos finalizados por mês no período"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Daily volume */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              Atendimentos Finalizados por Dia
            </CardTitle>
            <p className="text-xs text-muted-foreground/70">Últimos 30 dias</p>
          </CardHeader>
          <CardContent className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailySlice}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartTooltip
                  contentStyle={{
                    background: "rgba(17, 24, 39, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                  }}
                  labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                  itemStyle={{ color: "#60a5fa", fontWeight: 500 }}
                  labelFormatter={(l) => `Data: ${l}`}
                />
                <Area type="monotone" dataKey="value" name="Finalizados" stroke="none" fill="url(#lineGradient)" />
                <Line type="monotone" dataKey="value" name="Finalizados" stroke={CHART_COLORS.primary} strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: CHART_COLORS.primary }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By channel */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-3/5 pointer-events-none" />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-2 shadow-[0_0_8px_hsl(var(--chart-2))]" />
              Atendimentos Finalizados por Canal
            </CardTitle>
            <p className="text-xs text-muted-foreground/70">Distribuição por canal de atendimento</p>
          </CardHeader>
          <CardContent className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={channelData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
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
                  itemStyle={{ color: "#10b981", fontWeight: 500 }}
                />
                <Bar dataKey="total" name="Total" fill="url(#channelGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="total" position="top" className="fill-foreground text-[10px] font-medium" />
                </Bar>
                <defs>
                  <linearGradient id="channelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={1} />
                    <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Queue */}
        <Card className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-5/5 pointer-events-none" />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-3 shadow-[0_0_8px_hsl(var(--chart-3))]" />
              Atendimentos Finalizados por Fila
            </CardTitle>
            <p className="text-xs text-muted-foreground/70">Top 10 filas por volume de atendimentos</p>
          </CardHeader>
          <CardContent className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={queueData} barSize={32} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
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
                  itemStyle={{ color: "#a855f7", fontWeight: 500 }}
                />
                <Bar dataKey="total" name="Total" fill="url(#queueGradient)" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="total" position="right" className="fill-foreground text-[10px] font-medium" />
                </Bar>
                <defs>
                  <linearGradient id="queueGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CHART_COLORS.tertiary} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={CHART_COLORS.tertiary} stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly peaks */}
        <Card className="xl:col-span-2 relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 via-transparent to-chart-5/5 pointer-events-none" />
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-4 shadow-[0_0_8px_hsl(var(--chart-4))]" />
              Picos de Atendimentos
            </CardTitle>
            <p className="text-xs text-muted-foreground/70">Distribuição por hora do dia</p>
          </CardHeader>
          <CardContent className="relative">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={hourlyPeaks}>
                <defs>
                  <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartTooltip
                  contentStyle={{
                    background: "rgba(17, 24, 39, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                  }}
                  labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                  itemStyle={{ color: "#f59e0b", fontWeight: 500 }}
                  labelFormatter={(l) => `Horário: ${l}`}
                />
                <Area type="monotone" dataKey="total" name="Atendimentos" stroke={CHART_COLORS.accent} strokeWidth={3} fill="url(#peakGradient)" activeDot={{ r: 6, strokeWidth: 0, fill: CHART_COLORS.accent }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
