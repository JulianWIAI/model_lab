/**
 * MarkovBench — 2-state Markov chain with convergence explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { MarkovModel } from './MarkovModel.js';
import { MarkovView } from './MarkovView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class MarkovBench extends Bench {
  static meta = {
    id: 'markov-chains',
    title: 'Markov chains',
    navLabel: 'Markov chains',
    canvasLabel: 'Transition diagram and convergence plot for a 2-state Markov chain',
    level: 'university',
    keywords: [
      'Markov chain', 'transition matrix', 'stationary distribution', 'mixing time',
      'spectral gap', 'eigenvalue', 'stochastic process', 'probability',
    ],
    related: [],
  };

  static info = {
    formula:
      'π₀ = q/(p+q)   π₁ = p/(p+q)\n' +
      'λ₂ = 1 − p − q  (closed form)\n' +
      'TV(k) = |λ₂|^k · max(π₀,π₁)\n' +
      't_mix(ε) = min{k : TV(k) ≤ ε}',
    predict: [
      'Set p=q=0.5. What is λ₂? What does λ₂=0 mean for mixing speed?',
      'Set p=0.6, q=0.6 (p+q=1.2). What sign is λ₂? Does the chain still mix?',
      'Use p=0.3, q=0.4. After k=4 steps TV(4)≤0.01 — confirm in the readout.',
    ],
    breaks: [
      'Non-symmetric P: jacobiEigen requires symmetric input. Closed form used instead.',
      'Periodic chains (λ₂=−1): mixing time uses |λ₂|, not λ₂.',
      'For n>2 states: λ₂ has no simple closed form; power iteration used.',
    ],
    derive: [
      { text: 'Stationarity πP=π → π₀(1-p)+π₁q=π₀ → π₀=q/(p+q).' },
      { text: 'Char. poly of P: roots λ₁=1 (always), λ₂=1-p-q (closed form).' },
      { text: 'TV(k)=|λ₂|^k·max(π₀,π₁): exact formula for 2-state chains.' },
    ],
    research: {
      questions: [
        'What is the relationship between the spectral gap and the mixing time?',
        'How does "lazy" chain P\'=(I+P)/2 affect λ₂ and mixing?',
      ],
      challenge: 'Derive TV(k)=|λ₂|^k·max(π₀,π₁) from the spectral decomposition of P^k.',
      papers: [
        {
          authors: 'Levin, Peres & Wilmer',
          year: 2009,
          title: 'Markov Chains and Mixing Times',
          url: 'https://doi.org/10.1090/mbk/058',
        },
      ],
    },
    notePlaceholder: 'Why does λ₂ = 1-p-q determine the mixing speed?',
  };

  build() {
    this.model = new MarkovModel({ p: 0.3, q: 0.4 });
    this.markovView = new MarkovView(this.view);

    this.layout.setStageNote('λ₂ = 1-p-q (closed form, NOT jacobiEigen)');

    // p slider 0–1
    this.layout.addControl(new Slider({
      id: this.controlId('p'),
      label: 'p (0→1)',
      min: 0, max: 1, step: 0.01,
      value: this.model.p,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.p = v; },
    }));

    // q slider 0–1
    this.layout.addControl(new Slider({
      id: this.controlId('q'),
      label: 'q (1→0)',
      min: 0, max: 1, step: 0.01,
      value: this.model.q,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.q = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'pi',   label: 'π' },
      { key: 'lam2', label: 'λ₂' },
      { key: 'gap',  label: 'gap' },
      { key: 'trel', label: 't_rel' },
      { key: 'tmix', label: 't_mix(0.01)' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.markovView.draw(this.model);
    const { model } = this;
    const pi = model.stationary;

    this.readouts.set('pi',   pi ? `[${pi[0].toFixed(3)}, ${pi[1].toFixed(3)}]` : 'none');
    this.readouts.set('lam2', model.lambda2.toFixed(4));
    this.readouts.set('gap',  model.spectralGap.toFixed(4));
    this.readouts.set('trel', pi ? model.tRel.toFixed(2) : '∞');
    this.readouts.set('tmix', pi ? String(model.tMix(0.01)) : '∞');
  }
}
