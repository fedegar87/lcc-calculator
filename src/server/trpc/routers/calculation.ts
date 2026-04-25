import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";
import { calculateLCC } from "@/engine/index";
import type { EnergySourcePrice } from "@/engine/types";
import { validateVariantInput } from "@/engine/validation";
import { buildVariantInput, parseEnergySourcePrices } from "./_shared";

export const calculationRouter = createTRPCRouter({
  calculate: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        formulaMode: z
          .enum(["excel_replica", "excel_bugfixed"])
          .default("excel_bugfixed"),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Load variant with ALL relations in a single query
      const variant = await ctx.db.variant.findUnique({
        where: { id: input.variantId },
        include: {
          project: {
            select: {
              id: true,
              userId: true,
              members: { select: { userId: true, role: true } },
            },
          },
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

      if (!variant) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify user is project creator or OWNER/EDITOR member
      const isCreator = variant.project.userId === ctx.user.id;
      if (!isCreator) {
        const membership = variant.project.members.find(
          (m) => m.userId === ctx.user.id,
        );
        if (!membership || membership.role === "VIEWER") {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      // Verify required data exists
      if (!variant.boundaryCondition) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Missing boundary conditions - please complete the WLC step first.",
        });
      }

      let replicaVariant1EnergyPrices: EnergySourcePrice[] | undefined;
      if (
        input.formulaMode === "excel_replica" &&
        variant.label === "VARIANT_2"
      ) {
        const variant1 = await ctx.db.variant.findFirst({
          where: {
            projectId: variant.project.id,
            label: "VARIANT_1",
          },
          select: {
            boundaryCondition: {
              select: { energyPrices: true },
            },
          },
        });

        replicaVariant1EnergyPrices = parseEnergySourcePrices(
          variant1?.boundaryCondition?.energyPrices,
        );
      }

      // Build engine input from DB data
      const variantInput = buildVariantInput(variant, {
        formulaMode: input.formulaMode,
        replicaVariant1EnergyPrices,
      });

      // Validate at API boundary before engine invocation
      const validationErrors = validateVariantInput(variantInput);
      if (validationErrors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Input validation failed: ${validationErrors.join("; ")}`,
        });
      }

      // Run calculation
      try {
        const result = calculateLCC(variantInput, {
          formulaMode: input.formulaMode,
        });
        return result;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Calculation failed - please check your inputs.",
        });
      }
    }),
});
