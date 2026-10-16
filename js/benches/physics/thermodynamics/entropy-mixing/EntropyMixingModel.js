/**
 * EntropyMixingModel — ideal entropy of mixing for N distinguishable components.
 *
 * Formula: ΔS_mix = −R·Σᵢ xᵢ·ln(xᵢ)
 *
 * R = N_A · k_B = 6.02214076e23 × 1.380649e-23 = 8.31446261815324 J/(mol·K)
 * (CODATA 2018, exact by SI 2019 definition.)
 *
 * Implementation note: accumulate each −xᵢ·ln(xᵢ) term separately
 * (not −Σxᵢlnxᵢ) to ensure result is +0 (not −0) for a pure component.
 *
 * Independent thermodynamic derivation:
 *   Component i expands isothermally from volume xᵢ·V to V at const T, p.
 *   ΔSᵢ = nᵢ·R·ln(1/xᵢ) → same formula as statistical approach.
 *
 * Gibbs paradox: mixing two samples of the SAME gas gives ΔS=0 classically.
 * This model applies to DISTINGUISHABLE components only.
 */

/** Universal gas constant [J/(mol·K)] — CODATA 2018 exact. */
export const R_GAS = 6.02214076e23 * 1.380649e-23;  // = 8.31446261815324

export class EntropyMixingModel {
  /**
   * @param {Array<{name: string, x: number}>} components  mole fractions
   * @throws {RangeError} if any xᵢ < 0 or xᵢ > 1
   * @throws {RangeError} if Σxᵢ ≠ 1 (tolerance 1e-10)
   */
  constructor(components = [{ name: 'A', x: 0.5 }, { name: 'B', x: 0.5 }]) {
    for (const c of components) {
      if (c.x < 0 || c.x > 1) {
        throw new RangeError(`EntropyMixingModel: mole fraction out of [0,1]: x=${c.x}`);
      }
    }
    const sum = components.reduce((s, c) => s + c.x, 0);
    if (Math.abs(sum - 1) > 1e-10) {
      throw new RangeError(`EntropyMixingModel: mole fractions must sum to 1; got ${sum}`);
    }
    this.components = components.map(c => ({ ...c }));
  }

  /**
   * Molar entropy of mixing in J/(mol·K).
   * = R · Σᵢ (−xᵢ·ln xᵢ)  for xᵢ > 0; term = 0 for xᵢ = 0.
   * @returns {number}
   */
  deltaS() {
    let s = 0;
    for (const { x } of this.components) {
      if (x > 0) s += -x * Math.log(x);  // accumulate +terms → result ≥ 0
    }
    return R_GAS * s;
  }

  /**
   * Molar Gibbs free energy of mixing at temperature T [K].
   * = −T · ΔS_mix  (for ideal mixing, ΔH_mix = 0)
   * @param {number} T  temperature in Kelvin
   * @returns {number} ΔG_mix in J/mol
   */
  deltaG(T) {
    return -T * this.deltaS();
  }

  /**
   * Equimolar composition that maximises ΔS_mix.
   * @returns {number[]} array of N equal fractions 1/N
   */
  maxMixingComposition() {
    const N = this.components.length;
    return Array(N).fill(1 / N);
  }

  /**
   * Returns ΔS_mix/R (dimensionless) — useful for unit tests.
   * @returns {number}
   */
  deltaSoverR() {
    let s = 0;
    for (const { x } of this.components) {
      if (x > 0) s += -x * Math.log(x);
    }
    return s;
  }

  /**
   * Curve of ΔS vs x₁ for a binary mixture (x₂ = 1 − x₁).
   * @param {number} [nPoints=200]
   * @returns {Array<{x: number, dS: number}>}
   */
  binaryCurve(nPoints = 200) {
    const pts = [];
    for (let i = 0; i <= nPoints; i++) {
      const x = i / nPoints;
      const x2 = 1 - x;
      let s = 0;
      if (x  > 0) s += -x  * Math.log(x);
      if (x2 > 0) s += -x2 * Math.log(x2);
      pts.push({ x, dS: R_GAS * s });
    }
    return pts;
  }
}
