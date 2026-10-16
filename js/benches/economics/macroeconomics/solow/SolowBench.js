/**
 * SolowBench — Solow-Swan growth model explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { SolowModel } from './SolowModel.js';
import { SolowView } from './SolowView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class SolowBench extends Bench {
  static meta = {
    id: 'solow',
    title: 'Solow growth model',
    navLabel: 'Solow growth',
    canvasLabel: 'Capital per effective worker k(t) and Solow diagram',
    level: 'university',
    keywords: [
      'Solow', 'growth', 'capital', 'steady state', 'golden rule', 'Cobb-Douglas',
      'depreciation', 'savings rate', 'convergence', 'macroeconomics',
    ],
    related: ['economics/macroeconomics/compound-growth'],
  };

  static info = {
    formula:
      'k̇ = s·A·k^α − (n+δ+g)·k\n' +
      'k* = (s·A/(n+δ+g))^{1/(1−α)}\n' +
      's_GR = α  (golden rule savings rate)\n' +
      'k_GR = (α·A/(n+δ+g))^{1/(1−α)}',
    predict: [
      'Increase savings rate from 0.3 to 0.5. Does k* double? What is the elasticity?',
      'Set g=0.02 (TFP growth). Does k* converge to a fixed value?',
      'What golden-rule savings rate maximises steady-state consumption?',
    ],
    breaks: [
      'Exogenous savings rate: no utility maximisation (Ramsey model extends this).',
      'TFP is exogenous: no endogenous growth (Romer 1990).',
      'Cobb-Douglas only: constant elasticity of substitution assumed.',
    ],
    derive: [
      { text: 'Capital: K̇ = sY − δK. Per eff. worker: k̇ = s·A·k^α − (n+δ+g)·k.' },
      { text: 'Steady state k̇=0: k* = (sA/(n+δ+g))^{1/(1-α)}.' },
      { text: 'Golden rule: max c* = y* − (n+δ+g)k* → α·A·k_GR^{α-1} = n+δ+g → s_GR = α.' },
      { text: 'z = k^{1-α}: ż = −μ·(z − z*), μ = (1-α)(n+δ+g). Exact convergence rate.' },
    ],
    research: {
      questions: [
        'Why does the Solow model predict conditional convergence across countries?',
        'How does increasing α (capital share) affect the speed of convergence?',
      ],
      challenge: 'Derive the exact analytical solution k(t) using the z = k^{1-α} substitution.',
      papers: [
        {
          authors: 'R.M. Solow',
          year: 1956,
          title: 'A contribution to the theory of economic growth',
          url: 'https://doi.org/10.2307/1884513',
        },
      ],
    },
    notePlaceholder: 'Why does increasing the savings rate only temporarily increase growth?',
  };

  build() {
    this._s     = 0.3;
    this._alpha = 1/3;
    this._k0    = 2;
    this._T     = 200;

    this._updateModel();
    this._view = new SolowView(this.view);

    this.layout.setStageNote(
      'k̇ = s·A·k^α − (n+δ+g)·k   k* = (s·A/(n+δ+g))^{1/(1-α)}',
    );

    this._sSlider = new Slider({
      id: this.controlId('s'),
      label: 'Savings rate s',
      min: 0.05, max: 0.9, step: 0.01,
      value: this._s,
      format: v => v.toFixed(2),
      onInput: (v) => { this._s = v; this._updateModel(); },
    });
    this.layout.addControl(this._sSlider);

    this._alphaSlider = new Slider({
      id: this.controlId('alpha'),
      label: 'Capital share α',
      min: 0.1, max: 0.8, step: 0.01,
      value: this._alpha,
      format: v => v.toFixed(2),
      onInput: (v) => { this._alpha = v; this._updateModel(); },
    });
    this.layout.addControl(this._alphaSlider);

    this._k0Slider = new Slider({
      id: this.controlId('k0'),
      label: 'Initial k₀',
      min: 0.5, max: 30, step: 0.5,
      value: this._k0,
      format: v => v.toFixed(1),
      onInput: (v) => { this._k0 = v; this._updateModel(); },
    });
    this.layout.addControl(this._k0Slider);

    this._readouts = new ReadoutPanel([
      { key: 'kStar', label: 'k*' },
      { key: 'yStar', label: 'y*' },
      { key: 'cStar', label: 'c*' },
      { key: 'kGR',   label: 'k_GR' },
      { key: 'sGR',   label: 's_GR' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _updateModel() {
    this.model = new SolowModel({ s: this._s, alpha: this._alpha });
    this._sim  = this.model.simulate(this._k0, this._T, 1);
  }

  update(_dt) {}

  draw() {
    this._view.draw(this.model, this._sim);
    const { kStar, yStar, cStar } = this.model.steadyState();
    const { sGR, kGR } = this.model.goldenRule();
    this._readouts.set('kStar', kStar.toFixed(4));
    this._readouts.set('yStar', yStar.toFixed(4));
    this._readouts.set('cStar', cStar.toFixed(4));
    this._readouts.set('kGR',   kGR.toFixed(4));
    this._readouts.set('sGR',   sGR.toFixed(4));
  }
}
