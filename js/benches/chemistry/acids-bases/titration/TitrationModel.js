/**
 * TitrationModel — acid-base titration curves using exact charge balance.
 *
 * Strong acid/base: exact 3-case split.
 * Weak acid/strong base: solves charge balance via RootFinding.brent.
 *
 * Charge balance: [H⁺] + [Na⁺] = [A⁻] + [OH⁻]
 *   h + Cb·Vb/(Va+Vb) = Ca·Va/(Va+Vb) · Ka/(h+Ka) + Kw/h
 *
 * Kw = 1.012e-14 at 25 °C (NIST).
 * All concentrations in mol/L, volumes in mL, pH = -log10([H⁺]).
 *
 * References:
 *   NIST Chemistry WebBook: Kw = 1.012e-14 at 25°C.
 *   NIST pKa values: AcOH 4.756, NH4+ 9.246, H2CO3 6.352.
 */
import { RootFinding } from '../../../../core/RootFinding.js';

export class TitrationModel {
  static Kw = 1.012e-14; // at 25 °C (NIST)

  // NIST pKa values
  static PRESETS = Object.freeze({
    'Strong acid (HCl)': { acidType: 'strong', pKa: null },
    'Acetic acid (AcOH)': { acidType: 'weak', pKa: 4.756 },
    'Ammonium (NH₄⁺)': { acidType: 'weak', pKa: 9.246 },
    'Carbonic acid (H₂CO₃, 1st)': { acidType: 'weak', pKa: 6.352 },
  });

  constructor({
    acidType = 'strong',
    ca = 0.1,      // acid concentration, mol/L
    cb = 0.1,      // base concentration, mol/L
    va = 25,       // acid volume, mL
    pKa = null,    // null for strong acid
    preset = 'Strong acid (HCl)',
  } = {}) {
    this.acidType = acidType;
    this.ca = ca;
    this.cb = cb;
    this.va = va;
    this.pKa = pKa;
    this.preset = preset;
  }

  get Ka() {
    return this.pKa !== null ? Math.pow(10, -this.pKa) : null;
  }

  get equivalenceVolume() {
    return this.ca * this.va / this.cb; // mL
  }

  get halfEquivalenceVolume() {
    return this.equivalenceVolume / 2;
  }

  /**
   * pH at titrant volume vb (mL) using exact methods.
   */
  solve(vb) {
    const Kw = TitrationModel.Kw;
    const vTotal = this.va + vb; // mL (ratio only, units cancel)
    const cb_eff = this.cb * vb / vTotal; // mol/L equivalent
    const ca_eff = this.ca * this.va / vTotal;

    if (this.acidType === 'strong') {
      return this._solveStrong(ca_eff, cb_eff, Kw);
    } else {
      return this._solveWeak(ca_eff, cb_eff, this.Ka, Kw);
    }
  }

  _solveStrong(ca, cb, Kw) {
    // Excess [H+] or [OH-]
    const excess = ca - cb; // positive = excess acid
    let h;
    if (Math.abs(excess) < 1e-12) {
      h = Math.sqrt(Kw); // at equivalence
    } else if (excess > 0) {
      // Before equivalence: excess H+ (solve h² - excess·h - Kw = 0)
      h = (excess + Math.sqrt(excess * excess + 4 * Kw)) / 2;
    } else {
      // After equivalence: excess OH-
      const oh = -excess;
      const ohFull = (oh + Math.sqrt(oh * oh + 4 * Kw)) / 2;
      h = Kw / ohFull;
    }
    return -Math.log10(h);
  }

  _solveWeak(ca, cb, Ka, Kw) {
    // Charge balance: h + cb - ca·Ka/(h+Ka) - Kw/h = 0
    const f = (h) => h + cb - ca * Ka / (h + Ka) - Kw / h;
    // Bracket [1e-14, 10] in terms of h
    try {
      const h = RootFinding.brent(f, 1e-14, 10, 1e-12);
      return -Math.log10(Math.max(h, 1e-14));
    } catch {
      // Fallback: approximate
      return this._solveStrong(ca - cb * Ka / (cb + Ka), 0, Kw);
    }
  }

  /**
   * Generate titration curve with nPoints points.
   * Returns { volumes, pHs, dpH } where dpH is numerical derivative.
   */
  curve(nPoints = 200) {
    const vMax = this.equivalenceVolume * 1.8;
    const volumes = Array.from({ length: nPoints }, (_, i) => (i / (nPoints - 1)) * vMax);
    const pHs = volumes.map((vb) => this.solve(vb));
    // Numerical derivative dpH/dVb
    const dpH = pHs.map((_, i) => {
      if (i === 0 || i === nPoints - 1) return 0;
      return (pHs[i + 1] - pHs[i - 1]) / (volumes[i + 1] - volumes[i - 1]);
    });
    return { volumes, pHs, dpH };
  }

  /**
   * Indicator that changes colour near this pH.
   * Returns { name, pKaIn, color1, color2 }
   */
  indicator(pH) {
    const indicators = [
      { name: 'Methyl orange', pKaIn: 3.46, color1: '#e74c3c', color2: '#f39c12' },
      { name: 'Bromothymol blue', pKaIn: 7.10, color1: '#f39c12', color2: '#3498db' },
      { name: 'Phenolphthalein', pKaIn: 9.40, color1: 'transparent', color2: '#e91e8c' },
    ];
    // Return whichever pKaIn is closest to the equivalence pH
    const eqPH = this.solve(this.equivalenceVolume);
    return indicators.reduce((best, ind) =>
      Math.abs(ind.pKaIn - eqPH) < Math.abs(best.pKaIn - eqPH) ? ind : best
    );
  }
}
