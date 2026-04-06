import type { HeatmapCell } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  data: HeatmapCell[];
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensity(value: number, max: number): number {
  if (max === 0) return 0;
  return value / max;
}

function getCellClass(intensity: number): string {
  if (intensity === 0) return "bg-muted";
  if (intensity < 0.2) return "bg-blue-100 dark:bg-blue-950";
  if (intensity < 0.4) return "bg-blue-200 dark:bg-blue-900";
  if (intensity < 0.6) return "bg-blue-400 dark:bg-blue-700";
  if (intensity < 0.8) return "bg-blue-600 dark:bg-blue-500";
  return "bg-blue-800 dark:bg-blue-400";
}

export function Heatmap({ data }: HeatmapProps) {
  const max = Math.max(...data.map((d) => d.value));
  const cellMap: Record<string, number> = {};
  for (const d of data) {
    cellMap[`${d.day}-${d.hour}`] = d.value;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour header */}
        <div className="flex gap-0.5 mb-1 ml-10">
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <div key={h} className="text-center text-xs text-muted-foreground" style={{ width: `calc(100% / 8)` }}>
              {String(h).padStart(2, "0")}h
            </div>
          ))}
        </div>
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <div className="w-9 text-xs text-muted-foreground text-right pr-1 shrink-0">{day}</div>
            <div className="flex gap-0.5 flex-1">
              {HOURS.map((hour) => {
                const val = cellMap[`${dayIdx}-${hour}`] ?? 0;
                const intensity = getIntensity(val, max);
                return (
                  <div
                    key={hour}
                    title={`${day} ${String(hour).padStart(2, "0")}h: ${val} atendimentos`}
                    className={cn("flex-1 h-5 rounded-sm cursor-default transition-opacity hover:opacity-80", getCellClass(intensity))}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 ml-10">
          <span className="text-xs text-muted-foreground">Menos</span>
          {["bg-muted", "bg-blue-100 dark:bg-blue-950", "bg-blue-300 dark:bg-blue-800", "bg-blue-500 dark:bg-blue-600", "bg-blue-700 dark:bg-blue-400"].map((cls, i) => (
            <div key={i} className={cn("w-5 h-4 rounded-sm", cls)} />
          ))}
          <span className="text-xs text-muted-foreground">Mais</span>
        </div>
      </div>
    </div>
  );
}
