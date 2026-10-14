/**
 * Tests for MechanismsModel — exact Bateman equations for A→B→C.
 *
 * Checks:
 *   - Mass conservation [A]+[B]+[C] = [A]₀ at all times
 *   - Initial and long-time limits
 *   - t_max formula: [B] peaks at t_max
 *   - Degenerate case k₁=k₂
 *   - SSA accuracy when k₂ >> k₁
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MechanismsModel } from '../../js/benches/chemistry/kinetics/mechanisms/MechanismsModel.js';

// ─── Initial conditions ───────────────────────────────────────────────────────

test('[A](0)=[A]₀, [B](0)=0, [C](0)=0', () => {
  const m = new MechanismsModel({ k1: 0.1, k2: 0.5, A0: 2.0 });
  const { A, B, C } = m.concentrations(0);
  assert.ok(Math.abs(A - 2.0) < 1e-12, `A(0)=${A}`);
  assert.ok(Math.abs(B) < 1e-12, `B(0)=${B}`);
  assert.ok(Math.abs(C) < 1e-12, `C(0)=${C}`);
});

// ─── Mass conservation ────────────────────────────────────────────────────────

test('[A]+[B]+[C] = [A]₀ at multiple times', () => {
  const m = new MechanismsModel({ k1: 0.2, k2: 0.8, A0: 1.5 });
  for (const t of [0, 1, 5, 10, 50]) {
    const { A, B, C } = m.concentrations(t);
    assert.ok(
      Math.abs(A + B + C - 1.5) < 1e-10,
      `t=${t}: [A]+[B]+[C]=${A + B + C}, expected 1.5`,
    );
  }
});

// ─── Long-time limit ──────────────────────────────────────────────────────────

test('At t→∞, [A]→0, [B]→0, [C]→[A]₀', () => {
  const m = new MechanismsModel({ k1: 0.1, k2: 0.5, A0: 1.0 });
  const { A, B, C } = m.concentrations(500);
  assert.ok(A < 1e-15, `A(500)=${A} should be ≈0`);
  assert.ok(B < 1e-15, `B(500)=${B} should be ≈0`);
  assert.ok(Math.abs(C - 1.0) < 1e-10, `C(500)=${C} should be ≈1.0`);
});

// ─── t_max for [B] ────────────────────────────────────────────────────────────

test('[B] is maximum at t_max (k₁≠k₂)', () => {
  const m = new MechanismsModel({ k1: 0.2, k2: 1.0, A0: 1.0 });
  const tM = m.tMax;
  const B_at_tmax = m.concentrations(tM).B;
  // Check that small perturbations around tMax give smaller [B]
  const B_before = m.concentrations(tM * 0.9).B;
  const B_after  = m.concentrations(tM * 1.1).B;
  assert.ok(B_at_tmax > B_before, `[B](t_max) should exceed [B] before`);
  assert.ok(B_at_tmax > B_after,  `[B](t_max) should exceed [B] after`);
});

test('t_max formula: ln(k₂/k₁)/(k₂-k₁)', () => {
  const k1 = 0.2, k2 = 1.0;
  const m = new MechanismsModel({ k1, k2 });
  const expected = Math.log(k2 / k1) / (k2 - k1);
  assert.ok(Math.abs(m.tMax - expected) < 1e-12, `tMax=${m.tMax}, expected=${expected}`);
});

// ─── Degenerate case k₁ = k₂ ────────────────────────────────────────────────

test('k₁=k₂: [B](t)=[A]₀·k·t·e^(−kt)', () => {
  const k = 0.3, A0 = 1.0;
  const m = new MechanismsModel({ k1: k, k2: k, A0 });
  const t = 2;
  const expected = A0 * k * t * Math.exp(-k * t);
  assert.ok(
    Math.abs(m.concentrations(t).B - expected) < 1e-10,
    `[B](2)=${m.concentrations(t).B}, expected=${expected}`,
  );
});

test('k₁=k₂: mass conservation holds', () => {
  const m = new MechanismsModel({ k1: 0.3, k2: 0.3, A0: 1.0 });
  for (const t of [0, 1, 5, 20]) {
    const { A, B, C } = m.concentrations(t);
    assert.ok(Math.abs(A + B + C - 1.0) < 1e-10, `t=${t}: sum=${A + B + C}`);
  }
});

test('k₁=k₂: t_max = 1/k₁', () => {
  const k = 0.4;
  const m = new MechanismsModel({ k1: k, k2: k });
  assert.ok(Math.abs(m.tMax - 1 / k) < 1e-12);
});

// ─── Steady-state approximation ───────────────────────────────────────────────

test('SSA close to exact when k₂ >> k₁ (error < 5%)', () => {
  // k₂/k₁ = 20 → SSA should be accurate to within a few percent
  const m = new MechanismsModel({ k1: 0.05, k2: 1.0, A0: 1.0 });
  // Check at t >> 1/k₂ (transient gone) but t << 1/k₁ (A not depleted)
  const t = 5;  // t·k₂=5 >> 1, t·k₁=0.25 << 1
  const exact = m.concentrations(t).B;
  const approx = m.bSteadyState(t);
  const relErr = Math.abs(exact - approx) / exact;
  assert.ok(relErr < 0.05, `SSA relative error=${(relErr * 100).toFixed(1)}% at t=${t}`);
});

// ─── curve() ─────────────────────────────────────────────────────────────────

test('curve() returns correct length and mass conservation throughout', () => {
  const m = new MechanismsModel({ k1: 0.1, k2: 0.5, A0: 1.0 });
  const pts = m.curve(50, 200);
  assert.strictEqual(pts.length, 200);
  for (const { A, B, C } of pts) {
    assert.ok(Math.abs(A + B + C - 1.0) < 1e-9, `sum=${A + B + C}`);
  }
});
