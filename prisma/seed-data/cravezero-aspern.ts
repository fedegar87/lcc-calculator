/** Aspern IQ — Office building, Wien, Austria (2011)
 *  Data from: CRAVEzero/181016_LCC_tool_base_V2_Aspern.xlsm */

export const ASPERN_PROJECT = {
  name: "TZ Aspern IQ",
  buildingUse: "OFFICE" as const,
  country: "Austria",
  city: "Wien",
  region: "1220 Wien, KG Aspern",
  constructionYear: 2011,
};

export const ASPERN_BOUNDARY = {
  referencePeriod: 40,
  interestRate: 0.0151,
  inflationRate: 0.0056,
  energyPrices: [
    { index: 12, name: "National Electricity-Mix", pricePerKwh: 0.20, annualIncrease: 0.01 },
    { index: 13, name: "Electricity from Photovoltaics", pricePerKwh: 0.20, annualIncrease: 0 },
    { index: 14, name: "District heating", pricePerKwh: 0.10, annualIncrease: 0.01 },
  ],
};

export const aspernVariant = {
  label: "BASE" as const,
  description: "TZ Aspern IQ reference building (Excel data)",

  geometry: {
    grossFloorArea: 10622.23,
    netFloorArea: 8816.84,
    grossVolume: 36965.36,
    netVolume: 33231.67,
    unheatedGFA: 4569.77,
    unheatedGrossVol: 13336.31,
    otherSurfacesArea: 7916,
    treatedFloorArea: 6633.12,
  },

  energyInputs: [
    { endUse: "HEATING_1" as const, energySourceIndex: 14, specificConsumption: 22.3058 },
    { endUse: "COOLING_1" as const, energySourceIndex: 12, specificConsumption: 0.1483 },
    { endUse: "DHW_1" as const, energySourceIndex: 14, specificConsumption: 9.5072 },
    { endUse: "HOUSEHOLD_ELECTRICITY" as const, energySourceIndex: 12, specificConsumption: 27.1454 },
    { endUse: "PV_PRODUCTION" as const, energySourceIndex: 13, specificConsumption: 0, pvProductionKwh: 128256 },
  ],

  costItems: [
    // A - Building Elements (from Results sheet)
    { category: "A1_ROOFS" as const, materialCostAgg: 260289, laborCostAgg: 169046 },
    { category: "A2_FACADES" as const, materialCostAgg: 15237, laborCostAgg: 4944 },
    { category: "A3_FLOORS" as const, materialCostAgg: 622157, laborCostAgg: 493812 },
    { category: "A4_WALLS" as const, materialCostAgg: 323897, laborCostAgg: 210231 },
    { category: "A5_WINDOWS" as const, materialCostAgg: 458081, laborCostAgg: 508565 },
    { category: "A6_SHADING" as const, materialCostAgg: 66941, laborCostAgg: 100615 },
    { category: "A7_DOORS" as const, materialCostAgg: 54245, laborCostAgg: 19985 },
    { category: "A8_INTERNAL" as const, materialCostAgg: 1306344, laborCostAgg: 14291 },
    { category: "A9_STRUCTURE" as const, materialCostAgg: 307120, laborCostAgg: 257547 },
    { category: "A10_OTHER" as const, materialCostAgg: 405049, laborCostAgg: 0 },
    // B - Building Services
    { category: "B1_HEATING" as const, materialCostAgg: 213789, laborCostAgg: 0 },
    { category: "B2_COOLING" as const, materialCostAgg: 566715, laborCostAgg: 0 },
    { category: "B4_HVAC_COMBINED" as const, materialCostAgg: 482888, laborCostAgg: 0 },
    { category: "B6_HYDRAULIC" as const, materialCostAgg: 86973, laborCostAgg: 0 },
    // C - Renewable
    { category: "C2_PV" as const, materialCostAgg: 350068, laborCostAgg: 0 },
    // D - Furnishings
    { category: "D1_FURNISHINGS" as const, materialCostAgg: 199222, laborCostAgg: 0 },
  ],

  serviceComponents: [
    { name: "DHW distribution", constructionCost: 86973, en15459ComponentIndex: 28 },
    { name: "PV panels (system 1)", constructionCost: 88960, en15459ComponentIndex: 68 },
    { name: "PV inverters (system 1)", constructionCost: 15576, en15459ComponentIndex: 69 },
    { name: "PV other (system 1)", constructionCost: 16200, en15459ComponentIndex: 68 },
    { name: "PV panels (system 2)", constructionCost: 44490, en15459ComponentIndex: 68 },
    { name: "PV inverters (system 2)", constructionCost: 7500, en15459ComponentIndex: 69 },
    { name: "PV other (system 2)", constructionCost: 16200, en15459ComponentIndex: 68 },
    { name: "PV panels (system 3)", constructionCost: 104528, en15459ComponentIndex: 68 },
    { name: "PV inverters (system 3)", constructionCost: 21075, en15459ComponentIndex: 69 },
    { name: "PV other (system 3)", constructionCost: 35539, en15459ComponentIndex: 68 },
  ],

  wlcInput: {
    landArea: 12682,
    buildingIndex: 3.96,
  },

  designCosts: [
    { lineNumber: 1, description: "Lighting design", preliminaryCost: 6000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 2, description: "Fire safety prevention", preliminaryCost: 10000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 3, description: "Competition", preliminaryCost: 80000, definitiveCost: 0, executiveCost: 0, siteManagementCost: 0 },
    { lineNumber: 4, description: "Overall planner", preliminaryCost: 0, definitiveCost: 0, executiveCost: 0, siteManagementCost: 1074000 },
    { lineNumber: 5, description: "Surveyor", preliminaryCost: 0, definitiveCost: 0, executiveCost: 0, siteManagementCost: 1550 },
    { lineNumber: 6, description: "Soil survey", preliminaryCost: 0, definitiveCost: 0, executiveCost: 0, siteManagementCost: 10820 },
    { lineNumber: 7, description: "Site coordinator", preliminaryCost: 0, definitiveCost: 0, executiveCost: 0, siteManagementCost: 19550 },
    { lineNumber: 8, description: "Local construction supervision", preliminaryCost: 0, definitiveCost: 0, executiveCost: 0, siteManagementCost: 285000 },
    { lineNumber: 9, description: "Tenant coordination", preliminaryCost: 0, definitiveCost: 0, executiveCost: 0, siteManagementCost: 26775 },
  ],

  incomeInput: {},

  maintenanceConfig: {
    buildingElementMaintenancePercent: 0.01,
  },
};
