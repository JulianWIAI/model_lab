/**
 * SpectraModel — hydrogen and deuterium atomic spectral lines (Rydberg formula).
 *
 * Uses the reduced-mass Rydberg constant:
 *   R_H = R_∞ / (1 + mₑ/m_p)   [hydrogen]
 *   R_D = R_∞ / (1 + mₑ/m_d)   [deuterium]
 *
 * Wavelength in vacuum:
 *   1/λ_vac = R_X · (1/n₁² − 1/n₂²)   [m⁻¹]
 *   λ_vac (nm) = 1e9 / (R_X · (1/n₁² − 1/n₂²))
 *
 * Air correction (applies only when λ_vac > 200 nm):
 *   λ_air = λ_vac / n_air,   n_air = 1.000277
 *   Source: Allen, Astrophysical Quantities, 4th ed. (2000) §1.12
 *
 * References:
 *   NIST CODATA 2018: Rinf, me, mp, md, h, c
 *   Allen, C. W. (2000). Astrophysical Quantities, 4th ed. §1.12 (n_air)
 */
import { CONSTANTS } from '../../../../data/constants.js';

const { Rinf, me, mp, md, h, c } = {
  Rinf: CONSTANTS.Rinf.value, // 1.097 373 156 816 0 × 10⁷ m⁻¹
  me:   CONSTANTS.me.value,   // 9.109 383 7015 × 10⁻³¹ kg
  mp:   CONSTANTS.mp.value,   // 1.672 621 923 69 × 10⁻²⁷ kg
  md:   CONSTANTS.md.value,   // 3.343 583 7724 × 10⁻²⁷ kg
  h:    CONSTANTS.h.value,    // 6.626 070 15 × 10⁻³⁴ J·s
  c:    CONSTANTS.c.value,    // 299 792 458 m/s
};

/** Reduced-mass Rydberg constants [m⁻¹]. */
const R_H = Rinf / (1 + me / mp); // ≈ 1.09677 × 10⁷ m⁻¹
const R_D = Rinf / (1 + me / md); // ≈ 1.09707 × 10⁷ m⁻¹

/** Refractive index of standard dry air at 15 °C, 101 325 Pa. */
const N_AIR = 1.000277; // Allen (2000) §1.12

/** Visible range for colour tagging [nm]. */
const VIS_MIN = 380;
const VIS_MAX = 700;

/** Named series: lower level n₁ and display name. */
const SERIES = {
  lyman:    { n1: 1, name: 'Lyman',    region: 'UV' },
  balmer:   { n1: 2, name: 'Balmer',   region: 'Vis/UV' },
  paschen:  { n1: 3, name: 'Paschen',  region: 'IR' },
  brackett: { n1: 4, name: 'Brackett', region: 'IR' },
};

export class SpectraModel {
  /**
   * @param {{ isotope?: 'H'|'D', series?: string, showAir?: boolean }} options
   */
  constructor({ isotope = 'H', series = 'balmer', showAir = false } = {}) {
    this.isotope = isotope;   // 'H' or 'D'
    this.series  = series;    // 'lyman'|'balmer'|'paschen'|'brackett'|'all'
    this.showAir = showAir;   // apply air-wavelength correction where valid
    this.selected = null;     // { n1, n2 } of the selected line, or null
  }

  /** Reduced-mass Rydberg constant for the current isotope [m⁻¹]. */
  get R() { return this.isotope === 'D' ? R_D : R_H; }

  /**
   * Vacuum wavelength for transition n₂ → n₁  (n₂ > n₁).
   * λ_vac = 1e9 / (R · (1/n₁² − 1/n₂²))   [nm]
   */
  wavelengthVac(n1, n2) {
    if (n2 <= n1) return Infinity;
    return 1e9 / (this.R * (1 / (n1 * n1) - 1 / (n2 * n2)));
  }

  /**
   * Air wavelength [nm]; equals λ_vac / n_air only when λ_vac > 200 nm
   * (vacuum-UV cannot propagate in air without absorption).
   */
  wavelengthAir(n1, n2) {
    const lv = this.wavelengthVac(n1, n2);
    return lv > 200 ? lv / N_AIR : lv; // air correction only above 200 nm
  }

  /**
   * Returns all lines for a named series.
   * @param {string} name  'lyman'|'balmer'|'paschen'|'brackett'
   * @returns {{ n1: number, lines: Array<{n2,lambdaVac,lambdaAir,visible,color}> }}
   */
  seriesData(name) {
    const s = SERIES[name];
    if (!s) return { n1: 1, lines: [] };
    const n1 = s.n1;
    const lines = [];
    for (let n2 = n1 + 1; n2 <= n1 + 9; n2++) {
      const lambdaVac = this.wavelengthVac(n1, n2);
      const lambdaAir = this.wavelengthAir(n1, n2);
      const visible = lambdaVac >= VIS_MIN && lambdaVac <= VIS_MAX;
      lines.push({
        n2,
        lambdaVac,
        lambdaAir,
        visible,
        color: SpectraModel.wavelengthToColor(lambdaVac),
      });
    }
    return { n1, name: s.name, region: s.region, lines };
  }

  /**
   * Returns an array of all series data for use by the view.
   * @param {string} filter  'all' | series name
   */
  allSeriesData(filter = 'all') {
    const keys = filter === 'all' ? Object.keys(SERIES) : [filter];
    return keys.filter((k) => k in SERIES).map((k) => this.seriesData(k));
  }

  /**
   * Photon energy in eV for a given vacuum wavelength [nm].
   * E = hc / λ  (h in J·s, c in m/s, λ in m)
   */
  static photonEnergy(lambdaNm) {
    const eV = (h * c) / (lambdaNm * 1e-9) / 1.602_176_634e-19;
    return eV;
  }

  /**
   * Maps vacuum wavelength [nm] to an approximate sRGB hex colour.
   * Uses a piecewise linear fit to the CIE 1931 colour matching functions
   * (Bruton, D. 1996, "Approximate RGB Values for Visible Wavelengths").
   * Outside the visible range returns a grey.
   *
   * @param {number} nm  wavelength in nm
   * @returns {string}  '#rrggbb'
   */
  static wavelengthToColor(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) {
      r = -(nm - 440) / 60; g = 0; b = 1;
    } else if (nm >= 440 && nm < 490) {
      r = 0; g = (nm - 440) / 50; b = 1;
    } else if (nm >= 490 && nm < 510) {
      r = 0; g = 1; b = -(nm - 510) / 20;
    } else if (nm >= 510 && nm < 580) {
      r = (nm - 510) / 70; g = 1; b = 0;
    } else if (nm >= 580 && nm < 645) {
      r = 1; g = -(nm - 645) / 65; b = 0;
    } else if (nm >= 645 && nm <= 700) {
      r = 1; g = 0; b = 0;
    } else {
      return '#888888'; // outside visible
    }
    // Intensity fall-off at edges (Bruton 1996)
    let factor = 1;
    if (nm >= 380 && nm < 420) factor = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700 && nm <= 780) factor = 0.3 + 0.7 * (780 - nm) / 80;
    const toInt = (v) => Math.round(Math.max(0, Math.min(255, v * factor * 255)));
    return '#' + [r, g, b].map(toInt).map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  /** Convenience: names and n₁ values for all series. */
  static get SERIES() { return SERIES; }
}
