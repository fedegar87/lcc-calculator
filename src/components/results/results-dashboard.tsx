"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { GlassCard } from "@/components/shared/glass-card";
import { KPICard } from "@/components/results/kpi-card";
import { ConstructionBreakdownTable, WLCBreakdownTable } from "@/components/results/breakdown-table";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import * as motion from "motion/react-client";
import type { LCCResult } from "@/engine/types";
import type { FormulaMode } from "@/engine/types";
import { ReferenceButton } from "@/components/shared/reference-button";
import { UNITS } from "@/lib/units";
import {
  FOUNDATIONAL_CITATIONS,
  METHODOLOGY_CITATIONS,
  BOUNDARY_CITATIONS,
} from "@/lib/citations";
import { getAnalysisYears } from "@/lib/results/time-series";

const LCCStackedBar = dynamic(() =>
  import("@/components/results/charts/lcc-stacked-bar").then(
    (module) => module.LCCStackedBar,
  ),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="bar" className="h-72" />,
  },
);

const CostEvolutionLine = dynamic(() =>
  import("@/components/results/charts/cost-evolution-line").then(
    (module) => module.CostEvolutionLine,
  ),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="line" className="h-72" />,
  },
);

function buildLccBreakdownAssumptions(result: LCCResult) {
  return [
    {
      rule: `LCC calculated over a ${getAnalysisYears(result)}-year analysis period`,
      rationale:
        "The reference period comes from the variant boundary conditions and is reported with the calculation result.",
      citationId: "iso-15686-5",
    },
    {
      rule: "Residual value is calculated and shown separately",
      rationale:
        "Headline LCC/WLC are gross totals; LCC net residual subtracts the prorated service-component residual value.",
      citationId: "vazquez-lopez-2020",
    },
    {
      rule: "Maintenance uses nominal rate (Rint), energy uses real-rate discounting",
      rationale:
        "This convention is inherited from the CRAVEzero spreadsheet replica and is kept explicit until method profiles become selectable.",
    },
  ];
}

function buildCostEvolutionAssumptions(result: LCCResult) {
  return [
    {
      rule: `Real discount rate = ${(result.realInterestRate * 100).toFixed(2)}%`,
      rationale:
        "The value is derived from the variant nominal interest and inflation rates using the active formula mode.",
    },
    {
      rule: "Energy escalation uses per-carrier annual increase scalars",
      rationale:
        "Scenario curves are not implemented yet; current energy costs use the annual increase stored for each energy source.",
      citationId: "eurostat-electricity",
    },
  ];
}

const CONSTRUCTION_ASSUMPTIONS = [
  {
    rule: "Element breakdown follows the European Code of Measurement (CEEC)",
    rationale:
      "Standardised structure for cross-country LCC comparability; same breakdown used for the 11 CRAVEzero case studies.",
    citationId: "ceec-2004",
  },
  {
    rule: "Detail cost = MAX(material, unit × area)",
    rationale:
      "Resolved in the tRPC layer before the engine runs — the engine sees pre-aggregated costs.",
  },
];

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
      <div className="grid grid-cols-2 gap-4">
        <ChartSkeleton variant="table" className="h-64" />
        <ChartSkeleton variant="bar" className="h-64" />
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
        <span className="text-sm">{label}</span>
        <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums">
          {isAnomaly ? (
            <AlertCircle
              className="size-3.5 text-destructive"
              aria-label="Unexpected ratio greater than 100 percent"
            />
          ) : null}
          {hasValue ? percentFormatter.format(value) : "N/A"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted" title={isAnomaly ? "Unexpected ratio > 100%" : undefined}>
        <div
          className={isAnomaly ? "h-1.5 rounded-full bg-destructive" : `h-1.5 rounded-full ${RATIO_BAR_CLASSES[domain]}`}
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
  const baseVariantId = project?.variants.find(
    (variant) => variant.label === "BASE",
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
          title="No results yet"
          description="Complete the required WLC, project info, and construction inputs to generate the first LCC breakdown."
          action={
            <Button render={<Link href={`/projects/${projectId}/wlc`} />}>
              Go to WLC step
            </Button>
          }
        />
      );
    }

    return (
      <GlassCard className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {errorMessage}
        </p>
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
        description="Fill at least project info and one construction category to see the LCC breakdown."
        action={
          <Button render={<Link href={`/projects/${projectId}/info`} />}>
            Go to Step 1
          </Button>
        }
      />
    );
  }

  const hasAnyConstructionData =
    result.totalConstruction > 0 ||
    Object.values(result.constructionByCategory).some((value) => value > 0);

  if (result.lcc === 0 && !hasAnyConstructionData) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-5" />}
        title="No results yet"
        description="Fill at least project info and one construction category to see the LCC breakdown."
        action={
          <Button render={<Link href={`/projects/${projectId}/info`} />}>
            Go to Step 1
          </Button>
        }
      />
    );
  }

  const baseSubtitle = isBaseVariant ? "Reference variant" : undefined;
  const lccBreakdownAssumptions = buildLccBreakdownAssumptions(result);
  const costEvolutionAssumptions = buildCostEvolutionAssumptions(result);

  return (
    <div className="space-y-4">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            title: "LCC",
            value: result.lcc,
            unit: "EUR",
            baseValue: baseResult?.lcc,
          },
          {
            title: "WLC",
            value: result.wlc,
            unit: "EUR",
            baseValue: baseResult?.wlc,
          },
          {
            title: `LCC/${UNITS.m2}`,
            value: result.kpiLCCPerM2,
            unit: UNITS.EUR_m2,
            baseValue: baseResult?.kpiLCCPerM2,
          },
          {
            title: "Payback",
            value: result.income?.simplePaybackYears ?? null,
            unit: "years",
            baseValue: baseResult?.income?.simplePaybackYears ?? null,
            emptyDescription: "Enable income inputs to compute payback.",
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
              subtitle={baseSubtitle}
              emptyDescription={kpi.emptyDescription}
              lowerIsBetter
            />
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
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                LCC Breakdown
              </h3>
              <ReferenceButton
                domain="construction"
                title="LCC breakdown — methodology"
                citations={FOUNDATIONAL_CITATIONS}
                assumptions={lccBreakdownAssumptions}
              />
            </div>
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
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Cost Evolution over Reference Period
            </h3>
            <ReferenceButton
              domain="fin"
              title="Cost evolution — boundary conditions"
              citations={BOUNDARY_CITATIONS}
              assumptions={costEvolutionAssumptions}
            />
          </div>
          <CostEvolutionLine result={result} />
        </GlassCard>
      </motion.div>

      {/* Row 4: Construction breakdown (left) + KPI ratio summary (right) */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div custom={7} initial="hidden" animate="visible" variants={stagger}>
          <GlassCard>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Construction Cost Breakdown
              </h3>
              <ReferenceButton
                domain="construction"
                title="Construction breakdown — CEEC structure"
                citations={METHODOLOGY_CITATIONS}
                assumptions={CONSTRUCTION_ASSUMPTIONS}
              />
            </div>
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
