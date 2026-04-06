import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LineChart, Line, ComposedChart, Area,
} from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fmtPct, fmtNumber, fmtMonthYear } from "@/lib/utils/formatters";
import { Star, RefreshCw, CheckCircle2, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface QualityProps {
  dashboard: DashboardState;
}

export function Quality({ dashboard }: QualityProps) {
  const { qualityMetrics: q, executiveSummary: s } = dashboard;

  const tooltip = { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 } };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Qualidade e Satisfação</h1>
        <p className="text-sm text-muted-foreground mt-1">CSAT, NPS, FCR, reincidência e qualidade — atendimentos finalizados</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="CSAT"
          value={fmtPct(q.csatPct)}
          icon={<Star size={18} />}
          tooltip="Percentual de avaliações positivas (nota ≥ 4 de 5)"
          color={q.csatPct >= 75 ? "green" : q.csatPct >= 55 ? "amber" : "red"}
        />
        <MetricCard
          title="NPS Médio"
          value={fmtNumber(Math.round(s.nps))}
          icon={<Star size={18} />}
          tooltip="Net Promoter Score = promotores (9-10) - detratores (0-6)"
          color={s.nps >= 50 ? "green" : s.nps >= 0 ? "amber" : "red"}
        />
        <MetricCard
          title="FCR Global"
          value={fmtPct(s.fcrPct)}
          icon={<CheckCircle2 size={18} />}
          tooltip="First Contact Resolution — sem reabertura em 7 dias"
          color={s.fcrPct >= 80 ? "green" : "amber"}
        />
        <MetricCard
          title="Taxa Reincidência"
          value={fmtPct(q.reopenRate)}
          icon={<RefreshCw size={18} />}
          tooltip="Percentual de atendimentos reabertos nos 7 dias seguintes"
          color={q.reopenRate <= 8 ? "green" : q.reopenRate <= 15 ? "amber" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NPS over time */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">NPS por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={q.npsByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tickFormatter={fmtMonthYear} tick={{ fontSize: 10 }} />
                <YAxis domain={[-100, 100]} tick={{ fontSize: 10 }} />
                <RechartTooltip {...tooltip} labelFormatter={(l) => fmtMonthYear(l)} />
                <Line type="monotone" dataKey="nps" name="NPS" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CSAT by channel */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CSAT por Canal (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={q.csatByChannel.map((c) => ({ name: c.channel, csat: Math.round(c.csatPct) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="csat" name="CSAT %" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* FCR by tag */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">FCR por Tema/Tag (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={q.fcrByTag.map((t) => ({ name: t.tag, fcr: Math.round(t.fcrPct) }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="fcr" name="FCR %" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pareto of tags */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pareto de Temas/Tags</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={q.tagPareto.slice(0, 10).map((t) => ({ name: t.tag, count: t.count, cumPct: Math.round(t.cumPct) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={40} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <RechartTooltip {...tooltip} />
                <Bar yAxisId="left" dataKey="count" name="Volume" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumPct" name="% Acumulado" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* CSAT by agent table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">CSAT por Agente (top 10)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>CSAT</TableHead>
                <TableHead>Avaliação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.csatByAgent.map((a, i) => (
                <TableRow key={a.agentName} className="text-xs">
                  <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{a.agentName}</TableCell>
                  <TableCell>
                    <span className={a.csatPct >= 80 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : a.csatPct >= 60 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold"}>
                      {fmtPct(a.csatPct)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      a.csatPct >= 80 ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" :
                      a.csatPct >= 60 ? "border-amber-500 text-amber-700 dark:text-amber-400" :
                      "border-red-500 text-red-700 dark:text-red-400"
                    }>
                      {a.csatPct >= 80 ? "Excelente" : a.csatPct >= 60 ? "Regular" : "Atenção"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
