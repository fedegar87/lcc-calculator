/** Héliades — Apartment house, Angers, France (2016)
 *  Data from: CRAVEzero/180823_LCC_tool_base_V2_Héliades.xlsm */

export const HELIADES_PROJECT = {
  name: "Héliades",
  buildingUse: "RESIDENTIAL_MULTI" as const,
  country: "France",
  city: "Angers",
  constructionYear: 2016,
};

export const HELIADES_BOUNDARY = {
  referencePeriod: 40,
  interestRate: 0.0151,
  inflationRate: 0.0056,
  energyPrices: [
    { index: 12, name: "National Electricity-Mix", pricePerKwh: 0.1456, annualIncrease: 0.01 },
    { index: 13, name: "Electricity from Photovoltaics", pricePerKwh: 0.1456, annualIncrease: 0 },
    { index: 14, name: "District heating", pricePerKwh: 0.10, annualIncrease: 0.01 },
  ],
};

export const heliadesVariant = {
  label: "BASE" as const,
  description: "Héliades reference building (Excel data)",

  geometry: {
    treatedFloorArea: 4646.42,
  },

  energyInputs: [
    { endUse: "HEATING_1" as const, energySourceIndex: 14, specificConsumption: 22.2884 },
    { endUse: "COOLING_1" as const, energySourceIndex: 12, specificConsumption: 0.4749 },
    { endUse: "DHW_1" as const, energySourceIndex: 14, specificConsumption: 18.6479 },
    { endUse: "HOUSEHOLD_ELECTRICITY" as const, energySourceIndex: 12, specificConsumption: 17.2594 },
    { endUse: "PV_PRODUCTION" as const, energySourceIndex: 13, specificConsumption: 0, pvProductionKwh: 55099 },
  ],

  costItems: [
    // A - Building Elements (from Results sheet — no labor for French project)
    { category: "A1_ROOFS" as const, materialCostAgg: 260586, laborCostAgg: 0 },
    { category: "A3_FLOORS" as const, materialCostAgg: 48079, laborCostAgg: 0 },
    { category: "A4_WALLS" as const, materialCostAgg: 280109, laborCostAgg: 0 },
    { category: "A5_WINDOWS" as const, materialCostAgg: 208650, laborCostAgg: 0 },
    { category: "A6_SHADING" as const, materialCostAgg: 16401, laborCostAgg: 0 },
    { category: "A7_DOORS" as const, materialCostAgg: 15394, laborCostAgg: 0 },
    { category: "A8_INTERNAL" as const, materialCostAgg: 280148, laborCostAgg: 0 },
    { category: "A9_STRUCTURE" as const, materialCostAgg: 1671258, laborCostAgg: 0 },
    { category: "A10_OTHER" as const, materialCostAgg: 195707, laborCostAgg: 0 },
    // B - Building Services
    { category: "B1_HEATING" as const, materialCostAgg: 263728, laborCostAgg: 0 },
    { category: "B2_COOLING" as const, materialCostAgg: 0, laborCostAgg: 0 },
    { category: "B4_HVAC_COMBINED" as const, materialCostAgg: 90453, laborCostAgg: 0 },
    { category: "B5_ELECTRICAL" as const, materialCostAgg: 473485, laborCostAgg: 0 },
    { category: "B6_HYDRAULIC" as const, materialCostAgg: 376457, laborCostAgg: 0 },
    // C - Renewable
    { category: "C2_PV" as const, materialCostAgg: 165143, laborCostAgg: 0 },
    { category: "C1_SOLAR_THERMAL" as const, materialCostAgg: 44075, laborCostAgg: 0 },
    // D - Furnishings
    { category: "D1_FURNISHINGS" as const, materialCostAgg: 43308, laborCostAgg: 0 },
  ],

  serviceComponents: [
    { name: "DHW distribution", constructionCost: 63846, en15459ComponentIndex: 28 },
    { name: "DHW regulation", constructionCost: 1603, en15459ComponentIndex: 30 },
    { name: "DHW storage", constructionCost: 3660, en15459ComponentIndex: 30 },
    { name: "DHW other", constructionCost: 18421, en15459ComponentIndex: 28 },
    { name: "Electrical cables", constructionCost: 5775, en15459ComponentIndex: 52 },
    { name: "Electrical other (strong current)", constructionCost: 134005, en15459ComponentIndex: 52 },
    { name: "Electrical other (weak current)", constructionCost: 46754, en15459ComponentIndex: 52 },
    { name: "Hydraulic pipes", constructionCost: 70914, en15459ComponentIndex: 28 },
    { name: "PV panels", constructionCost: 158758, en15459ComponentIndex: 68 },
    { name: "Solar thermal panels", constructionCost: 24597, en15459ComponentIndex: 63 },
  ],

  wlcInput: {},

  designCosts: [
    { lineNumber: 1, description: "Technological design (Architect + M&E)", preliminaryCost: 91000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 2, description: "Landscaper", preliminaryCost: 7500, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 3, description: "Administrative procedures", preliminaryCost: 4200, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 4, description: "Production management", preliminaryCost: 40000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
  ],

  incomeInput: {},

  maintenanceConfig: {
    buildingElementMaintenancePercent: 0.01,
  },
};
