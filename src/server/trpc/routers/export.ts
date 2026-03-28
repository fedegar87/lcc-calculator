import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { createTRPCRouter, protectedProcedure } from "../init";
import {
  calculateLCC,
  DEFAULT_ENGINE_CONFIG,
} from "@/engine/index";
import { ENGINE_VERSION } from "@/engine/types";
import type { FormulaMode } from "@/engine/types";
import { VariantLabel as PrismaVariantLabel } from "@/generated/prisma/enums";
import { buildVariantInput } from "./_shared";
import { getOrCreateSnapshot } from "@/server/export/snapshot";
import {
  renderLCCStackedBarPng,
  renderCostEvolutionPng,
} from "@/server/export/chart-renderer";
import { LCCReport } from "@/server/export/pdf-document";
import { buildExcelWorkbook } from "@/server/export/excel-workbook";

const VARIANT_LABEL_MAP: Record<string, (typeof PrismaVariantLabel)[keyof typeof PrismaVariantLabel]> = {
  BASE: PrismaVariantLabel.BASE,
  VARIANT_1: PrismaVariantLabel.VARIANT_1,
  VARIANT_2: PrismaVariantLabel.VARIANT_2,
};

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
      description: true,
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
} as const;

const inputSchema = z.object({
  projectId: z.string(),
  variantLabel: z.string(),
  formulaMode: z
    .enum(["excel_replica", "excel_bugfixed"])
    .default("excel_bugfixed"),
});

export const exportRouter = createTRPCRouter({
  generatePdf: protectedProcedure
    .input(inputSchema)
    .mutation(async ({ ctx, input }) => {
      const prismaLabel = VARIANT_LABEL_MAP[input.variantLabel];
      if (!prismaLabel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid variant label: ${input.variantLabel}`,
        });
      }

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
      const variantInput = buildVariantInput(variant);

      const result = calculateLCC(variantInput, {
        formulaMode,
        maxReplacementCycles: DEFAULT_ENGINE_CONFIG.maxReplacementCycles,
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
          description: variant.project.description,
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
      const prismaLabel = VARIANT_LABEL_MAP[input.variantLabel];
      if (!prismaLabel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid variant label: ${input.variantLabel}`,
        });
      }

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
      const variantInput = buildVariantInput(variant);

      const result = calculateLCC(variantInput, {
        formulaMode,
        maxReplacementCycles: DEFAULT_ENGINE_CONFIG.maxReplacementCycles,
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
