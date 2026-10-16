/**
 * CableEquationModel — passive cable theory for dendrites.
 *
 * Formulas (all algebraic, standard cable theory):
 *
 *   r_m = Rm / (π·d)          [Ω·m] membrane resistance per unit length
 *   r_i = 4·Ra / (π·d²)       [Ω/m] axial resistance per unit length
 *   λ   = √(r_m / r_i)        [m]   space constant
 *       = (1/2)·√(d·Rm/Ra)        two equivalent forms
 *   τ_m = Rm·Cm                [s]   membrane time constant
 *
 * Steady-state voltage:
 *   Semi-infinite cable:   V(x) = V₀·e^(−x/λ)
 *   Finite sealed end:     V(x) = V₀·cosh((L−x)/λ) / cosh(L/λ)
 *   Finite killed end:     V(x) = V₀·sinh((L−x)/λ) / sinh(L/λ)
 *
 * Input resistance:
 *   Semi-infinite:  R_in = √(r_m·r_i) = (2/π)·√(Rm·Ra)·d^(−3/2)
 *   Sealed end:     R_in = r_i·λ·coth(L/λ)
 *   Killed end:     R_in = r_i·λ·tanh(L/λ)
 *
 * Both finite R_in → r_i·λ = R_in_semi as L→∞. ✓
 *
 * Rall 3/2 power law: R_in ∝ d^(−3/2); R_in(10μm)/R_in(1μm) = 10^(−3/2).
 */

export class CableEquationModel {
  /**
   * @param {{d_m?: number, Rm_ohm_m2?: number, Ra_ohm_m?: number, Cm_F_m2?: number}} [opts]
   * @throws {RangeError} if d ≤ 0
   */
  constructor({
    d_m     = 1e-6,    // diameter in m (default 1 μm)
    Rm_ohm_m2 = 0.1,   // specific membrane resistance Ω·m²
    Ra_ohm_m  = 1.0,   // specific axial resistivity Ω·m
    Cm_F_m2   = 0.01,  // specific membrane capacitance F/m²
  } = {}) {
    if (d_m <= 0) throw new RangeError(`CableEquationModel: d_m must be > 0; got ${d_m}`);
    this.d   = d_m;
    this.Rm  = Rm_ohm_m2;
    this.Ra  = Ra_ohm_m;
    this.Cm  = Cm_F_m2;
  }

  /** Space constant λ [m] via formula 1: √(r_m/r_i). */
  spaceConstant() {
    const r_m = this.Rm / (Math.PI * this.d);
    const r_i = 4 * this.Ra / (Math.PI * this.d * this.d);
    return Math.sqrt(r_m / r_i);
  }

  /** Space constant λ [m] via formula 2: (1/2)√(d·Rm/Ra). Same result as formula 1. */
  spaceConstantAlt() {
    return 0.5 * Math.sqrt(this.d * this.Rm / this.Ra);
  }

  /** Membrane time constant τ_m [s] = Rm·Cm. */
  timeConstant() {
    return this.Rm * this.Cm;
  }

  /**
   * Steady-state voltage V(x) = V₀·e^(−x/λ) for semi-infinite cable.
   * @param {number} x   distance from injection site [m]
   * @param {number} V0  voltage at x=0 [V]
   * @returns {number}
   */
  steadyState(x, V0) {
    return V0 * Math.exp(-x / this.spaceConstant());
  }

  /**
   * Input resistance for semi-infinite cable [Ω].
   * R_in = √(r_m·r_i) = (2/π)·√(Rm·Ra)·d^(−3/2)
   * @returns {number}
   */
  inputResistance() {
    const r_m = this.Rm / (Math.PI * this.d);
    const r_i = 4 * this.Ra / (Math.PI * this.d * this.d);
    return Math.sqrt(r_m * r_i);
  }

  /**
   * Steady-state voltage for finite cable.
   * @param {number} x    distance from injection [m]
   * @param {number} V0   voltage at x=0 [V]
   * @param {number} L    cable length [m]
   * @param {'sealed'|'killed'} endCondition
   * @returns {number}
   */
  finiteCable(x, V0, L, endCondition = 'sealed') {
    const lam = this.spaceConstant();
    if (endCondition === 'sealed') {
      return V0 * Math.cosh((L - x) / lam) / Math.cosh(L / lam);
    } else {
      return V0 * Math.sinh((L - x) / lam) / Math.sinh(L / lam);
    }
  }

  /**
   * Input resistance for finite cable [Ω].
   * Sealed end: r_i·λ·coth(L/λ)
   * Killed end: r_i·λ·tanh(L/λ)
   * @param {number} L    cable length [m]
   * @param {'sealed'|'killed'} endCondition
   * @returns {number}
   */
  finiteInputResistance(L, endCondition = 'sealed') {
    const lam = this.spaceConstant();
    const r_i = 4 * this.Ra / (Math.PI * this.d * this.d);
    const u   = L / lam;
    if (endCondition === 'sealed') {
      return r_i * lam / Math.tanh(u);   // coth(u) = 1/tanh(u)
    } else {
      return r_i * lam * Math.tanh(u);
    }
  }

  /**
   * Profile: array of {x, V} for semi-infinite cable from 0 to xMax.
   * @param {number} V0       voltage at x=0 [V]
   * @param {number} xMax     end of profile [m]
   * @param {number} [nPoints=200]
   * @returns {Array<{x: number, V: number}>}
   */
  profile(V0, xMax, nPoints = 200) {
    const pts = [];
    for (let i = 0; i <= nPoints; i++) {
      const x = (i / nPoints) * xMax;
      pts.push({ x, V: this.steadyState(x, V0) });
    }
    return pts;
  }
}
