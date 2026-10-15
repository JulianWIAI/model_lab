/**
 * IntegrateAndFireModel — leaky integrate-and-fire neuron.
 *
 * Sub-threshold ODE: τ_m·dV/dt = −(V − V_rest) + R·I
 * Solution between spikes: V(t) = V_∞ + (V_reset − V_∞)·e^(−t/τ_m)
 * where V_∞ = V_rest + R·I  [mV]
 *
 * Spike rule: when V reaches V_th, record spike time; reset V = V_reset;
 * hold V = V_reset for t_ref (refractory).
 *
 * Closed-form ISI (I > I_th):
 *   T = τ_m · ln[(V_∞ − V_reset) / (V_∞ − V_th)]   [ms]
 *   ISI = t_ref + T
 *
 * Rheobase: I_th = (V_th − V_rest) / R  [nA]
 * At I=I_th: V_∞=V_th → T → ∞ (logarithmic divergence)
 *
 * Near rheobase: T ≈ τ_m·ln[R·I/(R·(I−I_th))] ≈ τ_m·ln[1/(R(I−I_th))]
 * → f ≈ V_∞ / (τ_m·(V_th−V_reset)) for large I (asymptote)
 *
 * Subthreshold 63.2% rule: from V_reset, V reaches V_rest + (1−1/e)·(V_∞−V_reset)
 * at t = τ_m (63.2% of total deflection V_∞−V_reset).
 *
 * Reference: Lapicque (1907); Gerstner et al. (2014) Neuronal Dynamics Ch.1.
 * Parameters are textbook-style illustrative values, not fitted to a specific cell.
 * Status: formulas anchor-derived; no empirical constants.
 */
export class IntegrateAndFireModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.tauM=10]      membrane time constant [ms]
   * @param {number} [opts.Vrest=-65]    resting potential [mV]
   * @param {number} [opts.Vth=-50]      threshold [mV]
   * @param {number} [opts.Vreset=-65]   reset potential [mV]
   * @param {number} [opts.R=10]         resistance [MΩ]
   * @param {number} [opts.tRef=2]       refractory period [ms]
   * @param {number} [opts.I=2]          injected current [nA]
   */
  constructor({
    tauM = 10, Vrest = -65, Vth = -50, Vreset = -65, R = 10, tRef = 2, I = 2,
  } = {}) {
    this.tauM = tauM;
    this.Vrest = Vrest;
    this.Vth = Vth;
    this.Vreset = Vreset;
    this.R = R;
    this.tRef = tRef;
    this.I = I;
  }

  /** Asymptotic membrane potential V_∞ = V_rest + R·I  [mV] */
  get Vinf() { return this.Vrest + this.R * this.I; }

  /** Rheobase I_th = (V_th − V_rest) / R  [nA] */
  get Ith() { return (this.Vth - this.Vrest) / this.R; }

  /**
   * Closed-form ISI [ms].  Returns Infinity if I ≤ I_th.
   * ISI = t_ref + τ_m · ln[(V_∞ − V_reset) / (V_∞ − V_th)]
   */
  get ISI() {
    const { Vinf, Vth, Vreset, tauM, tRef } = this;
    if (Vinf <= Vth) return Infinity;
    return tRef + tauM * Math.log((Vinf - Vreset) / (Vinf - Vth));
  }

  /** Firing rate f = 1/ISI [Hz] (0 if subthreshold) */
  get firingRate() {
    const isi = this.ISI;
    return isi === Infinity ? 0 : 1000 / isi; // ISI in ms → Hz
  }

  /**
   * Simulate V(t) trace and collect spike times.
   * Uses exact exponential update between resets (no Euler error).
   *
   * @param {number} tEnd   [ms]
   * @param {number} [dt=0.01]  [ms]
   * @returns {{ t: number[], V: number[], spikeTimes: number[] }}
   */
  simulate(tEnd, dt = 0.01) {
    const { tauM, Vrest, Vth, Vreset, tRef, Vinf } = this;
    const N = Math.round(tEnd / dt);
    const ts = new Float64Array(N + 1);
    const Vs = new Float64Array(N + 1);
    const spikeTimes = [];

    let V = Vreset;
    let tSinceSpike = tRef; // start out of refractory

    ts[0] = 0;
    Vs[0] = V;

    for (let i = 0; i < N; i++) {
      const t = (i + 1) * dt;
      ts[i + 1] = t;

      if (tSinceSpike < tRef) {
        // In refractory period: hold at reset
        V = Vreset;
        tSinceSpike += dt;
      } else {
        // Sub-threshold integration: exact exponential update
        // V(t+dt) = V_∞ + (V(t) − V_∞)·e^(−dt/τ_m)
        V = Vinf + (V - Vinf) * Math.exp(-dt / tauM);

        // Threshold crossing: record spike at current time step
        if (V >= Vth) {
          spikeTimes.push(t);
          V = Vreset;
          tSinceSpike = 0;
        }
      }

      Vs[i + 1] = V;
    }

    return { t: Array.from(ts), V: Array.from(Vs), spikeTimes };
  }

  /**
   * f-I curve: firing rate vs injected current.
   * @param {number} Imin
   * @param {number} Imax
   * @param {number} [nPoints=200]
   * @returns {{ I: number, f: number }[]}
   */
  fICurve(Imin = 0, Imax = 5, nPoints = 200) {
    const pts = [];
    const dI = (Imax - Imin) / nPoints;
    for (let i = 0; i <= nPoints; i++) {
      const I = Imin + i * dI;
      const m = new IntegrateAndFireModel({ ...this, I });
      pts.push({ I, f: m.firingRate });
    }
    return pts;
  }
}
