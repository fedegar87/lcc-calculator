// RES-001: Residual value computation per ISO 15686-5 (METHOD_IMPROVEMENT)

import type { ServiceComponentInput } from './types';
import { getEN15459Component } from './constants';

export interface ResidualValueResult {
  totalResidualValue: number;
  componentResiduals: { name: string; residual: number }[];
}

/**
 * RES-001: Compute residual value for building service components.
 * Per ISO 15686-5: residual = cost * max(0, remainingLife / lifespan) / (1+RR)^refPeriod
 *
 * Only building services (B*, C*) are passed here — building elements
 * use referencePeriod as lifespan so their residual conceptually = 0.
 * The caller is responsible for filtering.
 */
export function computeResidualValue(
  serviceComponents: ServiceComponentInput[],
  referencePeriod: number,
  realRate: number,
): ResidualValueResult {
  const componentResiduals: { name: string; residual: number }[] = [];
  let totalResidualValue = 0;

  for (const sc of serviceComponents) {
    const component = getEN15459Component(sc.en15459ComponentIndex);
    const lifespan = component ? component.lifespanAvg : 0;

    if (lifespan <= 0) {
      componentResiduals.push({ name: sc.name, residual: 0 });
      continue;
    }

    const remainingLife = lifespan - (referencePeriod % lifespan);
    const fraction = Math.max(0, remainingLife / lifespan);
    const residual =
      (sc.constructionCost * fraction) /
      Math.pow(1 + realRate, referencePeriod);

    componentResiduals.push({ name: sc.name, residual });
    totalResidualValue += residual;
  }

  return { totalResidualValue, componentResiduals };
}
