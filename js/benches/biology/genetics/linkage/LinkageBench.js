/**
 * LinkageBench — genetic mapping functions (Haldane and Kosambi).
 */
import { Bench } from '../../../../core/Bench.js';
import { LinkageModel } from './LinkageModel.js';
import { LinkageView } from './LinkageView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class LinkageBench extends Bench {
  static meta = {
    id: 'linkage',
    title: 'Genetic linkage',
    navLabel: 'Linkage',
    canvasLabel: 'Haldane and Kosambi mapping functions — M vs θ and LOD score',
    level: 'university',
    keywords: [
      'linkage', 'Haldane', 'Kosambi', 'recombination frequency', 'genetic distance',
      'Morgans', 'centimorgans', 'LOD score', 'interference', 'mapping function',
      'chromosome', 'meiosis', 'crossover',
    ],
    related: ['biology/mendel', 'biology/hardy-weinberg'],
  };

  static info = {
    formula:
      'Haldane: M = −0.5·ln(1−2θ)   θ = 0.5·(1−e^(−2M))\n' +
      'Kosambi: M = 0.25·ln((1+2θ)/(1−2θ))   θ = 0.5·tanh(2M)\n' +
      'LOD = log₁₀[θᴿ·(1−θ)ᴾ / 0.5ᴺ]   (significant: LOD ≥ 3)',
    predict: [
      'At θ=0.1, does Haldane or Kosambi give a larger map distance? Why?',
      'If two loci are on different chromosomes (θ=0.5), what is the LOD score?',
      'How many offspring are needed to get LOD ≥ 3 for θ=0.1?',
    ],
    breaks: [
      'Both functions assume constant recombination along the chromosome (no hotspots).',
      'Haldane assumes Poisson-distributed crossovers (no interference). Kosambi models positive interference but uses a fixed functional form.',
      'The LOD method assumes a single family; heterogeneity (different θ in different families) is not modelled.',
    ],
    derive: [
      { text: 'Haldane derivation: crossovers Poisson-distributed; probability of ≥1 crossover in length M.', formula: 'θ = 0.5·(1 − e^(−2M))' },
      { text: 'Kosambi adds an interference term making adjacent crossovers less likely.', formula: 'θ = 0.5·tanh(2M)' },
      { text: 'LOD is a log-likelihood ratio test comparing linkage at θ to free recombination at θ=0.5.', formula: 'LOD = log₁₀[L(θ)/L(0.5)]' },
    ],
    research: {
      questions: [
        'Is Kosambi always better than Haldane? Under what crossover distribution would Haldane be exact?',
        'How do modern genetic maps (based on SNP genotyping) estimate θ in large pedigrees?',
      ],
      challenge: 'Find θ_MLE numerically: maximise log L(θ) = R·ln(θ) + P·ln(1−θ) and verify it equals R/N.',
      papers: [
        { authors: 'J. B. S. Haldane', year: 1919, title: 'The combination of linkage values, and the calculation of distances between the loci of linked factors', url: 'https://doi.org/10.1007/BF02983270' },
        { authors: 'D. D. Kosambi', year: 1944, title: 'The estimation of map distances from recombination values', url: 'https://doi.org/10.1007/BF02982626' },
        { authors: 'N. E. Morton', year: 1955, title: 'Sequential tests for the detection of linkage', url: 'https://doi.org/10.1093/oxfordjournals.jhered.a106695' },
      ],
    },
    notePlaceholder: 'At what θ do Haldane and Kosambi differ most? What does that tell you about interference?',
  };

  build() {
    this.model = new LinkageModel({ theta: 0.1 });
    this.linkView = new LinkageView(this.view);

    this.layout.addControl(new Slider({
      id: this.controlId('theta'),
      label: 'θ (recombination freq)',
      min: 0.01,
      max: 0.49,
      step: 0.01,
      value: 0.1,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.theta = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('N'),
      label: 'Offspring N',
      min: 10,
      max: 500,
      step: 10,
      value: 100,
      format: (v) => String(v),
      onInput: (v) => {
        const R = Math.round(this.model.theta * v);
        this.linkView.nRecombinant = R;
        this.linkView.nParental    = v - R;
      },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'theta',    label: 'θ' },
      { key: 'haldane',  label: 'Haldane (cM)' },
      { key: 'kosambi',  label: 'Kosambi (cM)' },
      { key: 'diff',     label: 'H − K (cM)' },
      { key: 'lod',      label: 'LOD score' },
    ]);
    this.layout.setReadouts(this.readouts);

    // Initialise view offspring counts
    this.linkView.nRecombinant = 10;
    this.linkView.nParental    = 90;
  }

  update(_dt) {}

  draw() {
    this.linkView.draw(this.model);

    const th = this.model.theta;
    const hM = this.model.haldane(th) * 100;
    const kM = this.model.kosambi(th) * 100;
    const lod = this.model.lodScore(this.linkView.nParental, this.linkView.nRecombinant, th);

    this.readouts.set('theta',   th.toFixed(3));
    this.readouts.set('haldane', isFinite(hM) ? hM.toFixed(3) : '∞');
    this.readouts.set('kosambi', isFinite(kM) ? kM.toFixed(3) : '∞');
    this.readouts.set('diff',    isFinite(hM - kM) ? (hM - kM).toFixed(3) : '—');
    this.readouts.set('lod',     isFinite(lod) ? lod.toFixed(3) : '—');
  }
}
