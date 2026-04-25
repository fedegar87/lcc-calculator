export const variant2Data = {
  label: "VARIANT_2" as const,
  description: "Budget-conscious design with lower upfront costs",

  geometry: {
    grossFloorArea: 2000,
    netFloorArea: 1780,
    treatedFloorArea: 1720,
  },

  energyInputs: [
    { endUse: "HEATING_1" as const, energySourceIndex: 3, specificConsumption: 32 },
    { endUse: "HEATING_2" as const, energySourceIndex: 3, specificConsumption: 12 },
    { endUse: "COOLING_1" as const, energySourceIndex: 12, specificConsumption: 18 },
    {
      endUse: "HOUSEHOLD_ELECTRICITY" as const,
      energySourceIndex: 12,
      specificConsumption: 20,
    },
  ],

  costItems: [
    {
      category: "A1_ROOFS" as const,
      materialCostAgg: 95000,
      laborCostAgg: 70000,
      otherCostAgg: 4000,
    },
    {
      category: "A5_WINDOWS" as const,
      materialCostAgg: 70000,
      laborCostAgg: 50000,
      otherCostAgg: 2500,
    },
    {
      category: "B1_HEATING" as const,
      materialCostAgg: 35000,
      laborCostAgg: 20000,
      otherCostAgg: 1500,
    },
  ],

  serviceComponents: [
    { name: "Gas boiler", constructionCost: 25000, en15459ComponentIndex: 6 },
  ],

  wlcInput: {
    landCostMode: "TOTAL_COST" as const,
    landCostTotal: 200000,
    landPrice: 0,
    enablingCost1: 12000,
    planningFees1: 6000,
    userSupportPropMgmt: 2500,
    userSupportCharges: 1200,
    userSupportAdmin: 600,
    financeCost: 4000,
  },

  designCosts: [
    {
      lineNumber: 1,
      description: "General design",
      preliminaryCost: 7000,
      definitiveCost: 5500,
      executiveCost: 3000,
      siteManagementCost: 2200,
    },
    {
      lineNumber: 2,
      description: "Structural engineer",
      preliminaryCost: 1500,
      definitiveCost: 1000,
      executiveCost: 500,
      siteManagementCost: 1500,
    },
    {
      lineNumber: 3,
      description: "MEP consultant",
      preliminaryCost: 1200,
      definitiveCost: 800,
      executiveCost: 400,
      siteManagementCost: 1000,
    },
  ],

  incomeInput: {
    rent1MonthlyPerM2: 6.5,
    rent1Area: 1100,
    rent1Taxes: 1800,
    otherIncome1: 4500,
    otherIncome1Taxes: 600,
  },

  maintenanceConfig: {
    buildingElementMaintenancePercent: 0.01,
  },
};
