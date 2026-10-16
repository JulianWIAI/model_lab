/**
 * Tests for SolowModel.
 *
 * Anchors from tools/anchors-phase9.mjs §5.
 *
 * Parameters (α=1/3 exact, s=0.3, A=1, n=0.01, δ=0.05, g=0):
 *   k* = 5√5 = 11.18033988749895
 *   y* = √5  = 2.23606797749979
 *   c* = 0.7√5 = 1.5652475842498528
 *   k_GR = (50/9)^{3/2} = 13.094570024999766
 *   c_GR = 10√2/9 = 1.5713484026367722
 *   s_GR = 1/3 exactly
 *
 * RK4 dt-halving: T=40, k₀=2; err(dt=4)≈2.3e-5, err(dt=2)≈1.5e-6, ratio≈15.6 ∈ [12,20]
 * Convergence: |k(600,dt=1) − k*| < 1e-9
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SolowModel } from '../../js/benches/economics/macroeconomics/solow/SolowModel.js';

const m = new SolowModel({ s: 0.3, alpha: 1/3, A: 1, n: 0.01, delta: 0.05, g: 0 });

// ── Steady state ──────────────────────────────────────────────────────────────

test('k* = 5√5 ±1e-12 relative', () => {
  const { kStar } = m.steadyState();
  const ref = 5 * Math.sqrt(5);
  assert.ok(Math.abs(kStar / ref - 1) < 1e-12, `k*=${kStar}, ref=${ref}`);
});

test('y* = √5 ±1e-12 relative', () => {
  const { yStar } = m.steadyState();
  const ref = Math.sqrt(5);
  assert.ok(Math.abs(yStar / ref - 1) < 1e-12, `y*=${yStar}`);
});

test('c* = 0.7√5 ±1e-12 relative', () => {
  const { cStar } = m.steadyState();
  const ref = 0.7 * Math.sqrt(5);
  assert.ok(Math.abs(cStar / ref - 1) < 1e-12, `c*=${cStar}`);
});

// ── Golden rule ───────────────────────────────────────────────────────────────

test('k_GR = (50/9)^{3/2} ±1e-12 relative', () => {
  const { kGR } = m.goldenRule();
  const ref = Math.pow(50/9, 1.5);
  assert.ok(Math.abs(kGR / ref - 1) < 1e-12, `k_GR=${kGR}, ref=${ref}`);
});

test('c_GR = 10√2/9 ±1e-12 relative', () => {
  const { cGR } = m.goldenRule();
  const ref = 10 * Math.sqrt(2) / 9;
  assert.ok(Math.abs(cGR / ref - 1) < 1e-12, `c_GR=${cGR}`);
});

test('s_GR = α = 1/3 ±1e-12 relative', () => {
  const { sGR } = m.goldenRule();
  assert.ok(Math.abs(sGR / (1/3) - 1) < 1e-12, `s_GR=${sGR}`);
});

// ── Investment = breakeven at k* ──────────────────────────────────────────────

test('investment = breakeven at k* ±1e-12 relative', () => {
  const { kStar, yStar } = m.steadyState();
  const invest   = m.s * yStar;
  const breakEven = (m.n + m.delta + m.g) * kStar;
  assert.ok(Math.abs(invest / breakEven - 1) < 1e-12,
    `invest=${invest}, breakeven=${breakEven}`);
});

// ── dk at k* is zero ──────────────────────────────────────────────────────────

test('dk(k*) = 0 ±1e-10 relative to k*', () => {
  const { kStar } = m.steadyState();
  const dkStar = m.dk(kStar);
  assert.ok(Math.abs(dkStar) < 1e-10 * kStar,
    `dk(k*)=${dkStar}`);
});

// ── RK4 dt-halving ────────────────────────────────────────────────────────────

// Exact solution: z(t) = z* + (z₀-z*)·exp(-μt),  μ=0.04, z=k^{2/3}, z*=5
function kExact(t, k0 = 2) {
  const alpha = 1/3, s = 0.3, A = 1, denom = 0.06;
  const kStar = Math.pow(s * A / denom, 1 / (1 - alpha));
  const mu    = (1 - alpha) * denom;
  const zStar = Math.pow(kStar, 1 - alpha);
  const z0    = Math.pow(k0,    1 - alpha);
  const zt    = zStar + (z0 - zStar) * Math.exp(-mu * t);
  return Math.pow(zt, 1 / (1 - alpha));
}

test('RK4 dt-halving ratio ∈ [12, 20] at T=40 from k₀=2', () => {
  const m2 = new SolowModel({ s: 0.3, alpha: 1/3, A: 1, n: 0.01, delta: 0.05, g: 0 });
  const k_exact = kExact(40);

  // dt=4 (10 steps)
  const sim4  = m2.simulate(2, 40, 4);
  const err4  = Math.abs(sim4[sim4.length - 1].k - k_exact);

  // dt=2 (20 steps)
  const sim2  = m2.simulate(2, 40, 2);
  const err2  = Math.abs(sim2[sim2.length - 1].k - k_exact);

  const ratio = err4 / err2;
  assert.ok(err4 > 1e-6, `err(dt=4)=${err4} must be > 1e-6`);
  assert.ok(err2 > 1e-8, `err(dt=2)=${err2} must be > 1e-8`);
  assert.ok(ratio >= 12 && ratio <= 20,
    `RK4 ratio=${ratio} must be in [12,20]`);
});

// ── Long-run convergence ──────────────────────────────────────────────────────

test('|k(600, dt=1) − k*| < 1e-9', () => {
  const { kStar } = m.steadyState();
  const sim = m.simulate(2, 600, 1);
  const kFinal = sim[sim.length - 1].k;
  assert.ok(Math.abs(kFinal - kStar) < 1e-9,
    `|k(600)−k*|=${Math.abs(kFinal - kStar)}`);
});

// ── simulate basic checks ─────────────────────────────────────────────────────

test('simulate starts at k0', () => {
  const sim = m.simulate(3, 10, 1);
  assert.ok(Math.abs(sim[0].k - 3) < 1e-15, `sim[0].k=${sim[0].k}`);
});

test('simulate converges from below and from above', () => {
  const { kStar } = m.steadyState();
  const simBelow = m.simulate(kStar * 0.5, 200, 1);
  const simAbove = m.simulate(kStar * 1.5, 200, 1);
  // Both approach k*
  assert.ok(simBelow[simBelow.length - 1].k > kStar * 0.99, 'approach from below');
  assert.ok(simAbove[simAbove.length - 1].k < kStar * 1.01, 'approach from above');
});

// ── Domain validation ─────────────────────────────────────────────────────────

test('α=0 throws RangeError', () => {
  assert.throws(() => new SolowModel({ alpha: 0 }), RangeError);
});

test('α=1 throws RangeError', () => {
  assert.throws(() => new SolowModel({ alpha: 1 }), RangeError);
});

test('s≥1 throws RangeError', () => {
  assert.throws(() => new SolowModel({ s: 1 }), RangeError);
  assert.throws(() => new SolowModel({ s: 1.5 }), RangeError);
});

test('s<0 throws RangeError', () => {
  assert.throws(() => new SolowModel({ s: -0.1 }), RangeError);
});

test('n+δ+g ≤ 0 throws RangeError', () => {
  assert.throws(() => new SolowModel({ n: -0.1, delta: 0.05, g: 0 }), RangeError);
});
