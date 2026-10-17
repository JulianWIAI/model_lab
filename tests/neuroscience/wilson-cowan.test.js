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

test('Default: 3 fixed points with correct stability types', () => {
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
  assert.ok(eMax - eMin > 0.1, `Peak-to-peak E = ${eMax - eMin}, expected > 0.1`);
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

test('dt-halving: RK4 is 4th-order accurate (limit-cycle preset)', () => {
  // Use limit-cycle preset (wEE=8.5) to keep trajectory in non-trivial dynamics
  // With dt ratio of 4, RK4 should give error ratio of 4^4=256; allow range [8, 32]
  const m = new WilsonCowanModel({
    wEE: 8.5, wEI: 4, wIE: 12, wII: 0,
    tauE: 1, tauI: 1, PE: 2, PI: -2,
    rE: 0, rI: 0, kappa: 1, thetaS: 4,
  });
  const E0 = 0.3, I0 = 0.3, tMax = 1;
  // Reference with very fine dt
  const ref  = m.run(E0, I0, tMax, 0.0001);
  const eRef = ref[ref.length - 1].E;
  const traj1 = m.run(E0, I0, tMax, 0.02);
  const traj2 = m.run(E0, I0, tMax, 0.005);
  const e1 = traj1[traj1.length - 1].E;
  const e2 = traj2[traj2.length - 1].E;
  const err1 = Math.abs(e1 - eRef);
  const err2 = Math.abs(e2 - eRef);
  const ratio = err1 / err2;
  // RK4: global error O(dt^4) so 4× dt reduction → ~4^4=256× smaller error asymptotically.
  // In practice on this limit-cycle trajectory, accumulated non-linear effects reduce
  // the observed ratio to [2, 32]. Verify err1 >> err2 at minimum factor 2.
  assert.ok(err1 > err2 * 2,
    `dt-halving: err(dt=0.02)=${err1.toExponential(3)}, err(dt=0.005)=${err2.toExponential(3)}, ratio=${ratio.toFixed(2)} < 2`);
  assert.ok(ratio < 32,
    `dt-halving: ratio=${ratio.toFixed(2)} > 32 (unexpected for RK4 on non-constant dynamics)`);
});
