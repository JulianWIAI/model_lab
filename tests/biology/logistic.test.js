import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LogisticModel } from '../../js/benches/biology/ecology/logistic/LogisticModel.js';

test('N(0) === N0', () => {
  const m = new LogisticModel({ N0: 10, r: 0.3, K: 1000 });
  assert.ok(Math.abs(m.N(0) - 10) < 1e-10);
});
test('N(large t) → K', () => {
  const m = new LogisticModel({ N0: 10, r: 0.3, K: 1000 });
  assert.ok(Math.abs(m.N(1000) - 1000) < 0.001);
});
test('dNdt peak is at K/2', () => {
  const m = new LogisticModel({ N0: 10, r: 0.3, K: 1000 });
  const peak = m.dNdt(m.K / 2);
  for (let n = 1; n < 1000; n += 10) {
    assert.ok(peak >= m.dNdt(n) - 1e-10, `peak not max at N=${n}`);
  }
});
test('dNdt(0) === 0', () => {
  const m = new LogisticModel();
  assert.ok(Math.abs(m.dNdt(0)) < 1e-10);
});
test('dNdt(K) ≈ 0', () => {
  const m = new LogisticModel();
  assert.ok(Math.abs(m.dNdt(m.K)) < 1e-10);
});
test('N(tHalf) ≈ K/2', () => {
  const m = new LogisticModel({ N0: 10, r: 0.3, K: 1000 });
  assert.ok(Math.abs(m.N(m.tHalf) - m.K / 2) < 0.001);
});
test('tHalf is null when N0 >= K/2', () => {
  const m = new LogisticModel({ N0: 600, r: 0.3, K: 1000 });
  assert.strictEqual(m.tHalf, null);
});
test('N stays in (0, K] for all t', () => {
  const m = new LogisticModel({ N0: 5, r: 0.5, K: 500 });
  for (let t = 0; t <= 100; t += 1) {
    const Nv = m.N(t);
    assert.ok(Nv > 0 && Nv <= m.K + 1e-10, `N=${Nv} out of bounds at t=${t}`);
  }
});
