import { expect } from 'vitest';
import fixture from '../fixtures/formula-regression.json';
import type { VariantInput, EngineConfig } from '@/engine/types';

export const GOLDEN_INPUT: VariantInput = fixture.input as unknown as VariantInput;
export const GOLDEN_EXPECTED = fixture.expected;

export function baseInput(): VariantInput {
  return structuredClone(GOLDEN_INPUT);
}

export function inputWith(overrides: Partial<VariantInput>): VariantInput {
  return { ...baseInput(), ...overrides };
}

export const EXCEL_REPLICA_CONFIG: EngineConfig = {
  formulaMode: 'excel_replica',
  maxReplacementCycles: 3,
};

export const BUGFIXED_CONFIG: EngineConfig = {
  formulaMode: 'excel_bugfixed',
  maxReplacementCycles: 3,
};

export function expectCurrency(actual: number, expected: number): void {
  expect(actual).toBeCloseTo(expected, 2);
}

export function expectRate(actual: number, expected: number): void {
  expect(actual).toBeCloseTo(expected, 4);
}
