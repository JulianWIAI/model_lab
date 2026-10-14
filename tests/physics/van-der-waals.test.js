/**
 * Tests for VanDerWaalsModel — van der Waals equation of state.
 *
 * Checks:
 *   - Z_c = 3/8 = 0.375 exactly (universal VdW prediction)
 *   - Critical point: P(T_c, V_c) = P_c; V_c = 3b; T_c = 8a/(27Rb)
 *   - Ideal gas limit: a→0, b→0 → P = RT/V_m
 *   - pressure(T, V_m) matches R·T/(V_m−b) − a/V_m²
 *   - Real CO₂ Z_c ≈ 0.275 (NIST WebBook; Suehiro et al. 1996)
 *   - reduced-form VdW at critical point: P_r = P_c/P_c = 1
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VanDerWaalsModel,
  CO2_PRESET,
} from '../../js/benches/physics/thermodynamics/van-der-waals/VanDerWaalsModel.js';
import { CONSTANTS } from '../../js/data/constants.js';

const R = CONSTANTS.R.value;

// ─── Z_c = 0.375 universally ──────────────────────────────────────────────────

test('Z_c = 3/8 = 0.375 exactly for any VdW model', () => {
  const m = new VanDerWaalsModel();  // CO₂ defaults
  const { Zc } = m.criticalPoint;
  assert.ok(Math.abs(Zc - 0.375) < 1e-10, `Z_c=${Zc}`);
});

test('Z_c = 0.375 for a different gas (arbitrary a, b)', () => {
  const m = new VanDerWaalsModel({ a: 1.5, b: 3e-5 });
  const { Zc } = m.criticalPoint;
  assert.ok(Math.abs(Zc - 0.375) < 1e-10, `Z_c=${Zc}`);
});

// ─── Critical point formulas ──────────────────────────────────────────────────

test('V_c = 3b', () => {
  const m = new VanDerWaalsModel();
  const { Vc } = m.criticalPoint;
  assert.ok(Math.abs(Vc - 3 * m.b) < 1e-20, `Vc=${Vc}, 3b=${3 * m.b}`);
});

test('T_c = 8a/(27Rb)', () => {
  const m = new VanDerWaalsModel();
  const { Tc } = m.criticalPoint;
  const expected = 8 * m.a / (27 * R * m.b);
  assert.ok(Math.abs(Tc - expected) < 1e-6, `Tc=${Tc}, expected=${expected}`);
});

test('P_c = a/(27b²)', () => {
  const m = new VanDerWaalsModel();
  const { Pc } = m.criticalPoint;
  const expected = m.a / (27 * m.b * m.b);
  assert.ok(Math.abs(Pc - expected) < 1e-3, `Pc=${Pc}, expected=${expected}`);
});

test('P(T_c, V_c) = P_c (model is self-consistent at critical point)', () => {
  const m = new VanDerWaalsModel();
  const { Tc, Vc, Pc } = m.criticalPoint;
  const P_at_crit = m.pressure(Tc, Vc);
  assert.ok(
    Math.abs(P_at_crit - Pc) / Pc < 1e-8,
    `P(Tc,Vc)=${P_at_crit}, Pc=${Pc}`,
  );
});

// ─── Ideal gas limit ─────────────────────────────────────────────────────────

test('pressure ≈ RT/Vm when a≈0 and b≈0 (ideal gas)', () => {
  const m = new VanDerWaalsModel({ a: 1e-10, b: 1e-10 });
  const T = 300, Vm = 1e-3;
  const P_ideal = R * T / Vm;
  const P_vdw   = m.pressure(T, Vm);
  assert.ok(Math.abs(P_vdw - P_ideal) / P_ideal < 1e-4, `P_vdw=${P_vdw}, P_ideal=${P_ideal}`);
});

// ─── Manual pressure check ────────────────────────────────────────────────────

test('pressure formula matches R·T/(Vm−b) − a/Vm²', () => {
  const a = 0.3658, b = 4.286e-5;
  const m = new VanDerWaalsModel({ a, b });
  const T = 350, Vm = 5e-4;
  const expected = R * T / (Vm - b) - a / (Vm * Vm);
  assert.ok(Math.abs(m.pressure(T, Vm) - expected) < 1e-6, `P=${m.pressure(T, Vm)}, expected=${expected}`);
});

// ─── Reduced-form VdW ────────────────────────────────────────────────────────

test('pressureReduced(Tr=1, Vr=1) = 1 (critical point in reduced coordinates)', () => {
  const m = new VanDerWaalsModel();
  const Pr = m.pressureReduced(1, 1);
  assert.ok(Math.abs(Pr - 1.0) < 1e-10, `P_r(1,1)=${Pr}`);
});

// ─── fromCritical factory ─────────────────────────────────────────────────────

test('fromCritical(Tc, Pc).criticalPoint.Tc ≈ input Tc', () => {
  const Tc = 304.18, Pc = 73.80e5;
  const m = VanDerWaalsModel.fromCritical(Tc, Pc);
  assert.ok(Math.abs(m.criticalPoint.Tc - Tc) < 0.01, `Tc_recovered=${m.criticalPoint.Tc}`);
});

test('fromCritical(Tc, Pc).criticalPoint.Pc ≈ input Pc', () => {
  const Tc = 304.18, Pc = 73.80e5;
  const m = VanDerWaalsModel.fromCritical(Tc, Pc);
  assert.ok(Math.abs(m.criticalPoint.Pc - Pc) / Pc < 1e-8, `Pc_recovered=${m.criticalPoint.Pc}`);
});

// ─── Real CO₂ Z_c comparison ─────────────────────────────────────────────────

test('CO2_PRESET.Zc_real ≈ 0.275 (vs VdW = 0.375, NIST WebBook)', () => {
  // NIST: Tc=304.18 K, Pc=73.80 bar, ρc=10.6 mol/L
  // Zc_real = Pc·Vc/(R·Tc) ≈ 0.275
  assert.ok(
    CO2_PRESET.Zc_real > 0.27 && CO2_PRESET.Zc_real < 0.28,
    `CO₂ Zc_real=${CO2_PRESET.Zc_real.toFixed(4)}; expected ≈0.275`,
  );
  // Confirm the gap: VdW overestimates Zc significantly
  assert.ok(
    0.375 - CO2_PRESET.Zc_real > 0.09,
    `VdW Zc=0.375 should exceed real CO₂ Zc by >0.09`,
  );
});

// ─── isotherm ────────────────────────────────────────────────────────────────

test('isotherm() returns correct length', () => {
  const m = new VanDerWaalsModel();
  const { Tc } = m.criticalPoint;
  const pts = m.isotherm(Tc, undefined, undefined, 300);
  assert.strictEqual(pts.length, 300);
});

test('above T_c: P is monotonically decreasing with V_m (no VdW loop)', () => {
  const m = new VanDerWaalsModel();
  const { Tc, Vc } = m.criticalPoint;
  const T = Tc * 1.1;
  // Sweep from V_c to 8V_c; pressure should decrease monotonically
  const pts = m.isotherm(T, Vc, 8 * Vc, 200);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(
      pts[i].P < pts[i - 1].P,
      `Above Tc, P should decrease monotonically at index ${i}`,
    );
  }
});
