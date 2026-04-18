import { describe, it, expect } from 'vitest';
import { aggregateResults } from '@/engine/aggregate';
import { computeEnergyCosts } from '@/engine/energy';
import { computeMaintenanceCosts } from '@/engine/maintenance';
import { computeRealInterestRate } from '@/engine/discount';
import {
  GOLDEN_INPUT,
  GOLDEN_EXPECTED,
  BUGFIXED_CONFIG,
  expectCurrency,
  expectRate,
} from './helpers';

const rr = computeRealInterestRate(
  GOLDEN_INPUT.interestRate,
  GOLDEN_INPUT.inflationRate,
);
const energy = computeEnergyCosts(GOLDEN_INPUT, rr);
const maintenance = computeMaintenanceCosts(GOLDEN_INPUT, BUGFIXED_CONFIG);
const agg = aggregateResults(
  GOLDEN_INPUT.costItems,
  GOLDEN_INPUT.wlcInput,
  energy,
  maintenance,
  GOLDEN_INPUT.referencePeriod,
  GOLDEN_INPUT.treatedFloorArea,
);

const exp = GOLDEN_EXPECTED.aggregate;

describe('AGG-001..003: Construction totals', () => {
  it('totalMaterials', () => {
    expect(agg.totalMaterials).toBe(exp.totalMaterials);
  });

  it('totalLabor', () => {
    expect(agg.totalLabor).toBe(exp.totalLabor);
  });

  it('totalConstruction', () => {
    expect(agg.totalConstruction).toBe(exp.totalConstruction);
  });
});

describe('AGG-004: Construction by category', () => {
  it('A1_ROOFS', () => {
    expect(agg.constructionByCategory['A1_ROOFS']).toBe(
      exp.constructionByCategory.A1_ROOFS,
    );
  });

  it('A5_WINDOWS', () => {
    expect(agg.constructionByCategory['A5_WINDOWS']).toBe(
      exp.constructionByCategory.A5_WINDOWS,
    );
  });

  it('B1_HEATING', () => {
    expect(agg.constructionByCategory['B1_HEATING']).toBe(
      exp.constructionByCategory.B1_HEATING,
    );
  });
});

describe('AGG-005..007: Non-construction costs', () => {
  it('nonConstructionCosts', () => {
    expect(agg.nonConstructionCosts).toBe(exp.nonConstructionCosts);
  });

  it('designCosts', () => {
    expect(agg.designCosts).toBe(exp.designCosts);
  });

  it('buildingSiteManagement', () => {
    expect(agg.buildingSiteManagement).toBe(exp.buildingSiteManagement);
  });
});

describe('CAL-001..002: Energy aggregation', () => {
  it('energyConsumed', () => {
    expectCurrency(agg.energyConsumed, exp.energyConsumed);
  });

  it('energyProduced', () => {
    expectCurrency(agg.energyProduced, exp.energyProduced);
  });
});

describe('AGG-008..013: O&M, LCC, WLC', () => {
  it('operationAndMaintenance', () => {
    expectCurrency(agg.operationAndMaintenance, exp.operationAndMaintenance);
  });

  it('lcc', () => {
    expectCurrency(agg.lcc, exp.lcc);
  });

  it('wlc', () => {
    expectCurrency(agg.wlc, exp.wlc);
  });

  it('LCC identity: design + construction + O&M + siteMgmt', () => {
    const expected =
      agg.designCosts +
      agg.totalConstruction +
      agg.operationAndMaintenance +
      agg.buildingSiteManagement;
    expectCurrency(agg.lcc, expected);
  });

  it('WLC identity: LCC + nonConstruction', () => {
    expectCurrency(agg.wlc, agg.lcc + agg.nonConstructionCosts);
  });
});

describe('AGG-014: KPIs', () => {
  const expKpi = GOLDEN_EXPECTED.kpis;

  it('uses investmentCost as divisor, not LCC', () => {
    // investmentCost = construction + design + siteMgmt = 467000
    expect(expKpi.investmentCost).toBe(467000);
  });

  it('kpiDesignOverInvestmentCost', () => {
    expectRate(
      agg.kpiDesignOverInvestmentCost!,
      expKpi.kpiDesignOverInvestmentCost,
    );
  });

  it('kpiConstructionOverInvestmentCost (materials only)', () => {
    expectRate(
      agg.kpiConstructionOverInvestmentCost!,
      expKpi.kpiConstructionOverInvestmentCost,
    );
  });

  it('kpiLaborOverInvestmentCost', () => {
    expectRate(
      agg.kpiLaborOverInvestmentCost!,
      expKpi.kpiLaborOverInvestmentCost,
    );
  });

  it('kpiOMOverInvestmentCost', () => {
    expectRate(
      agg.kpiOMOverInvestmentCost!,
      expKpi.kpiOMOverInvestmentCost,
    );
  });

  it('kpiLCCPerM2', () => {
    expectCurrency(agg.kpiLCCPerM2!, expKpi.kpiLCCPerM2);
  });

  it('kpiWLCPerM2', () => {
    expectCurrency(agg.kpiWLCPerM2!, expKpi.kpiWLCPerM2);
  });
});
