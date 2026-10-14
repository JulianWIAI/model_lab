/**
 * RateLawsBench — integrated rate laws for 0th, 1st, 2nd order reactions.
 */
import { Bench } from '../../../../core/Bench.js';
import { RateLawsModel } from './RateLawsModel.js';
import { RateLawsView } from './RateLawsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class RateLawsBench extends Bench {
  static meta = {
    id: 'rate-laws',
    title: 'Integrated rate laws',
    navLabel: 'Rate laws',
    canvasLabel: '[A] vs time for 0th, 1st, and 2nd order reactions',
    level: 'university',
    keywords: [
      'rate law', 'reaction order', 'zeroth order', 'first order', 'second order',
      'half-life', 'concentration', 'kinetics', 'integrated rate law',
    ],
    related: ['chemistry/equilibrium', 'chemistry/mechanisms'],
  };

  static info = {
    formula:
      '0th:  [A] = [A]₀ − kt\n' +
      '1st:  [A] = [A]₀ · e^(−kt)\n' +
      '2nd:  [A] = [A]₀ / (1 + k·[A]₀·t)',
    predict: [
      'Which order gives a constant half-life regardless of [A]₀?',
      'At t = 0, all three orders give [A] = [A]₀. How do the curves diverge for t > 0?',
      'Why does a 2nd-order reaction slow down more rapidly than 1st-order at late times?',
    ],
    breaks: [
      'These are exact solutions only for simple (elementary) reactions A → products.',
      'Real mechanisms may be composite, giving apparent (not true) reaction orders.',
      'Temperature dependence of k (Arrhenius equation) is not modelled here.',
      'The 0th-order formula is unphysical for t > [A]₀/k — clamped at 0.',
    ],
    derive: [
      { text: 'For 1st order, −d[A]/dt = k[A] integrates to [A] = [A]₀ · exp(−kt).' },
      { text: 'The 1st-order half-life t½ = ln 2 / k is independent of [A]₀ — every equal interval of time consumes the same fraction.' },
      { text: 'For 2nd order, successive half-lives double: the reaction slows as reactant is consumed.' },
    ],
    research: {
      questions: [
        'How would you distinguish 1st from 2nd order experimentally using a single kinetic run?',
        'What is the "method of initial rates" and when is it preferred over integrated rate laws?',
      ],
      challenge: 'Derive the integrated rate law for a 2nd-order reaction A + B → products with [A]₀ ≠ [B]₀.',
      papers: [
        { authors: 'P. Atkins & J. de Paula', year: 2014, title: 'Atkins\' Physical Chemistry, 10th ed., Chapter 17', url: 'https://doi.org/10.1093/hesc/9780198769866.001.0001' },
      ],
    },
    notePlaceholder: 'How does the shape of the decay curve change between first and second order? What diagnostic plot would linearise each?',
  };

  build() {
    this.model    = new RateLawsModel({ order: 1, A0: 1.0, k: 0.1 });
    this.rateView = new RateLawsView(this.view);
    this._tMax    = 60;

    // ── Order selector ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('order'),
      label: 'Order',
      options: [
        { label: '0th', value: 0 },
        { label: '1st', value: 1 },
        { label: '2nd', value: 2 },
      ],
      value: 1,
      onChange: (v) => {
        this.model.order = Number(v);
        // Set sensible default k for each order at A0=1
        if (Number(v) === 0) this.model.k = 0.016;   // t½≈30 s
        if (Number(v) === 1) this.model.k = 0.1;     // t½≈6.9 s
        if (Number(v) === 2) this.model.k = 0.1;     // t½=10 s
        this._kSlider.setValue(this.model.k);
      },
    }));

    // ── [A]₀ slider ──
    this.layout.addControl(new Slider({
      id: this.controlId('a0'),
      label: '[A]₀',
      min: 0.1, max: 2.0, step: 0.05,
      value: this.model.A0,
      format: (v) => `${v.toFixed(2)} mol/L`,
      onInput: (v) => { this.model.A0 = v; },
    }));

    // ── k slider ──
    this._kSlider = new Slider({
      id: this.controlId('k'),
      label: 'k',
      min: 0.001, max: 1.0, step: 0.001,
      value: this.model.k,
      format: (v) => `${v.toFixed(3)} ${this.model.kUnits}`,
      onInput: (v) => { this.model.k = v; },
    });
    this.layout.addControl(this._kSlider);

    // ── t-axis range slider ──
    this.layout.addControl(new Slider({
      id: this.controlId('tmax'),
      label: 't max',
      min: 10, max: 300, step: 5,
      value: this._tMax,
      format: (v) => `${v} s`,
      onInput: (v) => { this._tMax = v; },
    }));

    // ── Readouts ──
    this.readouts = new ReadoutPanel([
      { key: 'order',  label: 'Order' },
      { key: 'half',   label: 't½' },
      { key: 'a_at_t', label: '[A] at t½' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.rateView.draw(this.model, this._tMax);
    const t_half = this.model.halfLife();
    this.readouts.set('order',  this.model.order === 0 ? 'zeroth' : this.model.order === 1 ? 'first' : 'second');
    this.readouts.set('half',   `${t_half.toFixed(2)} s`);
    this.readouts.set('a_at_t', `${this.model.concentration(t_half).toFixed(4)} mol/L`);
  }
}
