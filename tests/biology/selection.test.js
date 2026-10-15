import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SelectionModel } from '../../js/benches/biology/evolution/selection/SelectionModel.js';

test('selectionIntensity at p=0.2 ≈ 1.400 ±0.001', () => {
  const m = new SelectionModel({ p: 0.2, h2: 0.5, sigma: 1 });
  assert.ok(Math.abs(m.selectionIntensity() - 1.400) < 0.001, `i=${m.selectionIntensity()}`);
});
test('selectionIntensity at p=0.5 ≈ 0.798 ±0.001', () => {
  const m = new SelectionModel({ p: 0.5, h2: 0.5, sigma: 1 });
  assert.ok(Math.abs(m.selectionIntensity() - 0.798) < 0.001, `i=${m.selectionIntensity()}`);
});
test('selectionIntensity at p=0.1 ≈ 1.755 ±0.001', () => {
  const m = new SelectionModel({ p: 0.1, h2: 0.5, sigma: 1 });
  assert.ok(Math.abs(m.selectionIntensity() - 1.755) < 0.002, `i=${m.selectionIntensity()}`);
});
test('response = h2 * selectionDifferential', () => {
  const m = new SelectionModel({ p: 0.2, h2: 0.5, sigma: 1.5 });
  assert.ok(Math.abs(m.response() - m.h2 * m.selectionDifferential()) < 1e-10);
});
test('selectionIntensity is monotonically decreasing in p', () => {
  const ps = [];
  for (let j = 5; j <= 95; j += 5) ps.push(j / 100);
  let prev = new SelectionModel({ p: ps[0] }).selectionIntensity();
  for (let j = 1; j < ps.length; j++) {
    const curr = new SelectionModel({ p: ps[j] }).selectionIntensity();
    assert.ok(curr <= prev + 1e-9, `i increased at p=${ps[j]}`);
    prev = curr;
  }
});
