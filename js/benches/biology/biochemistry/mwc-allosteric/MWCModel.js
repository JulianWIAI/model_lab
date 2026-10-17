/**
 * MWCModel — Monod-Wyman-Changeux two-state allosteric model.
 *
 * Y(alpha) = [alpha*(1+alpha)^{n-1} + L*c*alpha*(1+c*alpha)^{n-1}] / Q
 * Q = (1+alpha)^n + L*(1+c*alpha)^n
 *
 * Reference: Monod, Wyman & Changeux (1965) (cited, not fetched).
 */
import { RootFinding } from '../../../../core/RootFinding.js';

export class MWCModel {
  constructor({ n = 4, L = 100, c = 0.01, K_R = 1, alphaMax = 20 } = {}) {
    if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be integer >= 1');
    if (L <= 0) throw new RangeError('L must be > 0');
    if (c <= 0 || c > 1) throw new RangeError('c must be in (0, 1]');
    if (K_R <= 0) throw new RangeError('K_R must be > 0');
    this.n = n; this.L = L; this.c = c; this.K_R = K_R; this.alphaMax = alphaMax;
  }

  saturation(alpha) {
    if (alpha < 0) return 0;
    const { n, L, c } = this;
    const Q = Math.pow(1+alpha, n) + L * Math.pow(1+c*alpha, n);
    return (alpha*Math.pow(1+alpha,n-1) + L*c*alpha*Math.pow(1+c*alpha,n-1)) / Q;
  }

  rStateFraction(alpha) {
    const { n, L, c } = this;
    const Q = Math.pow(1+alpha, n) + L * Math.pow(1+c*alpha, n);
    return Math.pow(1+alpha, n) / Q;
  }

  enumeratedSaturation(alpha) {
    if (this.n > 12) throw new RangeError('enumeratedSaturation: n > 12 too slow');
    const { n, L, c } = this;
    let sumY = 0, sumQ = 0;
    function popcount(x) { let k=0; while(x){k+=x&1;x>>=1;} return k; }
    for (let state = 0; state < 2; state++) {
      for (let p = 0; p < (1<<n); p++) {
        const k = popcount(p);
        const w = state===0 ? Math.pow(alpha,k) : L*Math.pow(c*alpha,k);
        sumQ += w;
        sumY += (k/n) * w;
      }
    }
    return sumY / sumQ;
  }

  halfSaturationAlpha() {
    return RootFinding.brent(alpha => this.saturation(alpha) - 0.5, 1e-6, this.alphaMax, 1e-10);
  }

  hillCoeff() {
    const alpha_h = this.halfSaturationAlpha();
    const eps = alpha_h * 1e-4 + 1e-8;
    const Yp = this.saturation(alpha_h + eps);
    const Ym = this.saturation(alpha_h - eps);
    const dlogit = (Math.log(Yp/(1-Yp)) - Math.log(Ym/(1-Ym))) / (2*eps);
    return dlogit * alpha_h;
  }

  curve(alphaMax = this.alphaMax, nPoints = 200) {
    return Array.from({length: nPoints}, (_, i) => {
      const alpha = (alphaMax / (nPoints-1)) * i;
      return { alpha, Y: this.saturation(alpha), Rbar: this.rStateFraction(alpha) };
    });
  }
}
