import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fmtPct, fmtSeconds, fmtNumber } from "@/lib/utils/formatters";
import { Bot, Zap, ArrowRightLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AutomationProps {
  dashboard: DashboardState;
}

const PIE_COLORS = ["hsl(var(--chart-3))", "hsl(var(--chart-1))", "hsl(var(--chart-2))"];

export function Automation({ dashboard }: AutomationProps) {
  const { automationMetrics: m, executiveSummary: s, closedAttendances } = dashboard;
  const total = m.botOnly + m.humanOnly + m.hybrid;

  const pieData = [
    { name: "Bot (automação total)", value: m.botOnly },
    { name: "Humano (sem bot)", value: m.humanOnly },
    { name: "Híbrido (bot + humano)", value: m.hybrid },
  ];

  const transferData = m.transferByTeam.map((t) => ({ name: t.team, taxa: Math.round(t.rate) }));
  const handoffData = m.handoffByFlow.map((h) => ({ name: h.flow.replace("Fluxo ", ""), avg: Math.round(h.avgSeconds) }));

  const tooltip = { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 } };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Automação</h1>
        <p className="text-sm text-muted-foreground mt-1">Indicadores de automação, handoff e transferência — atendimentos finalizados</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Taxa de Automação"
          value={fmtPct(s.automationRate)}
          subtitle={`${fmtNumber(m.botOnly)} atendimentos somente por bot`}
          icon={<Bot size={18} />}
          tooltip="Percentual de atendimentos encerrados sem intervenção humana"
          color="primary"
        />
        <MetricCard
          title="Handoff Médio"
          value={fmtSeconds(m.avgHandoffSeconds)}
          subtitle="Bot → 1ª resposta humana"
          icon={<Zap size={18} />}
          tooltip="Tempo médio entre o escalonamento do bot e a primeira resposta do agente humano"
        />
        <MetricCard
          title="Taxa de Transferência"
          value={fmtPct(s.transferRate)}
          subtitle="Atendimentos com ≥1 transferência"
          icon={<ArrowRightLeft size={18} />}
          tooltip="Percentual de atendimentos que passaram por ao menos uma transferência de fila ou agente"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição: Bot / Humano / Híbrido</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <RechartTooltip {...tooltip} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Handoff by flow */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Handoff Médio por Fluxo Automatizado (seg)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={handoffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="avg" name="Seg" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transfer by team */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Transferência por Equipe (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={transferData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="taxa" name="% Transferências" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary table */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo de Automação</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Participação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pieData.map((d) => (
                  <TableRow key={d.name} className="text-xs">
                    <TableCell>{d.name}</TableCell>
                    <TableCell className="font-semibold">{fmtNumber(d.value)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{total > 0 ? fmtPct((d.value / total) * 100) : "0%"}</span>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold text-xs">
                  <TableCell>Total</TableCell>
                  <TableCell>{fmtNumber(total)}</TableCell>
                  <TableCell>100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
