/**
 * GoldmanBench — Goldman–Hodgkin–Katz membrane potential.
 * Compares resting (K⁺-dominated) and action-potential (Na⁺-dominated) states.
 */
import { Bench } from '../../../../core/Bench.js';
import { GoldmanModel, SQUID_AXON, SQUID_AXON_REST, SQUID_AXON_AP, MAMMALIAN_MUSCLE } from './GoldmanModel.js';
import { GoldmanView } from './GoldmanView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class GoldmanBench extends Bench {
  static meta = {
    id: 'goldman',
    title: 'Membrane potential (GHK)',
    navLabel: 'Goldman equation',
    canvasLabel: 'V_m vs P_Na permeability ratio (P_K = 1)',
    level: 'university',
    keywords: [
      'Goldman', 'Hodgkin–Katz', 'membrane potential', 'resting potential',
      'action potential', 'Nernst', 'permeability', 'K⁺', 'Na⁺', 'Cl⁻',
      'electrophysiology', 'squid axon',
    ],
    related: ['neuroscience/neuron'],
  };

  static info = {
    formula:
      'V_m = (RT/F) · ln[(P_K[K]_o + P_Na[Na]_o + P_Cl[Cl]_i) /\n' +
      '                   (P_K[K]_i + P_Na[Na]_i + P_Cl[Cl]_o)]',
    predict: [
      'What happens to V_m as you increase P_Na from 0.04 to 20?',
      'At what P_Na ratio does V_m cross 0 mV?',
      'Why is E_K negative but E_Na positive?',
    ],
    breaks: [
      'The GHK equation assumes constant electric field across a planar membrane — not true for all membrane geometries.',
      'Valid only for monovalent ions; Ca²⁺ and Mg²⁺ require the bivalent extension.',
      'Concentrations are treated as constant (no depletion/accumulation during current flow).',
      'Fixed T = 20 °C (293 K) — squid-axon experimental temperature; mammalian cells use 37 °C.',
    ],
    derive: [
      { text: 'Setting P_Na = 0 and P_Cl = 0 recovers the Nernst equation for K⁺: V_m = (RT/F)·ln([K]_o/[K]_i).' },
      { text: 'At the action-potential peak, P_Na/P_K ≈ 20, pulling V_m toward the Na⁺ Nernst potential (≈+55 mV).' },
      { text: 'Cl⁻ enters with concentrations inverted (Cl_i in numerator) because it carries negative charge (z = −1).' },
    ],
    research: {
      questions: [
        'Why does the resting Vm of mammalian neurons (≈−70 mV) differ from the K⁺ Nernst potential (≈−90 mV)?',
        'How does the Na⁺/K⁺-ATPase pump maintain the concentration gradients assumed by the GHK equation?',
      ],
      challenge: 'Derive the GHK current equation for K⁺ from first principles (constant-field assumption, Nernst–Planck equation) and show how the voltage equation follows.',
      papers: [
        { authors: 'D. E. Goldman', year: 1943, title: 'Potential, impedance, and rectification in membranes', url: 'https://doi.org/10.1085/jgp.27.1.37' },
        { authors: 'A. L. Hodgkin & B. Katz', year: 1949, title: 'The effect of sodium ions on the electrical activity of the giant axon of the squid', url: 'https://doi.org/10.1113/jphysiol.1949.sp004310' },
      ],
    },
    notePlaceholder: 'Why does E_K set the resting potential rather than E_Na or E_Cl?',
  };

  build() {
    this.model = new GoldmanModel();
    this.ghkView = new GoldmanView(this.view);
    this.layout.setStageNote('Squid giant axon, 20 °C (Hodgkin & Katz 1949)');

    // ── Preset buttons ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Preset',
      options: [
        { label: 'Squid axon, rest (20 °C)', value: 'rest' },
        { label: 'Squid axon, AP peak (20 °C)', value: 'ap' },
        { label: 'Mammalian muscle, rest (37 °C)', value: 'mammal' },
        { label: 'Custom', value: 'custom' },
      ],
      value: 'rest',
      onChange: (v) => {
        if (v === 'rest') {
          Object.assign(this.model, { ...SQUID_AXON, ...SQUID_AXON_REST, T: 293.15 });
          this._pNaSlider.setValue(this.model.PNa);
          this._pClSlider.setValue(this.model.PCl);
          this.layout.setStageNote('Squid giant axon, 20 °C (Hodgkin & Katz 1949)');
        } else if (v === 'ap') {
          Object.assign(this.model, { ...SQUID_AXON, ...SQUID_AXON_AP, T: 293.15 });
          this._pNaSlider.setValue(this.model.PNa);
          this._pClSlider.setValue(this.model.PCl);
          this.layout.setStageNote('Action-potential peak: P_Na/P_K ≈ 20 (squid axon, 20 °C; Hodgkin & Katz 1949)');
        } else if (v === 'mammal') {
          Object.assign(this.model, MAMMALIAN_MUSCLE);
          this._pNaSlider.setValue(this.model.PNa);
          this._pClSlider.setValue(this.model.PCl);
          this.layout.setStageNote('Mammalian skeletal muscle, 37 °C (concentrations: Hille 2001 Ch. 1 — not checked against primary source)');
        } else {
          this.layout.setStageNote('');
        }
      },
    }));

    // ── Sliders ──
    this._pNaSlider = new Slider({
      id: this.controlId('pna'),
      label: 'P_Na / P_K',
      min: 0.01, max: 30, step: 0.01,
      value: this.model.PNa,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.PNa = v; },
    });
    this.layout.addControl(this._pNaSlider);

    this._pClSlider = new Slider({
      id: this.controlId('pcl'),
      label: 'P_Cl / P_K',
      min: 0, max: 5, step: 0.01,
      value: this.model.PCl,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.PCl = v; },
    });
    this.layout.addControl(this._pClSlider);

    // ── Readouts ──
    this.readouts = new ReadoutPanel([
      { key: 'vm',  label: 'V_m' },
      { key: 'ek',  label: 'E_K' },
      { key: 'ena', label: 'E_Na' },
      { key: 'ecl', label: 'E_Cl' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.ghkView.draw(this.model);
    const { EK, ENa, ECl } = this.model.nernstPotentials;
    this.readouts.set('vm',  `${this.model.Vm.toFixed(1)} mV`);
    this.readouts.set('ek',  `${EK.toFixed(1)} mV`);
    this.readouts.set('ena', `${ENa.toFixed(1)} mV`);
    this.readouts.set('ecl', `${ECl.toFixed(1)} mV`);
  }
}
