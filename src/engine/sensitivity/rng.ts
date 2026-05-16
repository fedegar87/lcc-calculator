export interface SeededRng {
  next(): number;
  nextInt(maxExclusive: number): number;
  nextFloat(min: number, max: number): number;
}

export function createRng(seed: number): SeededRng {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    nextInt(maxExclusive: number): number {
      return Math.floor(next() * maxExclusive);
    },
    nextFloat(min: number, max: number): number {
      return min + next() * (max - min);
    },
  };
}
