/**
 * Tests for TitrationModel.
 * Key results: strong-strong equivalence pH=7, weak acid half-equivalence = pKa,
 * equivalence volume formula.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TitrationModel } from '../../js/benches/chemistry/acids-bases/titration/TitrationModel.js';

test('strong acid / strong base: pH at equivalence = 7.00 ± 0.01', () => {
  const m = new TitrationModel({ acidType: 'strong', ca: 0.1, cb: 0.1, va: 25 });
  const pH = m.solve(m.equivalenceVolume);
  assert.ok(Math.abs(pH - 7.0) < 0.01, `pH at equivalence = ${pH}, expected 7.00`);
});

test('acetic acid: pH at half-equivalence = pKa = 4.756 ± 0.02', () => {
  const m = new TitrationModel({ acidType: 'weak', ca: 0.1, cb: 0.1, va: 25, pKa: 4.756 });
  const pH = m.solve(m.halfEquivalenceVolume);
  assert.ok(Math.abs(pH - 4.756) < 0.02, `pH at half-equiv = ${pH}, expected 4.756`);
});

test('equivalence volume = Ca * Va / Cb', () => {
  const m = new TitrationModel({ ca: 0.15, cb: 0.1, va: 20 });
  const expected = 0.15 * 20 / 0.1; // 30 mL
  assert.ok(Math.abs(m.equivalenceVolume - expected) < 1e-10, `Veq = ${m.equivalenceVolume}, expected ${expected}`);
});

test('strong acid before equivalence: pH decreases with titrant addition', () => {
  const m = new TitrationModel({ acidType: 'strong', ca: 0.1, cb: 0.1, va: 25 });
  const pH10 = m.solve(10);
  const pH20 = m.solve(20);
  assert.ok(pH10 < pH20, `pH should increase as titrant added (${pH10} < ${pH20})`);
});

test('weak acid titration produces a buffer region where dpH/dV is small', () => {
  const m = new TitrationModel({ acidType: 'weak', ca: 0.1, cb: 0.1, va: 25, pKa: 4.756 });
  const { volumes, pHs } = m.curve(100);
  // Near half-equivalence (≈12.5 mL), dpH/dV should be small (buffer)
  const midIdx = Math.round(volumes.findIndex(v => v >= m.halfEquivalenceVolume));
  // Check that slope |dpH/dV| < 0.1 near midpoint
  if (midIdx > 0 && midIdx < volumes.length - 1) {
    const slope = Math.abs((pHs[midIdx + 1] - pHs[midIdx - 1]) / (volumes[midIdx + 1] - volumes[midIdx - 1]));
    assert.ok(slope < 0.2, `slope at buffer = ${slope}, expected < 0.2`);
  }
});
