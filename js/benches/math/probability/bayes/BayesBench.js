/**
 * BayesBench — Bayesian Beta-Binomial inference.
 */
import { Bench } from '../../../../core/Bench.js';
import { BayesModel } from './BayesModel.js';
import { BayesView } from './BayesView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class BayesBench extends Bench {
  static meta = {
    id: 'bayes',
    title: 'Bayesian inference',
    navLabel: 'Bayes',
    canvasLabel: 'Prior and posterior Beta distributions',
    level: 'university',
    keywords: [
      'Bayes', 'Beta distribution', 'conjugate prior', 'posterior', 'credible interval',
      'Laplace', 'binomial', 'Bayesian inference', 'prior', 'posterior mean',
    ],
    related: ['math/central-limit'],
  };

  static info = {
    predict: [
      'With α=β=1 (uniform prior), if you see 7 heads in 10 flips, what is the posterior mean?',
      'What does the 95% credible interval tell you that a frequentist confidence interval does not?',
      'If α < 1, the density goes to ∞ at 0 and 1. What does that prior believe about θ?',
    ],
    breaks: [
      'For α < 1, the density → ∞ at x=0,1 (U-shaped prior). Plot starts at x=0.001 to avoid Infinity.',
      'The Beta prior is conjugate to the Binomial likelihood — this is a special property, not general.',
      'With n=0 data, posterior = prior. Laplace rule adds 1 to numerator and 2 to denominator.',
    ],
    derive: [
      { text: 'Bayesian update (Beta-Binomial conjugate):', formula: 'p(θ|k,n) ∝ θ^(α+k-1)·(1-θ)^(β+n-k-1)  →  Beta(α+k, β+n-k)' },
      { text: 'Posterior mean (Laplace rule for α=β=1):', formula: 'E[θ|k,n] = (α+k)/(α+β+n)' },
      { text: 'Beta CDF for integer parameters (binomial tail identity):', formula: 'I_x(a,b) = Σ_{j=a}^{a+b-1} C(a+b-1,j)·xʲ·(1-x)^{a+b-1-j}' },
      { text: 'Beta(a,a) is symmetric around 0.5, so its median = 0.5 for all a > 0.', formula: 'median(Beta(a,a)) = 0.5' },
    ],
    research: {
      questions: [
        'What is the difference between a credible interval and a frequentist confidence interval?',
        'How would you choose α and β to encode a prior belief that θ is probably near 0.3?',
      ],
      challenge: 'Extend to a Beta-Negative-Binomial model: instead of fixed n, observe until k successes. What is the posterior?',
      papers: [],
    },
    notePlaceholder: 'How does the prior shape change as you add more data…',
  };

  build() {
    this.model = new BayesModel({ alpha: 1, beta: 1, k: 7, n: 10 });
    this.bayesView = new BayesView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'postMean', label: 'Posterior mean' },
      { key: 'postVar',  label: 'Posterior var' },
      { key: 'ci95lo',   label: '95% CI lower' },
      { key: 'ci95hi',   label: '95% CI upper' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('alpha'),
      label: 'Prior α',
      min: 0.1, max: 10, step: 0.1, value: 1,
      format: v => v.toFixed(1),
      onInput: v => { this.model = new BayesModel({ alpha: v, beta: this.model.beta, k: this.model.k, n: this.model.n }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('beta'),
      label: 'Prior β',
      min: 0.1, max: 10, step: 0.1, value: 1,
      format: v => v.toFixed(1),
      onInput: v => { this.model = new BayesModel({ alpha: this.model.alpha, beta: v, k: this.model.k, n: this.model.n }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('k'),
      label: 'k (successes)',
      min: 0, max: 100, step: 1, value: 7,
      format: v => v.toFixed(0),
      onInput: v => {
        const k = Math.round(v);
        const n = Math.max(k, this.model.n);
        this.model = new BayesModel({ alpha: this.model.alpha, beta: this.model.beta, k, n });
      },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('n'),
      label: 'n (trials)',
      min: 1, max: 100, step: 1, value: 10,
      format: v => v.toFixed(0),
      onInput: v => {
        const n = Math.round(v);
        const k = Math.min(this.model.k, n);
        this.model = new BayesModel({ alpha: this.model.alpha, beta: this.model.beta, k, n });
      },
    }));
  }

  update(_dt) {}

  draw() {
    this.bayesView.draw(this.model);
    const m = this.model;
    const [lo, hi] = m.credibleInterval(0.95);
    this.readouts.set('postMean', m.posteriorMean().toFixed(6));
    this.readouts.set('postVar',  m.posteriorVariance().toExponential(4));
    this.readouts.set('ci95lo',   lo.toFixed(4));
    this.readouts.set('ci95hi',   hi.toFixed(4));
  }
}
