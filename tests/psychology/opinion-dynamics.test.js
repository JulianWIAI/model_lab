/**
 * Tests for OpinionDynamicsModel.
 *
 * Anchors from tools/anchors-phase9.mjs §6.
 *
 * W3 = [[0.5,0.3,0.2],[0.2,0.6,0.2],[0.1,0.3,0.6]]
 *   π = (5/21, 9/21, 7/21)  (exact)
 *   Consensus x₀=[0.2,0.8,0.5]: 39/70 = 0.557142857...
 *
 * Ring N=5: W[i][j] = 1/2 if i=j, 1/4 if j=i±1 mod 5
 *   |λ₂| = 1/2 + 1/2·cos(2π/5) ≈ 0.6545085; mean preserved; |λ₂|^40 ≈ 4.3e-8
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OpinionDynamicsModel } from '../../js/benches/psychology/learning/opinion-dynamics/OpinionDynamicsModel.js';

// ── W3: 3-agent model ─────────────────────────────────────────────────────────

const W3 = [[0.5, 0.3, 0.2], [0.2, 0.6, 0.2], [0.1, 0.3, 0.6]];
const m3 = new OpinionDynamicsModel({ W: W3 });
const x0_3 = [0.2, 0.8, 0.5];

test('W·[1,1,1] = [1,1,1] (row-stochastic identity) ±1e-15', () => {
  const ones = [1, 1, 1];
  const v = m3.step(ones);
  v.forEach((vi, i) => assert.ok(Math.abs(vi - 1) < 1e-15, `v[${i}]=${vi}`));
});

test('π·W = π residual < 1e-10 for W3', () => {
  const pi = m3.stationary();
  const n = 3;
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += pi[i] * W3[i][j];
    assert.ok(Math.abs(s - pi[j]) < 1e-10, `(π·W)[${j}]=${s}, π[${j}]=${pi[j]}`);
  }
});

test('π·1 = 1 ±1e-14 for W3', () => {
  const pi = m3.stationary();
  const s = pi.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(s - 1) < 1e-14, `Σπ=${s}`);
});

test('W3 π ≈ (5/21, 9/21, 7/21) ±1e-12 each', () => {
  const pi = m3.stationary();
  const ref = [5/21, 9/21, 7/21];
  ref.forEach((r, i) => {
    assert.ok(Math.abs(pi[i] / r - 1) < 1e-12, `π[${i}]=${pi[i]}, ref=${r}`);
  });
});

test('W3 consensus x₀=[0.2,0.8,0.5] = 39/70 ±1e-12 relative', () => {
  const c = m3.consensus(x0_3);
  const ref = 39 / 70;
  assert.ok(Math.abs(c / ref - 1) < 1e-12, `consensus=${c}, ref=${ref}`);
});

test('W^200·x₀ matches π·x₀ (all agents) ±1e-6', () => {
  const sim = m3.simulate(x0_3, 200);
  const xFinal = sim[sim.length - 1];
  const c = m3.consensus(x0_3);
  xFinal.forEach((xi, i) => {
    assert.ok(Math.abs(xi - c) < 1e-6, `agent ${i}: x(200)=${xi}, consensus=${c}`);
  });
});

test('W3 isPrimitive = true', () => {
  assert.strictEqual(m3.primitive, true);
});

// ── Ring N=5 (doubly-stochastic) ──────────────────────────────────────────────

function makeRing5() {
  const W = Array.from({ length: 5 }, (_, i) => {
    const row = [0, 0, 0, 0, 0];
    row[i] = 0.5;
    row[(i + 1) % 5] = 0.25;
    row[(i + 4) % 5] = 0.25;
    return row;
  });
  return W;
}

const ring5 = new OpinionDynamicsModel({ W: makeRing5() });
const x0_ring = [0.1, 0.3, 0.5, 0.7, 0.9];

test('ring N=5: mean conserved at all t ±1e-15', () => {
  const sim = ring5.simulate(x0_ring, 40);
  const mean0 = x0_ring.reduce((a, b) => a + b) / 5;
  sim.forEach((x, t) => {
    const mean = x.reduce((a, b) => a + b) / 5;
    assert.ok(Math.abs(mean - mean0) < 1e-15, `t=${t}: mean=${mean}`);
  });
});

test('ring N=5: W^40 consensus ≈ mean = 0.5 ±1e-6', () => {
  const sim = ring5.simulate(x0_ring, 40);
  const xFinal = sim[sim.length - 1];
  xFinal.forEach((xi, i) => {
    assert.ok(Math.abs(xi - 0.5) < 1e-6, `agent ${i}: x(40)=${xi}`);
  });
});

// ── Cyclic permutation (N=4): imprimitive, no consensus ───────────────────────

// Cyclic shift: agent i's opinion goes to agent (i+1) mod 4
// W[i][(i+1)%4] = 1, else 0
const Wcyc = [[0,1,0,0],[0,0,1,0],[0,0,0,1],[1,0,0,0]];
const mcyc = new OpinionDynamicsModel({ W: Wcyc });

test('cyclic W (N=4) isPrimitive = false (periodic)', () => {
  assert.strictEqual(mcyc.primitive, false);
});

test('cyclic W: x does not converge (opinions rotate)', () => {
  const x0 = [0.0, 0.25, 0.5, 1.0];
  const sim = mcyc.simulate(x0, 8);
  // After 4 steps, opinions return to original (period 4)
  const x4 = sim[4];
  x0.forEach((v, i) => assert.ok(Math.abs(x4[i] - v) < 1e-15, `x(4)[${i}]=${x4[i]}, x(0)[${i}]=${v}`));
});

// ── Reducible W (block diagonal) ─────────────────────────────────────────────

// Two decoupled groups: [[0.7,0.3,0,0],[0.4,0.6,0,0],[0,0,0.8,0.2],[0,0,0.5,0.5]]
const Wblk = [
  [0.7, 0.3, 0.0, 0.0],
  [0.4, 0.6, 0.0, 0.0],
  [0.0, 0.0, 0.8, 0.2],
  [0.0, 0.0, 0.5, 0.5],
];
const mblk = new OpinionDynamicsModel({ W: Wblk });

test('reducible W: two groups converge to different fixed points', () => {
  const sim = mblk.simulate([0.0, 0.0, 1.0, 1.0], 300);
  const xFinal = sim[sim.length - 1];
  // Group 1 converges to 0; group 2 converges to 1
  assert.ok(xFinal[0] < 0.01, `group1 agent0=${xFinal[0]}`);
  assert.ok(xFinal[1] < 0.01, `group1 agent1=${xFinal[1]}`);
  assert.ok(xFinal[2] > 0.99, `group2 agent2=${xFinal[2]}`);
  assert.ok(xFinal[3] > 0.99, `group2 agent3=${xFinal[3]}`);
});

// ── Domain validation ──────────────────────────────────────────────────────────

test('row sum ≠ 1 throws RangeError', () => {
  assert.throws(
    () => new OpinionDynamicsModel({ W: [[0.5, 0.6], [0.5, 0.5]] }),
    RangeError,
  );
});

test('non-square W throws RangeError', () => {
  assert.throws(
    () => new OpinionDynamicsModel({ W: [[0.5, 0.5, 0], [0.5, 0.5]] }),
    RangeError,
  );
});
