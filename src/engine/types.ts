// PURE ENGINE TYPES - No Prisma or framework imports allowed

export const ENGINE_VERSION = '1.0.0';

export type FormulaMode = 'excel_replica' | 'excel_bugfixed';
export type LandCostMode = 'UNIT_PRICE' | 'TOTAL_COST';

export interface EngineConfig {
  formulaMode: FormulaMode;
  maxReplacementCycles?: number | null;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  formulaMode: 'excel_bugfixed',
};

export type MaintenanceType = 'building_element' | 'building_service' | 'none';

// Maps all 21 CostCategory values to their maintenance type.
// A1-A10: building envelope/structure -> building_element
// B1-B6, C1-C3: building services/HVAC -> building_service
// D1, E1: non-construction/outdoor -> none
export const CATEGORY_MAINTENANCE_MAP: Record<string, MaintenanceType> = {
  A1_ROOFS: 'building_element',
  A2_FACADES: 'building_element',
  A3_FLOORS: 'building_element',
  A4_WALLS: 'building_element',
  A5_WINDOWS: 'building_element',
  A6_SHADING: 'building_element',
  A7_DOORS: 'building_element',
  A8_INTERNAL: 'building_element',
  A9_STRUCTURE: 'building_element',
  A10_OTHER: 'building_element',
  B1_HEATING: 'building_service',
  B2_COOLING: 'building_service',
  B3_VENTILATION: 'building_service',
  B4_HVAC_COMBINED: 'building_service',
  B5_ELECTRICAL: 'building_service',
  B6_HYDRAULIC: 'building_service',
  C1_SOLAR_THERMAL: 'building_service',
  C2_PV: 'building_service',
  C3_OTHER_RES: 'building_service',
  D1_FURNISHINGS: 'none',
  E1_OUTDOOR: 'none',
};

// Energy end-use pairs: [primary, secondary] for dual-system configurations.
// PV_PRODUCTION handled separately (subtracted, not added)
export const END_USE_PAIRS: [string, string | null][] = [
  ['HEATING_1', 'HEATING_2'],
  ['COOLING_1', 'COOLING_2'],
  ['DHW_1', 'DHW_2'],
  ['HOUSEHOLD_ELECTRICITY', null],
];

// --- Input interfaces (all use plain number, not Decimal.js) ---

export interface EnergySourcePrice {
  index: number;
  name: string;
  pricePerKwh: number;
  annualIncrease: number;
}

export interface EnergyEndUseInput {
  endUse: string;
  energySourceIndex: number;
  specificConsumption: number; // kWh/m2/year
  pvProductionKwh?: number;
}

export interface ServiceComponentInput {
  name: string;
  constructionCost: number;
  en15459ComponentIndex: number;
  // Stable ordering hint propagated from the data layer for replica-mode bugs.
  replicaOrder?: number;
}

export interface CostItemInput {
  category: string;
  materialCost: number;
  laborCost: number;
  otherCost: number;
}

export interface DesignCostInput {
  lineNumber: number;
  description: string;
  preliminaryCost: number;
  definitiveCost: number;
  executiveCost: number;
  siteManagementCost: number;
}

export interface IncomeInputData {
  rents: { monthlyPerM2: number; area: number; taxes: number }[];
  otherIncomes: { amount: number; taxes: number }[];
  expectedPricePerM2?: number;
}

export interface WLCInputData {
  landCost: number;
  landCostMode?: LandCostMode;
  landArea?: number;
  landPrice?: number;
  landCostTotal?: number;
  enablingCosts: number;
  planningFees: number;
  userSupportPropMgmt: number;
  userSupportCharges: number;
  userSupportAdmin: number;
  financeCost: number;
  designCostsTotal: number;
  siteManagementCostsTotal: number;
}

// --- Main engine input ---

export interface VariantInput {
  referencePeriod: number;
  interestRate: number;   // decimal (0.0151 = 1.51%)
  inflationRate: number;  // decimal (0.0056 = 0.56%)
  treatedFloorArea: number; // m2
  energyPrices: EnergySourcePrice[];
  energyInputs: EnergyEndUseInput[];
  costItems: CostItemInput[];
  serviceComponents: ServiceComponentInput[];
  buildingElementMaintenancePercent: number;
  wlcInput: WLCInputData;
  designCosts: DesignCostInput[];
  incomeInput?: IncomeInputData;
}

// --- Output interfaces ---

export interface YearlyEnergyCosts {
  nominal: number[];    // ENR-001: nominal costs per year
  actualized: number[]; // ENR-002: actualized (discounted) costs per year
  cumulated: number[];  // ENR-003: cumulative actualized costs
}

export interface LCCResult {
  // Metadata
  engineVersion: string;
  formulaMode: FormulaMode;

  // FIN-001: real interest rate
  realInterestRate: number;

  // Energy costs by end-use (ENR-001 through ENR-003)
  heatingCosts: YearlyEnergyCosts;
  coolingCosts: YearlyEnergyCosts;
  dhwCosts: YearlyEnergyCosts;
  householdCosts: YearlyEnergyCosts;
  pvProduction: YearlyEnergyCosts;

  // Maintenance arrays (MNT-001 through MNT-003)
  maintenanceElements: number[];  // building element maintenance per year
  maintenanceServices: number[];  // building service maintenance per year
  maintenanceTotal: number[];     // total maintenance per year
  maintenanceCumulated: number[]; // cumulative maintenance

  // Construction cost aggregates (AGG-001 through AGG-003)
  totalMaterials: number;
  totalLabor: number;
  totalConstruction: number;

  // AGG-004: construction cost by category
  constructionByCategory: Record<string, number>;

  // AGG-005 through AGG-008: non-construction and WLC components
  nonConstructionCosts: number;
  designCosts: number;
  buildingSiteManagement: number;

  // AGG-009 through AGG-012: summary aggregates
  energyConsumed: number;
  energyProduced: number;
  maintenanceAtRefPeriod: number;
  operationAndMaintenance: number;

  // AGG-013, AGG-014: LCC and WLC totals
  lcc: number;
  wlc: number;

  // RES-001: residual value at end of reference period
  residualValue: number;
  lccNetResidual: number;

  // INC-001 through INC-004: income analysis (null if no income data)
  income: {
    netAnnualIncome: number;
    simplePaybackYears: number | null;
    npvIncomeStream: number;
    netPresentValue: number;
  } | null;

  // KPI-001 through KPI-006: key performance indicators (null if TFA=0)
  kpiDesignOverInvestmentCost: number | null;
  kpiConstructionOverInvestmentCost: number | null;
  kpiLaborOverInvestmentCost: number | null;
  kpiOMOverInvestmentCost: number | null;
  kpiLCCPerM2: number | null;
  kpiWLCPerM2: number | null;
}
