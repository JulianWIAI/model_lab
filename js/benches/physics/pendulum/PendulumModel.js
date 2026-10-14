/**
 * Two pendulums released from the same angle, side by side:
 *
 *   exact:     θ″ = −(g/L)·sin θ − γ·θ′
 *   shortcut:  θ″ = −(g/L)·θ     − γ·θ′   (small-angle approximation sin θ ≈ θ)
 *
 * Both are stepped forward with 4th-order Runge–Kutta (RK4).
 * Angles are in radians inside the model, degrees only at the edges.
 */
export class PendulumModel {
  /**
   * @param {object} [options]
   * @param {number} [options.angleDeg=60]  release angle in degrees
   * @param {number} [options.length=1]     rod length in metres
   * @param {number} [options.damping=0]    friction γ in 1/s
   * @param {number} [options.gravity=9.81] g in m/s²
   */
  constructor({ angleDeg = 60, length = 1, damping = 0, gravity = 9.81 } = {}) {
    this.length = length;
    this.damping = damping;
    this.gravity = gravity;
    this.reset(angleDeg);
  }

  /** Puts both pendulums back at the release angle, at rest. */
  reset(angleDeg = this.startAngleDeg) {
    this.startAngleDeg = angleDeg;
    const theta = (angleDeg * Math.PI) / 180;
    this.exact = { theta, omega: 0 };
    this.shortcut = { theta, omega: 0 };
    this.time = 0;
    // Times when each pendulum swung through the bottom going one way; used to measure the period.
    this.crossings = { exact: [], shortcut: [] };
  }

  /** Angular acceleration θ″ for a given angle and angular speed. */
  acceleration(theta, omega, useShortcut) {
    const restoring = useShortcut ? theta : Math.sin(theta);
    return -(this.gravity / this.length) * restoring - this.damping * omega;
  }

  /**
   * One RK4 step: samples the slope at the start, twice in the middle and at the end,
   * then takes a weighted average. Far more accurate than a single Euler step.
   */
  rk4(state, dt, useShortcut) {
    const f = (theta, omega) => [omega, this.acceleration(theta, omega, useShortcut)];
    const [k1t, k1o] = f(state.theta, state.omega);
    const [k2t, k2o] = f(state.theta + (k1t * dt) / 2, state.omega + (k1o * dt) / 2);
    const [k3t, k3o] = f(state.theta + (k2t * dt) / 2, state.omega + (k2o * dt) / 2);
    const [k4t, k4o] = f(state.theta + k3t * dt, state.omega + k3o * dt);
    return {
      theta: state.theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
      omega: state.omega + (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o),
    };
  }

  /** Advances both pendulums by dt seconds in small internal steps. */
  step(dt) {
    const h = 0.002;
    let remaining = dt;
    while (remaining > 1e-9) {
      const d = Math.min(h, remaining);
      this.#advance('exact', d, false);
      this.#advance('shortcut', d, true);
      this.time += d;
      remaining -= d;
    }
  }

  #advance(key, dt, useShortcut) {
    const before = this[key];
    const after = this.rk4(before, dt, useShortcut);
    // Positive → negative angle happens once per full swing, so the gap between two is one period.
    if (before.theta > 0 && after.theta <= 0) {
      const fraction = before.theta / (before.theta - after.theta); // linear interpolation inside the step
      const list = this.crossings[key];
      list.push(this.time + fraction * dt);
      if (list.length > 6) list.shift();
    }
    this[key] = after;
  }

  /** Textbook period T₀ = 2π√(L/g), valid only for small swings. */
  get smallAnglePeriod() {
    return 2 * Math.PI * Math.sqrt(this.length / this.gravity);
  }

  /**
   * Exact period of an undamped pendulum: T = T₀ / AGM(1, cos(θ₀/2)).
   * The arithmetic–geometric mean converges in a handful of iterations.
   */
  get exactPeriod() {
    let a = 1;
    let b = Math.cos((this.startAngleDeg * Math.PI) / 360);
    for (let i = 0; i < 20; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
    return this.smallAnglePeriod / a;
  }

  /** Period measured from the simulation so far, or null before two full swings. */
  measuredPeriod(key) {
    const list = this.crossings[key];
    return list.length >= 2 ? list[list.length - 1] - list[list.length - 2] : null;
  }
}
