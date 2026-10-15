/**
 * NernstCellBench — Nernst equation for the Daniell cell.
 */
import { Bench } from '../../../../core/Bench.js';
import { NernstCellModel } from './NernstCellModel.js';
import { NernstCellView } from './NernstCellView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class NernstCellBench extends Bench {
  static meta = {
    id: 'nernst-cell', title: 'Electrochemical cell (Nernst)',
    navLabel: 'Nernst cell',
    canvasLabel: 'Cell potential E vs log(Q)',
    level: 'university',
    keywords: ['Nernst equation', 'electrochemistry', 'cell potential', 'EMF', 'Daniell cell', 'reduction potential', 'Gibbs', 'equilibrium constant'],
    related: ['chemistry/gibbs', 'chemistry/goldman'],
  };

  build() {
    this.model = new NernstCellModel({ T: 298.15, Q: 1 });
    this.nernstView = new NernstCellView(this.view);
    this._logQ = 0;

    // T slider
    this.layout.addControl(new Slider({
      id: this.controlId('T'),
      label: 'T (K)',
      min: 273, max: 373, step: 1,
      value: this.model.T,
      format: v => `${v.toFixed(0)} K`,
      onInput: v => { this.model.T = v; },
    }));

    // log₁₀(Q) slider
    this.layout.addControl(new Slider({
      id: this.controlId('logQ'),
      label: 'log₁₀(Q)',
      min: -3, max: 3, step: 0.1,
      value: this._logQ,
      format: v => v.toFixed(1),
      onInput: v => { this._logQ = v; this.model.Q = Math.pow(10, v); },
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'E0',     label: 'E° (V)' },
      { key: 'E',      label: 'E (V)' },
      { key: 'deltaG', label: 'ΔG (kJ/mol)' },
      { key: 'K',      label: 'K' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.nernstView.draw(this.model, this._logQ);
    const E = this.model.E();
    const dG = this.model.deltaG / 1000;
    const K = this.model.K;
    this.readouts.set('E0',     this.model.E_standard.toFixed(4) + ' V');
    this.readouts.set('E',      E.toFixed(4) + ' V');
    this.readouts.set('deltaG', dG.toFixed(2) + ' kJ/mol');
    this.readouts.set('K',      K.toExponential(3));
  }
}
