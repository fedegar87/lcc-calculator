"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { GlassCard } from "@/components/shared/glass-card";
import { KPICard } from "@/components/results/kpi-card";
import { ConstructionBreakdownTable, WLCBreakdownTable } from "@/components/results/breakdown-table";
import { LCCStackedBar } from "@/components/results/charts/lcc-stacked-bar";
import { CostEvolutionLine } from "@/components/results/charts/cost-evolution-line";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import * as motion from "motion/react-client";

interface ResultsDashboardProps {
  variantId: string;
  projectId: string;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="col-span-2 h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function ResultsDashboard({ variantId, projectId: _projectId }: ResultsDashboardProps) {
  const trpc = useTRPC();

  const { data: result, isPending, error, refetch } = useQuery(
    trpc.calculation.calculate.queryOptions({ variantId })
  );

  if (isPending) return <ResultsSkeleton />;

  if (error) {
    return (
      <GlassCard className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error.message || "Calculation failed"}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      </GlassCard>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { title: "LCC", value: result.lcc, unit: "EUR" },
          { title: "WLC", value: result.wlc, unit: "EUR" },
          { title: "LCC/m2", value: result.kpiLCCPerM2 ?? 0, unit: "EUR/m2" },
          {
            title: "Payback",
            value: result.income?.simplePaybackYears ?? 0,
            unit: result.income?.simplePaybackYears != null ? "years" : "N/A",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <KPICard title={kpi.title} value={kpi.value} unit={kpi.unit} />
          </motion.div>
        ))}
      </div>

      {/* Row 2: LCC stacked bar (2 cols) + WLC breakdown table (1 col) */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          className="md:col-span-2"
          custom={4}
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <GlassCard>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              LCC Breakdown
            </h3>
            <LCCStackedBar result={result} />
          </GlassCard>
        </motion.div>
        <motion.div custom={5} initial="hidden" animate="visible" variants={stagger}>
          <GlassCard>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              WLC / LCC Breakdown
            </h3>
            <WLCBreakdownTable
              designCosts={result.designCosts}
              totalConstruction={result.totalConstruction}
              operationAndMaintenance={result.operationAndMaintenance}
              buildingSiteManagement={result.buildingSiteManagement}
              nonConstructionCosts={result.nonConstructionCosts}
              lcc={result.lcc}
              wlc={result.wlc}
              residualValue={result.residualValue}
              lccNetResidual={result.lccNetResidual}
              energyConsumed={result.energyConsumed}
              energyProduced={result.energyProduced}
              maintenanceAtRefPeriod={result.maintenanceAtRefPeriod}
            />
          </GlassCard>
        </motion.div>
      </div>

      {/* Row 3: Cost evolution line chart (full width) */}
      <motion.div custom={6} initial="hidden" animate="visible" variants={stagger}>
        <GlassCard>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Cost Evolution over Reference Period
          </h3>
          <CostEvolutionLine result={result} />
        </GlassCard>
      </motion.div>

      {/* Row 4: Construction breakdown (left) + KPI ratio summary (right) */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div custom={7} initial="hidden" animate="visible" variants={stagger}>
          <GlassCard>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              Construction Cost Breakdown
            </h3>
            <ConstructionBreakdownTable
              constructionByCategory={result.constructionByCategory}
              totalMaterials={result.totalMaterials}
              totalLabor={result.totalLabor}
              totalConstruction={result.totalConstruction}
            />
          </GlassCard>
        </motion.div>
        <motion.div custom={8} initial="hidden" animate="visible" variants={stagger}>
          <GlassCard>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              KPI Ratios
            </h3>
            <div className="space-y-3">
              {[
                { label: "Design / LCC", value: result.kpiDesignOverLCC },
                { label: "Construction / LCC", value: result.kpiConstructionOverLCC },
                { label: "Labor / LCC", value: result.kpiLaborOverLCC },
                { label: "O&M / LCC", value: result.kpiOMOverLCC },
              ].map((kpi) => (
                <div key={kpi.label} className="flex items-center justify-between">
                  <span className="text-sm">{kpi.label}</span>
                  <span className="text-sm font-medium tabular-nums">
                    {kpi.value != null ? percentFormatter.format(kpi.value) : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
