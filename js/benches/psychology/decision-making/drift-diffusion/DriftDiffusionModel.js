/**
 * DriftDiffusionModel — Wiener process with drift, absorbing boundaries ±a.
 *
 * Backward Kolmogorov equations give closed-form solutions:
 *
 *   P+(0) = 1 / (1 + exp(−2μa/σ²))                     [upper boundary probability]
 *   E[T|0] = (a/μ) · tanh(μa/σ²)                        [mean first-passage time]
 *            → a²/σ²  as μ → 0   (L'Hôpital limit)
 *   RT_mean = E[T] + t₀
 *
 * μ=0 limit handled analytically: E[T] = a²/σ² (no 0/0).
 *
 * BGK boundary correction for discrete simulation:
 *   Effective absorbed earlier by ≈ 0.5826·σ·√dt per step.
 *   (Broadie, Glasserman & Kou 1997 — cited, not fetched)
 *
 * References:
 *   Ratcliff (1978) Psychological Review 85:59–108.
 *   Bogacz et al. (2006) Psychological Review 113:700–765.
 */
import { Random } from '../../../../core/Random.js';

export class DriftDiffusionModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.mu=1]   drift rate μ
   * @param {number} [opts.sigma=1] noise σ > 0
   * @param {number} [opts.a=1]    boundary (half-range) > 0
   * @param {number} [opts.t0=0.3] non-decision time ≥ 0
   */
  constructor({ mu = 1, sigma = 1, a = 1, t0 = 0.3 } = {}) {
    if (sigma <= 0) throw new RangeError(`sigma must be > 0; got ${sigma}`);
    if (a <= 0)     throw new RangeError(`a must be > 0; got ${a}`);
    this.mu    = mu;
    this.sigma = sigma;
    this.a     = a;
    this.t0    = t0;
  }

  set sigma(v) {
    if (v <= 0) throw new RangeError(`sigma must be > 0; got ${v}`);
    this._sigma = v;
  }
  get sigma() { return this._sigma; }

  set a(v) {
    if (v <= 0) throw new RangeError(`a must be > 0; got ${v}`);
    this._a = v;
  }
  get a() { return this._a; }

  /**
   * P(upper boundary hit | start=0).
   * Closed form from backward Kolmogorov equation.
   * μ=0 limit: 0.5 (exact).
   */
  get pUpper() {
    const { mu, _sigma: s, _a: a } = this;
    if (mu === 0) return 0.5;
    return 1 / (1 + Math.exp(-2 * mu * a / s ** 2));
  }

  /**
   * Mean first-passage time E[T] (excluding t₀).
   * μ=0: a²/σ²  (analytical limit, not the 0/0 form).
   */
  get meanFPT() {
    const { mu, _sigma: s, _a: a } = this;
    if (mu === 0) return a ** 2 / s ** 2;
    // Use L'Hôpital-safe form: (a/μ)·tanh(μa/σ²)
    const z = mu * a / s ** 2;
    return (a / mu) * Math.tanh(z);
  }

  /** Mean response time RT = E[T] + t₀. */
  get rtMean() { return this.meanFPT + this.t0; }

  /**
   * Simulate N SDE trials with Euler-Maruyama, dt step.
   * Returns { pUpper: number, rtMean: number } from simulation.
   * Uses seeded PRNG for reproducibility.
   * @param {number} [N=5000]
   * @param {number} [dt=0.001]
   * @param {number} [seed=42]
   */
  simulate(N = 5000, dt = 0.001, seed = 42) {
    const { mu, _sigma: s, _a: a, t0 } = this;
    const rng    = new Random(seed);
    const sqrtDt = Math.sqrt(dt);
    let upperHits = 0, totalRT = 0;

    for (let trial = 0; trial < N; trial++) {
      let x = 0, t = 0;
      while (true) {
        x += mu * dt + s * sqrtDt * rng.normalSeeded();
        t += dt;
        if (x >= a)  { upperHits++; totalRT += t + t0; break; }
        if (x <= -a) {              totalRT += t + t0; break; }
        if (t > 100) {              totalRT += t + t0; break; }  // safety
      }
    }
    return { pUpper: upperHits / N, rtMean: totalRT / N };
  }
}
