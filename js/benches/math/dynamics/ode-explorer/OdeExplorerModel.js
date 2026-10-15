/**
 * OdeExplorerModel — numerical ODE integrators on four preset equations.
 *
 * Presets:
 *   'decay'    y' = −y,          y(0) = 1.  Exact: e^(−t)
 *   'growth'   y' = y,           y(0) = 0.5. Exact: 0.5·e^t
 *   'logistic' y' = y·(1 − y),   y(0) = 0.1. Exact: 1/(1+(1/y0−1)e^(−t))
 *   'stiff'    y' = −λ·y,        y(0) = 1.  Exact: e^(−λt)
 *
 * Methods: euler, heun, rk4, backwardEuler (stiff preset only).
 *
 * Convergence: global error at t=1 for h in {0.1, 0.05, 0.025}.
 * Log-log slope p = log(e(h1)/e(h3)) / log(h1/h3) gives observed order.
 *
 * RK4 stability limit on real axis: λh < 2.785294 (root of |p(−z)|=1,
 * p(z)=1+z+z²/2+z³/6+z⁴/24).  Euler: λh < 2.
 *
 * Reference: Hairer, Nørsett & Wanner, Solving ODEs I, §IV.2.
 * Status: formulas anchor-derived; no empirical constants.
 */
import { Integrators } from '../../../../core/Integrators.js';

/** RK4 stability polynomial evaluated at z (z = −λh, z ≤ 0 for decay). */
function rk4StabilityPoly(z) {
  return 1 + z + z * z / 2 + z * z * z / 6 + z * z * z * z / 24;
}

export class OdeExplorerModel {
  /**
   * @param {object} [opts]
   * @param {'decay'|'growth'|'logistic'|'stiff'} [opts.preset='decay']
   * @param {'euler'|'heun'|'rk4'|'backwardEuler'} [opts.method='rk4']
   * @param {number} [opts.h=0.1]   step size
   * @param {number} [opts.lambda=100]  stiff preset: decay constant (s⁻¹)
   */
  constructor({ preset = 'decay', method = 'rk4', h = 0.1, lambda = 100 } = {}) {
    this.preset = preset;
    this.method = method;
    this.h = h;
    this.lambda = lambda;
  }

  /** Derivative function f(y, t) for the current preset. Returns array [dy]. */
  _f() {
    switch (this.preset) {
      case 'decay':    return ([y]) => [-y];
      case 'growth':   return ([y]) => [y];
      case 'logistic': return ([y]) => [y * (1 - y)];
      case 'stiff':    return ([y]) => [-this.lambda * y];
      default: throw new Error(`Unknown preset: ${this.preset}`);
    }
  }

  /** Initial condition y(0). */
  _y0() {
    switch (this.preset) {
      case 'decay':    return [1];
      case 'growth':   return [0.5];
      case 'logistic': return [0.1];
      case 'stiff':    return [1];
      default: return [1];
    }
  }

  /**
   * Exact solution at time t.
   * @param {number} t
   * @returns {number}
   */
  exact(t) {
    switch (this.preset) {
      case 'decay':    return Math.exp(-t);
      case 'growth':   return 0.5 * Math.exp(t);
      case 'logistic': { const y0 = 0.1; return 1 / (1 + (1 / y0 - 1) * Math.exp(-t)); }
      case 'stiff':    return Math.exp(-this.lambda * t);
      default: return NaN;
    }
  }

  /** Stepper function for the current method. */
  _stepper() {
    switch (this.method) {
      case 'euler':         return Integrators.euler.bind(Integrators);
      case 'heun':          return Integrators.heun.bind(Integrators);
      case 'rk4':           return Integrators.rk4.bind(Integrators);
      case 'backwardEuler': return Integrators.backwardEuler.bind(Integrators);
      default: throw new Error(`Unknown method: ${this.method}`);
    }
  }

  /**
   * Integrate from t=0 to tEnd using current h and method.
   * @param {number} tEnd
   * @returns {{ t: number[], y: number[] }} arrays of time and y values
   */
  integrate(tEnd = 5) {
    const f = this._f();
    const stepper = this._stepper();
    const N = Math.max(1, Math.round(tEnd / this.h));
    const ts = [0];
    const ys = [this._y0()[0]];
    let y = this._y0();
    let t = 0;
    for (let i = 0; i < N; i++) {
      y = stepper(f, y, t, this.h);
      t += this.h;
      ts.push(t);
      ys.push(y[0]);
    }
    return { t: ts, y: ys };
  }

  /**
   * Global error at t=1 using a given step size h.
   * Used for log-log convergence plot.
   * @param {number} h  step size
   * @returns {number} |y_numerical(1) - exact(1)|
   */
  globalError(h) {
    const f = this._f();
    const stepper = this._stepper();
    const N = Math.round(1 / h);
    let y = this._y0();
    let t = 0;
    for (let i = 0; i < N; i++) {
      y = stepper(f, y, t, h);
      t += h;
    }
    return Math.abs(y[0] - this.exact(1));
  }

  /**
   * Convergence data: errors and log-log slope over h = {0.1, 0.05, 0.025}.
   * @returns {{ hs: number[], errors: number[], slope: number }}
   */
  convergence() {
    const hs = [0.1, 0.05, 0.025];
    const errors = hs.map(h => this.globalError(h));
    const slope = Math.log(errors[0] / errors[2]) / Math.log(hs[0] / hs[2]);
    return { hs, errors, slope };
  }

  /**
   * RK4 stability limit on the real axis: largest λh for which the method is stable.
   * Computed by bisection on |p(−z)|=1 where p is the RK4 stability polynomial.
   * @returns {number} ≈ 2.785294
   */
  static rk4StabilityLimit() {
    // |p(−z)| = 1 at z ≈ 2.785294; for z > this, |p(−z)| > 1 (unstable)
    // Bisect on |p(−z)| - 1 = 0, starting from bracket [2.5, 3.0]
    let lo = 2.5, hi = 3.0;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (Math.abs(rk4StabilityPoly(-mid)) < 1) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
}
