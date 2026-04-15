import type { DashboardState } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LabelList,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtNumber } from "@/lib/utils/formatters";
import { ChannelBadge } from "@/components/dashboard/StatusBadge";

interface ChannelsProps {
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

export function Channels({ dashboard }: ChannelsProps) {
  const { channelMetrics } = dashboard;

  const volumeData = channelMetrics.map((c) => ({ name: c.channel, total: c.total }));
  const slaData = channelMetrics.map((c) => ({ name: c.channel, sla: Math.round(c.slaCompliancePct) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Canais</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Comparativo de performance entre canais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-chart-1" />
              Volume por Canal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartTooltip {...tooltipStyle} />
                <Bar dataKey="total" name="Atendimentos" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} fillOpacity={0.85}>
                  <LabelList dataKey="total" position="top" className="fill-foreground text-[10px] font-semibold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-chart-2" />
              SLA de Resolução por Canal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={slaData} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartTooltip {...tooltipStyle} />
                <Bar dataKey="sla" name="SLA %" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} fillOpacity={0.85}>
                  <LabelList dataKey="sla" position="top" className="fill-foreground text-[10px] font-semibold" formatter={(v: number) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rankings table */}
      <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
        <CardHeader className="pb-2 space-y-0">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
            <span className="w-2 h-2 rounded-full bg-chart-3" />
            Ranking de Canais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 dark:border-white/[0.06]">
                  <TableHead className="text-muted-foreground font-semibold text-xs">#</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs">Canal</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...channelMetrics].sort((a, b) => b.total - a.total).map((c, i) => (
                  <TableRow key={c.channel} className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors">
                    <TableCell className="text-muted-foreground font-mono font-semibold">{i + 1}</TableCell>
                    <TableCell><ChannelBadge channel={c.channel} /></TableCell>
                    <TableCell className="font-bold text-foreground">{fmtNumber(c.total)}</TableCell>
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
