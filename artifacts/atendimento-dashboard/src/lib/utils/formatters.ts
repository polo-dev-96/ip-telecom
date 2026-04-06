export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function fmtSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return fmtMinutes(seconds / 60);
}

export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function fmtNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function fmtNps(nps: number): string {
  return nps.toFixed(0);
}

export function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function fmtMonthYear(ym: string): string {
  const [y, m] = ym.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}
