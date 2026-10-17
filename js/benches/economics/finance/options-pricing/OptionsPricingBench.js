/**
 * OptionsPricingBench — Black-Scholes European option pricing explorer.
 *
 * Educational use only — not financial advice.
 */
import { Bench } from '../../../../core/Bench.js';
import { OptionsPricingModel } from './OptionsPricingModel.js';
import { OptionsPricingView } from './OptionsPricingView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class OptionsPricingBench extends Bench {
  static meta = {
    id: 'options-pricing',
    title: 'Black-Scholes options',
    navLabel: 'Black-Scholes',
    canvasLabel: 'Black-Scholes call and put prices vs spot price S',
    level: 'graduate',
    keywords: ['Black-Scholes', 'options', 'call', 'put', 'delta', 'volatility',
               'put-call parity', 'finance', 'derivatives'],
    related: ['economics/compound-growth'],
  };

  static info = {
    formula:
      'C = S·Φ(d₁) − K·e^{−rT}·Φ(d₂)\n' +
      'P = K·e^{−rT}·Φ(−d₂) − S·Φ(−d₁)\n' +
      'd₁ = [ln(S/K) + (r+σ²/2)·T] / (σ√T)\n' +
      'd₂ = d₁ − σ√T\n' +
      'Parity: C − P = S − K·e^{−rT}',
    predict: [
      'Increase σ from 20% to 40%. Does the call price more than double? Why does volatility always increase option prices?',
      'Set S = K (at-the-money). How does increasing T affect call vs put prices symmetrically?',
      'With r = 0, what happens to the relationship between call and put prices when S = K?',
    ],
    breaks: [
      'Assumes constant volatility: real markets show a "volatility smile" (Derman & Kani 1994).',
      'European exercise only: American options require different methods (binomial tree or PDE).',
      'Log-normal price process: fat tails and jumps are ignored (Merton 1976 jump-diffusion extends this).',
      'Continuous trading, no dividends, constant risk-free rate assumed.',
    ],
    derive: [
      { text: 'Assume S follows geometric Brownian motion: dS = μS dt + σS dW.' },
      { text: 'By Itô\'s lemma, the option price V(S,t) satisfies the Black-Scholes PDE: ∂V/∂t + ½σ²S²∂²V/∂S² + rS∂V/∂S − rV = 0.' },
      { text: 'Apply boundary condition for call: C(S,T) = max(S−K,0). Solve via risk-neutral pricing.' },
      { text: 'Under risk-neutral measure: C = e^{−rT}·E[max(S_T−K,0)], where S_T = S·e^{(r−σ²/2)T+σ√T·Z}, Z∼N(0,1).' },
      { text: 'Evaluate the expectation: C = S·Φ(d₁) − K·e^{−rT}·Φ(d₂). Put price follows from put-call parity.' },
    ],
    research: {
      questions: [
        'Why does the Black-Scholes formula price options independently of the expected return μ?',
        'How does implied volatility differ from historical volatility, and what does the volatility surface reveal?',
      ],
      challenge: 'Derive the put-call parity C − P = S − K·e^{−rT} from a no-arbitrage argument using two portfolios.',
      papers: [
        {
          authors: 'F. Black and M. Scholes',
          year: 1973,
          title: 'The pricing of options and corporate liabilities',
          url: 'https://doi.org/10.1086/260062',
        },
        {
          authors: 'R.C. Merton',
          year: 1973,
          title: 'Theory of rational option pricing',
          url: 'https://doi.org/10.2307/3003143',
        },
      ],
    },
    notePlaceholder: 'Why does higher volatility increase both call and put prices?',
  };

  build() {
    this._S     = 100;
    this._K     = 100;
    this._sigma = 0.20;
    this._r     = 0.05;
    this._T     = 1.0;

    this._updateModel();
    this._view = new OptionsPricingView(this.view);

    this.layout.setStageNote(
      'C = S·Φ(d₁) − K·e^{−rT}·Φ(d₂)   Educational use only — not financial advice.',
    );

    this._SSlider = new Slider({
      id: this.controlId('S'),
      label: 'S (spot price)',
      min: 50, max: 150, step: 1,
      value: this._S,
      format: v => `$${v.toFixed(0)}`,
      onInput: (v) => { this._S = v; this._updateModel(); },
    });
    this.layout.addControl(this._SSlider);

    this._KSlider = new Slider({
      id: this.controlId('K'),
      label: 'K (strike price)',
      min: 50, max: 150, step: 1,
      value: this._K,
      format: v => `$${v.toFixed(0)}`,
      onInput: (v) => { this._K = v; this._updateModel(); },
    });
    this.layout.addControl(this._KSlider);

    this._sigmaSlider = new Slider({
      id: this.controlId('sigma'),
      label: 'σ (volatility)',
      min: 0.05, max: 0.80, step: 0.01,
      value: this._sigma,
      format: v => `${(v * 100).toFixed(0)}%`,
      onInput: (v) => { this._sigma = v; this._updateModel(); },
    });
    this.layout.addControl(this._sigmaSlider);

    this._rSlider = new Slider({
      id: this.controlId('r'),
      label: 'r (risk-free rate)',
      min: 0.00, max: 0.15, step: 0.01,
      value: this._r,
      format: v => `${(v * 100).toFixed(1)}%`,
      onInput: (v) => { this._r = v; this._updateModel(); },
    });
    this.layout.addControl(this._rSlider);

    this._TSlider = new Slider({
      id: this.controlId('T'),
      label: 'T (time to expiry)',
      min: 0.1, max: 3.0, step: 0.1,
      value: this._T,
      format: v => `${v.toFixed(1)} yr`,
      onInput: (v) => { this._T = v; this._updateModel(); },
    });
    this.layout.addControl(this._TSlider);

    this._readouts = new ReadoutPanel([
      { key: 'call',   label: 'Call (C)' },
      { key: 'put',    label: 'Put (P)' },
      { key: 'delta',  label: 'Δ (call delta)' },
      { key: 'd1',     label: 'd₁' },
      { key: 'parity', label: 'Parity C−P−(S−Ke⁻ʳᵀ)' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _updateModel() {
    this.model = new OptionsPricingModel({
      S: this._S,
      K: this._K,
      r: this._r,
      sigma: this._sigma,
      T: this._T,
    });
  }

  update(_dt) {}

  draw() {
    this._view.draw(this.model);
    const m = this.model;
    const call   = m.callPrice();
    const put    = m.putPrice();
    const delta  = m.delta('call');
    const d1     = m.d1();
    const parity = call - put - (m.S - m.K * Math.exp(-m.r * m.T));

    this._readouts.set('call',   call   != null ? `$${call.toFixed(4)}`  : '—');
    this._readouts.set('put',    put    != null ? `$${put.toFixed(4)}`   : '—');
    this._readouts.set('delta',  delta  != null ? delta.toFixed(4)       : '—');
    this._readouts.set('d1',     d1     != null ? d1.toFixed(4)          : '—');
    this._readouts.set('parity', Math.abs(parity) < 1e-8 ? '≈0' : parity.toFixed(6));
  }
}
