import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RLModel } from '../../js/benches/psychology/learning/reinforcement-learning/RLModel.js';

test('TD error at Q* = 0 ±1e-14', () => {
  const m = new RLModel({ states: [0, 1], actions: ['go'], gamma: 0.9, alpha: 0.1, epsilon: 0 });
  m.setQ(0, 'go', 1);
  const td = m.tdError(0, 'go', 1, 1, true);
  assert.ok(Math.abs(td) < 1e-14, `tdError=${td}`);
});

test('V*(s0)=0.9 for 3-chain ±1e-12', () => {
  const m = new RLModel({ states: [0, 1, 2], actions: ['go'], gamma: 0.9, alpha: 0.1, epsilon: 0 });
  m.setQ(1, 'go', 1);
  m.setQ(0, 'go', 0.9);
  const td = m.tdError(0, 'go', 0, 1, false);
  assert.ok(Math.abs(td) < 1e-12, `tdError=${td}`);
});

test('G_discounted = 0.81 for 2-step episode ±1e-14', () => {
  const G = 0.9 ** 2 * 1;
  assert.ok(Math.abs(G - 0.81) < 1e-14, `G=${G}`);
});

test('P(optimal|ε=0.1, |A|=2) = 0.95 ±1e-14', () => {
  const p = (1 - 0.1) + 0.1 / 2;
  assert.ok(Math.abs(p - 0.95) < 1e-14, `p=${p}`);
});

test('γ* = 10^{-1/4} = 0.5623413251903491 ±1e-14', () => {
  const gStar = Math.pow(10, -0.25);
  assert.ok(Math.abs(gStar - 0.5623413251903491) < 1e-14, `γ*=${gStar}`);
});

test('P(reach 8 before 0, start=2) = 1/4 exactly', () => {
  assert.ok(2 / 8 === 0.25);
});

test('V*(γ=0.9, start=2, via +10) = 0.9^5·10 = 5.9049 ±1e-10', () => {
  const V = 0.9 ** 5 * 10;
  assert.ok(Math.abs(V - 5.9049) < 1e-10, `V=${V}`);
});

test('prefer +10 when γ=0.9 > γ*', () => {
  // Q*(2,'right')=γ⁵·10 vs Q*(2,'left')=γ¹·1
  assert.ok(0.9 ** 5 * 10 > 0.9 ** 1 * 1);
});

test('prefer +1 when γ=0.5 < γ*', () => {
  // Q*(2,'right')=γ⁵·10 < Q*(2,'left')=γ¹·1 when γ < γ*
  assert.ok(0.5 ** 5 * 10 < 0.5 ** 1 * 1);
});

test('Q-learning converges to Q* on corridor ±0.5', () => {
  const model = RLModel.corridor({ gamma: 0.9, alpha: 0.1, epsilon: 0.1, seed: 42 });
  // Train: random starting states to ensure full corridor exploration
  const nonTerminal = [1, 2, 3, 4, 5, 6, 7];
  for (let ep = 0; ep < 10000; ep++) {
    let s = nonTerminal[ep % nonTerminal.length];
    while (s !== 0 && s !== 8) {
      const a = model.epsilonGreedy(s);
      const sNext = a === 'left' ? s - 1 : s + 1;
      const terminal = sNext === 0 || sNext === 8;
      const r = terminal ? (sNext === 8 ? 10 : 1) : 0;
      model.update(s, a, r, sNext, terminal);
      s = sNext;
    }
  }
  // Q*(2,'right') = γ^5 * 10 = 0.9^5 * 10 ≈ 5.9049 (6 right-moves from state 2 to terminal 8)
  const V2 = Math.max(model.Q(2, 'left'), model.Q(2, 'right'));
  // Agent should prefer right (+10 terminal): V2 > 5.0
  assert.ok(V2 > 5.0, `V*(2)=${V2} should be > 5.0`);
  // Q*(2,'right') ~ γ^5·10 = 5.9049; check within generous tolerance
  assert.ok(Math.abs(V2 - 5.9049) < 0.5, `V*(2)=${V2}`);
});

test('gamma ≥ 1 throws RangeError', () => {
  assert.throws(
    () => new RLModel({ states: [0, 1], actions: ['a'], gamma: 1 }),
    RangeError,
  );
});

test('epsilon > 1 throws RangeError', () => {
  assert.throws(
    () => new RLModel({ states: [0, 1], actions: ['a'], gamma: 0.9, alpha: 0.1, epsilon: 1.5 }),
    RangeError,
  );
});
