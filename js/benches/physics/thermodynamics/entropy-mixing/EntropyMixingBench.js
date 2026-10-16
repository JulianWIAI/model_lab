/**
 * EntropyMixingBench — ideal entropy of mixing explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { EntropyMixingModel, R_GAS } from './EntropyMixingModel.js';
import { EntropyMixingView } from './EntropyMixingView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class EntropyMixingBench extends Bench {
  static meta = {
    id: 'entropy-mixing',
    title: 'Entropy of mixing',
    navLabel: 'Entropy of mixing',
    canvasLabel: 'ΔS_mix vs mole fraction for ideal binary mixture',
    level: 'intro',
    keywords: [
      'entropy', 'mixing', 'ideal', 'mole fraction', 'Gibbs', 'thermodynamics',
      'statistical mechanics', 'Boltzmann', 'gas constant', 'Gibbs paradox',
    ],
    related: ['physics/thermodynamics/carnot'],
  };

  static info = {
    formula:
      'ΔS_mix = −R·Σᵢ xᵢ·ln xᵢ\n' +
      'R = 8.31446 J/(mol·K)  (CODATA 2018)\n' +
      'Binary equimolar: ΔS = R·ln 2 = 5.763 J/(mol·K)\n' +
      'Maximum at xᵢ = 1/N  (equimolar)',
    predict: [
      'Start with two equal-fraction components. Add a third equal fraction. Does ΔS increase or decrease?',
      'Set one component to x=0.99 and a trace to x=0.01. Is mixing entropy close to pure or equimolar?',
      'For an ideal binary at T=298 K, where is the minimum of ΔG_mix? Why does mixing occur spontaneously?',
      'Two beakers of pure nitrogen are mixed. What is ΔS? Why is this the Gibbs paradox?',
    ],
    breaks: [
      'Ideal mixing only: ΔH=0 assumed. Real solutions have enthalpy of mixing.',
      'Assumes distinguishable species. Mixing identical gases gives ΔS=0 (Gibbs paradox).',
      'No pressure or volume effects: molar volumes assumed equal.',
      'Temperature-independent: no T-dependent correction from real activity coefficients.',
    ],
    derive: [
      { text: 'Statistical: S = k_B ln W, W = N!/(N₁!…Nₖ!) → ΔS/R = −Σ xᵢ ln xᵢ (Stirling).' },
      { text: 'Thermodynamic: gas i expands from xᵢV to V at constant T,p. ΔSᵢ = nᵢR ln(1/xᵢ).' },
      { text: 'Both give same formula — independent verification.' },
      { text: 'Maximum: d/dxᵢ(−Σ xᵢ ln xᵢ) = 0 → xᵢ = 1/N. Max ΔS = R·ln N.' },
    ],
    research: {
      questions: [
        'Why does ideal mixing always increase entropy? Relate to the concavity of −Σ xᵢ ln xᵢ.',
        'If all components are identical (Gibbs paradox), what should ΔS be, and why?',
      ],
      challenge: 'Derive ΔS_mix starting from the multinomial coefficient W = N!/(N₁!N₂!…Nₖ!).',
      papers: [
        {
          authors: 'P. Atkins, J. de Paula',
          year: 2014,
          title: 'Physical Chemistry, 10th ed., §5A',
          url: 'https://doi.org/10.1093/hesc/9780198769866.001.0001',
        },
        {
          authors: 'A. Ben-Naim',
          year: 2008,
          title: 'A Farewell to Entropy',
          url: 'https://doi.org/10.1142/6469',
        },
      ],
    },
    notePlaceholder: 'Why is ΔS_mix maximum at equimolar composition?',
  };

  build() {
    this._x1 = 0.5;
    this._updateModel();
    this._view = new EntropyMixingView(this.view);

    this.layout.setStageNote('ΔS_mix = −R·Σᵢ xᵢ·ln xᵢ  (ideal mixing; distinguishable gases)');

    this._x1Slider = new Slider({
      id: this.controlId('x1'),
      label: 'x₁ (mol fraction A)',
      min: 0, max: 1, step: 0.01,
      value: this._x1,
      format: v => v.toFixed(2),
      onInput: (v) => {
        this._x1 = v;
        this._updateModel();
      },
    });
    this.layout.addControl(this._x1Slider);

    this._readouts = new ReadoutPanel([
      { key: 'dS',  label: 'ΔS_mix (J/mol·K)' },
      { key: 'dG',  label: 'ΔG_mix at 298 K (J/mol)' },
      { key: 'max', label: 'Max ΔS (R·ln 2)' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _updateModel() {
    const x1 = Math.max(0, Math.min(1, this._x1));
    const x2 = 1 - x1;
    this.model = new EntropyMixingModel([
      { name: 'A', x: x1 },
      { name: 'B', x: x2 },
    ]);
  }

  update(_dt) {}

  draw() {
    this._view.draw(this.model);
    const dS  = this.model.deltaS();
    const dG  = this.model.deltaG(298);
    const max = R_GAS * Math.LN2;
    this._readouts.set('dS',  dS.toFixed(4));
    this._readouts.set('dG',  dG.toFixed(2));
    this._readouts.set('max', max.toFixed(4));
  }
}
