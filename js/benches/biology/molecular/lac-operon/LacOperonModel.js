/**
 * LacOperonModel — qualitative model of the E. coli lac operon regulatory switch.
 *
 * State vector (dimensionless):
 *   y = [M, B, A]
 *   M: lacZ mRNA concentration (arbitrary units)
 *   B: β-galactosidase enzyme concentration
 *   A: allolactose (internal inducer) concentration
 *
 * ODE system (dimensionless, adapted from Yildirim & Mackey 2003):
 *   dM/dt = αM · Aʰ/(Krʰ + Aʰ) · 1/(1 + g/Kg) − γM · M
 *   dB/dt = αB · M − γB · B
 *   dA/dt = κ · B · L/(KL + L) − δA · A
 *
 * Parameters (default values chosen to exhibit bistability):
 *   αM=1     mRNA production rate constant
 *   γM=0.5   mRNA degradation rate
 *   Kr=0.1   Hill constant for allolactose induction
 *   h=3      Hill coefficient (cooperativity of LacI tetramer)
 *   Kg=0.2   catabolite repression threshold (glucose)
 *   αB=2     enzyme translation rate
 *   γB=0.1   enzyme degradation rate
 *   κ=0.5    allolactose production rate constant
 *   KL=0.1   Michaelis constant for lactose conversion
 *   δA=0.3   allolactose degradation rate
 *
 * Inputs:
 *   glucose  ∈ [0, 1]: catabolite repression (g in ODE)
 *   lactose  ∈ [0, 1]: external lactose (L in ODE)
 *
 * IMPORTANT: This is a qualitative model. The parameter values are adapted
 * to demonstrate bistability but are NOT the exact values of Yildirim & Mackey (2003),
 * which are in dimensional units with time delays. Do not use for quantitative predictions.
 *
 * References:
 *   Jacob, F. & Monod, J. (1961) J. Mol. Biol. 3, 318–356. (lac operon discovery)
 *   Yildirim, N. & Mackey, M. C. (2003) Biophys. J. 84, 2841–2851. (mathematical model)
 *   Ozbudak, E. M. et al. (2004) Nature 427, 737–740. (experimental bistability)
 */
import { Integrators } from '../../../../core/Integrators.js';

export class LacOperonModel {
  constructor({
    glucose = 0,
    lactose = 0,
    // ODE parameters
    alphaM = 1,
    gammaM = 0.5,
    Kr     = 0.1,
    h      = 3,
    Kg     = 0.2,
    alphaB = 2,
    gammaB = 0.1,
    kappa  = 0.5,
    KL     = 0.1,
    deltaA = 0.3,
  } = {}) {
    this.glucose = glucose;
    this.lactose = lactose;
    // Parameters
    this.alphaM = alphaM;
    this.gammaM = gammaM;
    this.Kr     = Kr;
    this.h      = h;
    this.Kg     = Kg;
    this.alphaB = alphaB;
    this.gammaB = gammaB;
    this.kappa  = kappa;
    this.KL     = KL;
    this.deltaA = deltaA;
    // State: [M, B, A]
    this._y = [0.01, 0.01, 0.01];
    this._t = 0;
  }

  /** lacZ mRNA level */
  get mRNA()        { return this._y[0]; }
  /** β-galactosidase level */
  get lacZ()        { return this._y[1]; }
  /** Allolactose level */
  get allolactose() { return this._y[2]; }
  /** Current time */
  get time()        { return this._t; }

  /**
   * ODE derivative function.
   * @param {number[]} y  [M, B, A]
   * @param {number} _t  (unused; system is autonomous)
   * @returns {number[]}  [dM/dt, dB/dt, dA/dt]
   */
  _deriv(y) {
    const [M, B, A] = y;
    const g = this.glucose;
    const L = this.lactose;
    const { alphaM, gammaM, Kr, h, Kg, alphaB, gammaB, kappa, KL, deltaA } = this;

    const Ah = Math.pow(Math.max(A, 0), h);
    const Krh = Math.pow(Kr, h);

    const dM = alphaM * Ah / (Krh + Ah) * 1 / (1 + g / Kg) - gammaM * M;
    const dB = alphaB * M - gammaB * B;
    const dA = kappa * B * L / (KL + L) - deltaA * A;

    return [dM, dB, dA];
  }

  /** Advance by one RK4 step of size dt. */
  step(dt = 0.05) {
    const f = (y, t) => this._deriv(y, t);
    this._y = Integrators.rk4(f, this._y, this._t, dt);
    // Clamp to non-negative (concentrations can't go negative)
    this._y = this._y.map((v) => Math.max(0, v));
    this._t += dt;
  }

  /** Reset state to near-zero initial conditions. */
  reset() {
    this._y = [0.01, 0.01, 0.01];
    this._t = 0;
  }
}
