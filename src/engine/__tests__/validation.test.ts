import { describe, it, expect } from 'vitest';
import { validateVariantInput } from '../validation';
import type { VariantInput } from '../types';

// Valid fixture that satisfies all validation rules
function validInput(): VariantInput {
  return {
    referencePeriod: 30,
    interestRate: 0.03,
    inflationRate: 0.02,
    treatedFloorArea: 500,
    energyPrices: [
      { index: 12, name: 'National Electricity-Mix', pricePerKwh: 0.25, annualIncrease: 0.02 },
    ],
    energyInputs: [
      { endUse: 'HEATING_1', energySourceIndex: 3, specificConsumption: 50 },
    ],
    costItems: [
      { category: 'A1_ROOFS', materialCost: 10000, laborCost: 5000, otherCost: 0 },
    ],
    serviceComponents: [
      { name: 'Boiler condensing', constructionCost: 8000, en15459ComponentIndex: 6 },
    ],
    buildingElementMaintenancePercent: 0.01,
    wlcInput: {
      landCost: 100000,
      enablingCosts: 5000,
      planningFees: 3000,
      userSupportPropMgmt: 1000,
      userSupportCharges: 500,
      userSupportAdmin: 200,
      financeCost: 2000,
      designCostsTotal: 10000,
      siteManagementCostsTotal: 5000,
    },
    designCosts: [
      {
        lineNumber: 1,
        description: 'Architectural design',
        preliminaryCost: 5000,
        definitiveCost: 3000,
        executiveCost: 2000,
        siteManagementCost: 1000,
      },
    ],
  };
}

describe('validateVariantInput', () => {
  it('returns empty array for valid input', () => {
    const errors = validateVariantInput(validInput());
    expect(errors).toEqual([]);
  });

  // Reference period
  it('rejects referencePeriod <= 0', () => {
    const input = validInput();
    input.referencePeriod = 0;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('reference period'))).toBe(true);
  });

  it('rejects referencePeriod > 100', () => {
    const input = validInput();
    input.referencePeriod = 101;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('reference period'))).toBe(true);
  });

  // Interest rate
  it('rejects interestRate < -0.1', () => {
    const input = validInput();
    input.interestRate = -0.11;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('interest rate'))).toBe(true);
  });

  it('rejects interestRate > 0.5', () => {
    const input = validInput();
    input.interestRate = 0.51;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('interest rate'))).toBe(true);
  });

  // Inflation rate
  it('rejects inflationRate < -0.1', () => {
    const input = validInput();
    input.inflationRate = -0.11;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('inflation rate'))).toBe(true);
  });

  it('rejects inflationRate > 0.5', () => {
    const input = validInput();
    input.inflationRate = 0.51;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('inflation rate'))).toBe(true);
  });

  // Treated floor area
  it('rejects treatedFloorArea < 0', () => {
    const input = validInput();
    input.treatedFloorArea = -1;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('treated floor area'))).toBe(true);
  });

  it('accepts treatedFloorArea = 0 (KPIs will be null)', () => {
    const input = validInput();
    input.treatedFloorArea = 0;
    const errors = validateVariantInput(input);
    expect(errors).toEqual([]);
  });

  // Energy source index
  it('rejects energySourceIndex < 1', () => {
    const input = validInput();
    input.energyInputs = [
      { endUse: 'HEATING_1', energySourceIndex: 0, specificConsumption: 50 },
    ];
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('energy source index'))).toBe(true);
  });

  it('rejects energySourceIndex > 19', () => {
    const input = validInput();
    input.energyInputs = [
      { endUse: 'HEATING_1', energySourceIndex: 20, specificConsumption: 50 },
    ];
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('energy source index'))).toBe(true);
  });

  // Duplicate endUse
  it('rejects duplicate endUse entries', () => {
    const input = validInput();
    input.energyInputs = [
      { endUse: 'HEATING_1', energySourceIndex: 3, specificConsumption: 50 },
      { endUse: 'HEATING_1', energySourceIndex: 5, specificConsumption: 30 },
    ];
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('duplicate'))).toBe(true);
  });

  // EN 15459 component index
  it('rejects EN 15459 component index < 1', () => {
    const input = validInput();
    input.serviceComponents = [
      { name: 'Test', constructionCost: 1000, en15459ComponentIndex: 0 },
    ];
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('en 15459'))).toBe(true);
  });

  it('rejects EN 15459 component index > 79', () => {
    const input = validInput();
    input.serviceComponents = [
      { name: 'Test', constructionCost: 1000, en15459ComponentIndex: 80 },
    ];
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('en 15459'))).toBe(true);
  });

  // Negative costs
  it('rejects negative cost in costItems', () => {
    const input = validInput();
    input.costItems = [
      { category: 'A1_ROOFS', materialCost: -1, laborCost: 5000, otherCost: 0 },
    ];
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('negative cost'))).toBe(true);
  });

  // Negative maintenance percent
  it('rejects negative buildingElementMaintenancePercent', () => {
    const input = validInput();
    input.buildingElementMaintenancePercent = -0.01;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.toLowerCase().includes('maintenance'))).toBe(true);
  });

  // Multiple errors accumulate
  it('returns all errors, not just the first one', () => {
    const input = validInput();
    input.referencePeriod = 0;
    input.interestRate = 0.6;
    input.inflationRate = -0.2;
    input.treatedFloorArea = -10;
    const errors = validateVariantInput(input);
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});
