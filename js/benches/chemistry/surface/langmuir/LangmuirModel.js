/**
 * LangmuirModel — Langmuir adsorption isotherm.
 *
 * theta(p) = K*p / (1 + K*p)
 * Reference: Langmuir (1918) (cited, not fetched).
 */
import { Integrators } from '../../../../core/Integrators.js';

export class LangmuirModel {
  static R = 8.314462618;  // CODATA 2022 J/(mol*K)

  constructor({ K = 2.5, pMin = 0, pMax = 5 } = {}) {
    if (K <= 0) throw new RangeError('K must be > 0');
    this.K = K; this.pMin = pMin; this.pMax = pMax;
  }

  coverage(p) {
    if (p < 0) throw new RangeError('p must be >= 0');
    return this.K * p / (1 + this.K * p);
  }

  halfCoverageP() { return 1 / this.K; }

  langmuirPlot(nPoints = 200) {
    const pts = [];
    const dp = (this.pMax - this.pMin) / (nPoints-1);
    for (let i = 0; i < nPoints; i++) {
      const p = this.pMin + dp * i;
      if (p > 0) pts.push({ p, pOverTheta: p / this.coverage(p) });
    }
    return pts;
  }

  isothermCurve(nPoints = 200) {
    return Array.from({length: nPoints}, (_, i) => {
      const p = this.pMin + (this.pMax-this.pMin)/(nPoints-1)*i;
      return { p, theta: p >= 0 ? this.coverage(p) : 0 };
    });
  }

  vantHoffPoint(T, deltaH_ads, K_ref, T_ref, R = LangmuirModel.R) {
    if (T <= 0 || T_ref <= 0) throw new RangeError('T and T_ref must be > 0');
    return K_ref * Math.exp((deltaH_ads / R) * (1/T_ref - 1/T));
  }

  kineticRelaxationRate(p, k_ads, k_des) {
    return k_ads * p + k_des;
  }

  kineticCurve(theta0, p, k_ads, k_des, tMax, nPoints = 200) {
    const tau = 1 / this.kineticRelaxationRate(p, k_ads, k_des);
    const K_kin = k_ads / k_des;
    const theta_eq = K_kin * p / (1 + K_kin * p);
    const dt = tMax / (nPoints - 1);
    let theta = theta0;
    const pts = [{t: 0, theta, thetaExact: theta0}];
    for (let i = 1; i < nPoints; i++) {
      const t = dt * i;
      theta = Integrators.rk4(([th]) => [k_ads*p*(1-th) - k_des*th], [theta], (i-1)*dt, dt)[0];
      const thetaExact = theta_eq + (theta0 - theta_eq) * Math.exp(-t/tau);
      pts.push({t, theta, thetaExact});
    }
    return pts;
  }
}
