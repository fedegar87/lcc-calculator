import type { EngineConfig, LCCResult, VariantInput } from '../types';
import { DEFAULT_ENGINE_CONFIG } from '../types';
import { calculateLCC } from '../index';
import type {
  EEConfig,
  EEDistribution,
  EEEntry,
  EEResult,
  OutputId,
  ParameterId,
} from './types';
import {
  getParameterSpec,
  resolveAbsoluteBounds,
} from './parameters';
import { createRng } from './rng';
import {
  generateTrajectories,
  selectByCampolongo,
  type Trajectory,
} from './sampling';

interface ResolvedParameter {
  id: ParameterId;
  baseline: number;
  min: number;
  max: number;
  delta: number; // step in apply()-space
}

function readOutput(result: LCCResult, output: OutputId): number {
  const value = result[output];
  if (value == null || !Number.isFinite(value)) {
    throw new Error(
      `EE output "${output}" is not a finite number (got ${value}).`,
    );
  }
  return value;
}

function percentile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return NaN;
  const idx = (sortedValues.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedValues[lo];
  const t = idx - lo;
  return sortedValues[lo] * (1 - t) + sortedValues[hi] * t;
}

function distributionFor(output: OutputId, samples: number[]): EEDistribution {
  const sorted = samples.slice().sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = percentile(sorted, 0.5);
  const p25 = percentile(sorted, 0.25);
  const p75 = percentile(sorted, 0.75);
  const iqr = p75 - p25;
  const whiskerLow = Math.max(min, p25 - 1.5 * iqr);
  const whiskerHigh = Math.min(max, p75 + 1.5 * iqr);
  return {
    output,
    samples: sorted,
    median,
    p25,
    p75,
    min,
    max,
    whiskerLow,
    whiskerHigh,
  };
}

/** Resolve every requested parameter into its absolute [min, max] range
 *  under the chosen variation scheme. Skip non-existent / non-applicable
 *  parameters and zero-baseline parameters (paper would yield 0/0 EE). */
function resolveParameters(
  ids: readonly ParameterId[],
  input: VariantInput,
  scheme: EEConfig['variationScheme'],
  delta: number,
): { resolved: ResolvedParameter[]; dropped: ParameterId[] } {
  const resolved: ResolvedParameter[] = [];
  const dropped: ParameterId[] = [];
  for (const id of ids) {
    const spec = getParameterSpec(id);
    if (!spec || !spec.applicable(input)) {
      dropped.push(id);
      continue;
    }
    const baseline = spec.baseline(input);
    const bounds = resolveAbsoluteBounds(spec, input, scheme);
    if (!bounds || !Number.isFinite(bounds.min) || !Number.isFinite(bounds.max)) {
      dropped.push(id);
      continue;
    }
    if (bounds.max <= bounds.min) {
      dropped.push(id);
      continue;
    }
    const range = bounds.max - bounds.min;
    resolved.push({
      id,
      baseline,
      min: bounds.min,
      max: bounds.max,
      delta: range * delta,
    });
  }
  return { resolved, dropped };
}

function mapTrajectory(
  trajectory: Trajectory,
  resolved: ResolvedParameter[],
): number[][] {
  return trajectory.points.map((pt) =>
    pt.map((coord, i) => resolved[i].min + coord * (resolved[i].max - resolved[i].min)),
  );
}

function applyAll(
  input: VariantInput,
  resolved: ResolvedParameter[],
  values: number[],
): VariantInput {
  let current = input;
  for (let i = 0; i < resolved.length; i++) {
    const spec = getParameterSpec(resolved[i].id)!;
    current = spec.apply(current, values[i]);
  }
  return current;
}

export function runEE(
  input: VariantInput,
  cfg: EEConfig,
  engineConfig: EngineConfig = DEFAULT_ENGINE_CONFIG,
): EEResult {
  if (cfg.parameters.length < 2) {
    throw new Error('EE requires at least 2 parameters');
  }
  if (cfg.outputs.length === 0) {
    throw new Error('EE requires at least one output');
  }
  if (cfg.r < 4 || cfg.r > 50) {
    throw new Error(`EE r must be in [4, 50], got ${cfg.r}`);
  }
  if (cfg.rCandidates < cfg.r) {
    throw new Error('rCandidates must be ≥ r');
  }
  if (cfg.rSamples < 1) {
    throw new Error('rSamples must be ≥ 1');
  }
  if (cfg.p < 2 || cfg.p % 2 !== 0) {
    throw new Error(`p must be even and ≥ 2, got ${cfg.p}`);
  }

  const started = Date.now();
  const baseline = calculateLCC(input, engineConfig);

  const { resolved, dropped } = resolveParameters(
    cfg.parameters,
    input,
    cfg.variationScheme,
    cfg.p / (2 * (cfg.p - 1)),
  );

  if (resolved.length < 2) {
    throw new Error(
      `EE requires at least 2 applicable parameters; resolved ${resolved.length}, dropped ${dropped.join(', ')}`,
    );
  }

  const n = resolved.length;
  const rng = createRng(cfg.seed);

  const trajectories = generateTrajectories(rng, n, cfg.p, cfg.rCandidates);
  const { selected, spread } = selectByCampolongo(
    rng,
    trajectories,
    cfg.r,
    cfg.rSamples,
  );

  // Per-parameter EE list: each parameter accumulates r elementary effects.
  // The map key is `${output}|${parameterIndex}`.
  const effects = new Map<string, number[]>();
  for (let pi = 0; pi < n; pi++) {
    for (const output of cfg.outputs) {
      effects.set(`${output}|${pi}`, []);
    }
  }
  const outputSamples = new Map<OutputId, number[]>();
  for (const output of cfg.outputs) outputSamples.set(output, []);

  let engineRuns = 1;

  for (const trajectory of selected) {
    const physical = mapTrajectory(trajectory, resolved);
    const results: LCCResult[] = new Array(physical.length);
    for (let step = 0; step < physical.length; step++) {
      const perturbed = applyAll(input, resolved, physical[step]);
      results[step] = calculateLCC(perturbed, engineConfig);
      engineRuns++;
      for (const output of cfg.outputs) {
        outputSamples.get(output)!.push(readOutput(results[step], output));
      }
    }
    // Map trajectory step k -> the parameter index that changed:
    // points[k] vs points[k-1] differ in stepOrder[k-1].
    for (let k = 1; k < results.length; k++) {
      const paramIdx = trajectory.stepOrder[k - 1];
      for (const output of cfg.outputs) {
        const ee = readOutput(results[k], output) - readOutput(results[k - 1], output);
        effects.get(`${output}|${paramIdx}`)!.push(ee);
      }
    }
  }

  const entries: EEEntry[] = [];
  for (let pi = 0; pi < n; pi++) {
    for (const output of cfg.outputs) {
      const ees = effects.get(`${output}|${pi}`)!;
      const mu = mean(ees);
      const muStar = mean(ees.map(Math.abs));
      const sigma = sampleStdev(ees, mu);
      entries.push({
        parameterId: resolved[pi].id,
        output,
        mu,
        muStar,
        sigma,
      });
    }
  }

  entries.sort((a, b) => b.muStar - a.muStar);

  const distribution: EEDistribution[] = cfg.outputs.map((output) =>
    distributionFor(output, outputSamples.get(output)!),
  );

  return {
    baseline,
    entries,
    distribution,
    diagnostics: {
      engineRuns,
      elapsedMs: Date.now() - started,
      selectedSampleSpread: spread,
      seed: cfg.seed,
      droppedParameters: dropped,
    },
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function sampleStdev(values: number[], mu: number): number {
  if (values.length < 2) return 0;
  let sumSq = 0;
  for (const v of values) {
    const d = v - mu;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / (values.length - 1));
}
