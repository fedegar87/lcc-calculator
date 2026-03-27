import { TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";

type Trend = "up" | "down" | "neutral";

interface KPICardProps {
  title: string;
  value: number;
  unit: string;
  trend?: Trend;
}

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function KPICard({ title, value, unit, trend }: KPICardProps) {
  return (
    <GlassCard className="flex flex-col gap-1 p-4">
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums">
          {formatter.format(value)}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
        {trend && trend !== "neutral" && (
          <span className="ml-auto">
            {trend === "up" ? (
              <TrendingUp className="size-4 text-green-600" />
            ) : (
              <TrendingDown className="size-4 text-destructive" />
            )}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
