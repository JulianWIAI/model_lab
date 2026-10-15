import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WeberFechnerModel } from '../../js/benches/psychology/psychophysics/weber-fechner/WeberFechnerModel.js';

// ── Weber's law ───────────────────────────────────────────────────────────────

test('jnd(I) === kW·I ±1e-10', () => {
  const m = new WeberFechnerModel({ kW: 0.1 });
  assert.ok(Math.abs(m.jnd(50) - 0.1 * 50) < 1e-10,
    `jnd(50) = ${m.jnd(50)}`);
});

test('jnd(2·I) === 2·jnd(I) ±1e-10 (Weber linear scaling)', () => {
  const m = new WeberFechnerModel({ kW: 0.07 });
  assert.ok(Math.abs(m.jnd(40) - 2 * m.jnd(20)) < 1e-10,
    `jnd(40) = ${m.jnd(40)}, 2·jnd(20) = ${2 * m.jnd(20)}`);
});

test('jnd monotonically increasing from IMin to IMax', () => {
  const m   = new WeberFechnerModel({ kW: 0.05, IMin: 1, IMax: 100 });
  const pts = m.weberCurve(100);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].jnd >= pts[i - 1].jnd,
      `jnd not increasing at i=${i}: ${pts[i].jnd} < ${pts[i - 1].jnd}`);
  }
});

// ── Stevens' power law ────────────────────────────────────────────────────────

test('stevens n=1 is linear: stevens(2·I) === 2·stevens(I) ±1e-10', () => {
  const m = new WeberFechnerModel({ n: 1, kS: 2 });
  assert.ok(Math.abs(m.stevens(30) - 2 * m.stevens(15)) < 1e-10,
    `stevens(30) = ${m.stevens(30)}, 2·stevens(15) = ${2 * m.stevens(15)}`);
});

test('stevens power ratio: stevens(2·I)/stevens(I) === 2^n ±1e-10', () => {
  const n = 0.33;
  const m = new WeberFechnerModel({ n, kS: 1 });
  const ratio = m.stevens(20) / m.stevens(10);
  assert.ok(Math.abs(ratio - Math.pow(2, n)) < 1e-10,
    `ratio = ${ratio}, 2^n = ${Math.pow(2, n)}`);
});

// ── JND-stepping test ─────────────────────────────────────────────────────────
//
// kW=0.1, I₀=1, I=10:
//   stepsExact   = ln(10)/ln(1.1) = 24.1589...  (independent: Math.log(10)/Math.log(1.1))
//   stepsFechner = ln(10)/0.1     = 23.0259...  (independent: Math.log(10)/0.1)
//   stepRatio    = 0.1/ln(1.1)    = 1.04879...  (independent: 0.1/Math.log(1.1))
// All exact to floating point; tolerances cover only rounding.

test('stepsExact(10) ≈ ln(10)/ln(1.1) ±0.001 (kW=0.1, I0=1)', () => {
  const m = new WeberFechnerModel({ kW: 0.1, I0: 1 });
  const got      = m.stepsExact(10);
  const expected = Math.log(10) / Math.log(1.1);
  assert.ok(Math.abs(got - expected) < 0.001,
    `stepsExact(10) = ${got.toFixed(4)}, expected ${expected.toFixed(4)}`);
});

test('stepsFechner(10) ≈ ln(10)/0.1 ±0.001 (kW=0.1, I0=1)', () => {
  const m = new WeberFechnerModel({ kW: 0.1, I0: 1 });
  const got      = m.stepsFechner(10);
  const expected = Math.log(10) / 0.1;
  assert.ok(Math.abs(got - expected) < 0.001,
    `stepsFechner(10) = ${got.toFixed(4)}, expected ${expected.toFixed(4)}`);
});

test('stepRatio(10) = 0.1/ln(1.1) ≈ 1.049 ±0.001 (Fechner UNDERcounts)', () => {
  const m = new WeberFechnerModel({ kW: 0.1, I0: 1 });
  const got      = m.stepRatio(10);
  const expected = 0.1 / Math.log(1.1);
  assert.ok(Math.abs(got - expected) < 0.001,
    `stepRatio(10) = ${got.toFixed(4)}, expected ${expected.toFixed(4)}`);
  // Confirm ratio > 1: Fechner UNDERcounts (exact > Fechner)
  assert.ok(got > 1,
    `stepRatio should be >1 (Fechner undercounts); got ${got.toFixed(4)}`);
});

// ── Fechner–Stevens limit ─────────────────────────────────────────────────────
//
// (I^n − 1)/n → ln(I) as n → 0  (L'Hôpital)
// Test: for small n, (I^n − 1)/n ≈ ln(I)
// At n=0.001, I=10: (10^0.001 − 1)/0.001 vs ln(10); tolerance ≈ 0.001

test('(I^n − 1)/n ≈ ln(I) for small n (L\'Hôpital limit) ±0.001', () => {
  // At n=0.0001: error ≈ n·(ln I)²/2 = 0.0001·(2.3026)²/2 ≈ 2.65e-5
  const I = 10, n = 0.0001;
  const powerFamily = (Math.pow(I, n) - 1) / n;
  const logI        = Math.log(I);
  assert.ok(Math.abs(powerFamily - logI) < 0.001,
    `(I^n−1)/n = ${powerFamily.toFixed(6)}, ln(I) = ${logI.toFixed(6)}`);
});
