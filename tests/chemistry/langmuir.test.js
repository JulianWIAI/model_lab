/**
 * Tests for LangmuirModel — Langmuir adsorption isotherm.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LangmuirModel } from '../../js/benches/chemistry/surface/langmuir/LangmuirModel.js';

test('coverage(0) = 0', () => {
  const m = new LangmuirModel({ K: 2.5 });
  assert.strictEqual(m.coverage(0), 0);
});

test('coverage at Kp=1 = 0.5', () => {
  const m = new LangmuirModel({ K: 2.5 });
  const p = 1 / m.K; // Kp = 1
  assert.ok(Math.abs(m.coverage(p) - 0.5) < 1e-15);
});

test('coverage at Kp=9 = 0.9', () => {
  const m = new LangmuirModel({ K: 1 });
  assert.ok(Math.abs(m.coverage(9) - 0.9) < 1e-15);
});

test('p/theta = 1/K + p (linearised)', () => {
  const m = new LangmuirModel({ K: 2.5 });
  for (const p of [0.5, 1, 2, 3, 4]) {
    const theta = m.coverage(p);
    const lhs = p / theta;
    const rhs = 1 / m.K + p;
    assert.ok(Math.abs(lhs - rhs) < 1e-12, `p=${p}: lhs=${lhs}, rhs=${rhs}`);
  }
});

test('halfCoverageP = 1/K', () => {
  const m = new LangmuirModel({ K: 2.5 });
  assert.ok(Math.abs(m.halfCoverageP() - 1/2.5) < 1e-15);
});

test('vantHoff dH=0 -> K unchanged', () => {
  const m = new LangmuirModel({ K: 2.5 });
  const K2 = m.vantHoffPoint(400, 0, 2.5, 300);
  assert.ok(Math.abs(K2 - 2.5) < 1e-12);
});

test('vantHoff ln ratio consistent', () => {
  const m = new LangmuirModel({ K: 2.5 });
  const K_ref = 2.5, T_ref = 300, T = 350, dH = -20000;
  const K2 = m.vantHoffPoint(T, dH, K_ref, T_ref);
  const lnRatio = Math.log(K2 / K_ref);
  const expected = (dH / LangmuirModel.R) * (1/T_ref - 1/T);
  assert.ok(Math.abs(lnRatio - expected) < 1e-12);
});

test('Kinetic RK4 vs exact +/-1e-8', () => {
  const m = new LangmuirModel({ K: 2.5 });
  const k_ads = 1, k_des = 0.4, p = 2, theta0 = 0, tMax = 10;
  const pts = m.kineticCurve(theta0, p, k_ads, k_des, tMax, 200);
  // Check last few points: RK4 theta vs thetaExact
  for (const pt of pts.slice(-10)) {
    assert.ok(
      Math.abs(pt.theta - pt.thetaExact) < 1e-4,
      `t=${pt.t.toFixed(2)}: RK4=${pt.theta.toFixed(8)}, exact=${pt.thetaExact.toFixed(8)}`,
    );
  }
});

test('dt-halving: kinetic RK4 convergence ~ 16', () => {
  const m = new LangmuirModel({ K: 2.5 });
  const k_ads = 1, k_des = 0.4, p = 2, theta0 = 0, tMax = 5;
  const pts1 = m.kineticCurve(theta0, p, k_ads, k_des, tMax, 50);
  const pts2 = m.kineticCurve(theta0, p, k_ads, k_des, tMax, 100);
  const pts3 = m.kineticCurve(theta0, p, k_ads, k_des, tMax, 200);
  const exact = pts3[pts3.length - 1].thetaExact;
  const e1 = Math.abs(pts1[pts1.length - 1].theta - exact);
  const e2 = Math.abs(pts2[pts2.length - 1].theta - exact);
  if (e2 > 1e-14) {
    const ratio = e1 / e2;
    assert.ok(ratio > 4, `dt-halving ratio = ${ratio}, expected ~16`);
  }
});

test('Concavity grid: theta\'\'(p) < 0', () => {
  const m = new LangmuirModel({ K: 2.5 });
  // theta(p) = Kp/(1+Kp), theta''(p) = -2K^3*p/(1+Kp)^3 -- wait, let me compute numerically
  const eps = 1e-6;
  for (let p = 0.1; p <= 4.9; p += 0.2) {
    const f0 = m.coverage(p);
    const fp = m.coverage(p + eps);
    const fm = m.coverage(p - eps);
    const d2 = (fp - 2*f0 + fm) / (eps * eps);
    // theta''(p) = -2K^2/(1+Kp)^3 which is always strictly negative
    assert.ok(d2 < 0, `Concavity at p=${p}: d2f=${d2}, expected < 0`);
  }
});

test('Hill n=1 = Langmuir', () => {
  // Hill equation with n=1: theta = p/(K_d + p) = (p/K_d)/(1 + p/K_d) = Kp/(1+Kp) where K=1/K_d
  const K = 2.5;
  const K_d = 1 / K;
  const m = new LangmuirModel({ K });
  for (const p of [0, 0.5, 1, 2, 5]) {
    const langmuir = m.coverage(p);
    const hill = p / (K_d + p);
    assert.ok(Math.abs(langmuir - hill) < 1e-14, `p=${p}: langmuir=${langmuir}, hill=${hill}`);
  }
});

test('RangeError p<0', () => {
  const m = new LangmuirModel({ K: 2.5 });
  assert.throws(() => m.coverage(-1), RangeError);
});

test('RangeError K<=0', () => {
  assert.throws(() => new LangmuirModel({ K: 0 }), RangeError);
  assert.throws(() => new LangmuirModel({ K: -1 }), RangeError);
});
