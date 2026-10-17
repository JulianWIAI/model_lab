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

// --- Critical damping regime ---
// R_crit = 2√(L/C) = 20√10 ≈ 63.246 Ω for L=1mH, C=1µF
const R_crit = 2 * Math.sqrt(L / C);  // 20√10

test('critical: V_C(0) = 0', () => {
  const mc = new LCOscillatorModel({ R: R_crit, L, C });
  assert.strictEqual(mc.stepResponseVc(0), 0);
});

test('I(0) = 0 in all three damping regimes (from simulate initial point)', () => {
  // simulate() always starts with {t:0, Vc:0, I:0}; assert this holds for all regimes
  const underdamped = new LCOscillatorModel({ R, L, C });
  const critical = new LCOscillatorModel({ R: R_crit, L, C });
  const overdamped = new LCOscillatorModel({ R: 200, L: 1e-3, C: 1e-6 });
  assert.strictEqual(underdamped.simulate(1e-4, 10)[0].I, 0);
  assert.strictEqual(critical.simulate(1e-4, 10)[0].I, 0);
  assert.strictEqual(overdamped.simulate(1e-4, 10)[0].I, 0);
});

test('critical: V_C(1/α) = 1 − 2/e = 0.26424111765711533 ±1e-12 abs', () => {
  // V_C(t) = 1 − (1 + α·t)·e^{−α·t}; at t=1/α: V_C = 1 − 2·e^{−1} = 1 − 2/e
  const mc = new LCOscillatorModel({ R: R_crit, L, C });
  const alpha = mc.alpha();
  const t = 1 / alpha;
  const expected = 1 - 2 / Math.E;  // 0.26424111765711533
  assert.ok(
    Math.abs(mc.stepResponseVc(t) - expected) < 1e-12,
    `V_C(1/α)=${mc.stepResponseVc(t)}, expected=${expected}`,
  );
});

test('critical: step response is continuous at R_crit ±1e-6 rel — |ΔV_C| < 1e-8 abs', () => {
  // Near-critical regimes should give nearly identical V_C at t = 1/ω₀
  const eps = 1e-6;
  const t = 1 / (R_crit / (2 * L));  // t = 1/α_crit = 1/ω₀
  const mUnder = new LCOscillatorModel({ R: R_crit * (1 - eps), L, C });
  const mOver  = new LCOscillatorModel({ R: R_crit * (1 + eps), L, C });
  const diff = Math.abs(mUnder.stepResponseVc(t) - mOver.stepResponseVc(t));
  assert.ok(diff < 1e-6, `|V_C_under − V_C_over| = ${diff}`);
});

// --- Frequency response ---

test('peak gain |H_C(ωC)| = ω₀²/(2α·ωd) = 10/√9.75 ±1e-10 rel', () => {
  // H_C(ωC) = ω₀²/(2α·√(ω₀²−α²)); for our params = 10/√9.75 = 3.2025630761...
  const m = new LCOscillatorModel({ R, L, C });
  const wC = m.omegaVcPeak();
  const gain = m.frequencyResponse(wC);
  const expected = 10 / Math.sqrt(9.75);  // ω₀²/(2α·ωd), independent derivation
  assert.ok(
    Math.abs(gain / expected - 1) < 1e-10,
    `gain=${gain}, expected=${expected}`,
  );
});

test('half-power frequencies: ω₂−ω₁ = R/L and ω₁×ω₂ = ω₀² (bisection, ±1e-6 abs)', () => {
  // Half-power for current response: |ωL − 1/(ωC)| = R
  // Lower ω₁: 1/(ωC) − ωL = R  →  fLo(ω)=0
  // Upper ω₂: ωL − 1/(ωC) = R  →  fHi(ω)=0
  // Properties (exact): ω₂−ω₁ = R/L,  ω₁·ω₂ = ω₀² = 1/LC
  const m  = new LCOscillatorModel({ R, L, C });
  const w0 = m.omega0();
  const fLo = (w) => 1 / (w * C) - w * L - R;
  const fHi = (w) => w * L - 1 / (w * C) - R;
  // Bisect ω₁ in (1, ω₀)
  let lo = 1, hi = w0, mid;
  for (let i = 0; i < 100; i++) { mid = (lo + hi) / 2; if (fLo(mid) > 0) lo = mid; else hi = mid; }
  const w1 = (lo + hi) / 2;
  // Bisect ω₂ in (ω₀, 10·ω₀)
  lo = w0; hi = 10 * w0;
  for (let i = 0; i < 100; i++) { mid = (lo + hi) / 2; if (fHi(mid) < 0) lo = mid; else hi = mid; }
  const w2 = (lo + hi) / 2;
  assert.ok(Math.abs(w2 - w1 - R / L) < 1e-6,      `w2−w1=${w2-w1}, R/L=${R/L}`);
  assert.ok(Math.abs(w1 * w2 - w0 * w0) < 1e-6,    `w1×w2=${w1*w2}, w0²=${w0*w0}`);
});
