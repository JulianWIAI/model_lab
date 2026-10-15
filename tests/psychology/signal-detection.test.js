import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SignalDetectionModel } from '../../js/benches/psychology/psychophysics/signal-detection/SignalDetectionModel.js';

// ── erf / Φ basics ────────────────────────────────────────────────────────────

test('Phi(0) === 0.5 ±1e-10 (erf(0)=0)', () => {
  const m = new SignalDetectionModel();
  assert.ok(Math.abs(m.Phi(0) - 0.5) < 1e-10,
    `Phi(0) = ${m.Phi(0)}`);
});

test('Phi(1) ≈ 0.8413447 ±1e-6', () => {
  const m   = new SignalDetectionModel();
  const got = m.Phi(1);
  assert.ok(Math.abs(got - 0.8413447) < 1e-6,
    `Phi(1) = ${got}`);
});

test('Phi(1.96) ≈ 0.9750021 ±1e-6', () => {
  const m   = new SignalDetectionModel();
  const got = m.Phi(1.96);
  assert.ok(Math.abs(got - 0.9750021) < 1e-6,
    `Phi(1.96) = ${got}`);
});

// ── Simpson integration check (independent of erf series) ────────────────────
//
// ∫_{-6}^{x} φ(t) dt where φ(t) = (1/√(2π)) e^(-t²/2)
// Computed via Simpson's 1/3 rule with 10 000 steps; must agree with Phi(x) ±1e-6.
// This tests both the erf series AND confirms the formula Phi(x) = (1+erf(x/√2))/2
// by comparing against a completely different numerical method.

function simpsonPhi(x, m) {
  const a = -6, b = x;
  const n = 10000; // must be even
  const h = (b - a) / n;
  const phi_t = t => Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI);
  let sum = phi_t(a) + phi_t(b);
  for (let i = 1; i < n; i++) {
    const t = a + h * i;
    sum += (i % 2 === 0 ? 2 : 4) * phi_t(t);
  }
  return (h / 3) * sum;
}

test('Simpson Phi(1) ≈ model Phi(1) ±1e-6', () => {
  const m   = new SignalDetectionModel();
  const phi = simpsonPhi(1, m);
  assert.ok(Math.abs(phi - m.Phi(1)) < 1e-6,
    `Simpson Phi(1) = ${phi}, model Phi(1) = ${m.Phi(1)}`);
});

test('Simpson Phi(1.96) ≈ model Phi(1.96) ±1e-6', () => {
  const m   = new SignalDetectionModel();
  const phi = simpsonPhi(1.96, m);
  assert.ok(Math.abs(phi - m.Phi(1.96)) < 1e-6,
    `Simpson Phi(1.96) = ${phi}, model Phi(1.96) = ${m.Phi(1.96)}`);
});

test('Simpson Phi(-1) ≈ model Phi(-1) ±1e-6', () => {
  const m   = new SignalDetectionModel();
  const phi = simpsonPhi(-1, m);
  assert.ok(Math.abs(phi - m.Phi(-1)) < 1e-6,
    `Simpson Phi(-1) = ${phi}, model Phi(-1) = ${m.Phi(-1)}`);
});

// ── SDT with d′=1, c=0 ───────────────────────────────────────────────────────

test('H() ≈ 0.6915 ±0.001 (d′=1, c=0, unbiased)', () => {
  const m = new SignalDetectionModel({ d: 1, c: 0 });
  assert.ok(Math.abs(m.H() - 0.6915) < 0.001,
    `H() = ${m.H()}`);
});

test('FA() ≈ 0.3085 ±0.001 (d′=1, c=0)', () => {
  const m = new SignalDetectionModel({ d: 1, c: 0 });
  assert.ok(Math.abs(m.FA() - 0.3085) < 0.001,
    `FA() = ${m.FA()}`);
});

test('beta === 1 when c=0 (unbiased criterion)', () => {
  const m = new SignalDetectionModel({ d: 1.5, c: 0 });
  assert.ok(Math.abs(m.beta() - 1) < 1e-10,
    `beta(c=0) = ${m.beta()}`);
});

// ── AUC ──────────────────────────────────────────────────────────────────────

test('AUC() === 0.5 when d′=0', () => {
  const m = new SignalDetectionModel({ d: 0, c: 0 });
  assert.ok(Math.abs(m.AUC() - 0.5) < 1e-10,
    `AUC(d=0) = ${m.AUC()}`);
});

// Trapezoid AUC check — independent of Phi(d/√2) formula
// ROC curve: FA goes from ~1 to ~0 as c goes from -4 to +4.
// Trapezoid integral ΔFA × (H_i + H_{i-1})/2, summed with correct sign.

test('trapezoid AUC over rocCurve ≈ AUC() ±0.002 (d′=2)', () => {
  const m   = new SignalDetectionModel({ d: 2, c: 0 });
  const roc = m.rocCurve(500);
  // ROC pts go from high-FA/high-H to low-FA/low-H (c from -4 to +4)
  // Need AUC = integral from FA=0 to FA=1, i.e. reverse direction
  let trapAUC = 0;
  for (let i = 1; i < roc.length; i++) {
    const dFA = roc[i - 1].FA - roc[i].FA;  // positive (FA decreases as c increases)
    trapAUC += dFA * (roc[i].H + roc[i - 1].H) / 2;
  }
  assert.ok(Math.abs(trapAUC - m.AUC()) < 0.002,
    `trapezoid AUC = ${trapAUC.toFixed(4)}, Phi(d/√2) AUC = ${m.AUC().toFixed(4)}`);
});

// ── H > FA when d′ > 0, c = 0 ─────────────────────────────────────────────

test('H() > FA() always when d′>0 and c=0', () => {
  for (const d of [0.5, 1, 2, 3]) {
    const m = new SignalDetectionModel({ d, c: 0 });
    assert.ok(m.H() > m.FA(),
      `H(${d}) = ${m.H()}, FA(${d}) = ${m.FA()}`);
  }
});

// ── ROC curve is monotone ─────────────────────────────────────────────────────
// As c increases from -4 to +4, both H and FA decrease (more conservative).

test('rocCurve FA is monotonically non-increasing as c increases', () => {
  const m   = new SignalDetectionModel({ d: 1.5, c: 0 });
  const roc = m.rocCurve(200);
  for (let i = 1; i < roc.length; i++) {
    assert.ok(roc[i].FA <= roc[i - 1].FA + 1e-10,
      `FA not decreasing at i=${i}: ${roc[i].FA} > ${roc[i - 1].FA}`);
  }
});

// ── erf CF branch (|erf_arg| > 3, i.e., |x| > 3√2 for Phi) ─────────────────
// Phi(-6): erf_arg = -6/√2 ≈ -4.243; uses CF branch of erf.
// Phi(5):  erf_arg =  5/√2 ≈  3.536; uses CF branch.
// Reference values computed from the asymptotic series and cross-checked.

test('Phi(-6) ≈ 9.8659e-10 ±1e-12 (CF branch, extreme left tail)', () => {
  const m = new SignalDetectionModel();
  const got = m.Phi(-6);
  assert.ok(Math.abs(got - 9.865876e-10) < 1e-12,
    `Phi(-6) = ${got.toExponential(6)}, expected ≈9.865876e-10`);
});

test('Phi(5) ≈ 0.9999997133 ±1e-9 (CF branch)', () => {
  const m = new SignalDetectionModel();
  const got = m.Phi(5);
  assert.ok(Math.abs(got - 0.9999997133484) < 1e-9,
    `Phi(5) = ${got.toFixed(13)}`);
});

// Cross-check: erf near boundary (series branch at 2.5, CF branch at 3.5)
// using known accurate values.
// erf(2.5) ≈ 0.999593047982553  (series branch; |2.5| ≤ 3)
// erf(3.5) ≈ 0.999999256901628  (CF branch;    |3.5| > 3)
// Tolerance 1e-10 exercises both branches in the cross-over range 2.5–3.5.

test('erf(2.5) ≈ 0.999593047982553 ±1e-10 (series branch, near boundary)', () => {
  const m = new SignalDetectionModel();
  assert.ok(Math.abs(m.erf(2.5) - 0.999593047982553) < 1e-10,
    `erf(2.5) = ${m.erf(2.5).toFixed(15)}`);
});

test('erf(3.5) ≈ 0.999999256901628 ±1e-10 (CF branch, near boundary)', () => {
  const m = new SignalDetectionModel();
  assert.ok(Math.abs(m.erf(3.5) - 0.999999256901628) < 1e-10,
    `erf(3.5) = ${m.erf(3.5).toFixed(15)}`);
});

// ── Φ⁻¹ round-trip ───────────────────────────────────────────────────────────

test('PhiInverse(Phi(x)) ≈ x ±1e-10 for x ∈ {-2, 0, 1.5, 2.5}', () => {
  const m = new SignalDetectionModel();
  for (const x of [-2, 0, 1.5, 2.5]) {
    const rt = m.PhiInverse(m.Phi(x));
    assert.ok(Math.abs(rt - x) < 1e-10,
      `PhiInverse(Phi(${x})) = ${rt}, expected ${x}`);
  }
});

// ── dprime() ─────────────────────────────────────────────────────────────────
// dprime() = Phi^{-1}(H) - Phi^{-1}(FA).  Must recover stored d regardless of c.

test('dprime() recovers d′ regardless of c ±1e-6', () => {
  for (const [d, c] of [[2, 0], [1.5, 0.5], [0.5, -1]]) {
    const m  = new SignalDetectionModel({ d, c });
    const dp = m.dprime();
    assert.ok(Math.abs(dp - d) < 1e-6,
      `dprime(d=${d},c=${c}) = ${dp}, expected ${d}`);
  }
});

// ── A′ (Grier 1971) boundary conditions ─────────────────────────────────────

test('Aprime(d=0, c=0) === 0.5 (chance performance)', () => {
  const m = new SignalDetectionModel({ d: 0, c: 0 });
  assert.ok(Math.abs(m.Aprime() - 0.5) < 1e-10,
    `Aprime(d=0) = ${m.Aprime()}`);
});

test('Aprime(d=8, c=0) ≈ 1 ±0.001 (near-perfect discrimination)', () => {
  const m = new SignalDetectionModel({ d: 8, c: 0 });
  assert.ok(Math.abs(m.Aprime() - 1) < 0.001,
    `Aprime(d=8) = ${m.Aprime().toFixed(8)}`);
});

test('Aprime(d=-1) + Aprime(d=1) === 1 ±1e-10 (H<FA symmetry)', () => {
  // When d<0 the observer reverses signal/noise; A′ should be symmetric:
  //   A′(d) + A′(-d) = 1
  const m1  = new SignalDetectionModel({ d:  1, c: 0 });
  const mn1 = new SignalDetectionModel({ d: -1, c: 0 });
  const sum = m1.Aprime() + mn1.Aprime();
  assert.ok(Math.abs(sum - 1) < 1e-10,
    `A′(1) + A′(-1) = ${sum}, expected 1`);
});

test('Aprime(d=0) === AUC(d=0) === 0.5 (chance: both measures agree)', () => {
  const m = new SignalDetectionModel({ d: 0, c: 0 });
  assert.ok(Math.abs(m.Aprime() - m.AUC()) < 1e-10,
    `Aprime = ${m.Aprime()}, AUC = ${m.AUC()}`);
});

// ── Improved trapezoid AUC (endpoints closed) ─────────────────────────────────
// Close the ROC polygon with (FA=1,H=1) and (FA=0,H=0) before integrating.
// With 500 interior pts + 2 endpoints, error < 1e-4 for any d′ ∈ {0.5,1,2,3}.

test('trapezoid AUC (closed curve, d′∈{0.5,1,2,3}) ≈ Phi(d/√2) ±1e-4', () => {
  for (const d of [0.5, 1, 2, 3]) {
    const m   = new SignalDetectionModel({ d, c: 0 });
    const roc = m.rocCurve(500);
    // Close: prepend (FA=1,H=1) and append (FA=0,H=0)
    const pts = [{ H: 1, FA: 1 }, ...roc, { H: 0, FA: 0 }];
    let trapAUC = 0;
    for (let i = 1; i < pts.length; i++) {
      const dFA = pts[i - 1].FA - pts[i].FA;   // positive (FA decreases)
      trapAUC += dFA * (pts[i].H + pts[i - 1].H) / 2;
    }
    assert.ok(Math.abs(trapAUC - m.AUC()) < 1e-4,
      `d=${d}: trapAUC=${trapAUC.toFixed(6)}, Phi(d/√2)=${m.AUC().toFixed(6)}`);
  }
});
