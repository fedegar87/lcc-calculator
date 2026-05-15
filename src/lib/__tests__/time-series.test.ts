import { describe, expect, it } from "vitest";
import { calculateLCC } from "@/engine";
import {
  buildCostEvolutionRows,
  getAnalysisYears,
} from "@/lib/results/time-series";
import { BUGFIXED_CONFIG, baseInput } from "../../../tests/engine/helpers";

describe("results time-series presentation helpers", () => {
  it("reports analysis years as referencePeriod, not array length", () => {
    const result = calculateLCC(baseInput(), BUGFIXED_CONFIG);

    expect(result.heatingCosts.cumulated).toHaveLength(41);
    expect(getAnalysisYears(result)).toBe(40);
  });

  it("builds cost-evolution rows for years 1..N and omits year zero", () => {
    const result = calculateLCC(baseInput(), BUGFIXED_CONFIG);
    const rows = buildCostEvolutionRows(result);

    expect(rows).toHaveLength(40);
    expect(rows[0].year).toBe(1);
    expect(rows.at(-1)?.year).toBe(40);
  });

  it("uses the same convention for a 50-year reference period", () => {
    const input = baseInput();
    input.referencePeriod = 50;
    const result = calculateLCC(input, BUGFIXED_CONFIG);

    expect(result.heatingCosts.cumulated).toHaveLength(51);
    expect(getAnalysisYears(result)).toBe(50);
    expect(buildCostEvolutionRows(result)).toHaveLength(50);
  });
});
