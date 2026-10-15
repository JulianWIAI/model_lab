/**
 * Tests for OdeExplorerModel.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OdeExplorerModel } from '../../js/benches/math/dynamics/ode-explorer/OdeExplorerModel.js';
import { Integrators } from '../../js/core/Integrators.js';

// ── Stability tests ───────────────────────────────────────────────────────────

test('ode-explorer: RK4 stability limit ≈ 2.7853', () => {
  const limit = OdeExplorerModel.rk4StabilityLimit();
  assert.ok(Math.abs(limit - 2.785294) < 1e-4,
    `RK4 stability limit = ${limit}, expected ≈ 2.785294`);
});

test('ode-explorer: euler diverges at λh=2.5 (100 steps)', () => {
  // λ=1, h=2.5 → λh=2.5 > 2: Euler unstable
  const f = ([y]) => [-y];
  let y = [1];
  for (let i = 0; i < 100; i++) y = Integrators.euler(f, y, i * 2.5, 2.5);
  assert.ok(Math.abs(y[0]) > 1e10,
    `Euler at λh=2.5 should diverge; got ${y[0]}`);
});

test('ode-explorer: rk4 decays at λh=2.5 (100 steps)', () => {
  // λ=1, h=2.5 → λh=2.5 < 2.7853: RK4 stable
  const f = ([y]) => [-y];
  let y = [1];
  for (let i = 0; i < 100; i++) y = Integrators.rk4(f, y, i * 2.5, 2.5);
  assert.ok(Math.abs(y[0]) < 1e-10,
    `RK4 at λh=2.5 should decay to 0; got ${y[0]}`);
});

test('ode-explorer: rk4 diverges at λh=3.0 (100 steps)', () => {
  // λ=1, h=3.0 → λh=3.0 > 2.7853: RK4 unstable
  const f = ([y]) => [-y];
  let y = [1];
  for (let i = 0; i < 100; i++) y = Integrators.rk4(f, y, i * 3.0, 3.0);
  assert.ok(Math.abs(y[0]) > 1e10,
    `RK4 at λh=3.0 should diverge; got ${y[0]}`);
});

// ── Convergence / logistic ────────────────────────────────────────────────────

test('ode-explorer: logistic rk4 agrees with closed form ±1e-7 at h=0.001', () => {
  // y' = y(1−y), y(0) = 0.1. Exact: 1/(1+(1/0.1−1)·e^(−t))
  // At h=0.001 (t=5, 5000 steps), RK4 global error O(h^4·t) ~ 5e-12 << 1e-7
  const m = new OdeExplorerModel({ preset: 'logistic', method: 'rk4', h: 0.001 });
  const { y, t } = m.integrate(5);
  const yNum = y[y.length - 1];
  const yExact = m.exact(5);
  assert.ok(Math.abs(yNum - yExact) < 1e-7,
    `logistic RK4 error = ${Math.abs(yNum - yExact)}, must be < 1e-7`);
});

test('ode-explorer: logistic rk4 agrees with closed form at h=0.0005 (R2 halving)', () => {
  const m = new OdeExplorerModel({ preset: 'logistic', method: 'rk4', h: 0.0005 });
  const { y } = m.integrate(5);
  const yExact = m.exact(5);
  assert.ok(Math.abs(y[y.length - 1] - yExact) < 1e-7,
    `logistic RK4 (half dt) error = ${Math.abs(y[y.length - 1] - yExact)}, must be < 1e-7`);
});

test('ode-explorer: convergence slope for euler ≈ 1 ±0.15 on y′=−y', () => {
  const m = new OdeExplorerModel({ preset: 'decay', method: 'euler' });
  const { slope } = m.convergence();
  assert.ok(Math.abs(slope - 1) < 0.15,
    `Euler slope = ${slope.toFixed(3)}, expected 1.0 ±0.15`);
});

test('ode-explorer: convergence slope for heun ≈ 2 ±0.15 on y′=−y', () => {
  const m = new OdeExplorerModel({ preset: 'decay', method: 'heun' });
  const { slope } = m.convergence();
  assert.ok(Math.abs(slope - 2) < 0.15,
    `Heun slope = ${slope.toFixed(3)}, expected 2.0 ±0.15`);
});

test('ode-explorer: convergence slope for rk4 ≈ 4 ±0.15 on y′=−y', () => {
  const m = new OdeExplorerModel({ preset: 'decay', method: 'rk4' });
  const { slope } = m.convergence();
  assert.ok(Math.abs(slope - 4) < 0.15,
    `RK4 slope = ${slope.toFixed(3)}, expected 4.0 ±0.15`);
});

// ── backwardEuler: order-1 convergence and A-stability (MISSING) ──────────────

test('ode-explorer: convergence slope for backwardEuler ≈ 1 ±0.15 on y′=−y', () => {
  // Backward Euler is first-order: global error O(h). Same test structure as Euler/Heun/RK4.
  const m = new OdeExplorerModel({ preset: 'decay', method: 'backwardEuler' });
  const { slope } = m.convergence();
  assert.ok(Math.abs(slope - 1) < 0.15,
    `backwardEuler slope = ${slope.toFixed(3)}, expected 1.0 ±0.15`);
});

test('ode-explorer: backwardEuler is A-stable — decays at λh=3.0 where forward Euler and RK4 diverge', () => {
  // Backward Euler stability region: all λh with Re(λ) < 0 (A-stable, the real-axis
  // stability boundary is |1/(1+λh)|<1 for λh > 0 → always stable for λ>0 with any h>0).
  // At λh=3.0: forward Euler diverges (|1−λh|=|1−3|=2>1) and RK4 diverges (> limit 2.7853).
  // backwardEuler multiplier: |1/(1+3)| = 0.25 < 1 → decays.
  const f = ([y]) => [-y];
  let y = [1];
  for (let i = 0; i < 100; i++) y = Integrators.backwardEuler(f, y, i * 3.0, 3.0);
  assert.ok(Math.abs(y[0]) < 1e-10,
    `backwardEuler at λh=3.0 should decay to 0; got ${y[0]}`);
});
