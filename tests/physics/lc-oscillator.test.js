import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LCOscillatorModel } from '../../js/benches/physics/electromagnetism/lc-oscillator/LCOscillatorModel.js';

// Default test parameters
const R = 10;     // Ω
const L = 1e-3;   // H
const C = 1e-6;   // F

test('α = R/(2L) = 5000 rad/s (exact)', () => {
  const m = new LCOscillatorModel({ R, L, C });
  assert.strictEqual(m.alpha(), 5000);
});

test('ω₀ = 10⁴√10 ±1e-12 rel', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const expected = 1e4 * Math.sqrt(10);
  assert.ok(
    Math.abs(m.omega0() / expected - 1) < 1e-12,
    `omega0=${m.omega0()}, expected=${expected}`,
  );
});

test('Q = √10 ±1e-12 rel', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const expected = Math.sqrt(10);
  assert.ok(
    Math.abs(m.Q() / expected - 1) < 1e-12,
    `Q=${m.Q()}, expected=${expected}`,
  );
});

test('ωd = 10⁴√9.75 ±1e-12 rel', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const expected = 1e4 * Math.sqrt(9.75);
  const wd = m.omegaDamped();
  assert.ok(wd != null, 'omegaDamped() should not be null for underdamped circuit');
  assert.ok(
    Math.abs(wd / expected - 1) < 1e-12,
    `wd=${wd}, expected=${expected}`,
  );
});

test('ωC_peak = 10⁴√9.5 ±1e-12 rel', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const expected = 1e4 * Math.sqrt(9.5);
  const wC = m.omegaVcPeak();
  assert.ok(wC != null, 'omegaVcPeak() should not be null for Q > 1/√2');
  assert.ok(
    Math.abs(wC / expected - 1) < 1e-12,
    `wC=${wC}, expected=${expected}`,
  );
});

test('bandwidth = R/L = 10000 ±1e-8 abs', () => {
  const m = new LCOscillatorModel({ R, L, C });
  assert.ok(
    Math.abs(m.bandwidth() - 10000) < 1e-8,
    `bandwidth=${m.bandwidth()}`,
  );
});

test('R_crit = 20√10 ±1e-12 rel', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const expected = 20 * Math.sqrt(10);
  assert.ok(
    Math.abs(m.criticalDamping() / expected - 1) < 1e-12,
    `criticalDamping=${m.criticalDamping()}, expected=${expected}`,
  );
});

test('ordering: ωC_peak < ωd < ω₀', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const wC = m.omegaVcPeak();
  const wd = m.omegaDamped();
  const w0 = m.omega0();
  assert.ok(wC != null, 'wC must exist');
  assert.ok(wd != null, 'wd must exist');
  assert.ok(wC < wd, `ωC=${wC} must be < ωd=${wd}`);
  assert.ok(wd < w0, `ωd=${wd} must be < ω₀=${w0}`);
});

test('step response V_C(t_qtr) = 0.8754825657666366 ±1e-10 rel', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const wd = m.omegaDamped();
  const t_qtr = Math.PI / (2 * wd);
  const expected = 0.8754825657666366;
  const got = m.stepResponseVc(t_qtr);
  assert.ok(
    Math.abs(got / expected - 1) < 1e-10,
    `stepResponseVc(t_qtr)=${got}, expected=${expected}`,
  );
});

test('step response V_C(0) = 0', () => {
  const m = new LCOscillatorModel({ R, L, C });
  assert.strictEqual(m.stepResponseVc(0), 0);
});

test('RK4 vs closed-form < 1e-7 rel at t_qtr', () => {
  const m = new LCOscillatorModel({ R, L, C });
  const wd = m.omegaDamped();
  const t_qtr = Math.PI / (2 * wd);
  const pts = m.simulate(t_qtr, 1000);
  const Vc_rk4 = pts[pts.length - 1].Vc;
  const Vc_formula = m.stepResponseVc(t_qtr);
  assert.ok(
    Math.abs(Vc_rk4 / Vc_formula - 1) < 1e-7,
    `RK4=${Vc_rk4}, formula=${Vc_formula}, rel_err=${Math.abs(Vc_rk4 / Vc_formula - 1)}`,
  );
});

test('R ≤ 0 throws RangeError', () => {
  assert.throws(() => new LCOscillatorModel({ R: 0, L: 1e-3, C: 1e-6 }), RangeError);
});

test('overdamped: omegaDamped() = null for R > R_crit', () => {
  const m = new LCOscillatorModel({ R: 200, L: 1e-3, C: 1e-6 });
  assert.strictEqual(m.omegaDamped(), null);
  assert.strictEqual(m.dampingRegime(), 'overdamped');
});

test('dampingRegime = underdamped for R=10', () => {
  const m = new LCOscillatorModel({ R, L, C });
  assert.strictEqual(m.dampingRegime(), 'underdamped');
});

test('overdamped: stepResponseVc(0) = 0', () => {
  const m = new LCOscillatorModel({ R: 200, L: 1e-3, C: 1e-6 });
  assert.strictEqual(m.stepResponseVc(0), 0);
});

test('overdamped: RK4 vs closed-form < 1e-7 rel', () => {
  // R=200Ω, L=1mH, C=1µF — overdamped; α=100000, ω₀=31623
  const m = new LCOscillatorModel({ R: 200, L: 1e-3, C: 1e-6 });
  const tEnd = 5e-5;  // 50µs — well within settling
  const pts = m.simulate(tEnd, 500);
  const Vc_rk4 = pts[pts.length - 1].Vc;
  const Vc_formula = m.stepResponseVc(tEnd);
  assert.ok(
    Math.abs(Vc_rk4 - Vc_formula) < 1e-7,
    `overdamped RK4=${Vc_rk4}, formula=${Vc_formula}, err=${Math.abs(Vc_rk4 - Vc_formula)}`,
  );
});
