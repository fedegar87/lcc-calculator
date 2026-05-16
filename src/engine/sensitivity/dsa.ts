import type { EngineConfig, LCCResult, VariantInput } from '../types';
import { DEFAULT_ENGINE_CONFIG } from '../types';
import { calculateLCC } from '../index';
import type {
  DSAConfig,
  DSAEntry,
  DSAResult,
  OutputId,
  ParameterId,
} from './types';
import { getParameterSpec } from './parameters';
import { perturb } from './perturbation';

function readOutput(result: LCCResult, output: OutputId): number {
  const value = result[output];
  if (value == null || !Number.isFinite(value)) {
    throw new Error(
      `Sensitivity output "${output}" is not a finite number on baseline (got ${value}).`,
    );
  }
  return value;
}

export function runDSA(
  input: VariantInput,
  cfg: DSAConfig,
  engineConfig: EngineConfig = DEFAULT_ENGINE_CONFIG,
): DSAResult {
  if (cfg.delta <= 0 || cfg.delta >= 1) {
    throw new Error(`DSA delta must be in (0, 1), got ${cfg.delta}`);
  }
  if (cfg.parameters.length === 0) {
    throw new Error('DSA requires at least one parameter');
  }
  if (cfg.outputs.length === 0) {
    throw new Error('DSA requires at least one output');
  }

  const started = Date.now();
  const baseline = calculateLCC(input, engineConfig);
  const baselineOutputs = new Map<OutputId, number>(
    cfg.outputs.map((o) => [o, readOutput(baseline, o)]),
  );

  const entries: DSAEntry[] = [];
  const skipped: ParameterId[] = [];
  let engineRuns = 1;

  for (const paramId of cfg.parameters) {
    const spec = getParameterSpec(paramId);
    if (!spec) {
      skipped.push(paramId);
      continue;
    }
    if (!spec.applicable(input)) {
      skipped.push(paramId);
      continue;
    }
    const baselineInput = spec.baseline(input);
    if (baselineInput === 0) {
      skipped.push(paramId);
      continue;
    }
    const plusInput = baselineInput * (1 + cfg.delta);
    const minusInput = baselineInput * (1 - cfg.delta);

    const plusResult = calculateLCC(
      perturb(input, [{ spec, value: plusInput }]),
      engineConfig,
    );
    const minusResult = calculateLCC(
      perturb(input, [{ spec, value: minusInput }]),
      engineConfig,
    );
    engineRuns += 2;

    for (const output of cfg.outputs) {
      const baseValue = baselineOutputs.get(output)!;
      const plusValue = readOutput(plusResult, output);
      const minusValue = readOutput(minusResult, output);

      const relPlus = baseValue !== 0 ? (plusValue - baseValue) / baseValue : 0;
      const relMinus =
        baseValue !== 0 ? (minusValue - baseValue) / baseValue : 0;
      const sensitivityIndex = (Math.abs(relPlus) + Math.abs(relMinus)) / 2 /
        cfg.delta;

      entries.push({
        parameterId: paramId,
        output,
        baselineInput,
        baselineOutput: baseValue,
        plusInput,
        minusInput,
        plusOutput: plusValue,
        minusOutput: minusValue,
        relativeChangePlus: relPlus,
        relativeChangeMinus: relMinus,
        sensitivityIndex,
      });
    }
  }

  entries.sort(
    (a, b) =>
      Math.abs(b.sensitivityIndex) - Math.abs(a.sensitivityIndex),
  );

  return {
    baseline,
    entries,
    diagnostics: {
      engineRuns,
      elapsedMs: Date.now() - started,
      skippedParameters: skipped,
    },
  };
}
