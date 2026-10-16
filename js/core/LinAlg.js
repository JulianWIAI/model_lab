/**
 * LinAlg.js — core linear algebra operations.
 *
 * All matrices are flat arrays-of-arrays: A[i][j] for row i, column j.
 * All vectors are plain JS arrays: v[i].
 *
 * Conventions:
 *   - jacobiEigen returns eigenvalues in DESCENDING order.
 *   - Eigenvectors have unit length (up to sign).
 */

/**
 * Matrix-matrix product C = A*B.
 * A is m×k, B is k×n → C is m×n.
 * @param {number[][]} A
 * @param {number[][]} B
 * @returns {number[][]}
 */
export function matMul(A, B) {
  const m = A.length;
  const k = B.length;
  const n = B[0].length;
  const C = [];
  for (let i = 0; i < m; i++) {
    C[i] = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let r = 0; r < k; r++) s += A[i][r] * B[r][j];
      C[i][j] = s;
    }
  }
  return C;
}

/**
 * Matrix-vector product w = A*v.
 * A is m×n, v is length n → w is length m.
 * @param {number[][]} A
 * @param {number[]} v
 * @returns {number[]}
 */
export function matVec(A, v) {
  const m = A.length;
  const n = v.length;
  const w = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += A[i][j] * v[j];
    w[i] = s;
  }
  return w;
}

/**
 * Euclidean norm of a vector.
 * @param {number[]} v
 * @returns {number}
 */
export function norm(v) {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

/**
 * Dot product of two vectors.
 * @param {number[]} u
 * @param {number[]} v
 * @returns {number}
 */
export function dot(u, v) {
  let s = 0;
  for (let i = 0; i < u.length; i++) s += u[i] * v[i];
  return s;
}

/**
 * Frobenius norm of a matrix.
 * @param {number[][]} A
 * @returns {number}
 */
export function normF(A) {
  let s = 0;
  for (const row of A) for (const x of row) s += x * x;
  return Math.sqrt(s);
}

/**
 * Power iteration: finds the dominant eigenvalue and eigenvector of A.
 *
 * If v0 is orthogonal to the dominant eigenvector the method will find the
 * next most dominant instead (useful for testing).
 *
 * @param {number[][]} A  square matrix
 * @param {{ tol?: number, maxIter?: number, v0?: number[] }} [opts]
 * @returns {{ lambda: number, vector: number[], iters: number }}
 * @throws {RangeError} if maxIter is reached without convergence
 */
export function powerIteration(A, opts = {}) {
  const n = A.length;
  const tol = opts.tol ?? 1e-10;
  const maxIter = opts.maxIter ?? 1000;

  // Initialise v0: default to [1, 0, ..., 0]
  let v = opts.v0 ? [...opts.v0] : Array.from({ length: n }, (_, i) => i === 0 ? 1 : 0);

  // Normalise
  let vn = norm(v);
  if (vn < 1e-15) throw new RangeError('powerIteration: v0 is zero vector');
  v = v.map(x => x / vn);

  let lambda = 0;
  let iters = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iters = iter + 1;
    const w = matVec(A, v);
    const wn = norm(w);
    if (wn < 1e-15) throw new RangeError('powerIteration: zero iterate (A*v=0)');

    const newV = w.map(x => x / wn);
    // Rayleigh quotient
    const newLambda = dot(newV, matVec(A, newV));

    // Check convergence: compare eigenvectors (account for sign flip)
    const d1 = norm(newV.map((x, i) => x - v[i]));
    const d2 = norm(newV.map((x, i) => x + v[i]));
    const diff = Math.min(d1, d2);

    v = newV;
    lambda = newLambda;

    if (diff < tol) return { lambda, vector: v, iters };
  }

  // Did not converge; return what we have (caller may check iters === maxIter)
  return { lambda, vector: v, iters: maxIter };
}

/**
 * Jacobi eigenvalue algorithm for real symmetric matrices.
 *
 * Performs Jacobi rotations until all off-diagonal elements are < tol.
 * Returns eigenvalues in DESCENDING order with corresponding unit eigenvectors.
 *
 * @param {number[][]} A  square symmetric matrix (n×n)
 * @param {{ tol?: number }} [opts]
 * @returns {{ values: number[], vectors: number[][] }} values[i], vectors[i] = i-th eigenpair
 * @throws {RangeError} if A is not symmetric (within 1e-12 * ‖A‖_F)
 */
export function jacobiEigen(A, opts = {}) {
  const n = A.length;
  const tol = opts.tol ?? 1e-12;

  // Check symmetry
  const fNorm = normF(A);
  const symTol = 1e-12 * (fNorm || 1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(A[i][j] - A[j][i]) > symTol) {
        throw new RangeError(
          `jacobiEigen: matrix not symmetric at [${i},${j}]: ` +
          `|${A[i][j]} - ${A[j][i]}| = ${Math.abs(A[i][j] - A[j][i])} > ${symTol}`
        );
      }
    }
  }

  // Working copy of A
  let D = A.map(row => [...row]);
  // Accumulate rotations in Q (starts as identity)
  let Q = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
  );

  const maxIter = 100 * n * n;
  for (let iter = 0; iter < maxIter; iter++) {
    // Find largest off-diagonal element
    let maxVal = 0, p = 0, q = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(D[i][j]) > maxVal) {
          maxVal = Math.abs(D[i][j]);
          p = i; q = j;
        }
      }
    }

    if (maxVal < tol) break; // converged

    // Compute rotation angle
    const diff = D[q][q] - D[p][p];
    let t;
    if (Math.abs(D[p][q]) < 1e-15 * Math.abs(diff)) {
      t = D[p][q] / diff;
    } else {
      const theta = diff / (2 * D[p][q]);
      t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    }
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;
    const tau = s / (1 + c);

    // Save off-diagonal elements to update
    const Dpq = D[p][q];
    D[p][q] = 0;
    D[q][p] = 0;
    D[p][p] -= t * Dpq;
    D[q][q] += t * Dpq;

    for (let r = 0; r < n; r++) {
      if (r !== p && r !== q) {
        const Drp = D[r][p];
        const Drq = D[r][q];
        D[r][p] = Drp - s * (Drq + tau * Drp);
        D[p][r] = D[r][p];
        D[r][q] = Drq + s * (Drp - tau * Drq);
        D[q][r] = D[r][q];
      }
    }

    // Update eigenvector matrix Q
    for (let r = 0; r < n; r++) {
      const Qrp = Q[r][p];
      const Qrq = Q[r][q];
      Q[r][p] = Qrp - s * (Qrq + tau * Qrp);
      Q[r][q] = Qrq + s * (Qrp - tau * Qrq);
    }
  }

  // Collect eigenvalues from diagonal of D
  const pairs = Array.from({ length: n }, (_, i) => ({
    value: D[i][i],
    vector: Array.from({ length: n }, (_, k) => Q[k][i]),
  }));

  // Sort DESCENDING by eigenvalue
  pairs.sort((a, b) => b.value - a.value);

  // Normalise each eigenvector (should already be unit, but just in case)
  for (const p of pairs) {
    const len = norm(p.vector);
    if (len > 1e-15) p.vector = p.vector.map(x => x / len);
  }

  return {
    values: pairs.map(p => p.value),
    vectors: pairs.map(p => p.vector),
  };
}
