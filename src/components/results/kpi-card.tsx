import { TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";

interface KPICardProps {
  title: string;
  value: number | null;
  unit: string;
  trend?: Trend;
  subtitle?: string;
  emptyDescription?: string;
  baseValue?: number | null;
  lowerIsBetter?: boolean;
}

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatDeltaValue(value: number, unit: string) {
  if (unit === "EUR") return eurFormatter.format(value);
  return `${formatter.format(value)} ${unit}`;
}

export function KPICard({
  title,
  value,
  unit,
  trend,
  subtitle,
  emptyDescription,
  baseValue,
  lowerIsBetter = true,
}: KPICardProps) {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  let delta: number | null = null;
  let absoluteDelta: number | null = null;

  if (
    hasValue &&
    typeof value === "number" &&
    typeof baseValue === "number" &&
    Number.isFinite(baseValue) &&
    baseValue !== 0
  ) {
    absoluteDelta = value - baseValue;
    delta = absoluteDelta / baseValue;
  }
  const isImprovement =
    delta == null
      ? null
      : lowerIsBetter
        ? delta <= 0
        : delta >= 0;
  const DeltaIcon = delta != null && delta >= 0 ? TrendingUp : TrendingDown;

  return (
    <GlassCard className="flex flex-col gap-1 p-4">
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums">
          {hasValue ? formatter.format(value) : "N/A"}
        </span>
        {hasValue ? (
          <span className="text-sm text-muted-foreground">{unit}</span>
        ) : null}
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
      {!hasValue && emptyDescription ? (
        <p className="text-xs text-muted-foreground">{emptyDescription}</p>
      ) : delta != null && absoluteDelta != null ? (
        <div className="mt-1 space-y-0.5">
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
              isImprovement ? "text-emerald-600" : "text-destructive",
            )}
          >
            <DeltaIcon className="size-3.5" />
            {percentFormatter.format(delta)}
          </div>
          <div className="text-xs text-muted-foreground">
            ({formatDeltaValue(Math.abs(absoluteDelta), unit)}{" "}
            {absoluteDelta >= 0 ? "more" : "less"} than Base)
          </div>
        </div>
      ) : subtitle ? (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </GlassCard>
  );
}
