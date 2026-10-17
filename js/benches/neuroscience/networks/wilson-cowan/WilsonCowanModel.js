/**
 * WilsonCowanModel — excitatory-inhibitory neural population dynamics.
 *
 * tau_E dE/dt = -E + (1 - r_E*E) * S(w_EE*E - w_EI*I + P_E)
 * tau_I dI/dt = -I + (1 - r_I*I) * S(w_IE*E - w_II*I + P_I)
 *
 * Reference: Wilson & Cowan (1972) (cited, not fetched).
 */
import { Integrators } from '../../../../core/Integrators.js';

export class WilsonCowanModel {
  constructor({
    wEE = 12, wEI = 4, wIE = 13, wII = 11,
    tauE = 1, tauI = 1, PE = -2, PI = -3.5,
    rE = 0, rI = 0, kappa = 1, thetaS = 4,
  } = {}) {
    Object.assign(this, { wEE, wEI, wIE, wII, tauE, tauI, PE, PI, rE, rI, kappa, thetaS });
  }

  sigmoid(x)      { return 1 / (1 + Math.exp(-this.kappa * (x - this.thetaS))); }
  sigmoidPrime(x) { const s = this.sigmoid(x); return this.kappa * s * (1 - s); }

  dEdt(E, I) { return (-E + (1 - this.rE * E) * this.sigmoid(this.wEE*E - this.wEI*I + this.PE)) / this.tauE; }
  dIdt(E, I) { return (-I + (1 - this.rI * I) * this.sigmoid(this.wIE*E - this.wII*I + this.PI)) / this.tauI; }

  jacobian(E, I) {
    const SE = this.sigmoidPrime(this.wEE*E - this.wEI*I + this.PE);
    const SI = this.sigmoidPrime(this.wIE*E - this.wII*I + this.PI);
    const sE = this.sigmoid(this.wEE*E - this.wEI*I + this.PE);
    const sI = this.sigmoid(this.wIE*E - this.wII*I + this.PI);
    return [
      [ (-1 + (1-this.rE*E)*this.wEE*SE - this.rE*sE) / this.tauE,
        (-(1-this.rE*E)*this.wEI*SE) / this.tauE ],
      [ ((1-this.rI*I)*this.wIE*SI) / this.tauI,
        (-1 - this.rI*sI - (1-this.rI*I)*this.wII*SI) / this.tauI ],
    ];
  }

  stability(E, I) {
    const J = this.jacobian(E, I);
    const tr  = J[0][0] + J[1][1];
    const det = J[0][0]*J[1][1] - J[0][1]*J[1][0];
    const disc = tr*tr - 4*det;
    let type;
    if (det < 0) type = 'saddle';
    else if (Math.abs(tr) < 1e-10 * Math.max(1, Math.abs(det))) type = 'hopf-point';
    else if (tr < 0) type = disc > 0 ? 'stable-node' : 'stable-spiral';
    else type = disc > 0 ? 'unstable-node' : 'unstable-spiral';
    return { tr, det, discriminant: disc, type };
  }

  fixedPoints() {
    const starts = [[0.001,0.001],[0.5,0.15],[0.98,0.48],[0.3,0.08],[0.7,0.3]];
    const fps = [];
    for (const [E0, I0] of starts) {
      let E = E0, I = I0;
      for (let k = 0; k < 500; k++) {
        const f1 = E - this.sigmoid(this.wEE*E - this.wEI*I + this.PE);
        const f2 = I - this.sigmoid(this.wIE*E - this.wII*I + this.PI);
        if (Math.abs(f1) < 1e-12 && Math.abs(f2) < 1e-12) break;
        const s1p = this.sigmoidPrime(this.wEE*E - this.wEI*I + this.PE);
        const s2p = this.sigmoidPrime(this.wIE*E - this.wII*I + this.PI);
        const J = [[1-this.wEE*s1p, this.wEI*s1p],[-this.wIE*s2p, 1+this.wII*s2p]];
        const d = J[0][0]*J[1][1] - J[0][1]*J[1][0];
        if (Math.abs(d) < 1e-15) break;
        E -= (J[1][1]*f1 - J[0][1]*f2) / d;
        I -= (J[0][0]*f2 - J[1][0]*f1) / d;
        E = Math.max(0, Math.min(1, E));
        I = Math.max(0, Math.min(1, I));
      }
      const f1 = E - this.sigmoid(this.wEE*E - this.wEI*I + this.PE);
      const f2 = I - this.sigmoid(this.wIE*E - this.wII*I + this.PI);
      if (Math.abs(f1) < 1e-8 && Math.abs(f2) < 1e-8) {
        const dup = fps.some(fp => Math.abs(fp.E-E)<1e-5 && Math.abs(fp.I-I)<1e-5);
        if (!dup) fps.push({E, I});
      }
    }
    return fps;
  }

  run(E0, I0, tMax, dt = 0.01) {
    const traj = [{t: 0, E: E0, I: I0}];
    let state = [E0, I0];
    let t = 0;
    const n = Math.round(tMax / dt);
    for (let k = 0; k < n; k++) {
      state = Integrators.rk4(([E,I]) => [this.dEdt(E,I), this.dIdt(E,I)], state, t, dt);
      state[0] = Math.max(0, Math.min(1, state[0]));
      state[1] = Math.max(0, Math.min(1, state[1]));
      t += dt;
      if (k % 10 === 0 || k === n - 1) traj.push({t, E: state[0], I: state[1]});
    }
    return traj;
  }

  nullclineE(nPoints = 200) {
    return Array.from({length: nPoints}, (_, k) => {
      const E = 0.001 + (0.998 / (nPoints-1)) * k;
      const logitE = Math.log(E/(1-E));
      const I = (this.wEE * E + this.PE - logitE/this.kappa - this.thetaS) / this.wEI;
      return { E, I };
    }).filter(p => p.I >= 0 && p.I <= 1);
  }

  nullclineI(nPoints = 200) {
    return Array.from({length: nPoints}, (_, k) => {
      const E = 0.001 + (0.998/(nPoints-1))*k;
      if (this.wII === 0) return { E, I: this.sigmoid(this.wIE*E + this.PI) };
      let lo=0, hi=1;
      for (let j=0; j<60; j++) {
        const mid=(lo+hi)/2;
        if (mid - this.sigmoid(this.wIE*E - this.wII*mid + this.PI) < 0) lo=mid; else hi=mid;
      }
      return { E, I: (lo+hi)/2 };
    });
  }
}
