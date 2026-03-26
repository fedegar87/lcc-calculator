// FIN-001, FIN-002: Financial discount calculations

/**
 * FIN-001: Simplified Fisher formula for real interest rate.
 * RR = (Rint - Rinf) / (1 + Rinf)
 * Excel: PI!D125 = (D121-D123)/(1+(D123/100)) (basis points in Excel, decimals here per DEC-009)
 */
export function computeRealInterestRate(
  nominalRate: number,
  inflationRate: number,
): number {
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
