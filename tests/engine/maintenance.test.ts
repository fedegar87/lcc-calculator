import { describe, it, expect } from 'vitest';
import { computeMaintenanceCosts } from '@/engine/maintenance';
import {
  GOLDEN_INPUT,
  GOLDEN_EXPECTED,
  EXCEL_REPLICA_CONFIG,
  BUGFIXED_CONFIG,
  expectCurrency,
  baseInput,
} from './helpers';

const maint = computeMaintenanceCosts(GOLDEN_INPUT, BUGFIXED_CONFIG);
const exp = GOLDEN_EXPECTED.maintenance;

describe('MNT-001/002: Building element maintenance', () => {
  it('element maintenance year 1', () => {
    expectCurrency(maint.elements[1], exp.elementsYear1);
  });

  it('element maintenance year 10', () => {
    expectCurrency(maint.elements[10], exp.elementsYear10);
  });

  it('elements cumulated at year 40', () => {
    expectCurrency(maint.elementsCumulated[40], exp.elementsCumulatedYear40);
  });

  it('year 0 is zero', () => {
    expect(maint.elements[0]).toBe(0);
  });

  it('uses Rint (nominal rate), not RR', () => {
    // Element cost = 358000 * 0.01 / (1 + 0.0151)^1 = 3526.75
    expectCurrency(maint.elements[1], 3526.75);
  });
});

describe('MNT-003/004: Building service maintenance (bugfixed)', () => {
  it('service maintenance year 1 (annual)', () => {
    expectCurrency(maint.services[1], exp.servicesYear1);
  });

  it('service maintenance year 15 (ventilation replacement)', () => {
    expectCurrency(maint.services[15], exp.servicesYear15);
  });

  it('service maintenance year 20 (heat pump replacement)', () => {
    expectCurrency(maint.services[20], exp.servicesYear20);
  });

  it('service maintenance year 30 (ventilation 2nd replacement)', () => {
    expectCurrency(maint.services[30], exp.servicesYear30);
  });

  it('services cumulated at year 40', () => {
    expectCurrency(maint.servicesCumulated[40], exp.servicesCumulatedYear40);
  });
});

describe('MNT-BUG-001: Formula mode toggle', () => {
  const replica = computeMaintenanceCosts(baseInput(), EXCEL_REPLICA_CONFIG);
  const bugfixed = computeMaintenanceCosts(baseInput(), BUGFIXED_CONFIG);
  const expReplica = GOLDEN_EXPECTED.maintenanceReplica;

  it('replica and bugfixed produce different services at year 15', () => {
    expect(replica.services[15]).not.toBeCloseTo(bugfixed.services[15], 0);
  });

  it('replica services year 15 matches golden', () => {
    expectCurrency(replica.services[15], expReplica.servicesYear15);
  });

  it('replica is higher at year 15 (less discounting with exponent=9 vs 15)', () => {
    expect(replica.services[15]).toBeGreaterThan(bugfixed.services[15]);
  });

  it('total maintenance differs between modes', () => {
    expect(replica.totalMaintenance).not.toBeCloseTo(
      bugfixed.totalMaintenance,
      0,
    );
  });

  it('replica services cumulated matches golden', () => {
    expectCurrency(
      replica.servicesCumulated[40],
      expReplica.servicesCumulatedYear40,
    );
  });
});

describe('CAL-005..008: Maintenance totals', () => {
  it('totalMaintenanceElements', () => {
    expectCurrency(maint.totalMaintenanceElements, exp.elementsCumulatedYear40);
  });

  it('totalMaintenanceServices', () => {
    expectCurrency(
      maint.totalMaintenanceServices,
      exp.servicesCumulatedYear40,
    );
  });

  it('totalMaintenance = elements + services', () => {
    expectCurrency(maint.totalMaintenance, exp.totalMaintenance);
  });

  it('maintenanceCostPerM2', () => {
    expectCurrency(maint.maintenanceCostPerM2, exp.maintenanceCostPerM2);
  });
});
