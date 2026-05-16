import type { SeededRng } from './rng';

/** A single Morris trajectory: (n+1) points in the unit hypercube [0,1]^n.
 *  Consecutive points differ in exactly one coordinate by delta. */
export interface Trajectory {
  /** (n+1) rows, n cols. Each row is a point in [0,1]^n. */
  points: number[][];
  /** Order in which parameters are stepped (length n, values in [0..n-1]). */
  stepOrder: number[];
}

/** Generate `count` random Morris trajectories at `p` levels in n dimensions.
 *  Each trajectory increments one parameter at a time by delta = p/(2(p-1)).
 *  Base point coords are picked from the lower half of the level grid so
 *  base + delta stays inside [0,1]. */
export function generateTrajectories(
  rng: SeededRng,
  n: number,
  p: number,
  count: number,
): Trajectory[] {
  if (p < 2 || p % 2 !== 0) {
    throw new Error(`Morris design requires even p ≥ 2, got ${p}`);
  }
  if (n < 1) throw new Error(`n must be ≥ 1, got ${n}`);

  const delta = p / (2 * (p - 1));
  // Admissible base levels: {0, 1/(p-1), ..., (p/2 - 1)/(p-1)} so base + delta ≤ 1.
  const baseLevelCount = p / 2;
  const baseLevels: number[] = [];
  for (let i = 0; i < baseLevelCount; i++) {
    baseLevels.push(i / (p - 1));
  }

  const trajectories: Trajectory[] = [];
  for (let t = 0; t < count; t++) {
    const base = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      base[i] = baseLevels[rng.nextInt(baseLevels.length)];
    }
    const stepOrder = shuffle(rng, range(n));
    const points: number[][] = [base.slice()];
    const current = base.slice();
    for (const paramIdx of stepOrder) {
      current[paramIdx] = current[paramIdx] + delta;
      points.push(current.slice());
    }
    trajectories.push({ points, stepOrder });
  }
  return trajectories;
}

/** Sum of Euclidean distances between every pair of points across two
 *  trajectories (paper Eq. 8). O((n+1)^2 · n). */
export function trajectoryDistance(a: Trajectory, b: Trajectory): number {
  let total = 0;
  for (const pa of a.points) {
    for (const pb of b.points) {
      let sumSq = 0;
      for (let i = 0; i < pa.length; i++) {
        const d = pa[i] - pb[i];
        sumSq += d * d;
      }
      total += Math.sqrt(sumSq);
    }
  }
  return total;
}

/** Spread of a sample (paper §2.2.3): sum of pairwise trajectory distances. */
export function sampleSpread(sample: Trajectory[]): number {
  let total = 0;
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      total += trajectoryDistance(sample[i], sample[j]);
    }
  }
  return total;
}

/** Campolongo screening per paper §2.2.3: draw `samples` random samples of
 *  size `r` from the candidates, return the sample with maximum spread.
 *  Not exhaustive enumeration of C(candidates.length, r). */
export function selectByCampolongo(
  rng: SeededRng,
  candidates: Trajectory[],
  r: number,
  samples: number,
): { selected: Trajectory[]; spread: number } {
  if (r > candidates.length) {
    throw new Error(
      `r=${r} cannot exceed candidate pool size ${candidates.length}`,
    );
  }
  let bestSpread = -Infinity;
  let bestSample: Trajectory[] | null = null;
  for (let s = 0; s < samples; s++) {
    const sample = sampleWithoutReplacement(rng, candidates, r);
    const spread = sampleSpread(sample);
    if (spread > bestSpread) {
      bestSpread = spread;
      bestSample = sample;
    }
  }
  if (!bestSample) throw new Error('Campolongo selection produced no sample');
  return { selected: bestSample, spread: bestSpread };
}

function range(n: number): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = i;
  return out;
}

function shuffle<T>(rng: SeededRng, arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sampleWithoutReplacement<T>(
  rng: SeededRng,
  pool: T[],
  k: number,
): T[] {
  const indices = range(pool.length);
  for (let i = 0; i < k; i++) {
    const j = i + rng.nextInt(indices.length - i);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, k).map((idx) => pool[idx]);
}
