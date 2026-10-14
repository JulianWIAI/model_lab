/**
 * SpectraBench — hydrogen and deuterium spectral series from the Rydberg formula.
 */
import { Bench } from '../../../../core/Bench.js';
import { SpectraModel } from './SpectraModel.js';
import { SpectraView } from './SpectraView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class SpectraBench extends Bench {
  static meta = {
    id: 'spectra',
    title: 'Atomic spectra',
    navLabel: 'Atomic spectra',
    canvasLabel: 'Hydrogen and deuterium spectral series — Lyman, Balmer, Paschen, Brackett',
    level: 'university',
    keywords: [
      'Rydberg', 'spectral lines', 'Balmer', 'Lyman', 'Paschen', 'Brackett',
      'hydrogen', 'deuterium', 'reduced mass', 'isotope shift',
      'wavelength', 'photon energy', 'emission spectrum', 'absorption',
    ],
    related: ['chemistry/orbitals', 'chemistry/periodic-table'],
  };

  static info = {
    formula:
      '1/λ = R_X·(1/n₁² − 1/n₂²)   R_X = R_∞/(1 + mₑ/m_X)\n' +
      'R_∞ = 1.097 373 × 10⁷ m⁻¹   (NIST CODATA 2018)\n' +
      'R_H ≈ 1.096 78 × 10⁷ m⁻¹   R_D ≈ 1.097 07 × 10⁷ m⁻¹\n' +
      'λ_air = λ_vac / 1.000 277  (Allen 2000, valid λ > 200 nm)',
    predict: [
      'Which Balmer line falls in the red? In the blue? Predict before you look.',
      'Does the deuterium Balmer-α line shift to longer or shorter wavelength? By how much?',
      'Why does the Lyman series land in the UV while the Paschen series is in the IR?',
    ],
    breaks: [
      'Single-electron atoms only; multi-electron transitions require configuration-interaction methods.',
      'Fine structure (spin-orbit), hyperfine (nuclear spin) and Lamb shift corrections are not included.',
      'The air refractive index 1.000277 is for standard dry air at 15 °C, 101 325 Pa; it varies with humidity, temperature and pressure.',
    ],
    derive: [
      { text: 'Bohr quantisation: mvr = nℏ; centripetal force balances Coulomb attraction.' },
      { text: 'Energy levels: E_n = −m_r·e⁴/(8ε₀²h²n²) where m_r = mₑ·m_p/(mₑ+m_p) is the reduced mass.' },
      { text: 'Photon energy emitted equals the level difference.', formula: 'hν = E_{n₂} − E_{n₁}' },
      { text: 'Rydberg formula in wavelength form (vacuum):', formula: '1/λ = R_X·(1/n₁² − 1/n₂²)' },
      { text: 'Reduced mass makes R_H slightly smaller than R_∞; heavier nucleus → R closer to R_∞, shift ≈ −0.18 nm for D Balmer-α.' },
    ],
    research: {
      questions: [
        'What additional lines appear when the Paschen and Brackett series overlap on an IR detector?',
        'How was the Lamb shift measured, and what does it reveal about QED?',
      ],
      challenge: 'Predict the vacuum wavelength of the first line in the Pfund series (n₁=5, n₂=6) and check whether it is in the mid-IR.',
      papers: [
        { authors: 'J. J. Balmer', year: 1885, title: 'Notiz über die Spektrallinien des Wasserstoffs' },
        { authors: 'J. R. Rydberg', year: 1889, title: 'Recherches sur la constitution des spectres d\'émission des éléments chimiques' },
        { authors: 'N. Bohr', year: 1913, title: 'On the Constitution of Atoms and Molecules' },
      ],
    },
    notePlaceholder: 'Sketch the spectrum; note which lines are visible and explain why the others are not…',
  };

  build() {
    this.model = new SpectraModel({ isotope: 'H', series: 'all', showAir: false });
    this.spectraView = new SpectraView(this.view);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('isotope'),
      label: 'Isotope',
      options: [{ label: 'H', value: 'H' }, { label: 'D', value: 'D' }],
      value: 'H',
      onChange: (v) => { this.model.isotope = v; },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('wavelength'),
      label: 'Wavelength',
      options: [{ label: 'Vacuum', value: false }, { label: 'Air', value: true }],
      value: false,
      onChange: (v) => { this.model.showAir = v; },
    }));

    // Selected-line controls: series and n₂
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('series'),
      label: 'Series',
      options: [
        { label: 'Lyman',    value: 'lyman' },
        { label: 'Balmer',   value: 'balmer' },
        { label: 'Paschen',  value: 'paschen' },
        { label: 'Brackett', value: 'brackett' },
      ],
      value: 'balmer',
      onChange: (v) => {
        this._selectedSeries = v;
        this._selectedN2 = SpectraModel.SERIES[v].n1 + 1;
        this._updateReadouts();
      },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('n2'),
      label: 'n₂',
      options: [3, 4, 5, 6, 7].map((n) => ({ label: String(n), value: n })),
      value: 3,
      onChange: (v) => { this._selectedN2 = v; this._updateReadouts(); },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'n1n2',      label: 'Transition' },
      { key: 'lambda-vac', label: 'λ_vac (nm)' },
      { key: 'lambda-air', label: 'λ_air (nm)' },
      { key: 'energy',    label: 'Energy (eV)' },
      { key: 'region',    label: 'Region' },
    ]);
    this.layout.setReadouts(this.readouts);

    this._selectedSeries = 'balmer';
    this._selectedN2 = 3;
    this._updateReadouts();
  }

  _updateReadouts() {
    const s = SpectraModel.SERIES[this._selectedSeries];
    if (!s) return;
    const n1 = s.n1;
    const n2 = this._selectedN2;
    if (n2 <= n1) return;
    const lv = this.model.wavelengthVac(n1, n2);
    const la = this.model.wavelengthAir(n1, n2);
    const eV = SpectraModel.photonEnergy(lv);
    const visible = lv >= 380 && lv <= 700;
    this._n1 = n1; this._n2 = n2;
    this._lv = lv; this._la = la; this._eV = eV;
    this._region = visible ? 'Visible' : (lv < 380 ? 'UV' : 'IR');
  }

  update(_dt) {}

  draw() {
    this.spectraView.draw(this.model);
    if (this._lv != null) {
      const lv = this._lv, la = this._la, eV = this._eV;
      this.readouts.set('n1n2',       `${this._n1} → ${this._n2}`);
      this.readouts.set('lambda-vac', isFinite(lv) ? lv.toFixed(3) : '∞');
      this.readouts.set('lambda-air', (isFinite(la) && la > 200) ? la.toFixed(3) : lv.toFixed(3));
      this.readouts.set('energy',     isFinite(eV) ? eV.toFixed(4) : '—');
      this.readouts.set('region',     this._region ?? '—');
    }
  }
}
