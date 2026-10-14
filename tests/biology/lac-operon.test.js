/**
 * Tests for LacOperonModel — qualitative ODE model of the lac operon.
 *
 * Tests verify qualitative behaviour rather than exact values:
 *   - glucose=1, lactose=0 → repressed (lacZ < 0.05 after 500 steps)
 *   - glucose=0, lactose=1 → induced  (lacZ > 0.5 after 500 steps)
 *   - glucose=0, lactose=0 → no inducer (lacZ < 0.1 after 200 steps)
 *   - Non-negativity at every step
 *   - Hysteresis: sweep inducer up then down, switch-on differs from switch-off
 *
 * NOTE: This is a qualitative model adapted from Yildirim & Mackey 2003.
 * Numerical thresholds reflect the chosen dimensionless parameters, not
 * experimental measurements.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LacOperonModel } from '../../js/benches/biology/molecular/lac-operon/LacOperonModel.js';

function runSteps(model, n, dt = 0.05) {
  for (let i = 0; i < n; i++) model.step(dt);
}

test('All state variables are ≥ 0 at every step (500 steps, glucose=0, lactose=1)', () => {
  const m = new LacOperonModel({ glucose: 0, lactose: 1 });
  for (let i = 0; i < 500; i++) {
    m.step(0.05);
    assert.ok(m.mRNA >= 0,        `mRNA < 0 at step ${i}: ${m.mRNA}`);
    assert.ok(m.lacZ >= 0,        `lacZ < 0 at step ${i}: ${m.lacZ}`);
    assert.ok(m.allolactose >= 0, `allolactose < 0 at step ${i}: ${m.allolactose}`);
  }
});

test('Glucose=1, lactose=0: lacZ < 0.05 after 500 steps (catabolite repression)', () => {
  const m = new LacOperonModel({ glucose: 1, lactose: 0 });
  runSteps(m, 500);
  assert.ok(
    m.lacZ < 0.05,
    `Expected lacZ < 0.05 (repressed), got lacZ=${m.lacZ.toFixed(4)}`,
  );
});

test('Glucose=0, lactose=1: lacZ > 0.5 after 500 steps (fully induced)', () => {
  const m = new LacOperonModel({ glucose: 0, lactose: 1 });
  runSteps(m, 500);
  assert.ok(
    m.lacZ > 0.5,
    `Expected lacZ > 0.5 (induced), got lacZ=${m.lacZ.toFixed(4)}`,
  );
});

test('Glucose=0, lactose=0: lacZ < 0.1 after 200 steps (no inducer)', () => {
  const m = new LacOperonModel({ glucose: 0, lactose: 0 });
  runSteps(m, 200);
  assert.ok(
    m.lacZ < 0.1,
    `Expected lacZ < 0.1 (uninduced), got lacZ=${m.lacZ.toFixed(4)}`,
  );
});

test('reset() restores near-zero state and time=0', () => {
  const m = new LacOperonModel({ glucose: 0, lactose: 1 });
  runSteps(m, 200);
  m.reset();
  assert.equal(m.time, 0);
  assert.ok(m.mRNA < 0.1, `mRNA after reset: ${m.mRNA}`);
  assert.ok(m.lacZ < 0.1, `lacZ after reset: ${m.lacZ}`);
});

test('mRNA eventually exceeds initial value when lactose=1, glucose=0 (100 steps)', () => {
  // mRNA dips initially because allolactose starts near zero; it rises once A accumulates
  const m = new LacOperonModel({ glucose: 0, lactose: 1 });
  const m0 = m.mRNA;
  runSteps(m, 100);
  assert.ok(m.mRNA > m0, `mRNA should exceed initial value after 100 steps: ${m.mRNA} vs ${m0}`);
});

test('Bistability: at intermediate lactose (L=0.01), low and high initial states converge to different steady states', () => {
  // The lac operon is bistable at intermediate lactose concentrations:
  // starting from near-zero gives the OFF state; starting from a fully-induced
  // state keeps the ON state. This is the hallmark of hysteresis.
  //
  // At L=0.02 the system is beyond LOn (both states converge to ON).
  // At L=0.01 the uninduced state stays OFF while the pre-induced state stays ON.
  const BISTABLE_L = 0.01;
  const STEPS = 2000;

  // Low initial condition → OFF state
  const mLow = new LacOperonModel({ glucose: 0, lactose: BISTABLE_L });
  for (let i = 0; i < STEPS; i++) mLow.step(0.05);

  // High initial condition (pre-induced) → ON state
  const mHigh = new LacOperonModel({ glucose: 0, lactose: BISTABLE_L });
  mHigh._y = [5, 30, 30]; // start in induced-like state
  for (let i = 0; i < STEPS; i++) mHigh.step(0.05);

  // The two starting conditions must converge to clearly different steady states
  assert.ok(
    mLow.lacZ < 1,
    `Low-start lacZ at L=${BISTABLE_L}: expected near 0, got ${mLow.lacZ.toFixed(3)}`,
  );
  assert.ok(
    mHigh.lacZ > 10,
    `High-start lacZ at L=${BISTABLE_L}: expected > 10 (ON state), got ${mHigh.lacZ.toFixed(3)}`,
  );
  assert.ok(
    mHigh.lacZ - mLow.lacZ > 10,
    `Expected bistability gap > 10, got ${(mHigh.lacZ - mLow.lacZ).toFixed(3)}`,
  );
});
