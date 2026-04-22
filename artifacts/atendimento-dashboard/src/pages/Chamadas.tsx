import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { DashboardState } from "@/hooks/useDashboard";
import { fetchAgents } from "@/data/api/activeChats";
import {
  fetchCalls,
  withoutCanceled,
  fmtDuration,
  CALL_STATUS_MAP,
  CALL_TYPE_MAP,
  type CallRecord,
} from "@/lib/telefonia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  XCircle,
  AlertCircle,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChamadasProps {
  dashboard: DashboardState;
}

const PAGE_SIZE = 20;

type SortKey = keyof CallRecord;
type SortDir = "asc" | "desc";

function DirectionBadge({ direction }: { direction: "IN" | "OUT" }) {
  return direction === "IN" ? (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30 font-semibold text-[10px]">
      <PhoneIncoming className="w-3 h-3" /> Entrada
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/30 font-semibold text-[10px]">
      <PhoneOutgoing className="w-3 h-3" /> Saída
    </Badge>
  );
}

function StatusBadge({ status }: { status: CallRecord["status"] }) {
  const info = CALL_STATUS_MAP[status];
  if (!info) return null;
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold", info.color)}>
      {info.label}
    </Badge>
  );
}

export function Chamadas({ dashboard }: ChamadasProps) {
  const dateIni = dashboard.filters.dateFrom;
  const dateEnd = dashboard.filters.dateTo;

  const diffDays = useMemo(() => {
    if (!dateIni || !dateEnd) return 0;
    return (new Date(dateEnd).getTime() - new Date(dateIni).getTime()) / (1000 * 60 * 60 * 24);
  }, [dateIni, dateEnd]);

  const rangeExceeded = diffDays > 30;

  const { data: rawCalls = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["telefone-calls", dateIni, dateEnd],
    queryFn: () => fetchCalls(dateIni ?? "", dateEnd ?? ""),
    enabled: !!dateIni && !!dateEnd && !rangeExceeded,
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

  const calls = useMemo(() => withoutCanceled(rawCalls), [rawCalls]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("start");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return calls.filter((c) => {
      if (!q) return true;
      const agentName = agentMap.get(c.agent) ?? c.agent;
      return (
        c.source.toLowerCase().includes(q) ||
        c.destination.toLowerCase().includes(q) ||
        agentName.toLowerCase().includes(q) ||
        c.trunk.toLowerCase().includes(q)
      );
    });
  }, [calls, search, agentMap]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] as string;
      const vb = b[sortKey] as string;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown size={12} className="text-muted-foreground" />;
    return sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }

  function exportCsv() {
    const headers = ["Origem", "Destino", "Direção", "Tipo", "Agente", "Tronco", "Status", "Início", "Duração (s)"];
    const rows = sorted.map((c) => [
      c.source,
      c.destination,
      c.direction === "IN" ? "Entrada" : "Saída",
      CALL_TYPE_MAP[c.type] ?? c.type,
      agentMap.get(c.agent) ?? c.agent,
      c.trunk,
      CALL_STATUS_MAP[c.status]?.label ?? c.status,
      c.start,
      c.duration,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chamadas_${dateIni}_${dateEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Chamadas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{sorted.length} registros encontrados</p>
      </div>

      {rangeExceeded && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>O intervalo selecionado excede 30 dias. Reduza o período no filtro acima para carregar os dados.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-foreground font-medium">Carregando chamadas...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <XCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground font-medium">Erro ao carregar chamadas</p>
          <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      ) : (
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Tabela de Chamadas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-1.5 h-8 text-xs">
                  <RefreshCw size={13} className={cn(isRefetching && "animate-spin")} />
                </Button>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar origem, destino, agente..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-8 h-8 text-xs w-56"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 h-8 text-xs">
                  <Download size={13} />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 dark:border-white/[0.06]">
                    <TableHead className="text-muted-foreground font-semibold text-xs">
                      <button onClick={() => toggleSort("source")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Origem <SortIcon k="source" />
                      </button>
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">
                      <button onClick={() => toggleSort("destination")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Destino <SortIcon k="destination" />
                      </button>
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Direção</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Tipo</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Agente</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Tronco</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">Status</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">
                      <button onClick={() => toggleSort("start")} className="flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap">
                        Início <SortIcon k="start" />
                      </button>
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs">
                      <button onClick={() => toggleSort("duration")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Duração <SortIcon k="duration" />
                      </button>
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c) => {
                    const agentName = agentMap.get(c.agent) ?? c.agent;
                    return (
                      <TableRow key={c.callid} className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs text-foreground/90">{c.source}</TableCell>
                        <TableCell className="font-mono text-xs text-foreground/90">{c.destination}</TableCell>
                        <TableCell><DirectionBadge direction={c.direction} /></TableCell>
                        <TableCell className="text-foreground/80 whitespace-nowrap">{CALL_TYPE_MAP[c.type] ?? c.type}</TableCell>
                        <TableCell className="whitespace-nowrap text-foreground">{agentName || <span className="italic text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{c.trunk || "—"}</TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="whitespace-nowrap text-foreground/90">{c.start}</TableCell>
                        <TableCell className="whitespace-nowrap text-foreground">{fmtDuration(Number(c.duration))}</TableCell>
                        <TableCell>
                          <Link to={`/chamadas/${encodeURIComponent(c.callid)}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink size={13} />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-muted-foreground text-sm">
                        Nenhuma chamada encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 dark:border-white/[0.06]">
              <p className="text-xs text-muted-foreground font-medium">
                {sorted.length === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)}`} de {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(1)}>
                  <ChevronLeft size={12} className="opacity-70" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={12} />
                </Button>
                <span className="text-xs px-2">Página {page} de {totalPages}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight size={12} />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                  <ChevronRight size={12} className="opacity-70" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
