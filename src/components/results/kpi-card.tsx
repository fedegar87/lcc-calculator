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
    <GlassCard className="flex flex-col justify-between gap-2 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
          {title}
        </span>
        {trend && trend !== "neutral" && (
          <span>
            {trend === "up" ? (
              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="size-4 text-destructive" />
            )}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl tabular-nums">
          {hasValue ? formatter.format(value) : "N/A"}
        </span>
        {hasValue ? (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>

      {!hasValue && emptyDescription ? (
        <p className="text-xs text-muted-foreground/80">{emptyDescription}</p>
      ) : delta != null && absoluteDelta != null ? (
        <div className="mt-0.5 space-y-1">
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums border",
              isImprovement
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                : "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
            )}
          >
            <DeltaIcon className="size-3" />
            {percentFormatter.format(delta)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            ({formatDeltaValue(Math.abs(absoluteDelta), unit)}{" "}
            {absoluteDelta >= 0 ? "more" : "less"} than Base)
          </div>
        </div>
      ) : subtitle ? (
        <p className="text-xs text-muted-foreground/80">{subtitle}</p>
      ) : null}
    </GlassCard>
  );
}
