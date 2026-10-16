/**
 * RandomWalkModel — symmetric random walks on ℤ and ℤ².
 *
 * 1D walk: ξᵢ ∈ {−1, +1}, equal probability.
 *   E[Xₙ²] = n  (EXACT, by independence of steps)
 *   E[|Xₙ|] = n·C(n,n/2)/2ⁿ  (EXACT for even n)
 *   E[|Xₙ|] ≈ √(2n/π)  (ASYMPTOTIC — CLT half-normal, NOT exact)
 *
 * 2D nearest-neighbour walk: one axis moves ±1 per step (4 directions).
 *   E[r²] = n  (same as 1D per-axis; total = n since only one axis moves per step)
 *   Var(r²) = n²−n  (NOT 2n²−2n; that is the 1D formula for X²)
 *
 * Gambler's ruin: P(win) = k/N, E[T] = k·(N−k)  (both EXACT)
 */
import { Random } from '../../../../core/Random.js';

export class RandomWalkModel {
  /**
   * @param {{seed?: number}} [opts]
   */
  constructor({ seed = 42 } = {}) {
    this._rng = new Random(seed);
  }

  /**
   * 1D walk — returns position array of length n+1 (starts at 0).
   * @param {number} n  number of steps
   * @returns {number[]}
   */
  walk1D(n) {
    const pos = new Array(n + 1);
    pos[0] = 0;
    for (let i = 1; i <= n; i++) {
      pos[i] = pos[i - 1] + (this._rng.next() < 0.5 ? -1 : 1);
    }
    return pos;
  }

  /**
   * 2D nearest-neighbour walk — returns array of {x, y} length n+1.
   * @param {number} n  number of steps
   * @returns {Array<{x: number, y: number}>}
   */
  walk2D(n) {
    const pts = new Array(n + 1);
    pts[0] = { x: 0, y: 0 };
    for (let i = 1; i <= n; i++) {
      const r = this._rng.next();
      const { x, y } = pts[i - 1];
      if      (r < 0.25) pts[i] = { x: x + 1, y };
      else if (r < 0.50) pts[i] = { x: x - 1, y };
      else if (r < 0.75) pts[i] = { x, y: y + 1 };
      else               pts[i] = { x, y: y - 1 };
    }
    return pts;
  }

  /**
   * Monte Carlo estimate of E[Xₙ²] (mean squared displacement) for 1D walk.
   * @param {number} n       number of steps
   * @param {number} trials  number of independent walks
   * @returns {number}
   */
  msd(n, trials) {
    let sum = 0;
    for (let t = 0; t < trials; t++) {
      let x = 0;
      for (let i = 0; i < n; i++) x += this._rng.next() < 0.5 ? -1 : 1;
      sum += x * x;
    }
    return sum / trials;
  }

  /**
   * Monte Carlo estimate of E[r²] for 2D nearest-neighbour walk.
   * @param {number} n       number of steps
   * @param {number} trials  number of independent walks
   * @returns {number}
   */
  msd2D(n, trials) {
    let sum = 0;
    for (let t = 0; t < trials; t++) {
      let x = 0, y = 0;
      for (let i = 0; i < n; i++) {
        const r = this._rng.next();
        if      (r < 0.25) x++;
        else if (r < 0.50) x--;
        else if (r < 0.75) y++;
        else               y--;
      }
      sum += x * x + y * y;
    }
    return sum / trials;
  }

  /**
   * Gambler's ruin — closed-form exact results.
   * P(win | start k, barrier N) = k/N
   * E[steps | start k, barrier N] = k·(N−k)
   * @param {{k: number, N: number}} opts
   * @returns {{pWin: number, meanTime: number}}
   */
  gamblersRuin({ k, N }) {
    return {
      pWin:     k / N,
      meanTime: k * (N - k),
    };
  }

  /**
   * Monte Carlo estimate of P(win) for gambler's ruin.
   * @param {{k: number, N: number, trials?: number}} opts
   * @returns {number} estimated P(win)
   */
  gamblersRuinMC({ k, N, trials = 5000 }) {
    let wins = 0;
    for (let t = 0; t < trials; t++) {
      let pos = k;
      while (pos > 0 && pos < N) {
        pos += this._rng.next() < 0.5 ? -1 : 1;
      }
      if (pos === N) wins++;
    }
    return wins / trials;
  }

  /**
   * Exact E[|Xₙ|] for even n using the combinatorial formula n·C(n,n/2)/2ⁿ.
   * Uses log-sum to avoid overflow.
   * @param {number} n  must be even
   * @returns {number}
   */
  static exactAbsMean(n) {
    if (n % 2 !== 0) throw new RangeError('exactAbsMean: n must be even');
    // n · C(n, n/2) / 2^n
    // log(C(n, n/2)) = log(n!) - 2·log((n/2)!)
    // Use log-gamma for large n
    const lnComb = lgamma(n + 1) - 2 * lgamma(n / 2 + 1);
    return n * Math.exp(lnComb - n * Math.LN2);
  }

  /**
   * Asymptotic E[|Xₙ|] ≈ √(2n/π)  (CLT half-normal; NOT exact for finite n).
   * @param {number} n
   * @returns {number}
   */
  static asymptoticAbsMean(n) {
    return Math.sqrt(2 * n / Math.PI);
  }
}

/**
 * Log-gamma for positive integers: lgamma(n) = log((n-1)!)
 * Uses direct summation Σ log(k) for k=1..n-1 (integer inputs only).
 * This is exact to double precision for moderate n.
 */
function lgamma(n) {
  if (n <= 0) throw new RangeError('lgamma: n must be positive');
  if (n <= 1) return 0;  // Γ(1) = 1, log(1) = 0
  let s = 0;
  for (let k = 2; k < n; k++) s += Math.log(k);  // log(1·2·…·(n-1)) = log((n-1)!)
  return s;
}
