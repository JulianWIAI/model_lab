/**
 * IntegrateAndFireBench — leaky integrate-and-fire neuron.
 * Controls: I, τ_m, V_th, t_ref. Readouts: I_th, ISI, f, V_∞.
 */
import { Bench } from '../../../../core/Bench.js';
import { IntegrateAndFireModel } from './IntegrateAndFireModel.js';
import { IntegrateAndFireView } from './IntegrateAndFireView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class IntegrateAndFireBench extends Bench {
  static meta = {
    id: 'integrate-and-fire',
    title: 'Integrate-and-fire',
    navLabel: 'Integrate-and-fire',
    canvasLabel: 'Leaky integrate-and-fire neuron: V(t) trace and f-I curve',
    level: 'university',
    keywords: [
      'integrate-and-fire', 'IAF', 'leaky integrator', 'neuron', 'spike',
      'firing rate', 'rheobase', 'refractory', 'membrane potential', 'ISI',
    ],
    related: [
      'physics/electromagnetism/rc-circuit',
      'neuroscience/electrophysiology/goldman',
    ],
  };

  static info = {
    formula:
      'τ_m·dV/dt = −(V−V_rest) + R·I\n' +
      'ISI = t_ref + τ_m·ln[(V_∞−V_reset)/(V_∞−V_th)]\n' +
      'I_th = (V_th−V_rest)/R   (rheobase)\n' +
      'Parameters are textbook-style illustrative values.',
    predict: [
      'The current doubles to 4 nA. Does the firing rate double, more than double, or less than double?',
      'What happens to the ISI as I approaches the rheobase from above?',
      'Increasing the time constant τ_m — does the firing rate go up or down for the same I?',
    ],
    breaks: [
      'No ionic currents; spike waveform is stipulated (reset), not generated.',
      'Constant input current only; time-varying I requires numerical integration.',
      'No adaptation, bursting, or subthreshold oscillations.',
      'Absolute refractory period only; no relative refractory period.',
      'Parameters are textbook-style; real neurons vary widely.',
    ],
    derive: [
      { text: 'ODE: τ_m·dV/dt = −(V−V_rest) + R·I → solution V(t) = V_∞ + (V_reset−V_∞)·e^(−t/τ_m).' },
      { text: 'Spike when V=V_th: T = τ_m·ln[(V_∞−V_reset)/(V_∞−V_th)].' },
      { text: 'ISI = t_ref + T.' },
      { text: 'Rheobase: V_∞=V_th → I_th = (V_th−V_rest)/R.' },
      { text: 'Near rheobase: V_∞−V_th ≈ R(I−I_th) → T ≈ τ_m·ln[1/(R(I−I_th))] → f ∝ 1/ln(I−I_th) (logarithmic divergence).' },
    ],
    research: {
      questions: [
        'How does the f-I curve of the LIF model compare to that of the Hodgkin-Huxley model?',
        'Why is the subthreshold membrane potential equivalent to an RC circuit?',
      ],
      challenge: 'Derive the f-I curve f(I) = [t_ref + τ_m·ln((V_∞−V_reset)/(V_∞−V_th))]⁻¹ and show that it diverges logarithmically as I → I_th⁺.',
      papers: [
        { authors: 'L. Lapicque', year: 1907, title: 'Recherches quantitatives sur l\'excitation électrique des nerfs', journal: 'J. Physiol. Pathol. Gén. 9:620–635' },
        { authors: 'W. Gerstner, W.M. Kistler, R. Naud & L. Paninski', year: 2014, title: 'Neuronal Dynamics', journal: 'Cambridge University Press', url: 'https://neuronaldynamics.epfl.ch' },
      ],
    },
    notePlaceholder: 'Why does the firing rate increase logarithmically near the rheobase?',
  };

  build() {
    this.model = new IntegrateAndFireModel({ I: 2 });
    this.iafView = new IntegrateAndFireView(this.view);

    this.layout.setStageNote('Textbook-style illustrative parameters — not fitted to a specific neuron');

    this.layout.addControl(new Slider({
      id: this.controlId('I'),
      label: 'I (nA)',
      min: 0, max: 5, step: 0.1,
      value: 2,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.I = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('tauM'),
      label: 'τ_m (ms)',
      min: 1, max: 50, step: 1,
      value: 10,
      format: v => v.toFixed(0),
      onInput: (v) => { this.model.tauM = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('tRef'),
      label: 't_ref (ms)',
      min: 0, max: 10, step: 0.5,
      value: 2,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.tRef = v; this._update(); },
    }));

    this._readout = new ReadoutPanel([
      { id: 'Ith',  label: 'I_th (nA)' },
      { id: 'Vinf', label: 'V_∞ (mV)' },
      { id: 'ISI',  label: 'ISI (ms)' },
      { id: 'f',    label: 'f (Hz)' },
    ]);
    this.layout.addReadout(this._readout);
    this._update();
  }

  _update() {
    const m = this.model;
    this._readout.set('Ith',  m.Ith.toFixed(2));
    this._readout.set('Vinf', m.Vinf.toFixed(1));
    this._readout.set('ISI',  m.ISI === Infinity ? '∞' : m.ISI.toFixed(2));
    this._readout.set('f',    m.firingRate.toFixed(2));
    this.iafView.draw(m);
  }

  onFrame() {}
}
