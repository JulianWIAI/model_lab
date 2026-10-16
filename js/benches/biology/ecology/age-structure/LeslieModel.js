/**
 * LeslieModel — age-structured population dynamics (Leslie 1945).
 *
 * Leslie matrix L (n × n):
 *   Row 0:    L[0][j] = fⱼ  (fecundities; j=0..n-1)
 *   Sub-diag: L[i][i-1] = s_{i-1}  (survivals; i=1..n-1)
 *   All other entries: 0
 *
 * Population update: n(t+1) = L · n(t)
 *
 * Dominant eigenvalue λ by power iteration (primitive L only).
 * WARNING: jacobiEigen is symmetric-only; do NOT use it for Leslie matrices.
 *
 * Guard: r = ln(λ) is undefined for λ≤0. Returns null if λ≤0.
 *
 * With fecundities=[1,5], survivals=[0.4,0.6] (3-age):
 *   L = [[0,1,5],[0.4,0,0],[0,0.6,0]]
 *   char poly: λ³ = 0.4λ + 1.2  →  λ ≈ 1.18761471
 *   R₀ = l₁·f₁ + l₂·f₂ = 0.4·1 + 0.24·5 = 1.6
 */
import { matMul, matVec, isPrimitive } from '../../../../core/LinAlg.js';

export class LeslieModel {
  /**
   * @param {{fecundities: number[], survivals: number[]}} opts
   *   fecundities[i]: reproductive output of age class i (must be ≥ 0)
   *   survivals[i]: P(survive from age i to i+1) ∈ (0, 1]
   *   Length: fecundities.length = survivals.length + 1 = n
   * @throws {RangeError}
   */
  constructor({ fecundities, survivals }) {
    const n = fecundities.length;
    if (survivals.length !== n - 1) {
      throw new RangeError(
        `LeslieModel: fecundities.length (${n}) must equal survivals.length+1 (${survivals.length + 1})`,
      );
    }
    for (const f of fecundities) {
      if (f < 0) throw new RangeError(`LeslieModel: fecundity must be ≥ 0; got ${f}`);
    }
    for (const s of survivals) {
      if (s <= 0 || s > 1) throw new RangeError(`LeslieModel: survival must be in (0,1]; got ${s}`);
    }

    this.fecundities = fecundities;
    this.survivals   = survivals;
    this.n           = n;

    // Build Leslie matrix
    this.L = Array.from({ length: n }, () => Array(n).fill(0));
    for (let j = 0; j < n; j++) this.L[0][j] = fecundities[j];
    for (let i = 1; i < n; i++) this.L[i][i - 1] = survivals[i - 1];
  }

  /**
   * Is the Leslie matrix primitive?
   * @returns {boolean}
   */
  isPrimitive() {
    return isPrimitive(this.L);
  }

  /**
   * One step: L · n
   * @param {number[]} n
   * @returns {number[]}
   */
  step(n) {
    return matVec(this.L, n);
  }

  /**
   * Simulate T steps.
   * @param {number[]} n0
   * @param {number}   T
   * @returns {number[][]}  [n₀, n₁, ..., n_T]
   */
  simulate(n0, T) {
    const history = [n0.slice()];
    let nCur = n0.slice();
    for (let t = 0; t < T; t++) {
      nCur = this.step(nCur);
      history.push(nCur.slice());
    }
    return history;
  }

  /**
   * Dominant eigenvalue and stable age distribution via power iteration.
   * For imprimitive matrices, power iteration oscillates.
   * @param {number} [maxIter=400]
   * @returns {{lambda: number, stableAge: number[]}|{lambda: number, imprimitive: true}}
   */
  dominantEigen(maxIter = 400) {
    const n = this.n;
    const prim = this.isPrimitive();

    // Start from uniform
    let v = Array(n).fill(1 / n);
    let lambda = 0;

    for (let iter = 0; iter < maxIter; iter++) {
      const Lv = matVec(this.L, v);
      const norm = Lv.reduce((s, x) => s + Math.abs(x), 0);
      if (norm === 0) break;
      lambda = norm;
      v = Lv.map(x => x / norm);
    }

    if (!prim) return { lambda, imprimitive: true };
    return { lambda, stableAge: v };
  }

  /**
   * Net reproductive rate: R₀ = Σᵢ lᵢ · fᵢ
   * where l₀=1, lᵢ = s₀·…·s_{i-1}
   * @returns {number}
   */
  netReproductiveRate() {
    let R0 = this.fecundities[0];  // l₀=1
    let l = 1;
    for (let i = 1; i < this.n; i++) {
      l *= this.survivals[i - 1];
      R0 += l * this.fecundities[i];
    }
    return R0;
  }

  /**
   * Intrinsic growth rate r = ln(λ). Returns null if λ ≤ 0.
   * @param {number} [maxIter=400]
   * @returns {number|null}
   */
  intrinsicRate(maxIter = 400) {
    const { lambda } = this.dominantEigen(maxIter);
    if (lambda <= 0) return null;
    return Math.log(lambda);
  }
}
