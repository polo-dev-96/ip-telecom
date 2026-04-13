import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend, LabelList,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtNumber } from "@/lib/utils/formatters";
import { ChannelBadge } from "@/components/dashboard/StatusBadge";

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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="total" name="Atendimentos" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" className="fill-foreground text-[10px] font-medium" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">SLA de Resolução por Canal (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={slaData} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} />
                <RechartTooltip {...tooltip} />
                <Bar dataKey="sla" name="SLA %" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="sla" position="top" className="fill-foreground text-[10px] font-medium" formatter={(v: number) => `${v}%`} />
                </Bar>
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
                <TableHead className="text-foreground font-bold">#</TableHead>
                <TableHead className="text-foreground font-bold">Canal</TableHead>
                <TableHead className="text-foreground font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...channelMetrics].sort((a, b) => b.total - a.total).map((c, i) => (
                <TableRow key={c.channel} className="text-xs">
                  <TableCell className="text-muted-foreground font-mono">{i + 1}</TableCell>
                  <TableCell><ChannelBadge channel={c.channel} /></TableCell>
                  <TableCell className="font-semibold">{fmtNumber(c.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
