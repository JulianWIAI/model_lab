import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DriftDiffusionModel } from '../../js/benches/psychology/decision-making/drift-diffusion/DriftDiffusionModel.js';

// Anchors (independent derivation)
const MU = 1, SIG = 1, A = 1, T0 = 0.3;
const P_UP_EXACT  = 1 / (1 + Math.exp(-2 * MU * A / SIG ** 2));  // ≈ 0.880797
const E_T_EXACT   = (A / MU) * Math.tanh(MU * A / SIG ** 2);     // ≈ 0.761594
const RT_EXACT    = E_T_EXACT + T0;                               // ≈ 1.061594

test('P+(μ=1,a=1,σ=1) ±1e-6', () => {
  const m = new DriftDiffusionModel({ mu: MU, sigma: SIG, a: A, t0: T0 });
  assert.ok(Math.abs(m.pUpper - P_UP_EXACT) < 1e-6,
    `pUpper=${m.pUpper}, expected=${P_UP_EXACT}`);
});

test('RT_mean(μ=1,a=1,σ=1,t0=0.3) ±1e-6', () => {
  const m = new DriftDiffusionModel({ mu: MU, sigma: SIG, a: A, t0: T0 });
  assert.ok(Math.abs(m.rtMean - RT_EXACT) < 1e-6,
    `rtMean=${m.rtMean}, expected=${RT_EXACT}`);
});

test('P+(μ=0) = 0.5 ±1e-15', () => {
  const m = new DriftDiffusionModel({ mu: 0, sigma: SIG, a: A, t0: T0 });
  assert.ok(Math.abs(m.pUpper - 0.5) < 1e-15, `pUpper=${m.pUpper}`);
});

test('E[T](μ=0) = a²/σ² = 1 ±1e-10', () => {
  const m = new DriftDiffusionModel({ mu: 0, sigma: 1, a: 1, t0: 0 });
  assert.ok(Math.abs(m.meanFPT - 1) < 1e-10, `meanFPT=${m.meanFPT}`);
});

test('E[T] continuity: μ=1e-8 ≈ a²/σ² ±1e-10', () => {
  // z = μa/σ² = 1e-8; tanh(z) ≈ z to machine precision; (a/μ)·z = 1 exactly
  // residual error ≈ z²/3 ≈ 3e-17, so 1e-10 is a safe tolerance
  const m = new DriftDiffusionModel({ mu: 1e-8, sigma: 1, a: 1, t0: 0 });
  assert.ok(Math.abs(m.meanFPT - 1) < 1e-10,
    `meanFPT(μ=1e-8)=${m.meanFPT}`);
});

test('σ<=0 → RangeError', () => {
  assert.throws(() => new DriftDiffusionModel({ mu: 1, sigma: 0,  a: 1 }), RangeError);
  assert.throws(() => new DriftDiffusionModel({ mu: 1, sigma: -1, a: 1 }), RangeError);
});

test('a<=0 → RangeError', () => {
  assert.throws(() => new DriftDiffusionModel({ mu: 1, sigma: 1, a: 0  }), RangeError);
  assert.throws(() => new DriftDiffusionModel({ mu: 1, sigma: 1, a: -1 }), RangeError);
});

test('RT_mean > t₀', () => {
  const m = new DriftDiffusionModel({ mu: MU, sigma: SIG, a: A, t0: T0 });
  assert.ok(m.rtMean > m.t0, `rtMean=${m.rtMean}, t0=${m.t0}`);
});

test('simulation P+ within 4√(p(1-p)/N) of formula (N=5000, seed=42)', () => {
  // Use theoretical p (not observed p̂) for the tolerance: 4·√(p(1-p)/N) ≈ 0.0184
  // 4σ covers 99.994% of outcomes under H₀ (virtually no false failures)
  const m   = new DriftDiffusionModel({ mu: MU, sigma: SIG, a: A, t0: T0 });
  const sim = m.simulate(5000, 0.001, 42);
  const tol = 4 * Math.sqrt(P_UP_EXACT * (1 - P_UP_EXACT) / 5000);
  assert.ok(Math.abs(sim.pUpper - P_UP_EXACT) < tol,
    `sim.pUpper=${sim.pUpper}, formula=${P_UP_EXACT}, tol=${tol}`);
});

// BGK bias correction test: dropped.
// The Broadie–Glasserman–Kou (1997) correction ≈ 0.5826·σ·√dt is a first-order
// effect that is hard to isolate without an independent reference value or
// extremely large N. It is cited in the model docstring but not tested here.

test('dt-halving: P+ converges (|dt - dt/2| > |dt/2 - dt/4|)', () => {
  const m    = new DriftDiffusionModel({ mu: MU, sigma: SIG, a: A, t0: 0 });
  const pRef = m.pUpper;
  const p1   = m.simulate(3000, 0.01,  42).pUpper;
  const p2   = m.simulate(3000, 0.005, 42).pUpper;
  const p4   = m.simulate(3000, 0.0025, 42).pUpper;
  assert.ok(Math.abs(p1 - pRef) >= Math.abs(p2 - pRef) - 0.01,
    `|dt=0.01|=${Math.abs(p1-pRef).toFixed(4)}, |dt=0.005|=${Math.abs(p2-pRef).toFixed(4)}`);
  // P+ converges toward formula as dt shrinks
  assert.ok(Math.abs(p4 - pRef) < 0.05,
    `p4=${p4}, ref=${pRef}`);
});


// ── RangeError for t0 < 0 (E-4) ─────────────────────────────────────────────

test('t0 < 0 → RangeError', () => {
  assert.throws(() => new DriftDiffusionModel({ t0: -0.1 }), RangeError);
  assert.throws(() => new DriftDiffusionModel({ t0: -1   }), RangeError);
});

// ── T-4: large-μ asymptotic limits ──────────────────────────────────────────
// pUpper → 1, meanFPT → a/μ as μ → ∞
// Asymptotic error at μ=10, a=1, σ=1:
//   1 - pUpper ≈ exp(-20) ≈ 2e-9  →  tolerance 1e-8
//   |meanFPT - a/μ| ≈ 2(a/μ)exp(-20) ≈ 4e-11  →  tolerance 1e-9

test('large-μ: P+ → 1 and meanFPT → a/μ at μ=10 (a=σ=1)', () => {
  const mu = 10, a = 1, sigma = 1;
  const m  = new DriftDiffusionModel({ mu, sigma, a });
  // P+ = 1/(1+exp(-2μa/σ²)); asymptotic error ≈ exp(-20) ≈ 2e-9
  assert.ok(m.pUpper > 1 - 1e-8, `pUpper=${m.pUpper}, should be ≈ 1`);
  // meanFPT = (a/μ)·tanh(μa/σ²); asymptotic error ≈ 2(a/μ)exp(-20) ≈ 4e-11
  assert.ok(Math.abs(m.meanFPT - a / mu) < 1e-9,
    `meanFPT=${m.meanFPT}, expected=${a/mu}`);
});
