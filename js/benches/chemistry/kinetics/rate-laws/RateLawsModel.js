/**
 * RateLawsModel — integrated rate laws for 0th, 1st, and 2nd order reactions.
 *
 * Reaction: A → products
 *
 * Integrated rate laws:
 *   0th order:  [A](t) = [A]₀ − k·t               (clamped ≥ 0)
 *   1st order:  [A](t) = [A]₀ · exp(−k·t)
 *   2nd order:  [A](t) = [A]₀ / (1 + k·[A]₀·t)
 *
 * Half-lives:
 *   0th order:  t½ = [A]₀ / (2k)
 *   1st order:  t½ = ln 2 / k
 *   2nd order:  t½ = 1 / (k·[A]₀)
 *
 * Units:
 *   [A]₀  in mol L⁻¹
 *   t     in s
 *   k:    mol L⁻¹ s⁻¹  (0th order)
 *         s⁻¹           (1st order)
 *         L mol⁻¹ s⁻¹  (2nd order)
 *
 * Source (textbook, standard derivations):
 *   P. Atkins & J. de Paula (2014). Atkins' Physical Chemistry, 10th ed.
 *   Oxford University Press. Chapter 17 (Chemical kinetics: the rates of reactions).
 *
 * The integrated rate laws are exact analytical solutions to the respective
 * differential rate equations and are verifiable by direct substitution.
 */

export const ORDER = Object.freeze({ ZEROTH: 0, FIRST: 1, SECOND: 2 });

export class RateLawsModel {
  /**
   * @param {{ order?: 0|1|2, A0?: number, k?: number }} options
   */
  constructor({ order = 1, A0 = 1.0, k = 0.1 } = {}) {
    this.order = order;   // reaction order (0, 1, or 2)
    this.A0    = A0;      // initial concentration (mol/L)
    this.k     = k;       // rate constant (units depend on order)
  }

  /**
   * Concentration of A at time t.
   * @param {number} t  time (s)
   * @returns {number}  [A] in mol/L
   */
  concentration(t) {
    if (t < 0) return this.A0;
    switch (this.order) {
      case 0: return Math.max(this.A0 - this.k * t, 0);
      case 1: return this.A0 * Math.exp(-this.k * t);
      case 2: return this.A0 / (1 + this.k * this.A0 * t);
      default: throw new Error(`Unknown order: ${this.order}`);
    }
  }

  /**
   * Half-life (s) — time at which [A] = [A]₀ / 2.
   * @returns {number}
   */
  halfLife() {
    switch (this.order) {
      case 0: return this.A0 / (2 * this.k);
      case 1: return Math.LN2 / this.k;
      case 2: return 1 / (this.k * this.A0);
      default: throw new Error(`Unknown order: ${this.order}`);
    }
  }

  /**
   * Units string for the rate constant k.
   * @returns {string}
   */
  get kUnits() {
    switch (this.order) {
      case 0: return 'mol L⁻¹ s⁻¹';
      case 1: return 's⁻¹';
      case 2: return 'L mol⁻¹ s⁻¹';
      default: return '';
    }
  }

  /**
   * Generate a [A] vs t curve.
   * @param {number} tMax    end time (s)
   * @param {number} nPoints number of points
   * @returns {Array<{t: number, A: number}>}
   */
  curve(tMax, nPoints = 300) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const t = tMax * (i / (nPoints - 1));
      pts.push({ t, A: this.concentration(t) });
    }
    return pts;
  }
}
