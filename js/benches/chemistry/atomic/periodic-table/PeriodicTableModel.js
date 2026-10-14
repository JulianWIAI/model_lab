/**
 * PeriodicTableModel — periodic table explorer.
 *
 * Holds 118-element dataset from js/data/elements.js.
 * Aufbau order: 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p
 *
 * Exceptions to Aufbau (verified from WebElements / NIST):
 *   Cr (Z=24): [Ar] 3d⁵ 4s¹ (not 3d⁴ 4s²)
 *   Cu (Z=29): [Ar] 3d¹⁰ 4s¹ (not 3d⁹ 4s²)
 *   Nb (Z=41): [Kr] 4d⁴ 5s¹
 *   Mo (Z=42): [Kr] 4d⁵ 5s¹
 *   Ru (Z=44): [Kr] 4d⁷ 5s¹
 *   Rh (Z=45): [Kr] 4d⁸ 5s¹
 *   Pd (Z=46): [Kr] 4d¹⁰ (not 4d⁸ 5s²)
 *   Ag (Z=47): [Kr] 4d¹⁰ 5s¹
 *   Pt (Z=78): [Xe] 4f¹⁴ 5d⁹ 6s¹
 *   Au (Z=79): [Xe] 4f¹⁴ 5d¹⁰ 6s¹
 *   (Lanthanides and actinides: stored as-is in data file)
 */
import { ELEMENTS, SOURCE } from '../../../../data/elements.js';

// Aufbau filling order: [n, l, label, capacity]
const AUFBAU_ORDER = [
  [1,0,'1s',2],[2,0,'2s',2],[2,1,'2p',6],[3,0,'3s',2],[3,1,'3p',6],
  [4,0,'4s',2],[3,2,'3d',10],[4,1,'4p',6],[5,0,'5s',2],[4,2,'4d',10],
  [5,1,'5p',6],[6,0,'6s',2],[4,3,'4f',14],[5,2,'5d',10],[6,1,'6p',6],
  [7,0,'7s',2],[5,3,'5f',14],[6,2,'6d',10],[7,1,'7p',6],
];

// Exceptions: Z → electron configuration string
const EXCEPTIONS = Object.freeze({
  24: '[Ar] 3d⁵ 4s¹',
  29: '[Ar] 3d¹⁰ 4s¹',
  41: '[Kr] 4d⁴ 5s¹',
  42: '[Kr] 4d⁵ 5s¹',
  44: '[Kr] 4d⁷ 5s¹',
  45: '[Kr] 4d⁸ 5s¹',
  46: '[Kr] 4d¹⁰',
  47: '[Kr] 4d¹⁰ 5s¹',
  78: '[Xe] 4f¹⁴ 5d⁹ 6s¹',
  79: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹',
});

export class PeriodicTableModel {
  static isExplorer = true;

  constructor() {
    this.data = ELEMENTS;
    this.source = SOURCE;
    this.property = 'electronegativity'; // which property to colour by
    this.selected = null; // Z of selected element
  }

  /** Element by atomic number Z */
  byZ(z) {
    return this.data.find((e) => e.Z === z) || null;
  }

  /** Array of {Z, value} for the current property, nulls included */
  propertyValues() {
    return this.data.map((e) => ({ Z: e.Z, value: e[this.property] }));
  }

  /**
   * Aufbau electron configuration string for Z, checking exceptions first.
   * Returns string like "[Ar] 3d⁶ 4s²".
   * Output is sorted by (n, l) for conventional spectroscopic notation.
   */
  aufbauConfig(Z) {
    if (EXCEPTIONS[Z]) return EXCEPTIONS[Z];
    // Noble gas cores
    const nobles = [
      { Z: 2, sym: 'He' }, { Z: 10, sym: 'Ne' }, { Z: 18, sym: 'Ar' },
      { Z: 36, sym: 'Kr' }, { Z: 54, sym: 'Xe' }, { Z: 86, sym: 'Rn' },
    ];
    let coreZ = 0;
    let core = '';
    for (let i = nobles.length - 1; i >= 0; i--) {
      if (Z > nobles[i].Z) { coreZ = nobles[i].Z; core = `[${nobles[i].sym}] `; break; }
    }
    // Determine how many electrons the noble gas core uses per subshell
    // by "filling" the core first, then continue for the remaining electrons
    let tally = coreZ;
    let startIdx = 0;
    for (let i = 0; i < AUFBAU_ORDER.length; i++) {
      const [,, , cap] = AUFBAU_ORDER[i];
      if (tally <= 0) { startIdx = i; break; }
      const used = Math.min(tally, cap);
      tally -= used;
      if (tally === 0) { startIdx = i + 1; break; }
    }
    // Fill remaining electrons starting after the core subshells
    let remaining = Z - coreZ;
    const parts = [];
    for (let i = startIdx; i < AUFBAU_ORDER.length; i++) {
      if (remaining <= 0) break;
      const [n, l, label, cap] = AUFBAU_ORDER[i];
      const fill = Math.min(remaining, cap);
      remaining -= fill;
      const sup = fill.toString().split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
      parts.push({ n, l, label, sup });
    }
    // Sort by n then l for conventional spectroscopic notation (e.g. 3d before 4s)
    parts.sort((a, b) => a.n !== b.n ? a.n - b.n : a.l - b.l);
    return core + parts.map(p => `${p.label}${p.sup}`).join(' ');
  }
}
