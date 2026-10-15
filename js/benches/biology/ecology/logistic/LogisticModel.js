/**
 * LogisticModel — logistic population growth.
 *
 * Closed-form solution:
 *   N(t) = K / (1 + ((K − N₀)/N₀) · exp(−r·t))
 *
 * Differential equation (for phase portrait):
 *   dN/dt = r·N·(1 − N/K)     [parabola in N, peak at N = K/2]
 *
 * Steepest growth at N = K/2:
 *   (dN/dt)_max = r·K/4
 *
 * Time to reach K/2 from N₀ < K/2:
 *   t_half = ln((K − N₀)/N₀) / r
 *
 * Reference: Verhulst (1845); standard textbook derivation — no uncertain constants.
 */
export class LogisticModel {
  constructor({ N0 = 10, r = 0.3, K = 1000 } = {}) {
    this.N0 = N0;
    this.r  = r;
    this.K  = K;
  }

  N(t) {
    const ratio = (this.K - this.N0) / this.N0;
    return this.K / (1 + ratio * Math.exp(-this.r * t));
  }

  dNdt(N) { return this.r * N * (1 - N / this.K); }

  get tHalf() {
    if (this.N0 >= this.K / 2) return null;
    return Math.log((this.K - this.N0) / this.N0) / this.r;
  }

  curve(tMax, nPoints = 300) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const t = tMax * i / (nPoints - 1);
      const Nv = this.N(t);
      pts.push({ t, N: Nv, dNdt: this.dNdt(Nv) });
    }
    return pts;
  }
}
