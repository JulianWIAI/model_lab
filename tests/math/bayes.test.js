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

  it('posteriorVariance Beta(3,5): Simpson numerical integration ±1e-6', () => {
    // Beta(3,5): a=3, b=5; exact variance = a·b/((a+b)²·(a+b+1)) = 15/576 ≈ 0.026042
    // Numerical check via Simpson's 1/3 rule on Var = E[X²] - (E[X])²
    // f(x) = x^(a-1)·(1-x)^(b-1) / B(a,b) = 15·x²·(1-x)⁴   [B(3,5)=1/15]
    // B(3,5) = Γ(3)Γ(5)/Γ(8) = 2·24/5040 = 48/5040 = 1/105  — recheck:
    //   Γ(3)=2, Γ(5)=24, Γ(8)=5040 → B(3,5)=2·24/5040=1/105
    //   f(x) = 105·x²·(1-x)⁴
    // E[X²] = ∫₀¹ x²·f(x)dx = 105·∫₀¹ x⁴(1-x)⁴ dx
    //       = 105·B(5,5) = 105·(4!·4!/8!) = 105·576/40320 = 105/70 = 1.5  — that can't be right
    // Let me recompute: B(3,5)=Γ(3)Γ(5)/Γ(8)=2·24/5040=48/5040=1/105
    // E[X]=a/(a+b)=3/8; E[X²]=B(5,5)/B(3,5)? No: E[X^k]=B(a+k,b)/B(a,b)
    // E[X²] = B(5,5)/B(3,5) = [Γ(5)Γ(5)/Γ(10)] / [Γ(3)Γ(5)/Γ(8)]
    //       = [24·24/362880] / [2·24/5040] = (576/362880)/(48/5040) = (1/630)/(1/105) = 105/630 = 1/6
    // Var = 1/6 - (3/8)² = 1/6 - 9/64 = 64/384 - 54/384 = 10/384 = 5/192 ≈ 0.026042  ✓
    const expected = 5 / 192; // exact: a*b/((a+b)^2*(a+b+1)) = 15/(64*9) = 15/576 = 5/192
    const N = 2000;
    const h = 1 / N;
    // B(3,5) = 1/105; pdf = 105·x²·(1-x)⁴
    const pdf = x => 105 * x * x * Math.pow(1 - x, 4);
    const meanX = 3 / 8;
    // Simpson: Var = E[X²] - mean² = ∫ x²·pdf dx - (3/8)²
    let EX2 = 0;
    for (let i = 0; i <= N; i++) {
      const x = i * h;
      const w = (i === 0 || i === N) ? 1 : (i % 2 === 0 ? 2 : 4);
      EX2 += w * x * x * pdf(x);
    }
    EX2 *= h / 3;
    const numVar = EX2 - meanX * meanX;
    assertClose(numVar, expected, 1e-6, 'Beta(3,5) variance via Simpson');
    // Also check the model method agrees with the exact value
    const m = new BayesModel({ alpha: 3, beta: 5, k: 0, n: 0 });
    assertClose(m.posteriorVariance(), expected, 1e-10, 'posteriorVariance model vs exact');
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
