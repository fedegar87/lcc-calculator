import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";
import type { PrismaClient } from "../../../generated/prisma/client";
import { d } from "./_shared";

/** Verify user has OWNER/EDITOR access to a variant's project */
async function verifyVariantWriteAccess(
  db: PrismaClient,
  variantId: string,
  _userId: string,
) {
  const variant = await db.variant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
    },
  });
  if (!variant) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  // Public preview: every authenticated/anonymous session can edit
  // existing variants. When account gating returns, restore role checks here.
  return variant;
}

/** Verify user has at least read access to a variant's project */
async function verifyVariantReadAccess(
  db: PrismaClient,
  variantId: string,
  _userId: string,
) {
  const variant = await db.variant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
    },
  });
  if (!variant) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  // Public preview: every authenticated/anonymous session can read
  // existing variants. When account gating returns, restore role checks here.
  return variant;
}

/** Convert all geometry fields to plain numbers */
function serializeGeometry(g: Record<string, unknown> | null) {
  if (!g) return null;
  return {
    id: g.id,
    variantId: g.variantId,
    grossFloorArea: d(g.grossFloorArea),
    netFloorArea: d(g.netFloorArea),
    grossVolume: d(g.grossVolume),
    netVolume: d(g.netVolume),
    unheatedGFA: d(g.unheatedGFA),
    unheatedNFA: d(g.unheatedNFA),
    unheatedGrossVol: d(g.unheatedGrossVol),
    unheatedNetVol: d(g.unheatedNetVol),
    balconiesArea: d(g.balconiesArea),
    otherSurfacesArea: d(g.otherSurfacesArea),
    treatedFloorArea: d(g.treatedFloorArea),
    windowArea: d(g.windowArea),
    totalThermalEnvelope: d(g.totalThermalEnvelope),
    avgUvalueOpaque: d(g.avgUvalueOpaque),
    avgUvalueGlazing: d(g.avgUvalueGlazing),
    avgHeatRecovery: d(g.avgHeatRecovery),
    airTightness: d(g.airTightness),
    pvInstalledCapacity: d(g.pvInstalledCapacity),
    manualDesignConstructionCost: d(g.manualDesignConstructionCost),
  };
}

/** Convert boundary condition fields to plain numbers */
function serializeBoundaryCondition(bc: Record<string, unknown> | null) {
  if (!bc) return null;
  return {
    id: bc.id,
    variantId: bc.variantId,
    stakeholderRole: bc.stakeholderRole,
    referencePeriod: bc.referencePeriod,
    interestRate: d(bc.interestRate),
    inflationRate: d(bc.inflationRate),
    energyPrices: bc.energyPrices,
  };
}

/** Convert WLC input fields to plain numbers */
function serializeWLCInput(w: Record<string, unknown> | null) {
  if (!w) return null;
  return {
    id: w.id,
    variantId: w.variantId,
    landCostMode:
      w.landCostMode === "TOTAL_COST" ? "TOTAL_COST" : "UNIT_PRICE",
    landArea: d(w.landArea),
    buildingIndex: d(w.buildingIndex),
    floorHeight: d(w.floorHeight),
    landPrice: d(w.landPrice),
    landCostTotal: d(w.landCostTotal),
    enablingCost1: d(w.enablingCost1),
    enablingCost2: d(w.enablingCost2),
    planningFees1: d(w.planningFees1),
    planningFees2: d(w.planningFees2),
    userSupportPropMgmt: d(w.userSupportPropMgmt),
    userSupportCharges: d(w.userSupportCharges),
    userSupportAdmin: d(w.userSupportAdmin),
    financeCost: d(w.financeCost),
  };
}

/** Convert income input fields to plain numbers */
function serializeIncomeInput(inc: Record<string, unknown> | null) {
  if (!inc) return null;
  return {
    id: inc.id,
    variantId: inc.variantId,
    rent1MonthlyPerM2: d(inc.rent1MonthlyPerM2),
    rent1Area: d(inc.rent1Area),
    rent1Taxes: d(inc.rent1Taxes),
    rent2MonthlyPerM2: d(inc.rent2MonthlyPerM2),
    rent2Area: d(inc.rent2Area),
    rent2Taxes: d(inc.rent2Taxes),
    rent3MonthlyPerM2: d(inc.rent3MonthlyPerM2),
    rent3Area: d(inc.rent3Area),
    rent3Taxes: d(inc.rent3Taxes),
    otherIncome1: d(inc.otherIncome1),
    otherIncome1Taxes: d(inc.otherIncome1Taxes),
    otherIncome2: d(inc.otherIncome2),
    otherIncome2Taxes: d(inc.otherIncome2Taxes),
    otherIncome3: d(inc.otherIncome3),
    otherIncome3Taxes: d(inc.otherIncome3Taxes),
    expectedPricePerM2: d(inc.expectedPricePerM2),
  };
}

/** Convert maintenance config to plain numbers */
function serializeMaintenanceConfig(mc: Record<string, unknown> | null) {
  if (!mc) return null;
  return {
    id: mc.id,
    variantId: mc.variantId,
    buildingElementMaintenancePercent: d(mc.buildingElementMaintenancePercent),
  };
}

const END_USE_VALUES = [
  "HEATING_1",
  "HEATING_2",
  "COOLING_1",
  "COOLING_2",
  "DHW_1",
  "DHW_2",
  "HOUSEHOLD_ELECTRICITY",
  "PV_PRODUCTION",
] as const;

const finiteNumber = z.number().finite();
const nonNegativeNumber = finiteNumber.min(0);
const nullableNonNegativeNumber = nonNegativeNumber.nullable().optional();

export const variantRouter = createTRPCRouter({
  // 1. Get variant with all relations
  getById: protectedProcedure
    .input(z.object({ variantId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyVariantReadAccess(ctx.db, input.variantId, ctx.user.id);

      const variant = await ctx.db.variant.findUnique({
        where: { id: input.variantId },
        include: {
          geometry: true,
          boundaryCondition: true,
          energyInputs: true,
          costItems: { include: { details: { orderBy: { layerOrder: "asc" } } } },
          serviceComponents: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          wlcInput: true,
          designCosts: { orderBy: { lineNumber: "asc" } },
          incomeInput: true,
          maintenanceConfig: true,
        },
      });

      if (!variant) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        id: variant.id,
        label: variant.label,
        description: variant.description,
        projectId: variant.projectId,
        geometry: serializeGeometry(
          variant.geometry as unknown as Record<string, unknown>,
        ),
        boundaryCondition: serializeBoundaryCondition(
          variant.boundaryCondition as unknown as Record<string, unknown>,
        ),
        energyInputs: variant.energyInputs.map((ei) => ({
          id: ei.id,
          variantId: ei.variantId,
          endUse: ei.endUse,
          energySourceIndex: ei.energySourceIndex,
          specificConsumption: d(ei.specificConsumption),
          pvProductionKwh: d(ei.pvProductionKwh),
        })),
        costItems: variant.costItems.map((ci) => ({
          id: ci.id,
          variantId: ci.variantId,
          category: ci.category,
          subcategory: ci.subcategory,
          description: ci.description,
          materialCostAgg: d(ci.materialCostAgg),
          laborCostAgg: d(ci.laborCostAgg),
          otherCostAgg: d(ci.otherCostAgg),
          details: ci.details.map((det) => ({
            id: det.id,
            costItemId: det.costItemId,
            layerOrder: det.layerOrder,
            description: det.description,
            area: d(det.area),
            materialCost: d(det.materialCost),
            unitPrice: d(det.unitPrice),
            laborCost: d(det.laborCost),
            otherCost: d(det.otherCost),
          })),
        })),
        serviceComponents: variant.serviceComponents.map((sc) => ({
          id: sc.id,
          variantId: sc.variantId,
          name: sc.name,
          constructionCost: d(sc.constructionCost),
          en15459ComponentIndex: sc.en15459ComponentIndex,
          sortOrder: sc.sortOrder,
        })),
        wlcInput: serializeWLCInput(
          variant.wlcInput as unknown as Record<string, unknown>,
        ),
        designCosts: variant.designCosts.map((dc) => ({
          id: dc.id,
          variantId: dc.variantId,
          lineNumber: dc.lineNumber,
          description: dc.description,
          preliminaryCost: d(dc.preliminaryCost),
          definitiveCost: d(dc.definitiveCost),
          executiveCost: d(dc.executiveCost),
          siteManagementCost: d(dc.siteManagementCost),
        })),
        incomeInput: serializeIncomeInput(
          variant.incomeInput as unknown as Record<string, unknown>,
        ),
        maintenanceConfig: serializeMaintenanceConfig(
          variant.maintenanceConfig as unknown as Record<string, unknown>,
        ),
      };
    }),

  // 2. Upsert geometry
  upsertGeometry: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        grossFloorArea: z.number().nullable().optional(),
        netFloorArea: z.number().nullable().optional(),
        grossVolume: z.number().nullable().optional(),
        netVolume: z.number().nullable().optional(),
        unheatedGFA: z.number().nullable().optional(),
        unheatedNFA: z.number().nullable().optional(),
        unheatedGrossVol: z.number().nullable().optional(),
        unheatedNetVol: z.number().nullable().optional(),
        balconiesArea: z.number().nullable().optional(),
        otherSurfacesArea: z.number().nullable().optional(),
        treatedFloorArea: z.number().nullable().optional(),
        windowArea: z.number().nullable().optional(),
        totalThermalEnvelope: z.number().nullable().optional(),
        avgUvalueOpaque: z.number().nullable().optional(),
        avgUvalueGlazing: z.number().nullable().optional(),
        avgHeatRecovery: z.number().nullable().optional(),
        airTightness: z.number().nullable().optional(),
        pvInstalledCapacity: z.number().nullable().optional(),
        manualDesignConstructionCost: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const { variantId, ...data } = input;
      const result = await ctx.db.geometry.upsert({
        where: { variantId },
        update: data,
        create: { variantId, ...data },
      });

      return serializeGeometry(
        result as unknown as Record<string, unknown>,
      );
    }),

  // 3. Upsert boundary condition
  upsertBoundaryCondition: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        stakeholderRole: z.number().int().optional(),
        referencePeriod: finiteNumber.int().min(1).max(100).optional(),
        interestRate: finiteNumber.min(-0.1).max(0.5).optional(),
        inflationRate: finiteNumber.min(-0.1).max(0.5).optional(),
        energyPrices: z
          .array(
            z.object({
              index: finiteNumber.int().min(1).max(19),
              name: z.string(),
              pricePerKwh: nonNegativeNumber,
              annualIncrease: finiteNumber.min(-1).max(1),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const { variantId, ...data } = input;
      const result = await ctx.db.boundaryCondition.upsert({
        where: { variantId },
        update: data,
        create: { variantId, ...data },
      });

      return serializeBoundaryCondition(
        result as unknown as Record<string, unknown>,
      );
    }),

  // 4. Upsert energy inputs (batch by variant)
  upsertEnergyInputs: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        inputs: z.array(
          z.object({
            endUse: z.enum(END_USE_VALUES),
            energySourceIndex: finiteNumber.int().min(1).max(19),
            specificConsumption: nullableNonNegativeNumber,
            pvProductionKwh: nullableNonNegativeNumber,
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const results = await ctx.db.$transaction(
        input.inputs.map((ei) =>
          ctx.db.energyInput.upsert({
            where: {
              variantId_endUse: {
                variantId: input.variantId,
                endUse: ei.endUse,
              },
            },
            update: {
              energySourceIndex: ei.energySourceIndex,
              specificConsumption: ei.specificConsumption,
              pvProductionKwh: ei.pvProductionKwh,
            },
            create: {
              variantId: input.variantId,
              endUse: ei.endUse,
              energySourceIndex: ei.energySourceIndex,
              specificConsumption: ei.specificConsumption,
              pvProductionKwh: ei.pvProductionKwh,
            },
          }),
        ),
      );

      return results.map((ei) => ({
        id: ei.id,
        variantId: ei.variantId,
        endUse: ei.endUse,
        energySourceIndex: ei.energySourceIndex,
        specificConsumption: d(ei.specificConsumption),
        pvProductionKwh: d(ei.pvProductionKwh),
      }));
    }),

  // 5. Upsert WLC input
  upsertWLCInput: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        landCostMode: z.enum(["UNIT_PRICE", "TOTAL_COST"]).optional(),
        landArea: nullableNonNegativeNumber,
        buildingIndex: nullableNonNegativeNumber,
        floorHeight: nullableNonNegativeNumber,
        landPrice: nullableNonNegativeNumber,
        landCostTotal: nullableNonNegativeNumber,
        enablingCost1: nullableNonNegativeNumber,
        enablingCost2: nullableNonNegativeNumber,
        planningFees1: nullableNonNegativeNumber,
        planningFees2: nullableNonNegativeNumber,
        userSupportPropMgmt: nullableNonNegativeNumber,
        userSupportCharges: nullableNonNegativeNumber,
        userSupportAdmin: nullableNonNegativeNumber,
        financeCost: nullableNonNegativeNumber,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const { variantId, ...data } = input;
      const result = await ctx.db.wLCInput.upsert({
        where: { variantId },
        update: data,
        create: { variantId, ...data },
      });

      return serializeWLCInput(
        result as unknown as Record<string, unknown>,
      );
    }),

  // 6. Upsert design costs (replace pattern)
  upsertDesignCosts: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        costs: z.array(
          z.object({
            lineNumber: z.number().int(),
            description: z.string(),
            preliminaryCost: nonNegativeNumber.optional(),
            definitiveCost: nonNegativeNumber.optional(),
            executiveCost: nonNegativeNumber.optional(),
            siteManagementCost: nonNegativeNumber.optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const results = await ctx.db.$transaction(async (tx) => {
        await tx.designCost.deleteMany({
          where: { variantId: input.variantId },
        });

        return tx.designCost.createManyAndReturn({
          data: input.costs.map((c) => ({
            variantId: input.variantId,
            ...c,
          })),
        });
      });

      return results.map((dc) => ({
        id: dc.id,
        variantId: dc.variantId,
        lineNumber: dc.lineNumber,
        description: dc.description,
        preliminaryCost: d(dc.preliminaryCost),
        definitiveCost: d(dc.definitiveCost),
        executiveCost: d(dc.executiveCost),
        siteManagementCost: d(dc.siteManagementCost),
      }));
    }),

  // 7. Upsert income input
  upsertIncomeInput: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        rent1MonthlyPerM2: nullableNonNegativeNumber,
        rent1Area: nullableNonNegativeNumber,
        rent1Taxes: nullableNonNegativeNumber,
        rent2MonthlyPerM2: nullableNonNegativeNumber,
        rent2Area: nullableNonNegativeNumber,
        rent2Taxes: nullableNonNegativeNumber,
        rent3MonthlyPerM2: nullableNonNegativeNumber,
        rent3Area: nullableNonNegativeNumber,
        rent3Taxes: nullableNonNegativeNumber,
        otherIncome1: nullableNonNegativeNumber,
        otherIncome1Taxes: nullableNonNegativeNumber,
        otherIncome2: nullableNonNegativeNumber,
        otherIncome2Taxes: nullableNonNegativeNumber,
        otherIncome3: nullableNonNegativeNumber,
        otherIncome3Taxes: nullableNonNegativeNumber,
        expectedPricePerM2: nullableNonNegativeNumber,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const { variantId, ...data } = input;
      const result = await ctx.db.incomeInput.upsert({
        where: { variantId },
        update: data,
        create: { variantId, ...data },
      });

      return serializeIncomeInput(
        result as unknown as Record<string, unknown>,
      );
    }),

  // 8. Upsert maintenance config
  upsertMaintenanceConfig: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        buildingElementMaintenancePercent: finiteNumber.min(0).max(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const { variantId, ...data } = input;
      const result = await ctx.db.maintenanceConfig.upsert({
        where: { variantId },
        update: data,
        create: { variantId, ...data },
      });

      return serializeMaintenanceConfig(
        result as unknown as Record<string, unknown>,
      );
    }),

  // 9. Upsert service component (individual CRUD)
  upsertServiceComponent: protectedProcedure
    .input(
      z.object({
        variantId: z.string(),
        componentId: z.string().optional(),
        name: z.string(),
        constructionCost: nonNegativeNumber,
        en15459ComponentIndex: finiteNumber.int().min(1).max(79),
        sortOrder: finiteNumber.int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyVariantWriteAccess(ctx.db, input.variantId, ctx.user.id);

      const { variantId, componentId, ...data } = input;

      if (componentId) {
        const result = await ctx.db.serviceComponent.update({
          where: { id: componentId },
          data,
        });
        return {
          id: result.id,
          variantId: result.variantId,
          name: result.name,
          constructionCost: d(result.constructionCost),
          en15459ComponentIndex: result.en15459ComponentIndex,
          sortOrder: result.sortOrder,
        };
      }

      const sortOrder =
        data.sortOrder ??
        ((await ctx.db.serviceComponent.aggregate({
          where: { variantId },
          _max: { sortOrder: true },
        }))._max.sortOrder ?? -1) + 1;

      const result = await ctx.db.serviceComponent.create({
        data: { variantId, ...data, sortOrder },
      });
      return {
        id: result.id,
        variantId: result.variantId,
        name: result.name,
        constructionCost: d(result.constructionCost),
        en15459ComponentIndex: result.en15459ComponentIndex,
        sortOrder: result.sortOrder,
      };
    }),

  // 10. Delete service component
  deleteServiceComponent: protectedProcedure
    .input(z.object({ componentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const component = await ctx.db.serviceComponent.findUnique({
        where: { id: input.componentId },
        select: { id: true, variantId: true },
      });
      if (!component) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await verifyVariantWriteAccess(
        ctx.db,
        component.variantId,
        ctx.user.id,
      );

      await ctx.db.serviceComponent.delete({
        where: { id: input.componentId },
      });
      return { success: true };
    }),
});
