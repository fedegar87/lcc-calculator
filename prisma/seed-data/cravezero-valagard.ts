/** Väla Gård — Office building, Helsingborg, Sweden (2012)
 *  Data from: CRAVEzero/180823_LCC_tool_base_V2-VälaGård_180630.xlsm */

export const VALAGARD_PROJECT = {
  name: "Väla Gård",
  buildingUse: "OFFICE" as const,
  country: "Sweden",
  city: "Helsingborg",
  constructionYear: 2012,
};

export const VALAGARD_BOUNDARY = {
  referencePeriod: 40,
  interestRate: 0.0151,
  inflationRate: 0.0056,
  energyPrices: [
    { index: 12, name: "National Electricity-Mix", pricePerKwh: 0.12, annualIncrease: 0.01 },
    { index: 13, name: "Electricity from Photovoltaics", pricePerKwh: 0.12, annualIncrease: 0 },
  ],
};

export const valagardVariant = {
  label: "BASE" as const,
  description: "Väla Gård reference building (Excel data)",

  geometry: {
    treatedFloorArea: 1670,
  },

  energyInputs: [
    { endUse: "HEATING_1" as const, energySourceIndex: 12, specificConsumption: 15.6432 },
    { endUse: "COOLING_1" as const, energySourceIndex: 12, specificConsumption: 2.8846 },
    { endUse: "DHW_1" as const, energySourceIndex: 12, specificConsumption: 1.3461 },
    { endUse: "HOUSEHOLD_ELECTRICITY" as const, energySourceIndex: 12, specificConsumption: 27.814 },
    { endUse: "PV_PRODUCTION" as const, energySourceIndex: 13, specificConsumption: 0, pvProductionKwh: 56800 },
  ],

  costItems: [
    // A - Building Elements (from Results sheet)
    { category: "A1_ROOFS" as const, materialCostAgg: 213885, laborCostAgg: 142590 },
    { category: "A2_FACADES" as const, materialCostAgg: 45925, laborCostAgg: 45925 },
    { category: "A3_FLOORS" as const, materialCostAgg: 9000, laborCostAgg: 16440 },
    { category: "A4_WALLS" as const, materialCostAgg: 84375, laborCostAgg: 211949 },
    { category: "A5_WINDOWS" as const, materialCostAgg: 154353, laborCostAgg: 28245 },
    { category: "A6_SHADING" as const, materialCostAgg: 40950, laborCostAgg: 27300 },
    { category: "A7_DOORS" as const, materialCostAgg: 66465, laborCostAgg: 44310 },
    { category: "A8_INTERNAL" as const, materialCostAgg: 172433, laborCostAgg: 200701 },
    { category: "A10_OTHER" as const, materialCostAgg: 10300, laborCostAgg: 2820 },
    // B - Building Services
    { category: "B1_HEATING" as const, materialCostAgg: 173603, laborCostAgg: 155107 },
    { category: "B6_HYDRAULIC" as const, materialCostAgg: 45658, laborCostAgg: 24816 },
    { category: "B4_HVAC_COMBINED" as const, materialCostAgg: 295963, laborCostAgg: 60346 },
    { category: "B5_ELECTRICAL" as const, materialCostAgg: 216861, laborCostAgg: 46416 },
    // C - Renewable
    { category: "C2_PV" as const, materialCostAgg: 126960, laborCostAgg: 32988 },
    // D - Furnishings
    { category: "D1_FURNISHINGS" as const, materialCostAgg: 180721.25, laborCostAgg: 17043.75 },
  ],

  serviceComponents: [
    { name: "DHW distribution", constructionCost: 16934, en15459ComponentIndex: 28 },
    { name: "Electrical cables", constructionCost: 108941, en15459ComponentIndex: 52 },
    { name: "Electrical other (strong current)", constructionCost: 107920, en15459ComponentIndex: 52 },
    { name: "Hydraulic pipes", constructionCost: 28724, en15459ComponentIndex: 28 },
    { name: "PV panels", constructionCost: 113760, en15459ComponentIndex: 68 },
    { name: "PV inverters", constructionCost: 6600, en15459ComponentIndex: 69 },
    { name: "PV cables", constructionCost: 6600, en15459ComponentIndex: 68 },
  ],

  wlcInput: {
    landCostMode: "TOTAL_COST" as const,
    landCostTotal: 410000,
    landPrice: 0,
    landArea: 4750,
    buildingIndex: 1.6611,
  },

  designCosts: [
    { lineNumber: 1, description: "Architects", preliminaryCost: 23120, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 2, description: "Energy design", preliminaryCost: 7500, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 3, description: "Production management", preliminaryCost: 15000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 4, description: "Definitive design cached total", preliminaryCost: 0, definitiveCost: 273380, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 5, description: "Building site cached total", preliminaryCost: 0, definitiveCost: 0, executiveCost: 0, siteManagementCost: 228650 },
  ],

  incomeInput: {},

  maintenanceConfig: {
    buildingElementMaintenancePercent: 0.01,
  },
};
