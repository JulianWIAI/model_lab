/**
 * STDPModel — Spike-Timing-Dependent Plasticity (Song et al. 2000).
 *
 * Convention: Δt = t_post − t_pre
 *   Δt > 0 (pre fires before post) → LTP: Δw = +A₊·exp(−Δt/τ₊)
 *   Δt < 0 (post fires before pre) → LTD: Δw = −A₋·exp( Δt/τ₋)
 *   Δt = 0 → 0 (simultaneous; no plasticity)
 *
 * Song et al. (2000) parameters:
 *   A₊ = 0.005, A₋ = A₊·1.05 = 0.00525, τ₊ = τ₋ = 20 ms
 *
 * Net area: W_net = A₊τ₊ − A₋τ₋ = 0.1 − 0.105 = −0.005 ms  (LTD-dominant)
 *
 * Pairing scheme: all-to-all (each pre paired with every post spike).
 */

export class STDPModel {
  /**
   * @param {{A_plus?: number, A_minus?: number, tau_plus_ms?: number, tau_minus_ms?: number}} [opts]
   * @throws {RangeError} for A₊≤0 or τ₊≤0
   */
  constructor({
    A_plus      = 0.005,
    A_minus     = 0.00525,
    tau_plus_ms  = 20,
    tau_minus_ms = 20,
  } = {}) {
    if (A_plus <= 0)      throw new RangeError(`STDPModel: A_plus must be > 0; got ${A_plus}`);
    if (A_minus <= 0)     throw new RangeError(`STDPModel: A_minus must be > 0; got ${A_minus}`);
    if (tau_plus_ms <= 0) throw new RangeError(`STDPModel: tau_plus_ms must be > 0; got ${tau_plus_ms}`);
    if (tau_minus_ms <= 0) throw new RangeError(`STDPModel: tau_minus_ms must be > 0; got ${tau_minus_ms}`);

    this.A_plus       = A_plus;
    this.A_minus      = A_minus;
    this.tau_plus_ms  = tau_plus_ms;
    this.tau_minus_ms = tau_minus_ms;
  }

  /**
   * STDP kernel: Δw for a single spike pair.
   * @param {number} dt_ms  Δt = t_post − t_pre (ms)
   * @returns {number}
   */
  kernel(dt_ms) {
    if (dt_ms > 0) return  this.A_plus  * Math.exp(-dt_ms / this.tau_plus_ms);
    if (dt_ms < 0) return -this.A_minus * Math.exp( dt_ms / this.tau_minus_ms);
    return 0;
  }

  /**
   * Net area of the STDP kernel: A₊τ₊ − A₋τ₋ (ms).
   * @returns {number}
   */
  netArea() {
    return this.A_plus * this.tau_plus_ms - this.A_minus * this.tau_minus_ms;
  }

  /**
   * All-to-all pairing: sum kernel over every (pre, post) spike pair.
   * @param {number[]} pre_ms   pre-synaptic spike times (ms)
   * @param {number[]} post_ms  post-synaptic spike times (ms)
   * @returns {number}  cumulative Δw
   */
  simulate(pre_ms, post_ms) {
    let dw = 0;
    for (const tPre of pre_ms) {
      for (const tPost of post_ms) {
        dw += this.kernel(tPost - tPre);
      }
    }
    return dw;
  }
}
