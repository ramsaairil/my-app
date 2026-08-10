/**
 * Seeded Pseudo-Random Number Generator (PRNG) using Mulberry32 algorithm.
 * Guarantees 100% reproducible random sequence for a given simulation seed.
 */
export class SeededPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a pseudo-random float in [0, 1)
   */
  nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer in [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    if (min >= max) return min;
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }
}
