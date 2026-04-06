import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer } from "recharts";
import { fmtPct, fmtMinutes, fmtNumber } from "@/lib/utils/formatters";

interface AgentsProps {
  dashboard: DashboardState;
}

export function Agents({ dashboard }: AgentsProps) {
  const { agentMetrics } = dashboard;

  const top10 = agentMetrics.slice(0, 10);
  const csatData = [...agentMetrics]
    .sort((a, b) => b.csatPct - a.csatPct)
    .slice(0, 10)
    .map((a) => ({ name: a.agentName.split(" ")[0], csat: Math.round(a.csatPct) }));

  const tooltip = { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 } };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agentes</h1>
        <p className="text-sm text-muted-foreground mt-1">Desempenho por agente — apenas atendimentos finalizados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top 10 por Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top10.map((a) => ({ name: a.agentName.split(" ")[0], total: a.total }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="total" name="Atendimentos" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CSAT por Agente (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={csatData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="csat" name="CSAT %" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full ranking table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ranking de Agentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>TMR Médio</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>FCR</TableHead>
                  <TableHead>Taxa Transf.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentMetrics.map((a, i) => (
                  <TableRow key={a.agentId} className="text-xs">
                    <TableCell className="text-muted-foreground font-mono">{i + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{a.agentName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{a.team}</Badge>
                    </TableCell>
                    <TableCell>{fmtNumber(a.total)}</TableCell>
                    <TableCell>{fmtMinutes(a.ttrMean)}</TableCell>
                    <TableCell>
                      <span className={a.slaCompliancePct >= 80 ? "text-emerald-600 dark:text-emerald-400 font-medium" : a.slaCompliancePct >= 60 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                        {fmtPct(a.slaCompliancePct)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={a.csatPct >= 75 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-amber-600 dark:text-amber-400 font-medium"}>
                        {fmtPct(a.csatPct)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={a.fcrPct >= 80 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-amber-600 dark:text-amber-400 font-medium"}>
                        {fmtPct(a.fcrPct)}
                      </span>
                    </TableCell>
                    <TableCell>{fmtPct(a.transferRate)}</TableCell>
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
