/**
 * LCOscillatorBench — series RLC oscillator: step response and frequency response.
 * Controls: R, L, C sliders; mode toggle. Readouts: α, ω₀, Q, ωd, regime, R_crit.
 */
import { Bench } from '../../../../core/Bench.js';
import { LCOscillatorModel } from './LCOscillatorModel.js';
import { LCOscillatorView } from './LCOscillatorView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class LCOscillatorBench extends Bench {
  static meta = {
    id: 'lc-oscillator',
    title: 'RLC oscillator',
    navLabel: 'RLC oscillator',
    canvasLabel: 'Step response V_C(t) and frequency response |H_C(ω)|',
    level: 'university',
    keywords: [
      'RLC', 'LC oscillator', 'resonance', 'damping', 'Q factor', 'bandwidth',
      'Laplace', 'poles', 'electromagnetism', 'impedance',
    ],
    related: ['physics/rc-circuit'],
  };

  static info = {
    formula:
      'α = R/(2L),  ω₀ = 1/√(LC),  Q = √(L/C)/R\n' +
      'ωd = √(ω₀²−α²)  [underdamped only]\n' +
      'ωC = √(ω₀²−2α²) [exists when Q > 1/√2]\n\n' +
      'Step response (V_C(0)=0, I(0)=0):\n' +
      '  Underdamped: V_C(t) = 1 − e^(−αt)[cos(ωd·t) + (α/ωd)·sin(ωd·t)]\n' +
      '  Critical:    V_C(t) = 1 − (1+αt)·e^(−αt)\n' +
      '  Overdamped:  V_C(t) = 1 + [s₂·e^(s₁t)−s₁·e^(s₂t)]/(s₂−s₁)\n\n' +
      '|H_C(jω)| = ω₀² / √((ω₀²−ω²)²+(2αω)²)',
    predict: [
      'What happens to the step-response overshoot as Q increases above 1?',
      'At what value of R does the circuit become critically damped?',
      'Why are there three different characteristic frequencies (ωd, ω₀, ωC) and not one?',
    ],
    breaks: [
      'Assumes ideal L (no core losses) and ideal C (no ESR/leakage).',
      'Parasitic coupling between L and C windings is ignored.',
      'Nonlinear effects (ferromagnetic saturation, voltage-dependent capacitance) are not modelled.',
    ],
    derive: [
      { text: 'KVL: V_in = V_R + V_L + V_C = R·I + L·dI/dt + V_C.' },
      { text: 'With I = C·dV_C/dt: L·C·d²V_C/dt² + R·C·dV_C/dt + V_C = V_in.' },
      { text: 'Characteristic equation: s² + 2α·s + ω₀² = 0, roots s = −α ± √(α²−ω₀²).' },
      { text: 'Underdamped (α<ω₀): complex roots −α±jωd; solution is decaying sinusoid.' },
      { text: 'Apply Laplace: H_C(s) = ω₀²/(s²+2αs+ω₀²); substitute s=jω for |H_C(jω)|.' },
    ],
    research: {
      questions: [
        'Why does the voltage-resonance peak ωC occur below the current-resonance peak ω₀?',
        'Show that energy oscillates between L and C at the damped frequency ωd.',
      ],
      challenge: 'Derive the Q factor from the ratio of stored energy to energy dissipated per radian.',
      papers: [
        {
          authors: 'O. Heaviside',
          year: 1894,
          title: 'Electrical Papers, Vol. II',
          url: 'https://archive.org/details/electricalpapers02heavuoft',
        },
        {
          authors: 'L. D. Landau, E. M. Lifshitz',
          year: 1976,
          title: 'Mechanics (Course of Theoretical Physics, Vol. 1), §22',
          url: 'https://archive.org/details/Mechanics_541',
        },
      ],
    },
    notePlaceholder: 'Why does the energy stored in L and C oscillate, while energy in R is always dissipated?',
  };

  build() {
    this.model = new LCOscillatorModel({ R: 10, L: 1e-3, C: 1e-6 });
    this.lcView = new LCOscillatorView(this.view);
    this._mode = 'step response';
    this._V0   = 1;

    this.layout.setStageNote('α = R/(2L); ω₀ = 1/√(LC); Q = ω₀/(2α)');

    // ── Mode toggle ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('mode'),
      label: 'Mode',
      options: [
        { label: 'Step response',      value: 'step response' },
        { label: 'Frequency response', value: 'frequency response' },
      ],
      value: 'step response',
      onChange: (v) => { this._mode = v; },
    }));

    // ── R slider: 1–100 Ω ──
    this.layout.addControl(new Slider({
      id: this.controlId('R'),
      label: 'R (Ω)',
      min: 1, max: 100, step: 1,
      value: this.model.R,
      format: v => v.toFixed(0),
      onInput: (v) => { this.model.R = v; },
    }));

    // ── L slider: 0.1–10 mH (stored in H) ──
    this.layout.addControl(new Slider({
      id: this.controlId('L'),
      label: 'L (mH)',
      min: 0.1, max: 10, step: 0.1,
      value: this.model.L * 1e3,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.L = v * 1e-3; },
    }));

    // ── C slider: 0.1–10 μF (stored in F) ──
    this.layout.addControl(new Slider({
      id: this.controlId('C'),
      label: 'C (μF)',
      min: 0.1, max: 10, step: 0.1,
      value: this.model.C * 1e6,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.C = v * 1e-6; },
    }));

    // ── Readouts ──
    this.readouts = new ReadoutPanel([
      { key: 'alpha',  label: 'α' },
      { key: 'omega0', label: 'ω₀' },
      { key: 'Q',      label: 'Q' },
      { key: 'wd',     label: 'ωd' },
      { key: 'regime', label: 'Regime' },
      { key: 'Rcrit',  label: 'R_crit' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    const m = this.model;
    // Choose a sensible tMax: show ≈ 5 ring-down time constants (5/α)
    const a   = m.alpha();
    const w0  = m.omega0();
    const tMax = 5 / (a > 0 ? a : w0);

    this.lcView.draw(m, tMax, this._V0);

    // Readouts — guard all nullable values
    this.readouts.set('alpha',  a.toExponential(3) + ' rad/s');
    this.readouts.set('omega0', w0.toExponential(3) + ' rad/s');
    this.readouts.set('Q',      m.Q().toFixed(3));
    this.readouts.set('wd',     m.omegaDamped() != null
      ? m.omegaDamped().toExponential(3) + ' rad/s'
      : '—');
    this.readouts.set('regime', m.dampingRegime());
    this.readouts.set('Rcrit',  m.criticalDamping().toFixed(3) + ' Ω');
  }
}
