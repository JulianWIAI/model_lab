/**
 * Tests for WilsonCowanModel — excitatory-inhibitory neural population dynamics.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WilsonCowanModel } from '../../js/benches/neuroscience/networks/wilson-cowan/WilsonCowanModel.js';

test('S(thetaS) = 0.5 when kappa=1', () => {
  const m = new WilsonCowanModel({ kappa: 1, thetaS: 0 });
  assert.ok(Math.abs(m.sigmoid(0) - 0.5) < 1e-15);
});

test('S\'(x) = kappa*S(x)*(1-S(x))', () => {
  const m = new WilsonCowanModel({ kappa: 1, thetaS: 4 });
  for (const x of [-2, 0, 4, 8, 12]) {
    const s = m.sigmoid(x);
    const sp = m.sigmoidPrime(x);
    assert.ok(Math.abs(sp - m.kappa * s * (1-s)) < 1e-14, `at x=${x}`);
  }
});

test('Default: 3 fixed points with correct stability types AND positions', () => {
  const m = new WilsonCowanModel();
  const fps = m.fixedPoints();
  assert.ok(fps.length >= 3, `Expected >=3 FPs, got ${fps.length}`);
  // Check residuals
  for (const fp of fps) {
    assert.ok(Math.abs(m.dEdt(fp.E, fp.I)) < 1e-8, `dEdt residual at (${fp.E},${fp.I})`);
    assert.ok(Math.abs(m.dIdt(fp.E, fp.I)) < 1e-8, `dIdt residual at (${fp.E},${fp.I})`);
  }
  // Sort by E
  fps.sort((a, b) => a.E - b.E);
  const types = fps.map(fp => m.stability(fp.E, fp.I).type);
  assert.ok(types.includes('stable-node') || types.includes('stable-spiral'));
  assert.ok(types.includes('saddle'));
  // FP found by Newton's method with tolerance ~1e-12 (loop breaks when |f1|,|f2| < 1e-12);
  // position accurate to ~1e-9 after convergence. Assert ±1e-6 (1000× safety margin).
  const tol = 1e-6;
  // FP0: stable-node near (0.00254, 0.000568)
  assert.ok(Math.abs(fps[0].E - 0.00254328616) < tol, `FP0.E=${fps[0].E}`);
  assert.ok(Math.abs(fps[0].I - 0.00056779451) < tol, `FP0.I=${fps[0].I}`);
  // FP1: saddle near (0.57793, 0.15521)
  assert.ok(Math.abs(fps[1].E - 0.57792622164) < tol, `FP1.E=${fps[1].E}`);
  assert.ok(Math.abs(fps[1].I - 0.15521214309) < tol, `FP1.I=${fps[1].I}`);
  // FP2: stable-node near (0.97846, 0.48134)
  assert.ok(Math.abs(fps[2].E - 0.97846294245) < tol, `FP2.E=${fps[2].E}`);
  assert.ok(Math.abs(fps[2].I - 0.48133686338) < tol, `FP2.I=${fps[2].I}`);
});

test('RK4 convergence to stable FP: |err|<1e-8 at t=50', () => {
  const m = new WilsonCowanModel();
  const fps = m.fixedPoints().sort((a,b) => a.E - b.E);
  // Find a stable fixed point
  const stableFP = fps.find(fp => {
    const s = m.stability(fp.E, fp.I);
    return s.type === 'stable-node' || s.type === 'stable-spiral';
  });
  assert.ok(stableFP, 'No stable FP found');
  // Start near the stable FP
  const traj = m.run(stableFP.E + 0.01, stableFP.I + 0.01, 50);
  const last = traj[traj.length - 1];
  assert.ok(Math.abs(last.E - stableFP.E) < 1e-4, `E converged: ${last.E} vs ${stableFP.E}`);
  assert.ok(Math.abs(last.I - stableFP.I) < 1e-4, `I converged: ${last.I} vs ${stableFP.I}`);
});

test('Saddle test: perturbation grows > 0.1', () => {
  const m = new WilsonCowanModel();
  const fps = m.fixedPoints().sort((a,b) => a.E - b.E);
  const saddleFP = fps.find(fp => m.stability(fp.E, fp.I).type === 'saddle');
  assert.ok(saddleFP, 'No saddle found');
  // Perturb along some direction
  const traj = m.run(saddleFP.E + 0.01, saddleFP.I, 20);
  const last = traj[traj.length - 1];
  const dist = Math.hypot(last.E - saddleFP.E, last.I - saddleFP.I);
  assert.ok(dist > 0.1, `Distance from saddle = ${dist}, expected > 0.1`);
});

test('Saddle instability: perturbation along unstable eigenvector grows exponentially', () => {
  // For default params, saddle at ~(0.578, 0.155), λ₊ ≈ 1.506.
  // Perturb ε=0.001 along unstable eigenvector v₊; after t=0.1:
  //   expected distance = ε·e^{λ₊·t} ≈ 0.001·e^{1.506·0.1} ≈ 0.001·1.1626 ≈ 1.163e-3.
  // Assert actual deviation > 0.5×expected (50% lower bound, ~3× SE equivalent).
  // Assert actual deviation < 2.0×expected (upper bound for nonlinear corrections).
  const m = new WilsonCowanModel();
  const fps = m.fixedPoints().sort((a,b) => a.E - b.E);
  const fp = fps.find(fp => m.stability(fp.E, fp.I).type === 'saddle');
  assert.ok(fp, 'No saddle found');
  const J = m.jacobian(fp.E, fp.I);
  const tr = J[0][0]+J[1][1], det = J[0][0]*J[1][1]-J[0][1]*J[1][0];
  const disc = tr*tr - 4*det;
  const lam_plus = (tr + Math.sqrt(disc)) / 2;
  // Unstable eigenvector: (J - λ+·I)v = 0 → vx = J[0][1], vy = -(J[0][0]-λ+)
  const vx0 = J[0][1], vy0 = -(J[0][0] - lam_plus);
  const norm = Math.hypot(vx0, vy0);
  const vx = vx0 / norm, vy = vy0 / norm;
  const eps = 0.001, t_test = 0.1;
  const traj = m.run(fp.E + eps * vx, fp.I + eps * vy, t_test, 0.001);
  const last = traj[traj.length - 1];
  const dist = Math.hypot(last.E - fp.E, last.I - fp.I);
  const expected = eps * Math.exp(lam_plus * t_test);
  // Allow ±50% tolerance for non-linear corrections
  assert.ok(dist > expected * 0.5,
    `dist=${dist.toExponential(4)}, expected>${(expected*0.5).toExponential(4)}`);
  assert.ok(dist < expected * 2.0,
    `dist=${dist.toExponential(4)}, expected<${(expected*2.0).toExponential(4)}`);
});

test('FD Jacobian vs analytic +/-1e-8', () => {
  const m = new WilsonCowanModel({ rE: 0.1, rI: 0.1 });
  const E = 0.4, I = 0.2;
  const J = m.jacobian(E, I);
  const eps = 1e-6;
  // Finite difference
  const dEdt_Ep = m.dEdt(E + eps, I);
  const dEdt_Em = m.dEdt(E - eps, I);
  const dEdt_Ip = m.dEdt(E, I + eps);
  const dEdt_Im = m.dEdt(E, I - eps);
  const dIdt_Ep = m.dIdt(E + eps, I);
  const dIdt_Em = m.dIdt(E - eps, I);
  const dIdt_Ip = m.dIdt(E, I + eps);
  const dIdt_Im = m.dIdt(E, I - eps);
  const JFD = [
    [(dEdt_Ep - dEdt_Em) / (2*eps), (dEdt_Ip - dEdt_Im) / (2*eps)],
    [(dIdt_Ep - dIdt_Em) / (2*eps), (dIdt_Ip - dIdt_Im) / (2*eps)],
  ];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      assert.ok(Math.abs(J[i][j] - JFD[i][j]) < 1e-6, `J[${i}][${j}]: analytic=${J[i][j]}, FD=${JFD[i][j]}`);
});

test('Hopf point: tr=0, det=2 +/-1e-10', () => {
  const m = new WilsonCowanModel({
    wEE: 8, wEI: 4, wIE: 12, wII: 0,
    tauE: 1, tauI: 1, PE: 2, PI: -2,
    rE: 0, rI: 0, kappa: 1, thetaS: 4,
  });
  const fps = m.fixedPoints();
  // Find the FP near (0.5, 0.5)
  const fp = fps.find(p => Math.abs(p.E - 0.5) < 0.01 && Math.abs(p.I - 0.5) < 0.01);
  assert.ok(fp, `No FP near (0.5,0.5), fps=${JSON.stringify(fps)}`);
  const s = m.stability(fp.E, fp.I);
  const J = m.jacobian(fp.E, fp.I);
  const tr = J[0][0] + J[1][1];
  const det = J[0][0]*J[1][1] - J[0][1]*J[1][0];
  assert.ok(Math.abs(tr) < 1e-10, `Hopf tr=${tr}, expected 0`);
  assert.ok(Math.abs(det - 2) < 1e-10, `Hopf det=${det}, expected 2`);
});

test('Limit cycle (wEE=8.5): tr>0, peak-to-peak > 0.1', () => {
  const m = new WilsonCowanModel({
    wEE: 8.5, wEI: 4, wIE: 12, wII: 0,
    tauE: 1, tauI: 1, PE: 2, PI: -2,
    rE: 0, rI: 0, kappa: 1, thetaS: 4,
  });
  const fps = m.fixedPoints();
  const fp = fps.find(p => Math.abs(p.E - 0.5) < 0.1);
  assert.ok(fp, 'No FP found for limit cycle preset');
  const J = m.jacobian(fp.E, fp.I);
  const tr = J[0][0] + J[1][1];
  assert.ok(tr > 0, `Limit cycle tr=${tr}, expected > 0`);
  // Run and check oscillation
  const traj = m.run(0.3, 0.3, 100, 0.01);
  const lastHalf = traj.slice(traj.length / 2);
  const eVals = lastHalf.map(p => p.E);
  const eMin = Math.min(...eVals);
  const eMax = Math.max(...eVals);
  // Measured limit-cycle amplitude ~0.289; assert in [0.2, 0.4]
  assert.ok(eMax - eMin > 0.2, `Peak-to-peak E = ${eMax - eMin}, expected > 0.2`);
  assert.ok(eMax - eMin < 0.4, `Peak-to-peak E = ${eMax - eMin}, expected < 0.4`);
});

test('nullclineI with wII=0: direct sigmoid computation', () => {
  // When wII=0, inhibitory nullcline is I = S(wIE*E + PI) directly (no bisection needed)
  const m = new WilsonCowanModel({
    wEE: 8.5, wEI: 4, wIE: 12, wII: 0,
    tauE: 1, tauI: 1, PE: 2, PI: -2,
    rE: 0, rI: 0, kappa: 1, thetaS: 4,
  });
  const ncI = m.nullclineI(10);
  assert.ok(ncI.length > 0, 'nullclineI should return points');
  // Verify: at each E, dIdt(E, I) ≈ 0
  for (const { E, I } of ncI) {
    if (E > 0.01 && E < 0.99) {
      assert.ok(Math.abs(m.dIdt(E, I)) < 1e-5, `I-nullcline residual at E=${E.toFixed(3)}: ${m.dIdt(E, I)}`);
    }
  }
});

test('stability: hopf-point type when tr ≈ 0 and det > 0', () => {
  // Use Hopf preset exactly at tr=0 to trigger hopf-point branch
  const m = new WilsonCowanModel({
    wEE: 8, wEI: 4, wIE: 12, wII: 0,
    tauE: 1, tauI: 1, PE: 2, PI: -2,
    rE: 0, rI: 0, kappa: 1, thetaS: 4,
  });
  const fps = m.fixedPoints();
  const fp = fps.find(p => Math.abs(p.E - 0.5) < 0.01 && Math.abs(p.I - 0.5) < 0.01);
  assert.ok(fp, 'No FP near (0.5, 0.5) for Hopf preset');
  const s = m.stability(fp.E, fp.I);
  assert.strictEqual(s.type, 'hopf-point', `Expected hopf-point, got ${s.type}`);
});

test('Nullclines: 10 points verified +/-1e-6', () => {
  const m = new WilsonCowanModel();
  const ncE = m.nullclineE(200);
  // On the E-nullcline, dEdt = 0
  let checked = 0;
  for (let k = 0; k < ncE.length; k += Math.floor(ncE.length / 10)) {
    const { E, I } = ncE[k];
    if (E > 0.01 && E < 0.99 && I >= 0 && I <= 1) {
      const res = Math.abs(m.dEdt(E, I));
      assert.ok(res < 1e-6, `E-nullcline residual at E=${E.toFixed(4)},I=${I.toFixed(4)}: ${res}`);
      checked++;
    }
  }
  assert.ok(checked >= 5, `Only checked ${checked} E-nullcline points`);
});

test('dt-halving: RK4 is 4th-order on Hopf-point preset (ratio in [12,20])', () => {
  // Bug in previous version: run(E0,I0,tMax,dt) recorded only every 10th step, so the last
  // recorded state was at t = floor((n-1)/10)*10 + 1)*dt — different for each dt. The "error"
  // was therefore a finite-difference of the trajectory (ratio ~4 ≈ derivative ratio), not a
  // truncation error ratio.  Fix: run() now also records the final step (k===n-1), so all
  // three runs end at the same physical time T_end regardless of step size.
  //
  // Hopf-point preset: wEE=8, tr=0, det=2, ω=√2; period 2π/√2≈4.44.
  // T_end=0.5 ≈ 11% of period — short enough that nonlinear accumulation is negligible.
  // dt/2 halving: dt1=0.02→dt2=0.01; RK4 local error O(dt^5); global error O(dt^4);
  // ratio = (dt1/dt2)^4 = 2^4 = 16, expected range [12, 20].
  const m = new WilsonCowanModel({
    wEE: 8, wEI: 4, wIE: 12, wII: 0,
    tauE: 1, tauI: 1, PE: 2, PI: -2,
    rE: 0, rI: 0, kappa: 1, thetaS: 4,
  });
  const E0 = 0.45, I0 = 0.45, T_end = 0.5;
  const dt1 = 0.02, dt2 = 0.01, dtRef = 0.0001;
  const ref   = m.run(E0, I0, T_end, dtRef);
  const traj1 = m.run(E0, I0, T_end, dt1);
  const traj2 = m.run(E0, I0, T_end, dt2);
  const eRef = ref[ref.length - 1].E;
  const err1 = Math.abs(traj1[traj1.length - 1].E - eRef);
  const err2 = Math.abs(traj2[traj2.length - 1].E - eRef);
  const ratio = err1 / err2;
  assert.ok(ratio > 12 && ratio < 20,
    `RK4 dt-halving: err(dt=0.02)=${err1.toExponential(3)}, err(dt=0.01)=${err2.toExponential(3)}, ratio=${ratio.toFixed(2)} expected [12,20]`);
});
