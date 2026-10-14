/**
 * GibbsBench — Gibbs free energy ΔG = ΔH − TΔS and equilibrium constant K.
 */
import { Bench } from '../../../../core/Bench.js';
import { GibbsModel, ICE_FUSION } from './GibbsModel.js';
import { GibbsView } from './GibbsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class GibbsBench extends Bench {
  static meta = {
    id: 'gibbs',
    title: 'Gibbs free energy',
    navLabel: 'Gibbs free energy',
    canvasLabel: 'ΔG = ΔH − TΔS vs temperature',
    level: 'university',
    keywords: [
      'Gibbs free energy', 'ΔG', 'ΔH', 'ΔS', 'spontaneity', 'equilibrium constant',
      'thermodynamics', 'crossover temperature', 'ice fusion', 'Clausius',
    ],
    related: ['chemistry/equilibrium', 'chemistry/buffers'],
  };

  static info = {
    formula:
      'ΔG = ΔH − T·ΔS\n' +
      'K = exp(−ΔG°/RT)\n' +
      'T* = ΔH/ΔS  (where ΔG = 0)',
    predict: [
      'At what temperature does melting become spontaneous for the ice preset?',
      'How does K change as T increases above T*?',
      'A reaction has ΔH > 0 and ΔS < 0. Is it ever spontaneous?',
    ],
    breaks: [
      'ΔH and ΔS are treated as temperature-independent (no Cp correction).',
      'ΔS for ice fusion is derived from ΔH_fus / T_fus (Clausius relation at equilibrium), not independently measured.',
      'K relates to standard-state ΔG°; activity corrections are not included.',
      'Pressure effects on ΔG (PΔV term) are ignored — valid at constant pressure.',
    ],
    derive: [
      { text: 'At equilibrium ΔG = 0 → K = exp(0) = 1 and T = ΔH/ΔS, the crossover temperature.' },
      { text: 'For ice fusion, ΔH = +6010 J/mol (CODATA). ΔS = ΔH/T_fus = 6010/273.15 = 22.00 J/(mol·K) — derived from the melting point, not independently measured.' },
      { text: 'When ΔH and ΔS are both positive, the reaction is spontaneous above T* and non-spontaneous below it.' },
    ],
    research: {
      questions: [
        'Why is ΔG a better criterion for spontaneity than ΔH alone?',
        'For a reaction with ΔH = −100 kJ/mol and ΔS = −200 J/(mol·K), at what temperature does it become non-spontaneous?',
      ],
      challenge: 'Show that ΔG = ΔH − TΔS follows from the combined first and second laws of thermodynamics for a system at constant T and P.',
      papers: [
        { authors: 'J. D. van\'t Hoff', year: 1884, title: 'Études de Dynamique Chimique', url: 'https://doi.org/10.1002/recl.18840030602' },
        { authors: 'J. W. Gibbs', year: 1878, title: 'On the equilibrium of heterogeneous substances', url: 'https://doi.org/10.2307/20266' },
      ],
    },
    notePlaceholder: 'What happens to K as T → ∞ for ice fusion? What physical meaning does K → ∞ have?',
  };

  build() {
    this.model    = new GibbsModel({ dH: ICE_FUSION.dH, dS: ICE_FUSION.dS });
    this.gibbsView = new GibbsView(this.view);
    this._Tmin    = 200;
    this._Tmax    = 380;
    this._Tcursor = 273.15;
    this._preset  = 'ice';

    // ── Preset buttons ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Preset',
      options: [
        { label: 'Ice fusion', value: 'ice' },
        { label: 'Custom', value: 'custom' },
      ],
      value: 'ice',
      onChange: (v) => {
        this._preset = v;
        if (v === 'ice') {
          this.model.dH = ICE_FUSION.dH;
          this.model.dS = ICE_FUSION.dS;
          this._dHSlider.setValue(this.model.dH);
          this._dSSlider.setValue(this.model.dS);
          this.layout.setStageNote(
            '⚠ ΔS derived from ΔH/T_fus (Clausius relation); not independently measured.',
          );
        } else {
          this.layout.setStageNote('');
        }
      },
    }));

    // ── ΔH slider ──
    this._dHSlider = new Slider({
      id: this.controlId('dH'),
      label: 'ΔH',
      min: -50000, max: 50000, step: 100,
      value: this.model.dH,
      format: (v) => `${(v / 1000).toFixed(2)} kJ/mol`,
      onInput: (v) => { this.model.dH = v; this._preset = 'custom'; },
    });
    this.layout.addControl(this._dHSlider);

    // ── ΔS slider ──
    this._dSSlider = new Slider({
      id: this.controlId('dS'),
      label: 'ΔS',
      min: -200, max: 200, step: 0.5,
      value: this.model.dS,
      format: (v) => `${v.toFixed(1)} J/(mol·K)`,
      onInput: (v) => { this.model.dS = v; this._preset = 'custom'; },
    });
    this.layout.addControl(this._dSSlider);

    // ── T cursor ──
    this.layout.addControl(new Slider({
      id: this.controlId('tcursor'),
      label: 'T cursor',
      min: 150, max: 500, step: 1,
      value: this._Tcursor,
      format: (v) => `${v.toFixed(0)} K`,
      onInput: (v) => { this._Tcursor = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'dG',   label: 'ΔG at cursor' },
      { key: 'K',    label: 'K at cursor' },
      { key: 'Tstar', label: 'T* (ΔG=0)' },
    ]);
    this.layout.setReadouts(this.readouts);
    this.layout.setStageNote('⚠ ΔS derived from ΔH/T_fus (Clausius relation); not independently measured.');
  }

  update(_dt) {}

  draw() {
    this.gibbsView.draw(this.model, this._Tmin, this._Tmax, this._Tcursor);
    const dG = this.model.deltaG(this._Tcursor);
    const K  = this.model.K(this._Tcursor);
    const T0 = this.model.crossoverT;
    this.readouts.set('dG',   `${(dG / 1000).toFixed(2)} kJ/mol`);
    this.readouts.set('K',    K.toExponential(3));
    this.readouts.set('Tstar', T0 !== null ? `${T0.toFixed(1)} K` : 'n/a');
  }
}
