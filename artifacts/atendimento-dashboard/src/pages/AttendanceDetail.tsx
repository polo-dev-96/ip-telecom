import { useParams, Link } from "wouter";
import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClosedAttendance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, MessageSquare, CheckCircle2, Star, Bot, Tag, Loader2 } from "lucide-react";
import { fmtDateTime, fmtMinutes, fmtSeconds } from "@/lib/utils/formatters";
import { SlaBadge, CsatBadge, ChannelBadge, ResolutionBadge, SentimentBadge, StatusBadge } from "@/components/dashboard/StatusBadge";

async function fetchAttendanceById(id: string): Promise<ClosedAttendance | null> {
  const res = await fetch(`/api/attendances?id=${id}`);
  if (!res.ok) return null;
  const json = await res.json();
  const data = json.data as ClosedAttendance[];
  return data.find((a) => a.id === id) ?? null;
}

export function AttendanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance", id],
    queryFn: () => fetchAttendanceById(id ?? ""),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Atendimento não encontrado.</p>
        <Link to="/atendimentos">
          <Button variant="outline">Voltar para lista</Button>
        </Link>
      </div>
    );
  }

  const a = attendance;

  type IconComponent = FC<{ size: number }>;
  const timeline = [
    { label: "Abertura", time: a.openedAt, icon: MessageSquare as IconComponent },
    a.firstResponseAt ? { label: "1ª Resposta", time: a.firstResponseAt, icon: Clock as IconComponent } : null,
    a.botEscalatedAt ? { label: "Escalonamento Bot", time: a.botEscalatedAt, icon: Bot as IconComponent } : null,
    a.firstHumanResponseAt ? { label: "1ª Resposta Humana", time: a.firstHumanResponseAt, icon: User as IconComponent } : null,
    { label: "Encerramento", time: a.closedAt, icon: CheckCircle2 as IconComponent },
  ].filter(Boolean) as { label: string; time: string; icon: IconComponent }[];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/atendimentos">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight font-mono">{a.protocol}</h1>
            <StatusBadge status={a.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Atendimento finalizado — {fmtDateTime(a.closedAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare size={14} />Informações Gerais</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Canal" value={<ChannelBadge channel={a.channel} />} />
            <Row label="Resolução" value={<ResolutionBadge type={a.resolutionType} />} />
            <Row label="Sentimento" value={<SentimentBadge sentiment={a.sentiment} />} />
            <Row label="Fila" value={a.queue} />
            <Row label="Equipe" value={a.team} />
            <Row label="Tipo de Ocorrência" value={a.issueType} />
            {a.campaignSource && <Row label="Origem da Campanha" value={<Badge variant="secondary" className="text-xs">{a.campaignSource}</Badge>} />}
            <Row label="Cliente" value={<span className="font-mono text-muted-foreground">{a.customerNameMasked} ({a.customerIdMasked})</span>} />
          </CardContent>
        </Card>

        {/* Agent */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User size={14} />Agente</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nome" value={a.agentName ?? <span className="italic text-muted-foreground">Somente Bot</span>} />
            <Row label="ID do Agente" value={<span className="font-mono text-xs text-muted-foreground">{a.agentId ?? "—"}</span>} />
            <Row label="Transferências" value={<Badge variant="outline" className="text-xs">{a.transferCount}</Badge>} />
            <Row label="ACW" value={fmtSeconds(a.acwSeconds)} />
            <Row label="Registro Completo" value={
              <Badge variant="outline" className={a.complianceRecordComplete ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs" : "border-red-500 text-red-700 dark:text-red-400 text-xs"}>
                {a.complianceRecordComplete ? "Sim" : "Pendente"}
              </Badge>
            } />
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock size={14} />Tempos</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Abertura" value={fmtDateTime(a.openedAt)} />
            <Row label="Fechamento" value={fmtDateTime(a.closedAt)} />
            <Row label="TMA" value={<span className="font-semibold">{fmtMinutes(Math.max(a.ttrMinutes - (a.frtMinutes ?? 0), 0))}</span>} />
            {a.frtMinutes && <Row label="TME" value={fmtMinutes(a.frtMinutes)} />}
            {a.handoffSeconds && <Row label="Handoff Bot→Humano" value={fmtSeconds(a.handoffSeconds)} />}
            <Row label="SLA Alvo" value={fmtMinutes(a.slaResolutionTargetMinutes)} />
            <Row label="SLA" value={<SlaBadge within={a.withinResolutionSla} />} />
          </CardContent>
        </Card>

        {/* Quality */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star size={14} />Qualidade e Satisfação</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="CSAT" value={<CsatBadge score={a.csatScore} />} />
            <Row label="NPS" value={a.npsScore !== null ? <span className="font-semibold">{a.npsScore}/10</span> : <span className="text-muted-foreground text-xs">Sem resposta</span>} />
            <Row label="FCR" value={
              <Badge variant="outline" className={a.resolvedFirstContact ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs" : "border-red-500 text-red-700 dark:text-red-400 text-xs"}>
                {a.resolvedFirstContact ? "Sim" : "Não"}
              </Badge>
            } />
            <Row label="Reabertura (7d)" value={
              <Badge variant="outline" className={!a.reopenedWithin7Days ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs" : "border-red-500 text-red-700 dark:text-red-400 text-xs"}>
                {a.reopenedWithin7Days ? "Sim" : "Não"}
              </Badge>
            } />
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Tag size={14} />Tags</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {a.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Timeline do Atendimento</CardTitle></CardHeader>
        <CardContent>
          <div className="relative space-y-4 pl-8">
            {timeline.map((event, i) => (
              <div key={i} className="relative">
                {i < timeline.length - 1 && (
                  <div className="absolute left-[-1.25rem] top-6 w-px h-full bg-border" />
                )}
                <div className="absolute left-[-1.75rem] top-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                  <event.icon size={12} />
                </div>
                <div>
                  <p className="text-xs font-semibold">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(event.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: import("react").ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
