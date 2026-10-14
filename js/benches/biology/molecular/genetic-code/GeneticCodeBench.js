/**
 * GeneticCodeBench — interactive codon wheel explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { GeneticCodeModel } from './GeneticCodeModel.js';
import { GeneticCodeView } from './GeneticCodeView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { CODONS, AMINO_ACIDS } from '../../../../data/geneticCode.js';

const BASES = ['U', 'C', 'A', 'G'];

export class GeneticCodeBench extends Bench {
  static meta = {
    id: 'genetic-code',
    title: 'The genetic code',
    navLabel: 'Genetic code',
    canvasLabel: 'Codon wheel — amino acid assignments for all 64 codons',
    isExplorer: true,
    level: 'intro',
    keywords: [
      'genetic code', 'codon', 'amino acid', 'synonymous', 'silent mutation',
      'missense', 'nonsense', 'degeneracy', 'wobble', 'codon wheel',
      'Phe', 'Leu', 'Ser', 'Tyr', 'Stop', 'Cys', 'Trp', 'translation',
    ],
    related: ['biology/central-dogma', 'biology/mendel'],
  };

  static info = {
    formula:
      '549 single-base mutations from 61 sense codons:\n' +
      '  silent=134  missense=392  nonsense=23\n' +
      '(Standard Genetic Code, NCBI Table 1)',
    predict: [
      'Which amino acid has the most synonymous codons (highest degeneracy)?',
      'Can a single-base change from Met (AUG) produce a Stop codon?',
      'Why are most synonymous mutations in the 3rd (wobble) position?',
    ],
    breaks: [
      'Only the Standard Genetic Code (Table 1). Mitochondrial and some organellar codes differ.',
      'Codon usage bias (some synonymous codons are translated faster) is not shown.',
      'Post-translational modifications and selenocysteine (UGA redefined) are not included.',
    ],
    derive: [
      { text: '64 codons (4³) encode 20 amino acids + Stop. The code is degenerate: multiple codons can specify the same amino acid.' },
      { text: 'Synonymous codons often differ only at the 3rd (wobble) base, where the ribosome is less stringent.' },
      { text: 'Of 549 possible single-base changes from sense codons, most are missense (392), many are silent (134), and few create a Stop (23).', formula: 'missense > silent ≫ nonsense' },
    ],
    research: {
      questions: [
        'Is the genetic code optimal? Compute the average chemical-property change per missense mutation and compare to random codes.',
        'Why do mitochondria use UGA for Trp instead of Stop?',
      ],
      challenge: 'Find all codons where every single-base substitution changes the amino acid (no synonymous neighbours).',
      papers: [
        { authors: 'F. H. C. Crick et al.', year: 1961, title: 'General Nature of the Genetic Code for Proteins', url: 'https://doi.org/10.1038/192227a0' },
        { authors: 'M. W. Nirenberg & J. H. Matthaei', year: 1961, title: 'The Dependence of Cell-Free Protein Synthesis in E. coli upon Naturally Occurring or Synthetic Polyribonucleotides' },
        { authors: 'F. H. C. Crick', year: 1966, title: 'Codon-Anticodon Pairing: The Wobble Hypothesis', url: 'https://doi.org/10.1016/s0022-2836(66)80037-2' },
      ],
    },
    notePlaceholder: 'Which codons have the most synonymous neighbours? What pattern do you see?',
  };

  build() {
    this.model = new GeneticCodeModel();
    this.codeView = new GeneticCodeView(this.view);

    // 1st base selector
    this._b1 = 'U';
    this._b2 = 'C';
    this._b3 = 'U';

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('b1'),
      label: '1st base',
      options: BASES.map((b) => ({ label: b, value: b })),
      value: 'U',
      onChange: (v) => { this._b1 = v; this._select(); },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('b2'),
      label: '2nd base',
      options: BASES.map((b) => ({ label: b, value: b })),
      value: 'C',
      onChange: (v) => { this._b2 = v; this._select(); },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('b3'),
      label: '3rd base',
      options: BASES.map((b) => ({ label: b, value: b })),
      value: 'U',
      onChange: (v) => { this._b3 = v; this._select(); },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'codon',    label: 'Codon' },
      { key: 'aa',       label: 'Amino acid' },
      { key: 'synonyms', label: 'Synonymous codons' },
      { key: 'silent',   label: 'Silent neighbours' },
    ]);
    this.layout.setReadouts(this.readouts);

    this._select();
  }

  _select() {
    this.model.selected = this._b1 + this._b2 + this._b3;
  }

  update(_dt) {}

  draw() {
    this.codeView.draw(this.model);

    const sel = this.model.selected;
    if (sel) {
      const aa = CODONS[sel] ?? '—';
      const aaEntry = AMINO_ACIDS.find((a) => a.abbrev3 === aa);
      const syns = this.model.synonymousMutations(sel);
      this.readouts.set('codon',    sel);
      this.readouts.set('aa',       aaEntry ? `${aa} (${aaEntry.name})` : aa);
      this.readouts.set('synonyms', syns.length > 0 ? syns.join(', ') : 'none');
      this.readouts.set('silent',   String(syns.length));
    }
  }
}
