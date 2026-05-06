import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchAgents } from "@/data/api/activeChats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Users,
  PhoneCall,
  ChevronDown,
  ChevronRight,
  PhoneIncoming,
  PhoneOutgoing,
  PauseCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CallEntry {
  caller: string;
  called: string;
  state: "answered" | "unanswered" | "proceeding" | "calling" | "diverted" | "transferred";
  start: string;
  duration: number;
  held: boolean;
  type: "in" | "out";
  trunk: string;
}

interface RamalData {
  exten: string;
  name: string;
  status: "Reachable" | "Unreachable";
  adrress?: string;
  address?: string;
  inuse?: boolean;
  calls?: number;
  calllist?: Record<string, CallEntry>;
}

interface ApiResponse {
  status: string;
  list: {
    extens: Record<string, RamalData>;
    total?: number;
    count?: number;
    page?: number;
  };
}

const TOKEN = "055e3548897785ebe18d691473fff7ab604f273e";
const API_URL = "https://ipfibra.ippolopabx.com.br/utech/v1/exten/extenmonitor";

async function fetchRamais(): Promise<RamalData[]> {
  const response = await fetch(`${API_URL}?token=${TOKEN}&page=0`);
  if (!response.ok) throw new Error("Erro ao buscar ramais");
  const data: ApiResponse = await response.json();
  if (data.status !== "ok" || !data.list?.extens) throw new Error("Resposta inválida da API");
  return Object.values(data.list.extens).sort((a, b) => parseInt(a.exten) - parseInt(b.exten));
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

const CALL_STATE_MAP: Record<CallEntry["state"], { label: string; color: string }> = {
  answered:    { label: "Atendida",    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  unanswered:  { label: "Não Atendida", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  proceeding:  { label: "Originando",  color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  calling:     { label: "Chamando",    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  diverted:    { label: "Desviada",    color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  transferred: { label: "Transferida", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30" },
};

export function Ramais() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedRamais, setExpandedRamais] = useState<Set<string>>(new Set());

  // Mappings for filtering by queue
  const [agentQueuesMap, setAgentQueuesMap] = useState<Map<string, string[]>>(new Map());
  const [agentNameQueuesMap, setAgentNameQueuesMap] = useState<Map<string, string[]>>(new Map());

  // Load agent data to build mappings
  useEffect(() => {
    (async () => {
      try {
        const aList = await fetchAgents();
        const aqm = new Map<string, string[]>();
        const anqm = new Map<string, string[]>();
        for (const agent of aList) {
          if (agent.queues && agent.queues.length > 0) {
            const qids = agent.queues.map((q) => q.queue);
            aqm.set(agent.id, qids);
            if (agent.name) {
              anqm.set(agent.name.toLowerCase().trim(), qids);
            }
          }
        }
        setAgentQueuesMap(aqm);
        setAgentNameQueuesMap(anqm);
      } catch (err) {
        console.warn("[Ramais] Erro ao carregar agentes:", err);
      }
    })();
  }, []);

  const { data: ramais = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["ramais"],
    queryFn: fetchRamais,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  function toggleExpand(exten: string) {
    setExpandedRamais((prev) => {
      const next = new Set(prev);
      next.has(exten) ? next.delete(exten) : next.add(exten);
      return next;
    });
  }

  const EXCLUDED_EXTENS = ["5599"];

  const filteredRamais = useMemo(() => {
    // Filter out test extensions and apply queue restrictions
    let queueFiltered = ramais.filter((r) => !EXCLUDED_EXTENS.includes(r.exten));
    if (user?.restrictTelefoniaQueues && user.allowedTelefoniaQueues && user.allowedTelefoniaQueues.length > 0) {
      queueFiltered = queueFiltered.filter((r) => {
        const ramalName = r.name.toLowerCase().trim();
        const agentQueueIds = agentQueuesMap.get(r.exten) || agentNameQueuesMap.get(ramalName);
        
        if (!agentQueueIds || agentQueueIds.length === 0) return false;
        
        return agentQueueIds.some((qid) => user.allowedTelefoniaQueues!.includes(qid));
      });
    } else if (user?.restrictTelefoniaQueues) {
      queueFiltered = [];
    }

    return queueFiltered
      .filter(
        (r) =>
          r.exten.toLowerCase().includes(search.toLowerCase()) ||
          r.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (a.inuse && !b.inuse) return -1;
        if (!a.inuse && b.inuse) return 1;
        return parseInt(a.exten) - parseInt(b.exten);
      });
  }, [ramais, search, user, agentQueuesMap, agentNameQueuesMap]);

  const totalRamais = filteredRamais.length;
  const registrados = filteredRamais.filter((r) => r.status === "Reachable" && !r.inuse).length;
  const emUso = filteredRamais.filter((r) => r.inuse).length;
  const naoRegistrados = filteredRamais.filter((r) => r.status === "Unreachable").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Monitorar Ramais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Status em tempo real dos ramais SIP</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-[28px] leading-tight font-extrabold mt-2 text-foreground">{totalRamais}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                <Server className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Registrados</p>
                <p className="text-[28px] leading-tight font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{registrados}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Em Uso</p>
                <p className="text-[28px] leading-tight font-extrabold text-amber-600 dark:text-amber-400 mt-2">{emUso}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Não Registrados</p>
                <p className="text-[28px] leading-tight font-extrabold text-red-600 dark:text-red-400 mt-2">{naoRegistrados}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/15 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Lista de Ramais
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{filteredRamais.length} ramais encontrados</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ramal ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-foreground font-medium">Carregando ramais...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <WifiOff className="w-12 h-12 text-destructive" />
                <p className="text-foreground font-medium">Erro ao carregar ramais</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 dark:border-white/[0.06]">
                    <TableHead className="w-8" />
                    <TableHead className="w-20 text-muted-foreground font-semibold text-xs">Ramal</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs min-w-[180px]">
                      <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />Nome</div>
                    </TableHead>
                    <TableHead className="w-36 text-muted-foreground font-semibold text-xs">Estado</TableHead>
                    <TableHead className="w-24 text-muted-foreground font-semibold text-xs">Chamadas</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs min-w-[240px]">Endereço SIP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRamais.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                        {search ? "Nenhum ramal encontrado para esta busca" : "Nenhum ramal disponível"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRamais.map((ramal) => {
                      const callEntries = ramal.calllist ? Object.entries(ramal.calllist) : [];
                      const alwaysExpanded = ramal.inuse && callEntries.length > 0;
                      const canCollapse = alwaysExpanded;
                      const isExpanded = alwaysExpanded ? !expandedRamais.has(ramal.exten) : expandedRamais.has(ramal.exten);
                      const addr = ramal.adrress || ramal.address || "";

                      return (
                        <React.Fragment key={ramal.exten}>
                          <TableRow
                            className={cn(
                              "text-xs border-border/30 dark:border-white/[0.04] transition-colors",
                              canCollapse ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/30",
                              isExpanded && "bg-amber-500/[0.03]"
                            )}
                            onClick={() => canCollapse && toggleExpand(ramal.exten)}
                          >
                            <TableCell className="pl-3 pr-0 w-8">
                              {canCollapse ? (
                                isExpanded
                                  ? <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
                                  : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : <span />}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-foreground">{ramal.exten}</TableCell>
                            <TableCell className="font-semibold text-foreground text-xs">{ramal.name}</TableCell>
                            <TableCell>
                              {ramal.status === "Unreachable" ? (
                                <Badge variant="outline" className="gap-1.5 font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30">
                                  <WifiOff className="w-3.5 h-3.5" />Não Registrado
                                </Badge>
                              ) : ramal.inuse ? (
                                <Badge variant="outline" className="gap-1.5 font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                                  <PhoneCall className="w-3.5 h-3.5" />Em Uso
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1.5 font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                  <Wifi className="w-3.5 h-3.5" />Registrado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {(ramal.calls ?? 0) > 0 ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                  <PhoneCall className="w-3 h-3" />{ramal.calls}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {addr ? (
                                <span className="break-all leading-relaxed">{addr}</span>
                              ) : (
                                <span className="text-foreground/40 italic">—</span>
                              )}
                            </TableCell>
                          </TableRow>

                          {isExpanded && callEntries.length > 0 && (
                            <TableRow className="border-border/30 dark:border-white/[0.04] bg-amber-500/[0.03]">
                              <TableCell colSpan={6} className="pt-0 pb-3 px-6">
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
                                  <div className="px-4 py-2 border-b border-amber-500/15 flex items-center gap-2">
                                    <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                      Chamadas ativas — {ramal.name}
                                    </span>
                                  </div>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-amber-500/10">
                                        <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Origem</th>
                                        <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Destino</th>
                                        <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Estado</th>
                                        <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Tipo</th>
                                        <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Duração</th>
                                        <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Tronco</th>
                                        <th className="text-left px-4 py-2 text-muted-foreground font-semibold">Espera</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {callEntries.map(([callId, call]) => {
                                        const stateInfo = CALL_STATE_MAP[call.state] ?? { label: call.state, color: "bg-muted text-muted-foreground border-border" };
                                        return (
                                          <tr key={callId} className="border-b border-amber-500/[0.08] last:border-0">
                                            <td className="px-4 py-2 font-mono font-semibold text-foreground">{call.caller}</td>
                                            <td className="px-4 py-2 font-mono text-foreground">{call.called}</td>
                                            <td className="px-4 py-2">
                                              <Badge variant="outline" className={cn("text-[10px] font-semibold py-0", stateInfo.color)}>
                                                {stateInfo.label}
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-2">
                                              <span className={cn("inline-flex items-center gap-1 font-semibold", call.type === "in" ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400")}>
                                                {call.type === "in" ? <PhoneIncoming className="w-3 h-3" /> : <PhoneOutgoing className="w-3 h-3" />}
                                                {call.type === "in" ? "Entrada" : "Saída"}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2 font-mono text-foreground">{fmtDuration(Number(call.duration))}</td>
                                            <td className="px-4 py-2 text-muted-foreground">{call.trunk || "—"}</td>
                                            <td className="px-4 py-2">
                                              {call.held ? (
                                                <span className="inline-flex items-center gap-1 text-orange-500 font-semibold">
                                                  <PauseCircle className="w-3 h-3" />Sim
                                                </span>
                                              ) : (
                                                <span className="text-muted-foreground/50">—</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
