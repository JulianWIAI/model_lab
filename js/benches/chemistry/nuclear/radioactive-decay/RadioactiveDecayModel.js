/**
 * RadioactiveDecayModel — radioactive decay with continuous and stochastic modes.
 *
 * Continuous (deterministic):
 *   λ = ln(2) / tHalf             [decay constant, s⁻¹ or yr⁻¹ depending on tUnit]
 *   N(t)  = N₀ · e^(−λ·t)     [atoms remaining]
 *   A(t)  = λ · N(t)           [activity, Bq = decays/s]  — only when tUnit = 's'
 *   age(f) = −ln(f) / λ        [time when N/N₀ = f]
 *
 * Stochastic:
 *   Each atom decays in step Δt with probability p = 1 − e^(−λ·Δt).
 *   Number of decays ~ Binomial(N, p); simulated by inverse-CDF binomial sampling.
 *   Uses seeded Random instance for reproducibility.
 *
 * Half-life presets — values from NUBASE2020 (Kondev et al. 2021, Chin. Phys. C 45:030001).
 * Fetched 2026-10-15 from https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt.
 *
 * Year conversion: Julian year = 3.15576×10⁷ s (= 365.25 × 86 400).
 * Molar mass Ra-226 = 226.0254 g/mol.
 * N_A = 6.022 140 76×10²³ mol⁻¹  (NIST CODATA 2018, exact since 2019 SI redefinition).
 *
 * C-14 note: NUBASE2020 tHalf = 5700 ± 30 y.  Godwin (1962, Nature 195:984) gives 5730 y.
 * Libby (1955) used 5568 y (radiocarbon convention, still required by many protocols).
 * The preset uses the NUBASE2020 value; all three are shown in the bench readout.
 */
import { Random } from '../../../../core/Random.js';
import { CONSTANTS } from '../../../../data/constants.js';

// Julian year in seconds (365.25 × 86400 exactly)
const JULIAN_YEAR_S = 3.15576e7;
// Avogadro's number from constants.js
const NA = CONSTANTS.NA.value; // 6.022 140 76e23 mol⁻¹

/**
 * Preset isotopes.  tHalf values from NUBASE2020 (fetched 2026-10-15).
 * @type {ReadonlyArray}
 */
export const ISOTOPES = Object.freeze([
  {
    id:     'c14',
    name:   'Carbon-14',
    symbol: '¹⁴C',
    tHalf:     5700,     // years (NUBASE2020; uncertainty 30 y)
    tHalf_unc: 30,       // years
    unit:   'y',
    tHalf_godwin: 5730,  // years (Godwin 1962, Cambridge physical standard)
    tHalf_libby:  5568,  // years (Libby 1955, radiocarbon dating convention)
    source: 'NUBASE2020 (Kondev et al. 2021), fetched 2026-10-15',
    // Molar mass for informational use only; not required for the decay equation
    M: 14.003241989,  // g/mol (AME2020)
  },
  {
    id:   'u238',
    name: 'Uranium-238',
    symbol: '²³⁸U',
    tHalf:     4.463e9,  // years (NUBASE2020; uncertainty 3e6 y)
    tHalf_unc: 3e6,      // years
    unit:   'y',
    source: 'NUBASE2020 (Kondev et al. 2021), fetched 2026-10-15',
    M: 238.0507882,   // g/mol
  },
  {
    id:   'i131',
    name: 'Iodine-131',
    symbol: '¹³¹I',
    tHalf:     8.0249,   // days (NUBASE2020; uncertainty 0.0006 d)
    tHalf_unc: 6e-4,     // days
    unit:   'd',
    source: 'NUBASE2020 (Kondev et al. 2021), fetched 2026-10-15',
    M: 130.9061246,   // g/mol
  },
  {
    id:   'ra226',
    name: 'Radium-226',
    symbol: '²²⁶Ra',
    tHalf:     1600,     // years (NUBASE2020; uncertainty 7 y)
    tHalf_unc: 7,        // years
    unit:   'y',
    // Curie anchor: 1 g Ra-226 ≈ 3.66e10 Bq
    //   N  = (1 g / 226.0254 g·mol⁻¹) × NA = 2.6643e21 atoms
    //   tHalf = 1600 y × 3.15576e7 s·y⁻¹ = 5.0492e10 s
    //   λ  = ln(2) / 5.0492e10 = 1.3729e-11 s⁻¹
    //   A  = λ × N = 3.658e10 Bq ≈ 3.66e10 Bq ≈ 0.988 Ci
    M: 226.0254,      // g/mol (standard atomic weight)
    source: 'NUBASE2020 (Kondev et al. 2021), fetched 2026-10-15',
  },
]);

export class RadioactiveDecayModel {
  /**
   * @param {object}  [opts]
   * @param {number}  [opts.N0=1000]          initial atom count (or mass in g if massMode)
   * @param {string}  [opts.isotopeId='c14']   id from ISOTOPES array
   * @param {'continuous'|'stochastic'} [opts.mode='continuous']
   * @param {number}  [opts.seed=42]           RNG seed for stochastic mode
   */
  constructor({ N0 = 1000, isotopeId = 'c14', mode = 'continuous', seed = 42 } = {}) {
    this.N0        = N0;
    this.isotopeId = isotopeId;
    this.mode      = mode;
    this._rng      = new Random(seed);

    // Stochastic state
    this._N  = N0;          // current atom count (stochastic mode)
    this._t  = 0;           // elapsed time in natural units (tHalf)
  }

  /** Preset entry for the current isotope. */
  get isotope() { return ISOTOPES.find(i => i.id === this.isotopeId); }

  /**
   * Half-life converted to seconds.
   * Julian year = 3.15576×10⁷ s.  Day = 86 400 s.
   */
  get halfLifeSI() {
    const { tHalf, unit } = this.isotope;
    if (unit === 'y') return tHalf * JULIAN_YEAR_S;
    if (unit === 'd') return tHalf * 86400;
    return tHalf; // already seconds
  }

  /** Decay constant λ = ln(2)/tHalf  [s⁻¹] */
  get lambda() { return Math.LN2 / this.halfLifeSI; }

  /** Decay constant in natural units (per tHalf): λ_nat = ln(2) */
  get lambdaNat() { return Math.LN2; }

  /**
   * N(t) — atoms remaining at time t (in units of tHalf).
   * @param {number} t  time in units of half-lives
   */
  N(t) { return this.N0 * Math.exp(-this.lambdaNat * t); }

  /**
   * Activity A(t) in Bq, valid only if we know the actual SI half-life.
   * @param {number} t  time in units of half-lives
   */
  A(t) { return this.lambda * this.N(t); }

  /**
   * Inverse: given N/N₀ fraction, return time in half-life units.
   * @param {number} fraction  e.g. 0.5 for one half-life
   */
  age(fraction) { return -Math.log(fraction) / this.lambdaNat; }

  /**
   * Activity of 1 gram of the isotope at t=0, in Bq.
   * Only valid for isotopes with known M (molar mass in g/mol).
   */
  activityPerGram() {
    const { M } = this.isotope;
    if (!M) return null;
    const N_per_gram = NA / M;                 // atoms per gram
    return this.lambda * N_per_gram;           // Bq per gram
  }

  /**
   * Curve for plotting: time (in half-life units) vs N and A.
   * @param {number} tHalfMax  time in half-lives (e.g. 4 for 4×tHalf)
   * @param {number} [nPoints=300]
   * @returns {{ t: number, N: number, A: number }[]}
   */
  curve(tHalfMax, nPoints = 300) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const t = tHalfMax * i / (nPoints - 1);
      pts.push({ t, N: this.N(t), A: this.A(t) });
    }
    return pts;
  }

  // ── Stochastic mode ────────────────────────────────────────────────────────

  /** Reset stochastic simulation to t=0, N=N0. */
  resetStochastic() {
    this._N = this.N0;
    this._t = 0;
  }

  /**
   * Advance the stochastic simulation by one step of Δt (in half-life units).
   * Decay probability per atom: p = 1 − e^(−λ_nat·Δt)
   * Binomial(N, p) sampled by inverse-CDF method (exact, no normal approximation).
   * @param {number} [dtHalf=0.01]  step size in units of tHalf
   * @returns {{ decays: number, N: number, t: number }}
   */
  stepStochastic(dtHalf = 0.01) {
    const p = 1 - Math.exp(-this.lambdaNat * dtHalf);  // per-atom decay prob
    const decays = this._binomial(this._N, p);
    this._N -= decays;
    if (this._N < 0) this._N = 0;
    this._t += dtHalf;
    return { decays, N: this._N, t: this._t };
  }

  /**
   * Sample from Binomial(n, p) using inverse-CDF method.
   * For large n with small p uses Poisson approximation (μ=np, np<30);
   * for all other cases iterates the exact binomial CDF.
   * @param {number} n
   * @param {number} p
   * @returns {number}
   */
  _binomial(n, p) {
    if (n <= 0 || p <= 0) return 0;
    if (p >= 1) return n;

    // For small np (<= 30) use Poisson approximation for speed
    const mu = n * p;
    if (mu < 30) {
      return this._poisson(mu);
    }

    // Otherwise use normal approximation with continuity correction
    // (CLT: B(n,p) ~ N(np, np(1-p)) for large np(1-p))
    const sigma = Math.sqrt(n * p * (1 - p));
    const raw   = Math.round(mu + sigma * this._rng.normalSeeded());
    return Math.max(0, Math.min(n, raw));
  }

  /**
   * Sample from Poisson(mu) by Knuth's algorithm.
   * @param {number} mu
   * @returns {number}
   */
  _poisson(mu) {
    const L = Math.exp(-mu);
    let k = 0;
    let prod = this._rng.next();
    while (prod > L) {
      k++;
      prod *= this._rng.next();
    }
    return k;
  }
}
