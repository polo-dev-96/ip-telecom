import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, LabelList } from "recharts";
import { fmtNumber } from "@/lib/utils/formatters";

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
  const { agentMetrics } = dashboard;

  const chartData = agentMetrics.slice(0, 15).map((a) => ({ name: a.agentName, total: a.total }));
  const chartHeight = Math.max(300, chartData.length * 40);

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
          <p className="text-xs text-muted-foreground">Top 15 agentes por quantidade de atendimentos</p>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" barSize={22} margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} width={130} />
              <RechartTooltip {...tooltipStyle} />
              <Bar dataKey="total" name="Atendimentos" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} fillOpacity={0.85}>
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
                  <TableRow key={a.agentId} className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors">
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
