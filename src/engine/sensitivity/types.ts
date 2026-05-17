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
  /** How min/max map to apply()-space:
   *  - 'absolute' : value passed to apply() is sampled from [min, max] directly.
   *  - 'fractionalOffset' : value = baseline * (1 + sample), where sample ~ [min, max].
   *    Used for ±10% fixed-percentage perturbations where min=-0.1, max=+0.1. */
  scale: 'absolute' | 'fractionalOffset';
  distribution: 'uniform' | 'triangular';
  /** Mode of the triangular distribution in apply()-space (only used when distribution=triangular). */
  mode?: number;
  source: string;
}

export type VariationScheme = 'fixedPct' | 'literature';

export interface EEConfig {
  parameters: readonly ParameterId[];
  outputs: readonly OutputId[];
  /** Number of selected trajectories (paper §2.2.3: r = 10). */
  r: number;
  /** Pool size from which random samples are drawn (paper: 10 000). */
  rCandidates: number;
  /** Random samples of size r drawn from the pool (paper: 100). */
  rSamples: number;
  /** Discrete levels per parameter (paper: p = 4). */
  p: number;
  /** PRNG seed for reproducibility. */
  seed: number;
  variationScheme: VariationScheme;
}

export interface EEEntry {
  parameterId: ParameterId;
  output: OutputId;
  /** Mean of signed EE_ij over r trajectories (paper Eq. 5). Units: output units (€ or €/m²). */
  mu: number;
  /** Mean of |EE_ij| over r trajectories (paper Eq. 7). Sort key. Units: output units. */
  muStar: number;
  /** Standard deviation of EE_ij over r trajectories (paper Eq. 6). Units: output units. */
  sigma: number;
}

export interface EEDistribution {
  output: OutputId;
  samples: number[];
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  whiskerLow: number;
  whiskerHigh: number;
}

export interface EEResult {
  baseline: LCCResult;
  entries: EEEntry[];
  distribution: EEDistribution[];
  diagnostics: {
    engineRuns: number;
    elapsedMs: number;
    selectedSampleSpread: number;
    seed: number;
    droppedParameters: ParameterId[];
    variationScheme: VariationScheme;
  };
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
  parameters: readonly ParameterId[];
  outputs: readonly OutputId[];
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
