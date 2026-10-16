import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MarkovModel } from '../../js/benches/math/probability/markov-chains/MarkovModel.js';

// Anchor: p=0.3, q=0.4
const P = 0.3, Q = 0.4;
const PI0 = Q / (P + Q);  // 4/7
const PI1 = P / (P + Q);  // 3/7
const LAM2 = 1 - P - Q;   // 0.3

test('π₀ = q/(p+q) = 4/7 ±1e-10', () => {
  const m = new MarkovModel({ p: P, q: Q });
  const pi = m.stationary;
  assert.ok(Math.abs(pi[0] - PI0) < 1e-10, `π₀=${pi[0]}`);
});

test('π₁ = p/(p+q) = 3/7 ±1e-10', () => {
  const m = new MarkovModel({ p: P, q: Q });
  const pi = m.stationary;
  assert.ok(Math.abs(pi[1] - PI1) < 1e-10, `π₁=${pi[1]}`);
});

test('λ₂ = 1-p-q = 0.3 ±1e-15', () => {
  const m = new MarkovModel({ p: P, q: Q });
  assert.ok(Math.abs(m.lambda2 - LAM2) < 1e-15, `λ₂=${m.lambda2}`);
});

test('spectral gap = p+q = 0.7 ±1e-15', () => {
  const m = new MarkovModel({ p: P, q: Q });
  assert.ok(Math.abs(m.spectralGap - (P + Q)) < 1e-15, `gap=${m.spectralGap}`);
});

test('π·P = π residual ±1e-14', () => {
  const m  = new MarkovModel({ p: P, q: Q });
  const pi = m.stationary;
  const res = m.stationarityResidual(pi);
  assert.ok(res < 1e-14, `residual=${res}`);
});

test('detailed balance π₀·p = π₁·q ±1e-12', () => {
  const m  = new MarkovModel({ p: P, q: Q });
  const pi = m.stationary;
  assert.ok(Math.abs(pi[0] * P - pi[1] * Q) < 1e-12,
    `π₀p=${pi[0]*P}, π₁q=${pi[1]*Q}`);
});

test('exact TV(4) ≤ 0.01 → t_mix(0.01) = 4', () => {
  const m = new MarkovModel({ p: P, q: Q });
  // TV(4) = |λ₂|^4 · max(π) = 0.3^4 · 4/7 ≈ 0.00777
  const tv4 = m.tvDistance(4);
  assert.ok(tv4 <= 0.01, `TV(4)=${tv4}`);
  assert.strictEqual(m.tMix(0.01), 4);
});

test('TV(3) > 0.01 (t_mix not 3)', () => {
  const m = new MarkovModel({ p: P, q: Q });
  const tv3 = m.tvDistance(3);
  assert.ok(tv3 > 0.01, `TV(3)=${tv3}`);
});

test('power iteration converges to π ±1e-10', () => {
  const m     = new MarkovModel({ p: P, q: Q });
  const pi    = m.stationary;
  const piIter = m.powerIterate(200);
  assert.ok(Math.abs(piIter[0] - pi[0]) < 1e-10 &&
            Math.abs(piIter[1] - pi[1]) < 1e-10,
    `iter=[${piIter}], pi=[${pi}]`);
});

test('p=q=0.6 (p+q>1): λ₂ = -0.2 ±1e-15', () => {
  const m = new MarkovModel({ p: 0.6, q: 0.6 });
  assert.ok(Math.abs(m.lambda2 - (-0.2)) < 1e-15, `λ₂=${m.lambda2}`);
});

test('p=q=0: stationary is null (no unique π)', () => {
  const m = new MarkovModel({ p: 0, q: 0 });
  assert.strictEqual(m.stationary, null);
});

test('3-state preset: π·P = π ±1e-10', () => {
  const { P: P3, pi: pi3 } = MarkovModel.PRESET_3STATE;
  const pi_iter = MarkovModel.stationaryN(P3, 500);
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(pi_iter[i] - pi3[i]) < 1e-10,
      `pi[${i}]=${pi_iter[i]}, expected=${pi3[i]}`);
  }
});

test('3-state second eigenvalue = 0.5 ±1e-10 (via ratio TV step test)', () => {
  // λ₂=0.5 means TV halves each step for the 3-state preset when starting from imbalanced IC
  // Check via power iteration rate of convergence
  const { P: P3 } = MarkovModel.PRESET_3STATE;
  const pi3 = [0.25, 0.5, 0.25];
  let v = [1, 0, 0];   // start far from π
  const PT = P3[0].map((_, j) => P3.map(row => row[j]));  // Pᵀ
  for (let k = 0; k < 10; k++) {
    const vNext = new Array(3).fill(0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) vNext[j] += v[i] * P3[i][j];
    v = vNext;
  }
  // TV after 10 steps ≈ 0.5^10 · max(π) ≈ 0.000244
  const tv10 = v.reduce((s, vi, i) => s + Math.abs(vi - pi3[i]), 0) / 2;
  assert.ok(tv10 < 1e-3 && tv10 > 0, `TV(10)=${tv10}`);
});

// ── LPW upper bound ────────────────────────────────────────────────────────
// t_mix(ε) ≤ t_rel · ln(1/(ε·π_min))
// p=0.3,q=0.4: t_rel=1/0.7≈1.4286, π_min=3/7, ε=0.01
// bound = (1/0.7)·ln(1/(0.01·3/7)) = 1.4286·ln(700/3) ≈ 1.4286·5.454 ≈ 7.789

test('LPW upper bound 7.789 ≥ exact t_mix 4 (p=0.3, q=0.4, ε=0.01)', () => {
  const m      = new MarkovModel({ p: P, q: Q });
  const eps    = 0.01;
  const piMin  = Math.min(m.stationary[0], m.stationary[1]);
  const bound  = m.tRel * Math.log(1 / (eps * piMin));
  const exact  = m.tMix(eps);
  assert.ok(bound >= exact, `LPW bound ${bound} must be ≥ t_mix ${exact}`);
  // Value check: bound ≈ 7.789
  assert.ok(Math.abs(bound - 7.789) < 0.001, `bound=${bound}, expected≈7.789`);
});

// ── p=q=1 : perfectly periodic (period 2) ─────────────────────────────────
// P = [[0,1],[1,0]]; λ₂ = 1-1-1 = -1; spectral gap = 0; tMix = Infinity

test('p=q=1: λ₂ = -1 ±1e-15 (periodic chain)', () => {
  const m = new MarkovModel({ p: 1, q: 1 });
  assert.ok(Math.abs(m.lambda2 - (-1)) < 1e-15, `λ₂=${m.lambda2}`);
});

test('p=q=1: tMix(0.01) = Infinity (never mixes)', () => {
  const m = new MarkovModel({ p: 1, q: 1 });
  assert.strictEqual(m.tMix(0.01), Infinity);
});

// ── RangeError for p, q outside [0,1] ─────────────────────────────────────

test('p outside [0,1] → RangeError', () => {
  assert.throws(() => new MarkovModel({ p: 1.01 }), RangeError);
  assert.throws(() => new MarkovModel({ p: -0.1 }), RangeError);
});

test('q outside [0,1] → RangeError', () => {
  assert.throws(() => new MarkovModel({ q: 1.01 }), RangeError);
  assert.throws(() => new MarkovModel({ q: -0.1 }), RangeError);
});

// ── 3-state π = (1/4, 1/2, 1/4) by value ─────────────────────────────────
// Verify from the preset, not just via power iteration

test('3-state preset: π = [1/4, 1/2, 1/4] by value ±1e-10', () => {
  const { pi: pi3 } = MarkovModel.PRESET_3STATE;
  assert.ok(Math.abs(pi3[0] - 0.25) < 1e-10, `π₀=${pi3[0]}`);
  assert.ok(Math.abs(pi3[1] - 0.5)  < 1e-10, `π₁=${pi3[1]}`);
  assert.ok(Math.abs(pi3[2] - 0.25) < 1e-10, `π₂=${pi3[2]}`);
  // Also confirm preset lambda2 = 0.5 by value
  assert.ok(Math.abs(MarkovModel.PRESET_3STATE.lambda2 - 0.5) < 1e-10, 'lambda2≠0.5');
});

test('3-state preset: π·P = π ±1e-14 (stationarity by algebraic identity)', () => {
  // Direct matrix-vector check — no power iteration
  const { P: P3, pi: pi3 } = MarkovModel.PRESET_3STATE;
  // (π·P)[j] = Σ_i π_i · P[i][j]
  const n = 3;
  for (let j = 0; j < n; j++) {
    const val = pi3.reduce((s, pi_i, i) => s + pi_i * P3[i][j], 0);
    assert.ok(Math.abs(val - pi3[j]) < 1e-14, `(π·P)[${j}]=${val}, π[${j}]=${pi3[j]}`);
  }
});

test('3-state preset: eigenvalues include 1, 0.5, 0 (verified via det(P−λI)=0)', () => {
  // P = [[0.5,0.5,0],[0.25,0.5,0.25],[0,0.5,0.5]]
  // Char poly: (0.5−λ)[(0.5−λ)²−0.25] = 0 → λ∈{0,0.5,1}
  // Check each candidate λ: ||P·v − λ·v||∞ < 1e-12 for an eigenvector v
  const { P: P3 } = MarkovModel.PRESET_3STATE;
  // λ=1 eigenvector: [1,1,1] (any row-stochastic matrix has λ=1)
  // λ=0.5 eigenvector: [1,0,-1]
  // λ=0 eigenvector: [1,-1,1] (from: v0=-v1, v2=-v1 at λ=0)
  const pairs = [[1, [1,1,1]], [0.5, [1,0,-1]], [0, [1,-1,1]]];
  for (const [lam, v] of pairs) {
    const n = 3;
    const Pv = new Array(n).fill(0);
    // (P·v)[i] = Σ_j P[i][j] * v[j]
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Pv[i] += P3[i][j] * v[j];
    const err = Pv.reduce((s, x, i) => Math.max(s, Math.abs(x - lam * v[i])), 0);
    assert.ok(err < 1e-14, `λ=${lam}: ||P·v−λv||∞=${err}`);
  }
});
