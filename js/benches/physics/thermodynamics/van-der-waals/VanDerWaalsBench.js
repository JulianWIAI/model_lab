/**
 * VanDerWaalsBench — van der Waals equation of state and critical compressibility.
 * Main comparison: VdW predicts Z_c = 0.375; real CO₂ Z_c ≈ 0.275 (NIST).
 */
import { Bench } from '../../../../core/Bench.js';
import { VanDerWaalsModel, CO2_PRESET } from './VanDerWaalsModel.js';
import { VanDerWaalsView } from './VanDerWaalsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class VanDerWaalsBench extends Bench {
  static meta = {
    id: 'van-der-waals',
    title: 'Van der Waals equation',
    navLabel: 'Van der Waals',
    canvasLabel: 'P/P_c vs V_m/V_c — reduced-form isotherms',
    level: 'university',
    keywords: [
      'van der Waals', 'equation of state', 'critical point', 'compressibility factor',
      'reduced variables', 'isotherm', 'corresponding states', 'phase transition',
    ],
    related: ['physics/ideal-gas', 'chemistry/equilibrium'],
  };

  static info = {
    formula:
      'P = RT/(V_m−b) − a/V_m²\n' +
      'V_c = 3b,  T_c = 8a/(27Rb),  P_c = a/(27b²)\n' +
      'Z_c(VdW) = 3/8 = 0.375\n' +
      'Z_c(CO₂, NIST) ≈ 0.275\n' +
      'Reduced: P_r = 8T_r/(3V_r−1) − 3/V_r²',
    predict: [
      'What does the "S-shaped" part of the sub-critical isotherm represent physically?',
      'Why is Z_c(VdW) = 0.375 a universal constant, independent of a and b?',
      'As T_r → ∞, how does the VdW isotherm approach the ideal-gas isotherm?',
    ],
    breaks: [
      'The VdW equation is qualitatively correct but quantitatively inaccurate; Z_c = 0.375 overestimates real gases (most lie in 0.23–0.29).',
      'CO₂ a and b derived from NIST T_c and P_c via inverse critical-point relations — not fitted to PVT data directly.',
      'The sub-critical "S-loop" (VdW loop) is unphysical; the true equilibrium path is horizontal (Maxwell equal-area rule), not shown here.',
      'At very high pressures or very small V_m, the VdW equation fails badly (b must be subtracted from V_m, not just a small correction).',
    ],
    derive: [
      { text: 'Setting (∂P/∂V_m)_T = 0 and (∂²P/∂V_m²)_T = 0 at the critical point gives V_c = 3b, T_c = 8a/(27Rb), P_c = a/(27b²).' },
      { text: 'Z_c = P_c·V_c/(R·T_c) = (a/27b²)·3b / (R·8a/27Rb) = 3/8, independent of a and b — the law of corresponding states.' },
      { text: 'In reduced variables P_r, V_r, T_r, the VdW equation has no free parameters: P_r = 8T_r/(3V_r−1) − 3/V_r².' },
    ],
    research: {
      questions: [
        'Why do real gases have Z_c < 0.375? What molecular effects does VdW miss?',
        'How does the Peng–Robinson equation of state improve on VdW for hydrocarbons?',
      ],
      challenge: 'Apply the Maxwell equal-area rule to find the equilibrium vapour pressure of CO₂ at T_r = 0.9 from the VdW equation.',
      papers: [
        { authors: 'J. D. van der Waals', year: 1873, title: 'On the continuity of the gas and liquid state (doctoral thesis)', url: 'https://doi.org/10.1007/s10765-007-0267-3' },
      ],
    },
    notePlaceholder: 'Compare the T_r = 0.9 isotherm with T_r = 1.1. Where does the VdW loop appear? What does it mean?',
  };

  build() {
    this.model  = new VanDerWaalsModel({ a: CO2_PRESET.a, b: CO2_PRESET.b });
    this.vdwView = new VanDerWaalsView(this.view);
    this._Tr    = 1.0;

    this.layout.addControl(new Slider({
      id: this.controlId('Tr'),
      label: 'T_r = T/T_c',
      min: 0.7, max: 1.4, step: 0.05,
      value: this._Tr,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this._Tr = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'Tr',      label: 'T_r' },
      { key: 'Tc',      label: 'T_c (CO₂)' },
      { key: 'Zc_vdw',  label: 'Z_c (VdW)' },
      { key: 'Zc_real', label: 'Z_c (CO₂ real)' },
    ]);
    this.layout.setReadouts(this.readouts);
    this.layout.setStageNote(
      `CO₂: a and b derived from NIST T_c = ${CO2_PRESET.Tc} K, P_c = ${(CO2_PRESET.Pc / 1e5).toFixed(2)} bar. ` +
      `Z_c(VdW) = 0.375 vs Z_c(real) ≈ ${CO2_PRESET.Zc_real.toFixed(3)}.`,
    );
  }

  update(_dt) {}

  draw() {
    this.vdwView.draw(this.model, this._Tr);
    const { Tc } = this.model.criticalPoint;
    this.readouts.set('Tr',      this._Tr.toFixed(2));
    this.readouts.set('Tc',      `${CO2_PRESET.Tc} K`);
    this.readouts.set('Zc_vdw',  '0.375');
    this.readouts.set('Zc_real', CO2_PRESET.Zc_real.toFixed(3));
  }
}
