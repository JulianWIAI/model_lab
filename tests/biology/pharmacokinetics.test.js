import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PharmacokineticsModel } from '../../js/benches/biology/pharmacology/pharmacokinetics/PharmacokineticsModel.js';

// ── IV mode (default) ───────────────────────────────────────────────────────

test('IV: C₀ = D/Vd ±1e-15 relative', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, D: 100, Vd: 10, iv: true });
  const expected = 100 / 10;
  assert.ok(Math.abs(m.C0 - expected) <= 1e-15 * expected, `C0=${m.C0}`);
});

test('IV: C(5h) = C₀·e^{-ke·5} ±1e-8 relative (ke=0.1)', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, D: 100, Vd: 10, iv: true });
  const expected = m.C0 * Math.exp(-0.1 * 5);   // ≈ 6.0653
  assert.ok(Math.abs(m.C(5) - expected) <= 1e-8 * expected, `C(5)=${m.C(5)}, expected=${expected}`);
});

test('IV: t½ = ln2/ke ±1e-10 relative (ke=0.1)', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, iv: true });
  const expected = Math.LN2 / 0.1;
  assert.ok(Math.abs(m.tHalf - expected) <= 1e-10 * expected, `t½=${m.tHalf}`);
});

test('IV: AUC = C₀/ke ±1e-6 relative (ke=0.1, D=100, Vd=10)', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, D: 100, Vd: 10, iv: true });
  const expected = m.C0 / 0.1;   // = 100
  assert.ok(Math.abs(m.AUC - expected) <= 1e-6 * expected, `AUC=${m.AUC}`);
});

test('IV: strictly decreasing concentration curve', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, D: 100, Vd: 10, iv: true });
  const pts = m.curve(5 * m.tHalf, 200);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].C < pts[i - 1].C, `Not decreasing at i=${i}: C[i]=${pts[i].C}, C[i-1]=${pts[i - 1].C}`);
  }
});

// ── Oral mode ───────────────────────────────────────────────────────────────

test('Oral: tMax = ln(ka/ke)/(ka-ke) ±1e-10 (ka=1, ke=0.1)', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, ka: 1, D: 100, Vd: 10, F: 1, iv: false });
  const expected = Math.log(1 / 0.1) / (1 - 0.1);   // ≈ 2.5584
  assert.ok(Math.abs(m.tMax - expected) <= 1e-10 * expected, `tMax=${m.tMax}, expected=${expected}`);
});

test('Oral: dC/dt ≈ 0 at tMax ±1e-6 relative to C(tMax) (ka=1, ke=0.1)', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, ka: 1, D: 100, Vd: 10, F: 1, iv: false });
  const h = 1e-5;
  const deriv = (m.C(m.tMax + h) - m.C(m.tMax - h)) / (2 * h);
  assert.ok(Math.abs(deriv) <= 1e-6 * m.C(m.tMax), `dC/dt at tMax = ${deriv}`);
});

test('Oral: AUC = F·D/(Vd·ke) ±1e-6 relative (F=0.8, ke=0.1, D=100, Vd=10)', () => {
  const m = new PharmacokineticsModel({ ke: 0.1, ka: 1, D: 100, Vd: 10, F: 0.8, iv: false });
  const expected = 0.8 * 100 / (10 * 0.1);   // = 80
  assert.ok(Math.abs(m.AUC - expected) <= 1e-6 * expected, `AUC=${m.AUC}`);
});

test('Oral/IV: AUC_oral / AUC_IV = F ±1e-10 (F=0.8)', () => {
  const mOral = new PharmacokineticsModel({ ke: 0.1, ka: 1, D: 100, Vd: 10, F: 0.8, iv: false });
  const mIV   = new PharmacokineticsModel({ ke: 0.1,        D: 100, Vd: 10, F: 1,   iv: true  });
  const ratio = mOral.AUC / mIV.AUC;
  assert.ok(Math.abs(ratio - 0.8) <= 1e-10, `AUC ratio=${ratio}`);
});

// ── ka=ke limit ─────────────────────────────────────────────────────────────

test('ka=ke limit: C(t) is continuous as ka→ke ±1e-6 relative (ke=ka=0.1)', () => {
  // Direct: use ka exactly equal to ke; model must use limit form
  const ke = 0.1;
  const ka = ke;   // exact equality → triggers |diff| < 1e-9*ke guard
  const m = new PharmacokineticsModel({ ke, ka, D: 100, Vd: 10, F: 1, iv: false });
  const tPeak = 1 / ke;           // limit tMax = 1/ke
  const expected = 100 * ke * tPeak * Math.exp(-ke * tPeak) / 10;   // F·D·ke·t·exp(-ke·t)/Vd
  assert.ok(Math.abs(m.C(tPeak) - expected) <= 1e-6 * expected, `C(1/ke)=${m.C(tPeak)}, expected=${expected}`);
});

// ── Flip-flop symmetry ──────────────────────────────────────────────────────

test('Flip-flop symmetry: ke·C(t;ka,ke) = ka·C(t;ke,ka) ±1e-10 relative', () => {
  const ke = 0.2, ka = 0.8, D = 100, Vd = 10, F = 1;
  const m1 = new PharmacokineticsModel({ ke, ka, D, Vd, F, iv: false });
  const m2 = new PharmacokineticsModel({ ke: ka, ka: ke, D, Vd, F, iv: false });
  const t = 3;
  const lhs = ke * m1.C(t);
  const rhs = ka * m2.C(t);
  assert.ok(Math.abs(lhs - rhs) <= 1e-10 * Math.abs(lhs), `ke·C(t;ka,ke)=${lhs}, ka·C(t;ke,ka)=${rhs}`);
});

// ── Multi-dose accumulation ─────────────────────────────────────────────────

test('Accumulation R(τ=t½) with t½=24h, τ=12h: R = 2+√2 ±1e-6', () => {
  // ke = ln2/24; τ = 12; R = 1/(1-e^{-ke·12}) = 1/(1-2^{-0.5}) = 2+√2
  const ke = Math.LN2 / 24;
  const m = new PharmacokineticsModel({ ke, iv: true });
  const R = m.accumulationRatio(12);
  const expected = 2 + Math.SQRT2;
  assert.ok(Math.abs(R - expected) <= 1e-6, `R=${R}, expected=${expected}`);
});
