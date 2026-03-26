import { describe, it, expect } from 'vitest';
import { calculateLCC } from '@/engine';
import {
  baseInput,
  GOLDEN_EXPECTED,
  BUGFIXED_CONFIG,
  expectCurrency,
  expectRate,
} from './helpers';

const result = calculateLCC(baseInput(), BUGFIXED_CONFIG);
const exp = GOLDEN_EXPECTED;

describe('Integration: calculateLCC end-to-end', () => {
  it('has engine metadata', () => {
    expect(result.engineVersion).toBeDefined();
    expect(result.formulaMode).toBe('excel_bugfixed');
  });

  it('real interest rate', () => {
    expectRate(result.realInterestRate, exp.realInterestRate);
  });
});

describe('Integration: construction costs (exact)', () => {
  it('totalMaterials', () => {
    expect(result.totalMaterials).toBe(exp.aggregate.totalMaterials);
  });

  it('totalLabor', () => {
    expect(result.totalLabor).toBe(exp.aggregate.totalLabor);
  });

  it('totalConstruction', () => {
    expect(result.totalConstruction).toBe(exp.aggregate.totalConstruction);
  });

  it('nonConstructionCosts', () => {
    expect(result.nonConstructionCosts).toBe(exp.aggregate.nonConstructionCosts);
  });

  it('designCosts', () => {
    expect(result.designCosts).toBe(exp.aggregate.designCosts);
  });

  it('buildingSiteManagement', () => {
    expect(result.buildingSiteManagement).toBe(exp.aggregate.buildingSiteManagement);
  });
});

describe('Integration: O&M and totals', () => {
  it('energyConsumed', () => {
    expectCurrency(result.energyConsumed, exp.aggregate.energyConsumed);
  });

  it('energyProduced', () => {
    expectCurrency(result.energyProduced, exp.aggregate.energyProduced);
  });

  it('maintenanceAtRefPeriod', () => {
    expectCurrency(
      result.maintenanceAtRefPeriod,
      exp.aggregate.maintenanceAtRefPeriod,
    );
  });

  it('operationAndMaintenance', () => {
    expectCurrency(
      result.operationAndMaintenance,
      exp.aggregate.operationAndMaintenance,
    );
  });

  it('lcc', () => {
    expectCurrency(result.lcc, exp.aggregate.lcc);
  });

  it('wlc', () => {
    expectCurrency(result.wlc, exp.aggregate.wlc);
  });

  it('LCC identity holds after rounding', () => {
    const computed =
      result.designCosts +
      result.totalConstruction +
      result.operationAndMaintenance +
      result.buildingSiteManagement;
    expectCurrency(result.lcc, computed);
  });
});

describe('Integration: residual value', () => {
  it('residualValue', () => {
    expectCurrency(result.residualValue, exp.residual.totalResidualValue);
  });

  it('lccNetResidual', () => {
    expectCurrency(result.lccNetResidual, exp.residual.lccNetResidual);
  });
});

describe('Integration: income analysis', () => {
  it('income is not null', () => {
    expect(result.income).not.toBeNull();
  });

  it('netAnnualIncome', () => {
    expectCurrency(result.income!.netAnnualIncome, exp.income.netAnnualIncome);
  });

  it('simplePaybackYears', () => {
    expectRate(
      result.income!.simplePaybackYears!,
      exp.income.simplePaybackYears,
    );
  });

  it('npvIncomeStream', () => {
    expectCurrency(result.income!.npvIncomeStream, exp.income.npvIncomeStream);
  });

  it('netPresentValue', () => {
    expectCurrency(result.income!.netPresentValue, exp.income.netPresentValue);
  });
});

describe('Integration: KPIs', () => {
  const expKpi = exp.kpis;

  it('kpiDesignOverLCC', () => {
    expectRate(result.kpiDesignOverLCC!, expKpi.kpiDesignOverLCC);
  });

  it('kpiConstructionOverLCC', () => {
    expectRate(result.kpiConstructionOverLCC!, expKpi.kpiConstructionOverLCC);
  });

  it('kpiLaborOverLCC', () => {
    expectRate(result.kpiLaborOverLCC!, expKpi.kpiLaborOverLCC);
  });

  it('kpiOMOverLCC', () => {
    expectRate(result.kpiOMOverLCC!, expKpi.kpiOMOverLCC);
  });

  it('kpiLCCPerM2', () => {
    expectCurrency(result.kpiLCCPerM2!, expKpi.kpiLCCPerM2);
  });

  it('kpiWLCPerM2', () => {
    expectCurrency(result.kpiWLCPerM2!, expKpi.kpiWLCPerM2);
  });
});

describe('Integration: time series arrays', () => {
  it('all arrays have length referencePeriod + 1', () => {
    expect(result.heatingCosts.nominal).toHaveLength(41);
    expect(result.coolingCosts.nominal).toHaveLength(41);
    expect(result.householdCosts.nominal).toHaveLength(41);
    expect(result.pvProduction.nominal).toHaveLength(41);
    expect(result.maintenanceElements).toHaveLength(41);
    expect(result.maintenanceServices).toHaveLength(41);
    expect(result.maintenanceTotal).toHaveLength(41);
    expect(result.maintenanceCumulated).toHaveLength(41);
  });

  it('heating costs spot check year 1', () => {
    // Use precision 1 (±0.05) because calculateLCC rounds output to 2dp,
    // which can create exactly 0.005 diff that fails toBeCloseTo(x, 2)
    expect(result.heatingCosts.nominal[1]).toBeCloseTo(exp.energy.heating.nominalYear1, 1);
  });
});
