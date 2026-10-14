/**
 * BufferModel — exact buffer capacity and species fractions for polyprotic acids.
 *
 * Species fractions (no Henderson–Hasselbalch shortcut):
 *   h  = 10^(-pH)
 *   D  = Σ_{k=0}^{n} h^(n-k) · Π_{j=1}^{k} Ka_j
 *   α_k = h^(n-k) · Π_{j=1}^{k} Ka_j / D
 *
 * Buffer capacity (exact variance-of-charge formula, Skoog et al. 2014 §16):
 *   β(pH) = 2.303 · (h + Kw/h + C · Var)
 *   Var   = Σ_k α_k·k² − (Σ_k α_k·k)²
 *
 * pKa sources (all aqueous, 25 °C, I→0 unless noted):
 *   Acetic acid pKa=4.756:
 *     Harned & Ehlers (1933) J. Am. Chem. Soc. 55, 2179–2193 (original EMF measurement).
 *     Tabulated in CRC Handbook of Chemistry and Physics (97th ed.) and Skoog et al. 2014 §16.
 *   Ammonium pKa=9.246:
 *     Bates & Pinching (1949) J. Am. Chem. Soc. 71, 1274–1283 (original EMF measurement).
 *     Tabulated in Skoog et al. 2014 §16.
 *   Phosphoric acid pKas=2.148, 7.198, 12.375:
 *     Martell & Smith, "Critical Stability Constants" Vol. 4 (1976) — authoritative
 *     compilation; exact table number unverified in this codebase.
 *     Values consistent with Skoog et al. 2014 §16 and Wikipedia (I→0).
 *     NIST SRD 46 (the standard secondary check) was discontinued as of 2026.
 *     pKa1 and pKa2 are well-established; pKa3 is less precisely determined
 *     (values in the range 12.35–12.40 appear in different sources).
 *   Carbonic acid pKas=6.352, 10.329:
 *     pKa1 (apparent, includes dissolved CO₂): Harned & Davis (1943) J. Am. Chem. Soc. 65, 2030.
 *     pKa2: Harned & Scholes (1941) J. Am. Chem. Soc. 63, 1706.
 *   Citric acid pKas=3.128, 4.761, 6.396:
 *     Martell & Smith, "Critical Stability Constants" Vol. 3 (1977) — authoritative
 *     compilation; exact table number unverified in this codebase.
 *     Values match the "extrapolated to I=0" figures cited in Wikipedia (ref 22)
 *     and are consistent with Skoog et al. 2014.
 *
 * Kw = 1.012e-14 at 25 °C (NIST Chemistry WebBook).
 */

/** Water autoionisation constant at 25 °C. */
const Kw = 1.012e-14;

/** Preset acid systems. */
export const PRESETS = Object.freeze([
  {
    name: 'Acetic acid',
    formula: 'CH₃COOH',
    pKas: [4.756],
    // Harned & Ehlers (1933) J. Am. Chem. Soc. 55, 2179; CRC Handbook 97th ed.
  },
  {
    name: 'Phosphoric acid',
    formula: 'H₃PO₄',
    pKas: [2.148, 7.198, 12.375],
    note: 'pKa source unverified — Martell & Smith table number not checked from physical copy',
    // Martell & Smith, Critical Stability Constants Vol. 4 (1976); table unverified in this codebase
    // pKa3 uncertainty: 12.35–12.40 across sources
  },
  {
    name: 'Carbonic acid',
    formula: 'H₂CO₃',
    pKas: [6.352, 10.329],
    // pKa1 apparent (CO₂(aq)+H₂O): Harned & Davis (1943) J. Am. Chem. Soc. 65, 2030
    // pKa2: Harned & Scholes (1941) J. Am. Chem. Soc. 63, 1706
  },
  {
    name: 'Citric acid',
    formula: 'C₆H₈O₇',
    pKas: [3.128, 4.761, 6.396],
    note: 'pKa source unverified — Martell & Smith table number not checked from physical copy',
    // Martell & Smith, Critical Stability Constants Vol. 3 (1977); table unverified in this codebase
    // Values consistent with NIST WebBook CAS 77-92-9 and Skoog et al. 2014
  },
  {
    name: 'Ammonium',
    formula: 'NH₄⁺',
    pKas: [9.246],
    // Bates & Pinching (1949) J. Am. Chem. Soc. 71, 1274; Skoog et al. 2014 §16
  },
]);

export class BufferModel {
  /**
   * @param {{ presetIndex?: number, C?: number }} options
   * @param presetIndex  index into PRESETS (default 0 = acetic acid)
   * @param C            total acid concentration, mol/L (default 0.1)
   */
  constructor({ presetIndex = 0, C = 0.1 } = {}) {
    this.presetIndex = presetIndex;
    this.C = C;       // mol/L
    this.pH = 7.0;    // current pH for single-point readouts
  }

  get preset() { return PRESETS[this.presetIndex]; }

  /** Ka values for the current preset. */
  get Kas() {
    return this.preset.pKas.map((pK) => Math.pow(10, -pK));
  }

  /**
   * Species fractions α_0 … α_n at a given pH.
   * α_k is the fraction with k protons removed.
   * @param {number} pH
   * @returns {Float64Array}  length = nPKa + 1, sums to 1
   */
  fractions(pH) {
    const h  = Math.pow(10, -pH);
    const Ka = this.Kas;
    const n  = Ka.length; // number of pKa values = number of dissociation steps
    // Compute cumulative products P_k = Π_{j=0}^{k-1} Ka[j]
    const P = new Float64Array(n + 1);
    P[0] = 1;
    for (let k = 1; k <= n; k++) P[k] = P[k - 1] * Ka[k - 1];

    // Denominator D = Σ_{k=0}^{n} h^(n-k) · P[k]
    let D = 0;
    for (let k = 0; k <= n; k++) D += Math.pow(h, n - k) * P[k];

    const alpha = new Float64Array(n + 1);
    for (let k = 0; k <= n; k++) {
      alpha[k] = (Math.pow(h, n - k) * P[k]) / D;
    }
    return alpha;
  }

  /**
   * Buffer capacity β at a given pH [mol/L/pH unit].
   * β = 2.303 · (h + Kw/h + C · Var)
   * Var = Σ_k α_k·k² − (Σ_k α_k·k)²   (variance of charge distribution)
   * @param {number} pH
   * @returns {number}
   */
  bufferCapacity(pH) {
    const h   = Math.pow(10, -pH);
    const alpha = this.fractions(pH);
    const n   = alpha.length - 1;

    let mean = 0, mean2 = 0;
    for (let k = 0; k <= n; k++) {
      mean  += alpha[k] * k;
      mean2 += alpha[k] * k * k;
    }
    const Var = mean2 - mean * mean;

    return 2.303 * (h + Kw / h + this.C * Var);
  }

  /**
   * Generates arrays for the full β(pH) curve and the fraction curves.
   * @param {number} nPoints  number of pH points (default 300)
   * @returns {{ pHs: Float64Array, betas: Float64Array, fractionCurves: Float64Array[] }}
   */
  capacityCurve(nPoints = 300) {
    const pHs   = new Float64Array(nPoints);
    const betas = new Float64Array(nPoints);
    const n     = this.preset.pKas.length;
    const fractionCurves = Array.from({ length: n + 1 }, () => new Float64Array(nPoints));

    for (let i = 0; i < nPoints; i++) {
      const pH = 0 + (14 / (nPoints - 1)) * i;
      pHs[i]   = pH;
      betas[i] = this.bufferCapacity(pH);
      const alpha = this.fractions(pH);
      for (let k = 0; k <= n; k++) fractionCurves[k][i] = alpha[k];
    }
    return { pHs, betas, fractionCurves };
  }
}
