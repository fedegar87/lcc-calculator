import { describe, expect, it } from 'vitest';
import { calculateLCC } from '../../index';
import type { VariantInput } from '../../types';
import {
  DEFAULT_PARAMETER_REGISTRY,
  categoryTotal,
  cloneInput,
  listApplicableParameters,
} from '../parameters';
import { perturb } from '../perturbation';

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
      { endUse: 'COOLING_1', energySourceIndex: 12, specificConsumption: 8 },
      { endUse: 'DHW_1', energySourceIndex: 12, specificConsumption: 15 },
      { endUse: 'HOUSEHOLD_ELECTRICITY', energySourceIndex: 12, specificConsumption: 25 },
    ],
    costItems: [
      { category: 'A1_ROOFS', materialCost: 40_000, laborCost: 20_000, otherCost: 0 },
      { category: 'A2_FACADES', materialCost: 120_000, laborCost: 50_000, otherCost: 0 },
      { category: 'A3_FLOORS', materialCost: 30_000, laborCost: 15_000, otherCost: 0 },
      { category: 'A5_WINDOWS', materialCost: 90_000, laborCost: 30_000, otherCost: 0 },
      { category: 'A9_STRUCTURE', materialCost: 500_000, laborCost: 200_000, otherCost: 0 },
      { category: 'B1_HEATING', materialCost: 35_000, laborCost: 15_000, otherCost: 0 },
    ],
    serviceComponents: [
      { name: 'Heat pump', constructionCost: 40_000, en15459ComponentIndex: 22 },
      { name: 'MVHR', constructionCost: 20_000, en15459ComponentIndex: 35 },
      { name: 'PV', constructionCost: 25_000, en15459ComponentIndex: 60 },
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

describe('parameter registry', () => {
  it('every spec produces identity when applied with its baseline value', () => {
    const input = fixture();
    const baseline = calculateLCC(input);
    for (const spec of DEFAULT_PARAMETER_REGISTRY) {
      if (!spec.applicable(input)) continue;
      const b = spec.baseline(input);
      const perturbed = perturb(input, [{ spec, value: b }]);
      const result = calculateLCC(perturbed);
      expect(result.lcc).toBeCloseTo(baseline.lcc, 4);
      expect(result.wlc).toBeCloseTo(baseline.wlc, 4);
    }
  });

  it('cloneInput returns a deep enough copy (mutating clone does not affect original)', () => {
    const input = fixture();
    const cloned = cloneInput(input);
    cloned.costItems[0].materialCost = 999_999;
    cloned.serviceComponents[0].constructionCost = 999_999;
    cloned.energyPrices[0].pricePerKwh = 9;
    cloned.wlcInput.landCost = 1;
    expect(input.costItems[0].materialCost).toBe(40_000);
    expect(input.serviceComponents[0].constructionCost).toBe(40_000);
    expect(input.energyPrices[0].pricePerKwh).toBe(0.2);
    expect(input.wlcInput.landCost).toBe(200_000);
  });

  it('costItems.A9_STRUCTURE.totalCost lens scales material+labor proportionally', () => {
    const input = fixture();
    const spec = DEFAULT_PARAMETER_REGISTRY.find(
      (p) => p.id === 'costItems.A9_STRUCTURE.totalCost',
    )!;
    const baseTotal = spec.baseline(input);
    expect(baseTotal).toBe(700_000);
    const next = spec.apply(input, baseTotal * 1.1);
    expect(categoryTotal(next.costItems, 'A9_STRUCTURE')).toBeCloseTo(770_000, 4);
    const structItem = next.costItems.find((c) => c.category === 'A9_STRUCTURE')!;
    expect(structItem.materialCost).toBeCloseTo(550_000, 4);
    expect(structItem.laborCost).toBeCloseTo(220_000, 4);
  });

  it('HVAC maintenance multiplier writes maintenancePctOverride on every service', () => {
    const input = fixture();
    const spec = DEFAULT_PARAMETER_REGISTRY.find(
      (p) => p.id === 'service.hvac.maintenancePctMultiplier',
    )!;
    const next = spec.apply(input, 1.5);
    for (const sc of next.serviceComponents) {
      expect(sc.maintenancePctOverride).toBeDefined();
      expect(sc.maintenancePctOverride!).toBeGreaterThan(0);
    }
  });

  it('listApplicableParameters filters by per-input applicability', () => {
    const input = fixture();
    const applicable = listApplicableParameters(input);
    expect(applicable.length).toBeGreaterThan(0);

    const empty = { ...cloneInput(input), serviceComponents: [], costItems: [] };
    const noneApplicable = listApplicableParameters(empty);
    expect(noneApplicable.some((p) => p.id === 'service.hvac.maintenancePctMultiplier')).toBe(false);
    expect(noneApplicable.some((p) => p.id.startsWith('costItems.'))).toBe(false);
  });
});
