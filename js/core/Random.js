/**
 * Random-number helpers for stochastic (chance-driven) simulations.
 *
 * Two usage modes:
 *   Static  — Random.normal(), Random.binomial()  — use Math.random(); not reproducible.
 *   Instance — new Random(seed)                   — seeded Mulberry32 PRNG; reproducible.
 *
 * Mulberry32 algorithm: Tommy Ettinger (public domain).
 * https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */
export class Random {
  /**
   * Create a seeded PRNG instance.
   * @param {number} [seed=0]  32-bit integer seed
   */
  constructor(seed = 0) {
    this._s = seed >>> 0; // ensure unsigned 32-bit
  }

  /**
   * Next uniform random in [0, 1) from the seeded sequence.
   * @returns {number}
   */
  next() {
    let s = (this._s + 0x6D2B79F5) | 0;
    this._s = s;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Standard normal from the seeded sequence (Box–Muller transform).
   * @returns {number}
   */
  normalSeeded() {
    let u = 0;
    while (u === 0) u = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.next());
  }

  /**
   * Standard normal random number (mean 0, standard deviation 1),
   * using the Box–Muller transform.
   */
  static normal() {
    let u = 0;
    while (u === 0) u = Math.random(); // log(0) would be -Infinity
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /**
   * Number of successes in n independent trials with probability p each.
   * Counts exactly when results could be lopsided; uses the normal
   * approximation when n is large and both outcomes are common.
   * @param {number} n
   * @param {number} p
   */
  static binomial(n, p) {
    if (p <= 0) return 0;
    if (p >= 1) return n;

    const mean = n * p;
    const exactIsNeeded = n <= 200 || mean < 20 || n - mean < 20;
    if (exactIsNeeded) {
      let successes = 0;
      for (let i = 0; i < n; i++) if (Math.random() < p) successes++;
      return successes;
    }

    const sd = Math.sqrt(n * p * (1 - p));
    const k = Math.round(mean + sd * Random.normal());
    return Math.min(n, Math.max(0, k));
  }
}
