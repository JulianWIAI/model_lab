/**
 * Tests for IdealGasModel — 3D particle simulation of an ideal gas.
 *
 * Checks:
 *   - P = NkT/V (ideal gas law via measured temperature)
 *   - ⟨KE⟩ = (3/2)T per particle (equipartition)
 *   - Total KE conserved during elastic wall collisions
 *   - Particles remain inside the box
 *   - setTemperature rescales velocities correctly
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IdealGasModel } from '../../js/benches/physics/thermodynamics/ideal-gas/IdealGasModel.js';

// ─── Initial conditions ───────────────────────────────────────────────────────

test('temperatureMeasured ≈ T after initialisation (within 5%)', () => {
  const m = new IdealGasModel({ N: 200, T: 1.0, seed: 1 });
  const T_meas = m.temperatureMeasured;
  assert.ok(
    Math.abs(T_meas - 1.0) / 1.0 < 0.05,
    `T_measured=${T_meas.toFixed(4)}, expected ≈1.0`,
  );
});

// ─── Energy conservation ──────────────────────────────────────────────────────

test('total KE conserved exactly during elastic wall collisions', () => {
  const m = new IdealGasModel({ N: 50, T: 1.0, seed: 2 });
  const KE0 = m.totalKE;
  for (let i = 0; i < 1000; i++) m.step(0.01);
  const KE1 = m.totalKE;
  assert.ok(
    Math.abs(KE1 - KE0) / KE0 < 1e-8,
    `KE changed from ${KE0} to ${KE1}`,
  );
});

// ─── Equipartition: mean KE = (3/2)T per particle ────────────────────────────

test('mean KE per particle = (3/2)·T after many steps (within 5%)', () => {
  // Seed and N chosen so distribution is well-sampled
  const T = 2.0;
  const m = new IdealGasModel({ N: 300, T, seed: 3 });
  for (let i = 0; i < 2000; i++) m.step(0.005);
  const meanKE = m.totalKE / m.N;
  const expected = 1.5 * T;
  assert.ok(
    Math.abs(meanKE - expected) / expected < 0.05,
    `mean KE per particle=${meanKE.toFixed(4)}, expected ${expected}`,
  );
});

// ─── Ideal gas law P = NkT/V ──────────────────────────────────────────────────

test('pressureFormula = N·T_meas/L³ (ideal gas law identity)', () => {
  const m = new IdealGasModel({ N: 100, L: 1.0, T: 1.5, seed: 4 });
  const expected = m.N * m.temperatureMeasured / (m.L ** 3);
  assert.ok(
    Math.abs(m.pressureFormula - expected) < 1e-12,
    `P_formula=${m.pressureFormula}, expected=${expected}`,
  );
});

test('pressureFormula doubles when N doubles (same T, same V)', () => {
  const m1 = new IdealGasModel({ N: 50,  L: 1.0, T: 1.0, seed: 5 });
  const m2 = new IdealGasModel({ N: 100, L: 1.0, T: 1.0, seed: 5 });
  // Both start at approx same T; ratio should be ~2
  const ratio = m2.pressureFormula / m1.pressureFormula;
  assert.ok(
    Math.abs(ratio - 2.0) < 0.2,
    `P ratio (N=100/N=50) = ${ratio.toFixed(3)}, expected ≈2`,
  );
});

// ─── Particles stay in box ────────────────────────────────────────────────────

test('all particles remain inside [0, L] after many steps', () => {
  const L = 1.0;
  const m = new IdealGasModel({ N: 80, L, T: 1.0, seed: 6 });
  for (let i = 0; i < 500; i++) m.step(0.02);
  const pts = m.particles;
  for (const { x, y, z } of pts) {
    assert.ok(x >= 0 && x <= L + 1e-9, `x=${x} out of [0,${L}]`);
    assert.ok(y >= 0 && y <= L + 1e-9, `y=${y} out of [0,${L}]`);
    assert.ok(z >= 0 && z <= L + 1e-9, `z=${z} out of [0,${L}]`);
  }
});

// ─── setTemperature ───────────────────────────────────────────────────────────

test('setTemperature(T) rescales so temperatureMeasured ≈ T', () => {
  const m = new IdealGasModel({ N: 100, T: 1.0, seed: 7 });
  m.setTemperature(4.0);
  const T_meas = m.temperatureMeasured;
  assert.ok(
    Math.abs(T_meas - 4.0) / 4.0 < 0.01,
    `After setTemperature(4), T_measured=${T_meas.toFixed(4)}`,
  );
});

// ─── particles() ─────────────────────────────────────────────────────────────

test('particles returns N entries with speed > 0', () => {
  const m = new IdealGasModel({ N: 50, T: 1.0, seed: 8 });
  const pts = m.particles;
  assert.strictEqual(pts.length, 50);
  for (const { speed } of pts) {
    assert.ok(speed > 0, `speed=${speed} should be positive`);
  }
});
