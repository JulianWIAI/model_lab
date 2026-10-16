/**
 * PharmacokineticsModel — 1-compartment IV bolus and oral (Bateman) kinetics.
 *
 * IV:   C(t) = C₀·e^{-ke·t}           C₀ = D/Vd
 *       AUC  = C₀/ke                   t½ = ln2/ke
 *
 * Oral (Bateman function):
 *   C(t) = A·(e^{-ke·t} − e^{-ka·t})
 *   where A = ka·F·D/(Vd·(ka−ke))
 *   t_max = ln(ka/ke)/(ka−ke)
 *
 * ka = ke LIMIT (L'Hôpital):
 *   As ka→ke: C(t) → F·D·ke·t·e^{-ke·t}/Vd
 *   Implemented: when |ka−ke| < ε, use limit form directly.
 *
 * Normal oral form uses expm1 for numerical stability at small t:
 *   e^{-ke·t} − e^{-ka·t} = e^{-ke·t}·(1 − e^{-(ka-ke)·t})
 *                          = e^{-ke·t}·(−expm1(−(ka-ke)·t))
 *   expm1 avoids catastrophic cancellation when (ka-ke)·t ≪ 1.
 *
 * Flip-flop symmetry: ke·C(t; ka, ke) = ka·C(t; ke, ka)  [algebraic identity]
 *
 * Multi-dose accumulation at steady state:
 *   R = 1/(1−e^{-ke·τ})
 *   For t½=24h, τ=12h: R = 1/(1−2^{-0.5}) = 2+√2 ≈ 3.4142
 *
 * Bateman attribution: H. Bateman (1910) Proc. Camb. Phil. Soc. 15:423–427.
 *   UNVERIFIED — cited, not fetched.
 *
 * Reference: Rowland & Tozer (1995) Clinical Pharmacokinetics (cited, not fetched).
 */
export class PharmacokineticsModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.ke=0.1]  elimination rate constant [1/h]
   * @param {number} [opts.ka=1.0]  absorption rate constant [1/h]
   * @param {number} [opts.D=100]   dose [mg]
   * @param {number} [opts.Vd=10]   volume of distribution [L]
   * @param {number} [opts.F=1]     bioavailability [0-1]
   * @param {boolean}[opts.iv=true] true = IV bolus; false = oral
   */
  constructor({ ke = 0.1, ka = 1.0, D = 100, Vd = 10, F = 1, iv = true } = {}) {
    if (ke <= 0) throw new RangeError(`ke must be > 0; got ${ke}`);
    if (ka <= 0) throw new RangeError(`ka must be > 0; got ${ka}`);
    if (Vd <= 0) throw new RangeError(`Vd must be > 0; got ${Vd}`);
    if (F <= 0 || F > 1) throw new RangeError(`F must be in (0,1]; got ${F}`);
    this.ke = ke;
    this.ka = ka;
    this.D  = D;
    this.Vd = Vd;
    this.F  = F;
    this.iv = iv;
  }

  /** Initial IV concentration C₀ = D/Vd [mg/L]. */
  get C0() { return this.D / this.Vd; }

  /** Elimination half-life t½ = ln2/ke [h]. */
  get tHalf() { return Math.LN2 / this.ke; }

  /** AUC for IV = C₀/ke; for oral = F·D/(Vd·ke)  [mg·h/L]. */
  get AUC() {
    return this.iv
      ? this.C0 / this.ke
      : this.F * this.D / (this.Vd * this.ke);
  }

  /**
   * Plasma concentration at time t [mg/L].
   * Oral route uses expm1 form for numerical stability at small t.
   * @param {number} t  hours (t ≥ 0)
   */
  C(t) {
    if (this.iv) return this.C0 * Math.exp(-this.ke * t);

    const { ke, ka, D, Vd, F } = this;
    const diff = ka - ke;
    if (Math.abs(diff) < 1e-9 * ke) {
      // Limit: C → F·D·ke·t·e^{-ke·t}/Vd
      return F * D * ke * t * Math.exp(-ke * t) / Vd;
    }
    // expm1 form: A·e^{-ke·t}·(−expm1(−diff·t))
    // Avoids catastrophic cancellation when t is small (ka-ke)·t ≪ 1
    const A = ka * F * D / (Vd * diff);
    return A * Math.exp(-ke * t) * (-Math.expm1(-diff * t));
  }

  /**
   * Time of peak concentration t_max [h] for oral route.
   * t_max = ln(ka/ke)/(ka-ke)
   */
  get tMax() {
    if (this.iv) return 0;
    const diff = this.ka - this.ke;
    if (Math.abs(diff) < 1e-9 * this.ke) return 1 / this.ke;
    return Math.log(this.ka / this.ke) / diff;
  }

  /**
   * Multi-dose steady-state accumulation ratio.
   * R = 1 / (1 - e^{-ke·τ})
   * @param {number} tau  dosing interval [h]
   */
  accumulationRatio(tau) {
    return 1 / (1 - Math.exp(-this.ke * tau));
  }

  /**
   * Generate a curve for plotting.
   * @param {number} tMax  [h]
   * @param {number} [nPoints=300]
   * @returns {{ t: number, C: number }[]}
   */
  curve(tMax, nPoints = 300) {
    const pts = [];
    for (let i = 0; i <= nPoints; i++) {
      const t = tMax * i / nPoints;
      pts.push({ t, C: this.C(t) });
    }
    return pts;
  }
}
