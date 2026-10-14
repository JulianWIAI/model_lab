/**
 * GibbsModel — Gibbs free energy as a function of temperature.
 *
 * Gibbs free energy change:
 *   ΔG(T) = ΔH − T·ΔS
 *
 *   ΔH  — standard enthalpy change (J/mol); positive = endothermic
 *   ΔS  — standard entropy change (J/mol/K); positive = more disorder in products
 *   T   — temperature (K)
 *   ΔG  — Gibbs free energy change (J/mol); ΔG < 0 → spontaneous
 *
 * Equilibrium constant:
 *   K(T) = exp(−ΔG°/RT) = exp(−(ΔH − T·ΔS)/(RT))
 *
 * Crossover temperature (ΔG = 0):
 *   T* = ΔH / ΔS   (valid only when ΔH and ΔS have the same sign)
 *
 * Approximation: ΔH and ΔS are treated as temperature-independent.
 * Real systems show Cp-dependent corrections (Kirchhoff's law); these are
 * small for modest temperature ranges (±100 K around a reference) but
 * non-negligible at larger ranges.
 *
 * Ice fusion preset:
 *   Reaction: H₂O(s) → H₂O(l)
 *   ΔH_fus = +6010 J/mol at 273.15 K
 *   Source: CODATA Key Values for Thermodynamics — Cox, J.D., Wagman, D.D.,
 *     and Medvedev, V.A. (1989). Hemisphere Publishing, New York. p. 1.
 *     (IUPAC-endorsed primary data compilation; value rounded to J/mol.)
 *
 *   T_fus = 273.15 K (standard melting point of ice at 1 atm)
 *
 *   ΔS_fus = ΔH_fus / T_fus = 6010 / 273.15 = 22.00 J/(mol·K)
 *   Note: ΔS_fus is DERIVED from ΔH_fus and T_fus via the Clausius relation
 *   ΔS = ΔH_fus/T_fus at equilibrium. It is not independently measured here.
 *
 * R from CONSTANTS (NIST CODATA 2018, exact by SI definition).
 */

import { CONSTANTS } from '../../../../data/constants.js';

const R = CONSTANTS.R.value;   // 8.314 462 618 J mol⁻¹ K⁻¹

/**
 * Ice fusion preset.
 * ΔS derived from ΔH / T_fus (Clausius relation at equilibrium).
 */
export const ICE_FUSION = Object.freeze((() => {
  const dH   = 6010;       // J/mol; CODATA Key Values (Cox et al. 1989)
  const Tfus = 273.15;     // K
  const dS   = dH / Tfus; // J/(mol·K); derived, not independently measured
  return { name: 'Ice fusion  H₂O(s)→H₂O(l)', dH, dS, Tfus };
})());

export class GibbsModel {
  /**
   * @param {{ dH?: number, dS?: number }} options
   *   dH  J/mol
   *   dS  J/(mol·K)
   */
  constructor({ dH = ICE_FUSION.dH, dS = ICE_FUSION.dS } = {}) {
    this.dH = dH;
    this.dS = dS;
  }

  /**
   * ΔG at temperature T (J/mol).
   * @param {number} T  temperature (K)
   * @returns {number}
   */
  deltaG(T) {
    return this.dH - T * this.dS;
  }

  /**
   * Equilibrium constant K = exp(−ΔG/(RT)).
   * @param {number} T
   * @returns {number}  K (dimensionless)
   */
  K(T) {
    return Math.exp(-this.deltaG(T) / (R * T));
  }

  /**
   * Crossover temperature where ΔG = 0.
   * Returns null if ΔS = 0 (ΔG is constant and never crosses zero unless ΔH=0).
   * @returns {number|null}  T* in K
   */
  get crossoverT() {
    if (Math.abs(this.dS) < 1e-12) return null;
    return this.dH / this.dS;
  }

  /**
   * Generate a ΔG vs T curve.
   * @param {number} Tmin  start temperature (K)
   * @param {number} Tmax  end temperature (K)
   * @param {number} [nPts=300]
   * @returns {Array<{T: number, dG: number, K: number}>}
   */
  curve(Tmin, Tmax, nPts = 300) {
    const pts = [];
    for (let i = 0; i < nPts; i++) {
      const T = Tmin + (Tmax - Tmin) * (i / (nPts - 1));
      pts.push({ T, dG: this.deltaG(T), K: this.K(T) });
    }
    return pts;
  }
}
