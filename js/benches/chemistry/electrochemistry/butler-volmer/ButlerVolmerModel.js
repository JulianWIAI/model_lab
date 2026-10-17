/**
 * ButlerVolmerModel — electrode kinetics (Butler-Volmer equation).
 *
 * i = i₀·[exp(α·F·η/(RT)) − exp(−(1−α)·F·η/(RT))]
 *
 * Symmetric case α=0.5:
 *   i = i₀·2·sinh(η/(2·V_T))   [exact algebraic form]
 *
 * Limits:
 *   Small η: i ≈ i₀·η/V_T  (linear, Ohm-like)
 *   Large anodic η: log₁₀(i/i₀) ≈ η/b  where b = V_T·ln10/α  [Tafel slope, V/decade]
 *
 * Constants (CODATA 2018 exact):
 *   F = 96485.33212  C/mol
 *   R = 8.31446261815324  J/(mol·K)
 *
 * References: Butler (1924), Trans. Faraday Soc. 19:729.
 * Bard & Faulkner (2001), Electrochemical Methods §3.4.
 */

const F_CONST = 96485.33212;         // C/mol — CODATA 2018 exact
const R_GAS   = 8.31446261815324;    // J/(mol·K) — CODATA 2018 exact

export class ButlerVolmerModel {
  /**
   * @param {object} opts
   * @param {number} [opts.alpha=0.5]   transfer coefficient (dimensionless, ∈ (0,1))
   * @param {number} [opts.T_K=298.15]  temperature (K)
   * @param {number} [opts.i0=1]        exchange current density (A/m² or any consistent unit)
   */
  constructor({ alpha = 0.5, T_K = 298.15, i0 = 1 } = {}) {
    if (alpha <= 0 || alpha >= 1) throw new RangeError('ButlerVolmerModel: alpha must be in (0,1)');
    if (T_K <= 0)  throw new RangeError('ButlerVolmerModel: T_K must be > 0');
    if (i0  <= 0)  throw new RangeError('ButlerVolmerModel: i0 must be > 0');
    this.alpha = alpha;
    this.T_K   = T_K;
    this.i0    = i0;
  }

  /** Thermal voltage V_T = RT/F  (V) */
  thermalVoltage() {
    return R_GAS * this.T_K / F_CONST;
  }

  /** Tafel slope b = V_T·ln(10)/α  (V/decade, anodic branch) */
  tafelSlope() {
    return this.thermalVoltage() * Math.log(10) / this.alpha;
  }

  /**
   * Butler-Volmer current at overpotential η (V).
   * Clamps exponent arguments to ±700 to avoid overflow.
   * @param {number} eta  overpotential (V)
   * @returns {number} current (same units as i0)
   */
  current(eta) {
    const vt = this.thermalVoltage();
    const x1 = this.alpha * eta / vt;
    const x2 = -(1 - this.alpha) * eta / vt;
    const clamp = (x) => x > 700 ? 700 : x < -700 ? -700 : x;
    return this.i0 * (Math.exp(clamp(x1)) - Math.exp(clamp(x2)));
  }

  /**
   * Normalised BV current: i/i₀.
   * For α=0.5 this equals 2·sinh(η/(2·V_T)).
   * @param {number} eta  overpotential (V)
   * @returns {number}
   */
  currentNorm(eta) {
    return this.current(eta) / this.i0;
  }

  /**
   * Tafel (large-η anodic) approximation: i₀·exp(α·η/V_T).
   * @param {number} eta  overpotential (V)
   * @returns {number}
   */
  tafelApprox(eta) {
    return this.i0 * Math.exp(this.alpha * eta / this.thermalVoltage());
  }

  /**
   * Linear (small-η) approximation: i₀·η/V_T.
   * @param {number} eta  overpotential (V)
   * @returns {number}
   */
  linearApprox(eta) {
    return this.i0 * eta / this.thermalVoltage();
  }

  /**
   * Polarization curve: array of {eta, i} from −etaMax to +etaMax.
   * @param {number} etaMax  maximum |overpotential| (V)
   * @param {number} [nPoints=200]
   * @returns {{ eta: number, i: number }[]}
   */
  polarizationCurve(etaMax, nPoints = 200) {
    const pts = [];
    for (let k = 0; k < nPoints; k++) {
      const eta = -etaMax + 2 * etaMax * k / (nPoints - 1);
      pts.push({ eta, i: this.current(eta) });
    }
    return pts;
  }
}
