/**
 * MaxwellBoltzmannModel — Maxwell–Boltzmann speed distribution.
 *
 * Speed distribution for an ideal gas:
 *   f(v) = 4π · (M / (2πRT))^(3/2) · v² · exp(−Mv² / (2RT))
 *
 *   v      — molecular speed (m/s)
 *   M      — molar mass (kg/mol)
 *   R      — gas constant (J mol⁻¹ K⁻¹)
 *   T      — temperature (K)
 *   f(v)   — probability density ((m/s)⁻¹); ∫₀^∞ f(v) dv = 1
 *
 * Characteristic speeds:
 *   v_p    (most probable) = √(2RT/M)
 *   v_mean (mean)          = √(8RT/πM)
 *   v_rms  (root mean sq.) = √(3RT/M)
 *   Ratio: v_p : v_mean : v_rms = 1 : √(4/π) : √(3/2)
 *                               ≈ 1 : 1.1284  : 1.2247
 *
 * Molar masses (g/mol) — CIAAW 2024 abridged standard atomic weights:
 *   N (14.007), O (15.999), C (12.011), He (4.0026)
 *   Ar: 39.95  (CIAAW 2024 abridged; note wide interval 39.792–39.963 due to
 *               isotopic variation; 39.95 is the conventional abridged value)
 *
 * Reference for the distribution:
 *   J. C. Maxwell (1860). Illustrations of the dynamical theory of gases.
 *   Phil. Mag. 19, 19–32; 20, 21–37.
 *   L. Boltzmann (1871). Über das Wärmegleichgewicht zwischen mehratomigen
 *   Gasmolekülen. Wien. Ber. 63, 397–418.
 *
 * R from CONSTANTS (NIST CODATA 2018, exact by SI definition).
 */

import { CONSTANTS } from '../../../../data/constants.js';

const R = CONSTANTS.R.value;   // 8.314 462 618 J mol⁻¹ K⁻¹

/** Gas presets. Molar masses in kg/mol from CIAAW 2024 abridged values. */
export const GAS_PRESETS = Object.freeze({
  He:  { label: 'He',  M: 4.0026e-3,  source: 'CIAAW 2024' },
  N2:  { label: 'N₂',  M: 28.014e-3,  source: 'CIAAW 2024 (2 × N 14.007)' },
  O2:  { label: 'O₂',  M: 31.998e-3,  source: 'CIAAW 2024 (2 × O 15.999)' },
  Ar:  { label: 'Ar',  M: 39.95e-3,   source: 'CIAAW 2024 (conventional abridged; interval 39.792–39.963)' },
  CO2: { label: 'CO₂', M: 44.009e-3,  source: 'CIAAW 2024 (C 12.011 + 2 × O 15.999)' },
});

export class MaxwellBoltzmannModel {
  /**
   * @param {{ M?: number, T?: number }} options
   *   M  molar mass in kg/mol (default N₂)
   *   T  temperature in K
   */
  constructor({ M = GAS_PRESETS.N2.M, T = 300 } = {}) {
    this.M = M;   // kg/mol
    this.T = T;   // K
  }

  /**
   * Maxwell–Boltzmann probability density f(v) at speed v (m/s).
   * @param {number} v  speed (m/s)
   * @returns {number}  f(v) in s/m
   */
  f(v) {
    if (v <= 0) return 0;
    const a = this.M / (2 * R * this.T);
    return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v);
  }

  /** Most probable speed v_p = √(2RT/M) (m/s). */
  get vp() { return Math.sqrt(2 * R * this.T / this.M); }

  /** Mean speed v_mean = √(8RT/(πM)) (m/s). */
  get vmean() { return Math.sqrt(8 * R * this.T / (Math.PI * this.M)); }

  /** Root-mean-square speed v_rms = √(3RT/M) (m/s). */
  get vrms() { return Math.sqrt(3 * R * this.T / this.M); }

  /**
   * Generate f(v) vs v curve from 0 to vMax.
   * @param {number} [vMax]   upper speed limit; defaults to 4 × v_rms
   * @param {number} [nPts=400]
   * @returns {Array<{v: number, f: number}>}
   */
  curve(vMax, nPts = 400) {
    const limit = vMax ?? (4 * this.vrms);
    const pts = [];
    for (let i = 0; i < nPts; i++) {
      const v = limit * (i / (nPts - 1));
      pts.push({ v, f: this.f(v) });
    }
    return pts;
  }

  /**
   * Numerical normalisation check: ∫₀^vMax f(v) dv via trapezoidal rule.
   * @param {number} [vMax]  defaults to 6 × v_rms
   * @param {number} [n=2000]
   * @returns {number}  should be ≈ 1.0
   */
  integrate(vMax, n = 2000) {
    const limit = vMax ?? (6 * this.vrms);
    const dv = limit / n;
    let sum = 0;
    for (let i = 0; i <= n; i++) {
      const v = dv * i;
      const w = (i === 0 || i === n) ? 0.5 : 1;
      sum += w * this.f(v);
    }
    return sum * dv;
  }
}
