import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { DashboardState } from "@/hooks/useDashboard";
import { fetchAgents } from "@/data/api/activeChats";
import {
  fetchCalls,
  fmtDuration,
  CALL_STATUS_MAP,
  CALL_TYPE_MAP,
  type CallRecord,
} from "@/lib/telefonia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  User,
  Network,
  Info,
  ExternalLink,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChamadaDetalheProps {
  dashboard: DashboardState;
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground font-medium shrink-0">{label}</span>
      <span className={cn("text-xs text-foreground text-right", mono && "font-mono")}>{value ?? <span className="italic text-muted-foreground">—</span>}</span>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: "IN" | "OUT" }) {
  return direction === "IN" ? (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30 font-semibold">
      <PhoneIncoming className="w-3.5 h-3.5" /> Entrada
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/30 font-semibold">
      <PhoneOutgoing className="w-3.5 h-3.5" /> Saída
    </Badge>
  );
}

function StatusBadge({ status }: { status: CallRecord["status"] }) {
  const info = CALL_STATUS_MAP[status];
  if (!info) return null;
  return <Badge variant="outline" className={cn("font-semibold", info.color)}>{info.label}</Badge>;
}

export function ChamadaDetalhe({ dashboard }: ChamadaDetalheProps) {
  const params = useParams<{ callid: string }>();
  const callid = decodeURIComponent(params.callid ?? "");

  const dateIni = dashboard.filters.dateFrom;
  const dateEnd = dashboard.filters.dateTo;

  const { data: rawCalls = [], isLoading } = useQuery({
    queryKey: ["telefone-calls", dateIni, dateEnd],
    queryFn: () => fetchCalls(dateIni ?? "", dateEnd ?? ""),
    enabled: !!dateIni && !!dateEnd,
  });

  const { data: agentList = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 5 * 60 * 1000,
  });

  const agentMap = useMemo(
    () => new Map(agentList.map((a) => [a.id, a.name])),
    [agentList]
  );

  const call = useMemo(
    () => rawCalls.find((c) => c.callid === callid) ?? null,
    [rawCalls, callid]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Phone className="w-8 h-8 animate-pulse text-primary" />
        <span className="ml-3 text-foreground font-medium">Carregando chamada...</span>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Phone className="w-12 h-12 text-muted-foreground" />
        <p className="text-foreground font-medium">Chamada não encontrada</p>
        <p className="text-xs text-muted-foreground font-mono">{callid}</p>
        <Link to="/chamadas">
          <Button variant="outline" size="sm">
            <ChevronLeft size={14} className="mr-1" /> Voltar para Chamadas
          </Button>
        </Link>
      </div>
    );
  }

  const agentName = agentMap.get(call.agent) ?? call.agent;
  const durSec = Number(call.duration);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link to="/chamadas">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft size={14} /> Chamadas
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Detalhe da Chamada</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{call.callid}</p>
        </div>
        <div className="flex items-center gap-2">
          <DirectionBadge direction={call.direction} />
          <StatusBadge status={call.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identificação */}
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <Row label="Call ID" value={call.callid} mono />
            <Row label="Origem" value={call.source} mono />
            <Row label="Destino" value={call.destination} mono />
            <Row label="Direção" value={<DirectionBadge direction={call.direction} />} />
            <Row label="Tipo" value={CALL_TYPE_MAP[call.type] ?? call.type} />
          </CardContent>
        </Card>

        {/* Tempo */}
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <Row label="Início" value={call.start} mono />
            <Row label="Atendimento" value={call.answer || "—"} mono />
            <Row label="Fim" value={call.end} mono />
            <Row label="Duração" value={fmtDuration(isNaN(durSec) ? 0 : durSec)} />
            <Row label="Duração (s)" value={call.duration} mono />
          </CardContent>
        </Card>

        {/* Roteamento */}
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Roteamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <Row label="Agente" value={agentName || "—"} />
            <Row label="Tronco" value={call.trunk || "—"} mono />
            <Row label="CSC" value={call.csc || "—"} mono />
            <Row label="Conta" value={call.account || "—"} mono />
          </CardContent>
        </Card>

        {/* Encerramento */}
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Encerramento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <Row label="Status" value={<StatusBadge status={call.status} />} />
            <Row label="Causa (Q.931)" value={call.cause || "—"} mono />
            <Row label="Desligou" value={
              call.released === "0" ? "Origem" :
              call.released === "1" ? "Destino" :
              call.released || "—"
            } />
          </CardContent>
        </Card>
      </div>

      {/* Gravação */}
      {call.record && call.record !== "0" && call.record !== "" && (
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Mic className="w-3.5 h-3.5" /> Gravação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono break-all flex-1">{call.record}</span>
              <a href={call.record} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <ExternalLink size={13} /> Abrir
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
