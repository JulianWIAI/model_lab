/**
 * OscillatorsBench — driven damped harmonic oscillator.
 * Controls: ω₀, γ, F₀, ω sliders. Readouts: Q, ω_d, ω_r, A(ω), δ_log.
 */
import { Bench } from '../../../../core/Bench.js';
import { OscillatorsModel } from './OscillatorsModel.js';
import { OscillatorsView } from './OscillatorsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class OscillatorsBench extends Bench {
  static meta = {
    id: 'oscillators',
    title: 'Damped oscillator',
    navLabel: 'Damped oscillator',
    canvasLabel: 'Driven damped harmonic oscillator: transient and resonance curve',
    level: 'intro',
    keywords: [
      'harmonic oscillator', 'damping', 'resonance', 'driven oscillator', 'quality factor',
      'log decrement', 'transient', 'steady state', 'frequency response',
    ],
    related: ['physics/mechanics/orbits', 'physics/electromagnetism/rc-circuit'],
  };

  static info = {
    formula:
      'ẍ + 2γẋ + ω₀²x = F₀·cos(ωt)\n' +
      'A(ω) = F₀/√((ω₀²−ω²)²+(2γω)²)\n' +
      'ω_r = √(ω₀²−2γ²)   Q = ω₀/(2γ)',
    predict: [
      'If γ=0.3ω₀ and ω₀=1, at which frequency does the driven amplitude peak — at ω₀ or below?',
      'Q=5 for a driven oscillator. What is the peak amplitude A(ω_r) relative to the static response F₀/ω₀²? (Hint: A(ω_r)≈F₀·Q/ω₀² for high Q.)',
      'Is critical damping the fastest way to reach zero displacement? (Hint: consider a 2% settling criterion.)',
    ],
    breaks: [
      'Linear damping only; dry (Coulomb) friction and nonlinear stiffness are not modelled.',
      'Steady-state amplitude ignores transients; initial-condition effects persist for large Q.',
      '"Critical damping is fastest" is false for a 2% settling criterion (Strogatz §7.2); it is the fastest non-oscillatory return to zero.',
      'No coupled oscillators, no mode splitting.',
    ],
    derive: [
      { text: "Newton's law (per unit mass): ẍ = −ω₀²x − 2γẋ + F₀cos(ωt)." },
      { text: 'Trial solution x=Ae^(iωt): (−ω²+2iγω+ω₀²)A = F₀ → A = F₀/(ω₀²−ω²+2iγω).' },
      { text: '|A| = F₀/√((ω₀²−ω²)²+(2γω)²).' },
      { text: 'd|A|²/dω = 0 → ω² = ω₀²−2γ² → ω_r = √(ω₀²−2γ²) (exists only if γ < ω₀/√2).' },
      { text: 'Phase: φ = atan2(2γω, ω₀²−ω²) → π/2 at ω=ω₀.' },
      { text: 'Quality factor Q = ω₀/(2γ); at resonance A(ω_r) ≈ F₀·Q/ω₀² for Q>>1.' },
    ],
    research: {
      questions: [
        'Why does the velocity amplitude peak exactly at ω₀ while the displacement peak is shifted below ω₀?',
        'How does the Q factor relate to the width of the resonance peak?',
      ],
      challenge: 'Derive the impedance Z(ω) = iω/(−ω²+2iγω+ω₀²) and show that |Z| peaks at ω₀.',
      papers: [
        { authors: 'L.D. Landau & E.M. Lifshitz', year: 1976, title: 'Mechanics, 3rd ed.', journal: 'Pergamon Press, §22' },
      ],
    },
    notePlaceholder: 'How does the resonance peak width relate to the quality factor Q?',
  };

  build() {
    this.model = new OscillatorsModel({ omega0: 1, gamma: 0.1, F0: 0.5, omega: 1 });
    this.oscView = new OscillatorsView(this.view);

    this.layout.setStageNote('Velocity amplitude peaks exactly at ω₀; displacement peak is at ω_r = √(ω₀²−2γ²) < ω₀');

    this.layout.addControl(new Slider({
      id: this.controlId('omega0'),
      label: 'ω₀ (rad/s)',
      min: 0.5, max: 5, step: 0.1,
      value: this.model.omega0,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.omega0 = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('gamma'),
      label: 'γ (s⁻¹)',
      min: 0, max: 3, step: 0.05,
      value: this.model.gamma,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.gamma = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('F0'),
      label: 'F₀ (m/s²)',
      min: 0, max: 2, step: 0.1,
      value: this.model.F0,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.F0 = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('omega'),
      label: 'ω (rad/s)',
      min: 0.1, max: 5, step: 0.1,
      value: this.model.omega,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.omega = v; this._update(); },
    }));

    this._readout = new ReadoutPanel([
      { id: 'Q',     label: 'Q' },
      { id: 'omegaR', label: 'ω_r (rad/s)' },
      { id: 'A',     label: 'A(ω) (m)' },
      { id: 'logDec', label: 'Log decrement' },
    ]);
    this.layout.addReadout(this._readout);
    this._update();
  }

  _update() {
    const m = this.model;
    this._readout.set('Q', isFinite(m.Q) ? m.Q.toFixed(2) : '∞');
    this._readout.set('omegaR', isNaN(m.omegaR) ? 'none' : m.omegaR.toFixed(3));
    this._readout.set('A', m.amplitude().toFixed(4));
    this._readout.set('logDec', isNaN(m.logDecrement) ? 'n/a' : m.logDecrement.toFixed(4));
    this.oscView.draw(m);
  }

  draw() { this._update(); }
}
