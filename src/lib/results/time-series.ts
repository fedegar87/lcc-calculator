import type { LCCResult } from "@/engine/types";

export interface CostEvolutionRow {
  year: number;
  Energy: number;
  Maintenance: number;
  "Total O&M": number;
}

export function getAnalysisYears(result: LCCResult): number {
  return Math.max(0, result.heatingCosts.cumulated.length - 1);
}

export function buildCostEvolutionRows(result: LCCResult): CostEvolutionRow[] {
  const analysisYears = getAnalysisYears(result);
  const rows: CostEvolutionRow[] = [];

  for (let year = 1; year <= analysisYears; year++) {
    const energyCumulated =
      result.heatingCosts.cumulated[year] +
      result.coolingCosts.cumulated[year] +
      result.dhwCosts.cumulated[year] +
      result.householdCosts.cumulated[year] -
      result.pvProduction.cumulated[year];

    const maintenanceCumulated = result.maintenanceCumulated[year];

    rows.push({
      year,
      Energy: energyCumulated,
      Maintenance: maintenanceCumulated,
      "Total O&M": energyCumulated + maintenanceCumulated,
    });
  }

  return rows;
}
