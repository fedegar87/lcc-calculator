// Main calculation engine orchestrator
// Calls all modules in dependency order and assembles LCCResult

import type {
  VariantInput,
  LCCResult,
  EngineConfig,
  FormulaMode,
  YearlyEnergyCosts,
} from './types';
import { DEFAULT_ENGINE_CONFIG, ENGINE_VERSION } from './types';
import { validateVariantInput } from './validation';
import { computeRealInterestRate, computeDiscountFactors } from './discount';
import { computeEnergyCosts } from './energy';
import { computeMaintenanceCosts } from './maintenance';
import { computeResidualValue } from './residual';
import { computeIncome } from './income';
import { aggregateResults } from './aggregate';

export type { VariantInput, LCCResult, EngineConfig, FormulaMode };
export { DEFAULT_ENGINE_CONFIG, ENGINE_VERSION };

function roundCurrency(v: number): number {
  return Math.round(v * 100) / 100;
}

function roundRate(v: number): number {
  return Math.round(v * 10000) / 10000;
}

function roundYearlyCosts(yc: YearlyEnergyCosts): YearlyEnergyCosts {
  return {
    nominal: yc.nominal.map(roundCurrency),
    actualized: yc.actualized.map(roundCurrency),
    cumulated: yc.cumulated.map(roundCurrency),
  };
}

/**
 * Main engine entry point. Pure function: input -> validated -> computed -> rounded -> LCCResult.
 * Throws on invalid input.
 */
export function calculateLCC(
  input: VariantInput,
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
): LCCResult {
  // 1. VALIDATE
  const errors = validateVariantInput(input);
  if (errors.length > 0) {
    throw new Error(`Invalid input: ${errors.join(', ')}`);
  }

  // 2. DISCOUNT (FIN-001, FIN-002)
  const rr = computeRealInterestRate(input.interestRate, input.inflationRate);
  // Discount factors computed for completeness; modules use rr or interestRate directly
  computeDiscountFactors(rr, input.referencePeriod);

  // 3. ENERGY (NRG-001..007)
  const energy = computeEnergyCosts(input, rr);

  // 4. MAINTENANCE (MNT-001..004, CAL-005..008)
  const maintenance = computeMaintenanceCosts(input, config);

  // 5. AGGREGATE (AGG-001..014, CAL-001..004)
  const agg = aggregateResults(
    input.costItems,
    input.wlcInput,
    energy,
    maintenance,
    input.referencePeriod,
    input.treatedFloorArea,
  );

  // 6. RESIDUAL VALUE (RES-001)
  const residual = computeResidualValue(
    input.serviceComponents,
    input.referencePeriod,
    rr,
  );
  const lccNetResidual = agg.lcc - residual.totalResidualValue;

  // 7. INCOME (INC-001..003)
  const income = computeIncome(
    input.incomeInput,
    agg.lcc,
    input.referencePeriod,
    rr,
  );

  // 8. ASSEMBLE with output rounding (2dp EUR, 4dp rates)
  return {
    engineVersion: ENGINE_VERSION,
    formulaMode: config.formulaMode,
    realInterestRate: roundRate(rr),

    heatingCosts: roundYearlyCosts(energy.heating),
    coolingCosts: roundYearlyCosts(energy.cooling),
    dhwCosts: roundYearlyCosts(energy.dhw),
    householdCosts: roundYearlyCosts(energy.household),
    pvProduction: roundYearlyCosts(energy.pv),

    maintenanceElements: maintenance.elements.map(roundCurrency),
    maintenanceServices: maintenance.services.map(roundCurrency),
    maintenanceTotal: maintenance.total.map(roundCurrency),
    maintenanceCumulated: maintenance.totalCumulated.map(roundCurrency),

    totalMaterials: roundCurrency(agg.totalMaterials),
    totalLabor: roundCurrency(agg.totalLabor),
    totalConstruction: roundCurrency(agg.totalConstruction),
    constructionByCategory: Object.fromEntries(
      Object.entries(agg.constructionByCategory).map(([k, v]) => [
        k,
        roundCurrency(v),
      ]),
    ),

    nonConstructionCosts: roundCurrency(agg.nonConstructionCosts),
    designCosts: roundCurrency(agg.designCosts),
    buildingSiteManagement: roundCurrency(agg.buildingSiteManagement),

    energyConsumed: roundCurrency(agg.energyConsumed),
    energyProduced: roundCurrency(agg.energyProduced),
    maintenanceAtRefPeriod: roundCurrency(maintenance.totalMaintenance),
    operationAndMaintenance: roundCurrency(agg.operationAndMaintenance),

    lcc: roundCurrency(agg.lcc),
    wlc: roundCurrency(agg.wlc),

    residualValue: roundCurrency(residual.totalResidualValue),
    lccNetResidual: roundCurrency(lccNetResidual),

    income: income
      ? {
          netAnnualIncome: roundCurrency(income.netAnnualIncome),
          simplePaybackYears:
            income.simplePaybackYears !== null
              ? roundRate(income.simplePaybackYears)
              : null,
          npvIncomeStream: roundCurrency(income.npvIncomeStream),
          netPresentValue: roundCurrency(income.netPresentValue),
        }
      : null,

    kpiDesignOverLCC:
      agg.kpiDesignOverLCC !== null ? roundRate(agg.kpiDesignOverLCC) : null,
    kpiConstructionOverLCC:
      agg.kpiConstructionOverLCC !== null
        ? roundRate(agg.kpiConstructionOverLCC)
        : null,
    kpiLaborOverLCC:
      agg.kpiLaborOverLCC !== null ? roundRate(agg.kpiLaborOverLCC) : null,
    kpiOMOverLCC:
      agg.kpiOMOverLCC !== null ? roundRate(agg.kpiOMOverLCC) : null,
    kpiLCCPerM2:
      agg.kpiLCCPerM2 !== null ? roundCurrency(agg.kpiLCCPerM2) : null,
    kpiWLCPerM2:
      agg.kpiWLCPerM2 !== null ? roundCurrency(agg.kpiWLCPerM2) : null,
  };
}
