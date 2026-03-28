import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";
import type { PrismaClient } from "../../../generated/prisma/client";
import { d, resolveDetailCost } from "./_shared";

const COST_CATEGORY_VALUES = [
  "A1_ROOFS",
  "A2_FACADES",
  "A3_FLOORS",
  "A4_WALLS",
  "A5_WINDOWS",
  "A6_SHADING",
  "A7_DOORS",
  "A8_INTERNAL",
  "A9_STRUCTURE",
  "A10_OTHER",
  "B1_HEATING",
  "B2_COOLING",
  "B3_VENTILATION",
  "B4_HVAC_COMBINED",
  "B5_ELECTRICAL",
  "B6_HYDRAULIC",
  "C1_SOLAR_THERMAL",
  "C2_PV",
  "C3_OTHER_RES",
  "D1_FURNISHINGS",
  "E1_OUTDOOR",
] as const;

/** Recompute parent cost item aggregates from its details */
async function recomputeCostItemAggregates(
  db: PrismaClient,
  costItemId: string,
) {
  const details = await db.costItemDetail.findMany({
    where: { costItemId },
  });
  const materialCostAgg = details.reduce(
    (sum, det) => sum + resolveDetailCost(det),
    0,
  );
  const laborCostAgg = details.reduce((sum, det) => sum + d(det.laborCost), 0);
  const otherCostAgg = details.reduce((sum, det) => sum + d(det.otherCost), 0);
  await db.costItem.update({
    where: { id: costItemId },
    data: { materialCostAgg, laborCostAgg, otherCostAgg },
  });
}

/** Verify user has access to a variant's project. Returns project or throws NOT_FOUND. */
async function verifyVariantAccess(
  db: PrismaClient,
  variantId: string,
  userId: string,
  requiredRole?: "write",
) {
  const variant = await db.variant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      projectId: true,
      project: { select: { userId: true } },
    },
  });
  if (!variant) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const isCreator = variant.project.userId === userId;
  if (isCreator) return variant;

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: variant.projectId, userId },
    },
  });
  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  if (requiredRole === "write" && membership.role === "VIEWER") {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return variant;
}

/** Verify access through costItem -> variant -> project chain */
async function verifyCostItemAccess(
  db: PrismaClient,
  costItemId: string,
  userId: string,
  requiredRole?: "write",
) {
  const costItem = await db.costItem.findUnique({
    where: { id: costItemId },
    select: { id: true, variantId: true },
  });
  if (!costItem) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  await verifyVariantAccess(db, costItem.variantId, userId, requiredRole);
  return costItem;
}

/** Convert a cost item with details to plain numbers (no Prisma Decimals) */
function serializeCostItem(item: {
  id: string;
  variantId: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  materialCostAgg: unknown;
  laborCostAgg: unknown;
  otherCostAgg: unknown;
  details: Array<{
    id: string;
    costItemId: string;
    layerOrder: number;
    description: string | null;
    area: unknown;
    materialCost: unknown;
    unitPrice: unknown;
    laborCost: unknown;
    otherCost: unknown;
  }>;
}) {
  return {
    ...item,
    materialCostAgg: d(item.materialCostAgg),
    laborCostAgg: d(item.laborCostAgg),
    otherCostAgg: d(item.otherCostAgg),
    details: item.details.map((det) => ({
      ...det,
      area: d(det.area),
      materialCost: d(det.materialCost),
      unitPrice: d(det.unitPrice),
      laborCost: d(det.laborCost),
      otherCost: d(det.otherCost),
    })),
  };
}

export const costItemRouter = createTRPCRouter({
  // 1. List cost items by variant
  listByVariant: protectedProcedure
    .input(z.object({ variantId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyVariantAccess(ctx.db, input.variantId, ctx.user.id);

      const items = await ctx.db.costItem.findMany({
        where: { variantId: input.variantId },
        include: { details: { orderBy: { layerOrder: "asc" } } },
        orderBy: { category: "asc" },
      });

      return items.map(serializeCostItem);
    }),

  // 2. Upsert cost item by variant + category
  upsert: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        category: z.enum(COST_CATEGORY_VALUES),
        subcategory: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantAccess(ctx.db, input.variantId, ctx.user.id, "write");

      // Find existing cost item for this variant + category
      const existing = await ctx.db.costItem.findFirst({
        where: { variantId: input.variantId, category: input.category },
      });

      if (existing) {
        return ctx.db.costItem.update({
          where: { id: existing.id },
          data: {
            subcategory: input.subcategory,
            description: input.description,
          },
        });
      }

      return ctx.db.costItem.create({
        data: {
          variantId: input.variantId,
          category: input.category,
          subcategory: input.subcategory,
          description: input.description,
        },
      });
    }),

  /** @future -- Reserved for cost item deletion UI. Not wired to any client route in v1.0/v1.1. */
  delete: protectedProcedure
    .input(z.object({ costItemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyCostItemAccess(
        ctx.db,
        input.costItemId,
        ctx.user.id,
        "write",
      );

      await ctx.db.costItem.delete({ where: { id: input.costItemId } });
      return { success: true };
    }),

  // 4. Upsert cost item detail (individual CRUD)
  upsertDetail: protectedProcedure
    .input(
      z.object({
        costItemId: z.string(),
        detailId: z.string().optional(),
        layerOrder: z.number().int().default(0),
        description: z.string().optional(),
        area: z.number().nullable().optional(),
        materialCost: z.number().nullable().optional(),
        unitPrice: z.number().nullable().optional(),
        laborCost: z.number().nullable().optional(),
        otherCost: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyCostItemAccess(
        ctx.db,
        input.costItemId,
        ctx.user.id,
        "write",
      );

      const { costItemId, detailId, ...data } = input;

      let detail;
      if (detailId) {
        // Update existing detail
        detail = await ctx.db.costItemDetail.update({
          where: { id: detailId },
          data,
        });
      } else {
        // Create new detail
        detail = await ctx.db.costItemDetail.create({
          data: { costItemId, ...data },
        });
      }

      await recomputeCostItemAggregates(ctx.db, costItemId);

      return {
        ...detail,
        area: d(detail.area),
        materialCost: d(detail.materialCost),
        unitPrice: d(detail.unitPrice),
        laborCost: d(detail.laborCost),
        otherCost: d(detail.otherCost),
      };
    }),

  // 5. Delete cost item detail
  deleteDetail: protectedProcedure
    .input(z.object({ detailId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const detail = await ctx.db.costItemDetail.findUnique({
        where: { id: input.detailId },
      });
      if (!detail) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await verifyCostItemAccess(
        ctx.db,
        detail.costItemId,
        ctx.user.id,
        "write",
      );

      await ctx.db.costItemDetail.delete({ where: { id: input.detailId } });
      await recomputeCostItemAggregates(ctx.db, detail.costItemId);

      return { success: true };
    }),

  /** @future -- Reserved for bulk import/paste UI. Not wired to any client route in v1.0/v1.1. */
  batchUpsert: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        items: z.array(
          z.object({
            category: z.enum(COST_CATEGORY_VALUES),
            subcategory: z.string().optional(),
            description: z.string().optional(),
            details: z
              .array(
                z.object({
                  layerOrder: z.number().int().default(0),
                  description: z.string().optional(),
                  area: z.number().nullable().optional(),
                  materialCost: z.number().nullable().optional(),
                  unitPrice: z.number().nullable().optional(),
                  laborCost: z.number().nullable().optional(),
                  otherCost: z.number().nullable().optional(),
                }),
              )
              .optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantAccess(ctx.db, input.variantId, ctx.user.id, "write");

      let processedCount = 0;

      await ctx.db.$transaction(async (tx) => {
        for (const item of input.items) {
          // Upsert cost item
          const existing = await tx.costItem.findFirst({
            where: {
              variantId: input.variantId,
              category: item.category,
            },
          });

          let costItemId: string;
          if (existing) {
            await tx.costItem.update({
              where: { id: existing.id },
              data: {
                subcategory: item.subcategory,
                description: item.description,
              },
            });
            costItemId = existing.id;
            // Clear old details for replacement
            await tx.costItemDetail.deleteMany({ where: { costItemId } });
          } else {
            const created = await tx.costItem.create({
              data: {
                variantId: input.variantId,
                category: item.category,
                subcategory: item.subcategory,
                description: item.description,
              },
            });
            costItemId = created.id;
          }

          // Create new details if provided
          if (item.details && item.details.length > 0) {
            await tx.costItemDetail.createMany({
              data: item.details.map((det) => ({
                costItemId,
                ...det,
              })),
            });
          }

          // Recompute aggregates
          const details = await tx.costItemDetail.findMany({
            where: { costItemId },
          });
          const materialCostAgg = details.reduce(
            (sum, det) => sum + resolveDetailCost(det),
            0,
          );
          const laborCostAgg = details.reduce(
            (sum, det) => sum + d(det.laborCost),
            0,
          );
          const otherCostAgg = details.reduce(
            (sum, det) => sum + d(det.otherCost),
            0,
          );
          await tx.costItem.update({
            where: { id: costItemId },
            data: { materialCostAgg, laborCostAgg, otherCostAgg },
          });

          processedCount++;
        }
      });

      return { processedCount };
    }),
});
