import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CompetitiveExclusionModel } from '../../js/benches/biology/ecology/competitive-exclusion/CompetitiveExclusionModel.js';

// Anchors: K1=K2=100
test('coexistence N₁* = 200/3 ±1e-10 (K=100, α=0.5)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5 });
  const [N1s] = m.equilibrium;
  assert.ok(Math.abs(N1s - 200 / 3) < 1e-10, `N₁*=${N1s}`);
});

test('coexistence N₂* = 200/3 ±1e-10 (K=100, α=0.5)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5 });
  const [, N2s] = m.equilibrium;
  assert.ok(Math.abs(N2s - 200 / 3) < 1e-10, `N₂*=${N2s}`);
});

test('counterexample N₂* = -200 ±1e-10 (α₁₂=0.5, α₂₁=1.5)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 1.5 });
  const [, N2s] = m.equilibrium;
  assert.ok(Math.abs(N2s - (-200)) < 1e-10, `N₂*=${N2s}`);
});

test('counterexample outcome is sp1-wins', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 1.5 });
  assert.strictEqual(m.outcome, 'sp1-wins');
});

test('sp2-wins: α₁₂=1.5, α₂₁=0.5 → N₁*=-200 ±1e-10', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 0.5 });
  const [N1s] = m.equilibrium;
  assert.ok(Math.abs(N1s - (-200)) < 1e-10, `N₁*=${N1s}`);
  assert.strictEqual(m.outcome, 'sp2-wins');
});

test('Jacobian eigenvalues at coexistence: -1 and -1/3 ±1e-10', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5 });
  const J = m.jacobianAtEquilibrium;
  assert.ok(J !== null, 'Jacobian should exist');
  // τ = J[0][0]+J[1][1], Δ = det(J)
  const tau = J[0][0] + J[1][1];
  const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
  const disc = tau ** 2 - 4 * det;
  const lam1 = (tau + Math.sqrt(disc)) / 2;
  const lam2 = (tau - Math.sqrt(disc)) / 2;
  assert.ok(Math.abs(lam1 - (-1 / 3)) < 1e-10, `lam1=${lam1}`);
  assert.ok(Math.abs(lam2 - (-1)) < 1e-10, `lam2=${lam2}`);
});

test('α=1 parallel nullclines: outcome = parallel', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1, a21: 1 });
  assert.strictEqual(m.outcome, 'parallel');
});

test('α=1 parallel nullclines: trajectory from (10,20) → N₁≈33.3, N₂≈66.7 ±1%', () => {
  const m    = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1, a21: 1, r1: 1, r2: 1 });
  const traj = m.trajectory([10, 20], 400, 0.5);
  const last = traj[traj.length - 1];
  // With α=1=K equal, ratio conserved: (10/30)*100 = 33.33, (20/30)*100 = 66.67
  assert.ok(Math.abs(last.N1 - 100 / 3) < 1, `N₁(t=400)=${last.N1}`);
  assert.ok(Math.abs(last.N2 - 200 / 3) < 1, `N₂(t=400)=${last.N2}`);
});

test('RK4 convergence to coexistence ±1% of N* at t=100', () => {
  const m    = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5 });
  const traj = m.trajectory([10, 10], 100, 0.2);
  const last = traj[traj.length - 1];
  const [N1s, N2s] = m.equilibrium;
  assert.ok(Math.abs(last.N1 - N1s) < 0.01 * N1s, `N₁=${last.N1}, N₁*=${N1s}`);
  assert.ok(Math.abs(last.N2 - N2s) < 0.01 * N2s, `N₂=${last.N2}, N₂*=${N2s}`);
});

// ── Bistable case: K=100, α12=α21=1.5 ──────────────────────────────────────
// den = 1 - 1.5*1.5 = -1.25; N* = (100-150)/(-1.25) = 40 each
// J = [[-0.4,-0.6],[-0.6,-0.4]]; τ=-0.8, det=-0.2, disc=1.44 → λ=+0.2 and -1

test('bistable N₁* = N₂* = 40 ±1e-10 (K=100, α=1.5)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 1.5 });
  const [N1s, N2s] = m.equilibrium;
  assert.ok(Math.abs(N1s - 40) < 1e-10, `N₁*=${N1s}`);
  assert.ok(Math.abs(N2s - 40) < 1e-10, `N₂*=${N2s}`);
});

test('bistable outcome = "bistable" (α12=α21=1.5)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 1.5 });
  assert.strictEqual(m.outcome, 'bistable');
});

test('bistable Jacobian eigenvalues = +0.2 and -1 ±1e-10', () => {
  // J = [[-0.4,-0.6],[-0.6,-0.4]]; τ=-0.8, det=-0.2, disc=1.44
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 1.5 });
  const J = m.jacobianAtEquilibrium;
  assert.ok(J !== null, 'Jacobian should exist at bistable equilibrium');
  const tau  = J[0][0] + J[1][1];
  const det  = J[0][0] * J[1][1] - J[0][1] * J[1][0];
  const disc = tau ** 2 - 4 * det;
  const lam1 = (tau + Math.sqrt(disc)) / 2;
  const lam2 = (tau - Math.sqrt(disc)) / 2;
  // Larger eigenvalue = +0.2; smaller = -1.0
  assert.ok(Math.abs(lam1 - 0.2) < 1e-10, `lam1=${lam1}, expected 0.2`);
  assert.ok(Math.abs(lam2 - (-1)) < 1e-10, `lam2=${lam2}, expected -1`);
});

test('bistable (60,40) → sp1 wins at t=300: |N₁−100|<1e-6 and N₂<1e-6', () => {
  // Near (K1,0): N2 decays with rate r2*(1-a21*K1/K2)=1*(1-1.5)=-0.5 per unit time.
  // N2 ≈ N2_0·exp(-0.5·t) in linear regime → negligible at t=300.
  // N1 → K1=100 on timescale 1/r1 = 1.
  const m    = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 1.5 });
  const traj = m.trajectory([60, 40], 300, 0.5);
  const last = traj[traj.length - 1];
  assert.ok(Math.abs(last.N1 - 100) < 1e-6, `N₁=${last.N1} should be ≈ 100 (sp1 at K1)`);
  assert.ok(last.N2 < 1e-6,                  `N₂=${last.N2} should be < 1e-6 (sp2 excluded)`);
});

test('bistable (40,60) → sp2 wins at t=300: |N₂−100|<1e-6 and N₁<1e-6', () => {
  // Symmetric: from (40,60) sp2 wins; N2→K2=100, N1→0
  const m    = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 1.5 });
  const traj = m.trajectory([40, 60], 300, 0.5);
  const last = traj[traj.length - 1];
  assert.ok(Math.abs(last.N2 - 100) < 1e-6, `N₂=${last.N2} should be ≈ 100 (sp2 at K2)`);
  assert.ok(last.N1 < 1e-6,                  `N₁=${last.N1} should be < 1e-6 (sp1 excluded)`);
});

// ── Grid sweep: formula outcome matches long-run RK4 ───────────────────────
// For K1=K2=100 (K1/K2=1): coexistence iff α12<1 AND α21<1
// sp1-wins: α21>1, α12<1; sp2-wins: α12>1, α21<1
// Tests use deterministic non-bistable cases (RK4 outcome is unambiguous)

test('grid sweep: formula outcome matches RK4 for all deterministic α pairs', () => {
  // α ∈ {0.25,0.5,0.75,1.25,1.5,2} × same; skip bistable (α12=α21>1) which are IC-sensitive.
  // Two ICs per case: both must agree with formula outcome.
  const alphas = [0.25, 0.5, 0.75, 1.25, 1.5, 2.0];
  let count = 0;
  for (const a12 of alphas) {
    for (const a21 of alphas) {
      const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12, a21 });
      const outcome = m.outcome;
      // Skip bistable (α12·α21 > 1 and both N*>0): IC-dependent, RK4 not deterministic
      if (outcome === 'bistable' || outcome === 'parallel') continue;
      const ics = [[10, 10], [80, 20]];
      for (const ic of ics) {
        const traj = m.trajectory(ic, 250, 0.5);
        const last = traj[traj.length - 1];
        if (outcome === 'coexistence') {
          assert.ok(last.N1 > 1 && last.N2 > 1,
            `coexistence: both>1 at a12=${a12},a21=${a21}, ic=${ic}: N1=${last.N1},N2=${last.N2}`);
        } else if (outcome === 'sp1-wins') {
          assert.ok(last.N1 > 1 && last.N2 < 1,
            `sp1-wins at a12=${a12},a21=${a21}, ic=${ic}: N1=${last.N1},N2=${last.N2}`);
        } else if (outcome === 'sp2-wins') {
          assert.ok(last.N2 > 1 && last.N1 < 1,
            `sp2-wins at a12=${a12},a21=${a21}, ic=${ic}: N1=${last.N1},N2=${last.N2}`);
        }
        count++;
      }
    }
  }
  assert.ok(count > 10, `grid sweep ran ${count} IC/outcome checks`);
});

// ── dt-halving convergence ─────────────────────────────────────────────────

test('coexistence dt-halving: |N₁(10) − N₁_fine| decreases as dt halves', () => {
  // At t=100 all step sizes reach machine-precision of equilibrium — use t=10 (transient)
  // Reference: fine-step integration with dt=0.001 (4000 steps at this tMax)
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5 });
  function n1(dt) { return m.trajectory([10, 10], 10, dt).pop().N1; }
  const ref = n1(0.001);
  const e1 = Math.abs(n1(0.4) - ref);
  const e2 = Math.abs(n1(0.2) - ref);
  const e3 = Math.abs(n1(0.1) - ref);
  assert.ok(e1 > e2, `error not decreasing: e1=${e1}, e2=${e2}`);
  assert.ok(e2 > e3, `error not decreasing: e2=${e2}, e3=${e3}`);
});

// ── T-5: Jacobian eigenvalues for r1≠r2 ────────────────────────────────────
// Independent derivation in tools/anchors-phase8.mjs (T-5 section)
// K1=K2=100, a12=a21=0.5, r1=1, r2=2
// N1*=N2*=200/3; J=[[-2/3,-1/3],[-2/3,-4/3]]; τ=-2, Δ=2/3, disc=4/3
// λ = -1 ± 1/√3

test('r1≠r2: Jacobian eigenvalues = -1±1/√3 ±1e-10 (r1=1, r2=2, K=100, α=0.5)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5, r1: 1, r2: 2 });
  const J = m.jacobianAtEquilibrium;
  assert.ok(J !== null, 'Jacobian should exist');
  const tau  = J[0][0] + J[1][1];
  const det  = J[0][0] * J[1][1] - J[0][1] * J[1][0];
  const disc = tau ** 2 - 4 * det;
  const lam1 = (tau + Math.sqrt(disc)) / 2;
  const lam2 = (tau - Math.sqrt(disc)) / 2;
  const expected1 = -1 + 1 / Math.sqrt(3);   // ≈ -0.4226
  const expected2 = -1 - 1 / Math.sqrt(3);   // ≈ -1.5774
  assert.ok(Math.abs(lam1 - expected1) < 1e-10, `lam1=${lam1}, expected ${expected1}`);
  assert.ok(Math.abs(lam2 - expected2) < 1e-10, `lam2=${lam2}, expected ${expected2}`);
});

// ── outcome 'unknown' not 'undefined' (Q-5) ────────────────────────────────
// 'undefined' is truthy in JS; use 'unknown' to avoid ambiguity.

test('outcome string is "unknown" not "undefined" for unreachable path', () => {
  // N1s>0 and N2s>0 → coexistence or bistable; N2s≤0 → sp1-wins; N1s≤0 → sp2-wins
  // The only remaining case (both ≤ 0) is 'unknown'; hard to construct without NaN/Inf
  // Verify the symbol is not 'undefined' for a normal case
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5 });
  assert.notStrictEqual(m.outcome, 'undefined');
  assert.strictEqual(m.outcome, 'coexistence');
});

// ── α=0 edge cases ────────────────────────────────────────────────────────
// α21=0: sp2 not affected by sp1; nullcline2 is horizontal line N2=K2
// α12=0: sp1 not affected by sp2; nullcline1 is vertical line N1=K1

test('α21=0: nullcline2 is horizontal at K2 (no Infinity)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 80, a12: 0.5, a21: 0 });
  const nc2 = m.nullcline2();
  assert.strictEqual(nc2.type, 'horizontal');
  assert.strictEqual(nc2.value, 80);
});

test('α12=0: nullcline1 is vertical at K1 (no Infinity)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 80, a12: 0, a21: 0.5 });
  const nc1 = m.nullcline1();
  assert.strictEqual(nc1.type, 'vertical');
  assert.strictEqual(nc1.value, 100);
});

test('α12=α21=0: outcome coexistence, N1*=K1, N2*=K2 (independent species)', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 80, a12: 0, a21: 0 });
  assert.strictEqual(m.outcome, 'coexistence');
  const [N1s, N2s] = m.equilibrium;
  assert.ok(Math.abs(N1s - 100) < 1e-10, `N1*=${N1s}`);
  assert.ok(Math.abs(N2s - 80)  < 1e-10, `N2*=${N2s}`);
});

test('α21=0: trajectory → N2 converges to K2, independent of N1 ±1%', () => {
  const m = new CompetitiveExclusionModel({ K1: 100, K2: 80, a12: 0.5, a21: 0 });
  const traj = m.trajectory([50, 10], 200, 0.5);
  const last = traj[traj.length - 1];
  assert.ok(Math.abs(last.N2 - 80) < 0.8, `N2=${last.N2}, expected≈80`);
});

// ── RangeError validation ──────────────────────────────────────────────────

test('K1 ≤ 0 → RangeError', () => {
  assert.throws(() => new CompetitiveExclusionModel({ K1: 0 }),  RangeError);
  assert.throws(() => new CompetitiveExclusionModel({ K1: -1 }), RangeError);
});

test('K2 ≤ 0 → RangeError', () => {
  assert.throws(() => new CompetitiveExclusionModel({ K2: 0 }),  RangeError);
  assert.throws(() => new CompetitiveExclusionModel({ K2: -5 }), RangeError);
});

test('α < 0 → RangeError', () => {
  assert.throws(() => new CompetitiveExclusionModel({ a12: -0.1 }), RangeError);
  assert.throws(() => new CompetitiveExclusionModel({ a21: -0.1 }), RangeError);
});
