import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtPct, fmtMinutes, fmtNumber } from "@/lib/utils/formatters";
import { ChannelBadge, SlaBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";

interface ChannelsProps {
  dashboard: DashboardState;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function Channels({ dashboard }: ChannelsProps) {
  const { channelMetrics } = dashboard;

  const volumeData = channelMetrics.map((c) => ({ name: c.channel, total: c.total }));
  const slaData = channelMetrics.map((c) => ({ name: c.channel, sla: Math.round(c.slaCompliancePct) }));
  const csatData = channelMetrics.map((c) => ({ name: c.channel, csat: Math.round(c.csatPct) }));
  const ttrData = channelMetrics.map((c) => ({ name: c.channel, ttr: Math.round(c.ttrMean) }));

  const tooltip = { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 } };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Canais</h1>
        <p className="text-sm text-muted-foreground mt-1">Comparativo de performance entre canais — apenas atendimentos finalizados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Volume por Canal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="total" name="Atendimentos" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">SLA de Resolução por Canal (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={slaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="sla" name="SLA %" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CSAT por Canal (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={csatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="csat" name="CSAT %" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">TMR Médio por Canal (min)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ttrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="ttr" name="TMR (min)" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rankings table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ranking de Canais</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>TMR Médio</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>CSAT</TableHead>
                <TableHead>Automação</TableHead>
                <TableHead>Taxa Transf.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...channelMetrics].sort((a, b) => b.total - a.total).map((c, i) => (
                <TableRow key={c.channel} className="text-xs">
                  <TableCell className="text-muted-foreground font-mono">{i + 1}</TableCell>
                  <TableCell><ChannelBadge channel={c.channel} /></TableCell>
                  <TableCell className="font-semibold">{fmtNumber(c.total)}</TableCell>
                  <TableCell>{fmtMinutes(c.ttrMean)}</TableCell>
                  <TableCell>
                    <span className={c.slaCompliancePct >= 80 ? "text-emerald-600 dark:text-emerald-400 font-medium" : c.slaCompliancePct >= 60 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                      {fmtPct(c.slaCompliancePct)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={c.csatPct >= 75 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-amber-600 dark:text-amber-400 font-medium"}>
                      {fmtPct(c.csatPct)}
                    </span>
                  </TableCell>
                  <TableCell>{fmtPct(c.automationRate)}</TableCell>
                  <TableCell>{fmtPct(c.transferRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
