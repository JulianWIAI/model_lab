/**
 * Tests for LinAlg.isPrimitive.
 *
 * A non-negative matrix M is primitive iff M^k > 0 for some k ≤ (n-1)²+1.
 * Imprimitive = periodic or reducible (power iteration on such M does NOT converge).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPrimitive, matMul } from '../../js/core/LinAlg.js';

// ── Leslie 3-age: L = [[0,1,5],[0.4,0,0],[0,0.6,0]] ─────────────────────────
// L^5 is the first power that is all positive (verified numerically).
// (n-1)^2+1 = 5 for n=3.

test('Leslie 3-age [[0,1,5],[0.4,0,0],[0,0.6,0]] is primitive', () => {
  const L = [[0, 1, 5], [0.4, 0, 0], [0, 0.6, 0]];
  assert.strictEqual(isPrimitive(L), true);
});

test('Leslie 3-age: L^k not all positive for k < 5, L^5 is all positive', () => {
  const L = [[0, 1, 5], [0.4, 0, 0], [0, 0.6, 0]];
  let Mk = L.map(r => [...r]);
  for (let k = 1; k <= 4; k++) {
    // k=1..4: at least one zero entry
    assert.ok(
      !Mk.every(row => row.every(x => x > 0)),
      `L^${k} should not be all positive`,
    );
    Mk = matMul(Mk, L);
  }
  // k=5: all positive
  assert.ok(
    Mk.every(row => row.every(x => x > 0)),
    'L^5 should be all positive',
  );
});

// ── 2-age imprimitive: L = [[0,4],[0.5,0]] ───────────────────────────────────
// Eigenvalues ±√2 → |λ₂/λ₁|=1 → imprimitive.
// L^even = diagonal, L^odd = anti-diagonal → never all positive.

test('2-age Leslie [[0,4],[0.5,0]] is imprimitive', () => {
  const L = [[0, 4], [0.5, 0]];
  assert.strictEqual(isPrimitive(L), false);
});

test('2-age: power iteration on [[0,4],[0.5,0]] alternates (oscillates)', () => {
  const L = [[0, 4], [0.5, 0]];
  // Manually check L^2 is diagonal → not all positive
  let Mk = L.map(r => [...r]);
  Mk = matMul(Mk, L); // L^2
  assert.ok(!Mk.every(row => row.every(x => x > 0)), 'L^2 should not be all positive');
  // L^1: also not all positive (has zeros)
  assert.ok(!L.every(row => row.every(x => x > 0)), 'L^1 should not be all positive');
});

// ── Doubly-stochastic ring (N=5): primitive ───────────────────────────────────
// W[i][j] = 1/2 if i=j, 1/4 if j=i±1 mod 5, 0 otherwise.
// W^2 is all positive (Wielandt bound for n=5: (5-1)^2+1=17, but W^2 suffices).

test('doubly-stochastic ring N=5 is primitive', () => {
  const W = [
    [0.5, 0.25, 0, 0, 0.25],
    [0.25, 0.5, 0.25, 0, 0],
    [0, 0.25, 0.5, 0.25, 0],
    [0, 0, 0.25, 0.5, 0.25],
    [0.25, 0, 0, 0.25, 0.5],
  ];
  assert.strictEqual(isPrimitive(W), true);
});

test('doubly-stochastic ring N=5: W^2 is first all-positive power', () => {
  const W = [
    [0.5, 0.25, 0, 0, 0.25],
    [0.25, 0.5, 0.25, 0, 0],
    [0, 0.25, 0.5, 0.25, 0],
    [0, 0, 0.25, 0.5, 0.25],
    [0.25, 0, 0, 0.25, 0.5],
  ];
  // W^1 has zeros
  assert.ok(!W.every(r => r.every(x => x > 0)), 'W^1 has zero entries');
  // W^2 all positive
  const W2 = matMul(W, W);
  assert.ok(W2.every(r => r.every(x => x > 0)), 'W^2 should be all positive');
});

// ── Cyclic permutation (N=4): imprimitive ────────────────────────────────────
// W = [[0,1,0,0],[0,0,1,0],[0,0,0,1],[1,0,0,0]] — shift by 1.
// Every power is a permutation matrix with zeros; never all positive.

test('cyclic permutation [[0,1,0,0],...] is imprimitive', () => {
  const W = [[0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [1, 0, 0, 0]];
  assert.strictEqual(isPrimitive(W), false);
});

// ── Edge cases ────────────────────────────────────────────────────────────────

test('1×1 positive matrix is primitive', () => {
  assert.strictEqual(isPrimitive([[3]]), true);
});

test('non-square matrix throws RangeError', () => {
  assert.throws(() => isPrimitive([[1, 2], [3, 4], [5, 6]]), RangeError);
});
