/**
 * Tests for HillBindingModel — Hill equation for cooperative O₂ binding.
 *
 * Checks the Hill equation θ = pO₂ⁿ / (P50ⁿ + pO₂ⁿ) against known results:
 *   - θ = 0.5 at pO₂ = P50 for any n (definition of P50)
 *   - θ = 0 at pO₂ = 0 (boundary condition)
 *   - θ → 1 as pO₂ → ∞ (at pO₂ = 1000 mmHg, n = 2.8 default)
 *   - n = 1 gives rectangular hyperbola (Michaelis-Menten / myoglobin-like)
 *   - Higher n sharpens the sigmoid around P50
 *   - HBA static constant integrity
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HillBindingModel } from '../../js/benches/biology/biochemistry/hill-binding/HillBindingModel.js';

test('θ = 0.5 at pO₂ = P50 (definition, HbA defaults)', () => {
  const m = new HillBindingModel();
  assert.ok(
    Math.abs(m.theta(m.P50) - 0.5) < 1e-10,
    `θ at P50 should be 0.5, got ${m.theta(m.P50)}`,
  );
});

test('θ = 0.5 at pO₂ = P50 for any n (n=1, 2, 4)', () => {
  for (const n of [1, 2, 4]) {
    const m = new HillBindingModel({ P50: 20, n });
    assert.ok(
      Math.abs(m.theta(20) - 0.5) < 1e-10,
      `n=${n}: θ at P50 should be 0.5, got ${m.theta(20)}`,
    );
  }
});

test('θ = 0 at pO₂ = 0', () => {
  const m = new HillBindingModel();
  assert.strictEqual(m.theta(0), 0);
});

test('θ > 0.9999 at pO₂ = 1000 mmHg for default n = 2.8', () => {
  // Test only for default n=2.8 as approved; at very high pO2 saturation is near-complete.
  const m = new HillBindingModel({ P50: 26.6, n: 2.8 });
  assert.ok(
    m.theta(1000) > 0.9999,
    `θ(1000 mmHg) should be > 0.9999, got ${m.theta(1000)}`,
  );
});

test('n = 1 gives rectangular hyperbola: θ = pO₂/(P50 + pO₂)', () => {
  const m = new HillBindingModel({ P50: 26.6, n: 1 });
  const pO2 = 10;
  const expected = pO2 / (26.6 + pO2);
  assert.ok(
    Math.abs(m.theta(pO2) - expected) < 1e-12,
    `n=1 Hill should equal Michaelis-Menten: got ${m.theta(pO2)}, expected ${expected}`,
  );
});

test('higher n sharpens sigmoid above P50: θ(n=3) > θ(n=1) at 2×P50', () => {
  const P50 = 26.6;
  const mHigh = new HillBindingModel({ P50, n: 3 });
  const mLow  = new HillBindingModel({ P50, n: 1 });
  const pO2 = P50 * 2;
  assert.ok(
    mHigh.theta(pO2) > mLow.theta(pO2),
    `n=3 should give higher θ than n=1 above P50; got ${mHigh.theta(pO2)} vs ${mLow.theta(pO2)}`,
  );
});

test('higher n depresses sigmoid below P50: θ(n=3) < θ(n=1) at 0.5×P50', () => {
  const P50 = 26.6;
  const mHigh = new HillBindingModel({ P50, n: 3 });
  const mLow  = new HillBindingModel({ P50, n: 1 });
  const pO2 = P50 * 0.5;
  assert.ok(
    mHigh.theta(pO2) < mLow.theta(pO2),
    `n=3 should give lower θ than n=1 below P50; got ${mHigh.theta(pO2)} vs ${mLow.theta(pO2)}`,
  );
});

test('curve() returns nPoints objects with θ ∈ [0, 1]', () => {
  const m = new HillBindingModel();
  const pts = m.curve(150, 200);
  assert.strictEqual(pts.length, 200);
  for (const { theta } of pts) {
    assert.ok(theta >= 0 && theta <= 1, `θ out of range: ${theta}`);
  }
});

test('HillBindingModel.HBA.P50 = 26.6 (cited constant integrity)', () => {
  assert.strictEqual(HillBindingModel.HBA.P50, 26.6);
});

test('HillBindingModel.MB.n = 1 (non-cooperative myoglobin)', () => {
  assert.strictEqual(HillBindingModel.MB.n, 1);
});
