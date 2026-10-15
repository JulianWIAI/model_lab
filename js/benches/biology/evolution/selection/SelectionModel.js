/**
 * SelectionModel — breeder's equation with truncation selection.
 *
 * Breeder's equation: R = h²·S
 *   h² — narrow-sense heritability (0–1)
 *   S  — selection differential = i·σ
 *   i  — selection intensity (standardised selection differential)
 *   σ  — trait standard deviation
 *
 * Truncation selection: select top fraction p of a normally distributed trait.
 *   t = Φ⁻¹(1 − p)                        [truncation point]
 *   i = φ(t) / p                            [selection intensity]
 *   φ(t) = exp(−t²/2) / √(2π)             [standard normal PDF]
 *
 * Inverse normal CDF Φ⁻¹ approximation:
 *   Abramowitz & Stegun (1964) eq. 26.2.17 — rational approximation,
 *   |error| < 4.5 × 10⁻⁴ for all p ∈ (0,1).
 *
 * Reference:
 *   D. S. Falconer & T. F. C. Mackay (1996). Introduction to Quantitative Genetics,
 *   4th ed. Longman. Chapters 11–12.
 */

/** Standard normal PDF. */
function phi(t) {
  return Math.exp(-0.5 * t * t) / Math.sqrt(2 * Math.PI);
}

/**
 * Inverse normal CDF (Φ⁻¹) for p ∈ (0,1).
 * Abramowitz & Stegun (1964) approximation 26.2.17, |err| < 4.5e-4.
 */
function invNorm(p) {
  const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
  const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
  const sign = p < 0.5 ? -1 : 1;
  const q = p < 0.5 ? p : 1 - p;
  const t = Math.sqrt(-2 * Math.log(q));
  const num = c0 + c1 * t + c2 * t * t;
  const den = 1 + d1 * t + d2 * t * t + d3 * t * t * t;
  return sign * (t - num / den);
}

export class SelectionModel {
  constructor({ p = 0.2, h2 = 0.5, sigma = 1.0 } = {}) {
    this.p     = p;      // top fraction selected (0–1)
    this.h2    = h2;     // heritability
    this.sigma = sigma;  // trait standard deviation
  }

  /** Selection intensity i = φ(t)/p. */
  selectionIntensity() {
    const t = invNorm(1 - this.p);
    return phi(t) / this.p;
  }

  /** Selection differential S = i·σ. */
  selectionDifferential() {
    return this.selectionIntensity() * this.sigma;
  }

  /** Response to selection R = h²·S. */
  response() {
    return this.h2 * this.selectionDifferential();
  }

  /**
   * Intensity vs top-fraction curve.
   * @param {number} nPoints
   * @returns {Array<{p: number, i: number}>}
   */
  curve(nPoints = 200) {
    const pts = [];
    for (let j = 1; j < nPoints; j++) {
      const pv = j / nPoints;
      const t  = invNorm(1 - pv);
      pts.push({ p: pv, i: phi(t) / pv });
    }
    return pts;
  }
}
