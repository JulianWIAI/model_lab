/**
 * WeberFechnerModel — Weber's law, Fechner's law, Stevens' power law.
 *
 * Weber's law:   JND(I) = k_W · I                  [just-noticeable difference]
 * Fechner's law: S_F(I) = (1/k_W) · ln(I / I₀)    [integrate Weber: dS = dI/(k_W·I)]
 * Stevens' law:  S_S(I) = k_S · I^n               [power law, empirically fitted]
 *
 * Fechner–Stevens relation:
 *   (I^n − 1)/n → ln(I) as n → 0   [L'Hôpital: limit of power-law family]
 *   Stevens subsumes Fechner ONLY in this limit (n→0); they are NOT equivalent.
 *
 * JND-stepping test (exact vs Fechner approximation):
 *   Steps to go from I₀ to I by unit-JND increments:
 *     Exact:   m_exact(I) = ln(I/I₀) / ln(1 + k_W)
 *     Fechner: m_Fechner(I) = ln(I/I₀) / k_W       [approximation ln(1+k_W) ≈ k_W]
 *     Ratio:   m_exact / m_Fechner = k_W / ln(1 + k_W) ≥ 1
 *   So Fechner UNDERcounts steps (m_Fechner < m_exact for k_W > 0).
 *
 * IMPORTANT: Modality values (k_W, n) are ILLUSTRATIVE AND UNVERIFIED.
 * They were assembled from memory and do not correspond to a fetched primary table.
 * Do NOT use for teaching without verifying against Gescheider (1997) or
 * Stevens (1957) primary sources.
 */

/**
 * Preset modalities — ILLUSTRATIVE VALUES ONLY, NOT VERIFIED.
 * @type {ReadonlyArray}
 */
export const MODALITIES = Object.freeze([
  {
    id:      'brightness',
    name:    'Visual brightness',
    kW:      0.079,  // Weber fraction — UNVERIFIED
    n:       0.33,   // Stevens exponent — UNVERIFIED
    kS:      1,
    note:    'UNVERIFIED illustrative value',
  },
  {
    id:      'loudness',
    name:    'Loudness (SPL)',
    kW:      0.048,  // UNVERIFIED; n for intensity (not SPL) ≈ 0.3
    n:       0.67,   // UNVERIFIED; reference variable matters
    kS:      1,
    note:    'UNVERIFIED; n for intensity ≈ 0.3, n for SPL ≈ 0.67',
  },
  {
    id:      'length',
    name:    'Line length',
    kW:      0.029,  // UNVERIFIED
    n:       1.00,   // UNVERIFIED; n=1 means linear
    kS:      1,
    note:    'UNVERIFIED illustrative value',
  },
  {
    id:      'shock',
    name:    'Electric shock',
    kW:      0.10,   // rough approximation; UNVERIFIED
    n:       3.5,    // UNVERIFIED; pain exponent varies widely
    kS:      1,
    note:    'UNVERIFIED; pain exponent varies widely by method and observer',
  },
]);

export class WeberFechnerModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.kW=0.079]   Weber fraction k_W
   * @param {number} [opts.n=0.33]     Stevens exponent
   * @param {number} [opts.kS=1]       Stevens scale constant
   * @param {number} [opts.I0=1]       reference intensity (threshold / anchor)
   * @param {number} [opts.IMin=1]     minimum intensity for curves
   * @param {number} [opts.IMax=100]   maximum intensity for curves
   */
  constructor({ kW = 0.079, n = 0.33, kS = 1, I0 = 1, IMin = 1, IMax = 100 } = {}) {
    this.kW   = kW;
    this.n    = n;
    this.kS   = kS;
    this.I0   = I0;
    this.IMin = IMin;
    this.IMax = IMax;
  }

  /** JND(I) = k_W · I  (Weber's law) */
  jnd(I) { return this.kW * I; }

  /**
   * Fechner sensation: S_F(I) = (1/k_W) · ln(I / I₀)
   * Defined only for I > 0 and I₀ > 0.
   */
  fechner(I) { return (1 / this.kW) * Math.log(I / this.I0); }

  /** Stevens sensation: S_S(I) = k_S · I^n */
  stevens(I) { return this.kS * Math.pow(I, this.n); }

  /**
   * Exact steps from I₀ to I by unit-JND increments.
   * Each step: I_{j+1} = I_j · (1 + k_W)
   * After m steps: I = I₀ · (1+k_W)^m → m = ln(I/I₀) / ln(1+k_W)
   */
  stepsExact(I) { return Math.log(I / this.I0) / Math.log(1 + this.kW); }

  /**
   * Fechner approximation of steps: m_F = ln(I/I₀) / k_W
   * (uses ln(1+k_W) ≈ k_W, valid for small k_W)
   */
  stepsFechner(I) { return Math.log(I / this.I0) / this.kW; }

  /**
   * Ratio m_exact / m_Fechner = k_W / ln(1+k_W) ≥ 1.
   * Fechner UNDERcounts steps (ratio > 1 means exact > Fechner).
   */
  stepRatio(I) { return this.stepsExact(I) / this.stepsFechner(I); }

  /**
   * Weber JND curve: [{I, jnd}] from IMin to IMax.
   * @param {number} [nPoints=200]
   */
  weberCurve(nPoints = 200) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const I = this.IMin + (this.IMax - this.IMin) * i / (nPoints - 1);
      pts.push({ I, jnd: this.jnd(I) });
    }
    return pts;
  }

  /**
   * Fechner sensation curve: [{I, S}] from IMin to IMax.
   * @param {number} [nPoints=200]
   */
  fechnerCurve(nPoints = 200) {
    const I0safe = Math.max(this.I0, this.IMin);
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const I = this.IMin + (this.IMax - this.IMin) * i / (nPoints - 1);
      if (I <= 0) continue;
      pts.push({ I, S: this.fechner(I) });
    }
    return pts;
  }

  /**
   * Stevens sensation curve: [{I, S}] from IMin to IMax.
   * @param {number} [nPoints=200]
   */
  stevensCurve(nPoints = 200) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const I = this.IMin + (this.IMax - this.IMin) * i / (nPoints - 1);
      pts.push({ I, S: this.stevens(I) });
    }
    return pts;
  }
}
