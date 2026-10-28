"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { GlassCard } from "@/components/shared/glass-card";
import { KPICard } from "@/components/results/kpi-card";
import {
  ConstructionBreakdownTable,
  WLCBreakdownTable,
} from "@/components/results/breakdown-table";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import * as motion from "motion/react-client";
import type { LCCResult, FormulaMode } from "@/engine/types";
import { UNITS } from "@/lib/units";
import { cn } from "@/lib/utils";

const LCCStackedBar = dynamic(
  () =>
    import("@/components/results/charts/lcc-stacked-bar").then(
      (module) => module.LCCStackedBar
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="bar" className="h-72" />,
  }
);

const CostEvolutionLine = dynamic(
  () =>
    import("@/components/results/charts/cost-evolution-line").then(
      (module) => module.CostEvolutionLine
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="line" className="h-72" />,
  }
);

interface ResultsDashboardProps {
  variantId: string;
  projectId: string;
  formulaMode?: FormulaMode;
  resultOverride?: LCCResult | null;
  skipQuery?: boolean;
  loadingOverride?: boolean;
  errorOverride?: { message?: string } | null;
  onRetryOverride?: () => void;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartSkeleton key={i} variant="table" className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ChartSkeleton variant="bar" className="col-span-2 h-80" />
        <ChartSkeleton variant="table" className="h-80" />
      </div>
      <ChartSkeleton variant="line" className="h-72" />
    </div>
  );
}

const stagger = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.25 },
  }),
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const RATIO_BAR_CLASSES = {
  fin: "bg-fin-500",
  construction: "bg-construction-500",
  mnt: "bg-mnt-500",
  res: "bg-res-500",
} as const;

function RatioBar({
  label,
  value,
  domain,
}: {
  label: string;
  value: number | null;
  domain: keyof typeof RATIO_BAR_CLASSES;
}) {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const isAnomaly = hasValue && value > 1;
  const width = hasValue ? Math.min(Math.max(value, 0), 1) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-foreground">
          {isAnomaly ? (
            <AlertCircle
              className="size-3.5 text-destructive"
              aria-label="Ratio greater than 100 percent"
            />
          ) : null}
          {hasValue ? percentFormatter.format(value) : "N/A"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/70 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isAnomaly ? "bg-destructive" : RATIO_BAR_CLASSES[domain]
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function ResultsDashboard({
  variantId,
  projectId,
  formulaMode = "excel_bugfixed",
  resultOverride,
  skipQuery = false,
  loadingOverride = false,
  errorOverride = null,
  onRetryOverride,
}: ResultsDashboardProps) {
  const trpc = useTRPC();

  const { data, isPending, error, refetch } = useQuery({
    ...trpc.calculation.calculate.queryOptions({ variantId, formulaMode }),
    enabled: !skipQuery && !resultOverride,
  });
  const { data: project } = useQuery({
    ...trpc.project.getById.queryOptions({ projectId }),
    enabled: Boolean(projectId),
  });
  const { data: variant } = useQuery({
    ...trpc.variant.getById.queryOptions({ variantId }),
    enabled: Boolean(variantId),
  });

  const baseVariantId = project?.variants.find(
    (v) => v.label === "BASE"
  )?.id;
  const isBaseVariant = baseVariantId === variantId;
  const { data: baseResult } = useQuery({
    ...trpc.calculation.calculate.queryOptions({
      variantId: baseVariantId ?? variantId,
      formulaMode,
    }),
    enabled: Boolean(baseVariantId && baseVariantId !== variantId),
  });

  const result = resultOverride ?? data;
  const isLoading = skipQuery ? loadingOverride : !resultOverride && isPending;
  const errorState = skipQuery ? errorOverride : error;

  if (isLoading) return <ResultsSkeleton />;

  if (errorState) {
    const errorMessage = errorState.message || "Calculation failed";
    const isMissingInputs =
      errorMessage.includes("Missing boundary") ||
      errorMessage.includes("Input validation failed");

    if (isMissingInputs) {
      return (
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="Missing basic inputs for calculation"
          description="Please check that Treated Floor Area (Tab 1) and Economic Boundary Conditions (Tab 2) are filled in."
          action={
            <Button
              render={
                <Link
                  href={`/projects/${projectId}/info?v=${encodeURIComponent(variantId)}`}
                />
              }
            >
              Go to 1. Project & Geometry
            </Button>
          }
        />
      );
    }

    return (
      <GlassCard className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onRetryOverride) {
              onRetryOverride();
            } else {
              refetch();
            }
          }}
        >
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </GlassCard>
    );
  }

  if (!result) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-5" />}
        title="No results yet"
        description="Fill at least project geometry and construction or energy inputs to see the LCC breakdown."
        action={
          <Button
            render={
              <Link
                href={`/projects/${projectId}/info?v=${encodeURIComponent(variantId)}`}
              />
            }
          >
            Go to 1. Project & Geometry
          </Button>
        }
      />
    );
  }

  const treatedFloorArea = variant?.geometry?.treatedFloorArea ?? 0;
  const investmentCost =
    result.totalConstruction +
    result.designCosts +
    result.buildingSiteManagement;
  const baseInvestmentCost = baseResult
    ? baseResult.totalConstruction +
      baseResult.designCosts +
      baseResult.buildingSiteManagement
    : undefined;

  const formatPerM2Sub = (amount: number) => {
    if (treatedFloorArea > 0) {
      return `${Math.round(amount / treatedFloorArea).toLocaleString("en-US")} ${UNITS.EUR_m2}`;
    }
    return isBaseVariant ? "Reference scenario" : undefined;
  };

  return (
    <div className="space-y-4">
      {/* Row 1: 4 Primary KPI Cards matching the CRAVEzero Results sheet */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            title: "Life-Cycle Cost (LCC)",
            value: result.lcc,
            unit: "EUR",
            baseValue: baseResult?.lcc,
            subtitle: formatPerM2Sub(result.lcc),
          },
          {
            title: "Whole-Life Cost (WLC)",
            value: result.wlc,
            unit: "EUR",
            baseValue: baseResult?.wlc,
            subtitle: formatPerM2Sub(result.wlc),
          },
          {
            title: "Investment Cost",
            value: investmentCost,
            unit: "EUR",
            baseValue: baseInvestmentCost,
            subtitle: formatPerM2Sub(investmentCost),
          },
          {
            title: "Operation & Maint. (O&M)",
            value: result.operationAndMaintenance,
            unit: "EUR",
            baseValue: baseResult?.operationAndMaintenance,
            subtitle: formatPerM2Sub(result.operationAndMaintenance),
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <KPICard
              title={kpi.title}
              value={kpi.value}
              unit={kpi.unit}
              baseValue={kpi.baseValue}
              subtitle={kpi.subtitle}
              lowerIsBetter
            />
          </motion.div>
        ))}
      </div>

      {/* Optional Income & Payback Strip if Income is enabled */}
      {result.income && result.income.netAnnualIncome > 0 && (
        <GlassCard className="flex flex-wrap items-center justify-between gap-4 py-3 px-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Income & Profitability Indicators
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Net Annual Income: </span>
              <strong className="tabular-nums">
                €{Math.round(result.income.netAnnualIncome).toLocaleString("en-US")}/yr
              </strong>
            </div>
            {result.income.simplePaybackYears != null && (
              <div>
                <span className="text-muted-foreground">Simple Payback: </span>
                <strong className="tabular-nums">
                  {result.income.simplePaybackYears.toFixed(1)} years
                </strong>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Income NPV: </span>
              <strong className="tabular-nums">
                €{Math.round(result.income.npvIncomeStream).toLocaleString("en-US")}
              </strong>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Row 2: LCC Stacked Bar (left) + WLC/LCC Summary Table with EUR and EUR/m² (right) */}
      <div className="grid gap-4 lg:grid-cols-12">
        <motion.div
          className="lg:col-span-7"
          custom={4}
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <GlassCard className="h-full">
            <div className="mb-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                LCC & WLC Breakdown Chart
              </h3>
              <p className="text-xs text-muted-foreground">
                Distribution of investment, operation, and maintenance costs over
                the reference study period.
              </p>
            </div>
            <LCCStackedBar result={result} />
          </GlassCard>
        </motion.div>

        <motion.div
          className="lg:col-span-5"
          custom={5}
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <GlassCard className="h-full">
            <div className="mb-3">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Summary Table (WLC & LCC)
              </h3>
              <p className="text-xs text-muted-foreground">
                Total EUR and specific {UNITS.EUR_m2} breakdown.
              </p>
            </div>
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
              treatedFloorArea={treatedFloorArea}
            />
          </GlassCard>
        </motion.div>
      </div>

      {/* Row 3: Cost Evolution Line Chart */}
      <motion.div custom={6} initial="hidden" animate="visible" variants={stagger}>
        <GlassCard>
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Cumulative Cost Evolution over Reference Period
            </h3>
            <p className="text-xs text-muted-foreground">
              Discounted cumulative cash flows (Real discount rate:{" "}
              {(result.realInterestRate * 100).toFixed(2)}%).
            </p>
          </div>
          <CostEvolutionLine result={result} />
        </GlassCard>
      </motion.div>

      {/* Row 4: Construction Breakdown by Category (left) + KPI Ratios (right) */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div custom={7} initial="hidden" animate="visible" variants={stagger}>
          <GlassCard>
            <div className="mb-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Construction Cost Breakdown (Categories A–E)
              </h3>
              <p className="text-xs text-muted-foreground">
                Aggregated construction costs by European Code of Measurement
                category.
              </p>
            </div>
            <ConstructionBreakdownTable
              constructionByCategory={result.constructionByCategory}
              totalMaterials={result.totalMaterials}
              totalLabor={result.totalLabor}
              totalConstruction={result.totalConstruction}
              treatedFloorArea={treatedFloorArea}
            />
          </GlassCard>
        </motion.div>

        <motion.div custom={8} initial="hidden" animate="visible" variants={stagger}>
          <GlassCard>
            <div className="mb-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Investment & Life-Cycle Cost Ratios
              </h3>
              <p className="text-xs text-muted-foreground">
                Relative weight of design, construction, labor, and O&M relative
                to total investment cost.
              </p>
            </div>
            <div className="space-y-3.5">
              {[
                {
                  label: "Design / Investment Cost",
                  value: result.kpiDesignOverInvestmentCost,
                  domain: "fin" as const,
                },
                {
                  label: "Construction / Investment Cost",
                  value: result.kpiConstructionOverInvestmentCost,
                  domain: "construction" as const,
                },
                {
                  label: "Labor / Investment Cost",
                  value: result.kpiLaborOverInvestmentCost,
                  domain: "construction" as const,
                },
                {
                  label: "O&M / Investment Cost",
                  value: result.kpiOMOverInvestmentCost,
                  domain: "mnt" as const,
                },
              ].map((kpi) => (
                <RatioBar
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  domain={kpi.domain}
                />
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
