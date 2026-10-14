/**
 * Random-number helpers for stochastic (chance-driven) simulations.
 */
export class Random {
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
