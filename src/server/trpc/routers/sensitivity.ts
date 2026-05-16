import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";
import { ENGINE_VERSION } from "@/engine/types";
import { runDSA } from "@/engine/sensitivity";
import {
  DEFAULT_PARAMETER_REGISTRY,
  listApplicableParameters,
} from "@/engine/sensitivity/parameters";
import type {
  OutputId,
  ParameterSpec,
} from "@/engine/sensitivity/types";
import type { EnergySourcePrice } from "@/engine/types";
import { validateVariantInput } from "@/engine/validation";
import { buildVariantInput, parseEnergySourcePrices } from "./_shared";

const OUTPUT_IDS = [
  "lcc",
  "lccNetResidual",
  "wlc",
  "kpiLCCPerM2",
  "kpiWLCPerM2",
] as const satisfies readonly OutputId[];

const formulaModeSchema = z
  .enum(["excel_replica", "excel_bugfixed"])
  .default("excel_bugfixed");

async function loadVariantWithRelations(
  db: import("../../../generated/prisma/client").PrismaClient,
  variantId: string,
) {
  const variant = await db.variant.findUnique({
    where: { id: variantId },
    include: {
      project: { select: { id: true } },
      geometry: true,
      boundaryCondition: true,
      energyInputs: true,
      costItems: { include: { details: true } },
      serviceComponents: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      wlcInput: true,
      designCosts: true,
      incomeInput: true,
      maintenanceConfig: true,
    },
  });
  if (!variant) throw new TRPCError({ code: "NOT_FOUND" });
  if (!variant.boundaryCondition) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing boundary conditions — complete the WLC step first.",
    });
  }
  return variant;
}

async function buildInputForVariant(
  db: import("../../../generated/prisma/client").PrismaClient,
  variantId: string,
  formulaMode: "excel_replica" | "excel_bugfixed",
) {
  const variant = await loadVariantWithRelations(db, variantId);

  let replicaVariant1EnergyPrices: EnergySourcePrice[] | undefined;
  if (formulaMode === "excel_replica" && variant.label === "VARIANT_2") {
    const variant1 = await db.variant.findFirst({
      where: { projectId: variant.project.id, label: "VARIANT_1" },
      select: { boundaryCondition: { select: { energyPrices: true } } },
    });
    replicaVariant1EnergyPrices = parseEnergySourcePrices(
      variant1?.boundaryCondition?.energyPrices,
    );
  }

  return {
    variant,
    input: buildVariantInput(variant, {
      formulaMode,
      replicaVariant1EnergyPrices,
    }),
  };
}

/** Strip non-serialisable fields (closures) from a ParameterSpec so it
 *  can be persisted as JSON. Resolves the baseline numerically against
 *  the current input so future readers do not need the engine to
 *  re-derive it. */
function resolveSpecForPersistence(
  spec: ParameterSpec,
  input: Parameters<ParameterSpec["baseline"]>[0],
) {
  return {
    id: spec.id,
    label: spec.label,
    group: spec.group,
    baseline: spec.baseline(input),
    defaultBounds: spec.defaultBounds,
  };
}

export const sensitivityRouter = createTRPCRouter({
  listParameters: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        formulaMode: formulaModeSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { input: variantInput } = await buildInputForVariant(
        ctx.db,
        input.variantId,
        input.formulaMode,
      );
      const applicable = listApplicableParameters(variantInput);
      return applicable.map((spec) =>
        resolveSpecForPersistence(spec, variantInput),
      );
    }),

  runDSA: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        parameters: z.array(z.string()).min(1).max(40),
        outputs: z.array(z.enum(OUTPUT_IDS)).min(1),
        delta: z.number().positive().max(0.5).default(0.1),
        formulaMode: formulaModeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { input: variantInput } = await buildInputForVariant(
        ctx.db,
        input.variantId,
        input.formulaMode,
      );

      const validationErrors = validateVariantInput(variantInput);
      if (validationErrors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Input validation failed: ${validationErrors.join("; ")}`,
        });
      }

      // TODO(SA-1 UI): when the dashboard exposes methodProfile selection,
      // gate this mutation on methodProfile === "CRAVEZERO_LEGACY" per
      // spec §10.4. Other profiles are metadata-only today.

      let dsa;
      try {
        dsa = runDSA(
          variantInput,
          {
            parameters: input.parameters,
            outputs: input.outputs,
            delta: input.delta,
          },
          { formulaMode: input.formulaMode },
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Sensitivity run failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      const resolvedSpecs = input.parameters
        .map((id) => DEFAULT_PARAMETER_REGISTRY.find((p) => p.id === id))
        .filter((spec): spec is ParameterSpec => spec !== undefined)
        .map((spec) => resolveSpecForPersistence(spec, variantInput));

      const run = await ctx.db.sensitivityRun.create({
        data: {
          variantId: input.variantId,
          method: "DSA",
          config: {
            parameters: input.parameters,
            outputs: input.outputs,
            delta: input.delta,
          },
          parameterSpecs: JSON.parse(JSON.stringify(resolvedSpecs)),
          baselineSnapshot: JSON.parse(JSON.stringify(dsa.baseline)),
          result: JSON.parse(JSON.stringify(dsa.entries)),
          diagnostics: JSON.parse(JSON.stringify(dsa.diagnostics)),
          engineVersion: ENGINE_VERSION,
          formulaMode:
            input.formulaMode === "excel_replica"
              ? "EXCEL_REPLICA"
              : "EXCEL_BUGFIXED",
          methodProfile: "CRAVEZERO_LEGACY",
          createdById: ctx.user.id,
        },
      });

      return {
        id: run.id,
        method: run.method,
        createdAt: run.createdAt,
        entries: dsa.entries,
        diagnostics: dsa.diagnostics,
        baseline: dsa.baseline,
      };
    }),

  listRuns: protectedProcedure
    .input(z.object({ variantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const runs = await ctx.db.sensitivityRun.findMany({
        where: { variantId: input.variantId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          method: true,
          formulaMode: true,
          methodProfile: true,
          engineVersion: true,
          createdAt: true,
          diagnostics: true,
          config: true,
        },
      });
      return runs;
    }),

  getRun: protectedProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.sensitivityRun.findUnique({
        where: { id: input.runId },
      });
      if (!run) throw new TRPCError({ code: "NOT_FOUND" });
      return run;
    }),
});
