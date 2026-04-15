import { useQuery } from "@tanstack/react-query";
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
  Phone,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Users,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RamalData {
  exten: string;
  name: string;
  status: "Reachable" | "Unreachable";
  adrress?: string;
  address?: string;
}

interface ApiResponse {
  status: string;
  list: {
    extens: Record<string, RamalData>;
  };
}

const TOKEN = "055e3548897785ebe18d691473fff7ab604f273e";
const API_URL = "https://ipfibra.ippolopabx.com.br/utech/v1/exten/extenmonitor";

async function fetchRamais(): Promise<RamalData[]> {
  const response = await fetch(`${API_URL}?token=${TOKEN}&page=0`);
  if (!response.ok) {
    throw new Error("Erro ao buscar ramais");
  }
  const data: ApiResponse = await response.json();
  
  // Debug: log estrutura completa
  console.log("API Response:", data);
  console.log("list object:", data.list);
  console.log("extens object:", data.list?.extens);
  
  // Converte o objeto de extens em array
  const ramais = Object.values(data.list.extens);
  
  // Debug: log todos os ramais registrados
  const registrados = ramais.filter(r => r.status === "Reachable");
  console.log("Ramais registrados:", registrados);
  
  // Debug: log primeiro ramal com todos os campos
  if (ramais.length > 0) {
    const primeiro = ramais[0];
    console.log("Primeiro ramal completo:", JSON.stringify(primeiro, null, 2));
    console.log("Todos os campos:", Object.keys(primeiro));
    console.log("Valor de adrress:", primeiro.adrress);
    console.log("Valor de address:", (primeiro as any).address);
    // Check all possible field names
    console.log("Todas as propriedades:", Object.getOwnPropertyNames(primeiro));
  }
  
  // Ordena por número do ramal
  return ramais.sort((a, b) => parseInt(a.exten) - parseInt(b.exten));
}

function translateStatus(status: "Reachable" | "Unreachable"): {
  label: string;
  variant: "outline";
  icon: typeof Wifi;
} {
  if (status === "Reachable") {
    return {
      label: "Registrado",
      variant: "outline",
      icon: Wifi,
    };
  }
  return {
    label: "Não Registrado",
    variant: "outline",
    icon: WifiOff,
  };
}

export function Ramais() {
  const [search, setSearch] = useState("");
  
  const {
    data: ramais = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["ramais"],
    queryFn: fetchRamais,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true,
  });

  const filteredRamais = ramais.filter(
    (ramal) =>
      ramal.exten.toLowerCase().includes(search.toLowerCase()) ||
      ramal.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRamais = ramais.length;
  const registrados = ramais.filter((r) => r.status === "Reachable").length;
  const naoRegistrados = ramais.filter((r) => r.status === "Unreachable").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Monitorar Ramais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Status em tempo real dos ramais SIP
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/50 dark:border-white/[0.06] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total de Ramais
                </p>
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
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Registrados
                </p>
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
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Não Registrados
                </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {filteredRamais.length} ramais encontrados
              </p>
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
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 dark:border-white/[0.06]">
                    <TableHead className="w-20 text-muted-foreground font-semibold text-xs">Ramal</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Nome
                      </div>
                    </TableHead>
                    <TableHead className="w-36 text-muted-foreground font-semibold text-xs">Estado</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-xs min-w-[280px]">Endereço SIP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRamais.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-10 text-muted-foreground text-sm"
                      >
                        {search
                          ? "Nenhum ramal encontrado para esta busca"
                          : "Nenhum ramal disponível"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRamais.map((ramal) => {
                      const statusInfo = translateStatus(ramal.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <TableRow
                          key={ramal.exten}
                          className="text-xs border-border/30 dark:border-white/[0.04] hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            {ramal.exten}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground text-xs">
                            {ramal.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusInfo.variant}
                              className={cn(
                                "gap-1.5 font-semibold",
                                ramal.status === "Reachable"
                                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30"
                                  : "bg-red-500/15 text-red-700 hover:bg-red-500/20 border-red-500/30"
                              )}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {(() => {
                              // Try all possible field names
                              const addr = (ramal as any).adrress || (ramal as any).address || (ramal as any).sip || (ramal as any).endpoint || "";
                              return addr ? (
                                <span className="break-all leading-relaxed" title={addr}>
                                  {addr}
                                </span>
                              ) : (
                                <span className="text-foreground/40 italic">—</span>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
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
