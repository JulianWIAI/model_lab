/**
 * LangmuirBench — Langmuir adsorption isotherm with kinetic route.
 */
import { Bench } from '../../../../core/Bench.js';
import { LangmuirModel } from './LangmuirModel.js';
import { LangmuirView } from './LangmuirView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class LangmuirBench extends Bench {
  static meta = {
    id: 'langmuir',
    title: 'Langmuir adsorption',
    navLabel: 'Langmuir',
    canvasLabel: 'Adsorption isotherm theta(p)',
    level: 'university',
    keywords: [
      'Langmuir', 'adsorption', 'isotherm', 'surface chemistry', 'coverage',
      'van\'t Hoff', 'kinetics', 'equilibrium constant',
    ],
  };

  static info = {
    formula: 'theta(p) = Kp / (1 + Kp)',
    predict: [
      'At p = 1/K the coverage is exactly 0.5.',
      'The Langmuir isotherm is concave: theta\'\'(p) < 0 for all p > 0.',
    ],
    breaks: [
      'Single-layer adsorption only; BET isotherm extends to multilayer.',
      'Assumes all sites are equivalent and non-interacting.',
      'The Hill equation with n=1 is identical to Langmuir.',
    ],
    derive: [
      { text: 'At equilibrium, rate_ads = rate_des gives k_ads * p * (1-theta) = k_des * theta, so theta = Kp/(1+Kp) with K = k_ads/k_des.' },
      { text: 'The linearised Langmuir plot: p/theta = 1/K + p, giving a straight line with slope 1 and intercept 1/K.' },
      { text: 'Van\'t Hoff: K(T) = K_ref * exp(deltaH/R * (1/T_ref - 1/T)).' },
    ],
    research: {
      questions: [
        'How does the BET isotherm generalise Langmuir to multilayer adsorption?',
        'What does the van\'t Hoff plot of ln(K) vs 1/T reveal about adsorption enthalpy?',
      ],
      challenge: 'Derive the kinetic relaxation time tau = 1/(k_ads*p + k_des) and verify by RK4 integration.',
      papers: [
        { authors: 'I. Langmuir', year: 1918, title: 'The adsorption of gases on plane surfaces of glass, mica and platinum', note: '(cited, not fetched)' },
      ],
    },
    notePlaceholder: 'How does increasing K shift the half-coverage pressure?',
  };

  build() {
    this.model = new LangmuirModel({ K: 2.5 });
    this.langView = new LangmuirView(this.view);
    this._cursorP = 1;

    this.layout.addControl(new Slider({
      id: this.controlId('K'),
      label: 'Equilibrium constant K',
      min: 0.1, max: 10, step: 0.1,
      value: this.model.K,
      format: (v) => v.toFixed(1),
      onInput: (v) => { this.model = new LangmuirModel({ K: v }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('cursor'),
      label: 'Pressure cursor',
      min: 0, max: 5, step: 0.05,
      value: this._cursorP,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this._cursorP = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'theta', label: 'theta at cursor' },
      { key: 'half', label: 'p(half)' },
      { key: 'K', label: 'K' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.langView.draw(this.model, this._cursorP);
    this.readouts.set('theta', this.model.coverage(this._cursorP).toFixed(4));
    this.readouts.set('half', this.model.halfCoverageP().toFixed(3));
    this.readouts.set('K', this.model.K.toFixed(1));
  }
}
