/**
 * Tests for MaxwellBoltzmannModel — Maxwell–Boltzmann speed distribution.
 *
 * Checks:
 *   - f(v_p) is the maximum of f (verified by sampling around v_p)
 *   - ∫₀^∞ f(v)dv ≈ 1 (normalisation, trapezoidal rule)
 *   - v_p : v_mean : v_rms ≈ 1 : 1.1284 : 1.2247
 *   - Correct formulas for v_p, v_mean, v_rms
 *   - f(0) = 0
 *   - Heavier gas → smaller v_p (at same T)
 *   - Higher T → larger v_p (at same M)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MaxwellBoltzmannModel,
  GAS_PRESETS,
} from '../../js/benches/physics/thermodynamics/maxwell-boltzmann/MaxwellBoltzmannModel.js';
import { CONSTANTS } from '../../js/data/constants.js';

const R = CONSTANTS.R.value;

// ─── f(0) = 0 ─────────────────────────────────────────────────────────────────

test('f(0) = 0', () => {
  const m = new MaxwellBoltzmannModel({ M: GAS_PRESETS.N2.M, T: 300 });
  assert.strictEqual(m.f(0), 0);
});

// ─── v_p formula ─────────────────────────────────────────────────────────────

test('v_p = √(2RT/M) for N₂ at 300 K', () => {
  const M = GAS_PRESETS.N2.M, T = 300;
  const m = new MaxwellBoltzmannModel({ M, T });
  const expected = Math.sqrt(2 * R * T / M);
  assert.ok(Math.abs(m.vp - expected) < 1e-6, `vp=${m.vp}, expected=${expected}`);
});

// ─── f(v_p) is the maximum of f ──────────────────────────────────────────────

test('f(v_p) ≥ f(v_p ± 5%) — v_p is the mode', () => {
  const m = new MaxwellBoltzmannModel({ M: GAS_PRESETS.O2.M, T: 300 });
  const fp   = m.f(m.vp);
  const flo  = m.f(m.vp * 0.95);
  const fhi  = m.f(m.vp * 1.05);
  assert.ok(fp >= flo, `f(vp)=${fp} should exceed f(vp·0.95)=${flo}`);
  assert.ok(fp >= fhi, `f(vp)=${fp} should exceed f(vp·1.05)=${fhi}`);
});

// ─── Normalisation ────────────────────────────────────────────────────────────

test('∫₀^6·v_rms f(v) dv ≈ 1 (±0.001) for N₂ at 300 K', () => {
  const m = new MaxwellBoltzmannModel({ M: GAS_PRESETS.N2.M, T: 300 });
  const integral = m.integrate();
  assert.ok(
    Math.abs(integral - 1.0) < 0.001,
    `Integral = ${integral.toFixed(6)}, expected ≈1`,
  );
});

test('∫₀^6·v_rms f(v) dv ≈ 1 for He at 300 K', () => {
  const m = new MaxwellBoltzmannModel({ M: GAS_PRESETS.He.M, T: 300 });
  const integral = m.integrate();
  assert.ok(
    Math.abs(integral - 1.0) < 0.001,
    `He integral = ${integral.toFixed(6)}, expected ≈1`,
  );
});

// ─── Speed ratios ─────────────────────────────────────────────────────────────

test('v_p : v_mean : v_rms ≈ 1 : 1.1284 : 1.2247 (±0.001)', () => {
  const m = new MaxwellBoltzmannModel({ M: GAS_PRESETS.N2.M, T: 300 });
  const ratioMean = m.vmean / m.vp;
  const ratioRms  = m.vrms  / m.vp;
  const expectedMean = Math.sqrt(4 / Math.PI);   // ≈ 1.12838
  const expectedRms  = Math.sqrt(3 / 2);          // ≈ 1.22474
  assert.ok(
    Math.abs(ratioMean - expectedMean) < 0.001,
    `vmean/vp=${ratioMean.toFixed(5)}, expected ${expectedMean.toFixed(5)}`,
  );
  assert.ok(
    Math.abs(ratioRms - expectedRms) < 0.001,
    `vrms/vp=${ratioRms.toFixed(5)}, expected ${expectedRms.toFixed(5)}`,
  );
});

// ─── v_rms formula ───────────────────────────────────────────────────────────

test('v_rms = √(3RT/M)', () => {
  const M = GAS_PRESETS.O2.M, T = 400;
  const m = new MaxwellBoltzmannModel({ M, T });
  const expected = Math.sqrt(3 * R * T / M);
  assert.ok(Math.abs(m.vrms - expected) < 1e-6, `vrms=${m.vrms}, expected=${expected}`);
});

// ─── Heavier gas → smaller v_p ────────────────────────────────────────────────

test('He has higher v_p than N₂ at the same T (He is lighter)', () => {
  const T = 300;
  const mHe = new MaxwellBoltzmannModel({ M: GAS_PRESETS.He.M,  T });
  const mN2 = new MaxwellBoltzmannModel({ M: GAS_PRESETS.N2.M,  T });
  assert.ok(mHe.vp > mN2.vp, `He vp=${mHe.vp.toFixed(0)} m/s should > N₂ vp=${mN2.vp.toFixed(0)} m/s`);
});

test('CO₂ has smaller v_p than O₂ at same T', () => {
  const T = 300;
  const mCO2 = new MaxwellBoltzmannModel({ M: GAS_PRESETS.CO2.M, T });
  const mO2  = new MaxwellBoltzmannModel({ M: GAS_PRESETS.O2.M,  T });
  assert.ok(mCO2.vp < mO2.vp, `CO₂ vp should be < O₂ vp`);
});

// ─── Higher T → larger v_p ────────────────────────────────────────────────────

test('v_p increases with temperature', () => {
  const m1 = new MaxwellBoltzmannModel({ M: GAS_PRESETS.N2.M, T: 200 });
  const m2 = new MaxwellBoltzmannModel({ M: GAS_PRESETS.N2.M, T: 400 });
  assert.ok(m2.vp > m1.vp, `v_p should increase with T`);
});

// ─── GAS_PRESETS molar masses ─────────────────────────────────────────────────

test('N₂ molar mass ≈ 28.014 g/mol (CIAAW 2024)', () => {
  assert.ok(Math.abs(GAS_PRESETS.N2.M * 1000 - 28.014) < 0.001);
});

test('O₂ molar mass ≈ 31.998 g/mol (CIAAW 2024)', () => {
  assert.ok(Math.abs(GAS_PRESETS.O2.M * 1000 - 31.998) < 0.001);
});
