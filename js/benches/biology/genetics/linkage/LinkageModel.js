/**
 * LinkageModel — genetic mapping functions (Haldane and Kosambi).
 *
 * Recombination frequency θ ∈ [0, 0.5] and genetic distance M in Morgans.
 *
 * Haldane (1919):
 *   M(θ) = −0.5 · ln(1 − 2θ)         [Morgans]
 *   θ(M) = 0.5 · (1 − e^(−2M))
 *   Assumes no chromatid interference (crossovers independent).
 *
 * Kosambi (1944):
 *   M(θ) = 0.25 · ln((1 + 2θ) / (1 − 2θ))   [Morgans]
 *   θ(M) = 0.5 · tanh(2M)
 *   Models positive interference (adjacent crossovers inhibit each other).
 *
 * LOD score (Morton 1955):
 *   LOD(θ) = log₁₀[ L(θ) / L(0.5) ]
 *   where L(θ) = θ^R · (1−θ)^P   (R = recombinants, P = parentals)
 *   Significant linkage: LOD ≥ 3.
 *
 * Sources:
 *   Haldane, J. B. S. (1919) J. Genet. 8, 299–309.
 *   Kosambi, D. D. (1944) Ann. Eugenics 12, 172–175.
 *   Morton, N. E. (1955) Am. J. Hum. Genet. 7, 277–318.
 */
export class LinkageModel {
  /** @param {{ theta?: number }} options */
  constructor({ theta = 0.1 } = {}) {
    this.theta = theta; // recombination frequency [0, 0.5)
  }

  /**
   * Haldane mapping function: map distance in Morgans from θ.
   * M = −0.5 · ln(1 − 2θ)   [Morgans]
   * @param {number} theta  recombination frequency [0, 0.5)
   * @returns {number}  Morgans (→ ∞ as θ → 0.5)
   */
  haldane(theta) {
    if (theta <= 0) return 0;
    if (theta >= 0.5) return Infinity;
    return -0.5 * Math.log(1 - 2 * theta); // Morgans
  }

  /**
   * Inverse Haldane: θ from map distance M.
   * θ = 0.5 · (1 − e^(−2M))
   * @param {number} M  Morgans
   * @returns {number}  recombination frequency
   */
  haldaneInverse(M) {
    if (M <= 0) return 0;
    return 0.5 * (1 - Math.exp(-2 * M));
  }

  /**
   * Kosambi mapping function: map distance in Morgans from θ.
   * M = 0.25 · ln((1 + 2θ) / (1 − 2θ))   [Morgans]
   * @param {number} theta  recombination frequency [0, 0.5)
   * @returns {number}  Morgans
   */
  kosambi(theta) {
    if (theta <= 0) return 0;
    if (theta >= 0.5) return Infinity;
    return 0.25 * Math.log((1 + 2 * theta) / (1 - 2 * theta)); // Morgans
  }

  /**
   * Inverse Kosambi: θ from map distance M.
   * θ = 0.5 · tanh(2M)
   * @param {number} M  Morgans
   * @returns {number}  recombination frequency
   */
  kosambiInverse(M) {
    if (M <= 0) return 0;
    return 0.5 * Math.tanh(2 * M);
  }

  /**
   * LOD score for a two-point cross.
   * LOD = log₁₀[ θ^R · (1−θ)^P / (0.5)^(R+P) ]
   * @param {number} nParental      number of parental offspring
   * @param {number} nRecombinant   number of recombinant offspring
   * @param {number} [theta]        recombination frequency to test (default this.theta)
   * @returns {number}  LOD score (≥3 conventionally significant)
   */
  lodScore(nParental, nRecombinant, theta = this.theta) {
    const N = nParental + nRecombinant;
    if (N === 0 || theta <= 0 || theta >= 0.5) return -Infinity;
    // L(θ) = θ^R · (1-θ)^P  ;  L(0.5) = 0.5^N
    const logOdds =
      nRecombinant * Math.log10(theta) +
      nParental * Math.log10(1 - theta) -
      N * Math.log10(0.5);
    return logOdds;
  }

  /**
   * Generates curve data for both mapping functions over θ ∈ [0, 0.495].
   * @param {number} nPoints
   * @returns {{ thetas: Float64Array, haldaneCM: Float64Array, kosambiCM: Float64Array }}
   */
  curveData(nPoints = 200) {
    const thetas     = new Float64Array(nPoints);
    const haldaneCM  = new Float64Array(nPoints);
    const kosambiCM  = new Float64Array(nPoints);
    for (let i = 0; i < nPoints; i++) {
      const th = (i / (nPoints - 1)) * 0.495; // [0, 0.495]
      thetas[i]     = th;
      haldaneCM[i]  = this.haldane(th) * 100;  // convert Morgans → cM
      kosambiCM[i]  = this.kosambi(th) * 100;
    }
    return { thetas, haldaneCM, kosambiCM };
  }
}
