/**
 * HillBindingModel — cooperative O₂ binding via the Hill equation.
 *
 * Hill equation (dimensionless saturation):
 *   θ = pO₂ⁿ / (P50ⁿ + pO₂ⁿ)
 *
 *   θ   — fractional saturation (0–1, dimensionless)
 *   pO₂ — partial pressure of oxygen (mmHg)
 *   P50 — pO₂ at half-saturation (mmHg); θ = 0.5 when pO₂ = P50 for any n
 *   n   — Hill coefficient (dimensionless); n = 1 → rectangular hyperbola (no cooperativity)
 *
 * Reference: A. V. Hill (1910). "The possible effects of the aggregation of the
 * molecules of haemoglobin on its dissociation curves." J. Physiol. 40, iv–vii.
 *
 * HbA parameters:
 *   P50 = 26.6 mmHg — Wikipedia "Oxygen–haemoglobin dissociation curve",
 *         citing Lehninger Principles of Biochemistry, 6th ed.
 *   n ∈ [1.7, 3.2] — Wikipedia "Hill equation (biochemistry)";
 *         default n = 2.8 (user-specified, within cited range).
 *
 * Myoglobin parameters:
 *   n = 1 (non-cooperative) — Wikipedia "Myoglobin":
 *       "does not have cooperative binding with oxygen".
 *   P50 ≈ 2.8 mmHg — approximate value; primary sources vary
 *       (range ≈ 1–3 mmHg in published literature; see info.breaks in bench).
 *       Displayed with "source varies" warning in the UI.
 */

export class HillBindingModel {
  /**
   * HbA reference parameters.
   * P50 source: Wikipedia "Oxygen–haemoglobin dissociation curve" (secondary),
   *   citing Lehninger Principles of Biochemistry 6th ed.
   * n range: Wikipedia "Hill equation (biochemistry)".
   */
  static HBA = Object.freeze({ P50: 26.6, nDefault: 2.8, nMin: 1.7, nMax: 3.2 });

  /**
   * Myoglobin reference parameters.
   * P50: approximate; primary sources vary (≈1–3 mmHg). Displayed with warning.
   * n = 1: non-cooperative; Wikipedia "Myoglobin".
   */
  static MB = Object.freeze({ P50: 2.8, n: 1 });

  /**
   * @param {{ P50?: number, n?: number }} options
   */
  constructor({ P50 = 26.6, n = 2.8 } = {}) {
    this.P50 = P50;  // mmHg
    this.n   = n;    // Hill coefficient
  }

  /**
   * Fractional saturation at a given partial pressure.
   * @param {number} pO2  partial pressure (mmHg)
   * @returns {number}    θ ∈ [0, 1]
   */
  theta(pO2) {
    if (pO2 <= 0) return 0;
    const p50n = Math.pow(this.P50, this.n);
    const po2n = Math.pow(pO2,      this.n);
    return po2n / (p50n + po2n);
  }

  /**
   * Generate a saturation curve from pO₂ = 0 to pO₂Max.
   * @param {number} [pO2Max=150]  upper limit (mmHg)
   * @param {number} [nPoints=200]
   * @returns {Array<{pO2: number, theta: number}>}
   */
  curve(pO2Max = 150, nPoints = 200) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const pO2 = (pO2Max / (nPoints - 1)) * i;
      pts.push({ pO2, theta: this.theta(pO2) });
    }
    return pts;
  }
}
