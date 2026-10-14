/**
 * GeneticCodeModel — explorer for the NCBI Standard Genetic Code (Table 1).
 *
 * Classifies every single-base substitution from each of the 61 sense codons
 * as silent (synonymous), missense (different amino acid) or nonsense (Stop).
 *
 * Data source: js/data/geneticCode.js (CODONS, AMINO_ACIDS)
 *   Source: NCBI Translation Table 1, https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi
 */
import { CODONS, AMINO_ACIDS } from '../../../../data/geneticCode.js';

/** All four RNA bases. */
const BASES = Object.freeze(['U', 'C', 'A', 'G']);

/** Quick lookup: abbrev3 → AMINO_ACIDS entry. */
const AA_MAP = new Map(AMINO_ACIDS.map((a) => [a.abbrev3, a]));

export class GeneticCodeModel {
  /** isExplorer = true: bench uses this as a reference table, not a simulation. */
  static isExplorer = true;

  constructor() {
    /** Currently selected codon string, or null. */
    this.selected = null;
  }

  /**
   * Returns all single-base-substitution neighbours of `codon` that encode
   * the same amino acid (synonymous mutations, excluding identity and Stop).
   * @param {string} codon  e.g. 'UCU'
   * @returns {string[]}  e.g. ['UCC','UCA','UCG']
   */
  synonymousMutations(codon) {
    const origAA = CODONS[codon];
    if (!origAA || origAA === 'Stop') return [];
    const result = [];
    for (let pos = 0; pos < 3; pos++) {
      for (const base of BASES) {
        if (base === codon[pos]) continue;
        const mut = codon.slice(0, pos) + base + codon.slice(pos + 1);
        if (CODONS[mut] === origAA) result.push(mut);
      }
    }
    return result;
  }

  /**
   * Classifies a single mutation.
   * @param {string} codon  source codon (must be a sense codon)
   * @param {string} mutant mutated codon
   * @returns {'silent'|'missense'|'nonsense'|'identity'|'invalid'}
   */
  classifyMutation(codon, mutant) {
    const origAA = CODONS[codon];
    const mutAA  = CODONS[mutant];
    if (!origAA || !mutAA) return 'invalid';
    if (codon === mutant) return 'identity';
    if (mutAA === origAA)  return 'silent';
    if (mutAA === 'Stop')  return 'nonsense';
    return 'missense';
  }

  /**
   * Counts silent, missense and nonsense mutations across all 61 sense codons
   * (61 codons × 3 positions × 3 alternative bases = 549 total).
   * @returns {{ silent: number, missense: number, nonsense: number, total: number }}
   */
  static countMutations() {
    let silent = 0, missense = 0, nonsense = 0;
    const senseCodons = Object.keys(CODONS).filter((c) => CODONS[c] !== 'Stop');
    for (const codon of senseCodons) {
      for (let pos = 0; pos < 3; pos++) {
        for (const base of BASES) {
          if (base === codon[pos]) continue;
          const mut = codon.slice(0, pos) + base + codon.slice(pos + 1);
          const origAA = CODONS[codon];
          const mutAA  = CODONS[mut];
          if (mutAA === origAA)  silent++;
          else if (mutAA === 'Stop') nonsense++;
          else missense++;
        }
      }
    }
    return { silent, missense, nonsense, total: silent + missense + nonsense };
  }

  /**
   * Returns the codon wheel structure grouped by 1st → 2nd → 3rd base.
   * Useful for the concentric-ring view.
   * @returns {Object}  nested map: base1 → base2 → [{ codon, aa, color }]
   */
  codonWheel() {
    const wheel = {};
    for (const b1 of BASES) {
      wheel[b1] = {};
      for (const b2 of BASES) {
        wheel[b1][b2] = [];
        for (const b3 of BASES) {
          const codon = b1 + b2 + b3;
          const aa    = CODONS[codon];
          const entry = AA_MAP.get(aa);
          wheel[b1][b2].push({
            codon,
            aa,
            color: entry ? entry.color : '#cccccc',
          });
        }
      }
    }
    return wheel;
  }

  /** Amino acid info (color etc.) for a given abbrev3, or null. */
  aaInfo(abbrev3) {
    return AA_MAP.get(abbrev3) ?? null;
  }
}
