// INC-001 through INC-003: Income analysis (METHOD_IMPROVEMENT)

import type { IncomeInputData } from './types';
import { computeDiscountFactors } from './discount';

export interface IncomeResult {
  netAnnualIncome: number;
  simplePaybackYears: number | null;
  npvIncomeStream: number;
  netPresentValue: number;
}

/**
 * INC-001..003: Compute income analysis from rent and other income sources.
 * Returns null if no income data provided.
 */
export function computeIncome(
  incomeInput: IncomeInputData | undefined,
  lcc: number,
  referencePeriod: number,
  realRate: number,
): IncomeResult | null {
  if (!incomeInput) return null;

  // INC-001: Net annual income
  const rentIncome = incomeInput.rents.reduce(
    (sum, r) => sum + r.monthlyPerM2 * r.area * 12 - r.taxes,
    0,
  );
  const otherIncome = incomeInput.otherIncomes.reduce(
    (sum, o) => sum + o.amount - o.taxes,
    0,
  );
  const netAnnualIncome = rentIncome + otherIncome;

  // INC-002: Simple payback - null if income is zero or negative
  const simplePaybackYears =
    netAnnualIncome > 0 ? lcc / netAnnualIncome : null;

  // INC-003: NPV of income stream discounted by real rate
  let npvIncomeStream = 0;
  const discountFactors = computeDiscountFactors(realRate, referencePeriod);
  for (let year = 1; year <= referencePeriod; year++) {
    npvIncomeStream += netAnnualIncome * discountFactors[year];
  }
  const netPresentValue = npvIncomeStream - lcc;

  return {
    netAnnualIncome,
    simplePaybackYears,
    npvIncomeStream,
    netPresentValue,
  };
}
