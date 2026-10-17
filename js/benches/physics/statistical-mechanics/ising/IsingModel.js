/**
 * IsingModel — 2D square lattice Ising model with Metropolis dynamics.
 *
 * Hamiltonian: H = -J * sum_{<ij>} s_i * s_j  (nearest-neighbour, periodic BC)
 * Onsager critical temperature: T_c = 2J / [kB * ln(1 + sqrt(2))]
 *
 * Reference: Onsager (1944), Yang (1952) (cited, not fetched).
 */
import { Random } from '../../../../core/Random.js';

export class IsingModel {
  constructor({ L = 32, J = 1, kB = 1, T = 2.5, seed = 42, init = 'random' } = {}) {
    if (!Number.isInteger(L) || L < 3) throw new RangeError('L must be integer >= 3');
    if (J <= 0) throw new RangeError('J must be > 0');
    if (kB <= 0) throw new RangeError('kB must be > 0');
    if (T <= 0) throw new RangeError('T must be > 0');
    this.L = L; this.J = J; this.kB = kB; this.T = T;
    this._N = L * L;
    this._rng = new Random(seed);
    this.spins = new Int8Array(this._N);
    this.reset(init, seed);
  }

  reset(init = 'random', seed = null) {
    if (seed !== null) this._rng = new Random(seed);
    if (init === 'ordered') {
      this.spins.fill(1);
    } else {
      for (let i = 0; i < this._N; i++)
        this.spins[i] = this._rng.next() < 0.5 ? 1 : -1;
    }
    return this;
  }

  _idx(r, c) {
    return ((r % this.L + this.L) % this.L) * this.L + ((c % this.L + this.L) % this.L);
  }

  deltaE(row, col) {
    const s = this.spins[this._idx(row, col)];
    const nn = this.spins[this._idx(row-1,col)] + this.spins[this._idx(row+1,col)]
             + this.spins[this._idx(row,col-1)] + this.spins[this._idx(row,col+1)];
    return 2 * this.J * s * nn;
  }

  energy() {
    let E = 0;
    const L = this.L;
    for (let r = 0; r < L; r++)
      for (let c = 0; c < L; c++) {
        const s = this.spins[r*L+c];
        E -= this.J * s * this.spins[r*L+(c+1)%L];
        E -= this.J * s * this.spins[((r+1)%L)*L+c];
      }
    return E;
  }

  magnetisation() {
    let m = 0;
    for (let i = 0; i < this._N; i++) m += this.spins[i];
    return m / this._N;
  }

  sweep(n = 1) {
    const beta = 1 / (this.kB * this.T);
    const N = this._N;
    for (let sw = 0; sw < n; sw++) {
      for (let k = 0; k < N; k++) {
        const idx = Math.floor(this._rng.next() * N);
        const r = (idx / this.L) | 0, c = idx % this.L;
        const dE = this.deltaE(r, c);
        if (dE <= 0 || this._rng.next() < Math.exp(-beta * dE))
          this.spins[idx] = -this.spins[idx];
      }
    }
    return this;
  }

  get Tc() { return 2 * this.J / (this.kB * Math.log(1 + Math.SQRT2)); }
  get Kc() { return Math.log(1 + Math.SQRT2) / 2; }
}
