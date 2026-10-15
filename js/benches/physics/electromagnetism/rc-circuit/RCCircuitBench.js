/**
 * RCCircuitBench — RC circuit charging and discharging.
 * Controls: mode toggle, R, C, V₀, t-max sliders. Readouts: τ, t½, f_c, V_C, I.
 */
import { Bench } from '../../../../core/Bench.js';
import { RCCircuitModel } from './RCCircuitModel.js';
import { RCCircuitView } from './RCCircuitView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class RCCircuitBench extends Bench {
  static meta = {
    id: 'rc-circuit',
    title: 'RC circuit',
    navLabel: 'RC circuit',
    canvasLabel: 'V_C(t) and I(t) for an RC circuit',
    level: 'intro',
    keywords: [
      'RC circuit', 'resistor', 'capacitor', 'time constant', 'charging',
      'discharging', 'exponential', 'Kirchhoff', 'electromagnetism', 'filter',
    ],
    related: ['physics/lc-oscillator'],
  };

  static info = {
    formula:
      'τ = R·C\n' +
      'Charging:    V_C(t) = V₀·(1 − e^(−t/τ))\n' +
      'Discharging: V_C(t) = V₀·e^(−t/τ)\n' +
      't½ = τ·ln 2     f_c = 1/(2π·τ)',
    predict: [
      'What fraction of V₀ does C reach after one time constant τ?',
      'After 5τ, is the capacitor practically "fully charged"? How would you define that?',
      'If you double R while keeping C constant, how does the time to reach 50% V₀ change?',
    ],
    breaks: [
      'Assumes ideal R and C: no equivalent series resistance, no parasitic inductance, no leakage current.',
      'Instantaneous switch: real contacts bounce and arc, introducing transients.',
      'Frequency-domain behaviour (impedance Z_C = 1/(jωC), RC filter) is not shown.',
    ],
    derive: [
      { text: 'KVL: supply voltage equals voltage across R plus voltage across C.' },
      { text: 'Substitute I = C·dV_C/dt: V₀ = R·C·dV_C/dt + V_C → τ·dV_C/dt = V₀ − V_C.' },
      { text: 'Separate and integrate: dV_C/(V₀−V_C) = dt/τ → ln(V₀−V_C) = −t/τ + const.' },
      { text: 'Apply V_C(0) = 0: V_C(t) = V₀·(1 − e^(−t/τ)).  Differentiate for I(t).' },
      { text: 'Energy balance: total energy drawn from supply = ½CV₀² (stored) + ½CV₀² (dissipated in R), independent of R.' },
    ],
    research: {
      questions: [
        'Why does the energy dissipated in R equal ½CV₀² regardless of R?',
        'How does an RC circuit act as a low-pass filter? What is its −3 dB frequency?',
      ],
      challenge: 'Derive the impedance Z(ω) = R + 1/(jωC) from the time-domain equations and show that |H(ω)| = 1/√(1+(ωτ)²).',
      papers: [
        {
          authors: 'G. Kirchhoff',
          year: 1847,
          title: 'Ueber die Auflösung der Gleichungen, auf welche man bei der Untersuchung der linearen Vertheilung galvanischer Ströme geführt wird',
          url: 'https://doi.org/10.1002/andp.18471481202',
        },
      ],
    },
    notePlaceholder: 'Why does the energy dissipated in R not depend on R?',
  };

  build() {
    this.model   = new RCCircuitModel({ R: 1000, C: 100e-6, V0: 5, mode: 'charge' });
    this.rcView  = new RCCircuitView(this.view);
    this._tMax   = 5 * this.model.tau;  // show 5τ by default
    this._tSliderScale = 1;             // multiplier so slider works in τ units

    this.layout.setStageNote('τ = R·C; at t = τ the capacitor reaches 63.2% of V₀');

    // ── Mode toggle ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('mode'),
      label: 'Mode',
      options: [
        { label: 'Charging', value: 'charge' },
        { label: 'Discharging', value: 'discharge' },
      ],
      value: 'charge',
      onChange: (v) => {
        this.model.mode = v;
        this._updateTMax();
      },
    }));

    // ── R slider: 100 Ω – 10 kΩ ──
    this.layout.addControl(new Slider({
      id: this.controlId('R'),
      label: 'R (Ω)',
      min: 100, max: 10000, step: 100,
      value: this.model.R,
      format: v => v.toFixed(0),
      onInput: (v) => {
        this.model.R = v;
        this._updateTMax();
      },
    }));

    // ── C slider: 1 μF – 1000 μF ──
    this._cSlider = new Slider({
      id: this.controlId('C'),
      label: 'C (μF)',
      min: 1, max: 1000, step: 1,
      value: this.model.C * 1e6,
      format: v => v.toFixed(0),
      onInput: (v) => {
        this.model.C = v * 1e-6;
        this._updateTMax();
      },
    });
    this.layout.addControl(this._cSlider);

    // ── V₀ slider: 1 V – 20 V ──
    this.layout.addControl(new Slider({
      id: this.controlId('V0'),
      label: 'V₀ (V)',
      min: 1, max: 20, step: 0.5,
      value: this.model.V0,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.V0 = v; },
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'tau',   label: 'τ' },
      { key: 'thalf', label: 't½' },
      { key: 'fc',    label: 'f_c' },
      { key: 'Vc',    label: 'V_C(t½)' },
      { key: 'I0',    label: 'I(0)' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  _updateTMax() {
    // Keep the window at 5τ when R or C changes
    this._tMax = 5 * this.model.tau;
  }

  update(_dt) {}

  draw() {
    this.rcView.draw(this.model, this._tMax);
    const { tau, tHalf, fc, V0, R } = this.model;
    const tauMs = tau * 1000;
    this.readouts.set('tau',   tauMs >= 1 ? `${tauMs.toFixed(1)} ms` : `${(tau * 1e6).toFixed(1)} μs`);
    this.readouts.set('thalf', tauMs >= 1 ? `${(tHalf * 1000).toFixed(1)} ms` : `${(tHalf * 1e6).toFixed(1)} μs`);
    this.readouts.set('fc',    fc >= 1 ? `${fc.toFixed(1)} Hz` : `${(fc * 1000).toFixed(2)} mHz`);
    this.readouts.set('Vc',    `${this.model.Vc(tHalf).toFixed(3)} V`);
    this.readouts.set('I0',    `${(V0 / R * 1000).toFixed(3)} mA`);
  }
}
