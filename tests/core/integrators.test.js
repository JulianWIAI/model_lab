/**
 * Tests for js/core/Integrators.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Integrators } from '../../js/core/Integrators.js';

test('rk4: y′ = y with y(0) = 1 gives y(1) = e to nine decimal places', () => {
  // Exact solution: y(t) = e^t
  const f = ([y]) => [y];
  let y = [1];
  const dt = 0.001;
  for (let i = 0; i < 1000; i++) y = Integrators.rk4(f, y, i * dt, dt);
  assert.ok(
    Math.abs(y[0] - Math.E) < 1e-9,
    `y(1) = ${y[0]}, expected ${Math.E} (error ${Math.abs(y[0] - Math.E)})`,
  );
});

test('rk4: exact for cubic y′ = 3t², y(0) = 0 → y(2) = 8', () => {
  // RK4 is exact for polynomials up to degree 3; cubic derivative ↔ quartic solution y = t³.
  const f = ([_y], t) => [3 * t * t];
  let y = [0];
  const dt = 0.1;
  for (let i = 0; i < 20; i++) y = Integrators.rk4(f, y, i * dt, dt);
  assert.ok(Math.abs(y[0] - 8) < 1e-10, `y(2) = ${y[0]}, expected 8`);
});

test('rk4: 2D harmonic oscillator x(π) = −1, v(π) = 0', () => {
  // Exact: x(t) = cos t, v(t) = −sin t, starting from [1, 0].
  // Using exactly 1000 steps over [0, π] avoids floating-point step-count rounding.
  const f = ([x, v]) => [v, -x];
  const steps = 1000;
  const dt = Math.PI / steps; // exactly π total
  let y = [1, 0];
  for (let i = 0; i < steps; i++) y = Integrators.rk4(f, y, i * dt, dt);
  assert.ok(Math.abs(y[0] + 1) < 1e-8, `x(π) = ${y[0]}, expected −1`);
  assert.ok(Math.abs(y[1]) < 1e-8, `v(π) = ${y[1]}, expected 0`);
});

// ── Order-of-convergence helpers ─────────────────────────────────────────────
//
// Problem: y' = -y, y(0) = 1. Exact solution: y(t) = e^(-t).
// Global error at t = 1 measured for h = 0.1, 0.05, 0.025.
// Log-log slope = log(e(h1)/e(h3)) / log(h1/h3) must equal p ± 0.15.
// Independent anchor (computed 2026-10-15):
//   Euler errors:  [1.920e-2, 9.394e-3, 4.647e-3] → slope 1.023
//   Heun errors:   [6.615e-4, 1.592e-4, 3.905e-5] → slope 2.041
//   RK4 errors:    [3.332e-7, 1.998e-8, 1.223e-9] → slope 4.045

function orderSlope(stepper, hs) {
  const f = ([y], _t) => [-y];
  const errors = hs.map(h => {
    let y = [1], t = 0;
    const N = Math.round(1 / h);
    for (let i = 0; i < N; i++) { y = stepper(f, y, t, h); t += h; }
    return Math.abs(y[0] - Math.exp(-1));
  });
  return Math.log(errors[0] / errors[2]) / Math.log(hs[0] / hs[2]);
}

test('euler: order 1 on y′ = −y (log-log slope 1.0 ±0.15)', () => {
  const slope = orderSlope(Integrators.euler.bind(Integrators), [0.1, 0.05, 0.025]);
  assert.ok(Math.abs(slope - 1) < 0.15,
    `Euler slope = ${slope.toFixed(3)}, expected 1.0 ±0.15`);
});

test('heun: order 2 on y′ = −y (log-log slope 2.0 ±0.15)', () => {
  const slope = orderSlope(Integrators.heun.bind(Integrators), [0.1, 0.05, 0.025]);
  assert.ok(Math.abs(slope - 2) < 0.15,
    `Heun slope = ${slope.toFixed(3)}, expected 2.0 ±0.15`);
});

test('rk4: order 4 on y′ = −y (log-log slope 4.0 ±0.15)', () => {
  const slope = orderSlope(Integrators.rk4.bind(Integrators), [0.1, 0.05, 0.025]);
  assert.ok(Math.abs(slope - 4) < 0.15,
    `RK4 slope = ${slope.toFixed(3)}, expected 4.0 ±0.15`);
});

// ── Velocity Verlet: SHO bounded energy ──────────────────────────────────────
//
// x'' = -x, x(0)=1, v(0)=0. Exact energy E = ½(v²+x²) = 0.5.
// Velocity Verlet (symplectic) → energy error bounded, not growing.
// Anchor: max energy error < 2e-4 over 100 time units at dt=0.01
//   (computed independently: max err = 1.250e-5 << 2e-4).
// Halving test: dt=0.005 must also satisfy bounded energy (R2).

test('verlet: SHO bounded energy error over 100 time units (dt=0.01)', () => {
  const a = (x) => -x;
  let x = 1, v = 0, t = 0;
  let maxErr = 0;
  const dt = 0.01, T = 100;
  const N = Math.round(T / dt);
  for (let i = 0; i < N; i++) {
    ({ x, v } = Integrators.verlet(a, x, v, t, dt));
    t += dt;
    maxErr = Math.max(maxErr, Math.abs(0.5 * (v * v + x * x) - 0.5));
  }
  assert.ok(maxErr < 2e-4,
    `SHO energy error = ${maxErr.toExponential(3)}, must be < 2e-4 (bounded, not growing)`);
});

test('verlet: SHO bounded energy error also at halved dt=0.005 (R2 convergence)', () => {
  const a = (x) => -x;
  let x = 1, v = 0, t = 0;
  let maxErr = 0;
  const dt = 0.005, T = 100;
  const N = Math.round(T / dt);
  for (let i = 0; i < N; i++) {
    ({ x, v } = Integrators.verlet(a, x, v, t, dt));
    t += dt;
    maxErr = Math.max(maxErr, Math.abs(0.5 * (v * v + x * x) - 0.5));
  }
  assert.ok(maxErr < 2e-4,
    `SHO energy error (dt=0.005) = ${maxErr.toExponential(3)}, must be < 2e-4`);
});

// ── Velocity Verlet: central force angular momentum conservation ──────────────
//
// 2D Kepler: a = -r/|r|³. Circular orbit r=1, v=1 (GM=1).
// L = x·vy − y·vx = 1 (initial).
// Anchor: max |L − L0| < 1e-12 over 1 orbit (dt=0.001).
//   (computed independently: max err = 3.109e-15 << 1e-12)

test('verlet: central force angular momentum conserved to 1e-12 (1 orbit, dt=0.001)', () => {
  const keplerA = ([rx, ry]) => {
    const r3 = Math.pow(rx * rx + ry * ry, 1.5);
    return [-rx / r3, -ry / r3];
  };
  let pos = [1, 0], vel = [0, 1], t = 0;
  const L0 = pos[0] * vel[1] - pos[1] * vel[0]; // = 1
  let maxLerr = 0;
  const dt = 0.001;
  const N = Math.round(2 * Math.PI / dt); // ~1 orbit
  for (let i = 0; i < N; i++) {
    ({ x: pos, v: vel } = Integrators.verlet(keplerA, pos, vel, t, dt));
    t += dt;
    const L = pos[0] * vel[1] - pos[1] * vel[0];
    maxLerr = Math.max(maxLerr, Math.abs(L - L0));
  }
  assert.ok(maxLerr < 1e-12,
    `Angular momentum error = ${maxLerr.toExponential(3)}, must be < 1e-12`);
});

test('backwardEuler: stiff equation y′ = −1000(y − 1) converges to 1 with large dt', () => {
  // Exact solution: y(t) = 1 + (y₀ − 1)·e^(−1000t), quickly approaches 1.
  // dt = 0.01 is 10× larger than the stiff time constant 1/1000 = 0.001.
  // Forward Euler diverges at this step size; backward Euler (Newton) should converge.
  const f = ([y]) => [-1000 * (y - 1)];
  let y = [0]; // y(0) = 0, exact solution → 1
  const dt = 0.01;
  for (let i = 0; i < 100; i++) y = Integrators.backwardEuler(f, y, i * dt, dt);
  assert.ok(Math.abs(y[0] - 1) < 1e-6, `y(1) = ${y[0]}, expected ≈ 1`);
});
