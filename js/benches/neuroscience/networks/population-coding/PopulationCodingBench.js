/**
 * PopulationCodingBench — Gaussian tuning curves with Poisson noise and Fisher information.
 */
import { Bench } from '../../../../core/Bench.js';
import { PopulationCodingModel } from './PopulationCodingModel.js';
import { PopulationCodingView } from './PopulationCodingView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class PopulationCodingBench extends Bench {
  static meta = {
    id: 'population-coding',
    title: 'Population coding',
    navLabel: 'Population coding',
    canvasLabel: 'Tuning curves and Fisher information',
    level: 'graduate',
    keywords: [
      'population coding', 'tuning curve', 'Fisher information', 'Cramer-Rao bound',
      'Poisson', 'neural coding', 'population vector', 'maximum likelihood',
    ],
    related: ['neuroscience/hopfield'],
  };

  static info = {
    formula: 'I(theta) = T * sum_i [f_i\'(theta)]^2 / f_i(theta)',
    predict: [
      'Doubling N from 8 to 16 doubles Fisher information (hence halves variance). The ratio I(16)/I(8) ~ 2.011.',
      'Fisher information scales as 1/sigma (not 1/sigma^2) for circular Gaussian tuning with uniform spacing.',
    ],
    breaks: [
      'Poisson approximation breaks down for very high rates (rMax*T > 100).',
      'Uniform neuron spacing assumed; real populations have non-uniform tuning.',
      'Population vector decoder is biased; MLE is asymptotically efficient.',
    ],
    derive: [
      { text: 'For Gaussian tuning f_i(theta) = rMax * exp(-(theta-theta_i)^2 / (2*sigma^2)), the Fisher info contribution at the preferred direction is zero because f_i\'(theta_i) = 0.' },
      { text: 'The Cramer-Rao bound gives sigma_CRB = 1/sqrt(I(theta)), the minimum achievable standard deviation for any unbiased estimator.' },
    ],
    research: {
      questions: [
        'Why does the population vector decoder have higher variance than the CRB?',
        'How does correlated noise (noise correlations) affect Fisher information?',
      ],
      challenge: 'Show that for uniformly spaced neurons on a circle with Gaussian tuning, Fisher information is approximately independent of stimulus direction.',
      papers: [
        { authors: 'H. S. Seung & H. Sompolinsky', year: 1993, title: 'Simple models for reading neuronal population codes', note: '(cited, not fetched)' },
        { authors: 'A. Pouget, P. Dayan & R. Zemel', year: 2000, title: 'Information processing with population codes', note: '(cited, not fetched)' },
      ],
    },
    notePlaceholder: 'How does the CRB change as you vary sigma?',
  };

  build() {
    this.model = new PopulationCodingModel({ N: 16, sigma: 0.5 });
    this.popView = new PopulationCodingView(this.view);
    this._stimulus = 0;

    this.layout.addControl(new Slider({
      id: this.controlId('stimulus'),
      label: 'Stimulus theta',
      min: -3.14, max: 3.14, step: 0.05,
      value: 0,
      format: (v) => v.toFixed(2) + ' rad',
      onInput: (v) => { this._stimulus = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('sigma'),
      label: 'Tuning width sigma',
      min: 0.2, max: 2.0, step: 0.05,
      value: this.model.sigma,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.sigma = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'fisher', label: 'Fisher info' },
      { key: 'crb', label: 'sigma_CRB' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.popView.draw(this.model, this._stimulus);
    const I = this.model.fisherInfo(this._stimulus);
    this.readouts.set('fisher', I.toFixed(2));
    this.readouts.set('crb', this.model.sigmaCRB(this._stimulus).toFixed(4));
  }
}
