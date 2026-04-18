import { describe, it, expect } from 'vitest';
import { buildVariantInput } from '@/server/trpc/routers/_shared';

function makeVariant() {
  return {
    id: 'variant-2',
    label: 'VARIANT_2',
    boundaryCondition: {
      referencePeriod: 40,
      interestRate: 0.0151,
      inflationRate: 0.0056,
      energyPrices: [
        { index: 3, name: 'Natural Gas', pricePerKwh: 0.09, annualIncrease: 0.02 },
        { index: 12, name: 'National Electricity-Mix', pricePerKwh: 0.3, annualIncrease: 0.03 },
      ],
    },
    geometry: {
      treatedFloorArea: 1750,
    },
    maintenanceConfig: {
      buildingElementMaintenancePercent: 0.01,
    },
    energyInputs: [],
    costItems: [],
    serviceComponents: [
      { id: 'b', name: 'Second', constructionCost: 2000, en15459ComponentIndex: 2 },
      { id: 'a', name: 'First', constructionCost: 1000, en15459ComponentIndex: 1 },
    ],
    wlcInput: {
      landArea: 100,
      landPrice: 200,
      enablingCost1: 10,
      enablingCost2: 5,
      planningFees1: 7,
      planningFees2: 3,
      userSupportPropMgmt: 2,
      userSupportCharges: 1,
      userSupportAdmin: 1,
      financeCost: 4,
    },
    designCosts: [],
    incomeInput: null,
  };
}

describe('buildVariantInput', () => {
  it('maps workbook land cost as landArea * landPrice', () => {
    const variantInput = buildVariantInput(makeVariant());
    expect(variantInput.wlcInput.landCost).toBe(20000);
  });

  it('stabilizes service component ordering for replica-mode calculations', () => {
    const variantInput = buildVariantInput(makeVariant());
    expect(variantInput.serviceComponents.map((component) => component.name)).toEqual([
      'First',
      'Second',
    ]);
    expect(variantInput.serviceComponents.map((component) => component.replicaOrder)).toEqual([
      0,
      1,
    ]);
  });

  it('reuses Variant 1 prices for Variant 2 in excel_replica mode', () => {
    const variantInput = buildVariantInput(makeVariant(), {
      formulaMode: 'excel_replica',
      replicaVariant1EnergyPrices: [
        { index: 3, name: 'Natural Gas', pricePerKwh: 0.065, annualIncrease: 0.01 },
        { index: 12, name: 'National Electricity-Mix', pricePerKwh: 0.22, annualIncrease: 0.01 },
      ],
    });

    expect(variantInput.energyPrices).toEqual([
      { index: 3, name: 'Natural Gas', pricePerKwh: 0.065, annualIncrease: 0.02 },
      { index: 12, name: 'National Electricity-Mix', pricePerKwh: 0.22, annualIncrease: 0.03 },
    ]);
  });
});
