/**
 * IdealGasModel — 3D particle simulation of an ideal gas.
 *
 * Simulation: N point-particles in a cubic box of side L.
 * Walls are elastic: perpendicular velocity component reverses on contact.
 * No inter-particle interactions (ideal gas).
 *
 * Reduced units: k_B = 1, m = 1.  All energies in units of [k_B · K].
 *
 * Key relations (verified by the simulation):
 *   P = N·k_B·T / V    (ideal gas law; V = L³)
 *   ⟨KE⟩ = (3/2)·k_B·T  (equipartition; T derived from ⟨KE⟩)
 *
 * Equations in SI (for display):
 *   k_B = 1.380 649 × 10⁻²³ J K⁻¹  (NIST CODATA 2018, exact by SI definition)
 *   P·V = N·k_B·T
 *   ⟨(1/2)m·v²⟩ = (3/2)·k_B·T
 *
 * Initial velocities: Maxwell–Boltzmann distribution for temperature T,
 * sampled via Box–Muller from a seeded PRNG (for reproducibility in tests).
 * Each component vx,vy,vz ~ N(0, √T) in reduced units.
 *
 * Reference (textbook):
 *   C. Kittel & H. Kroemer (1980). Thermal Physics, 2nd ed. W. H. Freeman.
 *   Chapter 3 (Boltzmann distribution and Helmholtz free energy).
 */

import { Random } from '../../../../core/Random.js';

export class IdealGasModel {
  /**
   * @param {{
   *   N?: number,
   *   L?: number,
   *   T?: number,
   *   seed?: number,
   * }} options
   */
  constructor({ N = 80, L = 1.0, T = 1.0, seed = 42 } = {}) {
    this.N  = N;
    this.L  = L;
    /** Temperature in reduced units (k_B = 1). */
    this.T  = T;
    this._rng = new Random(seed);

    /** Particle positions: [x0,y0,z0, x1,y1,z1, ...] */
    this._pos = new Float64Array(3 * N);
    /** Particle velocities: [vx0,vy0,vz0, ...] */
    this._vel = new Float64Array(3 * N);

    /** Running sum of |Δp| transferred to walls (for pressure estimate). */
    this._wallImpulse = 0;
    /** Accumulated simulation time for pressure measurement. */
    this._pressureTime = 0;

    this._init();
  }

  /** Initialise uniform positions and Maxwell–Boltzmann velocities. */
  _init() {
    const rng = this._rng;
    for (let i = 0; i < this.N; i++) {
      const b = 3 * i;
      this._pos[b    ] = rng.next() * this.L;
      this._pos[b + 1] = rng.next() * this.L;
      this._pos[b + 2] = rng.next() * this.L;
      // Each velocity component ~ N(0, √T) → ½m⟨v²⟩ = ½T per component
      const sigma = Math.sqrt(this.T);
      this._vel[b    ] = rng.normalSeeded() * sigma;
      this._vel[b + 1] = rng.normalSeeded() * sigma;
      this._vel[b + 2] = rng.normalSeeded() * sigma;
    }
    // Remove net centre-of-mass drift
    let sumVx = 0, sumVy = 0, sumVz = 0;
    for (let i = 0; i < this.N; i++) {
      sumVx += this._vel[3 * i    ];
      sumVy += this._vel[3 * i + 1];
      sumVz += this._vel[3 * i + 2];
    }
    const dVx = sumVx / this.N, dVy = sumVy / this.N, dVz = sumVz / this.N;
    for (let i = 0; i < this.N; i++) {
      this._vel[3 * i    ] -= dVx;
      this._vel[3 * i + 1] -= dVy;
      this._vel[3 * i + 2] -= dVz;
    }
    this._wallImpulse = 0;
    this._pressureTime = 0;
  }

  /**
   * Advance the simulation by dt (reduced-unit time).
   * @param {number} dt
   */
  step(dt) {
    for (let i = 0; i < this.N; i++) {
      const b = 3 * i;
      // Move
      this._pos[b    ] += this._vel[b    ] * dt;
      this._pos[b + 1] += this._vel[b + 1] * dt;
      this._pos[b + 2] += this._vel[b + 2] * dt;
      // Reflect at walls; accumulate impulse (|Δp| = 2|v_perp| per collision, m=1)
      for (let d = 0; d < 3; d++) {
        if (this._pos[b + d] < 0) {
          this._pos[b + d] = -this._pos[b + d];
          this._wallImpulse += 2 * Math.abs(this._vel[b + d]);
          this._vel[b + d]   = Math.abs(this._vel[b + d]);
        } else if (this._pos[b + d] > this.L) {
          this._pos[b + d] = 2 * this.L - this._pos[b + d];
          this._wallImpulse += 2 * Math.abs(this._vel[b + d]);
          this._vel[b + d]   = -Math.abs(this._vel[b + d]);
        }
      }
    }
    this._pressureTime += dt;
  }

  /**
   * Kinetic temperature (reduced units, k_B = 1) from equipartition:
   *   T_meas = (2/3) · mean_KE = (2/3) · (1/N) · Σ (1/2)v²
   * @returns {number}
   */
  get temperatureMeasured() {
    let sumKE = 0;
    for (let i = 0; i < this.N; i++) {
      const b = 3 * i;
      const v2 = this._vel[b] ** 2 + this._vel[b + 1] ** 2 + this._vel[b + 2] ** 2;
      sumKE += 0.5 * v2;
    }
    return (2 / 3) * (sumKE / this.N);
  }

  /**
   * Total kinetic energy.
   * @returns {number}
   */
  get totalKE() {
    let sumKE = 0;
    for (let i = 0; i < this.N; i++) {
      const b = 3 * i;
      sumKE += 0.5 * (this._vel[b] ** 2 + this._vel[b + 1] ** 2 + this._vel[b + 2] ** 2);
    }
    return sumKE;
  }

  /**
   * Ideal gas law: P = N·k_B·T / V = N·T / L³  (k_B=1, m=1).
   * Uses the current measured temperature.
   * @returns {number}
   */
  get pressureFormula() {
    return this.N * this.temperatureMeasured / (this.L ** 3);
  }

  /**
   * Pressure estimated from wall impulse / (total surface area × elapsed time).
   * Reset after each call.
   * @returns {number}
   */
  get pressureMeasured() {
    if (this._pressureTime < 1e-12) return 0;
    const area = 6 * this.L * this.L;   // 6 faces of a cube
    const P = this._wallImpulse / (area * this._pressureTime);
    return P;
  }

  /** Reset pressure accumulator. */
  resetPressure() {
    this._wallImpulse   = 0;
    this._pressureTime  = 0;
  }

  /**
   * Particle data for 2D rendering (XY projection).
   * @returns {Array<{x: number, y: number, z: number, speed: number}>}
   */
  get particles() {
    const result = [];
    for (let i = 0; i < this.N; i++) {
      const b = 3 * i;
      const vx = this._vel[b], vy = this._vel[b + 1], vz = this._vel[b + 2];
      result.push({
        x: this._pos[b    ],
        y: this._pos[b + 1],
        z: this._pos[b + 2],
        speed: Math.sqrt(vx * vx + vy * vy + vz * vz),
      });
    }
    return result;
  }

  /**
   * Reset to a new temperature, re-initialising velocities.
   * @param {number} T
   */
  setTemperature(T) {
    this.T = T;
    // Rescale velocities to match new temperature
    const T_now = this.temperatureMeasured;
    if (T_now > 0) {
      const scale = Math.sqrt(T / T_now);
      for (let i = 0; i < this._vel.length; i++) {
        this._vel[i] *= scale;
      }
    }
    this.resetPressure();
  }
}
