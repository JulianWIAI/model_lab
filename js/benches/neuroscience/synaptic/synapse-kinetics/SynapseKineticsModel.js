/**
 * SynapseKineticsModel — alpha-function synaptic current.
 *
 * h(t) = A · (t/τ) · e^{-t/τ}
 *
 * Properties:
 *   peak at t=τ: h(τ) = A·e^{-1}
 *   ∫₀^∞ h dt = A·τ
 */
import { RootFinding } from '../../../../core/RootFinding.js';

export class SynapseKineticsModel {
  /**
   * @param {{ tau?: number, A?: number }} opts
   *   tau: time constant in ms (default 5, domain [0.5, 150])
   *   A:   amplitude (default 1.0)
   */
  constructor({ tau = 5.0, A = 1.0 } = {}) {
    if (tau < 0.5 || tau > 150) {
      throw new RangeError(`SynapseKineticsModel: tau must be in [0.5, 150] ms, got ${tau}`);
    }
    if (A <= 0) {
      throw new RangeError(`SynapseKineticsModel: A must be > 0, got ${A}`);
    }
    this.tau = tau;
    this.A = A;
  }

  /**
   * Alpha function h(t) = A·(t/τ)·e^{-t/τ}.
   * @param {number} t  time in ms
   * @returns {number}
   */
  h(t) {
    if (t <= 0) return 0;
    const x = t / this.tau;
    return this.A * x * Math.exp(-x);
  }

  /** Peak time = τ */
  get tPeak() {
    return this.tau;
  }

  /** Peak value = A·e^{-1} */
  get hPeak() {
    return this.A * Math.exp(-1);
  }

  /**
   * Analytical integral ∫₀^∞ h dt = A·τ.
   * @returns {number}
   */
  integral() {
    return this.A * this.tau;
  }

  /**
   * Time at which h falls to hPeak/e = A·e^{-2}.
   * Solves x·e^{-x} = e^{-2} for x = t/τ on [2, 10].
   * x ≈ 3.1462, so t = x·τ.
   * @returns {number}  in ms
   */
  halfDecayTime() {
    const target = Math.exp(-2);
    const x = RootFinding.brent(
      x => x * Math.exp(-x) - target,
      2, 10,
      1e-12
    );
    return x * this.tau;
  }

  /**
   * Time-series of h(t).
   * @param {{ tMax?: number, nPoints?: number }} opts
   * @returns {{ t: number, h: number }[]}
   */
  curve({ tMax = 5 * this.tau, nPoints = 300 } = {}) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const t = (tMax * i) / (nPoints - 1);
      pts.push({ t, h: this.h(t) });
    }
    return pts;
  }
}
