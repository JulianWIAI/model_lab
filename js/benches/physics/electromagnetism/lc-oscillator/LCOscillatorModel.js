/**
 * LCOscillatorModel — series RLC (underdamped/critical/overdamped).
 *
 * Three distinct frequencies:
 *   Free-ringing ωd = √(ω₀²−α²)     — natural mode of unforced oscillator
 *   Current peak  ω₀ = 1/√(LC)       — AC resonance (maximum |I|)
 *   V_C peak      ωC = √(ω₀²−2α²)   — max |V_C(jω)|, null when Q < 1/√2
 *
 * Step response (unit step V_in, V_C(0)=0, I(0)=0):
 *   Underdamped: V_C(t) = 1 − e^(−αt)[cos(ωd·t) + (α/ωd)·sin(ωd·t)]
 *   Critical:    V_C(t) = 1 − (1 + α·t)·e^(−αt)
 *   Overdamped:  V_C(t) = 1 + [s₂·e^(s₁t) − s₁·e^(s₂t)] / (s₁ − s₂)
 *                         where s₁,₂ = −α ± √(α²−ω₀²)
 *
 * References: Heaviside (1894); Landau & Lifshitz, Mechanics §22.
 * All formulas algebraic — no uncertain empirical constants.
 */
import { Integrators } from '../../../../core/Integrators.js';

export class LCOscillatorModel {
  /**
   * @param {object} opts
   * @param {number} opts.R  resistance, Ω  (R > 0)
   * @param {number} opts.L  inductance, H  (L > 0)
   * @param {number} opts.C  capacitance, F (C > 0)
   */
  constructor({ R, L, C }) {
    if (R <= 0) throw new RangeError('R must be positive');
    if (L <= 0) throw new RangeError('L must be positive');
    if (C <= 0) throw new RangeError('C must be positive');
    this.R = R;
    this.L = L;
    this.C = C;
  }

  /** Damping coefficient α = R/(2L)  [rad/s] */
  alpha() { return this.R / (2 * this.L); }

  /** Natural (undamped) angular frequency ω₀ = 1/√(LC)  [rad/s] */
  omega0() { return 1 / Math.sqrt(this.L * this.C); }

  /** Quality factor Q = √(L/C) / R  (dimensionless) */
  Q() { return Math.sqrt(this.L / this.C) / this.R; }

  /**
   * Damped natural frequency ωd = √(ω₀²−α²)  [rad/s]
   * Returns null for overdamped or critically damped circuits.
   */
  omegaDamped() {
    const w0 = this.omega0();
    const a  = this.alpha();
    if (this.dampingRegime() !== 'underdamped') return null;
    return Math.sqrt(w0 * w0 - a * a);
  }

  /**
   * Frequency at which |V_C(jω)| is maximum: ωC = √(ω₀²−2α²)  [rad/s]
   * Returns null when Q < 1/√2  (i.e. α > ω₀/√2).
   */
  omegaVcPeak() {
    const w0 = this.omega0();
    const a  = this.alpha();
    const arg = w0 * w0 - 2 * a * a;
    if (arg <= 0) return null;
    return Math.sqrt(arg);
  }

  /** Half-power (impedance) bandwidth = R/L = 2α  [rad/s] */
  bandwidth() { return this.R / this.L; }

  /** Critical damping resistance R_crit = 2√(L/C)  [Ω] */
  criticalDamping() { return 2 * Math.sqrt(this.L / this.C); }

  /**
   * Damping regime.
   * Critical is declared when |α − ω₀| / ω₀ < 1e-9.
   * @returns {'underdamped'|'critical'|'overdamped'}
   */
  dampingRegime() {
    const w0 = this.omega0();
    const a  = this.alpha();
    if (Math.abs(a - w0) / w0 < 1e-9) return 'critical';
    if (a < w0) return 'underdamped';
    return 'overdamped';
  }

  /**
   * Closed-form V_C(t) for a unit step input of amplitude V0.
   * V_C(0) = 0, I(0) = 0.
   *
   * @param {number} t   time [s]
   * @param {number} [V0=1]  step amplitude [V]
   * @returns {number}
   */
  stepResponseVc(t, V0 = 1) {
    const a  = this.alpha();
    const w0 = this.omega0();
    const regime = this.dampingRegime();

    if (t === 0) return 0;

    if (regime === 'underdamped') {
      const wd = Math.sqrt(w0 * w0 - a * a);
      return V0 * (1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t)));
    }

    if (regime === 'critical') {
      return V0 * (1 - (1 + a * t) * Math.exp(-a * t));
    }

    // Overdamped: real distinct poles s1, s2 = −α ± √(α²−ω₀²)
    const sq = Math.sqrt(a * a - w0 * w0);
    const s1 = -a + sq;   // less negative
    const s2 = -a - sq;   // more negative
    // V_C(t) = V0 · [1 + (s2·e^(s1·t) − s1·e^(s2·t)) / (s1 − s2)]
    return V0 * (1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2));
  }

  /**
   * Simulate the step response using RK4.
   * State vector: [V_C, I]
   * Equations:   dV_C/dt = I/C,   dI/dt = (Vin − R·I − V_C) / L
   *
   * @param {number} tMax    end time [s]
   * @param {number} [nPoints=300]  number of output samples
   * @param {number} [V0=1]  step amplitude [V]
   * @returns {{ t: number, Vc: number, I: number }[]}
   */
  simulate(tMax, nPoints = 300, V0 = 1) {
    const { R, L, C } = this;
    const Vin = V0;
    const f = ([Vc, I]) => [I / C, (Vin - R * I - Vc) / L];

    const dt  = tMax / (nPoints - 1);
    let   y   = [0, 0];
    let   t   = 0;
    const pts = [{ t: 0, Vc: 0, I: 0 }];

    for (let i = 1; i < nPoints; i++) {
      y  = Integrators.rk4(f, y, t, dt);
      t += dt;
      pts.push({ t, Vc: y[0], I: y[1] });
    }
    return pts;
  }

  /**
   * Frequency response magnitude |V_C(jω)| / V_in.
   * |H_C(jω)| = ω₀² / √((ω₀²−ω²)² + (2α·ω)²)
   *
   * @param {number} omega  angular frequency [rad/s]
   * @returns {number}
   */
  frequencyResponse(omega) {
    const w0 = this.omega0();
    const a  = this.alpha();
    const num = w0 * w0;
    const dw  = w0 * w0 - omega * omega;
    const den = Math.sqrt(dw * dw + (2 * a * omega) ** 2);
    return num / den;
  }
}
