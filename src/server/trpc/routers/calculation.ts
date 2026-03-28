import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";
import {
  calculateLCC,
  DEFAULT_ENGINE_CONFIG,
} from "@/engine/index";
import { buildVariantInput } from "./_shared";

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
          serviceComponents: true,
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

      // Build engine input from DB data
      const variantInput = buildVariantInput(variant);

      // Run calculation
      try {
        const result = calculateLCC(variantInput, {
          formulaMode: input.formulaMode,
          maxReplacementCycles:
            DEFAULT_ENGINE_CONFIG.maxReplacementCycles,
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
