import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { createTRPCRouter, protectedProcedure } from "../init";
import { calculateLCC } from "@/engine/index";
import { ENGINE_VERSION } from "@/engine/types";
import type { FormulaMode, EnergySourcePrice } from "@/engine/types";
import { validateVariantInput } from "@/engine/validation";
import type { Prisma } from "@/generated/prisma/client";
import { VariantLabel as PrismaVariantLabel } from "@/generated/prisma/enums";
import { buildVariantInput, parseEnergySourcePrices } from "./_shared";
import { getOrCreateSnapshot } from "@/server/export/snapshot";
import {
  renderLCCStackedBarPng,
  renderCostEvolutionPng,
} from "@/server/export/chart-renderer";
import { LCCReport } from "@/server/export/pdf-document";
import { buildExcelWorkbook } from "@/server/export/excel-workbook";

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function buildFileName(
  projectName: string,
  variantLabel: string,
  ext: string,
): string {
  const sanitized = sanitizeFileName(projectName);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `LCCzero_${sanitized}_${variantLabel}_${date}.${ext}`;
}

/** Full variant include clause (same as calculation router) */
const VARIANT_INCLUDE = {
  project: {
    select: {
      id: true,
      name: true,
      city: true,
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
} satisfies Prisma.VariantInclude;

const inputSchema = z.object({
  projectId: z.string(),
  variantLabel: z.enum(["BASE", "VARIANT_1", "VARIANT_2"]),
  formulaMode: z
    .enum(["excel_replica", "excel_bugfixed"])
    .default("excel_bugfixed"),
});

export const exportRouter = createTRPCRouter({
  generatePdf: protectedProcedure
    .input(inputSchema)
    .mutation(async ({ ctx, input }) => {
      const prismaLabel = input.variantLabel as PrismaVariantLabel;

      const variant = await ctx.db.variant.findFirst({
        where: { projectId: input.projectId, label: prismaLabel },
        include: VARIANT_INCLUDE,
      });

      if (!variant) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Access check
      const isCreator = variant.project.userId === ctx.user.id;
      if (!isCreator) {
        const membership = variant.project.members.find(
          (m) => m.userId === ctx.user.id,
        );
        if (!membership || membership.role === "VIEWER") {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      if (!variant.boundaryCondition) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Missing boundary conditions - complete the WLC step first.",
        });
      }

      const formulaMode: FormulaMode = input.formulaMode;
      let replicaVariant1EnergyPrices: EnergySourcePrice[] | undefined;
      if (
        formulaMode === "excel_replica" &&
        variant.label === "VARIANT_2"
      ) {
        const variant1 = await ctx.db.variant.findFirst({
          where: {
            projectId: input.projectId,
            label: PrismaVariantLabel.VARIANT_1,
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

      const variantInput = buildVariantInput(variant, {
        formulaMode,
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

      const result = calculateLCC(variantInput, {
        formulaMode,
      });

      // Snapshot
      const snapshot = await getOrCreateSnapshot(ctx.db, {
        projectId: input.projectId,
        variantLabel: prismaLabel,
        engineVersion: ENGINE_VERSION,
        formulaMode,
        variantInput,
        result,
        userId: ctx.user.id,
      });

      // Render charts
      const [stackedBar, costEvolution] = await Promise.all([
        renderLCCStackedBarPng(result),
        renderCostEvolutionPng(result),
      ]);

      // Render PDF
      const generatedAt = new Date().toISOString().slice(0, 10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfElement: any = React.createElement(LCCReport, {
        project: {
          name: variant.project.name,
          city: variant.project.city,
        },
        variant: { label: input.variantLabel },
        result,
        chartImages: { stackedBar, costEvolution },
        generatedAt,
      });
      const pdfBuffer = await renderToBuffer(pdfElement);

      const fileName = buildFileName(
        variant.project.name,
        input.variantLabel,
        "pdf",
      );

      // Create export record
      await ctx.db.exportRecord.create({
        data: {
          projectId: input.projectId,
          format: "pdf",
          snapshotId: snapshot.id,
          fileName,
        },
      });

      return {
        data: Buffer.from(pdfBuffer).toString("base64"),
        fileName,
        mimeType: "application/pdf",
      };
    }),

  generateExcel: protectedProcedure
    .input(inputSchema)
    .mutation(async ({ ctx, input }) => {
      const prismaLabel = input.variantLabel as PrismaVariantLabel;

      const variant = await ctx.db.variant.findFirst({
        where: { projectId: input.projectId, label: prismaLabel },
        include: VARIANT_INCLUDE,
      });

      if (!variant) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Access check
      const isCreator = variant.project.userId === ctx.user.id;
      if (!isCreator) {
        const membership = variant.project.members.find(
          (m) => m.userId === ctx.user.id,
        );
        if (!membership || membership.role === "VIEWER") {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      if (!variant.boundaryCondition) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Missing boundary conditions - complete the WLC step first.",
        });
      }

      const formulaMode: FormulaMode = input.formulaMode;
      let replicaVariant1EnergyPrices: EnergySourcePrice[] | undefined;
      if (
        formulaMode === "excel_replica" &&
        variant.label === "VARIANT_2"
      ) {
        const variant1 = await ctx.db.variant.findFirst({
          where: {
            projectId: input.projectId,
            label: PrismaVariantLabel.VARIANT_1,
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

      const variantInput = buildVariantInput(variant, {
        formulaMode,
        replicaVariant1EnergyPrices,
      });

      // Validate at API boundary before engine invocation
      const excelValidationErrors = validateVariantInput(variantInput);
      if (excelValidationErrors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Input validation failed: ${excelValidationErrors.join("; ")}`,
        });
      }

      const result = calculateLCC(variantInput, {
        formulaMode,
      });

      // Snapshot
      const snapshot = await getOrCreateSnapshot(ctx.db, {
        projectId: input.projectId,
        variantLabel: prismaLabel,
        engineVersion: ENGINE_VERSION,
        formulaMode,
        variantInput,
        result,
        userId: ctx.user.id,
      });

      // Build workbook
      const buffer = await buildExcelWorkbook(
        result,
        { name: variant.project.name, city: variant.project.city },
        { label: input.variantLabel },
      );

      const fileName = buildFileName(
        variant.project.name,
        input.variantLabel,
        "xlsx",
      );

      // Create export record
      await ctx.db.exportRecord.create({
        data: {
          projectId: input.projectId,
          format: "xlsx",
          snapshotId: snapshot.id,
          fileName,
        },
      });

      return {
        data: buffer.toString("base64"),
        fileName,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }),
});
