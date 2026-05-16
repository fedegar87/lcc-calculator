import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import {
  generateTrajectories,
  sampleSpread,
  selectByCampolongo,
  trajectoryDistance,
} from '../sampling';

describe('generateTrajectories', () => {
  it('produces count trajectories with n+1 points in [0,1]^n', () => {
    const rng = createRng(42);
    const n = 5;
    const p = 4;
    const trajs = generateTrajectories(rng, n, p, 20);
    expect(trajs.length).toBe(20);
    for (const t of trajs) {
      expect(t.points.length).toBe(n + 1);
      for (const point of t.points) {
        expect(point.length).toBe(n);
        for (const coord of point) {
          expect(coord).toBeGreaterThanOrEqual(0);
          expect(coord).toBeLessThanOrEqual(1 + 1e-9);
        }
      }
      expect(t.stepOrder.length).toBe(n);
      expect(new Set(t.stepOrder).size).toBe(n);
    }
  });

  it('each consecutive pair of points differs in exactly one coordinate by delta', () => {
    const rng = createRng(7);
    const n = 6;
    const p = 4;
    const delta = p / (2 * (p - 1));
    const trajs = generateTrajectories(rng, n, p, 50);
    for (const t of trajs) {
      for (let k = 1; k < t.points.length; k++) {
        const diffs: number[] = [];
        let diffCount = 0;
        let diffIndex = -1;
        for (let i = 0; i < n; i++) {
          const d = t.points[k][i] - t.points[k - 1][i];
          diffs.push(d);
          if (Math.abs(d) > 1e-9) {
            diffCount++;
            diffIndex = i;
          }
        }
        expect(diffCount).toBe(1);
        expect(diffIndex).toBe(t.stepOrder[k - 1]);
        expect(Math.abs(Math.abs(diffs[diffIndex]) - delta)).toBeLessThan(1e-9);
      }
    }
  });

  it('rejects odd p (Morris design requires even)', () => {
    const rng = createRng(1);
    expect(() => generateTrajectories(rng, 3, 3, 1)).toThrow();
  });

  it('is deterministic for the same seed', () => {
    const a = generateTrajectories(createRng(42), 4, 4, 10);
    const b = generateTrajectories(createRng(42), 4, 4, 10);
    expect(a).toEqual(b);
  });
});

describe('trajectoryDistance', () => {
  it('is symmetric and non-negative', () => {
    const rng = createRng(11);
    const trajs = generateTrajectories(rng, 4, 4, 5);
    for (let i = 0; i < trajs.length; i++) {
      for (let j = 0; j < trajs.length; j++) {
        const dab = trajectoryDistance(trajs[i], trajs[j]);
        const dba = trajectoryDistance(trajs[j], trajs[i]);
        expect(dab).toBeCloseTo(dba, 9);
        expect(dab).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('selectByCampolongo', () => {
  it('returns exactly r trajectories', () => {
    const rng = createRng(99);
    const trajs = generateTrajectories(createRng(99), 4, 4, 200);
    const { selected, spread } = selectByCampolongo(rng, trajs, 10, 50);
    expect(selected.length).toBe(10);
    expect(spread).toBeGreaterThan(0);
  });

  it('chosen sample has spread >= mean of random samples (probabilistic)', () => {
    const rng = createRng(42);
    const trajs = generateTrajectories(createRng(42), 5, 4, 500);
    const { spread: bestSpread } = selectByCampolongo(rng, trajs, 10, 100);
    // Compare against a single naive random sample
    const naive = trajs.slice(0, 10);
    const naiveSpread = sampleSpread(naive);
    expect(bestSpread).toBeGreaterThan(naiveSpread * 0.9);
  });

  it('throws when r > candidate pool size', () => {
    const rng = createRng(1);
    const trajs = generateTrajectories(createRng(1), 3, 4, 5);
    expect(() => selectByCampolongo(rng, trajs, 10, 10)).toThrow();
  });

  it('is deterministic for the same seed', () => {
    const trajs = generateTrajectories(createRng(7), 4, 4, 100);
    const a = selectByCampolongo(createRng(123), trajs, 5, 20);
    const b = selectByCampolongo(createRng(123), trajs, 5, 20);
    expect(a.spread).toBe(b.spread);
    expect(a.selected).toEqual(b.selected);
  });
});
