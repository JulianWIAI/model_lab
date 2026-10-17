/**
 * HopfieldModel — associative memory network (Hopfield 1982).
 *
 * Hebbian weights: w_ij = (1/N) Σ_μ ξ^μ_i · ξ^μ_j   (i ≠ j), w_ii = 0
 * Energy:          E = −½ ΣΣ w_ij s_i s_j = (1 − N·m²) / 2
 *                  where m = (1/N)Σ ξ_i s_i  (overlap with stored pattern)
 * Async update:    s_i ← sign(h_i)  where h_i = Σ_j w_ij s_j
 *                  If h_i = 0, keep s_i unchanged (no state change).
 *                  ΔE = −(|h_i| − s_old·h_i) ≤ 0  (energy non-increasing)
 *
 * Storage capacity: ~0.138·N patterns for random uncorrelated ±1 patterns
 * (Amit, Gutfreund & Sompolinsky 1985; McEliece et al. 1987).
 *
 * Reference: Hopfield, J.J. (1982). PNAS 79:2554.
 */

export class HopfieldModel {
  /**
   * @param {{N: number, patterns: number[][]}} opts
   * @throws {RangeError}
   */
  constructor({ N, patterns }) {
    if (N < 1) throw new RangeError('HopfieldModel: N must be ≥ 1');
    for (const xi of patterns) {
      if (xi.length !== N) throw new RangeError('HopfieldModel: each pattern must have length N');
      for (const v of xi) {
        if (v !== 1 && v !== -1) throw new RangeError('HopfieldModel: patterns must contain only ±1 values');
      }
    }
    this.N = N;
    this.patterns = patterns;
    this.setWeights();
  }

  /** Build the N×N weight matrix (Hebbian rule, zero diagonal). */
  setWeights() {
    const N = this.N;
    this.W = Array.from({ length: N }, (_, i) =>
      Array.from({ length: N }, (_, j) => {
        if (i === j) return 0;
        let sum = 0;
        for (const xi of this.patterns) sum += xi[i] * xi[j];
        return sum / N;
      }),
    );
  }

  /**
   * Network energy E = −½ Σ_{i,j} W[i][j] s_i s_j.
   * @param {number[]} state  ±1 array of length N
   * @returns {number}
   */
  energy(state) {
    let E = 0;
    for (let i = 0; i < this.N; i++)
      for (let j = 0; j < this.N; j++)
        E -= 0.5 * this.W[i][j] * state[i] * state[j];
    return E;
  }

  /**
   * Local field (input) to neuron i: h_i = Σ_j W[i][j] s_j.
   * @param {number[]} state
   * @param {number} i
   * @returns {number}
   */
  localField(state, i) {
    let h = 0;
    for (let j = 0; j < this.N; j++) h += this.W[i][j] * state[j];
    return h;
  }

  /**
   * One full asynchronous sweep: update each neuron in order 0..N-1.
   * Does not mutate the input array.
   * @param {number[]} state
   * @returns {number[]}
   */
  asyncUpdate(state) {
    const s = state.slice();
    for (let i = 0; i < this.N; i++) {
      const h = this.localField(s, i);
      if (h > 0) s[i] = 1;
      else if (h < 0) s[i] = -1;
      // if h === 0, keep s[i] unchanged
    }
    return s;
  }

  /**
   * Iterate asyncUpdate until fixed point or maxSteps.
   * @param {number[]} state   initial state
   * @param {number} [maxSteps=100]
   * @returns {number[]}
   */
  asyncRun(state, maxSteps = 100) {
    let s = state.slice();
    for (let step = 0; step < maxSteps; step++) {
      const next = this.asyncUpdate(s);
      // Check for fixed point
      let same = true;
      for (let i = 0; i < this.N; i++) {
        if (next[i] !== s[i]) { same = false; break; }
      }
      s = next;
      if (same) break;
    }
    return s;
  }

  /**
   * Overlap of state with stored pattern mu: m = (1/N) Σ_i ξ^mu_i s_i.
   * @param {number[]} state
   * @param {number} mu  pattern index
   * @returns {number}
   */
  overlapWith(state, mu) {
    const xi = this.patterns[mu];
    let sum = 0;
    for (let i = 0; i < this.N; i++) sum += xi[i] * state[i];
    return sum / this.N;
  }
}
