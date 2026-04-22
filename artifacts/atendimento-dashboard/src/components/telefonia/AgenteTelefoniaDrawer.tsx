import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  CalendarDays,
  Phone,
} from "lucide-react";
import {
  type AgentTelefoniaMetrics,
  type CallRecord,
  fmtDuration,
  CALL_STATUS_MAP,
} from "@/lib/telefonia";
import { cn } from "@/lib/utils";

interface AgenteTelefoniaDrawerProps {
  agent: AgentTelefoniaMetrics | null;
  open: boolean;
  onClose: () => void;
}

function DirectionBadge({ direction }: { direction: "IN" | "OUT" }) {
  return direction === "IN" ? (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30 font-semibold text-[10px]">
      <PhoneIncoming className="w-3 h-3" /> IN
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/30 font-semibold text-[10px]">
      <PhoneOutgoing className="w-3 h-3" /> OUT
    </Badge>
  );
}

function StatusBadge({ status }: { status: CallRecord["status"] }) {
  const info = CALL_STATUS_MAP[status];
  if (!info) return null;
  return <Badge variant="outline" className={cn("text-[10px] font-semibold", info.color)}>{info.label}</Badge>;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
  bgClass,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <Card className="rounded-xl border-border/50 dark:border-white/[0.06] shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl shrink-0", bgClass)}>
            <Icon className={cn("w-4 h-4", iconClass)} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none mb-1">{label}</p>
            <p className="text-lg font-extrabold tabular-nums text-foreground leading-none">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgenteTelefoniaDrawer({ agent, open, onClose }: AgenteTelefoniaDrawerProps) {
  const recentCalls = agent?.calls.slice().sort((a, b) => b.start.localeCompare(a.start)).slice(0, 30) ?? [];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">{agent?.agentName ?? "—"}</SheetTitle>
              <SheetDescription className="text-xs">
                {agent?.total ?? 0} chamadas no período
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {agent && (
          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Total" value={agent.total} icon={Phone} iconClass="text-primary" bgClass="bg-primary/10 dark:bg-primary/15" />
              <KpiCard label="Completadas" value={agent.completadas} icon={CheckCircle2} iconClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-500/10" />
              <KpiCard label="Abandonadas" value={agent.abandonadas} icon={PhoneMissed} iconClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-500/10" />
              <KpiCard label="Duração Média" value={fmtDuration(Math.round(agent.avgDuration))} icon={Clock} iconClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-500/10" />
              <KpiCard label="Entrada" value={agent.entradas} icon={PhoneIncoming} iconClass="text-[hsl(var(--chart-2))]" bgClass="bg-[hsl(var(--chart-2))]/10" />
              <KpiCard label="Saída" value={agent.saidas} icon={PhoneOutgoing} iconClass="text-[hsl(var(--chart-1))]" bgClass="bg-[hsl(var(--chart-1))]/10" />
              <KpiCard label="Média/Dia" value={agent.callsPerDay.toFixed(1)} icon={CalendarDays} iconClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-500/10" />
              <KpiCard label="Média/Mês" value={Math.round(agent.callsPerMonth)} icon={CalendarDays} iconClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-500/10" />
            </div>

            {/* Recent calls table */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Últimas {recentCalls.length} chamadas
              </p>
              <div className="rounded-xl border border-border/50 dark:border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 dark:border-white/[0.06]">
                        <TableHead className="text-muted-foreground font-semibold text-xs">Origem</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-xs">Destino</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-xs">Dir.</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-xs">Status</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-xs whitespace-nowrap">Início</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-xs">Duração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCalls.map((c) => (
                        <TableRow key={c.callid} className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-xs text-foreground/90">{c.source}</TableCell>
                          <TableCell className="font-mono text-xs text-foreground/90">{c.destination}</TableCell>
                          <TableCell><DirectionBadge direction={c.direction} /></TableCell>
                          <TableCell><StatusBadge status={c.status} /></TableCell>
                          <TableCell className="whitespace-nowrap text-foreground/80">{c.start}</TableCell>
                          <TableCell className="whitespace-nowrap text-foreground">{fmtDuration(Number(c.duration))}</TableCell>
                        </TableRow>
                      ))}
                      {recentCalls.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                            Nenhuma chamada encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
