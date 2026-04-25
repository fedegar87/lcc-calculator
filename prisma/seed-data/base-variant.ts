export const baseVariantData = {
  label: "BASE" as const,
  description: "Reference design matching Excel tutorial",

  geometry: {
    grossFloorArea: 2000,
    netFloorArea: 1800,
    treatedFloorArea: 1750,
  },

  energyInputs: [
    { endUse: "HEATING_1" as const, energySourceIndex: 3, specificConsumption: 25 },
    { endUse: "HEATING_2" as const, energySourceIndex: 3, specificConsumption: 10 },
    { endUse: "COOLING_1" as const, energySourceIndex: 12, specificConsumption: 15 },
    {
      endUse: "HOUSEHOLD_ELECTRICITY" as const,
      energySourceIndex: 12,
      specificConsumption: 20,
    },
    {
      endUse: "PV_PRODUCTION" as const,
      energySourceIndex: 13,
      specificConsumption: 8,
      pvProductionKwh: 14000,
    },
  ],

  costItems: [
    {
      category: "A1_ROOFS" as const,
      materialCostAgg: 120000,
      laborCostAgg: 80000,
      otherCostAgg: 5000,
    },
    {
      category: "A5_WINDOWS" as const,
      materialCostAgg: 90000,
      laborCostAgg: 60000,
      otherCostAgg: 3000,
    },
    {
      category: "B1_HEATING" as const,
      materialCostAgg: 45000,
      laborCostAgg: 25000,
      otherCostAgg: 2000,
    },
  ],

  serviceComponents: [
    { name: "Heat pump", constructionCost: 35000, en15459ComponentIndex: 6 },
    { name: "Ventilation unit", constructionCost: 18000, en15459ComponentIndex: 1 },
  ],

  wlcInput: {
    landCostMode: "TOTAL_COST" as const,
    landCostTotal: 200000,
    landPrice: 0,
    enablingCost1: 15000,
    planningFees1: 8000,
    userSupportPropMgmt: 3000,
    userSupportCharges: 1500,
    userSupportAdmin: 800,
    financeCost: 5000,
  },

  designCosts: [
    {
      lineNumber: 1,
      description: "General design",
      preliminaryCost: 10000,
      definitiveCost: 8000,
      executiveCost: 4000,
      siteManagementCost: 3000,
    },
    {
      lineNumber: 2,
      description: "Structural engineer",
      preliminaryCost: 2000,
      definitiveCost: 1500,
      executiveCost: 800,
      siteManagementCost: 2000,
    },
    {
      lineNumber: 3,
      description: "MEP consultant",
      preliminaryCost: 1800,
      definitiveCost: 1200,
      executiveCost: 600,
      siteManagementCost: 1800,
    },
    {
      lineNumber: 4,
      description: "Fire safety",
      preliminaryCost: 800,
      definitiveCost: 600,
      executiveCost: 300,
      siteManagementCost: 500,
    },
    {
      lineNumber: 5,
      description: "Acoustic design",
      preliminaryCost: 600,
      definitiveCost: 400,
      executiveCost: 200,
      siteManagementCost: 300,
    },
  ],

  incomeInput: {
    rent1MonthlyPerM2: 8,
    rent1Area: 1200,
    rent1Taxes: 2400,
    otherIncome1: 6000,
    otherIncome1Taxes: 800,
  },

  maintenanceConfig: {
    buildingElementMaintenancePercent: 0.01,
  },
};
