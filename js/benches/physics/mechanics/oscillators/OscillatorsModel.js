/**
 * OscillatorsModel — driven damped harmonic oscillator.
 *
 * Equation of motion (per unit mass):
 *   ẍ + 2γẋ + ω₀²x = F₀·cos(ωt)             [rad²/s², m/s²]
 *
 * Steady-state amplitude (closed form):
 *   A(ω) = F₀ / √((ω₀²−ω²)² + (2γω)²)       [m]
 *
 * Phase lag of displacement behind force:
 *   φ(ω) = atan2(2γω, ω₀²−ω²)               [rad]
 *
 * Displacement resonance (exists only for γ < ω₀/√2):
 *   ω_r = √(ω₀²−2γ²)                         [rad/s]
 *
 * Velocity amplitude peaks exactly at ω₀ (independent of γ).
 *
 * Quality factor: Q = ω₀/(2γ)
 *
 * Log decrement (free decay): δ_log = 2πγ/ω_d  [dimensionless]
 *   Successive same-side peak ratio: r = exp(−2πγ/ω_d)
 *
 * Critical damping γ = ω₀: x(t) = (1 + ω₀·t)·e^(−ω₀·t) [x0=1, v0=0]
 *   → x(1/ω₀) = 2/e = 0.735759 ±1e-6
 *
 * Free decay (underdamped, no driving): x(t) = e^(−γt)·[x0·cos(ω_d·t) + ((v0+γ·x0)/ω_d)·sin(ω_d·t)]
 *
 * Reference: Landau & Lifshitz, Mechanics, §22.
 * Status: formulas anchor-derived, test planned; no empirical constants.
 */
import { Integrators } from '../../../../core/Integrators.js';

export class OscillatorsModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.omega0=1]   natural frequency ω₀ [rad/s]
   * @param {number} [opts.gamma=0.1]  damping coefficient γ [s⁻¹]
   * @param {number} [opts.F0=0.5]     driving amplitude F₀ [m/s²]
   * @param {number} [opts.omega=1]    driving frequency ω [rad/s]
   * @param {number} [opts.x0=1]       initial displacement [m]
   * @param {number} [opts.v0=0]       initial velocity [m/s]
   */
  constructor({ omega0 = 1, gamma = 0.1, F0 = 0.5, omega = 1, x0 = 1, v0 = 0 } = {}) {
    this.omega0 = omega0;
    this.gamma = gamma;
    this.F0 = F0;
    this.omega = omega;
    this.x0 = x0;
    this.v0 = v0;
  }

  /** Quality factor Q = ω₀/(2γ) */
  get Q() { return this.omega0 / (2 * this.gamma); }

  /** Damped natural frequency ω_d = √(ω₀²−γ²)  [rad/s]; NaN if overdamped */
  get omegaD() {
    const d2 = this.omega0 ** 2 - this.gamma ** 2;
    return d2 > 0 ? Math.sqrt(d2) : NaN;
  }

  /** Displacement resonance frequency ω_r = √(ω₀²−2γ²); NaN if γ ≥ ω₀/√2 */
  get omegaR() {
    const d2 = this.omega0 ** 2 - 2 * this.gamma ** 2;
    return d2 > 0 ? Math.sqrt(d2) : NaN;
  }

  /**
   * Steady-state displacement amplitude at driving frequency ω.
   * A(ω) = F₀ / √((ω₀²−ω²)² + (2γω)²)
   * @param {number} [omega]  defaults to this.omega
   */
  amplitude(omega = this.omega) {
    const denom = Math.sqrt(
      (this.omega0 ** 2 - omega ** 2) ** 2 + (2 * this.gamma * omega) ** 2
    );
    return this.F0 / denom;
  }

  /**
   * Phase lag φ = atan2(2γω, ω₀²−ω²)  [rad]
   * @param {number} [omega]
   */
  phase(omega = this.omega) {
    return Math.atan2(2 * this.gamma * omega, this.omega0 ** 2 - omega ** 2);
  }

  /**
   * Log decrement δ = 2πγ/ω_d  [dimensionless].
   * Successive same-side peak amplitude ratio = exp(−δ).
   */
  get logDecrement() {
    const od = this.omegaD;
    return isNaN(od) ? NaN : 2 * Math.PI * this.gamma / od;
  }

  /**
   * Amplitude vs frequency curve for the resonance plot.
   * @param {number} omegaMax
   * @param {number} [nPoints=300]
   * @returns {{ omega: number, A: number }[]}
   */
  amplitudeCurve(omegaMax, nPoints = 300) {
    const pts = [];
    for (let i = 0; i <= nPoints; i++) {
      const w = (omegaMax / nPoints) * i;
      pts.push({ omega: w, A: this.amplitude(w) });
    }
    return pts;
  }

  /**
   * Integrate the driven oscillator from t=0 using RK4.
   * State vector: [x, v]; equation: ẋ = v, v̇ = −ω₀²x − 2γv + F₀cos(ωt)
   * @param {number} tEnd
   * @param {number} [dt=0.01]
   * @returns {{ t: number[], x: number[], v: number[] }}
   */
  simulate(tEnd, dt = 0.01) {
    const { omega0, gamma, F0, omega: driveOmega } = this;
    const f = ([px, pv], ti) => [
      pv,
      -(omega0 ** 2) * px - 2 * gamma * pv + F0 * Math.cos(driveOmega * ti),
    ];

    let state = [this.x0, this.v0], t = 0;
    const ts = [0], xs = [this.x0], vs = [this.v0];
    const N = Math.round(tEnd / dt);
    for (let i = 0; i < N; i++) {
      state = Integrators.rk4(f, state, t, dt);
      t += dt;
      ts.push(t);
      xs.push(state[0]);
      vs.push(state[1]);
    }
    return { t: ts, x: xs, v: vs };
  }

  /**
   * Free-decay exact solution (underdamped, γ < ω₀).
   * x(t) = e^(−γt)·[x0·cos(ω_d·t) + ((v0+γ·x0)/ω_d)·sin(ω_d·t)]
   * @param {number} t
   */
  freeDecayExact(t) {
    const od = this.omegaD;
    if (isNaN(od)) return NaN;
    return Math.exp(-this.gamma * t) * (
      this.x0 * Math.cos(od * t) +
      ((this.v0 + this.gamma * this.x0) / od) * Math.sin(od * t)
    );
  }
}
