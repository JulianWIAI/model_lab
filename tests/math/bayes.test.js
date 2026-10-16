/**
 * tests/math/bayes.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BayesModel,
  lnGamma, logBeta, regularizedIncompleteBeta, betaQuantile,
} from '../../js/benches/math/probability/bayes/BayesModel.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

describe('BayesModel', () => {
  it('posteriorMean α=β=1, k=7, n=10 = 2/3 ±1e-10', () => {
    const m = new BayesModel({ alpha: 1, beta: 1, k: 7, n: 10 });
    assertClose(m.posteriorMean(), 2/3, 1e-10, 'posteriorMean');
  });

  it('Laplace rule: posteriorMean α=β=1 = (k+1)/(n+2) ±1e-10', () => {
    for (const [k, n] of [[3,5],[0,10],[10,10]]) {
      const m = new BayesModel({ alpha: 1, beta: 1, k, n });
      assertClose(m.posteriorMean(), (k+1)/(n+2), 1e-10, `k=${k},n=${n}`);
    }
  });

  it('posteriorParams() = {a: α+k, b: β+n-k}', () => {
    const m = new BayesModel({ alpha: 2, beta: 3, k: 4, n: 7 });
    const { a, b } = m.posteriorParams();
    assert.strictEqual(a, 6);
    assert.strictEqual(b, 6);
  });

  it('posteriorVariance formula ±1e-10', () => {
    const m = new BayesModel({ alpha: 1, beta: 1, k: 7, n: 10 });
    const { a, b } = m.posteriorParams();
    const s = a + b;
    const expected = (a * b) / (s * s * (s + 1));
    assertClose(m.posteriorVariance(), expected, 1e-10, 'posteriorVariance');
  });

  it('Γ(1/2) = √π: exp(lnGamma(0.5)) ±1e-6', () => {
    assertClose(Math.exp(lnGamma(0.5)), Math.sqrt(Math.PI), 1e-6, 'Γ(½)');
  });

  it('B(2,3) = 1/12: exp(logBeta(2,3)) ±1e-10', () => {
    assertClose(Math.exp(logBeta(2, 3)), 1/12, 1e-10, 'B(2,3)');
  });

  it('Beta(2,2) CDF at x=0.5 = 0.5 ±1e-8', () => {
    // I_{0.5}(2,2) = 3*(0.5)^2 - 2*(0.5)^3 = 0.5
    assertClose(regularizedIncompleteBeta(0.5, 2, 2), 0.5, 1e-8, 'I_{0.5}(2,2)');
  });

  it('Beta(1,1) 95% CI = [0.025, 0.975] ±1e-4', () => {
    const m = new BayesModel({ alpha: 1, beta: 1, k: 0, n: 0 });
    const [lo, hi] = m.credibleInterval(0.95);
    assertClose(lo, 0.025, 1e-4, '95% CI lower');
    assertClose(hi, 0.975, 1e-4, '95% CI upper');
  });

  it('Beta(a,a) median = 0.5 ±1e-4 for a=2,3', () => {
    for (const a of [2, 3]) {
      const m = new BayesModel({ alpha: a, beta: a, k: 0, n: 0 });
      const [lo, hi] = m.credibleInterval(0.50);
      const median = (lo + hi) / 2;  // approximately
      // Better: betaQuantile(0.5, a, a) should = 0.5
      const med = betaQuantile(0.5, a, a);
      assertClose(med, 0.5, 1e-4, `Beta(${a},${a}) median`);
    }
  });

  it('Large n: posteriorMean(α=1,β=1,k=50,n=100) ≈ 0.5 (within 0.01)', () => {
    const m = new BayesModel({ alpha: 1, beta: 1, k: 50, n: 100 });
    assertClose(m.posteriorMean(), 0.5, 0.01, 'large n');
  });

  it('I_{0.3}(2,3) via binomial tail = 0.3483 ±1e-6', () => {
    // I_x(2,3) = C(4,2)*0.3^2*0.7^2 + C(4,3)*0.3^3*0.7 + C(4,4)*0.3^4
    // = 6*0.09*0.49 + 4*0.027*0.7 + 1*0.0081
    // = 0.2646 + 0.0756 + 0.0081 = 0.3483
    assertClose(regularizedIncompleteBeta(0.3, 2, 3), 0.3483, 1e-6, 'I_{0.3}(2,3)');
  });
});
