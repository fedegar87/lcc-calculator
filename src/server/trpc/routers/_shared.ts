import type {
  VariantInput,
  CostItemInput,
  DesignCostInput,
  IncomeInputData,
  WLCInputData,
  EnergyEndUseInput,
  EnergySourcePrice,
  ServiceComponentInput,
  FormulaMode,
} from "@/engine/types";

/** Safely convert Prisma Decimal|null|undefined to plain number */
export function d(val: unknown): number {
  if (val == null) return 0;
  return Number(val);
}

/** Resolve detail material cost: MAX(materialCost, unitPrice * area) per architecture decision */
export function resolveDetailCost(detail: {
  materialCost?: unknown;
  unitPrice?: unknown;
  area?: unknown;
}): number {
  const mat = d(detail.materialCost);
  const unitTimesArea = d(detail.unitPrice) * d(detail.area);
  return Math.max(mat, unitTimesArea);
}

export function parseEnergySourcePrices(
  value: unknown,
): EnergySourcePrice[] | undefined {
  return Array.isArray(value) ? (value as unknown as EnergySourcePrice[]) : undefined;
}

interface BuildVariantInputOptions {
  formulaMode?: FormulaMode;
  replicaVariant1EnergyPrices?: EnergySourcePrice[];
}

type DetailLike = {
  materialCost?: unknown;
  unitPrice?: unknown;
  area?: unknown;
  laborCost?: unknown;
  otherCost?: unknown;
};

type VariantLike = {
  label?: string;
  boundaryCondition: {
    referencePeriod: number;
    interestRate?: unknown;
    inflationRate?: unknown;
    energyPrices?: unknown;
  } | null;
  geometry?: {
    treatedFloorArea?: unknown;
  } | null;
  maintenanceConfig?: {
    buildingElementMaintenancePercent?: unknown;
  } | null;
  energyInputs: Array<{
    endUse: string;
    energySourceIndex: number;
    specificConsumption?: unknown;
    pvProductionKwh?: unknown;
  }>;
  costItems: Array<{
    category: string;
    details: DetailLike[];
  }>;
  serviceComponents: Array<{
    id?: string;
    name: string;
    constructionCost?: unknown;
    en15459ComponentIndex: number;
  }>;
  designCosts: Array<{
    lineNumber: number;
    description: string;
    preliminaryCost?: unknown;
    definitiveCost?: unknown;
    executiveCost?: unknown;
    siteManagementCost?: unknown;
  }>;
  wlcInput?: {
    landArea?: unknown;
    landPrice?: unknown;
    enablingCost1?: unknown;
    enablingCost2?: unknown;
    planningFees1?: unknown;
    planningFees2?: unknown;
    userSupportPropMgmt?: unknown;
    userSupportCharges?: unknown;
    userSupportAdmin?: unknown;
    financeCost?: unknown;
  } | null;
  incomeInput?: {
    rent1MonthlyPerM2?: unknown;
    rent1Area?: unknown;
    rent1Taxes?: unknown;
    rent2MonthlyPerM2?: unknown;
    rent2Area?: unknown;
    rent2Taxes?: unknown;
    rent3MonthlyPerM2?: unknown;
    rent3Area?: unknown;
    rent3Taxes?: unknown;
    otherIncome1?: unknown;
    otherIncome1Taxes?: unknown;
    otherIncome2?: unknown;
    otherIncome2Taxes?: unknown;
    otherIncome3?: unknown;
    otherIncome3Taxes?: unknown;
    expectedPricePerM2?: unknown;
  } | null;
};

export function buildVariantInput(
  variant: VariantLike,
  options: BuildVariantInputOptions = {},
): VariantInput {
  if (!variant.boundaryCondition) {
    throw new Error("Missing boundaryCondition");
  }

  const bc = variant.boundaryCondition;
  const geo = variant.geometry;
  const mc = variant.maintenanceConfig;

  // Energy prices stored as JSON, already array of objects
  const rawEnergyPrices = parseEnergySourcePrices(bc.energyPrices) ?? [];
  const energyPrices: EnergySourcePrice[] =
    options.formulaMode === "excel_replica" &&
    variant.label === "VARIANT_2" &&
    options.replicaVariant1EnergyPrices
      ? rawEnergyPrices.map((price) => {
          const variant1Price = options.replicaVariant1EnergyPrices?.find(
            (candidate) => candidate.index === price.index,
          );
          return variant1Price
            ? {
                ...price,
                pricePerKwh: variant1Price.pricePerKwh,
              }
            : price;
        })
      : rawEnergyPrices;

  // Energy inputs
  const energyInputs: EnergyEndUseInput[] = variant.energyInputs.map(
    (row) => ({
      endUse: row.endUse as string,
      energySourceIndex: row.energySourceIndex as number,
      specificConsumption: d(row.specificConsumption),
      pvProductionKwh:
        row.endUse === "PV_PRODUCTION" ? d(row.pvProductionKwh) : undefined,
    }),
  );

  // Cost items: aggregate from details using resolveDetailCost
  const costItems: CostItemInput[] = variant.costItems.map((ci) => {
    const materialCost = ci.details.reduce(
      (sum: number, det) => sum + resolveDetailCost(det),
      0,
    );
    const laborCost = ci.details.reduce(
      (sum: number, det) => sum + d(det.laborCost),
      0,
    );
    const otherCost = ci.details.reduce(
      (sum: number, det) => sum + d(det.otherCost),
      0,
    );
    return {
      category: ci.category as string,
      materialCost,
      laborCost,
      otherCost,
    };
  });

  // Service components
  const orderedServiceComponents = [...variant.serviceComponents].sort(
    (a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")),
  );
  const serviceComponents: ServiceComponentInput[] =
    orderedServiceComponents.map((sc, index: number) => ({
      name: sc.name as string,
      constructionCost: d(sc.constructionCost),
      en15459ComponentIndex: sc.en15459ComponentIndex as number,
      replicaOrder: index,
    }));

  // Design costs
  const designCosts: DesignCostInput[] = variant.designCosts.map((dc) => ({
    lineNumber: dc.lineNumber as number,
    description: dc.description as string,
    preliminaryCost: d(dc.preliminaryCost),
    definitiveCost: d(dc.definitiveCost),
    executiveCost: d(dc.executiveCost),
    siteManagementCost: d(dc.siteManagementCost),
  }));

  // WLC Input: map DB fields to engine WLCInputData
  const wlc = variant.wlcInput;
  const designCostsTotal = designCosts.reduce(
    (sum, dc) => sum + dc.preliminaryCost + dc.definitiveCost + dc.executiveCost,
    0,
  );
  const siteManagementCostsTotal = designCosts.reduce(
    (sum, dc) => sum + dc.siteManagementCost,
    0,
  );

  const wlcInput: WLCInputData = {
    landCost: wlc ? d(wlc.landArea) * d(wlc.landPrice) : 0,
    enablingCosts: wlc ? d(wlc.enablingCost1) + d(wlc.enablingCost2) : 0,
    planningFees: wlc ? d(wlc.planningFees1) + d(wlc.planningFees2) : 0,
    userSupportPropMgmt: wlc ? d(wlc.userSupportPropMgmt) : 0,
    userSupportCharges: wlc ? d(wlc.userSupportCharges) : 0,
    userSupportAdmin: wlc ? d(wlc.userSupportAdmin) : 0,
    financeCost: wlc ? d(wlc.financeCost) : 0,
    designCostsTotal,
    siteManagementCostsTotal,
  };

  // Income input: convert flat fields to grouped format
  let incomeInput: IncomeInputData | undefined;
  const inc = variant.incomeInput;
  if (inc) {
    const rents = [
      {
        monthlyPerM2: d(inc.rent1MonthlyPerM2),
        area: d(inc.rent1Area),
        taxes: d(inc.rent1Taxes),
      },
      {
        monthlyPerM2: d(inc.rent2MonthlyPerM2),
        area: d(inc.rent2Area),
        taxes: d(inc.rent2Taxes),
      },
      {
        monthlyPerM2: d(inc.rent3MonthlyPerM2),
        area: d(inc.rent3Area),
        taxes: d(inc.rent3Taxes),
      },
    ];
    const otherIncomes = [
      { amount: d(inc.otherIncome1), taxes: d(inc.otherIncome1Taxes) },
      { amount: d(inc.otherIncome2), taxes: d(inc.otherIncome2Taxes) },
      { amount: d(inc.otherIncome3), taxes: d(inc.otherIncome3Taxes) },
    ];

    const hasAnyValue =
      rents.some((r) => r.monthlyPerM2 !== 0 || r.area !== 0) ||
      otherIncomes.some((o) => o.amount !== 0);

    if (hasAnyValue) {
      incomeInput = {
        rents,
        otherIncomes,
        expectedPricePerM2: d(inc.expectedPricePerM2) || undefined,
      };
    }
  }

  return {
    referencePeriod: bc.referencePeriod as number,
    interestRate: d(bc.interestRate),
    inflationRate: d(bc.inflationRate),
    treatedFloorArea: d(geo?.treatedFloorArea),
    energyPrices,
    energyInputs,
    costItems,
    serviceComponents,
    buildingElementMaintenancePercent: d(
      mc?.buildingElementMaintenancePercent,
    ),
    wlcInput,
    designCosts,
    incomeInput,
  };
}
