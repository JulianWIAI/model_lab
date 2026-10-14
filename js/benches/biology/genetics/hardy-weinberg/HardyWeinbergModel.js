/**
 * HardyWeinbergModel — deterministic allele-frequency dynamics.
 *
 * One-generation update (all values dimensionless):
 *   q  = 1 − p
 *   w̄  = p²·wAA + 2pq·wAa + q²·waa        [mean fitness]
 *   p' = (p²·wAA + pq·wAa) / w̄              [selection step]
 *   p'' = p'·(1−μ) + (1−p')·ν              [mutation step: A→a rate μ, a→A rate ν]
 *   p''' = p''·(1−m) + p_m·m               [migration step: migrant freq p_m, rate m]
 *
 * Equilibria:
 *   HWE (neutral, no forces): p unchanged → all genotype freqs = HWP.
 *   Mutation–selection balance:
 *     Recessive lethal (waa=0): q̂ ≈ √(μ/s),   s = 1−waa
 *     Dominant allele (hs≠0):  q̂ ≈ μ/(h·s),  h = dominance coefficient
 *
 * References:
 *   Hardy (1908) Science 28, 49–50.
 *   Weinberg (1908) Jahreshefte Verein vaterländische Naturk. Württemberg 64, 368–382.
 *   Falconer & Mackay (1996) Introduction to Quantitative Genetics, 4th ed. §3.
 */
export class HardyWeinbergModel {
  /**
   * @param {{
   *   p?: number,          initial frequency of allele A (default 0.5)
   *   wAA?: number,        fitness of AA genotype (default 1)
   *   wAa?: number,        fitness of Aa genotype (default 1)
   *   waa?: number,        fitness of aa genotype (default 1)
   *   mu?: number,         A→a mutation rate (default 0)
   *   nu?: number,         a→A mutation rate (default 0)
   *   migrationRate?: number,  fraction of migrants per generation (default 0)
   *   migrantFreq?: number,    allele A frequency among migrants (default 0.5)
   * }} options
   */
  constructor({
    p            = 0.5,
    wAA          = 1,
    wAa          = 1,
    waa          = 1,
    mu           = 0,
    nu           = 0,
    migrationRate = 0,
    migrantFreq  = 0.5,
  } = {}) {
    this.p0           = p;
    this.p            = p;
    this.wAA          = wAA;
    this.wAa          = wAa;
    this.waa          = waa;
    this.mu           = mu;
    this.nu           = nu;
    this.migrationRate = migrationRate;
    this.migrantFreq  = migrantFreq;
    this.generation   = 0;
    /** Float64Array of p values from generation 0 onwards. */
    this.history      = new Float64Array(2001);
    this.history[0]   = p;
  }

  /** Advance one generation. */
  step() {
    const p = this.p;
    const q = 1 - p;

    // Selection
    const wBar = p * p * this.wAA + 2 * p * q * this.wAa + q * q * this.waa;
    let pNew = wBar > 0
      ? (p * p * this.wAA + p * q * this.wAa) / wBar
      : p;

    // Mutation
    pNew = pNew * (1 - this.mu) + (1 - pNew) * this.nu;

    // Migration
    pNew = pNew * (1 - this.migrationRate) + this.migrantFreq * this.migrationRate;

    // Clamp to [0, 1]
    pNew = Math.max(0, Math.min(1, pNew));

    this.generation++;
    this.p = pNew;
    if (this.generation < this.history.length) {
      this.history[this.generation] = pNew;
    }
  }

  /** Reset to initial state. */
  reset() {
    this.p          = this.p0;
    this.generation = 0;
    this.history.fill(0);
    this.history[0] = this.p0;
  }

  /** Current genotype frequencies { AA, Aa, aa } assuming HWP. */
  genotypeFrequencies() {
    const p = this.p, q = 1 - p;
    return { AA: p * p, Aa: 2 * p * q, aa: q * q };
  }

  /**
   * Iterate until |Δp| < tol to find equilibrium p.
   * @param {number} [tol=1e-9]
   * @param {number} [maxIter=100000]
   * @returns {number}  equilibrium p
   */
  equilibrium(tol = 1e-9, maxIter = 100_000) {
    const saved = this.p;
    const savedGen = this.generation;
    let prev = this.p;
    for (let i = 0; i < maxIter; i++) {
      this.step();
      if (Math.abs(this.p - prev) < tol) break;
      prev = this.p;
    }
    const eq = this.p;
    // Restore state
    this.p          = saved;
    this.generation = savedGen;
    return eq;
  }
}
