export const variant1Data = {
  label: "VARIANT_1" as const,
  description: "Improved envelope with higher PV and better insulation",

  geometry: {
    grossFloorArea: 2000,
    netFloorArea: 1820,
    treatedFloorArea: 1780,
  },

  energyInputs: [
    { endUse: "HEATING_1" as const, energySourceIndex: 3, specificConsumption: 20 },
    { endUse: "HEATING_2" as const, energySourceIndex: 3, specificConsumption: 8 },
    { endUse: "COOLING_1" as const, energySourceIndex: 12, specificConsumption: 12 },
    {
      endUse: "HOUSEHOLD_ELECTRICITY" as const,
      energySourceIndex: 12,
      specificConsumption: 20,
    },
    {
      endUse: "PV_PRODUCTION" as const,
      energySourceIndex: 13,
      specificConsumption: 10,
      pvProductionKwh: 17800,
    },
  ],

  costItems: [
    {
      category: "A1_ROOFS" as const,
      materialCostAgg: 145000,
      laborCostAgg: 95000,
      otherCostAgg: 6000,
    },
    {
      category: "A5_WINDOWS" as const,
      materialCostAgg: 115000,
      laborCostAgg: 75000,
      otherCostAgg: 4000,
    },
    {
      category: "B1_HEATING" as const,
      materialCostAgg: 55000,
      laborCostAgg: 30000,
      otherCostAgg: 2500,
    },
  ],

  serviceComponents: [
    { name: "Heat pump", constructionCost: 42000, en15459ComponentIndex: 6 },
    { name: "Ventilation unit", constructionCost: 22000, en15459ComponentIndex: 1 },
    { name: "Solar inverter", constructionCost: 12000, en15459ComponentIndex: 13 },
  ],

  wlcInput: {
    landCostMode: "TOTAL_COST" as const,
    landCostTotal: 200000,
    landPrice: 0,
    enablingCost1: 16000,
    planningFees1: 10000,
    userSupportPropMgmt: 3200,
    userSupportCharges: 1600,
    userSupportAdmin: 900,
    financeCost: 5500,
  },

  designCosts: [
    {
      lineNumber: 1,
      description: "General design",
      preliminaryCost: 12000,
      definitiveCost: 9500,
      executiveCost: 5000,
      siteManagementCost: 3500,
    },
    {
      lineNumber: 2,
      description: "Structural engineer",
      preliminaryCost: 2500,
      definitiveCost: 1800,
      executiveCost: 1000,
      siteManagementCost: 2200,
    },
    {
      lineNumber: 3,
      description: "MEP consultant",
      preliminaryCost: 2200,
      definitiveCost: 1500,
      executiveCost: 800,
      siteManagementCost: 2000,
    },
    {
      lineNumber: 4,
      description: "Fire safety",
      preliminaryCost: 900,
      definitiveCost: 700,
      executiveCost: 350,
      siteManagementCost: 550,
    },
    {
      lineNumber: 5,
      description: "Energy consultant",
      preliminaryCost: 1500,
      definitiveCost: 1100,
      executiveCost: 600,
      siteManagementCost: 800,
    },
  ],

  incomeInput: {
    rent1MonthlyPerM2: 9.5,
    rent1Area: 1250,
    rent1Taxes: 2800,
    otherIncome1: 7200,
    otherIncome1Taxes: 950,
  },

  maintenanceConfig: {
    buildingElementMaintenancePercent: 0.01,
  },
};
