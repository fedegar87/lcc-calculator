import { describe, it, expect } from 'vitest';
import { aggregateResults } from '@/engine/aggregate';
import { computeMaintenanceCosts } from '@/engine/maintenance';
import type { YearlyEnergyCosts } from '@/engine/types';
import type { EnergyCostResult } from '@/engine/energy';
import { BUGFIXED_CONFIG, EXCEL_REPLICA_CONFIG } from './helpers';

function zeroSeries(referencePeriod: number): YearlyEnergyCosts {
  const zeros = new Array<number>(referencePeriod + 1).fill(0);
  return {
    nominal: [...zeros],
    actualized: [...zeros],
    cumulated: [...zeros],
  };
}

const referencePeriod = 1;
const zeroEnergy: EnergyCostResult = {
  heating: zeroSeries(referencePeriod),
  cooling: zeroSeries(referencePeriod),
  dhw: zeroSeries(referencePeriod),
  household: zeroSeries(referencePeriod),
  pv: zeroSeries(referencePeriod),
};

const baseInput = {
  referencePeriod,
  interestRate: 0.03,
  inflationRate: 0.01,
  treatedFloorArea: 10,
  energyPrices: [],
  energyInputs: [],
  costItems: [
    { category: 'A1_ROOFS', materialCost: 100, laborCost: 50, otherCost: 25 },
  ],
  serviceComponents: [],
  buildingElementMaintenancePercent: 0.1,
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
  designCosts: [],
};

describe('excel_replica parity for construction-derived totals', () => {
  it('excludes otherCost from construction totals in replica mode', () => {
    const replica = aggregateResults(
      baseInput.costItems,
      baseInput.wlcInput,
      zeroEnergy,
      {
        elements: [0, 0],
        elementsCumulated: [0, 0],
        services: [0, 0],
        servicesCumulated: [0, 0],
        total: [0, 0],
        totalCumulated: [0, 0],
        totalMaintenanceElements: 0,
        totalMaintenanceServices: 0,
        totalMaintenance: 0,
        maintenanceCostPerM2: 0,
      },
      referencePeriod,
      baseInput.treatedFloorArea,
      'excel_replica',
    );
    const bugfixed = aggregateResults(
      baseInput.costItems,
      baseInput.wlcInput,
      zeroEnergy,
      {
        elements: [0, 0],
        elementsCumulated: [0, 0],
        services: [0, 0],
        servicesCumulated: [0, 0],
        total: [0, 0],
        totalCumulated: [0, 0],
        totalMaintenanceElements: 0,
        totalMaintenanceServices: 0,
        totalMaintenance: 0,
        maintenanceCostPerM2: 0,
      },
      referencePeriod,
      baseInput.treatedFloorArea,
      'excel_bugfixed',
    );

    expect(replica.totalConstruction).toBe(150);
    expect(replica.constructionByCategory.A1_ROOFS).toBe(150);
    expect(bugfixed.totalConstruction).toBe(175);
    expect(bugfixed.constructionByCategory.A1_ROOFS).toBe(175);
  });

  it('uses the same construction basis in maintenance replica mode', () => {
    const replica = computeMaintenanceCosts(baseInput, EXCEL_REPLICA_CONFIG);
    const bugfixed = computeMaintenanceCosts(baseInput, BUGFIXED_CONFIG);

    expect(replica.elements[1]).toBeCloseTo(150 * 0.1 / 1.03, 10);
    expect(bugfixed.elements[1]).toBeCloseTo(175 * 0.1 / 1.03, 10);
  });

  it('keeps the row-62 replica bug stable even when raw service component order changes', () => {
    const serviceComponentInput = {
      ...baseInput,
      referencePeriod: 30,
      serviceComponents: [
        {
          name: 'Heat pump',
          constructionCost: 1000,
          en15459ComponentIndex: 1,
        },
        {
          name: 'Ventilation unit',
          constructionCost: 2000,
          en15459ComponentIndex: 35,
        },
      ],
    };

    const reversedServiceComponentInput = {
      ...serviceComponentInput,
      serviceComponents: [...serviceComponentInput.serviceComponents].reverse(),
    };

    const forward = computeMaintenanceCosts(
      serviceComponentInput,
      EXCEL_REPLICA_CONFIG,
    );
    const reversed = computeMaintenanceCosts(
      reversedServiceComponentInput,
      EXCEL_REPLICA_CONFIG,
    );

    expect(forward.totalMaintenanceServices).toBeCloseTo(
      reversed.totalMaintenanceServices,
      10,
    );
  });
});
