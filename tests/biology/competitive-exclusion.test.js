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
