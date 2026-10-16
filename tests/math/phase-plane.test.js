import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eigen2x2 } from '../../js/core/LinAlg.js';
import { PhasePlaneModel } from '../../js/benches/math/dynamics/phase-plane/PhasePlaneModel.js';

// Helper: RK4 orbit |x(tMax)|
function orbitNorm(A, x0, tMax, dt) {
  const m = new PhasePlaneModel({ A, mu: 0 });
  const orbit = m.orbit(x0, tMax, dt);
  const last = orbit[orbit.length - 1];
  return Math.hypot(last.x, last.y);
}

// ── eigen2x2 ────────────────────────────────────────────────────────────────

test('stable node [[-1,0],[0,-2]]: τ=-3 ±1e-15', () => {
  const r = eigen2x2([[-1, 0], [0, -2]]);
  assert.ok(Math.abs((r.real[0] + r.real[1]) - (-3)) < 1e-15,
    `τ=${r.real[0]+r.real[1]}`);
  assert.strictEqual(r.repeated, false);
});

test('center [[0,-1],[1,0]]: Δ=1 ±1e-15', () => {
  const r = eigen2x2([[0, -1], [1, 0]]);
  const det = 0 * 0 - (-1) * 1;
  assert.ok(Math.abs(det - 1) < 1e-15);
  // Eigenvalues are pure imaginary: re=0, im=±1
  assert.ok(Math.abs(r.real[0]) < 1e-14, `re=${r.real[0]}`);
  assert.ok(Math.abs(r.imag[0] - 1) < 1e-14, `im=${r.imag[0]}`);
});

test('stable spiral [[-1,-1],[1,-1]]: disc = -4 ±1e-15', () => {
  const A = [[-1, -1], [1, -1]];
  const tau = -2, det = 2, disc = tau ** 2 - 4 * det;
  assert.ok(Math.abs(disc - (-4)) < 1e-15, `disc=${disc}`);
  const r = eigen2x2(A);
  assert.ok(Math.abs(r.real[0] - (-1)) < 1e-14, `re=${r.real[0]}`);
  assert.ok(Math.abs(r.imag[0] - 1) < 1e-14, `im=${r.imag[0]}`);
});

test('saddle [[1,0],[0,-1]]: Δ=-1 ±1e-15', () => {
  const r = eigen2x2([[1, 0], [0, -1]]);
  const det = 1 * (-1) - 0;
  assert.ok(Math.abs(det - (-1)) < 1e-15);
  assert.ok(r.real[0] > 0 && r.real[1] < 0, `λ=${r.real}`);
});

test('unstable node [[1,0],[0,2]]: τ=3 ±1e-15', () => {
  const r = eigen2x2([[1, 0], [0, 2]]);
  assert.ok(Math.abs((r.real[0] + r.real[1]) - 3) < 1e-15);
});

test('star node [[2,0],[0,2]]: repeated=true, defective=false', () => {
  const r = eigen2x2([[2, 0], [0, 2]]);
  assert.strictEqual(r.repeated, true);
  assert.strictEqual(r.defective, false);
});

test('τ=Δ=0 classification = "Fully degenerate"', () => {
  const m = new PhasePlaneModel({ A: [[0, 0], [0, 0]] });
  assert.strictEqual(m.classification, 'Fully degenerate');
});

// ── RK4 orbit tests ────────────────────────────────────────────────────────

test('spiral |x(2π)| = e^{-2π} ±1e-6 (A=[[-1,-1],[1,-1]], x0=[1,0])', () => {
  const tMax = 2 * Math.PI;
  const norm = orbitNorm([[-1, -1], [1, -1]], [1, 0], tMax, tMax / 10000);
  const expected = Math.exp(-2 * Math.PI);
  assert.ok(Math.abs(norm - expected) < 1e-6,
    `|x(2π)|=${norm}, expected=${expected}`);
});

test('center |x(2π)| = 1 ±1e-5 (A=[[0,-1],[1,0]], x0=[1,0])', () => {
  const tMax = 2 * Math.PI;
  const norm = orbitNorm([[0, -1], [1, 0]], [1, 0], tMax, tMax / 10000);
  assert.ok(Math.abs(norm - 1) < 1e-5,
    `|x(2π)|=${norm}`);
});

// ── Nonlinear exact radius ─────────────────────────────────────────────────

test('nonlinear r(1) = 1/√3 ±1e-6 (μ=-1, r₀=1, t=1)', () => {
  const m = new PhasePlaneModel({ A: [[0, -1], [1, 0]], mu: -1 });
  const r1 = m.nonlinearRadius(1, 1);
  const expected = 1 / Math.sqrt(3);
  assert.ok(Math.abs(r1 - expected) < 1e-6,
    `r(1)=${r1}, expected=${expected}`);
});

// ── Phase-plane classification labels ──────────────────────────────────────

test('classification: stable node for [[-1,0],[0,-2]]', () => {
  const m = new PhasePlaneModel({ A: [[-1, 0], [0, -2]] });
  assert.strictEqual(m.classification, 'Stable node');
});

test('classification: unstable node for [[1,0],[0,2]]', () => {
  const m = new PhasePlaneModel({ A: [[1, 0], [0, 2]] });
  assert.strictEqual(m.classification, 'Unstable node');
});

test('classification: stable spiral for [[-1,-1],[1,-1]]', () => {
  const m = new PhasePlaneModel({ A: [[-1, -1], [1, -1]] });
  assert.strictEqual(m.classification, 'Stable spiral');
});

test('classification: unstable spiral for [[1,-1],[1,1]]', () => {
  // τ=2>0, Δ=2>0, disc=4-8=-4<0 → unstable spiral
  const m = new PhasePlaneModel({ A: [[1, -1], [1, 1]] });
  assert.strictEqual(m.classification, 'Unstable spiral');
});

test('classification: center for [[0,-1],[1,0]]', () => {
  const m = new PhasePlaneModel({ A: [[0, -1], [1, 0]] });
  assert.strictEqual(m.classification, 'Center');
});

test('classification: saddle for [[1,0],[0,-1]]', () => {
  const m = new PhasePlaneModel({ A: [[1, 0], [0, -1]] });
  assert.strictEqual(m.classification, 'Saddle');
});

test('classification: stable star node for [[2,0],[0,2]] (reflected sign)', () => {
  // [[2,0],[0,2]] → τ=4>0 → unstable
  const m = new PhasePlaneModel({ A: [[-2, 0], [0, -2]] });
  assert.strictEqual(m.classification, 'Stable star node');
});

test('classification: D≈0 from decimal arithmetic → Degenerate (zero eigenvalue)', () => {
  // A = [[0.1,0.3],[0.3,0.9]]: exact det = 0.1*0.9 - 0.3*0.3 = 0 (rank-1 matrix)
  // In floating point: 0.1*0.9 = 0.09000000000000001, 0.3*0.3 = 0.09 → det ≈ 1e-17
  // D===0 would FAIL; tolerance |D| < eps*normA² must catch it
  const A = [[0.1, 0.3], [0.3, 0.9]];
  const m = new PhasePlaneModel({ A });
  assert.strictEqual(m.classification, 'Degenerate (zero eigenvalue)');
});

// ── dt-halving convergence for spiral ─────────────────────────────────────

test('spiral dt-halving: error ratio in [12,20] (RK4 Richardson)', () => {
  // RK4 is O(dt^4): halving dt reduces error by factor ~16.
  // Accept [12, 20] to allow for slight anharmonicity in the integrand.
  const tMax = 2 * Math.PI;
  const exact = Math.exp(-tMax);
  const err1 = Math.abs(orbitNorm([[-1,-1],[1,-1]], [1,0], tMax, tMax/500)  - exact);
  const err2 = Math.abs(orbitNorm([[-1,-1],[1,-1]], [1,0], tMax, tMax/1000) - exact);
  const err3 = Math.abs(orbitNorm([[-1,-1],[1,-1]], [1,0], tMax, tMax/2000) - exact);
  const ratio12 = err1 / err2;
  const ratio23 = err2 / err3;
  assert.ok(ratio12 >= 12 && ratio12 <= 20,
    `err ratio (dt/2 halving) = ${ratio12.toFixed(2)}, expected [12,20] (RK4 ~ 16)`);
  assert.ok(ratio23 >= 12 && ratio23 <= 20,
    `err ratio (dt/4 halving) = ${ratio23.toFixed(2)}, expected [12,20] (RK4 ~ 16)`);
});

// ── dt-halving convergence for nonlinear case ─────────────────────────────

test('nonlinear r(1) dt-halving: convergence to 1/√3 (μ=-1, r₀=1)', () => {
  // Run orbit r = radial component at t=1
  const expected = 1 / Math.sqrt(3);
  function orbitR(dt) {
    const m = new PhasePlaneModel({ A: [[0, -1], [1, 0]], mu: -1 });
    const orbit = m.orbit([1, 0], 1, dt);
    const last = orbit[orbit.length - 1];
    return Math.hypot(last.x, last.y);
  }
  const e1 = Math.abs(orbitR(1e-2) - expected);
  const e2 = Math.abs(orbitR(5e-3) - expected);
  const e3 = Math.abs(orbitR(2.5e-3) - expected);
  assert.ok(e1 > e2, `e1=${e1} should > e2=${e2}`);
  assert.ok(e2 > e3, `e2=${e2} should > e3=${e3}`);
});

// ── Vector-field test ──────────────────────────────────────────────────────

test('vectorField: every point satisfies dx=A*x (μ=0)', () => {
  const A = [[-1, 2], [3, -4]];
  const m = new PhasePlaneModel({ A, mu: 0 });
  const pts = m.vectorField(2, 6);
  // At each point (x,y), dx = A[0][0]*x + A[0][1]*y, dy = A[1][0]*x + A[1][1]*y
  for (const { x, y, dx, dy } of pts) {
    const exDx = A[0][0] * x + A[0][1] * y;
    const exDy = A[1][0] * x + A[1][1] * y;
    assert.ok(Math.abs(dx - exDx) < 1e-12, `dx mismatch at (${x},${y}): dx=${dx}, expected=${exDx}`);
    assert.ok(Math.abs(dy - exDy) < 1e-12, `dy mismatch at (${x},${y}): dy=${dy}, expected=${exDy}`);
  }
});
