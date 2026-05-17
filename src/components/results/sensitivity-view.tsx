"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/server/trpc/client";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { ReferenceButton } from "@/components/shared/reference-button";
import { FOUNDATIONAL_CITATIONS } from "@/lib/citations";
import {
  BarChart3,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  SensitivityTornado,
  type TornadoRow,
  baselineOutputLabel,
} from "./sensitivity-tornado";
import {
  SensitivityEEScatter,
  type EEScatterPoint,
} from "./sensitivity-ee-scatter";
import {
  SensitivityBoxPlot,
  type BoxRow,
} from "./sensitivity-box-plot";
import type { FormulaMode } from "@/engine/types";

const PAPER_TOP4 = [
  "interestRate",
  "buildingElementMaintenancePercent",
  "service.hvac.maintenancePctMultiplier",
  "costItems.A9_STRUCTURE.totalCost",
] as const;

interface DSAEntryView {
  parameterId: string;
  output: string;
  baselineInput: number;
  baselineOutput: number;
  plusInput: number;
  minusInput: number;
  plusOutput: number;
  minusOutput: number;
  relativeChangePlus: number;
  relativeChangeMinus: number;
  sensitivityIndex: number;
}

interface EEEntryView {
  parameterId: string;
  output: string;
  mu: number;
  muStar: number;
  sigma: number;
}

interface EEDistributionView {
  output: string;
  samples: number[];
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  whiskerLow: number;
  whiskerHigh: number;
}

interface SensitivityViewProps {
  projectId: string;
  variantId: string;
  formulaMode: FormulaMode;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function SensitivityView({
  variantId,
  formulaMode,
}: SensitivityViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [lastRun, setLastRun] = useState<{
    entries: DSAEntryView[];
    baselineOutput: number;
    output: string;
  } | null>(null);
  const [lastEE, setLastEE] = useState<{
    entries: EEEntryView[];
    distribution: EEDistributionView[];
    scheme: "fixedPct" | "literature";
    elapsedMs: number;
    engineRuns: number;
  } | null>(null);
  const [scatterScale, setScatterScale] = useState<"linear" | "log">("linear");
  const [restoreRunId, setRestoreRunId] = useState<string | null>(null);

  async function handleRestoreRun(runId: string, method: "DSA" | "EE") {
    setRestoreRunId(runId);
    try {
      const run = await queryClient.fetchQuery(
        trpc.sensitivity.getRun.queryOptions({ runId }),
      );
      if (method === "DSA") {
        const entries = run.result as unknown as DSAEntryView[];
        const baseline = run.baselineSnapshot as { lcc: number };
        setLastRun({
          entries,
          baselineOutput: baseline.lcc,
          output: "lcc",
        });
      } else {
        const payload = run.result as unknown as {
          entries: EEEntryView[];
          distribution: EEDistributionView[];
        };
        const diag = run.diagnostics as {
          engineRuns: number;
          elapsedMs: number;
          variationScheme?: "fixedPct" | "literature";
        };
        setLastEE({
          entries: payload.entries,
          distribution: payload.distribution,
          scheme: diag.variationScheme ?? "literature",
          elapsedMs: diag.elapsedMs,
          engineRuns: diag.engineRuns,
        });
      }
      toast.success(`Restored ${method} run`);
    } catch (err) {
      toast.error(`Restore failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setRestoreRunId(null);
    }
  }

  const parametersQuery = useQuery(
    trpc.sensitivity.listParameters.queryOptions({ variantId, formulaMode }),
  );

  const runsQuery = useQuery(
    trpc.sensitivity.listRuns.queryOptions({ variantId }),
  );

  const runDSA = useMutation(
    trpc.sensitivity.runDSA.mutationOptions({
      onSuccess: (data) => {
        setLastRun({
          entries: data.entries,
          baselineOutput: data.baseline.lcc,
          output: "lcc",
        });
        toast.success(
          `DSA complete — ${data.diagnostics.engineRuns} engine runs, ${data.diagnostics.elapsedMs} ms`,
        );
        queryClient.invalidateQueries({
          queryKey: trpc.sensitivity.listRuns.queryKey({ variantId }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const runEE = useMutation(
    trpc.sensitivity.runEE.mutationOptions({
      onSuccess: (data) => {
        setLastEE({
          entries: data.entries,
          distribution: data.distribution,
          scheme: data.diagnostics.variationScheme,
          elapsedMs: data.diagnostics.elapsedMs,
          engineRuns: data.diagnostics.engineRuns,
        });
        toast.success(
          `EE complete — ${data.diagnostics.engineRuns} engine runs, ${data.diagnostics.elapsedMs} ms`,
        );
        queryClient.invalidateQueries({
          queryKey: trpc.sensitivity.listRuns.queryKey({ variantId }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const applicableParamIds = useMemo(
    () => new Set((parametersQuery.data ?? []).map((p) => p.id)),
    [parametersQuery.data],
  );

  const top4Available = PAPER_TOP4.filter((id) => applicableParamIds.has(id));
  const allParamIds = useMemo(
    () => (parametersQuery.data ?? []).map((p) => p.id),
    [parametersQuery.data],
  );

  function handleQuickRun() {
    if (top4Available.length === 0) {
      toast.error(
        "None of the paper's top-4 parameters apply to this variant. Add structural costs or service components first.",
      );
      return;
    }
    runDSA.mutate({
      variantId,
      parameters: top4Available as unknown as string[],
      outputs: ["lcc"],
      delta: 0.1,
      formulaMode,
    });
  }

  function handleFullRun() {
    if (allParamIds.length === 0) {
      toast.error("No applicable sensitivity parameters for this variant yet.");
      return;
    }
    runDSA.mutate({
      variantId,
      parameters: allParamIds,
      outputs: ["lcc"],
      delta: 0.1,
      formulaMode,
    });
  }

  function handleEERun(scheme: "fixedPct" | "literature") {
    if (allParamIds.length < 2) {
      toast.error(
        "EE needs at least 2 applicable parameters. Add construction items or service components first.",
      );
      return;
    }
    runEE.mutate({
      variantId,
      parameters: allParamIds,
      outputs: ["lcc"],
      r: 10,
      rCandidates: 10_000,
      rSamples: 100,
      p: 4,
      seed: 42,
      variationScheme: scheme,
      formulaMode,
    });
  }

  const eeScatterPoints = useMemo<EEScatterPoint[]>(() => {
    if (!lastEE) return [];
    const specsById = new Map(
      (parametersQuery.data ?? []).map((p) => [p.id, p]),
    );
    return lastEE.entries
      .filter((e) => e.output === "lcc")
      .map((e) => ({
        parameterId: e.parameterId,
        label: specsById.get(e.parameterId)?.label ?? e.parameterId,
        muStar: e.muStar,
        sigma: e.sigma,
      }));
  }, [lastEE, parametersQuery.data]);

  const eeBoxRows = useMemo<BoxRow[]>(() => {
    if (!lastEE) return [];
    return lastEE.distribution.map((d) => ({
      output: d.output,
      label: baselineOutputLabel(d.output),
      min: d.min,
      max: d.max,
      p25: d.p25,
      p75: d.p75,
      median: d.median,
      whiskerLow: d.whiskerLow,
      whiskerHigh: d.whiskerHigh,
    }));
  }, [lastEE]);

  const tornadoRows = useMemo<TornadoRow[]>(() => {
    if (!lastRun) return [];
    const specsById = new Map(
      (parametersQuery.data ?? []).map((p) => [p.id, p]),
    );
    return lastRun.entries
      .filter((entry) => entry.output === lastRun.output)
      .map((entry) => ({
        parameterId: entry.parameterId,
        label: specsById.get(entry.parameterId)?.label ?? entry.parameterId,
        baseline: entry.baselineOutput,
        plus: entry.plusOutput,
        minus: entry.minusOutput,
        sensitivityIndex: entry.sensitivityIndex,
      }));
  }, [lastRun, parametersQuery.data]);

  if (parametersQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <ChartSkeleton variant="bar" className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-base font-semibold">Sensitivity analysis</h2>
            <p className="text-sm text-muted-foreground">
              Local one-at-a-time DSA at ±10% per Pernetti et al. 2021. The
              paper&apos;s top-4 dominant parameters (interest rate, structural
              construction cost, building-element maintenance, HVAC maintenance)
              account for ~26% of LCC variability across 11 nZEB case studies.
            </p>
          </div>
          <ReferenceButton
            domain="fin"
            title="DSA methodology — Pernetti 2021"
            citations={FOUNDATIONAL_CITATIONS}
            label="Paper"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleQuickRun}
            disabled={runDSA.isPending || top4Available.length === 0}
          >
            {runDSA.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Quick run — paper top 4 ({top4Available.length} available)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleFullRun}
            disabled={runDSA.isPending || allParamIds.length === 0}
          >
            <Play className="size-4" />
            Run all {allParamIds.length} parameters
          </Button>
        </div>

        {applicableParamIds.size === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No applicable parameters yet. Add construction costs or service
            components to the variant first.
          </p>
        ) : null}

        <div className="mt-4 border-t pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Elementary Effects (Morris, paper §2.2.3) — r=10, p=4
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleEERun("literature")}
              disabled={runEE.isPending || allParamIds.length < 2}
            >
              {runEE.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              EE — literature bounds ({allParamIds.length} params)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleEERun("fixedPct")}
              disabled={runEE.isPending || allParamIds.length < 2}
            >
              <Play className="size-4" />
              EE — fixed ±10%
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            EE runs r·(n+1) ≈ {allParamIds.length > 0 ? 10 * (allParamIds.length + 1) : 0}{" "}
            engine evaluations and is reproducible under seed=42.
          </p>
        </div>
      </GlassCard>

      {lastRun ? (
        <GlassCard>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Latest run — tornado on {baselineOutputLabel(lastRun.output)}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Sorted by sensitivity index
            </span>
          </div>
          <SensitivityTornado
            rows={tornadoRows}
            baselineOutput={lastRun.baselineOutput}
            outputLabel={baselineOutputLabel(lastRun.output)}
          />
        </GlassCard>
      ) : (
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="No sensitivity run yet"
          description="Run a DSA above to see which inputs drive your LCC the most."
        />
      )}

      {lastEE ? (
        <>
          <GlassCard>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Elementary Effects — μ* vs σ ({lastEE.scheme} bounds)
              </h3>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  className={`rounded-md border px-2 py-0.5 ${
                    scatterScale === "linear"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setScatterScale("linear")}
                >
                  linear
                </button>
                <button
                  type="button"
                  className={`rounded-md border px-2 py-0.5 ${
                    scatterScale === "log"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setScatterScale("log")}
                >
                  log
                </button>
              </div>
            </div>
            <SensitivityEEScatter
              points={eeScatterPoints}
              scale={scatterScale}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Top-right = high importance + high non-linearity/interaction
              (paper Fig. 3/4). Dashed line: σ = μ*.
            </p>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              LCC distribution (paper Fig. 5) — {lastEE.engineRuns} runs
            </h3>
            <SensitivityBoxPlot rows={eeBoxRows} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Box = IQR (25th–75th percentile). Whiskers clipped to
              ±1.5·IQR. Bar height encodes the median.
            </p>
          </GlassCard>
        </>
      ) : null}

      <GlassCard>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Run history
        </h3>
        {runsQuery.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : runsQuery.data && runsQuery.data.length > 0 ? (
          <ul className="space-y-2">
            {runsQuery.data.map((run) => (
              <li
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/40"
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() => handleRestoreRun(run.id, run.method)}
                  disabled={restoreRunId === run.id}
                >
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                    {run.method}
                  </span>
                  <span className="text-muted-foreground">
                    {dateFormatter.format(new Date(run.createdAt))}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    engine {run.engineVersion} · {run.formulaMode}
                  </span>
                  {restoreRunId === run.id ? (
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No runs yet.</p>
        )}
      </GlassCard>
    </div>
  );
}
