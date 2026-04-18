// AGG-001 through AGG-014, CAL-001..004: Cost aggregation and KPIs

import type { CostItemInput, WLCInputData, FormulaMode } from './types';
import type { EnergyCostResult } from './energy';
import type { MaintenanceCostResult } from './maintenance';
import {
  getConstructionByCategory,
  getTotalConstructionCost,
} from './construction';

export interface AggregateResult {
  // AGG-001..003: construction totals
  totalMaterials: number;
  totalLabor: number;
  totalConstruction: number;

  // AGG-004: by category
  constructionByCategory: Record<string, number>;

  // AGG-005..007: non-construction, design, site management
  nonConstructionCosts: number;
  designCosts: number;
  buildingSiteManagement: number;

  // CAL-001..002: energy aggregation at refPeriod
  energyConsumed: number;
  energyProduced: number;

  // AGG-008..011: O&M
  operationAndMaintenance: number;

  // AGG-012..013: LCC, WLC
  lcc: number;
  wlc: number;

  // AGG-014: KPIs — divisor is investmentCost (construction + design + site mgmt), NOT LCC
  kpiDesignOverInvestmentCost: number | null;
  kpiConstructionOverInvestmentCost: number | null;
  kpiLaborOverInvestmentCost: number | null;
  kpiOMOverInvestmentCost: number | null;
  kpiLCCPerM2: number | null;
  kpiWLCPerM2: number | null;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

export function aggregateResults(
  costItems: CostItemInput[],
  wlcInput: WLCInputData,
  energy: EnergyCostResult,
  maintenance: MaintenanceCostResult,
  referencePeriod: number,
  treatedFloorArea: number,
  formulaMode: FormulaMode = 'excel_bugfixed',
): AggregateResult {
  // AGG-001..003: Construction costs
  const totalMaterials = costItems.reduce(
    (sum, ci) => sum + ci.materialCost,
    0,
  );
  const totalLabor = costItems.reduce((sum, ci) => sum + ci.laborCost, 0);
  const totalConstruction = getTotalConstructionCost(costItems, formulaMode);

  // AGG-004: Construction by category
  const constructionByCategory = getConstructionByCategory(
    costItems,
    formulaMode,
  );

  // AGG-005: Non-construction costs
  const nonConstructionCosts =
    wlcInput.landCost +
    wlcInput.enablingCosts +
    wlcInput.planningFees +
    wlcInput.userSupportPropMgmt +
    wlcInput.userSupportCharges +
    wlcInput.userSupportAdmin +
    wlcInput.financeCost;

  // AGG-006: Design costs (pre-aggregated per rule 10)
  const designCosts = wlcInput.designCostsTotal;

  // AGG-007: Building site management (SEPARATE from design per DEC-010)
  const buildingSiteManagement = wlcInput.siteManagementCostsTotal;

  // CAL-001: Total energy consumed (all end-uses except PV, cumulated at refPeriod)
  const energyConsumed =
    energy.heating.cumulated[referencePeriod] +
    energy.cooling.cumulated[referencePeriod] +
    energy.dhw.cumulated[referencePeriod] +
    energy.household.cumulated[referencePeriod];

  // CAL-002: Total energy produced (PV cumulated at refPeriod)
  const energyProduced = energy.pv.cumulated[referencePeriod];

  // AGG-008: O&M = energyConsumed - energyProduced + totalMaintenance
  const operationAndMaintenance =
    energyConsumed - energyProduced + maintenance.totalMaintenance;

  // AGG-012: LCC = designCosts + totalConstruction + O&M + siteManagement
  const lcc =
    designCosts + totalConstruction + operationAndMaintenance + buildingSiteManagement;

  // AGG-013: WLC = LCC + nonConstructionCosts
  const wlc = lcc + nonConstructionCosts;

  // AGG-014: KPIs
  // CRITICAL: Divisor is investmentCost, NOT LCC.
  // Verified from Excel: Results!B63 = B65 + B57 + B61 (construction + design + site mgmt)
  const investmentCost = totalConstruction + designCosts + buildingSiteManagement;

  const kpiDesignOverInvestmentCost = safeRatio(designCosts, investmentCost);
  // Excel B83 = B66/B63 (materials / investmentCost)
  const kpiConstructionOverInvestmentCost = safeRatio(
    totalMaterials,
    investmentCost,
  );
  // Excel B84 = B71/B63 (labor / investmentCost)
  const kpiLaborOverInvestmentCost = safeRatio(totalLabor, investmentCost);
  // Excel B85 = B76/B63 (O&M / investmentCost)
  const kpiOMOverInvestmentCost = safeRatio(
    operationAndMaintenance,
    investmentCost,
  );
  // Per m2 KPIs use treatedFloorArea as divisor
  const kpiLCCPerM2 = safeRatio(lcc, treatedFloorArea);
  const kpiWLCPerM2 = safeRatio(wlc, treatedFloorArea);

  return {
    totalMaterials,
    totalLabor,
    totalConstruction,
    constructionByCategory,
    nonConstructionCosts,
    designCosts,
    buildingSiteManagement,
    energyConsumed,
    energyProduced,
    operationAndMaintenance,
    lcc,
    wlc,
    kpiDesignOverInvestmentCost,
    kpiConstructionOverInvestmentCost,
    kpiLaborOverInvestmentCost,
    kpiOMOverInvestmentCost,
    kpiLCCPerM2,
    kpiWLCPerM2,
  };
}
