/**
 * SIRModel — susceptible-infected-recovered epidemic model.
 *
 * Equations:
 *   dS/dt = −β·S·I
 *   dI/dt =  β·S·I − γ·I
 *   dR/dt =  γ·I
 *   S + I + R = 1 (conserved)
 *
 * Basic reproduction number: R₀ = β/γ
 * Herd-immunity threshold:   h* = 1 − 1/R₀
 * Effective Rt:              Rt = R₀·S
 *
 * Final-size relation (transcendental; solved numerically):
 *   r∞ = 1 − exp(−R₀·r∞)
 *   i.e. g(r) = r − 1 + exp(−R₀·r) = 0 on (ε, 1)
 *
 * References:
 *   Kermack & McKendrick (1927) Proc. Roy. Soc. A 115, 700–721.
 *   doi:10.1098/rspa.1927.0118
 */
import { Integrators } from '../../../../core/Integrators.js';
import { RootFinding } from '../../../../core/RootFinding.js';

export class SIRModel {
  constructor({ beta = 0.3, gamma = 0.1, I0 = 0.001 } = {}) {
    this.beta  = beta;
    this.gamma = gamma;
    this.I0    = I0;
    this.reset();
  }

  reset() {
    this._y = [1 - this.I0, this.I0, 0];
    this._t = 0;
    this._peakI = this.I0;
    this._history = [{ t: 0, S: this._y[0], I: this._y[1], R: this._y[2] }];
  }

  _deriv([S, I, R]) {
    const inf = this.beta * S * I;
    const rec = this.gamma * I;
    return [-inf, inf - rec, rec];
  }

  step(dt = 0.1) {
    this._y = Integrators.rk4((y) => this._deriv(y), this._y, this._t, dt);
    // keep in [0,1] and conserve sum
    this._y = this._y.map((v) => Math.max(0, v));
    const sum = this._y[0] + this._y[1] + this._y[2];
    if (sum > 0) this._y = this._y.map((v) => v / sum);
    this._t += dt;
    if (this._y[1] > this._peakI) this._peakI = this._y[1];
    this._history.push({ t: this._t, S: this._y[0], I: this._y[1], R: this._y[2] });
    if (this._history.length > 3000) this._history.shift();
  }

  get S() { return this._y[0]; }
  get I() { return this._y[1]; }
  get R() { return this._y[2]; }
  get t() { return this._t; }
  get peakI() { return this._peakI; }
  get history() { return this._history; }

  get R0() { return this.beta / this.gamma; }
  get Rt() { return this.R0 * this.S; }
  get herdThreshold() { return 1 - 1 / this.R0; }

  get finalSize() {
    const R0 = this.R0;
    if (R0 <= 1) return 0;
    // g(r) = r - 1 + exp(-R0 * r) = 0; root in (1e-9, 1-1e-9)
    return RootFinding.brent((r) => r - 1 + Math.exp(-R0 * r), 1e-9, 1 - 1e-9, 1e-9);
  }
}
