// FIN-001, FIN-002: Financial discount calculations

import type { FormulaMode } from './types';

/**
 * FIN-001: Real interest rate.
 * excel_replica follows the workbook denominator `1 + Ri/100`.
 * excel_bugfixed uses the textbook Fisher denominator `1 + Ri`.
 */
export function computeRealInterestRate(
  nominalRate: number,
  inflationRate: number,
  formulaMode: FormulaMode = 'excel_bugfixed',
): number {
  if (formulaMode === 'excel_replica') {
    return (nominalRate - inflationRate) / (1 + inflationRate / 100);
  }

  return (nominalRate - inflationRate) / (1 + inflationRate);
}

/**
 * FIN-002: Discount factor array for years 0..N.
 * df[0] = 1.0, df[year] = 1 / (1 + RR)^year
 * Excel: Calc!D8 = (1/(1+PI!$D$125))^D7
 */
export function computeDiscountFactors(
  realRate: number,
  referencePeriod: number,
): number[] {
  const factors = new Array<number>(referencePeriod + 1);
  factors[0] = 1.0;
  for (let year = 1; year <= referencePeriod; year++) {
    factors[year] = 1 / Math.pow(1 + realRate, year);
  }
  return factors;
}
