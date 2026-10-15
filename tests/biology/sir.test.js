import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIRModel } from '../../js/benches/biology/ecology/sir/SIRModel.js';

test('S + I + R = 1 at every step (10000 steps)', () => {
  const m = new SIRModel({ beta: 0.3, gamma: 0.1, I0: 0.01 });
  for (let i = 0; i < 10000; i++) {
    m.step();
    const sum = m.S + m.I + m.R;
    assert.ok(Math.abs(sum - 1) < 1e-9, `sum=${sum} at step ${i}`);
  }
});
test('I → 0 after 10000 steps', () => {
  const m = new SIRModel({ beta: 0.3, gamma: 0.1, I0: 0.01 });
  for (let i = 0; i < 10000; i++) m.step();
  assert.ok(m.I < 1e-6, `I=${m.I}`);
});
test('R0=2 → finalSize ≈ 0.797 ±0.002', () => {
  // beta=0.2, gamma=0.1 → R0=2
  const m = new SIRModel({ beta: 0.2, gamma: 0.1 });
  const fs = m.finalSize;
  assert.ok(Math.abs(fs - 0.797) < 0.002, `finalSize=${fs}`);
});
test('R0=3 → finalSize ≈ 0.940 ±0.002', () => {
  // beta=0.3, gamma=0.1 → R0=3
  const m = new SIRModel({ beta: 0.3, gamma: 0.1 });
  const fs = m.finalSize;
  assert.ok(Math.abs(fs - 0.940) < 0.002, `finalSize=${fs}`);
});
test('R0 < 1 → epidemic dies out (R < 0.01 after 2000 steps)', () => {
  const m = new SIRModel({ beta: 0.05, gamma: 0.2, I0: 0.001 }); // R0=0.25
  for (let i = 0; i < 2000; i++) m.step();
  assert.ok(m.R < 0.01, `R=${m.R}`);
});
test('herdThreshold = 1 - 1/R0 ±1e-10', () => {
  const m = new SIRModel({ beta: 0.3, gamma: 0.1 });
  assert.ok(Math.abs(m.herdThreshold - (1 - 1/3)) < 1e-10);
});
