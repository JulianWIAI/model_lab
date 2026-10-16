import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eigen2x2, jacobiEigen } from '../../js/core/LinAlg.js';

// ── Saddle: [[1,0],[0,-1]] — two real eigenvalues with opposite signs ─────────

test('saddle [[1,0],[0,-1]]: real eigenvalues 1 and -1 ±1e-15', () => {
  const { real, imag } = eigen2x2([[1, 0], [0, -1]]);
  // eigenvalues: τ=0, Δ=-1, disc=4 → λ=±1
  const evSet = new Set(real.map(x => Math.round(x)));
  assert.ok(evSet.has(1) && evSet.has(-1), `real=${real}`);
  assert.ok(Math.abs(imag[0]) < 1e-15 && Math.abs(imag[1]) < 1e-15, `imag=${imag}`);
});

test('saddle [[1,0],[0,-1]]: disc = 4 ±1e-15', () => {
  // τ=0, Δ=-1 → disc=τ²-4Δ=0+4=4
  const A = [[1, 0], [0, -1]];
  const tau = A[0][0] + A[1][1];  // 0
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];  // -1
  const disc = tau ** 2 - 4 * det;  // 4
  assert.ok(Math.abs(disc - 4) < 1e-15, `disc=${disc}`);
  // Verify eigenvalues
  const { real } = eigen2x2(A);
  assert.ok(Math.abs(Math.max(...real) - 1) < 1e-12, `max(real)=${Math.max(...real)}`);
  assert.ok(Math.abs(Math.min(...real) + 1) < 1e-12, `min(real)=${Math.min(...real)}`);
});

// ── Stable spiral: [[-1,-1],[1,-1]] — complex conjugate eigenvalues ──────────

test('stable spiral [[-1,-1],[1,-1]]: real parts = -1, imag parts = ±1 ±1e-12', () => {
  const { real, imag, repeated, defective } = eigen2x2([[-1, -1], [1, -1]]);
  // τ=-2, Δ=2, disc=-4 → λ = -1±i
  assert.ok(Math.abs(real[0] + 1) < 1e-12, `real[0]=${real[0]}`);
  assert.ok(Math.abs(real[1] + 1) < 1e-12, `real[1]=${real[1]}`);
  assert.ok(Math.abs(Math.abs(imag[0]) - 1) < 1e-12, `|imag[0]|=${Math.abs(imag[0])}`);
  assert.ok(Math.abs(imag[0] + imag[1]) < 1e-12, `conjugate check: imag[0]+imag[1]=${imag[0]+imag[1]}`);
  assert.ok(!repeated, 'spiral should not be repeated');
  assert.ok(!defective, 'spiral should not be defective');
});

// ── Defective node: [[-1,1],[0,-1]] — repeated eigenvalue, not scalar multiple

test('defective [[-1,1],[0,-1]]: repeated=true, defective=true', () => {
  const { real, repeated, defective } = eigen2x2([[-1, 1], [0, -1]]);
  // τ=-2, Δ=1, disc=0 → λ=-1 (repeated); off-diagonal=1 → defective
  assert.ok(Math.abs(real[0] + 1) < 1e-10, `real[0]=${real[0]}`);
  assert.ok(Math.abs(real[1] + 1) < 1e-10, `real[1]=${real[1]}`);
  assert.ok(repeated, `repeated=${repeated}`);
  assert.ok(defective, `defective=${defective}`);
});

// ── Star node: [[2,0],[0,2]] — repeated eigenvalue, NOT defective ────────────

test('star node [[2,0],[0,2]]: repeated=true, defective=false', () => {
  const { real, repeated, defective } = eigen2x2([[2, 0], [0, 2]]);
  assert.ok(Math.abs(real[0] - 2) < 1e-12, `real[0]=${real[0]}`);
  assert.ok(!defective, `defective=${defective}`);
  assert.ok(repeated, `repeated=${repeated}`);
});

// ── Cross-check vs jacobiEigen on symmetric matrix [[2,1],[1,2]] ─────────────

test('eigen2x2 vs jacobiEigen on [[2,1],[1,2]]: eigenvalues match ±1e-10', () => {
  const A = [[2, 1], [1, 2]];
  // Char poly: (2-λ)²-1=0 → λ=3,1
  const { real: r2 } = eigen2x2(A);
  const { values }   = jacobiEigen(A);
  // jacobiEigen returns descending, eigen2x2 returns (τ+√disc)/2 first (larger)
  const ev2sorted = [...r2].sort((a, b) => b - a);
  assert.ok(Math.abs(ev2sorted[0] - values[0]) < 1e-10, `λ₁: eigen2x2=${ev2sorted[0]}, jacobi=${values[0]}`);
  assert.ok(Math.abs(ev2sorted[1] - values[1]) < 1e-10, `λ₂: eigen2x2=${ev2sorted[1]}, jacobi=${values[1]}`);
});
