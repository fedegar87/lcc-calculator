"use client";

import { useQueries } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { GlassCard } from "@/components/shared/glass-card";
import { KPICard } from "@/components/results/kpi-card";
import { LCCStackedBar } from "@/components/results/charts/lcc-stacked-bar";
import { VariantGroupedBar } from "@/components/results/charts/variant-grouped-bar";
import { Skeleton } from "@/components/ui/skeleton";
import * as motion from "motion/react-client";
import type { LCCResult } from "@/engine/types";

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface VariantComparisonProps {
  projectId: string;
  variants: { id: string; label: string }[];
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

export function VariantComparison({ projectId: _projectId, variants }: VariantComparisonProps) {
  const trpc = useTRPC();

  // API-05: Batch calculation uses parallel useQueries instead of a dedicated
  // calculateAll endpoint. With max 3 variants (BASE + VARIANT_1 + VARIANT_2),
  // parallel individual queries are simpler and equally performant.
  const results = useQueries({
    queries: variants.map((v) =>
      trpc.calculation.calculate.queryOptions({ variantId: v.id })
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

  return (
    <div className="space-y-6">
      {/* Per-variant columns */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${variants.length}, minmax(0, 1fr))` }}
      >
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
                  <LCCStackedBar result={result} />
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
