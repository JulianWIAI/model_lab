import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ButlerVolmerModel } from '../../js/benches/chemistry/electrochemistry/butler-volmer/ButlerVolmerModel.js';

// CODATA 2018 exact values (same as model)
const F_CONST = 96485.33212;
const R_GAS   = 8.31446261815324;
const T_K     = 298.15;
const alpha   = 0.5;
const V_T_exact = R_GAS * T_K / F_CONST;  // 0.02569257912... V

test('V_T = RT/F at 25°C ±1e-12 rel', () => {
  const m = new ButlerVolmerModel({ alpha, T_K, i0: 1 });
  assert.ok(Math.abs(m.thermalVoltage() / V_T_exact - 1) < 1e-12,
    `thermalVoltage()=${m.thermalVoltage()}, expected=${V_T_exact}`);
});

test('Tafel slope = V_T·ln10/α ±1e-10 rel', () => {
  const m = new ButlerVolmerModel({ alpha, T_K, i0: 1 });
  const expected = V_T_exact * Math.log(10) / alpha;
  assert.ok(Math.abs(m.tafelSlope() / expected - 1) < 1e-10,
    `tafelSlope()=${m.tafelSlope()}, expected=${expected}`);
});

test('i(η=0) = 0 exactly', () => {
  const m = new ButlerVolmerModel({ alpha, T_K, i0: 1 });
  assert.ok(m.current(0) === 0, `current(0)=${m.current(0)}`);
});

test('i(η) = −i(−η) for α=0.5 ±1e-14 rel', () => {
  const m = new ButlerVolmerModel({ alpha: 0.5, T_K, i0: 1 });
  const iPos = m.current(0.1);
  const iNeg = m.current(-0.1);
  assert.ok(Math.abs(iPos + iNeg) / Math.abs(iPos) < 1e-14,
    `i(0.1)=${iPos}, i(-0.1)=${iNeg}, sum=${iPos + iNeg}`);
});

test('sinh form: i/i0 = 2·sinh(η/(2·V_T)) for α=0.5 ±1e-12 rel', () => {
  const m = new ButlerVolmerModel({ alpha: 0.5, T_K, i0: 1 });
  const eta = 0.3;
  const norm = m.currentNorm(eta);
  const sinh_form = 2 * Math.sinh(eta / (2 * V_T_exact));
  assert.ok(Math.abs(norm / sinh_form - 1) < 1e-12,
    `currentNorm(0.3)=${norm}, 2·sinh(...)=${sinh_form}`);
});

test('linear limit: |BV/linear − 1| < 1e-4 at η=1mV', () => {
  // At η=1mV, η/V_T ≈ 0.03892; error ~ (η/(2V_T))²/6 ≈ 6.3e-5 < 1e-4 (analytically derived)
  const m = new ButlerVolmerModel({ alpha: 0.5, T_K, i0: 1 });
  const eta = 1e-3;
  assert.ok(Math.abs(m.current(eta) / m.linearApprox(eta) - 1) < 1e-4,
    `BV=${m.current(eta)}, linear=${m.linearApprox(eta)}`);
});

test('Tafel limit: cathodic/anodic fraction < 1e-4 at η=0.5V', () => {
  const m = new ButlerVolmerModel({ alpha: 0.5, T_K, i0: 1 });
  const eta = 0.5;
  // tafelApprox ≈ BV at large anodic η (cathodic term negligible)
  assert.ok(Math.abs(m.tafelApprox(eta) / m.current(eta) - 1) < 1e-4,
    `tafelApprox=${m.tafelApprox(eta)}, BV=${m.current(eta)}`);
});

test('log10(i/i0) at η=b = 0.9956351945975499 ±1e-10 abs', () => {
  const m = new ButlerVolmerModel({ alpha: 0.5, T_K, i0: 1 });
  const b = m.tafelSlope();
  const logI = Math.log10(m.currentNorm(b));
  const expected = 0.9956351945975499;
  assert.ok(Math.abs(logI - expected) < 1e-10,
    `log10(i/i0 at η=b)=${logI}, expected≈${expected}`);
});

test('2·sinh(ln10) = 9.9 exactly', () => {
  // Verifies the exact sinh formula at η=b: i/i0 = 2·sinh(ln10) = 9.900...
  // and confirms the mathematical identity 2·sinh(ln10) = 9.9 to 1e-13
  assert.ok(Math.abs(2 * Math.sinh(Math.log(10)) - 9.9) < 1e-13,
    `2·sinh(ln10)=${2 * Math.sinh(Math.log(10))}`);
});

test('α=0.3 breaks symmetry: i(0.1) ≠ −i(−0.1)', () => {
  const m = new ButlerVolmerModel({ alpha: 0.3, T_K, i0: 1 });
  const sum = m.current(0.1) + m.current(-0.1);
  // For asymmetric α, sum should be noticeably non-zero
  assert.ok(Math.abs(sum) > 1e-6,
    `α=0.3: i(0.1)+i(-0.1)=${sum}, should be non-zero`);
});

test('alpha outside (0,1) throws RangeError', () => {
  assert.throws(() => new ButlerVolmerModel({ alpha: 0 }), RangeError);
  assert.throws(() => new ButlerVolmerModel({ alpha: 1 }), RangeError);
  assert.throws(() => new ButlerVolmerModel({ alpha: -0.1 }), RangeError);
  assert.throws(() => new ButlerVolmerModel({ alpha: 1.1 }), RangeError);
});
