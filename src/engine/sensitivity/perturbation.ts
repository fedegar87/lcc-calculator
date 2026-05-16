import type { VariantInput } from '../types';
import type { ParameterSpec } from './types';

export interface PerturbationStep {
  spec: ParameterSpec;
  value: number;
}

export function perturb(
  input: VariantInput,
  steps: ReadonlyArray<PerturbationStep>,
): VariantInput {
  return steps.reduce(
    (acc, step) => step.spec.apply(acc, step.value),
    input,
  );
}
