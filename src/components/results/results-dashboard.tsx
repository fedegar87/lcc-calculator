"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { GlassCard } from "@/components/shared/glass-card";
import { KPICard } from "@/components/results/kpi-card";
import { ConstructionBreakdownTable, WLCBreakdownTable } from "@/components/results/breakdown-table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import * as motion from "motion/react-client";
import type { LCCResult } from "@/engine/types";
import type { FormulaMode } from "@/engine/types";
import { ReferenceButton } from "@/components/shared/reference-button";
import {
  FOUNDATIONAL_CITATIONS,
  METHODOLOGY_CITATIONS,
  BOUNDARY_CITATIONS,
} from "@/lib/citations";

const LCCStackedBar = dynamic(() =>
  import("@/components/results/charts/lcc-stacked-bar").then(
    (module) => module.LCCStackedBar,
  ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 rounded-lg" />,
  },
);

const CostEvolutionLine = dynamic(() =>
  import("@/components/results/charts/cost-evolution-line").then(
    (module) => module.CostEvolutionLine,
  ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 rounded-lg" />,
  },
);

const LCC_BREAKDOWN_ASSUMPTIONS = [
  {
    rule: "NPV computed over a 40-year analysis period",
    rationale:
      "Pernetti et al. 2021 — balances life-cycle perspective and forecast reliability for nZEBs.",
    citationId: "pernetti-2021-scs",
  },
  {
    rule: "End-of-life costs excluded by default",
    rationale:
      "EU-wide demolition/disposal data is fragmented; included as an opt-in via Vázquez-López et al. 2020 method.",
    citationId: "vazquez-lopez-2020",
  },
  {
    rule: "Maintenance uses nominal rate (Rint), energy uses real (RR)",
    rationale:
      "Asymmetry inherited from the CRAVEzero spreadsheet — maintenance contracts are quoted nominally, energy-price escalators are typically real.",
  },
];

const COST_EVOLUTION_ASSUMPTIONS = [
  {
    rule: "Real discount rate = 1.51% baseline",
    rationale:
      "Euro-area average 2009–2016 (FRED INTDSREZQ193N) — the same baseline used in the foundational paper.",
    citationId: "fred-eurodiscount",
  },
  {
    rule: "Energy price escalation independent of general inflation",
    rationale:
      "Bounds taken from Eurostat per-country ranges; Pernetti 2021 shows escalation × interest rate is the strongest non-linear driver of LCC.",
    citationId: "eurostat-electricity",
  },
];

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

export function ResultsDashboard({
  variantId,
  projectId: _projectId,
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
  const result = resultOverride ?? data;
  const isLoading = skipQuery ? loadingOverride : !resultOverride && isPending;
  const errorState = skipQuery ? errorOverride : error;

  if (isLoading) return <ResultsSkeleton />;

  if (errorState) {
    return (
      <GlassCard className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {errorState.message || "Calculation failed"}
        </p>
        <button
          onClick={() => {
            if (onRetryOverride) {
              onRetryOverride();
            } else {
              refetch();
            }
          }}
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
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                LCC Breakdown
              </h3>
              <ReferenceButton
                domain="construction"
                title="LCC breakdown — methodology"
                citations={FOUNDATIONAL_CITATIONS}
                assumptions={LCC_BREAKDOWN_ASSUMPTIONS}
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
              assumptions={COST_EVOLUTION_ASSUMPTIONS}
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
                },
                {
                  label: "Construction / Investment Cost",
                  value: result.kpiConstructionOverInvestmentCost,
                },
                {
                  label: "Labor / Investment Cost",
                  value: result.kpiLaborOverInvestmentCost,
                },
                {
                  label: "O&M / Investment Cost",
                  value: result.kpiOMOverInvestmentCost,
                },
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
