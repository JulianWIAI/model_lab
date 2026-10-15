/**
 * PredatorPreyModel — Lotka–Volterra predator–prey equations.
 *
 * Equations:
 *   dx/dt = α·x − β·x·y    [prey growth α, predation β]
 *   dy/dt = δ·x·y − γ·y    [predator conversion δ, death γ]
 *
 * Conserved quantity (first integral, constant along trajectories):
 *   V = δ·x − γ·ln x + β·y − α·ln y
 *
 * Equilibrium: x* = γ/δ, y* = α/β
 *
 * Reference: Lotka (1920) PNAS; Volterra (1926) Nature.
 * No empirical constants — α, β, γ, δ are free parameters.
 */
import { Integrators } from '../../../../core/Integrators.js';

export class PredatorPreyModel {
  constructor({ alpha=0.6, beta=0.05, delta=0.04, gamma=0.5, x0=10, y0=5 } = {}) {
    this.alpha = alpha; this.beta  = beta;
    this.delta = delta; this.gamma = gamma;
    this._x0 = x0; this._y0 = y0;
    this.reset();
  }

  reset() {
    this._y = [this._x0, this._y0];
    this._t = 0;
    this.V0 = this._conservedOf(this._x0, this._y0);
    this._history = [];
    this._history.push({ t: 0, x: this._x0, y: this._y0 });
  }

  _conservedOf(x, y) {
    if (x <= 0 || y <= 0) return NaN;
    return this.delta * x - this.gamma * Math.log(x) + this.beta * y - this.alpha * Math.log(y);
  }

  _deriv([x, y]) {
    return [
      this.alpha * x - this.beta * x * y,
      this.delta * x * y - this.gamma * y,
    ];
  }

  step(dt = 0.05) {
    this._y = Integrators.rk4((y) => this._deriv(y), this._y, this._t, dt);
    this._y[0] = Math.max(this._y[0], 1e-10);
    this._y[1] = Math.max(this._y[1], 1e-10);
    this._t += dt;
    this._history.push({ t: this._t, x: this._y[0], y: this._y[1] });
    if (this._history.length > 2000) this._history.shift();
  }

  get x() { return this._y[0]; }
  get y() { return this._y[1]; }
  get t() { return this._t; }
  get conserved() { return this._conservedOf(this.x, this.y); }
  get history() { return this._history; }

  equilibrium() {
    return { x: this.gamma / this.delta, y: this.alpha / this.beta };
  }
}
