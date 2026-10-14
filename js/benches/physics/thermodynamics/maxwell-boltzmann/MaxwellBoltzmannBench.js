/**
 * MaxwellBoltzmannBench — Maxwell–Boltzmann speed distribution for ideal gases.
 * Molar masses from CIAAW 2024 abridged standard atomic weights.
 */
import { Bench } from '../../../../core/Bench.js';
import { MaxwellBoltzmannModel, GAS_PRESETS } from './MaxwellBoltzmannModel.js';
import { MaxwellBoltzmannView } from './MaxwellBoltzmannView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ToggleButton } from '../../../../ui/ToggleButton.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class MaxwellBoltzmannBench extends Bench {
  static meta = {
    id: 'maxwell-boltzmann',
    title: 'Maxwell–Boltzmann speed distribution',
    navLabel: 'Maxwell–Boltzmann',
    canvasLabel: 'f(v) — speed probability density for an ideal gas',
    level: 'university',
    keywords: [
      'Maxwell-Boltzmann', 'speed distribution', 'kinetic theory', 'temperature',
      'molar mass', 'most probable speed', 'mean speed', 'rms speed', 'ideal gas',
    ],
    related: ['physics/ideal-gas', 'chemistry/equilibrium'],
  };

  static info = {
    formula:
      'f(v) = 4π·(M/2πRT)^(3/2)·v²·exp(−Mv²/2RT)\n' +
      'v_p    = √(2RT/M)   (most probable)\n' +
      'v̄      = √(8RT/πM)  (mean)\n' +
      'v_rms  = √(3RT/M)   (root mean square)\n' +
      'Ratio: v_p : v̄ : v_rms ≈ 1 : 1.1284 : 1.2247',
    predict: [
      'Which gas has the highest mean speed at 300 K — He or CO₂?',
      'If you double T, by what factor does v_p increase?',
      'Why is v_rms > v̄ > v_p? What does this say about the shape of f(v)?',
    ],
    breaks: [
      'Valid only for ideal (non-interacting) gases in thermal equilibrium.',
      'Real gas corrections (intermolecular forces) are important near the boiling point.',
      'Molar masses from CIAAW 2024 abridged atomic weights; Ar has an unusually wide isotopic range (39.792–39.963 g/mol).',
      'The distribution is for translational speed; rotational and vibrational degrees of freedom are not shown.',
    ],
    derive: [
      { text: 'f(v) is derived from the 3D velocity distribution: each component vx,vy,vz follows a Gaussian. The speed distribution follows from integrating over a spherical shell in velocity space.' },
      { text: 'v_p comes from df/dv = 0. v_mean from ∫₀^∞ v·f(v)dv. v_rms from √(∫₀^∞ v²·f(v)dv), which equals √(3RT/M) via equipartition.' },
    ],
    research: {
      questions: [
        'How would you measure the speed distribution experimentally? (Hint: rotating disc selector or Doppler spectroscopy)',
        'At what temperature does the mean speed of N₂ match the escape velocity from Earth (≈11.2 km/s)?',
      ],
      challenge: 'Show that ∫₀^∞ f(v)dv = 1 by substituting u = v√(M/2RT) and using the Gaussian integral ∫₀^∞ u² e^(−u²) du = √π/4.',
      papers: [
        { authors: 'J. C. Maxwell', year: 1860, title: 'Illustrations of the dynamical theory of gases', url: 'https://doi.org/10.1080/14786446008642925' },
      ],
    },
    notePlaceholder: 'What would f(v) look like for a very cold gas vs a very hot one? Does the area under the curve change?',
  };

  build() {
    this._gasKey = 'N2';
    this.model   = new MaxwellBoltzmannModel({ M: GAS_PRESETS.N2.M, T: 300 });
    this.mbView  = new MaxwellBoltzmannView(this.view);

    // ── Gas preset ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('gas'),
      label: 'Gas',
      options: Object.entries(GAS_PRESETS).map(([k, v]) => ({ label: v.label, value: k })),
      value: 'N2',
      onChange: (key) => {
        this._gasKey = key;
        this.model.M = GAS_PRESETS[key].M;
        if (this.mbView.compareModel) this.mbView.compareModel.M = GAS_PRESETS[key].M;
      },
    }));

    // ── Temperature ──
    this.layout.addControl(new Slider({
      id: this.controlId('T'),
      label: 'Temperature T',
      min: 100, max: 1000, step: 10,
      value: this.model.T,
      format: (v) => `${v} K`,
      onInput: (v) => {
        this.model.T = v;
        if (this.mbView.compareModel) this.mbView.compareModel.T = v * 0.5;
      },
    }));

    // ── Compare T/2 overlay ──
    this.layout.addControl(new ToggleButton({
      id: this.controlId('compare'),
      label: 'Compare with T/2',
      value: false,
      onChange: (on) => {
        if (on) {
          this.mbView.compareModel = new MaxwellBoltzmannModel({
            M: this.model.M,
            T: this.model.T * 0.5,
          });
        } else {
          this.mbView.compareModel = null;
        }
      },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'vp',   label: 'v_p' },
      { key: 'vm',   label: 'v̄' },
      { key: 'vrms', label: 'v_rms' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.mbView.draw(this.model);
    this.readouts.set('vp',   `${this.model.vp.toFixed(0)} m/s`);
    this.readouts.set('vm',   `${this.model.vmean.toFixed(0)} m/s`);
    this.readouts.set('vrms', `${this.model.vrms.toFixed(0)} m/s`);
  }
}
