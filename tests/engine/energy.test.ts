import { describe, it, expect } from 'vitest';
import { computeEnergyCosts } from '@/engine/energy';
import { computeRealInterestRate } from '@/engine/discount';
import { GOLDEN_INPUT, GOLDEN_EXPECTED, expectCurrency } from './helpers';

const rr = computeRealInterestRate(
  GOLDEN_INPUT.interestRate,
  GOLDEN_INPUT.inflationRate,
);
const energy = computeEnergyCosts(GOLDEN_INPUT, rr);
const exp = GOLDEN_EXPECTED.energy;

describe('NRG: Heating costs (dual system)', () => {
  it('nominal year 1 matches combined sys1+sys2', () => {
    expectCurrency(energy.heating.nominal[1], exp.heating.nominalYear1);
  });

  it('actualized year 1', () => {
    expectCurrency(energy.heating.actualized[1], exp.heating.actualizedYear1);
  });

  it('cumulated year 40', () => {
    expectCurrency(energy.heating.cumulated[40], exp.heating.cumulatedYear40);
  });

  it('year 0 values are 0', () => {
    expect(energy.heating.nominal[0]).toBe(0);
    expect(energy.heating.actualized[0]).toBe(0);
    expect(energy.heating.cumulated[0]).toBe(0);
  });

  it('arrays have correct length', () => {
    expect(energy.heating.nominal).toHaveLength(41);
  });
});

describe('NRG: Cooling costs', () => {
  it('nominal year 1', () => {
    expectCurrency(energy.cooling.nominal[1], exp.cooling.nominalYear1);
  });

  it('cumulated year 40', () => {
    expectCurrency(energy.cooling.cumulated[40], exp.cooling.cumulatedYear40);
  });
});

describe('NRG: DHW costs (no input)', () => {
  it('all zeros when no DHW inputs', () => {
    expect(energy.dhw.cumulated[40]).toBe(0);
    expect(energy.dhw.nominal[1]).toBe(0);
  });
});

describe('NRG: Household electricity', () => {
  it('nominal year 1', () => {
    expectCurrency(energy.household.nominal[1], exp.household.nominalYear1);
  });

  it('cumulated year 40', () => {
    expectCurrency(
      energy.household.cumulated[40],
      exp.household.cumulatedYear40,
    );
  });
});

describe('NRG-007: PV production', () => {
  it('nominal year 1', () => {
    expectCurrency(energy.pv.nominal[1], exp.pv.nominalYear1);
  });

  it('cumulated year 40', () => {
    expectCurrency(energy.pv.cumulated[40], exp.pv.cumulatedYear40);
  });

  it('uses fixed source index 13 for price escalation', () => {
    // PV values should be non-zero even though pvProductionKwh not set
    expect(energy.pv.nominal[1]).toBeGreaterThan(0);
  });
});
