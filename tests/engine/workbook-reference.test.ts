import { describe, it, expect } from 'vitest';
import { calculateLCC } from '@/engine';
import { computeDiscountFactors, computeRealInterestRate } from '@/engine/discount';
import type { VariantInput } from '@/engine/types';
import workbookFixture from '../fixtures/excel-reference.json';
import { EXCEL_REPLICA_CONFIG } from './helpers';

const fixture = workbookFixture as {
  meta: {
    workbook: string;
    generatedBy: string;
  };
  input: VariantInput;
  expected: {
    realInterestRate: number;
    discountFactors: {
      year0: number;
      year1: number;
      year2: number;
      year40: number;
    };
    aggregate: {
      totalConstruction: number;
      nonConstructionCosts: number;
      designCosts: number;
      buildingSiteManagement: number;
      energyConsumed: number;
      energyProduced: number;
      maintenanceAtRefPeriod: number;
      operationAndMaintenance: number;
      lcc: number;
      wlc: number;
    };
  };
};

describe('Workbook-backed parity fixture', () => {
  it('tracks workbook provenance explicitly', () => {
    expect(fixture.meta.workbook).toBe(
      'CRAVEzero/200512_LCC_tool_beta_v2.xlsm',
    );
    expect(fixture.meta.generatedBy).toBe(
      'scripts/generate-excel-reference-fixture.py',
    );
  });

  it('matches the workbook real interest rate and discount factors in replica mode', () => {
    const rr = computeRealInterestRate(
      fixture.input.interestRate,
      fixture.input.inflationRate,
      'excel_replica',
    );
    const factors = computeDiscountFactors(rr, fixture.input.referencePeriod);

    expect(rr).toBeCloseTo(fixture.expected.realInterestRate, 12);
    expect(factors[0]).toBeCloseTo(fixture.expected.discountFactors.year0, 12);
    expect(factors[1]).toBeCloseTo(fixture.expected.discountFactors.year1, 12);
    expect(factors[2]).toBeCloseTo(fixture.expected.discountFactors.year2, 12);
    expect(factors[40]).toBeCloseTo(
      fixture.expected.discountFactors.year40,
      12,
    );
  });

  it('matches the cached zero-total workbook outputs for the base template', () => {
    const result = calculateLCC(fixture.input, EXCEL_REPLICA_CONFIG);

    expect(result.totalConstruction).toBe(
      fixture.expected.aggregate.totalConstruction,
    );
    expect(result.nonConstructionCosts).toBe(
      fixture.expected.aggregate.nonConstructionCosts,
    );
    expect(result.designCosts).toBe(fixture.expected.aggregate.designCosts);
    expect(result.buildingSiteManagement).toBe(
      fixture.expected.aggregate.buildingSiteManagement,
    );
    expect(result.energyConsumed).toBe(fixture.expected.aggregate.energyConsumed);
    expect(result.energyProduced).toBe(fixture.expected.aggregate.energyProduced);
    expect(result.maintenanceAtRefPeriod).toBe(
      fixture.expected.aggregate.maintenanceAtRefPeriod,
    );
    expect(result.operationAndMaintenance).toBe(
      fixture.expected.aggregate.operationAndMaintenance,
    );
    expect(result.lcc).toBe(fixture.expected.aggregate.lcc);
    expect(result.wlc).toBe(fixture.expected.aggregate.wlc);
  });
});
