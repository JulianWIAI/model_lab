/**
 * NernstCellModel — Nernst equation for electrochemical cells.
 *
 * Nernst equation:
 *   E = E° − (RT/nF) · ln Q
 *
 * Gibbs–cell relation:
 *   ΔG = −nFE
 *
 * Equilibrium constant:
 *   K = exp(nFE°/RT)
 *
 * Daniell cell: Zn(s)|Zn²⁺(aq)||Cu²⁺(aq)|Cu(s)
 *   Anode:   Zn → Zn²⁺ + 2e⁻     E°_anode  = −0.7618 V
 *   Cathode: Cu²⁺ + 2e⁻ → Cu     E°_cathode = +0.3419 V
 *   E°_cell = E°_cathode − E°_anode = 1.1037 V
 *   Q = [Zn²⁺] / [Cu²⁺]   (activity ratio at 1 atm)
 *
 * Standard reduction potentials:
 *   NIST WebBook fetch attempted (2026-10-15) for CAS C15763026 (Cu²⁺) and
 *   C23713490 (Zn²⁺) — both returned "not found in database". Fetch failed.
 *   Using secondary source values:
 *   Cu²⁺/Cu: E° = +0.3419 V
 *   Zn²⁺/Zn: E° = −0.7618 V
 *   Reference: Bard, Parsons & Jordan (1985). Standard Potentials in Aqueous Solution.
 *   IUPAC/Marcel Dekker. — not checked against primary source.
 *
 * R, F from NIST CODATA 2018 (js/data/constants.js).
 */
import { CONSTANTS } from '../../../../data/constants.js';

const R = CONSTANTS.R.value;
const F = CONSTANTS.F.value;

export const DANIELL_CELL = Object.freeze({
  name: 'Daniell cell  Zn|Zn²⁺||Cu²⁺|Cu',
  E_cathode:  0.3419,   // Cu²⁺/Cu (V); Bard et al. 1985 — NIST fetch failed 2026-10-15
  E_anode:   -0.7618,   // Zn²⁺/Zn (V); Bard et al. 1985 — NIST fetch failed 2026-10-15
  get E_standard() { return this.E_cathode - this.E_anode; },
  n: 2,
  source: 'Bard, Parsons & Jordan (1985) Standard Potentials in Aqueous Solution — not checked against primary source',
});

export class NernstCellModel {
  constructor({ E_standard = DANIELL_CELL.E_standard, n = DANIELL_CELL.n, T = 298.15, Q = 1 } = {}) {
    this.E_standard = E_standard;
    this.n = n;
    this.T = T;
    this.Q = Q;
  }

  E(T = this.T, Q = this.Q) {
    return this.E_standard - (R * T / (this.n * F)) * Math.log(Q);
  }

  get deltaG() {
    return -this.n * F * this.E();
  }

  get K() {
    return Math.exp(this.n * F * this.E_standard / (R * this.T));
  }

  curve(logQMin = -3, logQMax = 3, nPoints = 200) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const logQ = logQMin + (logQMax - logQMin) * i / (nPoints - 1);
      const Q = Math.pow(10, logQ);
      pts.push({ logQ, E: this.E(this.T, Q) });
    }
    return pts;
  }
}
