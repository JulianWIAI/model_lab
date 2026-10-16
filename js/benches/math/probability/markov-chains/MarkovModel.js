/**
 * MarkovModel — discrete-time Markov chain (2-state and n-state).
 *
 * 2-state (p, q):
 *   P = [[1-p, p], [q, 1-q]]   (row-stochastic)
 *   π₀ = q/(p+q)     π₁ = p/(p+q)         (closed form)
 *   λ₂ = 1 − p − q                         (closed form — NOT via jacobiEigen)
 *   TV(k) = |λ₂|^k · max(π₀, π₁)          (exact for 2-state chains)
 *   t_mix(ε) = first k with TV(k) ≤ ε
 *
 * n-state: stationary distribution via power iteration on Pᵀ.
 *
 * Boundary cases:
 *   p = q = 0 → no unique stationary distribution (warning string)
 *   p + q > 1 → λ₂ < 0 (periodic chain), valid and defined
 *
 * Reference: Levin, Peres & Wilmer (2009). Markov Chains and Mixing Times. AMS.
 * (cited, not fetched)
 */
export class MarkovModel {
  /**
   * Construct a 2-state Markov chain.
   * @param {object} [opts]
   * @param {number} [opts.p=0.3]  P(0→1)
   * @param {number} [opts.q=0.4]  P(1→0)
   */
  constructor({ p = 0.3, q = 0.4 } = {}) {
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError(`p must be in [0,1]; got ${p}`);
    if (!Number.isFinite(q) || q < 0 || q > 1) throw new RangeError(`q must be in [0,1]; got ${q}`);
    this.p = p;
    this.q = q;
  }

  /** Stationary distribution [π₀, π₁].  Returns null if p=q=0. */
  get stationary() {
    const sum = this.p + this.q;
    if (sum === 0) return null;   // no unique stationary distribution
    return [this.q / sum, this.p / sum];
  }

  /** Second eigenvalue λ₂ = 1 − p − q (closed form). */
  get lambda2() { return 1 - this.p - this.q; }

  /** Spectral gap = 1 − |λ₂| = p + q (when p+q ≤ 1) or 1 − |1-p-q|. */
  get spectralGap() { return 1 - Math.abs(this.lambda2); }

  /** Relaxation time = 1 / gap. */
  get tRel() { return 1 / this.spectralGap; }

  /**
   * Exact total variation distance after k steps.
   * TV(k) = |λ₂|^k · max(π₀, π₁)
   * @param {number} k  steps (non-negative integer)
   */
  tvDistance(k) {
    const pi = this.stationary;
    if (!pi) return NaN;
    return Math.abs(this.lambda2) ** k * Math.max(pi[0], pi[1]);
  }

  /**
   * Exact mixing time: smallest k with TV(k) ≤ ε.
   * @param {number} [eps=0.01]
   * @returns {number}
   */
  tMix(eps = 0.01) {
    for (let k = 0; k <= 10000; k++) {
      if (this.tvDistance(k) <= eps) return k;
    }
    return Infinity;
  }

  /**
   * Run k steps of power iteration on Pᵀ starting from uniform.
   * Returns the current distribution after k steps.
   * @param {number} [steps=200]
   * @returns {number[]} distribution [π₀, π₁]
   */
  powerIterate(steps = 200) {
    let v = [0.5, 0.5];
    const PT = [[1 - this.p, this.q], [this.p, 1 - this.q]]; // Pᵀ
    for (let i = 0; i < steps; i++) {
      v = [
        PT[0][0] * v[0] + PT[0][1] * v[1],
        PT[1][0] * v[0] + PT[1][1] * v[1],
      ];
    }
    return v;
  }

  /**
   * Verify stationarity: returns residual ||(π·P) − π||₁.
   * @param {number[]} pi  distribution to check
   */
  stationarityResidual(pi) {
    // π·P: (πP)[j] = Σ_i π_i P_ij
    const P = [[1 - this.p, this.p], [this.q, 1 - this.q]];
    const piP = [
      pi[0] * P[0][0] + pi[1] * P[1][0],
      pi[0] * P[0][1] + pi[1] * P[1][1],
    ];
    return Math.abs(piP[0] - pi[0]) + Math.abs(piP[1] - pi[1]);
  }

  /**
   * Compute stationary distribution of an arbitrary row-stochastic n-state
   * matrix via power iteration using row-vector left-multiplication: v ← v·P.
   *
   * Convention: P is ROW-stochastic (rows sum to 1). The stationary
   * distribution π is a ROW vector satisfying π·P = π. This is v·P,
   * NOT Pᵀ·v — the two are equivalent in value for row-stochastic matrices
   * but the convention matters for non-symmetric P (left vs right eigenvector).
   *
   * @param {number[][]} P  n×n row-stochastic matrix
   * @param {number}   [steps=500]
   * @returns {number[]}  stationary row-vector π satisfying π·P = π
   */
  static stationaryN(P, steps = 500) {
    const n = P.length;
    let v = new Array(n).fill(1 / n);
    for (let iter = 0; iter < steps; iter++) {
      const vNext = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          vNext[j] += v[i] * P[i][j];  // v·P (row-vector left-multiply)
        }
      }
      // Normalise to guard against floating-point drift
      const s = vNext.reduce((a, b) => a + b, 0);
      v = vNext.map(x => x / s);
    }
    return v;
  }

  // 3-state preset: P with π = (1/4, 1/2, 1/4), eigenvalues {1, 0.5, 0}
  static get PRESET_3STATE() {
    return {
      P: [[0.5, 0.5, 0], [0.25, 0.5, 0.25], [0, 0.5, 0.5]],
      pi: [0.25, 0.5, 0.25],
      lambda2: 0.5,
    };
  }
}
