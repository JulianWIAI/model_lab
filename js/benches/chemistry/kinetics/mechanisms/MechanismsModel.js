/**
 * MechanismsModel — exact analytical solution for consecutive first-order reactions
 * A → B → C  (Bateman equations).
 *
 * Exact solution (Bateman 1910):
 *
 *   [A](t) = [A]₀ · e^(−k₁t)
 *
 *   when k₁ ≠ k₂:
 *     [B](t) = [A]₀ · k₁/(k₂ − k₁) · (e^(−k₁t) − e^(−k₂t))
 *
 *   when k₁ = k₂ = k:
 *     [B](t) = [A]₀ · k·t · e^(−kt)
 *
 *   [C](t) = [A]₀ − [A](t) − [B](t)   (mass conservation)
 *
 * Time of maximum intermediate B:
 *   k₁ ≠ k₂:  t_max = ln(k₂/k₁) / (k₂ − k₁)
 *   k₁ = k₂:  t_max = 1/k₁
 *
 * Steady-state approximation (SSA) for B when k₂ >> k₁:
 *   [B]_ss(t) = [A]₀ · (k₁/k₂) · e^(−k₁t)
 *
 * Units:
 *   k₁, k₂  in s⁻¹  (first-order rate constants)
 *   t        in s
 *   [A]₀     in mol L⁻¹ (or any concentration unit; output preserves the unit)
 *
 * Reference:
 *   H. Bateman (1910). The solution of a system of differential equations occurring
 *   in the theory of radioactive transformations. Proc. Cambridge Phil. Soc. 15, 423–427.
 *   (Primary; derivation is exact integration of the coupled ODEs.)
 *
 * Secondary derivation in:
 *   P. Atkins & J. de Paula (2014). Atkins' Physical Chemistry, 10th ed.
 *   Oxford University Press. Chapter 17.
 */

export class MechanismsModel {
  /**
   * @param {{ k1?: number, k2?: number, A0?: number }} options
   */
  constructor({ k1 = 0.1, k2 = 0.5, A0 = 1.0 } = {}) {
    this.k1 = k1;   // s⁻¹
    this.k2 = k2;   // s⁻¹
    this.A0 = A0;   // mol/L (or dimensionless)
  }

  /**
   * Concentrations [A], [B], [C] at time t.
   * @param {number} t  time (s)
   * @returns {{ A: number, B: number, C: number }}
   */
  concentrations(t) {
    if (t <= 0) return { A: this.A0, B: 0, C: 0 };
    const A = this.A0 * Math.exp(-this.k1 * t);
    let B;
    if (Math.abs(this.k2 - this.k1) < 1e-12) {
      // Degenerate case: k1 = k2
      B = this.A0 * this.k1 * t * Math.exp(-this.k1 * t);
    } else {
      B = this.A0 * (this.k1 / (this.k2 - this.k1)) *
          (Math.exp(-this.k1 * t) - Math.exp(-this.k2 * t));
    }
    const C = this.A0 - A - B;
    return { A, B, C: Math.max(C, 0) };
  }

  /**
   * Steady-state approximation for [B] (valid when k₂ >> k₁).
   * @param {number} t
   * @returns {number}
   */
  bSteadyState(t) {
    return this.A0 * (this.k1 / this.k2) * Math.exp(-this.k1 * t);
  }

  /**
   * Time (s) at which [B] is maximum.
   * @returns {number}
   */
  get tMax() {
    if (Math.abs(this.k2 - this.k1) < 1e-12) {
      return 1 / this.k1;
    }
    return Math.log(this.k2 / this.k1) / (this.k2 - this.k1);
  }

  /**
   * Generate a concentration vs time curve for A, B, C (and B_ss).
   * @param {number} tEnd    end time (s)
   * @param {number} nPoints
   * @returns {Array<{t: number, A: number, B: number, C: number, Bss: number}>}
   */
  curve(tEnd, nPoints = 400) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const t = tEnd * (i / (nPoints - 1));
      const { A, B, C } = this.concentrations(t);
      const Bss = this.bSteadyState(t);
      pts.push({ t, A, B, C, Bss });
    }
    return pts;
  }
}
