/** Solallén — Terraced house, Växjö, Sweden (2015)
 *  Data from: CRAVEzero/181105_LCC_tool_base_V2-Solallen.xlsm */

export const SOLALLEN_PROJECT = {
  name: "Solallén",
  buildingUse: "RESIDENTIAL_MULTI" as const,
  country: "Sweden",
  city: "Växjö",
  constructionYear: 2015,
};

export const SOLALLEN_BOUNDARY = {
  referencePeriod: 40,
  interestRate: 0.0151,
  inflationRate: 0.0056,
  energyPrices: [
    { index: 12, name: "National Electricity-Mix", pricePerKwh: 0.187, annualIncrease: 0.01 },
    { index: 13, name: "Electricity from Photovoltaics", pricePerKwh: 0.187, annualIncrease: 0 },
  ],
};

export const solallenVariant = {
  label: "BASE" as const,
  description: "Solallén reference building (Excel data)",

  geometry: {
    treatedFloorArea: 1778,
  },

  energyInputs: [
    { endUse: "HEATING_1" as const, energySourceIndex: 12, specificConsumption: 18.3845 },
    { endUse: "COOLING_1" as const, energySourceIndex: 12, specificConsumption: 0.4413 },
    { endUse: "DHW_1" as const, energySourceIndex: 12, specificConsumption: 6.2641 },
    { endUse: "HOUSEHOLD_ELECTRICITY" as const, energySourceIndex: 12, specificConsumption: 26.5791 },
    { endUse: "PV_PRODUCTION" as const, energySourceIndex: 13, specificConsumption: 0, pvProductionKwh: 7900 },
  ],

  costItems: [
    // A - Building Elements (from Results sheet)
    { category: "A1_ROOFS" as const, materialCostAgg: 146581, laborCostAgg: 292015 },
    { category: "A3_FLOORS" as const, materialCostAgg: 171625, laborCostAgg: 179021 },
    { category: "A4_WALLS" as const, materialCostAgg: 209939, laborCostAgg: 290788 },
    { category: "A5_WINDOWS" as const, materialCostAgg: 89104, laborCostAgg: 66468 },
    { category: "A6_SHADING" as const, materialCostAgg: 10710, laborCostAgg: 5922 },
    { category: "A7_DOORS" as const, materialCostAgg: 25427, laborCostAgg: 5600 },
    { category: "A8_INTERNAL" as const, materialCostAgg: 76759, laborCostAgg: 112002 },
    // B - Building Services
    { category: "B1_HEATING" as const, materialCostAgg: 150339, laborCostAgg: 110338 },
    { category: "B2_COOLING" as const, materialCostAgg: 1995, laborCostAgg: 2205 },
    { category: "B4_HVAC_COMBINED" as const, materialCostAgg: 84935, laborCostAgg: 52566 },
    { category: "B5_ELECTRICAL" as const, materialCostAgg: 57960, laborCostAgg: 46074 },
    { category: "B6_HYDRAULIC" as const, materialCostAgg: 45858, laborCostAgg: 21318 },
    // C - Renewable
    { category: "C2_PV" as const, materialCostAgg: 90125, laborCostAgg: 45395 },
    // D - Furnishings
    { category: "D1_FURNISHINGS" as const, materialCostAgg: 90552, laborCostAgg: 0 },
  ],

  serviceComponents: [
    { name: "DHW distribution", constructionCost: 17184, en15459ComponentIndex: 28 },
    { name: "DHW storage", constructionCost: 13300, en15459ComponentIndex: 30 },
    { name: "Electrical cables", constructionCost: 8400, en15459ComponentIndex: 52 },
    { name: "Electrical other", constructionCost: 49560, en15459ComponentIndex: 52 },
    { name: "Hydraulic pipes", constructionCost: 15373, en15459ComponentIndex: 28 },
    { name: "PV panels", constructionCost: 63700, en15459ComponentIndex: 68 },
    { name: "PV inverters", constructionCost: 9065, en15459ComponentIndex: 69 },
    { name: "PV cables", constructionCost: 17360, en15459ComponentIndex: 68 },
  ],

  wlcInput: {
    landArea: 7575,
    buildingIndex: 6.2557,
    landCostMode: "TOTAL_COST" as const,
    landCostTotal: 750000,
    landPrice: 0,
  },

  designCosts: [
    { lineNumber: 1, description: "Architects", preliminaryCost: 33600, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 2, description: "Energy design", preliminaryCost: 15000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 3, description: "Production management", preliminaryCost: 10000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
  ],

  incomeInput: {},

  maintenanceConfig: {
    buildingElementMaintenancePercent: 0.01,
  },
};
