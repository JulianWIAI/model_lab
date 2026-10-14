/**
 * Tests for BufferModel — exact species fractions and buffer capacity.
 *
 * pKa sources:
 *   Acetic acid pKa1=4.756 (NIST WebBook SID 176)
 *   Ammonium pKa1=9.246 (NIST WebBook SID 16741146)
 *   Phosphoric acid pKas=2.148,7.198,12.375 (Martell & Smith Vol. 4, 1976)
 *   Carbonic acid pKas=6.352,10.329 (Harned & Davis 1943; Harned & Scholes 1941)
 *   Citric acid pKas=3.128,4.761,6.396 (Martell & Smith Vol. 3, 1977)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BufferModel, PRESETS } from '../../js/benches/chemistry/acids-bases/buffers/BufferModel.js';

test('PRESETS contains 5 acids', () => {
  assert.equal(PRESETS.length, 5);
});

test('fractions sum to 1 at pH 1, 4, 7, 10, 13 for all presets', () => {
  for (let pi = 0; pi < PRESETS.length; pi++) {
    const m = new BufferModel({ presetIndex: pi });
    for (const pH of [1, 4, 7, 10, 13]) {
      const alpha = m.fractions(pH);
      const sum = Array.from(alpha).reduce((a, b) => a + b, 0);
      assert.ok(
        Math.abs(sum - 1) < 1e-9,
        `${PRESETS[pi].name} pH=${pH}: fractions sum to ${sum}, expected 1`,
      );
    }
  }
});

test('Acetic acid at pH=pKa1 (4.756): α₀ ≈ α₁ ≈ 0.5', () => {
  const m = new BufferModel({ presetIndex: 0 }); // acetic acid
  const alpha = m.fractions(4.756);
  assert.ok(
    Math.abs(alpha[0] - 0.5) < 0.001,
    `α₀ = ${alpha[0]}, expected 0.5 ±0.001`,
  );
  assert.ok(
    Math.abs(alpha[1] - 0.5) < 0.001,
    `α₁ = ${alpha[1]}, expected 0.5 ±0.001`,
  );
});

test('Acetic acid pH=0: α₀ ≈ 1 (fully protonated)', () => {
  const m = new BufferModel({ presetIndex: 0 });
  const alpha = m.fractions(0);
  assert.ok(alpha[0] > 0.99, `α₀ = ${alpha[0]} at pH 0, expected > 0.99`);
});

test('Acetic acid pH=14: α₁ ≈ 1 (fully deprotonated)', () => {
  const m = new BufferModel({ presetIndex: 0 });
  const alpha = m.fractions(14);
  assert.ok(alpha[1] > 0.99, `α₁ = ${alpha[1]} at pH 14, expected > 0.99`);
});

test('Phosphoric acid pH=0: α₀ > 0.99; pH=14: α₃ > 0.97 (pKa3=12.375, so ~97.7% at pH 14)', () => {
  const m = new BufferModel({ presetIndex: 1 }); // phosphoric acid
  const a0 = m.fractions(0);
  assert.ok(a0[0] > 0.99, `pH=0 α₀ = ${a0[0]}`);
  const a14 = m.fractions(14);
  // pH=14 is only 1.625 units above pKa3=12.375; 97.7% deprotonated is correct
  assert.ok(a14[3] > 0.97, `pH=14 α₃ = ${a14[3]}, expected > 0.97`);
});

test('Acetic acid β peaks near pKa1=4.756: β(pKa1) > β(pKa1+2)', () => {
  const m = new BufferModel({ presetIndex: 0, C: 0.1 });
  const betaPeak = m.bufferCapacity(4.756);
  const betaFar  = m.bufferCapacity(6.756);
  assert.ok(
    betaPeak > betaFar,
    `β(4.756)=${betaPeak.toFixed(5)} should be > β(6.756)=${betaFar.toFixed(5)}`,
  );
});

// Test only well-separated pKa pairs to avoid overlap effects
test('Phosphoric acid: β near pKa1 (2.148) > β at pKa1+2 (4.148)', () => {
  // Compare buffer peak to a point 2 units above pKa1 (avoids the huge H₂O term at low pH)
  const m = new BufferModel({ presetIndex: 1, C: 0.1 });
  const peak = m.bufferCapacity(2.148);
  const far  = m.bufferCapacity(4.148);
  assert.ok(peak > far, `β(2.148)=${peak.toFixed(5)} should be > β(4.148)=${far.toFixed(5)}`);
});

test('Phosphoric acid: β near pKa2 (7.198) > β at pKa2+2 (9.198)', () => {
  const m = new BufferModel({ presetIndex: 1, C: 0.1 });
  const peak = m.bufferCapacity(7.198);
  const far  = m.bufferCapacity(9.198);
  assert.ok(peak > far, `β(7.198)=${peak.toFixed(5)} should be > β(9.198)=${far.toFixed(5)}`);
});

test('Ammonium β peaks near pKa1=9.246: β(9.246) > β(7.246)', () => {
  const m = new BufferModel({ presetIndex: 4, C: 0.1 });
  const peak = m.bufferCapacity(9.246);
  const far  = m.bufferCapacity(7.246);
  assert.ok(peak > far, `β(9.246)=${peak.toFixed(5)} should be > β(7.246)=${far.toFixed(5)}`);
});

test('bufferCapacity is positive at all pH values', () => {
  const m = new BufferModel({ presetIndex: 0, C: 0.1 });
  for (let pH = 0; pH <= 14; pH += 0.5) {
    const beta = m.bufferCapacity(pH);
    assert.ok(beta > 0, `β(${pH}) = ${beta} should be positive`);
  }
});

test('capacityCurve returns arrays of correct length', () => {
  const m = new BufferModel({ presetIndex: 0 });
  const { pHs, betas, fractionCurves } = m.capacityCurve(100);
  assert.equal(pHs.length, 100);
  assert.equal(betas.length, 100);
  assert.equal(fractionCurves.length, 2); // acetic: 1 pKa → 2 species
  assert.equal(fractionCurves[0].length, 100);
});
