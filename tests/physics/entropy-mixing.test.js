/**
 * Tests for EntropyMixingModel.
 *
 * Anchors computed in tools/anchors-phase9.mjs §1.
 * R = N_A·k_B = 8.31446261815324 J/(mol·K)  (CODATA 2018, exact SI 2019)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EntropyMixingModel, R_GAS } from '../../js/benches/physics/thermodynamics/entropy-mixing/EntropyMixingModel.js';

// ── R constant ────────────────────────────────────────────────────────────────

test('R_GAS = 8.31446261815324 J/(mol·K) to 1e-12 relative', () => {
  assert.ok(Math.abs(R_GAS / 8.31446261815324 - 1) < 1e-12,
    `R_GAS=${R_GAS} should be 8.31446261815324`);
});

// ── Pure component ────────────────────────────────────────────────────────────

test('pure component (x=1) gives ΔS = +0 (not NaN or -0)', () => {
  const m = new EntropyMixingModel([{ name: 'A', x: 1.0 }, { name: 'B', x: 0.0 }]);
  const dS = m.deltaS();
  assert.strictEqual(dS, 0, 'ΔS must be exactly 0');
  assert.ok(!Object.is(dS, -0), 'ΔS must be +0, not -0');
});

// ── Binary equimolar ─────────────────────────────────────────────────────────

test('binary equimolar ΔS = R·ln2 to 1e-15 relative', () => {
  const m = new EntropyMixingModel([{ name: 'A', x: 0.5 }, { name: 'B', x: 0.5 }]);
  const dS  = m.deltaS();
  const ref = R_GAS * Math.LN2;
  assert.ok(Math.abs(dS / ref - 1) < 1e-15,
    `binary ΔS relative error: ${dS / ref - 1}`);
});

// ── Ternary equimolar ─────────────────────────────────────────────────────────

test('ternary equimolar ΔS = R·ln3 to 1e-15 relative', () => {
  const m = new EntropyMixingModel([
    { name: 'A', x: 1/3 },
    { name: 'B', x: 1/3 },
    { name: 'C', x: 1/3 },
  ]);
  const dS  = m.deltaS();
  const ref = R_GAS * Math.log(3);
  assert.ok(Math.abs(dS / ref - 1) < 1e-15,
    `ternary ΔS relative error: ${dS / ref - 1}`);
});

// ── Quaternary equimolar = 2·R·ln2 ───────────────────────────────────────────

test('quaternary equimolar ΔS = 2·R·ln2 to 1e-15 relative', () => {
  const m = new EntropyMixingModel([
    { name: 'A', x: 0.25 }, { name: 'B', x: 0.25 },
    { name: 'C', x: 0.25 }, { name: 'D', x: 0.25 },
  ]);
  const dS  = m.deltaS();
  const ref = 2 * R_GAS * Math.LN2;
  assert.ok(Math.abs(dS / ref - 1) < 1e-15,
    `quaternary ΔS relative error: ${dS / ref - 1}`);
});

// ── Equimolar binary ≥ asymmetric ─────────────────────────────────────────────

test('equimolar binary ΔS ≥ asymmetric (0.3, 0.7)', () => {
  const mEq  = new EntropyMixingModel([{ name: 'A', x: 0.5 }, { name: 'B', x: 0.5 }]);
  const mAsy = new EntropyMixingModel([{ name: 'A', x: 0.3 }, { name: 'B', x: 0.7 }]);
  assert.ok(mEq.deltaS() > mAsy.deltaS(), 'equimolar must have higher ΔS');
});

// ── Zero-fraction component: no NaN ──────────────────────────────────────────

test('zero-fraction component contributes 0, no NaN', () => {
  const m = new EntropyMixingModel([
    { name: 'A', x: 0.5 }, { name: 'B', x: 0.5 }, { name: 'C', x: 0.0 },
  ]);
  const dS = m.deltaS();
  assert.ok(Number.isFinite(dS), 'ΔS must be finite when one x=0');
  // Same as binary without the C component
  const mRef = new EntropyMixingModel([{ name: 'A', x: 0.5 }, { name: 'B', x: 0.5 }]);
  assert.ok(Math.abs(dS / mRef.deltaS() - 1) < 1e-15, 'zero-fraction term must be zero');
});

// ── deltaG sign ───────────────────────────────────────────────────────────────

test('ΔG_mix(T=298) < 0 for binary equimolar (spontaneous)', () => {
  const m = new EntropyMixingModel([{ name: 'A', x: 0.5 }, { name: 'B', x: 0.5 }]);
  assert.ok(m.deltaG(298) < 0, 'ΔG_mix must be negative for ideal mixing');
});

// ── Stirling multinomial anchor ───────────────────────────────────────────────

test('Stirling: ln W / N ≈ ln2 within 2e-5 at N=1e6 binary equimolar', () => {
  // W = N! / ((N/2)! * (N/2)!)  for N=1e6, x=[0.5,0.5]
  // ln W ≈ N·ln2 − (1/2)ln(N/2) − ... (Stirling corrections)
  // This tests that the statistical (Stirling) entropy agrees with −Σxlnx to within
  // O(ln N / N) as stated in the anchor.
  const N = 1e6;
  // Use lgamma (Stirling-based) to compute ln W = lgamma(N+1) - 2*lgamma(N/2+1)
  // lgamma approximation: lgamma(n) ≈ (n-0.5)*ln(n) - n + 0.5*ln(2π)
  function lgamma(n) {
    return (n - 0.5) * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI);
  }
  const lnW = lgamma(N + 1) - 2 * lgamma(N / 2 + 1);
  const err = Math.abs(lnW / N - Math.LN2);
  assert.ok(err <= 2e-5, `Stirling error ${err} must be ≤ 2e-5`);
});

// ── Domain validation ─────────────────────────────────────────────────────────

test('constructor throws RangeError for xᵢ < 0', () => {
  assert.throws(
    () => new EntropyMixingModel([{ name: 'A', x: -0.1 }, { name: 'B', x: 1.1 }]),
    RangeError,
  );
});

test('constructor throws RangeError for Σxᵢ ≠ 1', () => {
  assert.throws(
    () => new EntropyMixingModel([{ name: 'A', x: 0.6 }, { name: 'B', x: 0.6 }]),
    RangeError,
  );
});

// ── binaryCurve ────────────────────────────────────────────────────────────────

test('binaryCurve has 201 points; x=0 and x=1 endpoints give dS=0', () => {
  const m = new EntropyMixingModel([{ name: 'A', x: 0.5 }, { name: 'B', x: 0.5 }]);
  const pts = m.binaryCurve(200);
  assert.strictEqual(pts.length, 201);
  assert.ok(Math.abs(pts[0].dS) < 1e-30, 'dS at x=0 must be ~0');
  assert.ok(Math.abs(pts[200].dS) < 1e-30, 'dS at x=1 must be ~0');
});
