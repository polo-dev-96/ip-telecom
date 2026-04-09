import { useState, useMemo } from "react";
import type { DashboardState } from "@/hooks/useDashboard";
import type { ClosedAttendance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChannelBadge } from "@/components/dashboard/StatusBadge";
import { fmtDateTime, fmtMinutes } from "@/lib/utils/formatters";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface AttendancesProps {
  dashboard: DashboardState;
}

const PAGE_SIZE = 20;

type SortKey = keyof ClosedAttendance;
type SortDir = "asc" | "desc";

export function Attendances({ dashboard }: AttendancesProps) {
  const { closedAttendances } = dashboard;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("closedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return closedAttendances.filter((a) =>
      !q ||
      a.protocol.toLowerCase().includes(q) ||
      (a.agentName ?? "").toLowerCase().includes(q) ||
      a.channel.toLowerCase().includes(q) ||
      a.queue.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [closedAttendances, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] as string | number | boolean | null;
      const vb = b[sortKey] as string | number | boolean | null;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
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
    const headers = ["Protocolo","Canal","Cliente","Agente","Fechamento","TMR (min)","TMA (min)","TME (min)"];
    const rows = sorted.map((a) => {
      const frt = a.frtMinutes ?? 0;
      const tma = Math.max(a.ttrMinutes - frt, 0);
      return [
        a.protocol, a.channel, a.customerNameMasked, a.agentName ?? "Bot",
        a.closedAt, a.ttrMinutes, Math.round(tma), a.frtMinutes ?? "N/A"
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atendimentos_finalizados.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Atendimentos Finalizados</h1>
        <p className="text-sm text-muted-foreground mt-1">{sorted.length} registros encontrados</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm font-medium">Tabela de Atendimentos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar protocolo, agente, canal..."
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
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    <button onClick={() => toggleSort("protocol")} className="flex items-center gap-1 hover:text-foreground">
                      Protocolo <SortIcon k="protocol" />
                    </button>
                  </TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button onClick={() => toggleSort("closedAt")} className="flex items-center gap-1 hover:text-foreground">
                      Fechamento <SortIcon k="closedAt" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button onClick={() => toggleSort("ttrMinutes")} className="flex items-center gap-1 hover:text-foreground">
                      TMR <SortIcon k="ttrMinutes" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button onClick={() => toggleSort("frtMinutes")} className="flex items-center gap-1 hover:text-foreground">
                      TMA <SortIcon k="frtMinutes" />
                    </button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <button onClick={() => toggleSort("frtMinutes")} className="flex items-center gap-1 hover:text-foreground">
                      TME <SortIcon k="frtMinutes" />
                    </button>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((a) => (
                  <TableRow key={a.id} className="text-xs">
                    <TableCell className="font-mono text-xs whitespace-nowrap">{a.protocol}</TableCell>
                    <TableCell><ChannelBadge channel={a.channel} /></TableCell>
                    <TableCell className="text-muted-foreground">{a.customerNameMasked}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.agentName ?? <span className="text-muted-foreground italic">Bot</span>}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(a.closedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtMinutes(a.ttrMinutes)}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtMinutes(Math.max(a.ttrMinutes - (a.frtMinutes ?? 0), 0))}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.frtMinutes !== null ? fmtMinutes(a.frtMinutes) : <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell>
                      <Link to={`/atendimento/${a.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink size={13} />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                      Nenhum atendimento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length}
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
    </div>
  );
}
