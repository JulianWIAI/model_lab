/**
 * EnzymeKineticsBench — Michaelis–Menten kinetics and inhibition.
 */
import { Bench } from '../../../../core/Bench.js';
import { EnzymeKineticsModel } from './EnzymeKineticsModel.js';
import { EnzymeKineticsView } from './EnzymeKineticsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ActionButton } from '../../../../ui/ActionButton.js';

export class EnzymeKineticsBench extends Bench {
  static meta = {
    id: 'enzyme-kinetics',
    title: 'Enzyme kinetics',
    navLabel: 'Enzyme kinetics',
    canvasLabel: 'Reaction rate v vs substrate [S]',
    level: 'university',
    keywords: [
      'enzyme', 'Michaelis-Menten', 'Km', 'Vmax', 'kinetics', 'inhibition',
      'competitive', 'uncompetitive', 'mixed', 'Lineweaver-Burk', 'biochemistry',
    ],
    related: ['biology/central-dogma', 'chemistry/titration'],
  };

  static info = {
    formula: 'v = Vmax·[S] / (Km + [S])',
    predict: [
      'At [S] = Km, what fraction of Vmax is reached?',
      'How does competitive inhibition change the Lineweaver–Burk plot?',
      'Which inhibitor type lowers apparent Vmax?',
    ],
    breaks: [
      'Assumes steady-state (ES complex equilibrium), breaking down at very short timescales.',
      'Single-substrate reaction only; many enzymes have two substrates.',
      'Does not model cooperativity (Hill equation) or allosteric regulation.',
    ],
    derive: [
      { text: 'At steady state, ES complex formation equals breakdown: k₁[E][S] = (k₋₁ + k₂)[ES].' },
      { text: 'Km = (k₋₁ + k₂)/k₁ is the substrate concentration at half-maximal rate.', formula: 'Km = (k₋₁ + k₂) / k₁' },
      { text: 'Vmax = k₂·[E_total]. Rate = Vmax·[S] / (Km + [S]).' },
      { text: 'Competitive inhibitor binds only free enzyme, raising apparent Km by factor α = 1 + [I]/Ki.' },
    ],
    research: {
      questions: [
        'Why is the Lineweaver–Burk plot inaccurate at low [S]? What is a better transformation?',
        'How do pharmaceutical drugs exploit enzyme inhibition?',
      ],
      challenge: 'Fit the noisy data to determine Ki from competitive inhibition at two [I] values.',
      papers: [
        { authors: 'L. Michaelis & M. L. Menten', year: 1913, title: 'Die Kinetik der Invertinwirkung' },
        { authors: 'G. E. Briggs & J. B. S. Haldane', year: 1925, title: 'A Note on the Kinetics of Enzyme Action' },
      ],
    },
    notePlaceholder: 'Note how Km and Vmax change under each inhibitor type…',
  };

  build() {
    this.model = new EnzymeKineticsModel();
    this.kineticsView = new EnzymeKineticsView(this.view);
    this._data = [];
    this._fitResult = null;

    this.layout.addControl(new Slider({
      id: this.controlId('vmax'),
      label: 'Vmax',
      min: 10, max: 200, value: 100,
      format: (v) => `${v} µM/s`,
      onInput: (v) => { this.model.Vmax = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('km'),
      label: 'Km',
      min: 1, max: 100, value: 10,
      format: (v) => `${v} µM`,
      onInput: (v) => { this.model.Km = v; },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('inhibtype'),
      label: 'Inhibitor',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Comp.', value: 'competitive' },
        { label: 'Uncomp.', value: 'uncompetitive' },
        { label: 'Mixed', value: 'mixed' },
      ],
      value: 'none',
      onChange: (v) => { this.model.inhibitorType = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('inhib'),
      label: '[I] inhibitor',
      min: 0, max: 50, value: 0,
      format: (v) => `${v} µM`,
      onInput: (v) => { this.model.inhibitorConc = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('ki'),
      label: 'Ki',
      min: 1, max: 50, value: 10,
      format: (v) => `${v} µM`,
      onInput: (v) => { this.model.Ki = v; this.model.Kiprime = v; },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('view'),
      label: 'Plot',
      options: [
        { label: 'v vs [S]', value: 'mm' },
        { label: 'Lineweaver–Burk', value: 'lb' },
      ],
      value: 'mm',
      onChange: (v) => { this.kineticsView.showLineweaver = v === 'lb'; },
    }));

    this.layout.addAction(new ActionButton({
      label: 'Add data',
      onClick: () => {
        const sVals = [1, 2, 5, 10, 20, 50, 100, 200];
        this._data = this.model.generateData(sVals, 0.05);
        this._fitResult = null;
      },
    }));

    this.layout.addAction(new ActionButton({
      label: 'Fit',
      onClick: () => {
        if (this._data.length === 0) return;
        const sV = this._data.map(d => d.s);
        const vV = this._data.map(d => d.v);
        this._fitResult = EnzymeKineticsModel.fitMM(sV, vV);
      },
    }));

    this.layout.addAction(new ActionButton({
      label: 'Clear data',
      onClick: () => { this._data = []; this._fitResult = null; },
    }));
  }

  update(_dt) {}

  draw() {
    this.kineticsView.draw(this.model, this._data);
    this.layout.setReadout('app-km', `${this.model.apparentKm.toFixed(2)} µM`);
    this.layout.setReadout('app-vmax', `${this.model.apparentVmax.toFixed(2)} µM/s`);
    if (this._fitResult) {
      this.layout.setReadout('fit-km', `${this._fitResult.Km.toFixed(2)}`);
      this.layout.setReadout('fit-vmax', `${this._fitResult.Vmax.toFixed(2)}`);
    }
  }
}
