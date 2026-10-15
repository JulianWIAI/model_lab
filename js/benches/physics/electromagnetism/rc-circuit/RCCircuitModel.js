/**
 * RCCircuitModel — RC circuit charging and discharging.
 *
 * Closed-form solutions from KVL (V₀ = V_R + V_C = IR + V_C, I = C·dV_C/dt):
 *
 * Time constant:   τ = R · C                          [seconds]
 *
 * Charging (V_C(0) = 0):
 *   V_C(t) = V₀ · (1 − e^(−t/τ))                    [V]
 *   I(t)   = (V₀ − V_C(t)) / R = (V₀/R) · e^(−t/τ) [A]
 *
 * Discharging (V_C(0) = V₀):
 *   V_C(t) = V₀ · e^(−t/τ)                           [V]
 *   I(t)   = V_C(t) / R                               [A]
 *
 * Energy stored at time t:   E_C = ½ · C · V_C(t)²   [J]
 * Energy dissipated in R (full charge, 0→∞): ∫I²R dt = ½CV₀²  [J]
 * Cut-off frequency:  f_c = 1 / (2π · τ)             [Hz]
 * Half-voltage time:  t½  = τ · ln(2)                 [s]
 *
 * Reference: Kirchhoff, G. (1847). Annalen der Physik 148:497–508.
 * No uncertain empirical constants — all derivable from KVL.
 */
export class RCCircuitModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.R=1000]   resistance, Ω
   * @param {number} [opts.C=100e-6] capacitance, F
   * @param {number} [opts.V0=5]     supply voltage, V
   * @param {'charge'|'discharge'} [opts.mode='charge']
   */
  constructor({ R = 1000, C = 100e-6, V0 = 5, mode = 'charge' } = {}) {
    this.R    = R;
    this.C    = C;
    this.V0   = V0;
    this.mode = mode;
  }

  /** Time constant τ = R·C  [s] */
  get tau() { return this.R * this.C; }

  /** Half-voltage time t½ = τ·ln 2  [s] */
  get tHalf() { return this.tau * Math.LN2; }

  /** Cut-off (−3 dB) frequency f_c = 1/(2π·τ)  [Hz] */
  get fc() { return 1 / (2 * Math.PI * this.tau); }

  /**
   * Capacitor voltage at time t  [V].
   * @param {number} t  seconds (t ≥ 0)
   */
  Vc(t) {
    if (this.mode === 'charge') {
      return this.V0 * (1 - Math.exp(-t / this.tau));
    }
    return this.V0 * Math.exp(-t / this.tau);
  }

  /**
   * Circuit current at time t  [A].
   * Charging:    I = (V₀ − V_C) / R  (positive, into capacitor)
   * Discharging: I = V_C / R          (positive, out of capacitor)
   * @param {number} t  seconds
   */
  I(t) {
    if (this.mode === 'charge') {
      return (this.V0 - this.Vc(t)) / this.R;
    }
    return this.Vc(t) / this.R;
  }

  /**
   * Energy stored in the capacitor at time t  [J].
   * E_C = ½ · C · V_C²
   * @param {number} t  seconds
   */
  energyStored(t) { return 0.5 * this.C * this.Vc(t) ** 2; }

  /**
   * Generate a curve for plotting.
   * @param {number} tMax  maximum time  [s]
   * @param {number} [nPoints=300]
   * @returns {{ t: number, Vc: number, I: number }[]}
   */
  curve(tMax, nPoints = 300) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const t = tMax * i / (nPoints - 1);
      pts.push({ t, Vc: this.Vc(t), I: this.I(t) });
    }
    return pts;
  }
}
