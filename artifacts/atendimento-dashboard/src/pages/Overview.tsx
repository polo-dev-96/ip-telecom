import type { DashboardState } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  CheckCircle2, Clock, Hourglass, Timer, TrendingUp, TrendingDown, CalendarDays, CalendarRange
} from "lucide-react";
import { fmtMinutes, fmtPct, fmtNumber } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer,
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
  const { executiveSummary: s, dailyTimeSeries, channelMetrics, hourlyPeaks } = dashboard;

  const channelData = channelMetrics.map((c) => ({
    name: c.channel,
    total: c.total,
  }));

  const dailySlice = dailyTimeSeries.slice(-30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo executivo — atendimentos no período</p>
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
          color="blue"
        />
        <MetricCard
          title="TME"
          value={fmtMinutes(s.tmeMean)}
          icon={<Hourglass size={18} />}
          tooltip="Tempo Médio de Espera — tempo médio até a primeira resposta"
          color="amber"
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
          color={s.tmaVariationPct <= 0 ? "green" : "red"}
        />
      </div>

      {/* KPI cards - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TME%"
          value={fmtPct(s.tmeVariationPct)}
          icon={s.tmeVariationPct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          tooltip="Variação percentual do TME em relação ao período anterior"
          color={s.tmeVariationPct <= 0 ? "green" : "red"}
        />
        <MetricCard
          title="TMR%"
          value={fmtPct(s.tmrVariationPct)}
          icon={s.tmrVariationPct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          tooltip="Variação percentual do TMR em relação ao período anterior"
          color={s.tmrVariationPct <= 0 ? "green" : "red"}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Daily volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Finalizados por Dia (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailySlice}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(l) => `Data: ${l}`}
                />
                <Line type="monotone" dataKey="value" name="Finalizados" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By channel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Finalizados por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="total" name="Total" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly peaks */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Picos de Atendimentos — Distribuição por Hora do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyPeaks}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(l) => `Horário: ${l}`}
                />
                <defs>
                  <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="total" name="Atendimentos" stroke={CHART_COLORS.accent} strokeWidth={2} fill="url(#peakGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
