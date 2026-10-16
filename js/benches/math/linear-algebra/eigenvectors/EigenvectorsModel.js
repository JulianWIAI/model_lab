/**
 * EigenvectorsModel — eigenvalue decomposition via Jacobi + power iteration.
 */
import { jacobiEigen, powerIteration, matVec, dot, norm, normF, matMul } from '../../../../core/LinAlg.js';

export class EigenvectorsModel {
  /**
   * @param {{ matrix?: number[][] }} opts
   */
  constructor({ matrix = [[2,1],[1,2]] } = {}) {
    this.matrix = matrix;
  }

  /**
   * Full Jacobi eigendecomposition.
   * @returns {{ values: number[], vectors: number[][], iters: number }}
   */
  solve() {
    const { values, vectors } = jacobiEigen(this.matrix);
    return { values, vectors, iters: 0 };
  }

  /**
   * Run power iteration for n steps from v0, return result.
   * @param {{ n?: number, v0?: number[] }} opts
   * @returns {{ lambda: number, vector: number[], residual: number, iters: number }}
   */
  powerIterResult({ n = 30, v0 = [1, 0] } = {}) {
    const result = powerIteration(this.matrix, {
      tol: 1e-15,
      maxIter: n,
      v0,
    });
    // Compute residual ‖Av - λv‖
    const Av = matVec(this.matrix, result.vector);
    const lv = result.vector.map(x => x * result.lambda);
    const residual = norm(Av.map((x, i) => x - lv[i]));
    return { ...result, residual };
  }

  /**
   * Reconstruction error ‖A - Q·D·Qᵀ‖_F.
   * @returns {number}
   */
  reconstructionError() {
    const A = this.matrix;
    const { values, vectors } = jacobiEigen(A);
    const n = A.length;
    const Arec = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let k = 0; k < n; k++)
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          Arec[i][j] += values[k] * vectors[k][i] * vectors[k][j];
    let s = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const d = A[i][j] - Arec[i][j];
        s += d * d;
      }
    return Math.sqrt(s);
  }

  /** Trace = Σλ */
  trace() {
    const { values } = jacobiEigen(this.matrix);
    return values.reduce((a, b) => a + b, 0);
  }

  /** Determinant = Πλ */
  determinant() {
    const { values } = jacobiEigen(this.matrix);
    return values.reduce((a, b) => a * b, 1);
  }
}
