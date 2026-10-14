/**
 * Tests for PCRModel — PCR kinetics with plateau model.
 *
 * Ideal case: N0=1, E=1, Nmax=∞ → N_n = 2ⁿ.
 * Ct for threshold=1e9: 2³⁰ = 1.073e9 ≥ 1e9 → Ct = 30.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PCRModel } from '../../js/benches/biology/molecular/pcr/PCRModel.js';

test('copies(0) === N0', () => {
  const m = new PCRModel({ N0: 100, efficiency: 1.0 });
  assert.equal(m.copies(0), 100);
});

test('copies(n) = N0·(1+E)^n for n=10 at E=1 (no plateau, Nmax large)', () => {
  const m = new PCRModel({ N0: 1, efficiency: 1.0, Nmax: 1e18 });
  const expected = Math.pow(2, 10);
  const got = m.copies(10);
  assert.ok(
    Math.abs(got - expected) / expected < 1e-6,
    `Expected ${expected}, got ${got}`,
  );
});

test('copies(n) = N0·(1+E)^n for n=20 at E=1 (no plateau, Nmax large)', () => {
  const m = new PCRModel({ N0: 1, efficiency: 1.0, Nmax: 1e18 });
  const expected = Math.pow(2, 20);
  const got = m.copies(20);
  assert.ok(
    Math.abs(got - expected) / expected < 1e-6,
    `Expected ${expected}, got ${got}`,
  );
});

test('copies(n) ≈ N0·(1+E)^n for E=0.9, n=30 (no plateau)', () => {
  const m = new PCRModel({ N0: 10, efficiency: 0.9, Nmax: 1e18 });
  const expected = 10 * Math.pow(1.9, 30);
  const got = m.copies(30);
  assert.ok(
    Math.abs(got - expected) / expected < 1e-6,
    `Expected ${expected.toExponential(3)}, got ${got.toExponential(3)}`,
  );
});

test('N0=1, E=1, threshold=1e9: Ct === 30 (2³⁰ ≈ 1.073e9)', () => {
  const m = new PCRModel({ N0: 1, efficiency: 1.0, nCycles: 45, threshold: 1e9, Nmax: 1e15 });
  assert.equal(m.Ct, 30, `Expected Ct=30, got Ct=${m.Ct}`);
});

test('N0=100, E=1: Ct ≤ 24 (100× more template → ~7 cycles earlier than Ct=30)', () => {
  const m = new PCRModel({ N0: 100, efficiency: 1.0, nCycles: 45, threshold: 1e9, Nmax: 1e15 });
  assert.ok(m.Ct !== null && m.Ct <= 24, `Expected Ct ≤ 24, got Ct=${m.Ct}`);
});

test('Lower efficiency → higher Ct (E=0.8 vs E=1.0)', () => {
  const mPerfect = new PCRModel({ N0: 1, efficiency: 1.0, nCycles: 45, threshold: 1e9, Nmax: 1e15 });
  const mLower   = new PCRModel({ N0: 1, efficiency: 0.8, nCycles: 45, threshold: 1e9, Nmax: 1e15 });
  assert.ok(
    (mLower.Ct ?? Infinity) > (mPerfect.Ct ?? 0),
    `E=0.8 Ct=${mLower.Ct} should be > E=1.0 Ct=${mPerfect.Ct}`,
  );
});

test('copiesArray().length === nCycles + 1', () => {
  const m = new PCRModel({ nCycles: 35 });
  assert.equal(m.copiesArray().length, 36);
});

test('Plateau: copies saturate near Nmax after sufficient cycles', () => {
  const m = new PCRModel({ N0: 1, efficiency: 1.0, nCycles: 50, Nmax: 1e6 });
  const arr = m.copiesArray();
  // After many cycles, copies should approach Nmax (within 10%)
  const last = arr[arr.length - 1];
  assert.ok(last >= m.Nmax * 0.9, `Expected last copies ≈ Nmax=${m.Nmax}, got ${last.toExponential(3)}`);
});

test('Plateau is lower than exponential at late cycles', () => {
  const m = new PCRModel({ N0: 1, efficiency: 1.0, nCycles: 50, Nmax: 1e6 });
  const platLate = m.copies(45);
  const expLate  = m.copiesExponential(45);
  assert.ok(platLate < expLate, `Plateau copies ${platLate.toExponential(3)} should be < exponential ${expLate.toExponential(3)}`);
});
