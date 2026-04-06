import type { DashboardState } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  CheckCircle2, Clock, Target, Star, Zap, ArrowRightLeft, Bot, Timer, Shield
} from "lucide-react";
import { fmtMinutes, fmtSeconds, fmtPct, fmtNumber } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend, BarChart as StackedBarChart,
} from "recharts";
import { fmtShortDate, fmtMonthYear } from "@/lib/utils/formatters";

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
  const { executiveSummary: s, dailyTimeSeries, ttrTimeSeries, channelMetrics, qualityMetrics } = dashboard;

  const channelData = channelMetrics.map((c) => ({
    name: c.channel,
    total: c.total,
    sla: Math.round(c.slaCompliancePct),
    csat: Math.round(c.csatPct),
  }));

  const automationData = channelMetrics.map((c) => ({
    name: c.channel,
    "Bot": Math.round(c.automationRate),
    "Humano": Math.round(100 - c.automationRate),
  }));

  const dailySlice = dailyTimeSeries.slice(-30);
  const ttrSlice = ttrTimeSeries.slice(-30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo executivo — atendimentos finalizados no período</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Finalizados"
          value={fmtNumber(s.totalClosed)}
          trend={s.variationPct}
          icon={<CheckCircle2 size={18} />}
          tooltip="Total de atendimentos com status finalizado/fechado/resolvido no período selecionado"
        />
        <MetricCard
          title="TMR Médio"
          value={fmtMinutes(s.ttrMean)}
          subtitle={`Mediana: ${fmtMinutes(s.ttrMedian)} · P90: ${fmtMinutes(s.ttrP90)}`}
          icon={<Clock size={18} />}
          tooltip="Tempo Médio de Resolução (closedAt - openedAt). P90 = percentil 90."
          color="blue"
        />
        <MetricCard
          title="SLA de Resolução"
          value={fmtPct(s.slaCompliancePct)}
          icon={<Target size={18} />}
          tooltip="Percentual de atendimentos encerrados dentro da meta de SLA configurada por canal/fila"
          color={s.slaCompliancePct >= 80 ? "green" : s.slaCompliancePct >= 60 ? "amber" : "red"}
        />
        <MetricCard
          title="FCR"
          value={fmtPct(s.fcrPct)}
          icon={<CheckCircle2 size={18} />}
          tooltip="First Contact Resolution — percentual encerrado sem reabertura nos últimos 7 dias"
          color={s.fcrPct >= 80 ? "green" : "amber"}
        />
        <MetricCard
          title="CSAT"
          value={fmtPct(s.csatPct)}
          icon={<Star size={18} />}
          tooltip="Customer Satisfaction Score — percentual de avaliações positivas (nota ≥ 4)"
          color={s.csatPct >= 75 ? "green" : s.csatPct >= 55 ? "amber" : "red"}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="NPS"
          value={fmtNumber(Math.round(s.nps))}
          icon={<Star size={18} />}
          tooltip="Net Promoter Score = promotores (9-10) - detratores (0-6)"
          color={s.nps >= 50 ? "green" : s.nps >= 0 ? "amber" : "red"}
        />
        <MetricCard
          title="Taxa Automação"
          value={fmtPct(s.automationRate)}
          icon={<Bot size={18} />}
          tooltip="Percentual de atendimentos encerrados sem qualquer intervenção humana"
        />
        <MetricCard
          title="Taxa Transferência"
          value={fmtPct(s.transferRate)}
          icon={<ArrowRightLeft size={18} />}
          tooltip="Percentual de atendimentos com ao menos uma transferência de fila ou agente"
        />
        <MetricCard
          title="Handoff Médio"
          value={fmtSeconds(s.avgHandoffSeconds)}
          icon={<Zap size={18} />}
          tooltip="Tempo médio entre o escalonamento pelo bot e a primeira resposta humana"
        />
        <MetricCard
          title="ACW Médio"
          value={fmtSeconds(s.avgAcwSeconds)}
          icon={<Timer size={18} />}
          tooltip="After Call Work — tempo médio de pós-atendimento registrado pelo agente"
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

        {/* TTR evolution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução do TMR — P50, Média e P90 (min)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ttrSlice}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(l) => `Data: ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="median" name="P50 (Mediana)" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mean" name="Média" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="p90" name="P90" stroke={CHART_COLORS.tertiary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bot vs Human stacked */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolução: Bot vs Humano por Canal (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <StackedBarChart data={automationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Bot" stackId="a" fill={CHART_COLORS.tertiary} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Humano" stackId="a" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </StackedBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* NPS by month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">NPS por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={qualityMetrics.npsByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" tickFormatter={fmtMonthYear} tick={{ fontSize: 10 }} />
              <YAxis domain={[-100, 100]} tick={{ fontSize: 10 }} />
              <RechartTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(l) => `Período: ${fmtMonthYear(l)}`}
              />
              <Line type="monotone" dataKey="nps" name="NPS" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
