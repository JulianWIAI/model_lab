/**
 * BayesModel — Bayesian inference with Beta-Binomial conjugate.
 *
 * Prior: Beta(α, β)
 * Likelihood: Binomial(n, θ) with k successes
 * Posterior: Beta(α+k, β+n-k)
 */
import { RootFinding } from '../../../../core/RootFinding.js';

// ─── Special functions ────────────────────────────────────────────────────────

/**
 * ln(Γ(x)) via Lanczos approximation (g=7, n=9 coefficients).
 * Valid for x > 0.
 * @param {number} x
 * @returns {number}
 */
export function lnGamma(x) {
  if (x <= 0) throw new RangeError(`lnGamma: x must be > 0, got ${x}`);

  // Lanczos coefficients (g=7, n=9, from Numerical Recipes / public domain)
  const g = 7;
  const C = [
     0.99999999999980993,
   676.5203681218851,
  -1259.1392167224028,
   771.32342877765313,
  -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
     9.9843695780195716e-6,
     1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    // Reflection formula: Γ(x)·Γ(1-x) = π/sin(πx)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }

  x -= 1;
  let a = C[0];
  const t = x + g + 0.5;
  for (let i = 1; i < C.length; i++) a += C[i] / (x + i);

  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * ln(B(a,b)) = lnΓ(a) + lnΓ(b) - lnΓ(a+b).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function logBeta(a, b) {
  return lnGamma(a) + lnGamma(b) - lnGamma(a + b);
}

/**
 * Beta PDF: x^(a-1)·(1-x)^(b-1) / B(a,b).
 * @param {number} x in [0,1]
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function betaPDF(x, a, b) {
  if (x <= 0 || x >= 1) {
    if (a < 1 && x === 0) return Infinity;
    if (b < 1 && x === 1) return Infinity;
    return 0;
  }
  return Math.exp((a-1)*Math.log(x) + (b-1)*Math.log(1-x) - logBeta(a,b));
}

/**
 * Regularized incomplete beta function I_x(a,b) via Lentz continued fraction.
 * Uses the standard continued fraction expansion from Numerical Recipes §6.4.
 * @param {number} x in [0,1]
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function regularizedIncompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use symmetry relation for better convergence when x > (a+1)/(a+b+2)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a);
  }

  // Lentz continued fraction
  const lbeta = logBeta(a, b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta) / a;

  // Evaluate CF via modified Lentz method
  const TINY = 1e-30;
  let f = TINY;
  let C = f;
  let D = 0;

  for (let m = 0; m <= 200; m++) {
    for (let s = 0; s <= 1; s++) {
      let num;
      if (m === 0 && s === 0) {
        num = 1;
      } else if (s === 0) {
        num = m * (b - m) * x / ((a + 2*m - 1) * (a + 2*m));
      } else {
        num = -(a + m) * (a + b + m) * x / ((a + 2*m) * (a + 2*m + 1));
      }

      D = 1 + num * D;
      if (Math.abs(D) < TINY) D = TINY;
      C = 1 + num / C;
      if (Math.abs(C) < TINY) C = TINY;
      D = 1 / D;
      const delta = C * D;
      f *= delta;
      if (Math.abs(delta - 1) < 1e-14) return front * f;
    }
  }

  return front * f;
}

/**
 * Quantile (inverse CDF) of Beta(a,b) via Brent's method.
 * @param {number} p
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function betaQuantile(p, a, b) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return RootFinding.brent(
    x => regularizedIncompleteBeta(x, a, b) - p,
    1e-7, 1 - 1e-7,
    1e-10
  );
}

// ─── Model ────────────────────────────────────────────────────────────────────

export class BayesModel {
  /**
   * @param {{ alpha?: number, beta?: number, k?: number, n?: number }} opts
   *   alpha, beta: Beta prior parameters (both > 0)
   *   k: number of successes observed
   *   n: total trials
   */
  constructor({ alpha = 1, beta = 1, k = 0, n = 0 } = {}) {
    if (alpha <= 0) throw new RangeError('BayesModel: alpha must be > 0');
    if (beta <= 0)  throw new RangeError('BayesModel: beta must be > 0');
    if (k < 0 || k > n) throw new RangeError('BayesModel: need 0 <= k <= n');
    this.alpha = alpha;
    this.beta  = beta;
    this.k = k;
    this.n = n;
  }

  /** Posterior parameters {a, b} = {alpha+k, beta+n-k} */
  posteriorParams() {
    return { a: this.alpha + this.k, b: this.beta + this.n - this.k };
  }

  /** E[θ | data] = (α+k) / (α+β+n) */
  posteriorMean() {
    const { a, b } = this.posteriorParams();
    return a / (a + b);
  }

  /** Var[θ | data] = (α+k)(β+n-k) / [(α+β+n)²(α+β+n+1)] */
  posteriorVariance() {
    const { a, b } = this.posteriorParams();
    const s = a + b;
    return (a * b) / (s * s * (s + 1));
  }

  /**
   * Credible interval at given level.
   * @param {number} [level=0.95]
   * @returns {[number, number]}
   */
  credibleInterval(level = 0.95) {
    const { a, b } = this.posteriorParams();
    const lo = betaQuantile((1 - level) / 2, a, b);
    const hi = betaQuantile((1 + level) / 2, a, b);
    return [lo, hi];
  }

  /**
   * Prior PDF curve.
   * @param {number} [nPoints=200]
   * @returns {{ x: number, pdf: number }[]}
   */
  priorCurve(nPoints = 200) {
    return _betaCurve(this.alpha, this.beta, nPoints);
  }

  /**
   * Posterior PDF curve.
   * @param {number} [nPoints=200]
   * @returns {{ x: number, pdf: number }[]}
   */
  posteriorCurve(nPoints = 200) {
    const { a, b } = this.posteriorParams();
    return _betaCurve(a, b, nPoints);
  }
}

function _betaCurve(a, b, nPoints) {
  // For alpha<1: density→∞ at x=0; plot from 0.001 to 0.999
  const xMin = (a < 1 || b < 1) ? 0.001 : 0;
  const xMax = (a < 1 || b < 1) ? 0.999 : 1;
  const pts = [];
  for (let i = 0; i < nPoints; i++) {
    const x = xMin + (xMax - xMin) * i / (nPoints - 1);
    const pdf = betaPDF(x, a, b);
    pts.push({ x, pdf: Math.min(pdf, 1e6) }); // clamp for display
  }
  return pts;
}
