/**
 * EnzymeKineticsModel — Michaelis–Menten enzyme kinetics with three inhibitor types.
 *
 * Apparent parameters under inhibition (Cornish-Bowden, 2012):
 *   competitive:   α·Km, Vmax unchanged       (α = 1 + [I]/Ki)
 *   uncompetitive: Km/α′, Vmax/α′             (α′ = 1 + [I]/Ki′)
 *   mixed:         α·Km/α′, Vmax/α′           (both α and α′ active)
 *
 * Levenberg–Marquardt fitting implemented directly (no external library).
 * Units: [S] in µM, v in µM/s (or any consistent pair).
 *
 * Reference: Cornish-Bowden, A. (2012). Fundamentals of Enzyme Kinetics, 4th ed.
 */
export class EnzymeKineticsModel {
  constructor({
    Vmax = 100,
    Km = 10,
    inhibitorType = 'none',
    inhibitorConc = 0,
    Ki = 10,
    Kiprime = 10,
  } = {}) {
    this.Vmax = Vmax;
    this.Km = Km;
    this.inhibitorType = inhibitorType; // 'none'|'competitive'|'uncompetitive'|'mixed'
    this.inhibitorConc = inhibitorConc;
    this.Ki = Ki;
    this.Kiprime = Kiprime;
  }

  get alpha() {
    return 1 + this.inhibitorConc / this.Ki;
  }

  get alphaPrime() {
    return 1 + this.inhibitorConc / this.Kiprime;
  }

  get apparentKm() {
    switch (this.inhibitorType) {
      case 'competitive':   return this.alpha * this.Km;
      case 'uncompetitive': return this.Km / this.alphaPrime;
      case 'mixed':         return this.alpha * this.Km / this.alphaPrime;
      default:              return this.Km;
    }
  }

  get apparentVmax() {
    switch (this.inhibitorType) {
      case 'competitive':   return this.Vmax;
      case 'uncompetitive': return this.Vmax / this.alphaPrime;
      case 'mixed':         return this.Vmax / this.alphaPrime;
      default:              return this.Vmax;
    }
  }

  /** Michaelis–Menten rate: v = Vmax_app * [S] / (Km_app + [S]) */
  v(s) {
    const Vm = this.apparentVmax;
    const Km = this.apparentKm;
    return Vm * s / (Km + s);
  }

  /** Lineweaver–Burk: 1/v = (Km_app/Vmax_app) * (1/[S]) + 1/Vmax_app */
  vLineweaver(s) {
    if (s === 0) return null;
    return { x: 1 / s, y: 1 / this.v(s) };
  }

  /** Generate noisy v-vs-S data for n substrate concentrations */
  generateData(sValues, noiseFraction = 0.05) {
    return sValues.map((s) => ({
      s,
      v: this.v(s) * (1 + (Math.random() * 2 - 1) * noiseFraction),
    }));
  }

  /**
   * Levenberg–Marquardt fitting of Michaelis–Menten to (s, v) data.
   * Returns { Km, Vmax, iterations, converged }.
   *
   * Residuals: r_i = v_i - Vmax_fit * s_i / (Km_fit + s_i)
   * Jacobian:  J_i0 = ∂r_i/∂Vmax = s_i / (Km_fit + s_i)
   *            J_i1 = ∂r_i/∂Km   = -Vmax_fit * s_i / (Km_fit + s_i)²
   */
  static fitMM(sValues, vValues) {
    const n = sValues.length;
    if (n < 2) return null;

    // Initial guess
    let Vmax = Math.max(...vValues) * 1.1;
    let Km = sValues[Math.floor(n / 2)];
    let lambda = 1e-3;
    const lambdaFactor = 10;
    const ITMAX = 200;
    const EPS = 1e-8;
    let prevCost = Infinity;
    let iterations = 0;

    for (let iter = 0; iter < ITMAX; iter++) {
      iterations = iter + 1;
      // Residuals and Jacobian
      const r = new Array(n);
      const J = new Array(n);
      for (let i = 0; i < n; i++) {
        const s = sValues[i];
        const denom = Km + s;
        r[i] = vValues[i] - Vmax * s / denom;
        J[i] = [s / denom, -Vmax * s / (denom * denom)];
      }
      // Cost
      const cost = r.reduce((acc, ri) => acc + ri * ri, 0);

      // JᵀJ (2×2)
      let JtJ00 = 0, JtJ01 = 0, JtJ11 = 0;
      let Jtr0 = 0, Jtr1 = 0;
      for (let i = 0; i < n; i++) {
        JtJ00 += J[i][0] * J[i][0];
        JtJ01 += J[i][0] * J[i][1];
        JtJ11 += J[i][1] * J[i][1];
        Jtr0 += J[i][0] * r[i];
        Jtr1 += J[i][1] * r[i];
      }
      // (JᵀJ + λI) Δθ = Jᵀr
      const A00 = JtJ00 + lambda;
      const A11 = JtJ11 + lambda;
      const det = A00 * A11 - JtJ01 * JtJ01;
      if (Math.abs(det) < 1e-30) break;
      const dVmax = (A11 * Jtr0 - JtJ01 * Jtr1) / det;
      const dKm = (A00 * Jtr1 - JtJ01 * Jtr0) / det;

      const newVmax = Vmax + dVmax;
      const newKm = Km + dKm;
      if (newVmax <= 0 || newKm <= 0) {
        lambda *= lambdaFactor;
        continue;
      }
      // New cost
      let newCost = 0;
      for (let i = 0; i < n; i++) {
        const ri = vValues[i] - newVmax * sValues[i] / (newKm + sValues[i]);
        newCost += ri * ri;
      }
      if (newCost < cost) {
        Vmax = newVmax;
        Km = newKm;
        lambda /= lambdaFactor;
        if (Math.abs(prevCost - newCost) < EPS * (1 + newCost)) break;
        prevCost = newCost;
      } else {
        lambda *= lambdaFactor;
      }
    }
    return { Km, Vmax, iterations, converged: iterations < ITMAX };
  }
}
