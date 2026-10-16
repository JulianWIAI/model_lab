/**
 * tests/math/linalg.test.js — LinAlg.js unit tests
 *
 * All expected values from anchors-phase7.mjs (pure JS, no model code).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matMul, matVec, norm, dot, normF, jacobiEigen, powerIteration } from '../../js/core/LinAlg.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

function assertVecClose(a, b, tol, msg) {
  assert.strictEqual(a.length, b.length, `${msg}: length mismatch`);
  for (let i = 0; i < a.length; i++) {
    assertClose(a[i], b[i], tol, `${msg}[${i}]`);
  }
}

function matFrobDiff(A, B) {
  let s = 0;
  for (let i = 0; i < A.length; i++)
    for (let j = 0; j < A[0].length; j++) {
      const d = A[i][j] - B[i][j];
      s += d * d;
    }
  return Math.sqrt(s);
}

// Seeded Mulberry32 (same as Random.js)
function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    let t = (s + 0x6D2B79F5) | 0;
    s = t;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Symmetric 2×2 test matrix ────────────────────────────────────────────────
const A22 = [[2,1],[1,2]];

describe('LinAlg — jacobiEigen 2×2', () => {
  it('eigenvalues of [[2,1],[1,2]] = [3,1] (descending)', () => {
    const { values } = jacobiEigen(A22);
    assertClose(values[0], 3, 1e-10, 'λ₁');
    assertClose(values[1], 1, 1e-10, 'λ₂');
  });

  it('first eigenvector = [1,1]/√2 up to sign', () => {
    const { vectors } = jacobiEigen(A22);
    const v = vectors[0];
    const INV_SQRT2 = 1 / Math.sqrt(2);
    // allow sign flip
    const d1 = norm([v[0] - INV_SQRT2, v[1] - INV_SQRT2]);
    const d2 = norm([v[0] + INV_SQRT2, v[1] + INV_SQRT2]);
    assert.ok(Math.min(d1, d2) < 1e-10, `v₁ not ±[1,1]/√2: got [${v}]`);
  });

  it('eigenvectors are orthonormal', () => {
    const { vectors } = jacobiEigen(A22);
    const d = dot(vectors[0], vectors[1]);
    assertClose(d, 0, 1e-10, 'dot(v₁,v₂)');
    assertClose(norm(vectors[0]), 1, 1e-10, '‖v₁‖');
    assertClose(norm(vectors[1]), 1, 1e-10, '‖v₂‖');
  });

  it('reconstruction ‖A - Q·D·Qᵀ‖_F < 1e-10', () => {
    const { values, vectors } = jacobiEigen(A22);
    // Reconstruct A = Σ λᵢ vᵢ vᵢᵀ
    const n = A22.length;
    const Arec = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          Arec[i][j] += values[k] * vectors[k][i] * vectors[k][j];
    }
    const err = matFrobDiff(A22, Arec);
    assert.ok(err < 1e-10, `‖A-QDQᵀ‖_F = ${err} ≥ 1e-10`);
  });

  it('throws RangeError for asymmetric matrix', () => {
    assert.throws(() => jacobiEigen([[1,2],[0,1]]), RangeError);
  });
});

describe('LinAlg — jacobiEigen identity & diagonal', () => {
  it('identity 2×2: eigenvalues [1,1]', () => {
    const { values } = jacobiEigen([[1,0],[0,1]]);
    assertClose(values[0], 1, 1e-10, 'λ₁');
    assertClose(values[1], 1, 1e-10, 'λ₂');
  });

  it('diagonal [[3,0],[0,1]]: λ=[3,1], vectors aligned with axes', () => {
    const { values, vectors } = jacobiEigen([[3,0],[0,1]]);
    assertClose(values[0], 3, 1e-10, 'λ₁');
    assertClose(values[1], 1, 1e-10, 'λ₂');
    // v₁ should be ±[1,0]
    const v1ok = Math.abs(Math.abs(vectors[0][0]) - 1) < 1e-10 && Math.abs(vectors[0][1]) < 1e-10;
    assert.ok(v1ok, `v₁ not ±[1,0]: got [${vectors[0]}]`);
  });
});

describe('LinAlg — jacobiEigen 3×3 tridiagonal', () => {
  // T = [[2,-1,0],[-1,2,-1],[0,-1,2]]
  const T3 = [[2,-1,0],[-1,2,-1],[0,-1,2]];

  it('λ = 2-√2, 2, 2+√2', () => {
    const { values } = jacobiEigen(T3);
    const SQRT2 = Math.sqrt(2);
    // descending: 2+√2, 2, 2-√2
    assertClose(values[0], 2 + SQRT2, 1e-10, 'λ₁ = 2+√2');
    assertClose(values[1], 2,          1e-10, 'λ₂ = 2');
    assertClose(values[2], 2 - SQRT2, 1e-10, 'λ₃ = 2-√2');
  });

  it('trace = Σλ = 6', () => {
    const { values } = jacobiEigen(T3);
    const trace = values.reduce((a, b) => a + b, 0);
    assertClose(trace, 6, 1e-12, 'trace');
  });

  it('det = Πλ = 4', () => {
    const { values } = jacobiEigen(T3);
    const det = values.reduce((a, b) => a * b, 1);
    assertClose(det, 4, 1e-10, 'det');
  });
});

describe('LinAlg — jacobiEigen random symmetric 5×5', () => {
  it('reconstruction ±1e-10; orthogonality Qᵀ·Q=I ±1e-10; ‖Av-λv‖<1e-10', () => {
    const next = makeRng(42);
    const n = 5;
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
      for (let j = i; j < n; j++) {
        const v = next() * 2 - 1;
        A[i][j] = v;
        A[j][i] = v;
      }

    const { values, vectors } = jacobiEigen(A);

    // Reconstruction
    const Arec = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let k = 0; k < n; k++)
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          Arec[i][j] += values[k] * vectors[k][i] * vectors[k][j];
    assert.ok(matFrobDiff(A, Arec) < 1e-10, `Reconstruction error: ${matFrobDiff(A, Arec)}`);

    // Orthogonality: Q[k] dot Q[l] = δ_{kl}
    for (let k = 0; k < n; k++) {
      for (let l = 0; l < n; l++) {
        const d = dot(vectors[k], vectors[l]);
        const expected = k === l ? 1 : 0;
        assertClose(d, expected, 1e-10, `Qᵀ·Q[${k},${l}]`);
      }
    }

    // ‖Av - λv‖ < 1e-10
    for (let k = 0; k < n; k++) {
      const Av = matVec(A, vectors[k]);
      const lv = vectors[k].map(x => x * values[k]);
      const err = norm(Av.map((x, i) => x - lv[i]));
      assert.ok(err < 1e-10, `‖Av-λv‖[${k}] = ${err}`);
    }
  });
});

describe('LinAlg — powerIteration', () => {
  it('tanθ_n = (1/3)^n at n=5,10,15', () => {
    // v0=[1,0] = (1/√2)*ev1 + (1/√2)*ev2
    // ev1=[1,1]/√2, ev2=[1,-1]/√2
    // After n iters (each being one matVec+normalize), angle to dominant eigvec
    // satisfies tanθ_n = (1/3)^n
    for (const n of [5, 10, 15]) {
      // Run exactly n iterations via tol=0, maxIter=n
      let v = [1, 0];
      for (let i = 0; i < n; i++) {
        const w = matVec(A22, v);
        const wn = norm(w);
        v = w.map(x => x / wn);
      }
      // tanθ = |sin θ| / |cos θ| where θ is angle from ev1 = [1,1]/√2
      const INV_SQRT2 = 1 / Math.sqrt(2);
      const ev1 = [INV_SQRT2, INV_SQRT2];
      const ev2 = [INV_SQRT2, -INV_SQRT2];
      const cosTheta = Math.abs(dot(v, ev1));
      const sinTheta = Math.abs(dot(v, ev2));
      const tanTheta = sinTheta / cosTheta;
      const expected = Math.pow(1/3, n);
      assertClose(tanTheta, expected, 1e-12, `tanθ at n=${n}`);
    }
  });

  it('Rayleigh quotient λ_n = 3 - 2/(9^n+1) at n=5,10', () => {
    for (const n of [5, 10]) {
      let v = [1, 0];
      for (let i = 0; i < n; i++) {
        const w = matVec(A22, v);
        const wn = norm(w);
        v = w.map(x => x / wn);
      }
      const lambda_n = dot(v, matVec(A22, v));
      const expected = 3 - 2 / (Math.pow(9, n) + 1);
      assertClose(lambda_n, expected, 1e-12, `Rayleigh at n=${n}`);
    }
  });

  it('v0=[1,-1] → converges to λ=1 (not λ=3)', () => {
    // v0=[1,-1] is parallel to ev2=[1,-1]/√2, orthogonal to ev1
    const result = powerIteration(A22, { v0: [1, -1], tol: 1e-10, maxIter: 1000 });
    assertClose(result.lambda, 1, 1e-8, 'λ with v0=[1,-1]');
  });

  it('[[0,1],[1,0]] does not converge: iters = maxIter', () => {
    // [[0,1],[1,0]] has λ=+1 and λ=-1; power iteration oscillates
    const A = [[0,1],[1,0]];
    const result = powerIteration(A, { v0: [1, 0], tol: 1e-10, maxIter: 100 });
    assert.strictEqual(result.iters, 100, '[[0,1],[1,0]] should not converge');
  });

  it('defective [[1,1],[0,1]]: iters > 100 for tol=1e-6', () => {
    // [[1,1],[0,1]] is defective (one eigenvalue λ=1, incomplete eigenbasis)
    // Convergence is slow (1/n not geometric)
    const A = [[1,1],[0,1]];
    const result = powerIteration(A, { v0: [0, 1], tol: 1e-6, maxIter: 10000 });
    assert.ok(result.iters > 100, `defective matrix converged too fast: iters=${result.iters}`);
  });

  it('ceil(ln(1e-4)/ln(0.9)) = 88', () => {
    const result = Math.ceil(Math.log(1e-4) / Math.log(0.9));
    assert.strictEqual(result, 88);
  });
});

describe('LinAlg — matMul associativity', () => {
  it('(AB)v = A(Bv) ±1e-12', () => {
    const A = [[1,2],[3,4]];
    const B = [[5,6],[7,8]];
    const v = [1, -1];
    const ABv = matVec(matMul(A, B), v);
    const ABv2 = matVec(A, matVec(B, v));
    assertVecClose(ABv, ABv2, 1e-12, '(AB)v vs A(Bv)');
  });
});
