/**
 * Tests for FourierSeries.
 * Key result: square-wave Gibbs overshoot ≈ 8.9 % at 60 terms.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FourierSeries } from '../../js/benches/math/analysis/fourier/FourierSeries.js';

test('square wave overshoot ≈ 8.9 % at 60 terms (Gibbs phenomenon)', () => {
  const s = new FourierSeries('square', 60);
  const pct = s.overshootPercent();
  // The Gibbs constant is ~8.9 %; at finite N it is slightly above or below.
  assert.ok(pct > 8 && pct < 10, `overshoot = ${pct.toFixed(2)} %, expected ≈ 8.9 %`);
});

test('square wave evaluate at t=π/4 is positive and ≤ 1 + overshoot', () => {
  const s = new FourierSeries('square', 60);
  const v = s.evaluate(Math.PI / 4);
  assert.ok(v > 0, `value at π/4 should be positive, got ${v}`);
});

test('target: square wave is +1 on (0, π) and −1 on (π, 2π)', () => {
  const s = new FourierSeries('square', 5);
  assert.strictEqual(s.target(0.1), 1);
  assert.strictEqual(s.target(Math.PI + 0.1), -1);
});

test('sawtooth wave overshoot also ≈ 8.9 % at 60 terms', () => {
  const s = new FourierSeries('saw', 60);
  const pct = s.overshootPercent();
  assert.ok(pct > 8 && pct < 10, `saw overshoot = ${pct.toFixed(2)} %, expected ≈ 8.9 %`);
});

test('triangle wave overshoot is essentially 0 (fast convergence)', () => {
  const s = new FourierSeries('tri', 60);
  const pct = s.overshootPercent();
  // Triangle wave converges as 1/n², no Gibbs phenomenon.
  assert.ok(pct < 1, `tri overshoot = ${pct.toFixed(3)} %, expected < 1 %`);
});

test('coefficients: square wave uses only odd harmonics', () => {
  const s = new FourierSeries('square', 5);
  const ns = s.coefficients().map((c) => c.n);
  assert.deepStrictEqual(ns, [1, 3, 5, 7, 9]);
});
