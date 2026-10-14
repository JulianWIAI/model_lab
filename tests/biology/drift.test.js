/**
 * Tests for WrightFisherModel.
 * Key result: neutral drift (s=0) → mean fixation frequency = p₀ (Kimura).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WrightFisherModel } from '../../js/benches/biology/genetics/drift/WrightFisherModel.js';

test('fixationProbability with s=0 equals p₀ (neutral Kimura)', () => {
  for (const p0 of [0.1, 0.3, 0.5, 0.7]) {
    const m = new WrightFisherModel({ selection: 0, startFrequency: p0 });
    assert.ok(Math.abs(m.fixationProbability - p0) < 1e-10, `P(fix) = ${m.fixationProbability}, expected ${p0}`);
  }
});

test('fixationProbability with s>>0 exceeds p₀ (selection helps)', () => {
  const m = new WrightFisherModel({ size: 100, selection: 0.1, startFrequency: 0.1 });
  assert.ok(m.fixationProbability > 0.1, `P(fix) = ${m.fixationProbability}, expected > 0.1`);
});

test('fixationProbability with s<<0 is below p₀ (selection harms)', () => {
  const m = new WrightFisherModel({ size: 100, selection: -0.1, startFrequency: 0.5 });
  assert.ok(m.fixationProbability < 0.5, `P(fix) = ${m.fixationProbability}, expected < 0.5`);
});

test('neutral drift: mean frequency stays near p₀ after 200 generations', () => {
  // With many replicates and neutral selection, the mean is an unbiased estimator of p₀.
  const p0 = 0.4;
  const replicates = 200;
  const m = new WrightFisherModel({ size: 200, selection: 0, startFrequency: p0, replicates, maxGenerations: 200 });
  for (let g = 0; g < 200; g++) m.step();
  // Fixation/loss outcomes keep the mean at p₀ in expectation.
  // Tolerance loosened because it's stochastic; 200 reps gives sd ≈ 0.035.
  assert.ok(Math.abs(m.meanFrequency - p0) < 0.15, `mean = ${m.meanFrequency}, expected ≈ ${p0}`);
});

test('outcomes: fixed + lost + mixed == replicates', () => {
  const m = new WrightFisherModel({ size: 10, replicates: 30, maxGenerations: 50 });
  for (let g = 0; g < 50; g++) m.step();
  const { fixed, lost, mixed } = m.outcomes;
  assert.strictEqual(fixed + lost + mixed, 30);
});
