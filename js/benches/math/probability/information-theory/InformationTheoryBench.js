/**
 * InformationTheoryBench — Shannon information theory.
 */
import { Bench } from '../../../../core/Bench.js';
import { InformationTheoryModel } from './InformationTheoryModel.js';
import { InformationTheoryView } from './InformationTheoryView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';

export class InformationTheoryBench extends Bench {
  static meta = {
    id: 'information-theory',
    title: 'Information theory',
    navLabel: 'Information theory',
    canvasLabel: 'Binary entropy H₂(p) and probability distribution',
    level: 'university',
    keywords: [
      'Shannon', 'entropy', 'KL divergence', 'bits', 'channel capacity',
      'mutual information', 'binary entropy', 'Shannon-Hartley',
    ],
    related: ['math/central-limit', 'math/bayes'],
  };

  static info = {
    predict: [
      'A fair coin has entropy 1 bit. What is the entropy of a biased coin with p=0.9?',
      'If P=(½,½) and Q=(¼,¾), is KL(P‖Q) the same as KL(Q‖P)?',
      'Shannon-Hartley at SNR=63: C = B·log₂(64) = ? bits/s.',
    ],
    breaks: [
      'KL divergence is not symmetric: KL(P‖Q) ≠ KL(Q‖P) in general.',
      'If Q[i]=0 and P[i]>0, KL(P‖Q) = Infinity (P assigns positive probability where Q assigns zero).',
      'Shannon entropy assumes outcomes are independent. Correlation structure changes things.',
    ],
    derive: [
      { text: 'Shannon entropy (all log base 2 = bits):', formula: 'H(X) = -Σᵢ pᵢ·log₂(pᵢ)' },
      { text: 'Maximum entropy: uniform distribution H = log₂(n).', formula: 'Hmax = log₂(n)' },
      { text: 'KL divergence (relative entropy, asymmetric):', formula: 'D(P‖Q) = Σᵢ P[i]·log₂(P[i]/Q[i])' },
      { text: 'Shannon-Hartley theorem (additive white Gaussian noise channel):', formula: 'C = B·log₂(1+SNR)  bits/s' },
      { text: 'Binary entropy function:', formula: 'H₂(p) = -p·log₂p - (1-p)·log₂(1-p)' },
    ],
    research: {
      questions: [
        'Shannon (1948) defined capacity as the maximum mutual information. What is mutual information?',
        'Why does KL divergence appear in the variational autoencoder (VAE) loss function?',
      ],
      challenge: 'Compute the mutual information I(X;Y) = H(X) + H(Y) - H(X,Y) for a binary symmetric channel with crossover probability 0.1.',
      papers: [
        { authors: 'C. E. Shannon', year: 1948, title: 'A Mathematical Theory of Communication' },
      ],
    },
    notePlaceholder: 'Why is entropy maximised by the uniform distribution…',
  };

  static PRESETS = [
    { label: 'Fair coin',   probs: [0.5, 0.5] },
    { label: 'Biased',      probs: [0.9, 0.1] },
    { label: 'Uniform 4',   probs: [0.25, 0.25, 0.25, 0.25] },
    { label: 'Deterministic', probs: [1.0, 0.0] },
  ];

  build() {
    this.model = new InformationTheoryModel({ probs: [0.5, 0.5], B: 1, SNR: 63 });
    this.itView = new InformationTheoryView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'H',    label: 'H (bits)' },
      { key: 'Hmax', label: 'Hmax' },
      { key: 'C',    label: 'C/B (bits/Hz)' },
      { key: 'KL',   label: 'KL(P‖unif)' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Distribution',
      options: InformationTheoryBench.PRESETS.map(p => ({ label: p.label, value: p.label })),
      value: 'Fair coin',
      onChange: v => {
        const preset = InformationTheoryBench.PRESETS.find(p => p.label === v);
        if (preset) this.model = new InformationTheoryModel({ probs: [...preset.probs], B: this.model.B, SNR: this.model.SNR });
      },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('SNR'),
      label: 'SNR (linear)',
      min: 0, max: 1000, step: 1, value: 63,
      format: v => v.toFixed(0),
      onInput: v => { this.model = new InformationTheoryModel({ probs: this.model.probs, B: this.model.B, SNR: v }); },
    }));
  }

  update(_dt) {}

  draw() {
    this.itView.draw(this.model);
    const m = this.model;
    const n = m.probs.length;
    const H = m.entropy();
    const Hmax = m.hMax(n);
    const C = m.shannonHartley();
    const unif = new Array(n).fill(1/n);
    const KL = m.klDivergence(m.probs, unif);

    this.readouts.set('H',    H.toFixed(6));
    this.readouts.set('Hmax', Hmax.toFixed(6));
    this.readouts.set('C',    C.toFixed(4));
    this.readouts.set('KL',   isFinite(KL) ? KL.toFixed(6) : '∞');
  }
}
