import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CompoundGrowthModel } from '../../js/benches/economics/macroeconomics/compound-growth/CompoundGrowthModel.js';

// ── Doubling time ────────────────────────────────────────────────────────────

test('A(doublingTime) ≈ 2·P ±1e-6 (annual, r=0.07)', () => {
  const m = new CompoundGrowthModel({ P: 1000, r: 0.07, m: 1 });
  const A2 = m.A(m.doublingTime);
  assert.ok(Math.abs(A2 - 2 * m.P) < 1e-6,
    `A(t₂) = ${A2}, expected ${2 * m.P}`);
});

test('A(doublingTime) ≈ 2·P ±1e-6 (monthly, r=0.05)', () => {
  const m = new CompoundGrowthModel({ P: 500, r: 0.05, m: 12 });
  const A2 = m.A(m.doublingTime);
  assert.ok(Math.abs(A2 - 2 * m.P) < 1e-6,
    `A(t₂) = ${A2}, expected ${2 * m.P}`);
});

test('Acontinuous(ln2/r) ≈ 2·P ±1e-6', () => {
  const m = new CompoundGrowthModel({ P: 1000, r: 0.10, m: Infinity });
  const t2 = Math.LN2 / m.r;
  const A2 = m.Acontinuous(t2);
  assert.ok(Math.abs(A2 - 2 * m.P) < 1e-6,
    `Acont(t₂) = ${A2}, expected ${2 * m.P}`);
});

// ── Initial condition ─────────────────────────────────────────────────────────

test('A(0) === P exactly (annual)', () => {
  const m = new CompoundGrowthModel({ P: 1234.56, r: 0.08, m: 1 });
  assert.strictEqual(m.A(0), m.P);
});

test('A(0) === P exactly (continuous)', () => {
  const m = new CompoundGrowthModel({ P: 1234.56, r: 0.08, m: Infinity });
  assert.strictEqual(m.A(0), m.P);
});

// ── Effective annual rate ─────────────────────────────────────────────────────

test('EAR === (1+r/m)^m − 1 ±1e-10 (monthly, r=0.12)', () => {
  const m = new CompoundGrowthModel({ r: 0.12, m: 12 });
  const expected = Math.pow(1 + 0.12 / 12, 12) - 1;
  assert.ok(Math.abs(m.EAR - expected) < 1e-10,
    `EAR = ${m.EAR}, expected ${expected}`);
});

test('EAR (continuous) === e^r − 1 ±1e-10', () => {
  const m = new CompoundGrowthModel({ r: 0.10, m: Infinity });
  const expected = Math.exp(0.10) - 1;
  assert.ok(Math.abs(m.EAR - expected) < 1e-10,
    `EAR_cont = ${m.EAR}, expected ${expected}`);
});

// ── Continuous limit ─────────────────────────────────────────────────────────

test('|A(t, daily) − Acontinuous(t)| < 1e-3·P at r=0.10, t=10', () => {
  const mdl = new CompoundGrowthModel({ P: 1000, r: 0.10, m: 365 });
  const Adaily = mdl.A(10);
  const Acont  = mdl.Acontinuous(10);
  assert.ok(Math.abs(Adaily - Acont) < 1e-3 * mdl.P,
    `|A_daily - A_cont| = ${Math.abs(Adaily - Acont).toFixed(6)}`);
});

// ── Rule-of-72 error values ──────────────────────────────────────────────────
//
// EXACT values (not approximate): t₂_exact(r, m=1) = ln(2)/ln(1+r)
// rule72_pct(r) = t₂_exact(r) × (r×100)
//
// r=0.05: ln(2)/ln(1.05)×5  = 71.033...
// r=0.10: ln(2)/ln(1.10)×10 = 72.725...
//
// These are exact mathematical results — tolerances are due to floating point only.

test('rule72Percent(0.05) ≈ 71.03 ±0.01', () => {
  const m = new CompoundGrowthModel({ r: 0.05 });
  const pct = m.rule72Percent(0.05);
  assert.ok(Math.abs(pct - 71.033) < 0.01,
    `rule72Percent(0.05) = ${pct.toFixed(4)}, expected ≈71.033`);
});

test('rule72Percent(0.10) ≈ 72.73 ±0.01', () => {
  const m = new CompoundGrowthModel({ r: 0.10 });
  const pct = m.rule72Percent(0.10);
  assert.ok(Math.abs(pct - 72.725) < 0.01,
    `rule72Percent(0.10) = ${pct.toFixed(4)}, expected ≈72.725`);
});

test('rule72Percent: min ≤ 72 and max ≥ 72 over r ∈ [0.02, 0.20]', () => {
  const m   = new CompoundGrowthModel({});
  const pts = m.rule72Curve(200);
  const vals = pts.map(p => p.pct);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  assert.ok(minV <= 72,
    `min rule72Percent = ${minV.toFixed(3)} — expected ≤72`);
  assert.ok(maxV >= 72,
    `max rule72Percent = ${maxV.toFixed(3)} — expected ≥72`);
});

// ── Present-value round-trip ─────────────────────────────────────────────────

test('PV(A(T, continuous), T) ≈ P ±1e-6', () => {
  const m  = new CompoundGrowthModel({ P: 1000, r: 0.08, m: Infinity });
  const T  = 20;
  const FV = m.Acontinuous(T);
  const pv = m.PV(FV, T);
  assert.ok(Math.abs(pv - m.P) < 1e-6,
    `PV round-trip = ${pv}, expected ${m.P}`);
});

test('PV(A(T, monthly), T) ≈ P ±1e-6 (same-m round-trip)', () => {
  // PV uses same m as A: PV = FV / (1+r/m)^(mT); round-trip recovers P exactly
  const mdl = new CompoundGrowthModel({ P: 1000, r: 0.06, m: 12 });
  const T   = 10;
  const FV  = mdl.A(T);
  const pv  = mdl.PV(FV, T);
  assert.ok(Math.abs(pv - mdl.P) < 1e-6,
    `PV round-trip (m=12) = ${pv}, expected ${mdl.P}`);
});
