/**
 * CentralLimitModel — Central Limit Theorem with five parent distributions.
 *
 * Four distributions satisfy the CLT (finite mean and variance):
 *   Uniform[0,1]:   μ=0.5,  σ=1/√12,   skew=0,    kurt_ex=−6/5
 *   Exponential(1): μ=1,    σ=1,        skew=2,    kurt_ex=6
 *   Bernoulli(0.5): μ=0.5,  σ=0.5,     skew=0,    kurt_ex=−2
 *   Chi-squared(3): μ=3,    σ=√6,      skew=√(8/3), kurt_ex=4
 *
 * One distribution where CLT FAILS:
 *   Cauchy(0,1):    no mean, no variance — sum of n Cauchy is Cauchy, not N
 *                   IQR of sample means does NOT decrease as n increases
 *
 * CLT (for first four):
 *   X̄_n ~ N(μ, σ²/n) as n→∞
 *   SE = σ/√n
 *   Skewness of means ≈ skew(parent)/√n
 *   Excess kurtosis of means ≈ kurt_ex(parent)/n
 *
 * Exact check for Exponential(1) means:
 *   Sum of n iid Exp(1) ~ Gamma(n, 1) (Erlang)
 *   Mean = Sum/n ~ Gamma(n, n) [shape=n, rate=n]
 *   P(X̄ < x) = regularised incomplete gamma P(n, n·x)
 *   P(X̄ < 0.8) at n=5: P(5, 4.0) = computed via series, ≈ 0.371163
 *   (independent check: does NOT use CLT normal approximation)
 *
 * RNG: uses seeded Random instance (Mulberry32) for reproducibility.
 * Do NOT use drop-in unverified constants — all parameters computed from formulas.
 */
import { Random } from '../../../../core/Random.js';

export const DISTRIBUTIONS = Object.freeze([
  {
    id:      'uniform',
    name:    'Uniform[0,1]',
    mu:      0.5,
    sigma:   1 / Math.sqrt(12),
    skew:    0,
    kurtEx:  -6 / 5,
  },
  {
    id:      'exponential',
    name:    'Exponential(1)',
    mu:      1,
    sigma:   1,
    skew:    2,
    kurtEx:  6,
  },
  {
    id:      'bernoulli',
    name:    'Bernoulli(0.5)',
    mu:      0.5,
    sigma:   0.5,
    skew:    0,
    kurtEx:  -2,
  },
  {
    id:      'chisq3',
    name:    'Chi-squared(3)',
    mu:      3,
    sigma:   Math.sqrt(6),
    skew:    Math.sqrt(8 / 3),
    kurtEx:  4,
  },
  {
    id:      'cauchy',
    name:    'Cauchy(0,1)  [CLT fails]',
    mu:      null,  // undefined
    sigma:   null,
    skew:    null,
    kurtEx:  null,
  },
]);

export class CentralLimitModel {
  /**
   * @param {object} [opts]
   * @param {string} [opts.dist='uniform']  distribution id
   * @param {number} [opts.n=30]            sample size per mean
   * @param {number} [opts.N=2000]          number of sample means
   * @param {number} [opts.seed=42]         RNG seed
   */
  constructor({ dist = 'uniform', n = 30, N = 2000, seed = 42 } = {}) {
    this.dist = dist;
    this.n    = n;
    this.N    = N;
    this.seed = seed;
    this._rng  = new Random(seed);
    /** @type {number[]} */
    this.means = [];
  }

  /** Preset info for the current distribution. */
  get distInfo() { return DISTRIBUTIONS.find(d => d.id === this.dist); }

  /** Theoretical standard error of the mean (null for Cauchy). */
  get SE() {
    const info = this.distInfo;
    if (info.sigma === null) return null;
    return info.sigma / Math.sqrt(this.n);
  }

  /** Observed mean of sample means. */
  get observedMean() {
    if (this.means.length === 0) return 0;
    return this.means.reduce((s, v) => s + v, 0) / this.means.length;
  }

  /** Observed standard deviation of sample means (sample SD). */
  get observedSD() {
    if (this.means.length < 2) return 0;
    const mu = this.observedMean;
    return Math.sqrt(this.means.reduce((s, v) => s + (v - mu) ** 2, 0) / (this.means.length - 1));
  }

  /** Observed skewness (Fisher's g1). */
  observedSkewness() {
    const N = this.means.length;
    if (N < 3) return 0;
    const mu = this.observedMean;
    const sd = this.observedSD;
    if (sd === 0) return 0;
    const m3 = this.means.reduce((s, v) => s + (v - mu) ** 3, 0) / N;
    return m3 / (sd ** 3);
  }

  /** IQR of sample means. */
  observedIQR() {
    if (this.means.length === 0) return 0;
    const sorted = [...this.means].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    return q3 - q1;
  }

  /**
   * Run: reseed RNG and fill this.means with N sample means.
   */
  run() {
    this._rng = new Random(this.seed);
    this.means = [];
    for (let i = 0; i < this.N; i++) {
      this.means.push(this._sampleMean());
    }
  }

  /** Draw one observation from the current distribution. */
  draw() {
    return this._drawOne();
  }

  _sampleMean() {
    let sum = 0;
    for (let i = 0; i < this.n; i++) sum += this._drawOne();
    return sum / this.n;
  }

  _drawOne() {
    const rng = this._rng;
    switch (this.dist) {
      case 'uniform':     return rng.next();
      case 'exponential': return -Math.log(rng.next() || 1e-300);  // Exp(1) by inversion
      case 'bernoulli':   return rng.next() < 0.5 ? 0 : 1;
      case 'chisq3':      return _chiSq3(rng);
      case 'cauchy':      return _cauchy(rng);
      default: return rng.next();
    }
  }

  /**
   * Histogram of sample means.
   * @param {number} [bins=40]
   * @returns {{ x: number, count: number, density: number }[]}
   */
  histogram(bins = 40) {
    if (this.means.length === 0) return [];
    const sorted = [...this.means].sort((a, b) => a - b);
    const lo = sorted[0], hi = sorted[sorted.length - 1];
    if (lo === hi) return [];
    const w = (hi - lo) / bins;
    const counts = new Array(bins).fill(0);
    for (const v of this.means) {
      const bi = Math.min(Math.floor((v - lo) / w), bins - 1);
      counts[bi]++;
    }
    const total = this.means.length;
    return counts.map((count, i) => ({
      x:       lo + (i + 0.5) * w,
      width:   w,
      count,
      density: count / (total * w),
    }));
  }

  /**
   * Theoretical N(μ, σ²/n) curve for the CLT distribution.
   * Returns null for Cauchy.
   * @param {number} [nPoints=200]
   */
  theoreticalCurve(nPoints = 200) {
    const info = this.distInfo;
    if (info.sigma === null) return null;
    const mu = info.mu, se = this.SE;
    if (this.means.length === 0) return [];
    const sorted = [...this.means].sort((a, b) => a - b);
    const lo = sorted[0] - se * 2, hi = sorted[sorted.length - 1] + se * 2;
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const x   = lo + (hi - lo) * i / (nPoints - 1);
      const pdf = Math.exp(-0.5 * ((x - mu) / se) ** 2) / (se * Math.sqrt(2 * Math.PI));
      pts.push({ x, pdf });
    }
    return pts;
  }

  /**
   * P(X̄ < x) using the exact Erlang distribution for Exponential(1) sample means.
   * X̄_n = (X₁+…+Xn)/n where Xi~Exp(1).  Sum ~ Gamma(n,1) → X̄ ~ Gamma(n, n).
   * P(X̄ < x) = P(Gamma(n,1) < n·x) = regularised lower incomplete gamma P(n, n·x).
   * Computed via series: P(a, x) = e^{-x} · x^a / Γ(a) · Σ_{k=0}^∞ x^k / Γ(a+k+1)/Γ(a)
   *
   * Reference: DLMF 8.7 — regularised incomplete gamma via series.
   * @param {number} n   sample size
   * @param {number} x   value (must be > 0)
   * @returns {number}  P(X̄ < x)
   */
  static erlangCDF(n, x) {
    // P(X̄ < x) = P(Gamma(n,1) < n·x) = P(a=n, t=n·x) lower incomplete gamma
    const a = n;
    const t = n * x;
    if (t <= 0) return 0;
    // Series: P(a, t) = e^{-t} · t^a / a! · Σ_{k=0}^∞ t^k / (a+1)(a+2)...(a+k)
    // = e^{-t} · t^a / Γ(a+1) · Σ (t/a+1)(t/a+2)...
    // Recurrence: term_0 = 1; term_{k+1} = term_k · t/(a+k+1)
    let term = 1;
    let sum  = 1;
    for (let k = 0; k < 300; k++) {
      term *= t / (a + k + 1);
      sum  += term;
      if (term < sum * 1e-15) break;
    }
    // P(a, t) = e^{-t} · t^a / Γ(a+1) · sum
    // = e^{-t} · t^a / a! · sum  (for integer a)
    // log form to avoid overflow:
    let logFact = 0;
    for (let k = 1; k <= a; k++) logFact += Math.log(k);
    return Math.exp(-t + a * Math.log(t) - logFact) * sum;
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/** Chi-squared(3) = sum of 3 standard normals squared. */
function _chiSq3(rng) {
  let s = 0;
  for (let k = 0; k < 3; k++) {
    const z = rng.normalSeeded();
    s += z * z;
  }
  return s;
}

/** Cauchy(0,1) by inversion: tan(π(U−0.5)). */
function _cauchy(rng) {
  const u = rng.next();
  return Math.tan(Math.PI * (u - 0.5));
}
