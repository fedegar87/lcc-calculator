import { describe, it, expect } from 'vitest';
import { computeRealInterestRate, computeDiscountFactors } from '@/engine/discount';
import { GOLDEN_INPUT, GOLDEN_EXPECTED, expectRate } from './helpers';

describe('FIN-001: Real interest rate', () => {
  it('computes simplified Fisher formula', () => {
    const rr = computeRealInterestRate(
      GOLDEN_INPUT.interestRate,
      GOLDEN_INPUT.inflationRate,
    );
    expectRate(rr, GOLDEN_EXPECTED.realInterestRate);
  });

  it('returns 0 when rates are equal', () => {
    expect(computeRealInterestRate(0.02, 0.02)).toBeCloseTo(0, 10);
  });

  it('handles zero inflation', () => {
    const rr = computeRealInterestRate(0.03, 0);
    expect(rr).toBeCloseTo(0.03, 10);
  });
});

describe('FIN-002: Discount factors', () => {
  const rr = computeRealInterestRate(
    GOLDEN_INPUT.interestRate,
    GOLDEN_INPUT.inflationRate,
  );
  const df = computeDiscountFactors(rr, GOLDEN_INPUT.referencePeriod);

  it('has correct array length', () => {
    expect(df).toHaveLength(GOLDEN_INPUT.referencePeriod + 1);
  });

  it('year 0 is exactly 1.0', () => {
    expect(df[0]).toBe(1.0);
  });

  it('matches golden values at key years', () => {
    const expected = GOLDEN_EXPECTED.discountFactors;
    expectRate(df[1], expected.year1);
    expectRate(df[5], expected.year5);
    expectRate(df[10], expected.year10);
    expectRate(df[15], expected.year15);
    expectRate(df[20], expected.year20);
    expectRate(df[30], expected.year30);
    expectRate(df[40], expected.year40);
  });

  it('factors are monotonically decreasing', () => {
    for (let i = 1; i < df.length; i++) {
      expect(df[i]).toBeLessThan(df[i - 1]);
    }
  });
});
