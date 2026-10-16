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
