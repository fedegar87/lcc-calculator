import { describe, it, expect } from 'vitest';
import { computeResidualValue } from '@/engine/residual';
import { computeRealInterestRate } from '@/engine/discount';
import { GOLDEN_INPUT, GOLDEN_EXPECTED, expectCurrency } from './helpers';

const rr = computeRealInterestRate(
  GOLDEN_INPUT.interestRate,
  GOLDEN_INPUT.inflationRate,
);
const result = computeResidualValue(
  GOLDEN_INPUT.serviceComponents,
  GOLDEN_INPUT.referencePeriod,
  rr,
);
const exp = GOLDEN_EXPECTED.residual;

describe('RES-001: Residual value', () => {
  it('total residual value', () => {
    expectCurrency(result.totalResidualValue, exp.totalResidualValue);
  });

  it('has 2 component residuals', () => {
    expect(result.componentResiduals).toHaveLength(2);
  });

  it('heat pump: full residual (lifespan=20, 40%20=0, fraction=1.0)', () => {
    expectCurrency(result.componentResiduals[0].residual, exp.heatPumpResidual);
  });

  it('ventilation: partial residual (lifespan=15, 40%15=10, fraction=1/3)', () => {
    expectCurrency(
      result.componentResiduals[1].residual,
      exp.ventilationResidual,
    );
  });

  it('lccNetResidual computation', () => {
    const lcc = GOLDEN_EXPECTED.aggregate.lcc;
    expectCurrency(lcc - result.totalResidualValue, exp.lccNetResidual);
  });
});

describe('RES-001 edge: empty components', () => {
  it('returns 0 for empty array', () => {
    const empty = computeResidualValue([], 40, rr);
    expect(empty.totalResidualValue).toBe(0);
    expect(empty.componentResiduals).toHaveLength(0);
  });
});
