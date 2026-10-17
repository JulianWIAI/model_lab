/**
 * OpinionDynamicsModel — DeGroot (1974) iterative consensus model.
 *
 * Update rule: x(t+1) = W · x(t)
 *
 * Consensus (ergodic/primitive W): x(∞) = π · x(0) where π is the left
 * stationary distribution (π·W = π, Σπᵢ = 1).
 *
 * Left eigenvector found by power iteration on Wᵀ:
 *   v ← Wᵀv / ‖Wᵀv‖₁
 *
 * WARNING: jacobiEigen is symmetric-only; do NOT use it on W.
 * Uses `isPrimitive(W)` from `js/core/LinAlg.js`.
 */
import { matMul, matVec, isPrimitive } from '../../../../core/LinAlg.js';

export class OpinionDynamicsModel {
  /**
   * @param {{W: number[][]}} opts — row-stochastic weight matrix
   * @throws {RangeError} if any row does not sum to 1 (±1e-10) or has invalid entries
   */
  constructor({ W }) {
    const n = W.length;
    for (let i = 0; i < n; i++) {
      if (W[i].length !== n) {
        throw new RangeError(`OpinionDynamicsModel: W must be square; row ${i} has length ${W[i].length}`);
      }
      const rowSum = W[i].reduce((s, x) => s + x, 0);
      if (Math.abs(rowSum - 1) > 1e-10) {
        throw new RangeError(`OpinionDynamicsModel: W row ${i} sums to ${rowSum}, must be 1 ±1e-10`);
      }
      for (const x of W[i]) {
        if (x < 0 || x > 1 + 1e-10) {
          throw new RangeError(`OpinionDynamicsModel: W[${i}] has entry ${x} outside [0,1]`);
        }
      }
    }
    this.W = W;
    this.n = n;
  }

  /**
   * One DeGroot step: returns W·x.
   * @param {number[]} x  opinion vector length n
   * @returns {number[]}
   */
  step(x) {
    return matVec(this.W, x);
  }

  /**
   * Simulate T steps.
   * @param {number[]} x0  initial opinion vector
   * @param {number}   T   number of steps
   * @returns {number[][]}  [x₀, x₁, ..., x_T]
   */
  simulate(x0, T) {
    const history = [x0.slice()];
    let x = x0.slice();
    for (let t = 0; t < T; t++) {
      x = this.step(x);
      history.push(x.slice());
    }
    return history;
  }

  /**
   * Left stationary distribution π via power iteration on Wᵀ.
   * @param {number} [maxIter=1000]
   * @returns {number[]}  π with Σπᵢ=1
   */
  stationary(maxIter = 1000) {
    const n = this.n;
    // Wᵀ
    const Wt = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => this.W[j][i]));

    // Start with uniform
    let v = Array(n).fill(1 / n);
    for (let iter = 0; iter < maxIter; iter++) {
      const vNext = matVec(Wt, v);
      // L1-normalise
      const s = vNext.reduce((a, b) => a + b, 0);
      for (let i = 0; i < n; i++) vNext[i] /= s;
      // Check convergence
      let diff = 0;
      for (let i = 0; i < n; i++) diff = Math.max(diff, Math.abs(vNext[i] - v[i]));
      v = vNext;
      if (diff < 1e-14) break;
    }
    return v;
  }

  /**
   * Long-run consensus: π·x₀  (valid only for primitive W).
   * For imprimitive or reducible W, opinions do not converge to a unique
   * consensus — this method throws to prevent silent misleading results.
   * @param {number[]} x0
   * @returns {number}
   * @throws {Error} if W is not primitive
   */
  consensus(x0) {
    if (!this.primitive) {
      throw new Error(
        'OpinionDynamicsModel.consensus(): W is not primitive (imprimitive or reducible); ' +
        'opinions do not converge to a unique consensus value.',
      );
    }
    const pi = this.stationary();
    return pi.reduce((s, p, i) => s + p * x0[i], 0);
  }

  /**
   * Is W primitive? (needed for Perron-Frobenius; non-primitive W may not converge)
   * @returns {boolean}
   */
  get primitive() {
    return isPrimitive(this.W);
  }
}
