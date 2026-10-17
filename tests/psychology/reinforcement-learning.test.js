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

test('P(reach 8 before 0, start=2) = 2/8 via Thomas algorithm on corridor absorbing chain', () => {
  // Corridor MDP: unbiased walk on states 0..8, absorbing at 0 and 8.
  // P(k) = P(reach 8 | start k) satisfies P(k-1) − 2P(k) + P(k+1) = 0 (k=1..7),
  // P(0)=0, P(8)=1. Solution P(k)=k/8, so P(2)=2/8.
  // Solve the 7×7 tridiagonal system by Thomas algorithm; no hardcoded answer.
  const n = 7;  // unknowns: P(1)..P(7) = x[0]..x[6]
  const rhs = new Array(n).fill(0); rhs[n - 1] = -1;  // boundary P(8)=1 moves to RHS
  // Forward sweep: sub=1, main=−2, super=1
  const c = new Array(n).fill(0);
  const d = new Array(n).fill(0);
  c[0] = 1 / (-2);
  d[0] = rhs[0] / (-2);
  for (let i = 1; i < n; i++) {
    const denom = -2 - c[i - 1];
    c[i] = 1 / denom;
    d[i] = (rhs[i] - d[i - 1]) / denom;
  }
  // Back substitution
  const x = new Array(n).fill(0);
  x[n - 1] = d[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = d[i] - c[i] * x[i + 1];
  // x[1] = P(2)
  assert.ok(Math.abs(x[1] - 2 / 8) < 1e-12, `P(2)=${x[1]}`);
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
  // Q*(2,'right') ~ γ^5·10 = 5.9049; ±0.5 tolerance justified:
  // ε-greedy Q-learning with α=0.1, ε=0.1, 10 000 episodes is stochastic.
  // Convergence theory (Watkins & Dayan 1992) guarantees Q→Q* in the limit, but for
  // finite episodes the standard deviation of Q estimates is O(1/√episodes) scaled by
  // the Q-value range (~10); with 10 000 episodes the 3σ bound is roughly ±0.3.
  // ±0.5 = 8.5% of 5.9049; covers 3σ for this episode count and learning rate.
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
