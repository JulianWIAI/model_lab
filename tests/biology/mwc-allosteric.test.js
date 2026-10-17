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

test('c=1 -> h=1 (non-cooperative)', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 1 });
  const h = m.hillCoeff();
  assert.ok(Math.abs(h - 1) < 0.05, `h=${h}, expected ~1`);
});

test('saturation(1e6) -> 1', () => {
  const m = new MWCModel({ n: 4, L: 100, c: 0.01 });
  assert.ok(m.saturation(1e6) > 0.9999, `Y(1e6) = ${m.saturation(1e6)}`);
});

test('RangeError for bad params', () => {
  assert.throws(() => new MWCModel({ n: 0 }), RangeError);
  assert.throws(() => new MWCModel({ n: 1.5 }), RangeError);
  assert.throws(() => new MWCModel({ L: 0 }), RangeError);
  assert.throws(() => new MWCModel({ L: -1 }), RangeError);
  assert.throws(() => new MWCModel({ c: 0 }), RangeError);
  assert.throws(() => new MWCModel({ c: 1.5 }), RangeError);
});
