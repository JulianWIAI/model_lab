/**
 * LogisticMapModel — discrete logistic map x_{n+1} = r·x·(1−x).
 *
 * Fixed point (non-trivial): x* = 1 − 1/r
 * Stability: |f'(x*)| = |2−r| < 1 iff 1 < r < 3
 *
 * Period-2 cycle (3 < r < 1+√6 ≈ 3.449490):
 *   x_{A,B} = [(r+1) ± √((r−3)(r+1))] / (2r)
 *
 * Period-4 onset (pitchfork of period-2): r = 1+√6 ≈ 3.449490
 *
 * Superstable parameter R_n (period-2^(n-1) orbit passes through x=½):
 *   R_1 = 1+√5 (exact root of r³−4r²+8=0) ≈ 3.236068
 *   R_2 ≈ 3.498562 (found by Brent on f^4(½)=½)
 *   R_3 ≈ 3.554641 (found by Brent on f^8(½)=½)
 *
 * Feigenbaum 3-iterate ratio: (R2−R1)/(R3−R2) ≈ 4.6808
 * (asymptotic δ = 4.6692; 3-iterate is a finite approximation)
 *
 * Lyapunov exponent: λ = (1/N)·Σ ln|r(1−2x_n)|
 *   At r=4: λ = ln2 (exact; invariant density 1/(π√(x(1−x))))
 *   Var(ln|f'|) at r=4 ≈ 0.8225; SE ≈ 9.07e-4 for N=1e6; 4×SE ≈ 3.63e-3
 *
 * Period-3 window begins at r = 1+2√2 ≈ 3.828427
 * r > 4: x leaves [0,1] — "outside domain" state
 *
 * Reference: May (1976) Nature 261:459; Feigenbaum (1978) J.Stat.Phys. 19:25.
 * Status: formulas anchor-derived; δ and r_∞ cited, not fetched.
 */
import { RootFinding } from '../../../../core/RootFinding.js';

export class LogisticMapModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.r=3.5]    growth parameter
   * @param {number} [opts.x0=0.5]   initial condition
   * @param {number} [opts.N=1000]   number of iterations for Lyapunov
   */
  constructor({ r = 3.5, x0 = 0.5, N = 1000 } = {}) {
    this.r = r;
    this.x0 = x0;
    this.N = N;
  }

  /** One step of the map: x_{n+1} = r·x·(1−x) */
  step(x) { return this.r * x * (1 - x); }

  /** Non-trivial fixed point x* = 1 − 1/r (valid for r > 1) */
  get fixedPoint() { return 1 - 1 / this.r; }

  /** |f'(x*)| = |2 − r|; stable iff < 1, i.e. 1 < r < 3 */
  get fixedPointStable() { return Math.abs(2 - this.r) < 1; }

  /**
   * Period-2 cycle points for 3 < r < 1+√6.
   * @returns {{ xA: number, xB: number } | null}
   */
  period2Points() {
    const { r } = this;
    const disc = (r - 3) * (r + 1);
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    return {
      xA: (r + 1 + sq) / (2 * r),
      xB: (r + 1 - sq) / (2 * r),
    };
  }

  /**
   * Iterate the map for n steps from x0 and return all values.
   * Returns null for each x that leaves [0,1] (r > 4 domain exit).
   * @param {number} n
   * @param {number} [x0]
   * @returns {(number|null)[]}
   */
  iterate(n, x0 = this.x0) {
    const xs = [x0];
    let x = x0;
    for (let i = 0; i < n; i++) {
      x = this.step(x);
      if (x < 0 || x > 1) {
        xs.push(null);
        break;
      }
      xs.push(x);
    }
    return xs;
  }

  /**
   * Lyapunov exponent: λ = (1/N)·Σ ln|r(1−2x_n)|
   * Skips first 200 transient steps.
   * @param {number} [N]  number of iterates (default this.N)
   * @param {number} [x0]
   * @returns {number} Lyapunov exponent
   */
  lyapunov(N = this.N, x0 = this.x0) {
    let x = x0;
    // Burn-in
    for (let i = 0; i < 200; i++) x = this.step(x);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < N; i++) {
      const deriv = Math.abs(this.r * (1 - 2 * x));
      if (deriv > 0) sum += Math.log(deriv);
      x = this.step(x);
      if (x < 0 || x > 1) break;
      count++;
    }
    return count > 0 ? sum / count : NaN;
  }

  /**
   * Bifurcation diagram data: for each r value in [rMin, rMax],
   * iterate transient then collect nPlot points.
   * @param {number} rMin
   * @param {number} rMax
   * @param {number} nR      number of r values
   * @param {number} nTransient
   * @param {number} nPlot
   * @returns {{ r: number, x: number }[]}
   */
  bifurcationData(rMin = 2.5, rMax = 4, nR = 500, nTransient = 1000, nPlot = 200) {
    const pts = [];
    const dr = (rMax - rMin) / nR;
    for (let i = 0; i <= nR; i++) {
      const r = rMin + i * dr;
      let x = 0.5;
      for (let j = 0; j < nTransient; j++) x = r * x * (1 - x);
      for (let j = 0; j < nPlot; j++) {
        x = r * x * (1 - x);
        if (x < 0 || x > 1) break;
        pts.push({ r, x });
      }
    }
    return pts;
  }

  /**
   * Find superstable parameter R_n: solve f^(2^n)(½) = ½ via Brent.
   * @param {number} n  1, 2, 3, ...
   * @param {number} [rLo]  search bracket low
   * @param {number} [rHi]  search bracket high
   * @returns {number}
   */
  static superstableR(n, rLo, rHi) {
    const period = Math.pow(2, n);
    const f = (r) => {
      let x = 0.5;
      for (let i = 0; i < period; i++) x = r * x * (1 - x);
      return x - 0.5;
    };
    return RootFinding.brent(f, rLo, rHi, 1e-10);
  }
}
