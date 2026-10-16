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

test('bistable (60,40) → sp1 wins at t=300 (N₂<1, N₁>50)', () => {
  const m    = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 1.5 });
  const traj = m.trajectory([60, 40], 300, 0.5);
  const last = traj[traj.length - 1];
  assert.ok(last.N2 < 1,  `N₂=${last.N2} should be < 1 (sp2 excluded)`);
  assert.ok(last.N1 > 50, `N₁=${last.N1} should be > 50 (sp1 dominant)`);
});

test('bistable (40,60) → sp2 wins at t=300 (N₁<1, N₂>50)', () => {
  const m    = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 1.5, a21: 1.5 });
  const traj = m.trajectory([40, 60], 300, 0.5);
  const last = traj[traj.length - 1];
  assert.ok(last.N1 < 1,  `N₁=${last.N1} should be < 1 (sp1 excluded)`);
  assert.ok(last.N2 > 50, `N₂=${last.N2} should be > 50 (sp2 dominant)`);
});

// ── Grid sweep: formula outcome matches long-run RK4 ───────────────────────
// For K1=K2=100 (K1/K2=1): coexistence iff α12<1 AND α21<1
// sp1-wins: α21>1, α12<1; sp2-wins: α12>1, α21<1
// Tests use deterministic non-bistable cases (RK4 outcome is unambiguous)

test('grid sweep: formula outcome matches RK4 for 3 deterministic cases', () => {
  // [a12, a21, expectedOutcome, IC, whichSurvives ('N1'|'N2'|'both')]
  const cases = [
    { a12: 0.5, a21: 0.5, outcome: 'coexistence', ic: [10, 10], both: true  },
    { a12: 0.5, a21: 1.5, outcome: 'sp1-wins',    ic: [10, 10], sp1: true   },
    { a12: 1.5, a21: 0.5, outcome: 'sp2-wins',    ic: [10, 10], sp2: true   },
  ];
  for (const c of cases) {
    const m = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: c.a12, a21: c.a21 });
    assert.strictEqual(m.outcome, c.outcome, `outcome mismatch for a12=${c.a12},a21=${c.a21}`);
    const traj = m.trajectory(c.ic, 200, 0.5);
    const last = traj[traj.length - 1];
    if (c.both)  assert.ok(last.N1 > 1 && last.N2 > 1, `both should survive: N1=${last.N1},N2=${last.N2}`);
    if (c.sp1)   assert.ok(last.N1 > 1 && last.N2 < 1, `sp1 should win: N1=${last.N1},N2=${last.N2}`);
    if (c.sp2)   assert.ok(last.N2 > 1 && last.N1 < 1, `sp2 should win: N1=${last.N1},N2=${last.N2}`);
  }
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
