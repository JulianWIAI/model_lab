/**
 * CompetitiveExclusionBench — Lotka-Volterra 2-species competition.
 */
import { Bench } from '../../../../core/Bench.js';
import { CompetitiveExclusionModel } from './CompetitiveExclusionModel.js';
import { CompetitiveExclusionView } from './CompetitiveExclusionView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class CompetitiveExclusionBench extends Bench {
  static meta = {
    id: 'competitive-exclusion',
    title: 'Competitive exclusion',
    navLabel: 'Competitive exclusion',
    canvasLabel: 'Phase portrait for 2-species Lotka-Volterra competition',
    level: 'university',
    keywords: [
      'competitive exclusion', 'Lotka-Volterra', 'coexistence', 'nullclines',
      'carrying capacity', 'interspecific competition', 'ecology', 'Gause',
    ],
    related: [],
  };

  static info = {
    formula:
      'N₁* = (K₁−α₁₂K₂)/(1−α₁₂α₂₁)\n' +
      'N₂* = (K₂−α₂₁K₁)/(1−α₁₂α₂₁)\n' +
      'Coexist iff N₁*>0 AND N₂*>0',
    predict: [
      'Set α₁₂=0.5, α₂₁=0.5. Increase α₂₁ to 1.5. What happens to species 2?',
      'Set α₁₂=α₂₁=1. Where do nullclines intersect? Try ICs (10,20) and (20,10).',
      'Set α₁₂=α₂₁=1.5. Start near (90,10) and (10,90). Same outcome?',
    ],
    breaks: [
      'Real competition is indirect (shared resources), not direct coupling.',
      'Ignores spatial structure, stochasticity, environmental fluctuations.',
      'For n>2 species, conditions are much more complex.',
    ],
    derive: [
      { text: 'dN₁/dt=r₁N₁(1−N₁/K₁−α₁₂N₂/K₁). Nullcline: N₂=(K₁−N₁)/α₁₂.' },
      { text: 'Intersection of nullclines: N₁*=(K₁−α₁₂K₂)/(1−α₁₂α₂₁).' },
      { text: 'Coexistence: both N*>0. Requires K₁>α₁₂K₂ AND K₂>α₂₁K₁.' },
      { text: 'Jacobian τ<0, Δ>0 iff 1−α₁₂α₂₁>0 (same as coexistence condition).' },
    ],
    research: {
      questions: [
        'What is the mutual invasibility condition and how does it relate to coexistence?',
        'When can two species stably coexist if they share the exact same niche?',
      ],
      challenge: 'Derive the exact Jacobian eigenvalues at coexistence and show both are negative when α₁₂α₂₁<1.',
      papers: [
        {
          authors: 'G.F. Gause',
          year: 1934,
          title: 'The Struggle for Existence',
          url: 'https://doi.org/10.5962/bhl.title.4489',
        },
        {
          authors: 'G. Hardin',
          year: 1960,
          title: 'The competitive exclusion principle',
          url: 'https://doi.org/10.1126/science.131.3409.1292',
        },
      ],
    },
    notePlaceholder: 'Why does the product α₁₂α₂₁ determine coexistence?',
  };

  build() {
    this.model  = new CompetitiveExclusionModel({ K1: 100, K2: 100, a12: 0.5, a21: 0.5 });
    this.ceView = new CompetitiveExclusionView(this.view);

    this.layout.setStageNote('Nullcline 1 (blue): N₂=(K₁−N₁)/α₁₂   Nullcline 2 (red): N₁=(K₂−N₂)/α₂₁');

    for (const [key, label, min, max, init] of [
      ['a12', 'α₁₂', 0, 3, 0.5],
      ['a21', 'α₂₁', 0, 3, 0.5],
      ['K1',  'K₁',  10, 200, 100],
      ['K2',  'K₂',  10, 200, 100],
    ]) {
      this.layout.addControl(new Slider({
        id: this.controlId(key),
        label,
        min, max, step: key.startsWith('K') ? 5 : 0.05,
        value: init,
        format: v => key.startsWith('K') ? v.toFixed(0) : v.toFixed(2),
        onInput: (v) => { this.model[key] = v; },
      }));
    }

    this.readouts = new ReadoutPanel([
      { key: 'N1s',    label: 'N₁*' },
      { key: 'N2s',    label: 'N₂*' },
      { key: 'prod',   label: 'α₁₂α₂₁' },
      { key: 'outcome',label: 'outcome' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.ceView.draw(this.model);
    const [N1s, N2s] = this.model.equilibrium;
    this.readouts.set('N1s',    isNaN(N1s) ? '—' : N1s.toFixed(2));
    this.readouts.set('N2s',    isNaN(N2s) ? '—' : N2s.toFixed(2));
    this.readouts.set('prod',   (this.model.a12 * this.model.a21).toFixed(3));
    this.readouts.set('outcome',this.model.outcome);
  }
}
