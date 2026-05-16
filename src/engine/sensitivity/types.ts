import type { LCCResult, VariantInput } from '../types';

export type ParameterId = string;

export type OutputId =
  | 'lcc'
  | 'lccNetResidual'
  | 'wlc'
  | 'kpiLCCPerM2'
  | 'kpiWLCPerM2';

export type ParameterGroup =
  | 'finance'
  | 'construction'
  | 'maintenance'
  | 'energy'
  | 'service'
  | 'wlc';

export interface ParameterBounds {
  min: number;
  max: number;
  distribution: 'uniform' | 'triangular';
  mode?: number;
  source: string;
}

export interface ParameterSpec {
  id: ParameterId;
  label: string;
  group: ParameterGroup;
  applicable: (input: VariantInput) => boolean;
  baseline: (input: VariantInput) => number;
  apply: (input: VariantInput, value: number) => VariantInput;
  defaultBounds: {
    fixedPct: ParameterBounds;
    literature?: ParameterBounds;
  };
}

export interface DSAConfig {
  parameters: ParameterId[];
  outputs: OutputId[];
  delta: number;
}

export interface DSAEntry {
  parameterId: ParameterId;
  output: OutputId;
  baselineInput: number;
  baselineOutput: number;
  plusInput: number;
  minusInput: number;
  plusOutput: number;
  minusOutput: number;
  relativeChangePlus: number;
  relativeChangeMinus: number;
  sensitivityIndex: number;
}

export interface DSAResult {
  baseline: LCCResult;
  entries: DSAEntry[];
  diagnostics: {
    engineRuns: number;
    elapsedMs: number;
    skippedParameters: ParameterId[];
  };
}
