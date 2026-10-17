/**
 * MWCBench — Monod-Wyman-Changeux two-state allosteric model.
 */
import { Bench } from '../../../../core/Bench.js';
import { MWCModel } from './MWCModel.js';
import { MWCView } from './MWCView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class MWCBench extends Bench {
  static meta = {
    id: 'mwc-allosteric',
    title: 'MWC allosteric model',
    navLabel: 'MWC allosteric',
    canvasLabel: 'MWC saturation Y(alpha) and R-state fraction',
    level: 'graduate',
    keywords: [
      'MWC', 'Monod-Wyman-Changeux', 'allosteric', 'cooperativity',
      'T-state', 'R-state', 'Hill coefficient', 'concerted model',
    ],
    related: ['biology/hill-binding', 'biology/enzyme-kinetics'],
  };

  static info = {
    formula: 'Y = [alpha(1+alpha)^{n-1} + Lc*alpha*(1+c*alpha)^{n-1}] / [(1+alpha)^n + L*(1+c*alpha)^n]',
    predict: [
      'When c=1, the T and R states bind equally, so Y reduces to the non-cooperative Langmuir isotherm Y = alpha/(1+alpha).',
      'The Hill coefficient h satisfies 1 < h < n; for n=4, L=100, c=0.01: h ~ 2.362.',
    ],
    breaks: [
      'Only two conformational states (T and R); real proteins may have more.',
      'No explicit ligand-induced fit (KNF model); the MWC model is purely concerted.',
      'The enumerated saturation is too slow for n > 12.',
    ],
    derive: [
      { text: 'At alpha=0, R(0) = 1/(1+L). For L=100, R(0) ~ 0.0099 -- nearly all in T-state.' },
      { text: 'For n=1, Y = alpha*(1+Lc) / [(1+alpha)(1+L) + alpha*L*c - L*c*alpha] simplifies to Y = alpha*K_eff / (1 + alpha*K_eff) with K_eff = (1+Lc)/(1+L).' },
      { text: 'The Hill coefficient at half-saturation measures cooperativity: h = d[logit Y]/d[log alpha] evaluated at Y=0.5.' },
    ],
    research: {
      questions: [
        'How does the MWC model differ from the KNF (sequential) model?',
        'Why is the Hill coefficient always less than n in the MWC model?',
      ],
      challenge: 'Show that the MWC saturation function with c=1 reduces exactly to the Langmuir isotherm.',
      papers: [
        { authors: 'J. Monod, J. Wyman & J.-P. Changeux', year: 1965, title: 'On the nature of allosteric transitions: a plausible model', note: '(cited, not fetched)' },
      ],
    },
    notePlaceholder: 'How does changing L shift the transition from T-state to R-state?',
  };

  build() {
    this.model = new MWCModel({ n: 4, L: 100, c: 0.01 });
    this.mwcView = new MWCView(this.view);
    this._cursorAlpha = 2;

    this.layout.addControl(new Slider({
      id: this.controlId('L'),
      label: 'Allosteric constant L',
      min: 1, max: 1000, step: 1,
      value: this.model.L,
      format: (v) => v.toFixed(0),
      onInput: (v) => { this.model = new MWCModel({ n: this.model.n, L: v, c: this.model.c }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('c'),
      label: 'c (T-state affinity ratio)',
      min: 0.001, max: 1, step: 0.001,
      value: this.model.c,
      format: (v) => v.toFixed(3),
      onInput: (v) => { this.model = new MWCModel({ n: this.model.n, L: this.model.L, c: v }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('cursor'),
      label: 'alpha cursor',
      min: 0, max: 20, step: 0.1,
      value: this._cursorAlpha,
      format: (v) => v.toFixed(1),
      onInput: (v) => { this._cursorAlpha = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'Y', label: 'Y at cursor' },
      { key: 'R', label: 'R-fraction' },
      { key: 'hill', label: 'Hill coeff' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.mwcView.draw(this.model, this._cursorAlpha);
    this.readouts.set('Y', this.model.saturation(this._cursorAlpha).toFixed(4));
    this.readouts.set('R', this.model.rStateFraction(this._cursorAlpha).toFixed(4));
    this.readouts.set('hill', this.model.hillCoeff().toFixed(3));
  }
}
