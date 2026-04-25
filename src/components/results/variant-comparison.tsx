"use client";

import dynamic from "next/dynamic";
import { useQueries } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { GlassCard } from "@/components/shared/glass-card";
import { KPICard } from "@/components/results/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import * as motion from "motion/react-client";
import type { LCCResult } from "@/engine/types";
import type { FormulaMode } from "@/engine/types";

const LCCStackedBar = dynamic(() =>
  import("@/components/results/charts/lcc-stacked-bar").then(
    (module) => module.LCCStackedBar,
  ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full rounded-lg" />,
  },
);

const VariantGroupedBar = dynamic(() =>
  import("@/components/results/charts/variant-grouped-bar").then(
    (module) => module.VariantGroupedBar,
  ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 rounded-lg" />,
  },
);

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface VariantComparisonProps {
  projectId: string;
  variants: { id: string; label: string }[];
  formulaMode: FormulaMode;
}

function VariantColumnSkeleton() {
  return (
    <GlassCard className="space-y-4">
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-40 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </GlassCard>
  );
}

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

export function VariantComparison({
  projectId: _projectId,
  variants,
  formulaMode,
}: VariantComparisonProps) {
  const trpc = useTRPC();

  // API-05: Batch calculation uses parallel useQueries instead of a dedicated
  // calculateAll endpoint. With max 3 variants (BASE + VARIANT_1 + VARIANT_2),
  // parallel individual queries are simpler and equally performant.
  const results = useQueries({
    queries: variants.map((v) =>
      trpc.calculation.calculate.queryOptions({ variantId: v.id, formulaMode })
    ),
  });

  if (variants.length === 1) {
    return (
      <GlassCard className="py-8 text-center">
        <p className="text-muted-foreground">
          Only one variant exists. Add more variants to compare results side by side.
        </p>
      </GlassCard>
    );
  }

  const successfulVariants: { label: string; result: LCCResult }[] = [];
  for (let i = 0; i < variants.length; i++) {
    const query = results[i];
    if (query.data) {
      successfulVariants.push({ label: variants[i].label, result: query.data });
    }
  }

  const comparisonWinners = [
    {
      metric: "Lowest LCC",
      winner: successfulVariants.reduce((best, current) =>
        !best || current.result.lcc < best.result.lcc ? current : best
      , null as { label: string; result: LCCResult } | null),
      value: (result: LCCResult) => eurFormatter.format(result.lcc),
    },
    {
      metric: "Lowest WLC",
      winner: successfulVariants.reduce((best, current) =>
        !best || current.result.wlc < best.result.wlc ? current : best
      , null as { label: string; result: LCCResult } | null),
      value: (result: LCCResult) => eurFormatter.format(result.wlc),
    },
    {
      metric: "Lowest LCC/m2",
      winner: successfulVariants.reduce((best, current) =>
        !best ||
        (current.result.kpiLCCPerM2 ?? Number.POSITIVE_INFINITY) <
          (best.result.kpiLCCPerM2 ?? Number.POSITIVE_INFINITY)
          ? current
          : best
      , null as { label: string; result: LCCResult } | null),
      value: (result: LCCResult) =>
        result.kpiLCCPerM2 != null
          ? eurFormatter.format(result.kpiLCCPerM2)
          : "N/A",
    },
    {
      metric: "Fastest payback",
      winner: successfulVariants.reduce((best, current) => {
        const currentValue = current.result.income?.simplePaybackYears;
        const bestValue = best?.result.income?.simplePaybackYears;

        if (currentValue == null) return best;
        if (bestValue == null || currentValue < bestValue) return current;
        return best;
      }, null as { label: string; result: LCCResult } | null),
      value: (result: LCCResult) =>
        result.income?.simplePaybackYears != null
          ? `${result.income.simplePaybackYears.toFixed(1)} years`
          : "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      {successfulVariants.length > 1 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {comparisonWinners.map((item) => (
            <GlassCard key={item.metric} className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.metric}
              </div>
              <div className="text-sm font-semibold">
                {item.winner?.label ?? "No winner"}
              </div>
              <div className="text-sm text-muted-foreground">
                {item.winner ? item.value(item.winner.result) : "Not available"}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : null}

      {/* Per-variant columns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {variants.map((v, i) => {
          const query = results[i];

          if (query.isPending) {
            return <VariantColumnSkeleton key={v.id} />;
          }

          if (query.error) {
            return (
              <motion.div
                key={v.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={stagger}
              >
                <GlassCard className="flex flex-col items-center gap-2 py-8">
                  <h3 className="text-sm font-medium">{v.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {query.error.message.includes("Missing boundary")
                      ? "Incomplete data"
                      : "Calculation failed"}
                  </p>
                </GlassCard>
              </motion.div>
            );
          }

          const result = query.data;
          if (!result) return null;

          return (
            <motion.div
              key={v.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <GlassCard className="space-y-4">
                <h3 className="text-sm font-semibold">{v.label}</h3>

                {/* Mini KPIs */}
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
                  <KPICard title="LCC" value={result.lcc} unit="EUR" />
                  <KPICard title="WLC" value={result.wlc} unit="EUR" />
                  <KPICard
                    title="LCC/m2"
                    value={result.kpiLCCPerM2 ?? 0}
                    unit="EUR/m2"
                  />
                </div>

                {/* Mini stacked bar */}
                <div className="h-[150px]">
                  <LCCStackedBar result={result} showTable={false} />
                </div>

                {/* Key metrics */}
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: "Energy consumed", value: result.energyConsumed },
                    { label: "Energy produced (PV)", value: result.energyProduced },
                    { label: "Maintenance", value: result.maintenanceAtRefPeriod },
                    { label: "O&M Total", value: result.operationAndMaintenance },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="tabular-nums font-medium">
                        {eurFormatter.format(row.value)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border bg-muted/20 p-3 text-sm">
                  <div className="font-medium">Variant callout</div>
                  <p className="mt-1 text-muted-foreground">
                    {successfulVariants.length > 1 &&
                    result.lcc ===
                      Math.min(...successfulVariants.map((entry) => entry.result.lcc))
                      ? "This variant currently has the lowest LCC."
                      : "Use the grouped chart and winner cards above to compare this option against the others."}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Full-width grouped bar chart */}
      {successfulVariants.length > 1 && (
        <motion.div
          custom={variants.length}
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <GlassCard>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              Variant Comparison
            </h3>
            <VariantGroupedBar variants={successfulVariants} />
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
