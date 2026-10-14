/**
 * CentralDogmaModel — DNA → mRNA → protein with mutations and ribosome animation.
 *
 * Strand convention: dnaCoding is the non-template (sense) strand, 5′→3′, uppercase A/T/G/C.
 * mRNA sequence equals the coding strand with T→U.
 * Units: time in seconds; ribosomeCodonIndex advances 1 codon per 0.4 s.
 */
import { CODONS, AMINO_ACIDS } from '../../../../data/geneticCode.js';

export class CentralDogmaModel {
  // ribosomeSpeed: codons per second
  static RIBOSOME_SPEED = 2.5;

  constructor({ dnaCoding = 'ATGGTGCACCTGACTCCTGAGGAGAAGTCT' } = {}) {
    this.dnaCoding = dnaCoding.toUpperCase().replace(/[^ATGC]/g, '');
    this.ribosomeCodonIndex = -1; // -1 = before start
    this._time = 0;
    this._accumulator = 0;
  }

  // Template strand is the reverse complement of the coding strand (3′→5′ written 5′→3′)
  get templateStrand() {
    const comp = { A: 'T', T: 'A', G: 'C', C: 'G' };
    return this.dnaCoding.split('').reverse().map(b => comp[b] || b).join('');
  }

  // mRNA: same as coding strand with T→U
  get mrna() {
    return this.dnaCoding.replace(/T/g, 'U');
  }

  // Split mRNA into codons starting from position 0
  get codons() {
    const m = this.mrna;
    const result = [];
    for (let i = 0; i + 2 < m.length; i += 3) {
      result.push(m.slice(i, i + 3));
    }
    return result;
  }

  // Get amino acid abbreviation for a codon
  aminoAcidFor(codon) {
    return CODONS[codon] || '???';
  }

  // Translate: find first AUG, read triplets, stop at stop codon
  translate() {
    const m = this.mrna;
    const startIdx = m.indexOf('AUG');
    if (startIdx === -1) return [];
    const result = [];
    for (let i = startIdx; i + 2 < m.length; i += 3) {
      const codon = m.slice(i, i + 3);
      const aa = CODONS[codon];
      if (!aa || aa === 'Stop') break;
      result.push({ codon, aa });
    }
    return result;
  }

  // Apply a mutation, returns a NEW CentralDogmaModel
  mutate({ pos, type, base = 'A' }) {
    let dna = this.dnaCoding;
    if (type === 'substitution') {
      dna = dna.slice(0, pos) + base.toUpperCase() + dna.slice(pos + 1);
    } else if (type === 'insertion') {
      dna = dna.slice(0, pos) + base.toUpperCase() + dna.slice(pos);
    } else if (type === 'deletion') {
      dna = dna.slice(0, pos) + dna.slice(pos + 1);
    }
    return new CentralDogmaModel({ dnaCoding: dna });
  }

  // Compare this model's protein to mutant's protein
  classifyMutation(mutant) {
    const orig = this.translate();
    const mut = mutant.translate();
    // Frameshift: different length unless protein is longer due to removed stop codon
    if (Math.abs(orig.length - mut.length) > 1) return 'frameshift';
    // Check if length change is due to insertion/deletion causing reading frame shift
    if (mutant.dnaCoding.length !== this.dnaCoding.length) {
      // length difference implies frameshift (insertion or deletion)
      return 'frameshift';
    }
    // Same length proteins (substitution)
    let diffs = 0;
    const len = Math.min(orig.length, mut.length);
    for (let i = 0; i < len; i++) {
      if (orig[i].aa !== mut[i].aa) diffs++;
    }
    if (diffs === 0 && orig.length === mut.length) return 'silent';
    // Check for nonsense (premature stop)
    // If mut is shorter because of early stop
    if (mut.length < orig.length) return 'nonsense';
    if (diffs > 0) return 'missense';
    return 'silent';
  }

  // Advance ribosome animation
  step(dt) {
    this._time += dt;
    this._accumulator += dt;
    const period = 1 / CentralDogmaModel.RIBOSOME_SPEED; // seconds per codon
    while (this._accumulator >= period) {
      this._accumulator -= period;
      const protein = this.translate();
      if (this.ribosomeCodonIndex < protein.length) {
        this.ribosomeCodonIndex++;
      }
    }
  }

  reset() {
    this.ribosomeCodonIndex = -1;
    this._time = 0;
    this._accumulator = 0;
  }

  // Current codon being translated (null if before start or after protein)
  get currentCodon() {
    const protein = this.translate();
    if (this.ribosomeCodonIndex < 0 || this.ribosomeCodonIndex >= protein.length) return null;
    return protein[this.ribosomeCodonIndex];
  }

  // Presets
  static PRESETS = Object.freeze({
    'β-globin (first 20 codons)': 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTG',
    'Sickle-cell mutation (GAG→GTG at codon 7)': 'ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTG',
    'GFP start fragment': 'ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCC',
  });
}
