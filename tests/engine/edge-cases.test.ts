import { describe, it, expect } from 'vitest';
import { calculateLCC } from '@/engine';
import { inputWith, baseInput, BUGFIXED_CONFIG } from './helpers';

describe('Edge case: treatedFloorArea = 0', () => {
  const result = calculateLCC(
    inputWith({ treatedFloorArea: 0 }),
    BUGFIXED_CONFIG,
  );

  it('per-m2 KPIs are null', () => {
    expect(result.kpiLCCPerM2).toBeNull();
    expect(result.kpiWLCPerM2).toBeNull();
  });

  it('energy costs are 0 (consumption * 0 area)', () => {
    expect(result.heatingCosts.cumulated[40]).toBe(0);
    expect(result.coolingCosts.cumulated[40]).toBe(0);
  });

  it('does not crash', () => {
    expect(result.lcc).toBeDefined();
  });
});

describe('Edge case: referencePeriod = 1', () => {
  const result = calculateLCC(
    inputWith({ referencePeriod: 1 }),
    BUGFIXED_CONFIG,
  );

  it('arrays have length 2', () => {
    expect(result.heatingCosts.nominal).toHaveLength(2);
    expect(result.maintenanceElements).toHaveLength(2);
  });

  it('LCC is non-negative', () => {
    expect(result.lcc).toBeGreaterThanOrEqual(0);
  });
});

describe('Edge case: no energy inputs', () => {
  const result = calculateLCC(
    inputWith({ energyInputs: [] }),
    BUGFIXED_CONFIG,
  );

  it('energy consumed is 0', () => {
    expect(result.energyConsumed).toBe(0);
  });

  it('energy produced is 0', () => {
    expect(result.energyProduced).toBe(0);
  });

  it('heating costs are all zeros', () => {
    expect(result.heatingCosts.nominal[1]).toBe(0);
  });

  it('LCC still computes (construction + maintenance)', () => {
    expect(result.lcc).toBeGreaterThan(0);
  });
});

describe('Edge case: no service components', () => {
  const result = calculateLCC(
    inputWith({ serviceComponents: [] }),
    BUGFIXED_CONFIG,
  );

  it('service maintenance is all zeros', () => {
    expect(result.maintenanceServices[1]).toBe(0);
    expect(result.maintenanceServices[10]).toBe(0);
  });

  it('residual value is 0', () => {
    expect(result.residualValue).toBe(0);
  });

  it('element maintenance still works', () => {
    expect(result.maintenanceElements[1]).toBeGreaterThan(0);
  });
});

describe('Edge case: no income data', () => {
  it('income is null when incomeInput missing', () => {
    const input = baseInput();
    delete (input as Record<string, unknown>).incomeInput;
    const result = calculateLCC(input, BUGFIXED_CONFIG);
    expect(result.income).toBeNull();
  });
});

describe('Edge case: all-zero costs', () => {
  const result = calculateLCC(
    inputWith({
      costItems: [],
      serviceComponents: [],
      energyInputs: [],
      designCosts: [],
      buildingElementMaintenancePercent: 0,
      wlcInput: {
        landCost: 0,
        enablingCosts: 0,
        planningFees: 0,
        userSupportPropMgmt: 0,
        userSupportCharges: 0,
        userSupportAdmin: 0,
        financeCost: 0,
        designCostsTotal: 0,
        siteManagementCostsTotal: 0,
      },
    }),
    BUGFIXED_CONFIG,
  );

  it('LCC is 0', () => {
    expect(result.lcc).toBe(0);
  });

  it('WLC is 0', () => {
    expect(result.wlc).toBe(0);
  });

  it('totalConstruction is 0', () => {
    expect(result.totalConstruction).toBe(0);
  });

  it('KPI ratios are null (investmentCost = 0)', () => {
    expect(result.kpiDesignOverLCC).toBeNull();
    expect(result.kpiConstructionOverLCC).toBeNull();
    expect(result.kpiLaborOverLCC).toBeNull();
    expect(result.kpiOMOverLCC).toBeNull();
  });
});
