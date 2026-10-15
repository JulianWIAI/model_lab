/**
 * SignalDetectionModel — normal equal-variance signal detection theory (SDT).
 *
 * Math.erf does not exist in JavaScript; implemented from scratch:
 *   For |x| ≤ 3: Taylor series (non-alternating form, all terms positive)
 *     erf(x) = (2/√π) · Σ_{n=0}^{N} (-1)^n · x^{2n+1} / (n! · (2n+1))
 *     Computed as a Horner-like recurrence; iterate until relative change < 1e-14
 *   For |x| > 3: use erfc via the continued fraction (Laplace CF)
 *     erfc(x) = (e^{-x²}/√π) · CF   where CF = 1/(x + 1/(2x + 3/(2x + …)))
 *     Iterate 60 terms; for x > 3, result is < 1e-4 so precision is sufficient.
 *
 * Φ(x) = (1 + erf(x / √2)) / 2            [normal CDF]
 * Φ⁻¹(p) = RootFinding.brent(x → Φ(x) - p, -8, 8, 1e-12)  [probit via Brent]
 *
 * Equal-variance SDT (d′ = sensitivity, c = criterion from midpoint):
 *   H  (hit rate)       = Φ( d′/2 - c)
 *   FA (false-alarm)    = Φ(-d′/2 - c)
 *   d′ = Φ⁻¹(H) - Φ⁻¹(FA)
 *   β  = exp(d′ · c)                     [likelihood ratio; β=1 at c=0]
 *   c is measured FROM the midpoint d′/2 (unbiased when c=0)
 *
 * AUC (primary — parametric):
 *   AUC = Φ(d′ / √2)
 *
 * A′ (Grier 1971 — nonparametric approximation for H ≥ FA):
 *   A′ = ½ + (H − FA)(1 + H − FA) / (4H(1 − FA))
 *   For H < FA: A′ = ½ - (FA − H)(1 + FA − H) / (4FA(1 − H))
 *
 * ROC curve: sweep c from -4 to +4; collect {H, FA} pairs.
 */
import { RootFinding } from '../../../../core/RootFinding.js';

const SQRT2    = Math.SQRT2;       // √2
const INV_SQPI = 1 / Math.sqrt(Math.PI);  // 1/√π

export class SignalDetectionModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.d=1]   sensitivity d′ (≥ 0)
   * @param {number} [opts.c=0]   criterion offset from midpoint (c=0 → unbiased)
   */
  constructor({ d = 1, c = 0 } = {}) {
    this.d = d;  // d′
    this.c = c;  // criterion from midpoint
  }

  // ── erf / erfc / Φ ───────────────────────────────────────────────────────

  /**
   * erf(x) computed from scratch (Math.erf does not exist in JS).
   *
   * For |x| ≤ 3: Taylor series of erf.
   *   erf(x) = (2/√π) · Σ_{n=0}^∞ (-1)^n x^{2n+1} / (n! (2n+1))
   *   Equivalent recurrence: T_0 = x; T_{n+1} = T_n · (-x²) · n / ((n+1)(2n+3)) · (2n+1)
   *   Actually simpler: term_n = x^{2n+1} / (n! (2n+1)) with sign (-1)^n.
   *   Use recurrence: term_n = term_{n-1} · (-x²/n) · (2n-1)/(2n+1)
   *
   * For |x| > 3: erfc(x) via Laplace continued fraction evaluated back-to-front
   *   (Lentz / modified Lentz).  Then erf(x) = 1 - erfc(x).
   *
   * @param {number} x
   * @returns {number}
   */
  erf(x) {
    if (x === 0) return 0;
    const sign = x < 0 ? -1 : 1;
    const ax   = Math.abs(x);

    if (ax <= 3) {
      // Taylor series
      // erf(x) = (2/√π) · Σ (-1)^n x^{2n+1} / (n! (2n+1))
      // Recurrence: next_term = prev_term × (-x²) / (n+1) × (2n+1)/(2n+3)
      const x2 = ax * ax;
      let term = ax;       // n=0 term (before sign)
      let sum  = ax;       // s = term_0 (positive)
      for (let n = 1; n <= 150; n++) {
        term = term * (-x2) * (2 * n - 1) / (n * (2 * n + 1));
        const prev = sum;
        sum += term;
        if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
      }
      return sign * (2 * INV_SQPI) * sum;
    } else {
      // erfc(ax) via continued fraction (Laplace CF), back-substitution
      // erfc(x) = (e^{-x²}/√π) / (x + 0.5/(x + 1/(x + 1.5/(x + ...))))
      // Evaluated from the tail inward (60 terms is more than enough for x>3)
      const x2 = ax * ax;
      let cf = 0;
      for (let k = 60; k >= 1; k--) {
        cf = (k * 0.5) / (ax + cf);
      }
      cf = 1 / (ax + cf);
      const erfc = Math.exp(-x2) * INV_SQPI * cf;
      const erfVal = 1 - erfc;
      return sign * erfVal;
    }
  }

  /**
   * erfc(x) = 1 - erf(x).
   * @param {number} x
   */
  erfc(x) { return 1 - this.erf(x); }

  /**
   * Φ(x) — standard normal CDF.
   * @param {number} x
   */
  Phi(x) { return 0.5 * (1 + this.erf(x / SQRT2)); }

  /**
   * Φ⁻¹(p) — probit (inverse normal CDF) via RootFinding.brent.
   * @param {number} p  probability in (0, 1)
   */
  PhiInverse(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return  Infinity;
    return RootFinding.brent(x => this.Phi(x) - p, -8, 8, 1e-12);
  }

  // ── SDT quantities ────────────────────────────────────────────────────────

  /** Hit rate: H = Φ(d′/2 − c) */
  H()  { return this.Phi( this.d / 2 - this.c); }

  /** False-alarm rate: FA = Φ(−d′/2 − c) */
  FA() { return this.Phi(-this.d / 2 - this.c); }

  /** Likelihood ratio β = exp(d′ · c); β=1 when c=0 (unbiased). */
  beta() { return Math.exp(this.d * this.c); }

  /**
   * Parametric AUC (primary): AUC = Φ(d′ / √2).
   * This is the area under the ROC for equal-variance Gaussian SDT.
   */
  AUC() { return this.Phi(this.d / SQRT2); }

  /**
   * A′ (Grier 1971 nonparametric approximation).
   * For H ≥ FA: A′ = ½ + (H−FA)(1+H−FA) / (4H(1−FA))
   * For H < FA: A′ = ½ - (FA−H)(1+FA−H) / (4FA(1−H))
   */
  Aprime() {
    const H = this.H(), FA = this.FA();
    if (H >= FA) {
      if (H === 0 && FA === 0) return 0.5;
      if (FA === 1) return 0.5;
      return 0.5 + (H - FA) * (1 + H - FA) / (4 * H * (1 - FA));
    } else {
      if (FA === 0 && H === 0) return 0.5;
      if (H === 1) return 0.5;
      return 0.5 - (FA - H) * (1 + FA - H) / (4 * FA * (1 - H));
    }
  }

  /**
   * ROC curve: sweep c from -4 to +4, collect {H, FA} pairs.
   * c=-4 gives high hit rate (liberal); c=+4 gives low hit rate (conservative).
   * @param {number} [nPoints=200]
   * @returns {{ H: number, FA: number }[]}
   */
  rocCurve(nPoints = 200) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const cSweep = -4 + 8 * i / (nPoints - 1);
      const H  = this.Phi( this.d / 2 - cSweep);
      const FA = this.Phi(-this.d / 2 - cSweep);
      pts.push({ H, FA });
    }
    // Ensure endpoints are included (FA→1 at c=-4, FA→0 at c=+4)
    return pts;
  }
}
