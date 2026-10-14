/**
 * Tests for PendulumModel.
 * Key result: exact period = T₀ / AGM(1, cos(θ₀/2)).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PendulumModel } from '../../js/benches/physics/mechanics/pendulum/PendulumModel.js';

/** AGM of a and b converges to 5 sig figs in a handful of iterations. */
function agm(a, b) {
  for (let i = 0; i < 20; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return a;
}

test('exactPeriod equals T₀/AGM(1, cos(θ₀/2)) for 10°', () => {
  const model = new PendulumModel({ angleDeg: 10, length: 1, gravity: 9.81 });
  const T0 = 2 * Math.PI * Math.sqrt(1 / 9.81);
  const expected = T0 / agm(1, Math.cos((10 * Math.PI) / 360));
  assert.ok(Math.abs(model.exactPeriod - expected) < 1e-12, `period = ${model.exactPeriod}, expected ${expected}`);
});

test('exactPeriod equals T₀/AGM(1, cos(θ₀/2)) for 90°', () => {
  const model = new PendulumModel({ angleDeg: 90, length: 1, gravity: 9.81 });
  const T0 = 2 * Math.PI * Math.sqrt(1 / 9.81);
  const expected = T0 / agm(1, Math.cos((90 * Math.PI) / 360));
  assert.ok(Math.abs(model.exactPeriod - expected) < 1e-12, `period = ${model.exactPeriod}, expected ${expected}`);
});

test('smallAnglePeriod = 2π√(L/g)', () => {
  const model = new PendulumModel({ length: 2, gravity: 9.81 });
  const expected = 2 * Math.PI * Math.sqrt(2 / 9.81);
  assert.ok(Math.abs(model.smallAnglePeriod - expected) < 1e-12);
});

test('exactPeriod > smallAnglePeriod for all angles > 0', () => {
  for (const deg of [1, 30, 60, 90, 120, 150]) {
    const model = new PendulumModel({ angleDeg: deg });
    assert.ok(model.exactPeriod >= model.smallAnglePeriod, `at ${deg}°, exact < small-angle`);
  }
});

test('simulation measures exact period close to analytic for 30°', async () => {
  const model = new PendulumModel({ angleDeg: 30, damping: 0 });
  const expected = model.exactPeriod;
  // Step enough to get two crossings (one period)
  for (let i = 0; i < Math.ceil(expected / 0.002) * 2; i++) {
    model.step(0.002);
  }
  const measured = model.measuredPeriod('exact');
  assert.ok(measured !== null, 'no measured period yet — need more steps');
  assert.ok(Math.abs(measured - expected) / expected < 0.001, `measured ${measured}, expected ${expected}`);
});
