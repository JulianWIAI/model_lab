/**
 * OrbitModel — two-body Kepler orbit simulation.
 *
 * Integrators: velocity Verlet (symplectic; bounded energy error)
 * and RK4 (secular energy drift grows linearly with orbit count).
 *
 * Kepler's third law:  T = 2π√(a³/GM)            [s]
 * Vis-viva:           v² = GM·(2/r − 1/a)         [m²/s²]
 * Specific energy:    E = −GM/(2a)                 [J/kg]
 * Specific ang. mom.: L = |r×v|                    [m²/s]
 * Perihelion speed:   v_p = √(GM·(1+e)/(a·(1−e))) [m/s]
 * Perihelion dist.:   r_p = a·(1−e)               [m]
 * Escape speed:       v_esc = √(2GM/r)             [m/s]
 *
 * Initial conditions: perihelion at (r_p, 0), velocity (0, v_p).
 *
 * Constants (IAU 2015 B3 nominal; IAU 2012 B2):
 *   GM_sun = 1.32712440018×10²⁰ m³/s²
 *   AU     = 149 597 870 700 m (exact)
 *   GM_Earth = 3.986004418×10¹⁴ m³/s²
 *   r_Earth  = 6.371×10⁶ m (IUGG mean)
 *
 * Status: formulas anchor-derived; constants cited, not fetched.
 */
import { Integrators } from '../../../../core/Integrators.js';

/** IAU 2015 B3 nominal solar gravitational parameter [m³/s²]. Exact by definition. */
export const GM_SUN = 1.32712440018e20;

/** IAU 2012 B2 astronomical unit [m]. Exact by definition. */
export const AU = 149597870700;

/** IAU 2015 B3 nominal Earth gravitational parameter [m³/s²]. */
export const GM_EARTH = 3.986004418e14;

/** IUGG mean Earth radius [m]. */
export const R_EARTH = 6.371e6;

export class OrbitModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.a=AU]      semi-major axis [m]
   * @param {number} [opts.e=0]       eccentricity [0, 1)
   * @param {number} [opts.GM=GM_SUN] gravitational parameter [m³/s²]
   * @param {'verlet'|'rk4'} [opts.integrator='verlet']
   * @param {number} [opts.dt]        step size [s]; defaults to T/1000
   */
  constructor({ a = AU, e = 0, GM = GM_SUN, integrator = 'verlet', dt = null } = {}) {
    this.a = a;
    this.e = e;
    this.GM = GM;
    this.integrator = integrator;
    this._dt = dt;
  }

  /** Orbital period T = 2π√(a³/GM) [s] */
  get period() { return 2 * Math.PI * Math.sqrt(this.a ** 3 / this.GM); }

  /** Default step size: T/1000 */
  get dt() { return this._dt ?? this.period / 1000; }

  /** Perihelion distance r_p = a(1−e) [m] */
  get rPerihelion() { return this.a * (1 - this.e); }

  /** Perihelion speed v_p = √(GM·(1+e)/(a(1−e))) [m/s] */
  get vPerihelion() { return Math.sqrt(this.GM * (1 + this.e) / (this.a * (1 - this.e))); }

  /** Specific orbital energy E = −GM/(2a) [J/kg] */
  get energy() { return -this.GM / (2 * this.a); }

  /** Specific energy from state [r,v] */
  _energyFromState(pos, vel) {
    const r = Math.sqrt(pos[0] ** 2 + pos[1] ** 2);
    const v2 = vel[0] ** 2 + vel[1] ** 2;
    return v2 / 2 - this.GM / r;
  }

  /** Angular momentum L = x·vy − y·vx [m²/s] */
  _angMomentum(pos, vel) {
    return pos[0] * vel[1] - pos[1] * vel[0];
  }

  /** Gravitational acceleration [ax, ay] at position pos */
  _accel(pos) {
    const r3 = Math.pow(pos[0] ** 2 + pos[1] ** 2, 1.5);
    return [-this.GM * pos[0] / r3, -this.GM * pos[1] / r3];
  }

  /**
   * Integrate for nOrbits. Returns energy error |ΔE/E| at each orbit crossing.
   * @param {number} nOrbits
   * @returns {{ energyErrors: number[], angMomErrors: number[] }}
   */
  integrateOrbits(nOrbits) {
    const T = this.period;
    const dt = this.dt;
    const E0 = this.energy;
    const stepsPerOrbit = Math.round(T / dt);

    let pos = [this.rPerihelion, 0];
    let vel = [0, this.vPerihelion];
    const L0 = this._angMomentum(pos, vel);
    let t = 0;

    const energyErrors = [];
    const angMomErrors = [];

    const accelFn = (x, _v, _t) => this._accel(x);

    for (let orbit = 0; orbit < nOrbits; orbit++) {
      for (let step = 0; step < stepsPerOrbit; step++) {
        if (this.integrator === 'verlet') {
          ({ x: pos, v: vel } = Integrators.verlet(accelFn, pos, vel, t, dt));
        } else {
          // RK4: treat as 4-state system [x, y, vx, vy]
          const f = ([x, y, vx, vy]) => {
            const r3 = Math.pow(x * x + y * y, 1.5);
            return [vx, vy, -this.GM * x / r3, -this.GM * y / r3];
          };
          const state = [...pos, ...vel];
          const next = Integrators.rk4(f, state, t, dt);
          pos = [next[0], next[1]];
          vel = [next[2], next[3]];
        }
        t += dt;
      }
      const E = this._energyFromState(pos, vel);
      energyErrors.push(Math.abs((E - E0) / E0));
      const L = this._angMomentum(pos, vel);
      angMomErrors.push(Math.abs(L - L0) / Math.abs(L0));
    }

    return { energyErrors, angMomErrors };
  }

  /**
   * Compute orbit trajectory for one orbit (for display).
   * @param {number} [nPoints=500]
   * @returns {{ x: number[], y: number[] }}
   */
  trajectory(nPoints = 500) {
    const T = this.period;
    const dt = T / nPoints;
    const accelFn = (x, _v, _t) => this._accel(x);
    let pos = [this.rPerihelion, 0];
    let vel = [0, this.vPerihelion];
    let t = 0;
    const xs = [pos[0]], ys = [pos[1]];
    for (let i = 0; i < nPoints; i++) {
      ({ x: pos, v: vel } = Integrators.verlet(accelFn, pos, vel, t, dt));
      t += dt;
      xs.push(pos[0]);
      ys.push(pos[1]);
    }
    return { x: xs, y: ys };
  }
}
