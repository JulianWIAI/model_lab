/**
 * SolowModel — Solow-Swan growth model.
 *
 * Capital accumulation (per effective worker):
 *   k̇ = s·A·k^α − (n + δ + g)·k
 *
 * where g is the LABOUR-AUGMENTING (TFP) growth rate.
 * Steady state k̇=0: k* = (s·A / (n+δ+g))^{1/(1−α)}
 *
 * Golden rule: max c* = y* − (n+δ+g)·k* over k →
 *   s_GR = α  (for Cobb-Douglas production; any A)
 *   k_GR = (α·A / (n+δ+g))^{1/(1−α)}
 *
 * Exact linearization (z = k^{1−α}):
 *   ż = −μ·(z − z*),  μ = (1−α)·(n+δ+g)
 *
 * With α=1/3, s=0.3, A=1, n=0.01, δ=0.05, g=0:
 *   k* = 5√5 ≈ 11.18034, y* = √5, c* = 0.7√5,
 *   k_GR = (50/9)^{3/2} ≈ 13.09457, c_GR = 10√2/9, s_GR = 1/3.
 */
import { Integrators } from '../../../../core/Integrators.js';

export class SolowModel {
  /**
   * @param {{s?: number, alpha?: number, A?: number, n?: number, delta?: number, g?: number}} [opts]
   * @throws {RangeError} for α∉(0,1), s∉[0,1), n+δ+g≤0
   */
  constructor({
    s     = 0.3,
    alpha = 1/3,
    A     = 1.0,
    n     = 0.01,
    delta = 0.05,
    g     = 0.0,
  } = {}) {
    if (alpha <= 0 || alpha >= 1) {
      throw new RangeError(`SolowModel: alpha must be in (0,1); got ${alpha}`);
    }
    if (s < 0 || s >= 1) {
      throw new RangeError(`SolowModel: s must be in [0,1); got ${s}`);
    }
    if (n + delta + g <= 0) {
      throw new RangeError(`SolowModel: n+δ+g must be > 0; got ${n + delta + g}`);
    }
    this.s     = s;
    this.alpha = alpha;
    this.A     = A;
    this.n     = n;
    this.delta = delta;
    this.g     = g;
    this._denom = n + delta + g;
  }

  /** y(k) = A·k^α */
  _y(k) { return this.A * Math.pow(k, this.alpha); }

  /**
   * dk/dt = s·y(k) − (n+δ+g)·k
   * @param {number} k
   * @returns {number}
   */
  dk(k) {
    return this.s * this._y(k) - this._denom * k;
  }

  /**
   * Steady-state capital, output, and consumption per effective worker.
   * @returns {{kStar: number, yStar: number, cStar: number}}
   */
  steadyState() {
    const kStar = Math.pow(this.s * this.A / this._denom, 1 / (1 - this.alpha));
    const yStar = this._y(kStar);
    const cStar = (1 - this.s) * yStar;
    return { kStar, yStar, cStar };
  }

  /**
   * Golden rule: savings rate s_GR = α, and corresponding k_GR, c_GR.
   * @returns {{sGR: number, kGR: number, cGR: number}}
   */
  goldenRule() {
    const sGR = this.alpha;   // always equals α for Cobb-Douglas
    const kGR = Math.pow(this.alpha * this.A / this._denom, 1 / (1 - this.alpha));
    const yGR = this._y(kGR);
    const cGR = yGR - this._denom * kGR;
    return { sGR, kGR, cGR };
  }

  /**
   * Simulate via RK4.
   * @param {number} k0  initial capital per effective worker
   * @param {number} T   time horizon
   * @param {number} dt  step size
   * @returns {Array<{t: number, k: number, y: number, c: number}>}
   */
  simulate(k0, T, dt = 1) {
    const f = ([k]) => [this.dk(k)];
    const nSteps = Math.round(T / dt);
    const result = [];
    let state = [k0];
    let t = 0;
    result.push({ t, k: state[0], y: this._y(state[0]), c: (1 - this.s) * this._y(state[0]) });
    for (let i = 0; i < nSteps; i++) {
      state = Integrators.rk4(f, state, t, dt);
      t += dt;
      result.push({ t, k: state[0], y: this._y(state[0]), c: (1 - this.s) * this._y(state[0]) });
    }
    return result;
  }
}
