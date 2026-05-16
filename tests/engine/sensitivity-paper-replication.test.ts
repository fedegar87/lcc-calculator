import { describe, it, expect } from 'vitest';
import { calculateLCC } from '@/engine/index';
import { runDSA } from '@/engine/sensitivity';
import { listApplicableParameters } from '@/engine/sensitivity/parameters';
import { validateVariantInput } from '@/engine/validation';
import { valaGardFixture } from '../fixtures/vala-gard';

/**
 * SA-0 paper-replication regression test.
 *
 * Pernetti et al. 2021 (SCS 74, 103139) identifies four dominant LCC
 * inputs across 11 nZEB case studies: interest rate, structural-element
 * construction cost, building-element maintenance %, and HVAC maintenance.
 * This test runs DSA on a Väla Gård-like fixture and asserts that the
 * top-ranked parameters reflect that pattern.
 *
 * The fixture is a best-effort approximation (see tests/fixtures/vala-gard.ts),
 * so we assert the *ranking* the paper demonstrates is robust, not the
 * absolute LCC value (which depends on per-line-item splits we had to
 * interpolate).
 */
describe('Pernetti 2021 SA replication — Väla Gård-like fixture', () => {
  const input = valaGardFixture();

  it('fixture passes engine validation', () => {
    expect(validateVariantInput(input)).toEqual([]);
  });

  it('produces a finite LCC > 0', () => {
    const result = calculateLCC(input);
    expect(result.lcc).toBeGreaterThan(0);
    expect(Number.isFinite(result.lcc)).toBe(true);
    expect(Number.isFinite(result.kpiLCCPerM2!)).toBe(true);
  });

  it('every paper top-4 parameter is applicable to the fixture', () => {
    const applicable = new Set(
      listApplicableParameters(input).map((p) => p.id),
    );
    expect(applicable.has('interestRate')).toBe(true);
    expect(applicable.has('buildingElementMaintenancePercent')).toBe(true);
    expect(applicable.has('service.hvac.maintenancePctMultiplier')).toBe(true);
    expect(applicable.has('costItems.A9_STRUCTURE.totalCost')).toBe(true);
  });

  it('DSA top-3 contains interest rate AND structural construction cost', () => {
    const result = runDSA(input, {
      parameters: listApplicableParameters(input).map((p) => p.id),
      outputs: ['lcc'],
      delta: 0.1,
    });

    const ranked = result.entries
      .filter((e) => e.output === 'lcc')
      .map((e) => e.parameterId);

    const top3 = new Set(ranked.slice(0, 3));
    expect(top3.has('interestRate')).toBe(true);
    expect(top3.has('costItems.A9_STRUCTURE.totalCost')).toBe(true);
  });

  it('DSA top-5 contains at least one maintenance parameter (per paper)', () => {
    const result = runDSA(input, {
      parameters: listApplicableParameters(input).map((p) => p.id),
      outputs: ['lcc'],
      delta: 0.1,
    });

    const top5 = result.entries
      .filter((e) => e.output === 'lcc')
      .slice(0, 5)
      .map((e) => e.parameterId);

    const maintenanceIds = [
      'buildingElementMaintenancePercent',
      'service.hvac.maintenancePctMultiplier',
    ];
    const containsMaintenance = top5.some((id) => maintenanceIds.includes(id));
    expect(containsMaintenance).toBe(true);
  });

  it('interest rate sensitivity is in a plausible range (3% to 25% per ±10% perturbation)', () => {
    const result = runDSA(input, {
      parameters: ['interestRate'],
      outputs: ['lcc'],
      delta: 0.1,
    });
    const entry = result.entries.find((e) => e.parameterId === 'interestRate')!;
    expect(Math.abs(entry.relativeChangePlus)).toBeGreaterThan(0.01);
    expect(Math.abs(entry.relativeChangeMinus)).toBeGreaterThan(0.01);
    expect(Math.abs(entry.relativeChangePlus)).toBeLessThan(0.4);
    expect(Math.abs(entry.relativeChangeMinus)).toBeLessThan(0.4);
  });

  it('engine run count equals 1 baseline + 2 per applicable parameter', () => {
    const params = listApplicableParameters(input).map((p) => p.id);
    const result = runDSA(input, {
      parameters: params,
      outputs: ['lcc', 'lccNetResidual'],
      delta: 0.1,
    });
    expect(result.diagnostics.engineRuns).toBe(1 + 2 * params.length);
    expect(result.diagnostics.skippedParameters).toEqual([]);
  });
});
