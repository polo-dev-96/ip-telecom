import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SlaBadge({ within }: { within: boolean }) {
  return (
    <Badge variant="outline" className={cn(
      "text-xs font-medium",
      within ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-red-500 text-red-700 dark:text-red-400"
    )}>
      {within ? "No SLA" : "Fora SLA"}
    </Badge>
  );
}

export function CsatBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="outline" className="text-xs text-muted-foreground">Sem resp.</Badge>;
  const color = score >= 4
    ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
    : score === 3
    ? "border-amber-500 text-amber-700 dark:text-amber-400"
    : "border-red-500 text-red-700 dark:text-red-400";
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", color)}>
      {"★".repeat(score)}{"☆".repeat(5 - score)}
    </Badge>
  );
}

export function ChannelBadge({ channel }: { channel: string }) {
  const colors: Record<string, string> = {
    WhatsApp: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    Webchat: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Email: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Telegram: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  };
  return (
    <Badge className={cn("text-xs", colors[channel] ?? "bg-gray-100 text-gray-800")}>
      {channel}
    </Badge>
  );
}

export function ResolutionBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    bot: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    humano: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    hibrido: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  };
  const labels: Record<string, string> = { bot: "Bot", humano: "Humano", hibrido: "Híbrido" };
  return (
    <Badge className={cn("text-xs", colors[type] ?? "bg-gray-100 text-gray-800")}>
      {labels[type] ?? type}
    </Badge>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    positivo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    neutro: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    negativo: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <Badge className={cn("text-xs", colors[sentiment] ?? "bg-gray-100 text-gray-800")}>
      {sentiment}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-700 dark:text-emerald-400">
      {status}
    </Badge>
  );
}
