import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RCCircuitModel } from '../../js/benches/physics/electromagnetism/rc-circuit/RCCircuitModel.js';
import { Integrators } from '../../js/core/Integrators.js';

// Default parameters used across tests
const R = 1000;    // Ω
const C = 100e-6;  // F
const V0 = 5;      // V

test('tau === R * C', () => {
  const m = new RCCircuitModel({ R, C, V0 });
  assert.ok(Math.abs(m.tau - R * C) < 1e-12, `tau=${m.tau}`);
});

test('tHalf = tau * ln(2)', () => {
  const m = new RCCircuitModel({ R, C, V0 });
  assert.ok(Math.abs(m.tHalf - m.tau * Math.LN2) < 1e-10, `tHalf=${m.tHalf}`);
});

test('charging: Vc(0) = 0', () => {
  const m = new RCCircuitModel({ R, C, V0, mode: 'charge' });
  assert.ok(Math.abs(m.Vc(0)) < 1e-15, `Vc(0)=${m.Vc(0)}`);
});

test('discharging: Vc(0) = V0', () => {
  const m = new RCCircuitModel({ R, C, V0, mode: 'discharge' });
  assert.ok(Math.abs(m.Vc(0) - V0) < 1e-15, `Vc(0)=${m.Vc(0)}`);
});

test('charging: Vc(tau) ≈ V0·(1 − 1/e) ±1e-6', () => {
  const m = new RCCircuitModel({ R, C, V0, mode: 'charge' });
  // Independent check: 1 − Math.exp(−1) does not use a memorised constant
  const expected = V0 * (1 - Math.exp(-1));
  assert.ok(Math.abs(m.Vc(m.tau) - expected) < 1e-6,
    `Vc(tau)=${m.Vc(m.tau)}, expected=${expected}`);
});

test('discharging: Vc(tau) ≈ V0/e ±1e-6', () => {
  const m = new RCCircuitModel({ R, C, V0, mode: 'discharge' });
  const expected = V0 * Math.exp(-1);
  assert.ok(Math.abs(m.Vc(m.tau) - expected) < 1e-6,
    `Vc(tau)=${m.Vc(m.tau)}, expected=${expected}`);
});

test('charging: Vc(5τ) > 0.993·V0 (five-tau rule)', () => {
  const m = new RCCircuitModel({ R, C, V0, mode: 'charge' });
  assert.ok(m.Vc(5 * m.tau) > 0.993 * V0,
    `Vc(5τ)=${m.Vc(5 * m.tau)}`);
});

test('charging: I(0) = V0/R (peak current) ±1e-10', () => {
  const m = new RCCircuitModel({ R, C, V0, mode: 'charge' });
  assert.ok(Math.abs(m.I(0) - V0 / R) < 1e-10, `I(0)=${m.I(0)}`);
});

test('RK4 cross-check: max |V_rk4 − V_closed| < 1e-6 over 5000 steps', () => {
  const m = new RCCircuitModel({ R, C, V0, mode: 'charge' });
  const tau = m.tau;
  const dt  = tau / 1000;
  // ODE: dV/dt = (V0 − V) / tau
  const deriv = ([V]) => [(V0 - V) / tau];
  let y   = [0];      // V_C(0) = 0
  let t   = 0;
  let maxErr = 0;
  for (let i = 0; i < 5000; i++) {
    y  = Integrators.rk4(deriv, y, t, dt);
    t += dt;
    const closed = m.Vc(t);
    maxErr = Math.max(maxErr, Math.abs(y[0] - closed));
  }
  assert.ok(maxErr < 1e-6,
    `max error over 5000 steps = ${maxErr}`);
});

test('energy dissipated in R = ½CV0² (independent of R), trapezoid, 10000 steps', () => {
  // ∫₀^{10τ} I(t)² · R dt ≈ ½CV0²
  // Test with two different R values to confirm independence
  for (const Rtest of [1000, 10000]) {
    const m = new RCCircuitModel({ R: Rtest, C, V0, mode: 'charge' });
    const tau    = m.tau;
    const tEnd   = 10 * tau;
    const steps  = 10000;
    const dtt    = tEnd / steps;
    // Trapezoid rule: ∫f dt ≈ (f(0)/2 + f(1) + … + f(n-1) + f(n)/2) * dt
    let sum = 0;
    for (let i = 0; i <= steps; i++) {
      const t   = tEnd * i / steps;
      const I2R = m.I(t) ** 2 * Rtest;
      const w   = (i === 0 || i === steps) ? 0.5 : 1;
      sum += w * I2R;
    }
    sum *= dtt;
    const exact = 0.5 * C * V0 ** 2;
    // Tolerance: 0.001 × exact (relative tolerance; error from truncating at 10τ is e^{-20}≈2e-9)
    assert.ok(Math.abs(sum - exact) < 0.001 * exact,
      `R=${Rtest}: energy=${sum}, expected=${exact}`);
  }
});
