/**
 * PCRBench — polymerase chain reaction kinetics with plateau model.
 */
import { Bench } from '../../../../core/Bench.js';
import { PCRModel } from './PCRModel.js';
import { PCRView } from './PCRView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class PCRBench extends Bench {
  static meta = {
    id: 'pcr',
    title: 'PCR amplification',
    navLabel: 'PCR',
    canvasLabel: 'Copy number (log₁₀) vs cycle — plateau and ideal exponential',
    level: 'intro',
    keywords: [
      'PCR', 'polymerase chain reaction', 'Ct', 'threshold cycle',
      'amplification efficiency', 'exponential growth', 'plateau', 'logistic',
      'qPCR', 'quantitative PCR', 'copy number', 'template',
    ],
    related: ['biology/central-dogma', 'biology/enzyme-kinetics'],
  };

  static info = {
    formula:
      'Exponential:  N_n = N₀ · (1 + E)ⁿ\n' +
      'Plateau step: N_{n+1} = N_n + N_n · E · (1 − N_n/N_max)\n' +
      'Ct = min n : N_n ≥ threshold',
    predict: [
      'Start with N₀ = 1 and E = 1. What Ct do you expect for threshold 10⁹? Check before looking.',
      'If you have 100× more template (N₀ = 100), by how many cycles does Ct change?',
      'What happens to the curve shape when efficiency drops from 1.0 to 0.7?',
    ],
    breaks: [
      'The logistic plateau is a simplification; real saturation depends on polymerase and dNTP depletion, product re-annealing, and inhibitors.',
      'Primer specificity, secondary structures and template GC content can reduce effective efficiency — not modelled here.',
      'qPCR fluorescence is proportional to dsDNA (SYBR) or probe hydrolysis (TaqMan); the model shows copy number, not fluorescence signal.',
    ],
    derive: [
      { text: 'In each cycle, every template copy is denatured, annealed and extended once, giving a factor (1+E) per copy.', formula: 'N_n = N₀·(1+E)ⁿ' },
      { text: 'As product accumulates, reagents deplete and efficiency falls. A logistic correction caps growth at N_max.', formula: 'N_{n+1} = N_n + N_n·E·(1 − N_n/N_max)' },
      { text: 'Threshold cycle Ct: one log₁₀ increase in N₀ advances Ct by 1/log₁₀(1+E) cycles.', formula: 'Ct = log(threshold/N₀) / log(1+E)' },
    ],
    research: {
      questions: [
        'How does a 10 % drop in efficiency (E=0.9 vs E=1.0) change Ct for a 10-copy template?',
        'What is the ΔΔCt method for relative quantification, and what assumptions does it make?',
      ],
      challenge: 'Derive the exact relationship ΔCt = log(N0_ref/N0_sample) / log(1+E) for identical efficiencies.',
      papers: [
        { authors: 'R. Higuchi et al.', year: 1992, title: 'Simultaneous amplification and detection of specific DNA sequences', url: 'https://doi.org/10.1038/nbt0492-413' },
        { authors: 'M. W. Pfaffl', year: 2001, title: 'A new mathematical model for relative quantification in real-time RT-PCR', url: 'https://doi.org/10.1093/nar/29.9.e45' },
      ],
    },
    notePlaceholder: 'Note the cycle at which the plateau diverges from the exponential curve…',
  };

  build() {
    this.model = new PCRModel({
      N0: 1, efficiency: 1.0, nCycles: 40, threshold: 1e9, Nmax: 1e12,
    });
    this.pcrView = new PCRView(this.view);

    this.layout.addControl(new Slider({
      id: this.controlId('N0'),
      label: 'Initial copies N₀',
      min: 0,
      max: 6,
      step: 0.1,
      value: 0,
      format: (v) => `10${_sup(Math.round(v * 10) / 10)} ≈ ${Math.round(Math.pow(10, v))}`,
      onInput: (v) => { this.model.N0 = Math.pow(10, v); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('efficiency'),
      label: 'Efficiency E',
      min: 0.5,
      max: 1.0,
      step: 0.01,
      value: 1.0,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.efficiency = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('nCycles'),
      label: 'Cycles',
      min: 20,
      max: 45,
      step: 1,
      value: 40,
      format: (v) => String(v),
      onInput: (v) => { this.model.nCycles = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('threshold'),
      label: 'Threshold',
      min: 6,
      max: 12,
      step: 0.5,
      value: 9,
      format: (v) => `10${_sup(Math.round(v))}`,
      onInput: (v) => { this.model.threshold = Math.pow(10, v); },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'Ct',       label: 'Ct (cycles)' },
      { key: 'copies30', label: 'Copies @ cycle 30' },
      { key: 'fold',     label: 'Fold vs perfect E' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.pcrView.draw(this.model);

    const Ct = this.model.Ct;
    const c30Actual = this.model.copies(30);
    const c30Perfect = this.model.N0 * Math.pow(2, 30);
    const fold = c30Actual / c30Perfect;

    this.readouts.set('Ct',       Ct !== null ? String(Ct) : '> ' + this.model.nCycles);
    this.readouts.set('copies30', c30Actual.toExponential(3));
    this.readouts.set('fold',     fold.toFixed(4));
  }
}

function _sup(n) {
  const map = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return String(Math.round(n)).split('').map((d) => map[+d] ?? d).join('');
}
