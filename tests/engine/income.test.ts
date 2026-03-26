import { describe, it, expect } from 'vitest';
import { computeIncome } from '@/engine/income';
import { computeRealInterestRate } from '@/engine/discount';
import { GOLDEN_INPUT, GOLDEN_EXPECTED, expectCurrency, expectRate } from './helpers';

const rr = computeRealInterestRate(
  GOLDEN_INPUT.interestRate,
  GOLDEN_INPUT.inflationRate,
);
const lcc = GOLDEN_EXPECTED.aggregate.lcc;
const exp = GOLDEN_EXPECTED.income;

describe('INC-001: Net annual income', () => {
  const result = computeIncome(GOLDEN_INPUT.incomeInput, lcc, 40, rr);

  it('computes net annual income', () => {
    expect(result).not.toBeNull();
    expectCurrency(result!.netAnnualIncome, exp.netAnnualIncome);
  });

  it('rent: 8 * 1200 * 12 - 2400 = 112800', () => {
    expect(result!.netAnnualIncome).toBeCloseTo(118000, 0);
  });
});

describe('INC-002: Simple payback', () => {
  const result = computeIncome(GOLDEN_INPUT.incomeInput, lcc, 40, rr);

  it('computes payback years', () => {
    expectRate(result!.simplePaybackYears!, exp.simplePaybackYears);
  });

  it('returns null for zero income', () => {
    const zeroIncome = computeIncome(
      { rents: [], otherIncomes: [] },
      lcc,
      40,
      rr,
    );
    expect(zeroIncome!.simplePaybackYears).toBeNull();
  });

  it('returns null for negative income', () => {
    const negIncome = computeIncome(
      { rents: [{ monthlyPerM2: 1, area: 10, taxes: 99999 }], otherIncomes: [] },
      lcc,
      40,
      rr,
    );
    expect(negIncome!.simplePaybackYears).toBeNull();
  });
});

describe('INC-003: NPV income stream', () => {
  const result = computeIncome(GOLDEN_INPUT.incomeInput, lcc, 40, rr);

  it('npvIncomeStream', () => {
    expectCurrency(result!.npvIncomeStream, exp.npvIncomeStream);
  });

  it('netPresentValue = npvIncomeStream - lcc', () => {
    expectCurrency(result!.netPresentValue, exp.netPresentValue);
  });
});

describe('Income: no input', () => {
  it('returns null when incomeInput is undefined', () => {
    const result = computeIncome(undefined, lcc, 40, rr);
    expect(result).toBeNull();
  });
});
