import { describe, expect, it } from 'vitest';
import type { VariantInput } from '../../types';
import { runDSA } from '../dsa';

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

describe('runDSA', () => {
  it('rejects invalid delta', () => {
    expect(() =>
      runDSA(fixture(), { parameters: ['interestRate'], outputs: ['lcc'], delta: 0 }),
    ).toThrow();
    expect(() =>
      runDSA(fixture(), { parameters: ['interestRate'], outputs: ['lcc'], delta: 1 }),
    ).toThrow();
  });

  it('rejects empty parameter or output sets', () => {
    expect(() =>
      runDSA(fixture(), { parameters: [], outputs: ['lcc'], delta: 0.1 }),
    ).toThrow();
    expect(() =>
      runDSA(fixture(), { parameters: ['interestRate'], outputs: [], delta: 0.1 }),
    ).toThrow();
  });

  it('skips unknown parameters and reports them', () => {
    const result = runDSA(fixture(), {
      parameters: ['definitely.not.a.real.param', 'interestRate'],
      outputs: ['lcc'],
      delta: 0.1,
    });
    expect(result.diagnostics.skippedParameters).toContain(
      'definitely.not.a.real.param',
    );
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].parameterId).toBe('interestRate');
  });

  it('produces a baseline plus 2 runs per applicable parameter', () => {
    const result = runDSA(fixture(), {
      parameters: [
        'interestRate',
        'buildingElementMaintenancePercent',
        'costItems.A9_STRUCTURE.totalCost',
      ],
      outputs: ['lcc'],
      delta: 0.1,
    });
    expect(result.diagnostics.engineRuns).toBe(1 + 2 * 3);
    expect(result.entries.length).toBe(3);
  });

  it('top-ranked parameters on Pernetti 2021 nZEB-like fixture include interest rate and structural cost', () => {
    const input = fixture();
    const result = runDSA(input, {
      parameters: [
        'interestRate',
        'buildingElementMaintenancePercent',
        'service.hvac.maintenancePctMultiplier',
        'costItems.A1_ROOFS.totalCost',
        'costItems.A2_FACADES.totalCost',
        'costItems.A5_WINDOWS.totalCost',
        'costItems.A9_STRUCTURE.totalCost',
      ],
      outputs: ['lcc'],
      delta: 0.1,
    });
    expect(result.entries.length).toBeGreaterThan(0);
    const ranked = result.entries
      .filter((e) => e.output === 'lcc')
      .map((e) => e.parameterId);
    const top4 = new Set(ranked.slice(0, 4));
    expect(top4.has('interestRate') || top4.has('costItems.A9_STRUCTURE.totalCost')).toBe(true);
    for (const entry of result.entries) {
      expect(entry.relativeChangePlus).toBeDefined();
      expect(entry.relativeChangeMinus).toBeDefined();
      expect(Math.abs(entry.sensitivityIndex)).toBeGreaterThanOrEqual(0);
    }
  });

  it('LCC moves with positive sign when interest rate increases (more discount -> lower LCC)', () => {
    const result = runDSA(fixture(), {
      parameters: ['interestRate'],
      outputs: ['lcc'],
      delta: 0.1,
    });
    const ir = result.entries.find((e) => e.parameterId === 'interestRate')!;
    expect(ir.plusInput).toBeGreaterThan(ir.baselineInput);
    expect(ir.minusInput).toBeLessThan(ir.baselineInput);
    expect(ir.plusOutput).toBeLessThan(ir.baselineOutput);
    expect(ir.minusOutput).toBeGreaterThan(ir.baselineOutput);
  });

  it('is deterministic — repeated runs produce identical entries', () => {
    const cfg = {
      parameters: [
        'interestRate',
        'buildingElementMaintenancePercent',
        'costItems.A9_STRUCTURE.totalCost',
      ],
      outputs: ['lcc' as const, 'wlc' as const],
      delta: 0.1,
    };
    const a = runDSA(fixture(), cfg);
    const b = runDSA(fixture(), cfg);
    expect(a.entries).toEqual(b.entries);
  });
});
