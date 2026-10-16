/**
 * PhasePlaneModel — 2D linear (and nonlinear) dynamical system.
 *
 * Linear:    ẋ = Ax
 * Nonlinear: ẋ = Ax + μ·r²·x  (radial term; ṙ = μr³)
 *
 * Classification uses τ-Δ diagram:
 *   τ = tr(A),  Δ = det(A),  disc = τ²−4Δ
 *
 * Exact solution for nonlinear radial: r(t) = r₀/√(1−2μr₀²t)
 *
 * References:
 *   Strogatz, S.H. (1994). Nonlinear Dynamics and Chaos §5.2.
 *   eigen2x2 from js/core/LinAlg.js (closed form, exact).
 */
import { eigen2x2 } from '../../../../core/LinAlg.js';
import { Integrators } from '../../../../core/Integrators.js';

export class PhasePlaneModel {
  /**
   * @param {object} [opts]
   * @param {number[][]} [opts.A=[[-1,-1],[1,-1]]]  2×2 system matrix
   * @param {number}     [opts.mu=0]                nonlinear gain
   */
  constructor({ A = [[-1, -1], [1, -1]], mu = 0 } = {}) {
    this.A  = A;
    this.mu = mu;
  }

  /** τ = tr(A) */
  get tau()  { return this.A[0][0] + this.A[1][1]; }

  /** Δ = det(A) */
  get det()  { return this.A[0][0] * this.A[1][1] - this.A[0][1] * this.A[1][0]; }

  /** disc = τ²−4Δ */
  get disc() { return this.tau ** 2 - 4 * this.det; }

  /**
   * Eigenvalues via eigen2x2 (closed form).
   * @returns {{ real: number[], imag: number[], repeated: boolean, defective: boolean }}
   */
  get eigenvalues() { return eigen2x2(this.A); }

  /**
   * Qualitative classification of the fixed point at origin.
   * Uses |Δ| < ε·max(1,‖A‖²) to detect near-zero determinant robustly against
   * floating-point rounding in decimal slider matrices (e.g. 0.1·0.9 ≠ 0.3·0.3 exactly).
   * @returns {string}
   */
  get classification() {
    const { tau, det: D, disc } = this;
    const A = this.A;
    const normA2 = A[0][0]**2 + A[0][1]**2 + A[1][0]**2 + A[1][1]**2;
    const eps = 1e-10 * Math.max(1, normA2);
    const detZero = Math.abs(D) < eps;

    if (!detZero && D < 0) return 'Saddle';
    if (detZero) {
      if (Math.abs(tau) < eps) return 'Fully degenerate';
      return 'Degenerate (zero eigenvalue)';
    }
    // D > eps: positive determinant
    if (Math.abs(tau) < eps) return 'Center';
    const { repeated, defective } = this.eigenvalues;
    if (repeated) {
      return defective
        ? (tau < 0 ? 'Stable improper node' : 'Unstable improper node')
        : (tau < 0 ? 'Stable star node'     : 'Unstable star node');
    }
    if (disc > 0) {
      // Real distinct eigenvalues
      return tau < 0 ? 'Stable node' : 'Unstable node';
    }
    // disc < 0: complex eigenvalues
    return tau < 0 ? 'Stable spiral' : 'Unstable spiral';
  }

  /**
   * Integrate an orbit using RK4.
   * @param {number[]} x0      initial condition [x, y]
   * @param {number}   tMax
   * @param {number}   [dt=2*Math.PI/1000]
   * @returns {{ t: number, x: number, y: number }[]}
   */
  orbit(x0, tMax, dt = tMax / 500) {
    const { A, mu } = this;
    const f = ([x, y]) => {
      const r2 = x * x + y * y;
      return [
        A[0][0] * x + A[0][1] * y + mu * r2 * x,
        A[1][0] * x + A[1][1] * y + mu * r2 * y,
      ];
    };
    const pts = [{ t: 0, x: x0[0], y: x0[1] }];
    let state = [...x0];
    let t = 0;
    const steps = Math.ceil(tMax / dt);
    for (let i = 0; i < steps; i++) {
      state = Integrators.rk4(f, state, t, dt);
      t += dt;
      pts.push({ t, x: state[0], y: state[1] });
      if (Math.hypot(state[0], state[1]) > 20) break;  // escape
    }
    return pts;
  }

  /**
   * Exact nonlinear radius r(t) = r₀/√(1−2μr₀²t).
   * Valid while 1−2μr₀²t > 0.
   * @param {number} r0  initial radius
   * @param {number} t
   */
  nonlinearRadius(r0, t) {
    const denom = 1 - 2 * this.mu * r0 * r0 * t;
    if (denom <= 0) return Infinity;
    return r0 / Math.sqrt(denom);
  }

  /**
   * Vector field sample for quiver plot.
   * @param {number} xRange  [-xRange, xRange]
   * @param {number} [nx=12]
   * @returns {{ x, y, dx, dy }[]}
   */
  vectorField(xRange = 2, nx = 12) {
    const pts = [];
    const { A, mu } = this;
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= nx; j++) {
        const x = -xRange + 2 * xRange * i / nx;
        const y = -xRange + 2 * xRange * j / nx;
        const r2 = x * x + y * y;
        const dx = A[0][0] * x + A[0][1] * y + mu * r2 * x;
        const dy = A[1][0] * x + A[1][1] * y + mu * r2 * y;
        pts.push({ x, y, dx, dy });
      }
    }
    return pts;
  }
}
