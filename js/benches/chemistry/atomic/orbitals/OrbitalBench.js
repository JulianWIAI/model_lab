/**
 * OrbitalBench — hydrogen atomic orbitals: density heatmap and radial distribution.
 */
import { Bench } from '../../../../core/Bench.js';
import { OrbitalModel } from './OrbitalModel.js';
import { OrbitalView } from './OrbitalView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';

export class OrbitalBench extends Bench {
  static meta = {
    id: 'orbitals',
    title: 'Hydrogen orbitals',
    navLabel: 'Hydrogen orbitals',
    canvasLabel: 'Probability density |ψ|² in xz-plane',
    level: 'university',
    keywords: [
      'hydrogen', 'orbital', 'wavefunction', 'quantum numbers', 'n', 'l', 'm',
      'radial distribution', 'spherical harmonics', 'Laguerre', 'probability density',
      'atomic structure', 'nodes', 'Bohr radius',
    ],
    related: ['chemistry/periodic-table', 'chemistry/equilibrium'],
  };

  static info = {
    formula: 'ψ_nlm(r,θ,φ) = R_nl(r)·Y_lm(θ,φ)   E_n = −13.6 eV / n²',
    predict: [
      'How many radial nodes does the 3s orbital have?',
      'Why does the 2p orbital have a different shape than 2s?',
      'Where is the electron most likely to be found in the 1s state?',
    ],
    breaks: [
      'Single-electron (hydrogen-like) only; multi-electron atoms have electron-electron repulsion.',
      'Relativistic corrections (spin-orbit coupling, Darwin term) are neglected.',
      'The heatmap shows the xz-plane only; the full 3D density requires spherical averaging.',
    ],
    derive: [
      { text: 'The Schrödinger equation for hydrogen separates in spherical coordinates into radial and angular parts.' },
      { text: 'The radial part R_nl uses associated Laguerre polynomials; the angular part uses spherical harmonics Y_lm.', formula: 'ψ = R_nl(r) · Y_lm(θ,φ)' },
      { text: 'Energy depends only on n: E_n = −13.6/n² eV (Bohr formula, exact for hydrogen).' },
      { text: 'Radial nodes = n − l − 1; angular nodes = l; total nodes = n − 1.' },
    ],
    research: {
      questions: [
        'Why are hydrogen energy levels degenerate in l and m?',
        'What breaks the l-degeneracy in multi-electron atoms?',
      ],
      challenge: 'Compute the expectation value ⟨r⟩ numerically and compare to n²[1 + ½(1 − l(l+1)/n²)] a₀.',
      papers: [
        { authors: 'E. Schrödinger', year: 1926, title: 'Quantisierung als Eigenwertproblem' },
        { authors: 'N. Bohr', year: 1913, title: 'On the Constitution of Atoms and Molecules' },
      ],
    },
    notePlaceholder: 'Describe the shape of each orbital and count its nodes…',
  };

  build() {
    this.model = new OrbitalModel({ n: 1, l: 0, m: 0 });
    this.orbitalView = new OrbitalView(this.view);

    const nOptions = [1, 2, 3, 4].map(v => ({ label: String(v), value: v }));
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('n'),
      label: 'n',
      options: nOptions,
      value: 1,
      onChange: (v) => {
        this.model = new OrbitalModel({ n: v, l: Math.min(this.model.l, v - 1), m: 0 });
        this._updateLMControls();
      },
    }));

    // l and m controlled via dynamic buttons (simplified as ButtonGroup)
    this._lGroup = new ButtonGroup({
      id: this.controlId('l'),
      label: 'l',
      options: [{ label: '0', value: 0 }],
      value: 0,
      onChange: (v) => {
        this.model = new OrbitalModel({ n: this.model.n, l: v, m: Math.min(Math.abs(this.model.m), v) * Math.sign(this.model.m || 1) });
      },
    });
    this.layout.addControl(this._lGroup);

    this._mGroup = new ButtonGroup({
      id: this.controlId('m'),
      label: 'm',
      options: [{ label: '0', value: 0 }],
      value: 0,
      onChange: (v) => { this.model.m = v; this.model._cacheKey = null; },
    });
    this.layout.addControl(this._mGroup);
  }

  _updateLMControls() {
    const n = this.model.n;
    // l options: 0..n-1
    const lOpts = Array.from({ length: n }, (_, i) => ({ label: String(i), value: i }));
    this._lGroup.setOptions?.(lOpts);
    this._updateMControls();
  }

  _updateMControls() {
    const l = this.model.l;
    const mOpts = [];
    for (let mv = -l; mv <= l; mv++) mOpts.push({ label: String(mv), value: mv });
    this._mGroup.setOptions?.(mOpts);
  }

  update(_dt) {}

  draw() {
    this.orbitalView.draw(this.model);
    this.layout.setReadout('energy', `${this.model.energy.toFixed(3)} eV`);
    this.layout.setReadout('radial-nodes', String(this.model.radialNodes));
    this.layout.setReadout('angular-nodes', String(this.model.angularNodes));
    this.layout.setReadout('r-mpr', `${this.model.mostProbableRadius.toFixed(2)} a₀`);
  }
}
