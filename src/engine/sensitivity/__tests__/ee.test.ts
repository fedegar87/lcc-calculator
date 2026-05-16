import { describe, expect, it } from 'vitest';
import type { VariantInput } from '../../types';
import { runEE } from '../ee';

function fixture(): VariantInput {
  return {
    referencePeriod: 40,
    interestRate: 0.0151,
    inflationRate: 0.0056,
    treatedFloorArea: 1000,
    energyPrices: [
      { index: 12, name: 'Electricity', pricePerKwh: 0.2, annualIncrease: 0.01 },
      { index: 13, name: 'PV self-consumption', pricePerKwh: 0.2, annualIncrease: 0 },
    ],
    energyInputs: [
      { endUse: 'HEATING_1', energySourceIndex: 12, specificConsumption: 30 },
      { endUse: 'HOUSEHOLD_ELECTRICITY', energySourceIndex: 12, specificConsumption: 25 },
    ],
    costItems: [
      { category: 'A1_ROOFS', materialCost: 40_000, laborCost: 20_000, otherCost: 0 },
      { category: 'A2_FACADES', materialCost: 120_000, laborCost: 50_000, otherCost: 0 },
      { category: 'A5_WINDOWS', materialCost: 90_000, laborCost: 30_000, otherCost: 0 },
      { category: 'A9_STRUCTURE', materialCost: 500_000, laborCost: 200_000, otherCost: 0 },
      { category: 'B1_HEATING', materialCost: 35_000, laborCost: 15_000, otherCost: 0 },
    ],
    serviceComponents: [
      { name: 'Heat pump', constructionCost: 40_000, en15459ComponentIndex: 22 },
      { name: 'MVHR', constructionCost: 20_000, en15459ComponentIndex: 35 },
    ],
    buildingElementMaintenancePercent: 0.015,
    wlcInput: {
      landCost: 200_000,
      enablingCosts: 10_000,
      planningFees: 5_000,
      userSupportPropMgmt: 0,
      userSupportCharges: 0,
      userSupportAdmin: 0,
      financeCost: 0,
      designCostsTotal: 50_000,
      siteManagementCostsTotal: 20_000,
    },
    designCosts: [],
  };
}

const defaultConfig = {
  parameters: [
    'interestRate',
    'buildingElementMaintenancePercent',
    'service.hvac.maintenancePctMultiplier',
    'costItems.A9_STRUCTURE.totalCost',
    'costItems.A1_ROOFS.totalCost',
  ],
  outputs: ['lcc'] as const,
  r: 10,
  rCandidates: 500,
  rSamples: 50,
  p: 4,
  seed: 42,
  variationScheme: 'fixedPct' as const,
};

describe('runEE', () => {
  it('rejects fewer than 2 parameters', () => {
    expect(() =>
      runEE(fixture(), { ...defaultConfig, parameters: ['interestRate'] }),
    ).toThrow();
  });

  it('rejects r out of [4, 50]', () => {
    expect(() => runEE(fixture(), { ...defaultConfig, r: 3 })).toThrow();
    expect(() => runEE(fixture(), { ...defaultConfig, r: 51 })).toThrow();
  });

  it('rejects rCandidates < r', () => {
    expect(() =>
      runEE(fixture(), { ...defaultConfig, r: 10, rCandidates: 5 }),
    ).toThrow();
  });

  it('rejects odd p', () => {
    expect(() => runEE(fixture(), { ...defaultConfig, p: 3 })).toThrow();
  });

  it('runs paper-faithful count: 1 baseline + r·(n+1) engine calls', () => {
    const result = runEE(fixture(), defaultConfig);
    const n = defaultConfig.parameters.length;
    expect(result.diagnostics.engineRuns).toBe(1 + defaultConfig.r * (n + 1));
    expect(result.entries.length).toBe(n * defaultConfig.outputs.length);
    expect(result.distribution.length).toBe(defaultConfig.outputs.length);
    expect(result.distribution[0].samples.length).toBe(defaultConfig.r * (n + 1));
  });

  it('μ*, σ are non-negative and ranked by μ* desc', () => {
    const result = runEE(fixture(), defaultConfig);
    let prev = Infinity;
    for (const entry of result.entries) {
      expect(entry.muStar).toBeGreaterThanOrEqual(0);
      expect(entry.sigma).toBeGreaterThanOrEqual(0);
      expect(entry.muStar).toBeLessThanOrEqual(prev);
      prev = entry.muStar;
    }
  });

  it('μ* for interest rate is among the top-3 (paper-faithful ranking)', () => {
    const result = runEE(fixture(), defaultConfig);
    const top3 = result.entries
      .filter((e) => e.output === 'lcc')
      .slice(0, 3)
      .map((e) => e.parameterId);
    expect(top3).toContain('interestRate');
  });

  it('distribution box-plot fields are consistent (p25 ≤ median ≤ p75 ≤ max, min ≤ p25)', () => {
    const result = runEE(fixture(), defaultConfig);
    const dist = result.distribution[0];
    expect(dist.min).toBeLessThanOrEqual(dist.p25);
    expect(dist.p25).toBeLessThanOrEqual(dist.median);
    expect(dist.median).toBeLessThanOrEqual(dist.p75);
    expect(dist.p75).toBeLessThanOrEqual(dist.max);
    expect(dist.whiskerLow).toBeGreaterThanOrEqual(dist.min);
    expect(dist.whiskerHigh).toBeLessThanOrEqual(dist.max);
  });

  it('is reproducible — same seed produces byte-identical entries', () => {
    const a = runEE(fixture(), defaultConfig);
    const b = runEE(fixture(), defaultConfig);
    expect(a.entries).toEqual(b.entries);
    expect(a.distribution[0].samples).toEqual(b.distribution[0].samples);
    expect(a.diagnostics.selectedSampleSpread).toBe(
      b.diagnostics.selectedSampleSpread,
    );
  });

  it('different seeds produce different distributions', () => {
    const a = runEE(fixture(), { ...defaultConfig, seed: 1 });
    const b = runEE(fixture(), { ...defaultConfig, seed: 2 });
    expect(a.entries).not.toEqual(b.entries);
  });

  it('literature scheme runs and produces wider distribution than fixedPct', () => {
    const fixed = runEE(fixture(), { ...defaultConfig, variationScheme: 'fixedPct' });
    const literature = runEE(fixture(), {
      ...defaultConfig,
      variationScheme: 'literature',
    });
    const fixedRange = fixed.distribution[0].max - fixed.distribution[0].min;
    const litRange = literature.distribution[0].max - literature.distribution[0].min;
    expect(litRange).toBeGreaterThan(fixedRange);
  });

  it('drops parameters not applicable to the input', () => {
    const input = { ...fixture(), serviceComponents: [] };
    const result = runEE(input, defaultConfig);
    expect(result.diagnostics.droppedParameters).toContain(
      'service.hvac.maintenancePctMultiplier',
    );
  });
});
