/**
 * DriftDiffusionBench — Ratcliff drift-diffusion model explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { DriftDiffusionModel } from './DriftDiffusionModel.js';
import { DriftDiffusionView } from './DriftDiffusionView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class DriftDiffusionBench extends Bench {
  static meta = {
    id: 'drift-diffusion',
    title: 'Drift-diffusion model',
    navLabel: 'Drift-diffusion',
    canvasLabel: 'Simulated evidence accumulation paths for the drift-diffusion model',
    level: 'university',
    keywords: [
      'drift-diffusion', 'DDM', 'Ratcliff', 'decision making', 'response time',
      'Wiener process', 'first passage time', 'accuracy', 'speed-accuracy tradeoff',
    ],
    related: [],
  };

  static info = {
    formula:
      'P+(0) = 1/(1+exp(-2μa/σ²))\n' +
      'E[T] = (a/μ)·tanh(μa/σ²)   [μ≠0]\n' +
      'E[T] = a²/σ²                [μ=0]\n' +
      'RT = E[T] + t₀',
    predict: [
      'Increase a from 1 to 2 with μ=1, σ=1. Does P+ change? Does RT change?',
      'Set μ=0. What is P+ and RT? Slowly increase μ to 2.',
      'Double σ from 1 to 2 keeping μ, a fixed. What happens to P+?',
    ],
    breaks: [
      'Constant drift assumption. Real drift varies trial-to-trial.',
      'RT distributions have heavier empirical tails than DDM predicts.',
      'Collapsing boundaries improve fit but have no closed-form solution here.',
    ],
    derive: [
      { text: 'Ẋ = μ + σṄ (Wiener), boundaries ±a.' },
      { text: 'Backward Kolmogorov for P+: (σ²/2)P+\'\' + μP+\' = 0. Solution: 1/(1+e^{-2μa/σ²}).' },
      { text: 'For E[T]: (σ²/2)T\'\' + μT\' = -1. Solution: (a/μ)tanh(μa/σ²).' },
      { text: 'μ→0: (a/μ)tanh(μa/σ²) → a²/σ² via L\'Hôpital.' },
    ],
    research: {
      questions: [
        'What does the speed-accuracy tradeoff curve look like as a varies?',
        'How does drift variability across trials change the RT distribution shape?',
      ],
      challenge: 'Derive the full RT distribution (not just the mean) from the FP equation.',
      papers: [
        {
          authors: 'R. Ratcliff',
          year: 1978,
          title: 'A theory of memory retrieval',
          url: 'https://doi.org/10.1037/0033-295X.85.2.59',
        },
        {
          authors: 'Bogacz et al.',
          year: 2006,
          title: 'The physics of optimal decision making',
          url: 'https://doi.org/10.1037/0033-295X.113.4.700',
        },
      ],
    },
    notePlaceholder: 'Why does the DDM predict right-skewed RT distributions?',
  };

  build() {
    this.model   = new DriftDiffusionModel({ mu: 1, sigma: 1, a: 1, t0: 0.3 });
    this.ddView  = new DriftDiffusionView(this.view);

    this.layout.setStageNote('P+(0) = 1/(1+e^{-2μa/σ²})   E[T] = (a/μ)tanh(μa/σ²)');

    this.layout.addControl(new Slider({
      id: this.controlId('mu'),
      label: 'μ (drift)',
      min: -3, max: 3, step: 0.1,
      value: this.model.mu,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.mu = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('a'),
      label: 'a (boundary)',
      min: 0.2, max: 3, step: 0.1,
      value: this.model.a,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.a = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('sigma'),
      label: 'σ (noise)',
      min: 0.1, max: 3, step: 0.1,
      value: this.model.sigma,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.sigma = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('t0'),
      label: 't₀ (non-decision)',
      min: 0, max: 1, step: 0.05,
      value: this.model.t0,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.t0 = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'pUp',  label: 'P+(upper)' },
      { key: 'fpt',  label: 'E[T]' },
      { key: 'rt',   label: 'RT_mean' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.ddView.draw(this.model);
    const { model } = this;
    this.readouts.set('pUp', model.pUpper.toFixed(4));
    this.readouts.set('fpt', `${model.meanFPT.toFixed(4)} s`);
    this.readouts.set('rt',  `${model.rtMean.toFixed(4)} s`);
  }
}
