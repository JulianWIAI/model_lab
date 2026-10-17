/**
 * Tests for MWCModel — Monod-Wyman-Changeux two-state allosteric model.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MWCModel } from '../../js/benches/biology/biochemistry/mwc-allosteric/MWCModel.js';

test('saturation(0) = 0', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 0.01 });
  assert.strictEqual(m.saturation(0), 0);
});

test('rStateFraction(0) = 1/(1+L)', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 0.01 });
  assert.ok(
    Math.abs(m.rStateFraction(0) - 1/101) < 1e-14,
    `R(0) = ${m.rStateFraction(0)}, expected ${1/101}`,
  );
});

test('enum vs closed-form at alpha=0.5,1,5', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 0.01 });
  for (const alpha of [0.5, 1, 5]) {
    const Yclosed = m.saturation(alpha);
    const Yenum = m.enumeratedSaturation(alpha);
    assert.ok(
      Math.abs(Yclosed - Yenum) < 1e-12,
      `alpha=${alpha}: closed=${Yclosed}, enum=${Yenum}`,
    );
  }
});

test('c=1 -> Langmuir: Y = alpha/(1+alpha)', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 1 });
  for (const alpha of [0.1, 0.5, 1, 2, 5, 10]) {
    const Y = m.saturation(alpha);
    const lang = alpha / (1 + alpha);
    assert.ok(
      Math.abs(Y - lang) < 1e-12,
      `alpha=${alpha}: Y=${Y}, langmuir=${lang}`,
    );
  }
});

test('n=1 reduction: Y = alpha*K_eff/(1+alpha*K_eff)', () => {
  const L = 100, c = 0.01;
  const m = new MWCModel({ n: 1, L, c });
  const K_eff = (1 + L*c) / (1 + L);
  for (const alpha of [0.1, 1, 5, 10]) {
    const Y = m.saturation(alpha);
    const expected = alpha * K_eff / (1 + alpha * K_eff);
    assert.ok(
      Math.abs(Y - expected) < 1e-12,
      `alpha=${alpha}: Y=${Y}, expected=${expected}`,
    );
  }
});

test('hillCoeff > 1 (cooperative) and < n', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 0.01 });
  const h = m.hillCoeff();
  assert.ok(h > 1, `h=${h}, expected > 1`);
  assert.ok(h < 4, `h=${h}, expected < 4`);
  // More precisely, h ~ 2.362
  assert.ok(Math.abs(h - 2.362) < 0.05, `h=${h}, expected ~2.362`);
});

test('c=1 -> h=1 (non-cooperative) ±1e-7', () => {
  // When c=1, MWC reduces to Langmuir (Hill coeff = 1 exactly).
  // hillCoeff() uses central FD in log-space with step eps = alpha_h * 1e-4 + 1e-8.
  // For Langmuir at half-sat alpha_h=1: eps ≈ 1e-4. FD truncation error is O(eps^2·f''').
  // For smooth Langmuir at half-sat: f''' bounded, fourth-derivative term eps^2/6 ≈ 1e-8/6 ≈ 2e-9.
  // Tolerance 1e-7 = 50× actual error — appropriate safety margin.
  const m = new MWCModel({ n: 4, L: 100, c: 1 });
  const h = m.hillCoeff();
  assert.ok(Math.abs(h - 1) < 1e-7, `h=${h}, expected ~1 ±1e-7`);
});

test('saturation at large alpha: Y > 0.9999 and rStateFraction > 0.9999', () => {
  // As alpha → ∞ (c=0.01), both Y → 1 and R-state fraction → 1/(1+L*c^n) ≈ 0.9999
  const m = new MWCModel({ n: 4, L: 100, c: 0.01 });
  assert.ok(m.saturation(1e6) > 0.9999, `Y(1e6) = ${m.saturation(1e6)}`);
  assert.ok(m.rStateFraction(1e6) > 0.9999, `R(1e6) = ${m.rStateFraction(1e6)}`);
});

test('curve: returns nPoints alpha-Y-Rbar triples', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 0.01 });
  const c = m.curve(10, 5);
  assert.strictEqual(c.length, 5);
  for (const { alpha, Y, Rbar } of c) {
    assert.ok(Math.abs(Y - m.saturation(alpha)) < 1e-14, `Y mismatch at alpha=${alpha}`);
    assert.ok(Math.abs(Rbar - m.rStateFraction(alpha)) < 1e-14, `Rbar mismatch at alpha=${alpha}`);
  }
});

test('RangeError for bad params', () => {
  assert.throws(() => new MWCModel({ n: 0 }), RangeError);
  assert.throws(() => new MWCModel({ n: 1.5 }), RangeError);
  assert.throws(() => new MWCModel({ L: 0 }), RangeError);
  assert.throws(() => new MWCModel({ L: -1 }), RangeError);
  assert.throws(() => new MWCModel({ c: 0 }), RangeError);
  assert.throws(() => new MWCModel({ c: 1.5 }), RangeError);
});
