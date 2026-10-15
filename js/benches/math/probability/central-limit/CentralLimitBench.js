/**
 * CentralLimitBench — Central Limit Theorem with five parent distributions.
 */
import { Bench } from '../../../../core/Bench.js';
import { CentralLimitModel, DISTRIBUTIONS } from './CentralLimitModel.js';
import { CentralLimitView } from './CentralLimitView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ActionButton } from '../../../../ui/ActionButton.js';

export class CentralLimitBench extends Bench {
  static meta = {
    id: 'central-limit',
    title: 'Central Limit Theorem',
    navLabel: 'Central limit',
    canvasLabel: 'Distribution of sample means vs CLT normal',
    level: 'intro',
    keywords: [
      'central limit theorem', 'CLT', 'sample mean', 'normal distribution',
      'standard error', 'uniform', 'exponential', 'Bernoulli', 'Cauchy', 'Lindeberg',
    ],
    related: ['math/fourier', 'biology/sir'],
  };

  static info = {
    formula:
      'X₁,…,Xn iid, E[X]=μ, Var(X)=σ²\n' +
      'E[X̄] = μ;  Var(X̄) = σ²/n\n' +
      'CLT: √n·(X̄−μ)/σ →^d N(0,1) as n→∞\n' +
      'SE = σ/√n\n' +
      'Cauchy: no mean, no variance → CLT FAILS\n' +
      '        X̄ ~ Cauchy(0,1) regardless of n\n' +
      'Exponential(1) means ~ Gamma(n, n) exactly  [Erlang]',
    predict: [
      'For a fair die (μ=3.5, σ≈1.71), what is SE for n=36 rolls?',
      'Will sample means of a Cauchy distribution ever look bell-shaped?',
      'Which distribution needs fewer samples to "look normal" — Uniform or Exponential?',
    ],
    breaks: [
      'Cauchy has no finite mean or variance; CLT does not apply.',
      'Heavy-tailed distributions (Pareto α<2) converge to non-Gaussian stable laws.',
      'CLT is an asymptotic result; the rate of convergence depends on the distribution.',
      'Histogram appearance is sensitive to bin count; tails may be misrepresented.',
    ],
    derive: [
      { text: 'X₁,…,Xn iid, mean μ, variance σ². By linearity:',
        formula: 'E[X̄] = μ;  Var(X̄) = σ²/n' },
      { text: 'CLT: standardised mean converges in distribution.',
        formula: '√n·(X̄−μ)/σ →^d N(0,1)' },
      { text: 'Cauchy: sum of n Cauchy(0,γ) is Cauchy(0,nγ), so X̄~Cauchy(0,γ) — does not shrink.',
        formula: 'IQR(X̄_n) = IQR(X₁) ≠ IQR(X₁)/√n' },
    ],
    research: {
      questions: [
        'Why does the CLT fail for the Cauchy distribution specifically?',
        'How many samples n are needed before the Exponential distribution "looks normal"?',
      ],
      challenge: 'Use the characteristic function φ(t)=E[e^{itX}] to prove that √n(X̄−μ)/σ →^d N(0,1) under finite variance.',
      papers: [
        {
          authors: 'P.-S. Laplace',
          year: 1810,
          title: 'Mémoire sur les approximations des formules qui sont fonctions de très-grands nombres',
        },
        {
          authors: 'J. W. Lindeberg',
          year: 1922,
          title: 'Eine neue Herleitung des Exponentialgesetzes in der Wahrscheinlichkeitsrechnung',
        },
      ],
    },
    notePlaceholder: 'Why does averaging "smooth out" non-normal distributions?',
  };

  build() {
    this.model   = new CentralLimitModel({ dist: 'uniform', n: 30, N: 2000, seed: 42 });
    this.cltView = new CentralLimitView(this.view);

    this.layout.setStageNote(
      'Histogram = observed distribution of N sample means (n draws each). ' +
      'Red curve = theoretical N(μ, σ²/n). Cauchy: CLT fails.',
    );

    // ── Distribution ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('dist'),
      label: 'Parent distribution',
      options: DISTRIBUTIONS.map(d => ({
        label: d.id === 'chisq3' ? 'χ²(3)' : d.id === 'cauchy' ? 'Cauchy!' : d.name.split('(')[0],
        value: d.id,
      })),
      value: 'uniform',
      onChange: (v) => {
        this.model.dist = v;
        this.model.run();
      },
    }));

    // ── n ──
    this.layout.addControl(new Slider({
      id: this.controlId('n'),
      label: 'n (sample size)',
      min: 1, max: 100, step: 1,
      value: this.model.n,
      format: v => v.toFixed(0),
      onInput: v => {
        this.model.n = Math.round(v);
        this.model.run();
      },
    }));

    // ── N ──
    this.layout.addControl(new Slider({
      id: this.controlId('N'),
      label: 'N (number of means)',
      min: 200, max: 5000, step: 200,
      value: this.model.N,
      format: v => v.toFixed(0),
      onInput: v => {
        this.model.N = Math.round(v);
        this.model.run();
      },
    }));

    // ── Run button ──
    this.layout.addControl(new ActionButton({
      label: '▶ Run',
      onClick: () => { this.model.run(); },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'dist',  label: 'Distribution' },
      { key: 'SE',    label: 'SE = σ/√n' },
      { key: 'obsMean', label: 'Observed x̄' },
      { key: 'obsSD',   label: 'Observed SD' },
      { key: 'obsSk',   label: 'Observed skew' },
      { key: 'iqr',     label: 'IQR of means' },
    ]);
    this.layout.setReadouts(this.readouts);

    // Run once on build
    this.model.run();
  }

  update(_dt) {}

  draw() {
    this.cltView.draw(this.model);

    const info = this.model.distInfo;
    const se   = this.model.SE;

    this.readouts.set('dist',    info.name);
    this.readouts.set('SE',      se !== null ? se.toFixed(5) : '∞ (Cauchy)');
    this.readouts.set('obsMean', this.model.observedMean.toFixed(4));
    this.readouts.set('obsSD',   this.model.observedSD.toFixed(4));
    this.readouts.set('obsSk',   this.model.observedSkewness().toFixed(3));
    this.readouts.set('iqr',     this.model.observedIQR().toFixed(4));
  }
}
