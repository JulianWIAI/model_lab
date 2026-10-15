import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PredatorPreyModel } from '../../js/benches/biology/ecology/predator-prey/PredatorPreyModel.js';

test('equilibrium() is γ/δ, α/β', () => {
  const m = new PredatorPreyModel({ alpha:0.6, beta:0.05, delta:0.04, gamma:0.5 });
  const eq = m.equilibrium();
  assert.ok(Math.abs(eq.x - 0.5/0.04) < 1e-10);
  assert.ok(Math.abs(eq.y - 0.6/0.05) < 1e-10);
});
test('x and y ≥ 0 after 5000 steps', () => {
  const m = new PredatorPreyModel();
  for (let i = 0; i < 5000; i++) m.step();
  assert.ok(m.x >= 0);
  assert.ok(m.y >= 0);
});
test('conserved quantity stays within ±0.01 after 1000 steps', () => {
  const m = new PredatorPreyModel();
  const V0 = m.V0;
  for (let i = 0; i < 1000; i++) m.step();
  assert.ok(Math.abs(m.conserved - V0) < 0.01, `drift=${Math.abs(m.conserved - V0)}`);
});
test('at equilibrium x and y stay constant (±1e-6) after 500 steps', () => {
  const m = new PredatorPreyModel();
  const eq = m.equilibrium();
  m._y = [eq.x, eq.y];
  m.V0 = m._conservedOf(eq.x, eq.y);
  const x0 = m.x, y0 = m.y;
  for (let i = 0; i < 500; i++) m.step();
  assert.ok(Math.abs(m.x - x0) < 1e-6, `x drift=${Math.abs(m.x - x0)}`);
  assert.ok(Math.abs(m.y - y0) < 1e-6, `y drift=${Math.abs(m.y - y0)}`);
});
test('x and y oscillate from default init over 2000 steps', () => {
  const m = new PredatorPreyModel();
  let maxX = 0, minX = Infinity;
  for (let i = 0; i < 2000; i++) {
    m.step();
    if (m.x > maxX) maxX = m.x;
    if (m.x < minX) minX = m.x;
  }
  assert.ok(maxX > 11, `maxX=${maxX}`);
  assert.ok(minX < 5,  `minX=${minX}`);
});
