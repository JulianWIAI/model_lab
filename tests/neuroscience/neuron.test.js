/**
 * Tests for HodgkinHuxleyModel.
 * Key results:
 *   - fires repetitively at I = 10 µA/cm²
 *   - does not fire at I = 0
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HodgkinHuxleyModel } from '../../js/benches/neuroscience/electrophysiology/neuron/HodgkinHuxleyModel.js';

/** Step the model for `ms` milliseconds at dt = 0.01 ms. */
function runFor(model, ms) {
  const steps = Math.round(ms / 0.01);
  for (let i = 0; i < steps; i++) model.step(0.01);
}

test('fires repetitively at I = 10 µA/cm² (≥ 2 spikes in 200 ms)', () => {
  const m = new HodgkinHuxleyModel();
  m.inputCurrent = 10;
  runFor(m, 200);
  assert.ok(m.spikeTimes.length >= 2, `only ${m.spikeTimes.length} spikes at 10 µA/cm²`);
});

test('does not fire spontaneously at I = 0 (0 spikes in 200 ms)', () => {
  const m = new HodgkinHuxleyModel();
  m.inputCurrent = 0;
  runFor(m, 200);
  assert.strictEqual(m.spikeTimes.length, 0, 'unexpected spike at I = 0');
});

test('resting potential is near −65 mV', () => {
  const m = new HodgkinHuxleyModel();
  assert.ok(Math.abs(m.V - (-65)) < 1, `V = ${m.V} mV, expected ≈ −65 mV`);
});

test('voltage rises above 0 mV during a spike', () => {
  const m = new HodgkinHuxleyModel();
  m.inputCurrent = 20;
  let maxV = -Infinity;
  const steps = Math.round(50 / 0.01);
  for (let i = 0; i < steps; i++) {
    m.step(0.01);
    maxV = Math.max(maxV, m.V);
  }
  assert.ok(maxV > 0, `peak V = ${maxV} mV, expected > 0`);
});

test('steady-state gate values at −65 mV satisfy 0 < x < 1', () => {
  const M = HodgkinHuxleyModel;
  const V = -65;
  const m_inf = M.steadyState(M.alphaM, M.betaM, V);
  const h_inf = M.steadyState(M.alphaH, M.betaH, V);
  const n_inf = M.steadyState(M.alphaN, M.betaN, V);
  assert.ok(m_inf > 0 && m_inf < 1, `m∞ = ${m_inf}`);
  assert.ok(h_inf > 0 && h_inf < 1, `h∞ = ${h_inf}`);
  assert.ok(n_inf > 0 && n_inf < 1, `n∞ = ${n_inf}`);
});
