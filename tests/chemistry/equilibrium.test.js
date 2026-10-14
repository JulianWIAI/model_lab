/**
 * Tests for ReactionModel.
 * Key result: Q settles to K at equilibrium.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReactionModel } from '../../js/benches/chemistry/equilibrium/equilibrium/ReactionModel.js';

test('Q approaches K after long simulation', () => {
  const m = new ReactionModel();
  // Run for 200 simulated seconds
  for (let i = 0; i < 200; i++) m.step(1);
  assert.ok(Math.abs(m.Q - m.K) / m.K < 0.01, `Q = ${m.Q}, K = ${m.K}, ratio error ${Math.abs(m.Q - m.K) / m.K}`);
});

test('Q = 0 at t=0 (no product yet)', () => {
  const m = new ReactionModel();
  assert.strictEqual(m.Q, 0);
});

test('K = kf/kr', () => {
  const m = new ReactionModel();
  assert.ok(Math.abs(m.K - m.kForward / m.kReverse) < 1e-10);
});

test('catalyst lowers barriers and speeds up equilibrium', () => {
  const mSlow = new ReactionModel();
  const mFast = new ReactionModel();
  mFast.catalyst = true;
  // Run 20 seconds; the catalysed reaction should be much closer to K
  for (let i = 0; i < 20; i++) {
    mSlow.step(1);
    mFast.step(1);
  }
  const errorSlow = Math.abs(mSlow.Q - mSlow.K) / mSlow.K;
  const errorFast = Math.abs(mFast.Q - mFast.K) / mFast.K;
  assert.ok(errorFast < errorSlow, `catalyst should reduce Q−K gap: slow=${errorSlow.toFixed(4)}, fast=${errorFast.toFixed(4)}`);
});

test('activationReverse = activationForward − reactionEnergy', () => {
  const m = new ReactionModel();
  assert.ok(Math.abs(m.activationReverse - (m.activationForward - m.reactionEnergy)) < 1e-10);
});
