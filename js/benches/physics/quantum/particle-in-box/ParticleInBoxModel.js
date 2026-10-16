/**
 * ParticleInBoxModel — 1D infinite square well (particle in a box).
 *
 * Energy levels:  E_n = n²π²ℏ²/(2 m_e L²)          [J]
 * Wavefunction:   ψ_n(x) = √(2/L) · sin(nπx/L)     [m^{-½}]
 * Expectation:    ⟨x⟩_n = L/2   (by symmetry)
 *                 ⟨x²⟩_n = L²(1/3 − 1/(2n²π²))
 *
 * Photon wavelength for n→n-1 transition:
 *   λ = hc / (E_n − E_{n-1})
 *
 * Constants (CODATA 2022 / exact SI 2019):
 *   h   = 6.626 070 15 × 10⁻³⁴ J·s  (exact)
 *   ℏ   = h / 2π                      (exact)
 *   m_e = 9.109 383 7139 × 10⁻³¹ kg  (CODATA 2022, fetched 2026-10-16)
 *   eV  = 1.602 176 634 × 10⁻¹⁹ J    (exact)
 *   c   = 299 792 458 m/s              (exact)
 *
 * Reference: Griffiths, D.J. (1995). Introduction to Quantum Mechanics §2.2.
 */

// Exact SI 2019 / CODATA 2022 constants
const H_JS   = 6.62607015e-34;      // J·s  exact SI 2019
const HBAR   = H_JS / (2 * Math.PI);// J·s
const ME     = 9.1093837139e-31;    // kg   CODATA 2022 — fetched 2026-10-16
const EV_J   = 1.602176634e-19;     // J    exact SI 2019
const C_SI   = 299792458;           // m/s  exact SI 1983

export class ParticleInBoxModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.L=1e-9]  box length in metres (default 1 nm)
   * @param {number} [opts.n=1]     quantum number (positive integer ≥ 1)
   */
  constructor({ L = 1e-9, n = 1 } = {}) {
    this.L = L;
    this.n = n;
  }

  set n(val) {
    if (!Number.isInteger(val) || val < 1) {
      throw new RangeError(`n must be a positive integer; got ${val}`);
    }
    this._n = val;
  }
  get n() { return this._n; }

  set L(val) {
    if (val <= 0) throw new RangeError(`L must be positive; got ${val}`);
    this._L = val;
  }
  get L() { return this._L; }

  /**
   * Energy of level n  [J].
   * E_n = n²π²ℏ²/(2 m_e L²)
   * @param {number} [nLevel]  defaults to this.n
   */
  energy(nLevel = this._n) {
    if (!Number.isInteger(nLevel) || nLevel < 1) {
      throw new RangeError(`n must be a positive integer; got ${nLevel}`);
    }
    return nLevel ** 2 * Math.PI ** 2 * HBAR ** 2 / (2 * ME * this._L ** 2);
  }

  /** Energy in eV for level n. */
  energyEV(nLevel = this._n) {
    return this.energy(nLevel) / EV_J;
  }

  /**
   * Photon wavelength [m] for downward transition n → n-1 (n ≥ 2).
   * λ = hc / (E_n − E_{n-1})
   * @param {number} [nLevel]  upper level, defaults to this.n
   */
  photonWavelength(nLevel = this._n) {
    if (nLevel < 2) throw new RangeError('photon emission requires n ≥ 2');
    const dE = this.energy(nLevel) - this.energy(nLevel - 1);
    return H_JS * C_SI / dE;
  }

  /**
   * Wavefunction ψ_n(x)  [m^{-½}].
   * @param {number} x   position in metres, 0 ≤ x ≤ L
   * @param {number} [nLevel]
   */
  psi(x, nLevel = this._n) {
    return Math.sqrt(2 / this._L) * Math.sin(nLevel * Math.PI * x / this._L);
  }

  /** Probability density |ψ_n(x)|²  [m⁻¹]. */
  probDensity(x, nLevel = this._n) {
    const p = this.psi(x, nLevel);
    return p * p;
  }

  /**
   * Probability of finding particle in [0, x]  (Simpson N=1000).
   * @param {number} xMax  upper limit in metres (clamped to [0, L])
   * @param {number} [nLevel]
   */
  cdf(xMax, nLevel = this._n) {
    const x = Math.min(Math.max(xMax, 0), this._L);
    const N = 1000;
    const h = x / N;
    let s = 0;
    for (let i = 0; i <= N; i++) {
      const w = (i === 0 || i === N) ? 1 : (i % 2 === 0 ? 2 : 4);
      s += w * this.probDensity(i * h, nLevel);
    }
    return s * h / 3;
  }

  /**
   * ⟨x²⟩_n = L²(1/3 − 1/(2n²π²))  [m²].
   * @param {number} [nLevel]
   */
  x2Expectation(nLevel = this._n) {
    return this._L ** 2 * (1 / 3 - 1 / (2 * nLevel ** 2 * Math.PI ** 2));
  }

  /**
   * Generate wavefunction and probability density curves for plotting.
   * @param {number} [nPoints=300]
   * @returns {{ x: number, psi: number, prob: number }[]}
   */
  curve(nPoints = 300) {
    const pts = [];
    for (let i = 0; i <= nPoints; i++) {
      const x = this._L * i / nPoints;
      pts.push({ x, psi: this.psi(x), prob: this.probDensity(x) });
    }
    return pts;
  }

  /** Export constants for tests and view labels. */
  static get constants() {
    return { H: H_JS, HBAR, ME, EV_J, C: C_SI };
  }
}
