/**
 * PopulationCodingModel — Gaussian tuning curves, Poisson Fisher info, CRB.
 *
 * N neurons with Gaussian tuning; Poisson spike noise; population vector and MLE decoders.
 * Fisher info: I(theta) = T * sum_i [f_i'(theta)]^2 / f_i(theta)
 *
 * References: Seung & Sompolinsky (1993), Pouget et al. (2000) (cited, not fetched).
 */
import { Random } from '../../../../core/Random.js';

export class PopulationCodingModel {
  constructor({ N = 16, rMax = 50, sigma = 0.5, T = 0.1, seed = 42 } = {}) {
    if (N < 2) throw new RangeError('N must be >= 2');
    if (rMax <= 0) throw new RangeError('rMax must be > 0');
    if (sigma <= 0) throw new RangeError('sigma must be > 0');
    if (T <= 0) throw new RangeError('T must be > 0');
    if (rMax * T > 100) throw new RangeError('rMax*T > 100: Knuth Poisson diverges; use Normal approx');
    this.N = N; this.rMax = rMax; this.sigma = sigma; this.T = T;
    this._rng = new Random(seed);
    this._thetas = Array.from({length: N}, (_, i) => -Math.PI + (2 * Math.PI / N) * i);
  }

  tuning(i, theta) {
    const dt = theta - this._thetas[i];
    return this.rMax * Math.exp(-dt * dt / (2 * this.sigma * this.sigma));
  }

  _tuningPrime(i, theta) {
    return -(theta - this._thetas[i]) / (this.sigma * this.sigma) * this.tuning(i, theta);
  }

  fisherInfo(theta) {
    let I = 0;
    for (let i = 0; i < this.N; i++) {
      const fp = this._tuningPrime(i, theta);
      const f  = this.tuning(i, theta);
      if (f > 1e-15) I += this.T * fp * fp / f;
    }
    return I;
  }

  sigmaCRB(theta) { return 1 / Math.sqrt(this.fisherInfo(theta)); }

  _poisson(lambda) {
    const L = Math.exp(-lambda);
    let p = 1, k = 0;
    do { k++; p *= this._rng.next(); } while (p > L);
    return k - 1;
  }

  drawSpikes(theta) {
    return this._thetas.map((_, i) => this._poisson(this.T * this.tuning(i, theta)));
  }

  popVectorEstimate(spikes) {
    let sx = 0, sy = 0;
    for (let i = 0; i < this.N; i++) {
      sx += spikes[i] * Math.cos(this._thetas[i]);
      sy += spikes[i] * Math.sin(this._thetas[i]);
    }
    return Math.atan2(sy, sx);
  }

  _logLikelihood(theta, spikes) {
    let ll = 0;
    for (let i = 0; i < this.N; i++) {
      const f = this.tuning(i, theta);
      if (f > 1e-15) ll += spikes[i] * Math.log(this.T * f) - this.T * f;
    }
    return ll;
  }

  mlEstimate(spikes) {
    let bestTh = 0, bestLL = -Infinity;
    const nGrid = 100;
    for (let k = 0; k < nGrid; k++) {
      const th = -Math.PI + (2 * Math.PI / nGrid) * k;
      const ll = this._logLikelihood(th, spikes);
      if (ll > bestLL) { bestLL = ll; bestTh = th; }
    }
    return bestTh;
  }

  tuningCurves(nPoints = 200) {
    return Array.from({length: nPoints}, (_, k) => {
      const theta = -Math.PI + (2 * Math.PI / (nPoints-1)) * k;
      return { theta, fi: this._thetas.map((_, i) => this.tuning(i, theta)) };
    });
  }
}
