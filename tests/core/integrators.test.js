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
