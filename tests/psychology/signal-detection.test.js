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
