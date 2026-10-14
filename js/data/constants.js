/**
 * Fundamental physical constants (CODATA 2018 recommended values).
 *
 * Source: NIST CODATA 2018, https://physics.nist.gov/cuu/Constants/index.html
 * Retrieved: 2024-01-01
 *
 * Units: SI base units (kg, m, s, A, K, mol, cd) unless noted.
 */

export const SOURCE = Object.freeze({
  name: 'NIST CODATA 2018 Fundamental Physical Constants',
  url: 'https://physics.nist.gov/cuu/Constants/index.html',
  retrieved: '2024-01-01',
});

/**
 * Frozen object of fundamental constants.
 * Keys are short names; each value has `value`, `unit`, and `uncertainty`.
 */
export const CONSTANTS = Object.freeze({
  /** Speed of light in vacuum.  c₀ = 299 792 458 m/s (exact, by definition). */
  c: { value: 299_792_458, unit: 'm/s', uncertainty: 0 },

  /** Planck constant.  h = 6.626 070 15 × 10⁻³⁴ J·s (exact, 2019 SI). */
  h: { value: 6.626_070_15e-34, unit: 'J·s', uncertainty: 0 },

  /** Reduced Planck constant.  ℏ = h / 2π. */
  hbar: { value: 1.054_571_817e-34, unit: 'J·s', uncertainty: 0 },

  /** Elementary charge.  e = 1.602 176 634 × 10⁻¹⁹ C (exact). */
  e: { value: 1.602_176_634e-19, unit: 'C', uncertainty: 0 },

  /** Boltzmann constant.  k_B = 1.380 649 × 10⁻²³ J/K (exact). */
  kB: { value: 1.380_649e-23, unit: 'J/K', uncertainty: 0 },

  /** Avogadro constant.  N_A = 6.022 140 76 × 10²³ mol⁻¹ (exact). */
  NA: { value: 6.022_140_76e23, unit: 'mol⁻¹', uncertainty: 0 },

  /** Molar gas constant.  R = N_A · k_B = 8.314 462 618 J/(mol·K) (exact). */
  R: { value: 8.314_462_618, unit: 'J/(mol·K)', uncertainty: 0 },

  /** Faraday constant.  F = N_A · e = 96 485.332 12 C/mol (exact, 2019 SI). */
  F: { value: 96_485.332_12, unit: 'C/mol', uncertainty: 0 },

  /** Gravitational constant.  G = 6.674 30 × 10⁻¹¹ N·m²/kg². */
  G: { value: 6.674_30e-11, unit: 'N·m²/kg²', uncertainty: 0.000_15e-11 },

  /** Standard acceleration of gravity.  g = 9.806 65 m/s² (exact, by convention). */
  g: { value: 9.806_65, unit: 'm/s²', uncertainty: 0 },

  /** Bohr radius.  a₀ = 5.291 772 109 03 × 10⁻¹¹ m. */
  a0: { value: 5.291_772_109_03e-11, unit: 'm', uncertainty: 0.000_000_000_80e-11 },

  /** Electron mass.  mₑ = 9.109 383 7015 × 10⁻³¹ kg. */
  me: { value: 9.109_383_7015e-31, unit: 'kg', uncertainty: 0.000_000_0028e-31 },

  /** Proton mass.  m_p = 1.672 621 923 69 × 10⁻²⁷ kg. */
  mp: { value: 1.672_621_923_69e-27, unit: 'kg', uncertainty: 0.000_000_000_51e-27 },

  /** Deuteron mass.  m_d = 3.343 583 7724 × 10⁻²⁷ kg. */
  md: { value: 3.343_583_7724e-27, unit: 'kg', uncertainty: 0.000_000_0010e-27 },

  /** Rydberg constant.  R_∞ = 1.097 373 156 816 0 × 10⁷ m⁻¹ (NIST CODATA 2018). */
  Rinf: { value: 1.097_373_156_816_0e7, unit: 'm⁻¹', uncertainty: 0.000_000_000_002_1e7 },
});
