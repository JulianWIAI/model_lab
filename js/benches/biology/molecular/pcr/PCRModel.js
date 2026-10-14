/**
 * PCRModel — polymerase chain reaction kinetics.
 *
 * Exponential phase:
 *   N_n = N₀ · (1 + E)ⁿ
 *
 * Plateau phase (efficiency falls as product accumulates):
 *   N_{n+1} = N_n + N_n · E · (1 − N_n / N_max)
 *   Equivalent to a logistic growth step.
 *
 * Threshold cycle:
 *   Ct = smallest n such that N_n ≥ threshold
 *
 * References:
 *   Higuchi, R. et al. (1992) Biotechnology 10, 413–417. (quantitative PCR)
 *   Pfaffl, M. W. (2001) Nucleic Acids Research 29, e45. (efficiency correction)
 */
export class PCRModel {
  /**
   * @param {{
   *   N0?:        number,   initial copy number (default 1)
   *   efficiency?: number,  amplification efficiency 0–1 (default 1.0 = perfect doubling)
   *   nCycles?:   number,   number of cycles (default 40)
   *   threshold?: number,   detection threshold (default 1e9)
   *   Nmax?:      number,   plateau carrying capacity (default 1e12)
   * }} options
   */
  constructor({
    N0         = 1,
    efficiency = 1.0,
    nCycles    = 40,
    threshold  = 1e9,
    Nmax       = 1e12,
  } = {}) {
    this.N0         = N0;
    this.efficiency = efficiency;
    this.nCycles    = nCycles;
    this.threshold  = threshold;
    this.Nmax       = Nmax;
  }

  /**
   * Copy number at cycle n using the plateau model.
   * For N_n ≪ Nmax the equation reduces to the exponential formula.
   * @param {number} n  cycle number (0-based)
   * @returns {number}
   */
  copies(n) {
    let N = this.N0;
    for (let i = 0; i < n; i++) {
      N = N + N * this.efficiency * (1 - N / this.Nmax);
    }
    return N;
  }

  /**
   * Array of copy numbers from cycle 0 to nCycles (inclusive).
   * @returns {Float64Array}  length = nCycles + 1
   */
  copiesArray() {
    const arr = new Float64Array(this.nCycles + 1);
    let N = this.N0;
    arr[0] = N;
    for (let i = 1; i <= this.nCycles; i++) {
      N = N + N * this.efficiency * (1 - N / this.Nmax);
      arr[i] = N;
    }
    return arr;
  }

  /**
   * Threshold cycle Ct — the first cycle at which copy number ≥ threshold.
   * Returns null if threshold is never reached within nCycles.
   * @returns {number|null}
   */
  get Ct() {
    const arr = this.copiesArray();
    for (let i = 0; i <= this.nCycles; i++) {
      if (arr[i] >= this.threshold) return i;
    }
    return null;
  }

  /**
   * Copy number at a specific cycle using the fast exponential formula (no plateau).
   * Used for the ideal reference curve overlay.
   * @param {number} n
   * @returns {number}
   */
  copiesExponential(n) {
    return this.N0 * Math.pow(1 + this.efficiency, n);
  }
}
