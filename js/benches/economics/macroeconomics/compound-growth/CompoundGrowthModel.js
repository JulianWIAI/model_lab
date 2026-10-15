/**
 * CompoundGrowthModel — compound interest / growth with discrete and continuous compounding.
 *
 * Discrete (m compounding periods per year):
 *   A(t) = P · (1 + r/m)^(m·t)
 * Continuous (m → ∞):
 *   A(t) = P · e^(r·t)
 * Effective annual rate:
 *   EAR = (1 + r/m)^m − 1
 * Exact doubling time:
 *   discrete:   t₂ = ln(2) / (m·ln(1 + r/m))
 *   continuous: t₂ = ln(2) / r
 * Present value (continuous discounting):
 *   PV = FV · e^(−r·T)
 * Rule-of-72 approximation (annual compounding, m=1):
 *   t₂_72 ≈ 0.72 / r   (r as decimal)
 *
 * Rule-of-72 EXACT error:
 *   rule72_pct(r) = t₂_exact(r, m=1) × (r×100)
 *   r=0.05: 71.03   r=0.10: 72.73   r=0.12: 73.45   r=0.20: 76.04
 *   (72 is accurate near r≈8%; continuous: 69.3 = ln2×100)
 *
 * EDUCATIONAL USE ONLY — NOT FINANCIAL ADVICE.
 */

/** Available compounding frequencies. m=Infinity means continuous. */
export const FREQUENCIES = Object.freeze([
  { id: 'annual',    label: 'Annual',    m: 1   },
  { id: 'semi',      label: 'Semi-ann.', m: 2   },
  { id: 'quarterly', label: 'Quarterly', m: 4   },
  { id: 'monthly',   label: 'Monthly',   m: 12  },
  { id: 'daily',     label: 'Daily',     m: 365 },
  { id: 'cont',      label: 'Continuous', m: Infinity },
]);

export class CompoundGrowthModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.P=1000]     principal
   * @param {number} [opts.r=0.07]     nominal annual rate (as decimal, e.g. 0.07)
   * @param {number} [opts.m=1]        compounding periods per year; Infinity = continuous
   * @param {number} [opts.tMax=30]    years to plot
   */
  constructor({ P = 1000, r = 0.07, m = 1, tMax = 30 } = {}) {
    this.P    = P;
    this.r    = r;
    this.m    = m;
    this.tMax = tMax;
  }

  /** A(t) with current compounding frequency. */
  A(t) {
    if (this.m === Infinity) return this.Acontinuous(t);
    return this.P * Math.pow(1 + this.r / this.m, this.m * t);
  }

  /** A(t) with arbitrary compounding frequency mOverride. */
  Adiscrete(t, mOverride) {
    if (mOverride === Infinity) return this.Acontinuous(t);
    return this.P * Math.pow(1 + this.r / mOverride, mOverride * t);
  }

  /** A(t) with continuous compounding. */
  Acontinuous(t) {
    return this.P * Math.exp(this.r * t);
  }

  /**
   * Present value — continuous discounting: PV = FV · e^(−r·T).
   * @param {number} FV  future value
   * @param {number} T   years from now
   */
  PV(FV, T) {
    return FV * Math.exp(-this.r * T);
  }

  /** Effective annual rate: EAR = (1+r/m)^m − 1 */
  get EAR() {
    if (this.m === Infinity) return Math.exp(this.r) - 1;
    return Math.pow(1 + this.r / this.m, this.m) - 1;
  }

  /**
   * Exact doubling time in years.
   * discrete:   t₂ = ln(2) / (m·ln(1+r/m))
   * continuous: t₂ = ln(2) / r
   */
  get doublingTime() {
    if (this.m === Infinity) return Math.LN2 / this.r;
    return Math.LN2 / (this.m * Math.log(1 + this.r / this.m));
  }

  /**
   * Rule-of-72 approximation of doubling time (uses m=1 convention).
   *   t₂_72 = 0.72 / r
   * "0.72" is chosen so that t₂_72 × r% ≈ 72 near r=8%.
   * Exact product t₂_exact(r, m=1) × r% varies from ~71 at r=5% to ~76 at r=20%.
   */
  get rule72() {
    return 0.72 / this.r;
  }

  /**
   * rule72Percent(r) = exact annual doubling time × (r×100).
   * Shows where 72 is accurate and where it diverges.
   * @param {number} r  annual rate as decimal
   */
  rule72Percent(r) {
    const t2exact = Math.LN2 / Math.log(1 + r); // annual compounding m=1
    return t2exact * (r * 100);
  }

  /**
   * Curve for plotting: t vs A (chosen m) and A continuous.
   * @param {number} [nPoints=300]
   * @returns {{ t: number, A: number, Acont: number }[]}
   */
  curve(nPoints = 300) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const t = this.tMax * i / (nPoints - 1);
      pts.push({ t, A: this.A(t), Acont: this.Acontinuous(t) });
    }
    return pts;
  }

  /**
   * Rule-of-72 error curve: r vs rule72Percent for r in [0.02, 0.25].
   * @param {number} [nPoints=100]
   * @returns {{ r: number, pct: number }[]}
   */
  rule72Curve(nPoints = 100) {
    const pts = [];
    const rMin = 0.02, rMax = 0.25;
    for (let i = 0; i < nPoints; i++) {
      const r = rMin + (rMax - rMin) * i / (nPoints - 1);
      pts.push({ r, pct: this.rule72Percent(r) });
    }
    return pts;
  }
}
