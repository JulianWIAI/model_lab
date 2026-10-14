/**
 * CentralDogmaBench — DNA → mRNA → protein with mutations.
 * Shows the central dogma: transcription and translation, with mutation types.
 */
import { Bench } from '../../../../core/Bench.js';
import { CentralDogmaModel } from './CentralDogmaModel.js';
import { CentralDogmaView } from './CentralDogmaView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ActionButton } from '../../../../ui/ActionButton.js';
import { el } from '../../../../ui/el.js';

export class CentralDogmaBench extends Bench {
  static meta = {
    id: 'central-dogma',
    title: 'Central dogma',
    navLabel: 'Central dogma',
    canvasLabel: 'DNA → mRNA → Protein',
    level: 'intro',
    keywords: [
      'DNA', 'mRNA', 'protein', 'transcription', 'translation', 'codon',
      'ribosome', 'mutation', 'substitution', 'frameshift', 'silent', 'missense',
      'nonsense', 'genetic code', 'amino acid', 'central dogma',
    ],
    related: ['biology/mendel', 'biology/enzyme-kinetics'],
  };

  static info = {
    formula: 'DNA (coding) → mRNA (T→U) → protein (AUG start, stop at UAA/UAG/UGA)',
    predict: [
      'How many amino acids does a 30-nucleotide mRNA encode?',
      'What happens to the protein when you delete one nucleotide?',
      'Why might changing the 3rd base of a codon have no effect?',
    ],
    breaks: [
      'This model uses only one reading frame (from first AUG). Real cells can have multiple ORFs.',
      'Post-translational modifications (phosphorylation, glycosylation) are not shown.',
      'Only the standard genetic code is used; mitochondria and some organisms use variants.',
    ],
    derive: [
      { text: 'The template strand is the complement of the coding strand, read 3′→5′ by RNA polymerase.' },
      { text: 'mRNA is synthesised 5′→3′ with U replacing T.', formula: 'coding: 5′ A T G … 3′  →  mRNA: 5′ A U G … 3′' },
      { text: 'Ribosomes read mRNA in non-overlapping triplets (codons), producing one amino acid per codon.' },
      { text: 'The genetic code is degenerate: most amino acids have 2–4 synonymous codons, enabling silent mutations.' },
    ],
    research: {
      questions: [
        'Why does the genetic code have 64 codons but only 20 amino acids + stop?',
        'What makes a mutation "synonymous" and are synonymous mutations truly neutral?',
      ],
      challenge: 'Extend the model to support two-codon start recognition (eukaryotic Kozak consensus).',
      papers: [
        { authors: 'F. Crick et al.', year: 1961, title: 'General nature of the genetic code for proteins' },
        { authors: 'M. Nirenberg & H. Matthaei', year: 1961, title: 'The dependence of cell-free protein synthesis in E. coli upon naturally occurring or synthetic polyribonucleotides' },
      ],
    },
    notePlaceholder: 'Note the mutation type and how the protein changes…',
  };

  build() {
    this.model = new CentralDogmaModel();
    this.dogmaView = new CentralDogmaView(this.view);

    // Preset selector
    const presetNames = Object.keys(CentralDogmaModel.PRESETS);
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Preset',
      options: presetNames.map((k) => ({ label: k.split(' ')[0], value: k })),
      value: presetNames[0],
      onChange: (v) => {
        this.model = new CentralDogmaModel({ dnaCoding: CentralDogmaModel.PRESETS[v] });
        this.dogmaView = new CentralDogmaView(this.view);
      },
    }));

    // Mutation type
    this.mutationType = 'substitution';
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('muttype'),
      label: 'Mutation type',
      options: [
        { label: 'Substitution', value: 'substitution' },
        { label: 'Insertion', value: 'insertion' },
        { label: 'Deletion', value: 'deletion' },
      ],
      value: 'substitution',
      onChange: (v) => { this.mutationType = v; },
    }));

    // Mutation position
    this.mutPos = 3;
    this.layout.addControl(new Slider({
      id: this.controlId('mutpos'),
      label: 'Mutation position',
      min: 0,
      max: 29,
      step: 1,
      value: 3,
      format: (v) => `base ${v}`,
      onInput: (v) => { this.mutPos = v; },
    }));

    // Apply mutation button
    this.layout.addAction(new ActionButton({
      label: 'Apply mutation',
      onClick: () => {
        const mutant = this.model.mutate({ pos: this.mutPos, type: this.mutationType, base: 'A' });
        const cls = this.model.classifyMutation(mutant);
        this.model = mutant;
        this.model.reset();
        this._lastMutationClass = cls;
      },
    }));

    this.layout.addAction(this.createPauseButton());
  }

  update(dt) {
    if (!this.paused) this.model.step(dt);
  }

  draw() {
    this.dogmaView.draw(this.model);
    this._updateReadouts();
  }

  _updateReadouts() {
    const current = this.model.currentCodon;
    const protein = this.model.translate();
    this.layout.setReadout('codon', current ? current.codon : '—');
    this.layout.setReadout('amino-acid', current ? current.aa : '—');
    this.layout.setReadout('protein-length', `${protein.length} AA`);
    if (this._lastMutationClass) {
      this.layout.setReadout('mutation', this._lastMutationClass);
    }
  }
}
