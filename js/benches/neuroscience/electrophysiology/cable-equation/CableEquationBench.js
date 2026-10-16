/**
 * CableEquationBench — passive dendrite cable equation explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { CableEquationModel } from './CableEquationModel.js';
import { CableEquationView } from './CableEquationView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class CableEquationBench extends Bench {
  static meta = {
    id: 'cable-equation',
    title: 'Cable equation',
    navLabel: 'Cable equation',
    canvasLabel: 'Steady-state voltage profile along the dendrite',
    level: 'university',
    keywords: [
      'cable equation', 'dendrite', 'space constant', 'lambda', 'input resistance',
      'passive', 'membrane resistance', 'Rall', 'axial resistivity', 'time constant',
    ],
    related: ['neuroscience/electrophysiology/neuron'],
  };

  static info = {
    formula:
      'λ = (1/2)√(d·Rm/Ra)  [space constant]\n' +
      'V(x) = V₀·e^(−x/λ)   [semi-infinite cable]\n' +
      'R_in = (2/π)√(Rm·Ra)·d^(−3/2)  [Ω]\n' +
      'τ_m = Rm·Cm           [time constant]\n' +
      'Rall 3/2 law: R_in ∝ d^(−3/2)',
    predict: [
      'Quadruple the dendrite diameter from 1 μm to 4 μm. By what factor does λ change? (λ∝√d → 2×)',
      'Set Rm to a very low value (leaky membrane). What happens to λ?',
      'A synapse is at x=2λ. What fraction of input voltage reaches the soma?',
    ],
    breaks: [
      'Passive cable only: no voltage-gated channels, no action potentials.',
      'Infinite geometry assumed by default; finite cable uses sealed or killed end.',
      'Uniform diameter: real dendrites taper.',
      'No branching (Rall 1959 branching conditions not modelled).',
    ],
    derive: [
      { text: 'Cable: τ_m·∂V/∂t = λ²·∂²V/∂x² − V. Steady-state: λ²·V″ = V.' },
      { text: 'Solution: V = A·e^(x/λ) + B·e^(−x/λ). Finite at ∞: A=0. V(0)=V₀ → B=V₀.' },
      { text: 'r_m = Rm/(πd), r_i = 4Ra/(πd²) → λ = √(r_m/r_i) = (1/2)√(d·Rm/Ra).' },
      { text: 'R_in = V₀/I where I = V₀/(r_i·λ) (gradient at x=0) → R_in = r_i·λ.' },
    ],
    research: {
      questions: [
        'Why does R_in scale as d^(−3/2) and not as d^(−1)?',
        'What boundary condition gives the sealed end, and why does it give a higher R_in?',
      ],
      challenge: 'Derive R_in for the sealed-end finite cable using boundary condition V′(L)=0.',
      papers: [
        {
          authors: 'W. Rall',
          year: 1959,
          title: 'Branching dendritic trees and motoneuron membrane resistivity',
          url: 'https://doi.org/10.1016/0014-4886(59)90046-9',
        },
        {
          authors: 'C. Koch',
          year: 1999,
          title: 'Biophysics of Computation, Ch. 2',
          url: 'https://doi.org/10.1093/oso/9780195181999.001.0001',
        },
      ],
    },
    notePlaceholder: 'Why does doubling diameter increase λ by only √2?',
  };

  build() {
    this._dMicrons = 1;     // diameter in μm
    this._Rm = 0.1;         // Ω·m²
    this._Ra = 1.0;         // Ω·m
    this._Cm = 0.01;        // F/m²

    this._updateModel();
    this._view = new CableEquationView(this.view);

    this.layout.setStageNote(
      'λ = (1/2)√(d·Rm/Ra)   V(x) = V₀·e^(−x/λ)   R_in = (2/π)√(Rm·Ra)·d^(−3/2)',
    );

    this._dSlider = new Slider({
      id: this.controlId('d'),
      label: 'd (μm)',
      min: 0.5, max: 20, step: 0.5,
      value: this._dMicrons,
      format: v => v.toFixed(1),
      onInput: (v) => { this._dMicrons = v; this._updateModel(); },
    });
    this.layout.addControl(this._dSlider);

    this._rmSlider = new Slider({
      id: this.controlId('Rm'),
      label: 'Rm (Ω·m²)',
      min: 0.01, max: 1.0, step: 0.01,
      value: this._Rm,
      format: v => v.toFixed(2),
      onInput: (v) => { this._Rm = v; this._updateModel(); },
    });
    this.layout.addControl(this._rmSlider);

    this._readouts = new ReadoutPanel([
      { key: 'lambda', label: 'λ (μm)' },
      { key: 'tau',    label: 'τ_m (ms)' },
      { key: 'Rin',    label: 'R_in (MΩ)' },
      { key: 'V_lam',  label: 'V(λ)/V₀' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _updateModel() {
    this.model = new CableEquationModel({
      d_m:       this._dMicrons * 1e-6,
      Rm_ohm_m2: this._Rm,
      Ra_ohm_m:  this._Ra,
      Cm_F_m2:   this._Cm,
    });
  }

  update(_dt) {}

  draw() {
    this._view.draw(this.model);
    const lam  = this.model.spaceConstant();
    const tau  = this.model.timeConstant();
    const Rin  = this.model.inputResistance();
    const Vlam = this.model.steadyState(lam, 1);

    this._readouts.set('lambda', (lam * 1e6).toFixed(1));
    this._readouts.set('tau',    (tau * 1e3).toFixed(2));
    this._readouts.set('Rin',    (Rin / 1e6).toFixed(2));
    this._readouts.set('V_lam',  Vlam.toFixed(5));
  }
}
