/**
 * Tests for STDPModel.
 *
 * Anchors from tools/anchors-phase9.mjs §1 (STDP).
 *
 * Parameters: A₊=0.005, A₋=0.00525, τ₊=τ₋=20 ms
 *   kernel(+10) = 0.005·e^{-0.5} = 0.003032653299366541
 *   kernel(-10) = -0.00525·e^{-0.5} = -0.003184285964334868
 *   Net area = A₊τ₊ − A₋τ₋ = 0.1 − 0.105 = -0.005 ms
 *
 * Campbell's theorem (r=0.01/ms, M=1e5):
 *   E[Δw] = r·W_net = -5e-5
 *   Var[Δw] = r(A₊²τ₊/2 + A₋²τ₋/2) ≈ 5.256e-6
 *   SE(M=1e5) ≈ 7.25e-6; 4·SE ≈ 2.9e-5
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STDPModel } from '../../js/benches/neuroscience/synaptic/stdp/STDPModel.js';
import { Random } from '../../js/core/Random.js';

const m = new STDPModel({ A_plus: 0.005, A_minus: 0.00525, tau_plus_ms: 20, tau_minus_ms: 20 });

// ── Kernel values ─────────────────────────────────────────────────────────────

test('kernel(+10) = A₊·e^{-0.5} ±1e-15 relative', () => {
  const v = m.kernel(10);
  const ref = 0.005 * Math.exp(-0.5);
  assert.ok(Math.abs(v / ref - 1) < 1e-15, `kernel(+10)=${v}, ref=${ref}`);
});

test('kernel(-10) = -A₋·e^{-0.5} ±1e-15 relative', () => {
  const v = m.kernel(-10);
  const ref = -0.00525 * Math.exp(-0.5);
  assert.ok(Math.abs(v / ref - 1) < 1e-15, `kernel(-10)=${v}, ref=${ref}`);
});

test('kernel(0) = 0 (simultaneous, no plasticity)', () => {
  assert.strictEqual(m.kernel(0), 0);
});

test('kernel(+Δt) > 0 for Δt > 0 (LTP)', () => {
  assert.ok(m.kernel(1) > 0);
  assert.ok(m.kernel(100) > 0);
});

test('kernel(-Δt) < 0 for Δt < 0 (LTD)', () => {
  assert.ok(m.kernel(-1) < 0);
  assert.ok(m.kernel(-100) < 0);
});

// ── Net area ──────────────────────────────────────────────────────────────────

test('netArea = A₊τ₊ − A₋τ₋ = -0.005 ms ±1e-15 relative', () => {
  const v = m.netArea();
  const ref = 0.005 * 20 - 0.00525 * 20;
  assert.ok(Math.abs(v / ref - 1) < 1e-15, `netArea=${v}, ref=${ref}`);
});

test('LTP area A₊τ₊ = 0.1 ms ±1e-15 relative', () => {
  const v = m.A_plus * m.tau_plus_ms;
  assert.ok(Math.abs(v / 0.1 - 1) < 1e-15, `A₊τ₊=${v}`);
});

test('LTD area A₋τ₋ = 0.105 ms ±1e-15 relative', () => {
  const v = m.A_minus * m.tau_minus_ms;
  assert.ok(Math.abs(v / 0.105 - 1) < 1e-15, `A₋τ₋=${v}`);
});

// ── simulate ─────────────────────────────────────────────────────────────────

test('simulate([0], [10]) = kernel(10) ±1e-15 relative', () => {
  const v = m.simulate([0], [10]);
  const ref = m.kernel(10);
  assert.ok(Math.abs(v / ref - 1) < 1e-15, `simulate([0],[10])=${v}`);
});

test('simulate: all-to-all pairing (2 pre, 2 post)', () => {
  // 4 pairs: (0,10),(0,30),(20,10),(20,30)
  const v = m.simulate([0, 20], [10, 30]);
  const ref = m.kernel(10) + m.kernel(30) + m.kernel(-10) + m.kernel(10);
  assert.ok(Math.abs(v - ref) < 1e-15, `simulate=${v}, ref=${ref}`);
});

test('simulate empty arrays = 0', () => {
  assert.strictEqual(m.simulate([], []), 0);
  assert.strictEqual(m.simulate([0, 10], []), 0);
  assert.strictEqual(m.simulate([], [0, 10]), 0);
});

// ── Campbell's theorem (MC check) ────────────────────────────────────────────

test("Campbell's theorem: Poisson pre, r=0.01/ms, M=1e5 trials", () => {
  // E[Δw] = r·W_net = 0.01·(-0.005) = -5e-5
  // Var[Δw] = r·(A₊²τ₊/2 + A₋²τ₋/2); SE(M=1e5) ≈ 7.25e-6; 4·SE ≈ 2.9e-5
  const r = 0.01;       // spikes/ms
  const T = 1000;       // ms window
  const M = 100000;
  const rng = new Random(42);
  let sum = 0;
  for (let trial = 0; trial < M; trial++) {
    // Poisson number of pre spikes in [0,T]
    const nPre = poissonSample(rng, r * T);
    const preTimes = [];
    for (let i = 0; i < nPre; i++) preTimes.push(rng.next() * T);
    // single post spike at t=500
    sum += m.simulate(preTimes, [500]);
  }
  const meanDw = sum / M;
  const expected = r * m.netArea();  // = -5e-5
  assert.ok(Math.abs(meanDw - expected) < 2.9e-5,
    `Campbell mean=${meanDw}, expected=${expected}, tol=2.9e-5`);
});

function poissonSample(rng, lam) {
  // Knuth algorithm for small λ
  const L = Math.exp(-lam);
  let k = 0, p = 1;
  do { k++; p *= rng.next(); } while (p > L);
  return k - 1;
}

// ── Domain validation ─────────────────────────────────────────────────────────

test('A₊≤0 throws RangeError', () => {
  assert.throws(() => new STDPModel({ A_plus: 0 }), RangeError);
  assert.throws(() => new STDPModel({ A_plus: -0.1 }), RangeError);
});

test('τ₊≤0 throws RangeError', () => {
  assert.throws(() => new STDPModel({ tau_plus_ms: 0 }), RangeError);
  assert.throws(() => new STDPModel({ tau_plus_ms: -1 }), RangeError);
});
