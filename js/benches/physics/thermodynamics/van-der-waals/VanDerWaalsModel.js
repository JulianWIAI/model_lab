/**
 * VanDerWaalsModel — van der Waals equation of state.
 *
 * Equation:
 *   P = RT/(V_m − b) − a/V_m²
 *
 *   P    — pressure (Pa)
 *   V_m  — molar volume (m³/mol)
 *   T    — temperature (K)
 *   R    — gas constant (J mol⁻¹ K⁻¹)
 *   a    — attraction parameter (Pa·m⁶/mol²); reduces P below ideal value
 *   b    — excluded-volume parameter (m³/mol); reduces effective volume
 *
 * Critical point (exact, from ∂P/∂V_m = ∂²P/∂V_m² = 0 at T_c):
 *   V_c = 3b
 *   T_c = 8a / (27Rb)
 *   P_c = a / (27b²)
 *   Z_c = P_c·V_c / (R·T_c) = 3/8 = 0.375  (universal VdW prediction)
 *
 * Deriving a and b from experimental T_c and P_c (inverse relations):
 *   a = 27R²T_c² / (64P_c)
 *   b = RT_c / (8P_c)
 *
 * Gas preset — CO₂ (main comparison):
 *   T_c = 304.18 K,  P_c = 73.80 bar  (NIST WebBook; Suehiro et al. 1996)
 *   ρ_c = 10.6 mol/L  →  V_c = 94.3 mL/mol  →  Z_c(real) = 0.275
 *   a and b derived from T_c, P_c above (VdW best fit to critical point).
 *
 *   Real CO₂ Z_c source:
 *     NIST Chemistry WebBook — CO₂ Phase-Change Properties.
 *     https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Units=SI&Mask=4
 *     Citing Suehiro et al. (1996).
 *
 * R from CONSTANTS (NIST CODATA 2018, exact by SI definition).
 */

import { CONSTANTS } from '../../../../data/constants.js';

const R = CONSTANTS.R.value;   // 8.314 462 618 J mol⁻¹ K⁻¹

/**
 * CO₂ critical constants from NIST WebBook (Suehiro et al. 1996):
 *   T_c = 304.18 K, P_c = 73.80 bar = 7.380×10⁶ Pa, ρ_c = 10.6 mol/L
 * Derived a and b for VdW model.
 */
export const CO2_PRESET = (() => {
  const Tc = 304.18;             // K
  const Pc = 73.80e5;            // Pa  (73.80 bar)
  const Vc_real = 1 / 10600;     // m³/mol  (ρ_c = 10.6 mol/L = 10600 mol/m³)
  const Zc_real = Pc * Vc_real / (R * Tc);  // ≈ 0.275
  const a = 27 * R * R * Tc * Tc / (64 * Pc);   // Pa·m⁶/mol²
  const b = R * Tc / (8 * Pc);                   // m³/mol
  return Object.freeze({ name: 'CO₂', Tc, Pc, Vc_real, Zc_real, a, b });
})();

export class VanDerWaalsModel {
  /**
   * @param {{ a?: number, b?: number }} options
   *   a  Pa·m⁶/mol²
   *   b  m³/mol
   */
  constructor({ a = CO2_PRESET.a, b = CO2_PRESET.b } = {}) {
    this.a = a;
    this.b = b;
  }

  /**
   * Create a VdW model with a, b derived from experimental Tc and Pc.
   * @param {number} Tc  critical temperature (K)
   * @param {number} Pc  critical pressure (Pa)
   * @returns {VanDerWaalsModel}
   */
  static fromCritical(Tc, Pc) {
    const a = 27 * R * R * Tc * Tc / (64 * Pc);
    const b = R * Tc / (8 * Pc);
    return new VanDerWaalsModel({ a, b });
  }

  /**
   * Critical point parameters predicted by this VdW model.
   */
  get criticalPoint() {
    const Vc = 3 * this.b;
    const Tc = 8 * this.a / (27 * R * this.b);
    const Pc = this.a / (27 * this.b * this.b);
    const Zc = Pc * Vc / (R * Tc);   // always 3/8 = 0.375 for VdW
    return { Vc, Tc, Pc, Zc };
  }

  /**
   * Pressure at given T and V_m (m³/mol).
   * Returns NaN if V_m ≤ b (excluded volume).
   * @param {number} T  temperature (K)
   * @param {number} Vm  molar volume (m³/mol)
   * @returns {number}  pressure (Pa)
   */
  pressure(T, Vm) {
    if (Vm <= this.b) return NaN;
    return R * T / (Vm - this.b) - this.a / (Vm * Vm);
  }

  /**
   * Reduced pressure P_r = P/P_c as a function of T_r = T/T_c and V_r = V_m/V_c.
   * The VdW equation in reduced form: P_r = 8T_r/(3V_r−1) − 3/V_r²
   * (universal; no a or b dependence)
   * @param {number} Tr  reduced temperature
   * @param {number} Vr  reduced molar volume
   * @returns {number}
   */
  pressureReduced(Tr, Vr) {
    if (Vr <= 1 / 3) return NaN;
    return 8 * Tr / (3 * Vr - 1) - 3 / (Vr * Vr);
  }

  /**
   * Isotherm: array of {Vm, P} points at temperature T.
   * Vm sweeps from VmMin to VmMax.
   * @param {number} T
   * @param {number} [VmMin]  defaults to 1.05b
   * @param {number} [VmMax]  defaults to 10·V_c
   * @param {number} [nPts=400]
   * @returns {Array<{Vm: number, P: number}>}
   */
  isotherm(T, VmMin, VmMax, nPts = 400) {
    const { Vc } = this.criticalPoint;
    const lo = VmMin ?? (1.05 * this.b);
    const hi = VmMax ?? (10 * Vc);
    const pts = [];
    for (let i = 0; i < nPts; i++) {
      const Vm = lo + (hi - lo) * (i / (nPts - 1));
      pts.push({ Vm, P: this.pressure(T, Vm) });
    }
    return pts;
  }
}
