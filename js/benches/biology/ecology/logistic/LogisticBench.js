/**
 * LogisticBench — logistic population growth controls and layout.
 */
import { Bench } from '../../../../core/Bench.js';
import { LogisticModel } from './LogisticModel.js';
import { LogisticView } from './LogisticView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class LogisticBench extends Bench {
  static meta = {
    id: 'logistic', title: 'Logistic growth', navLabel: 'Logistic growth',
    canvasLabel: 'N vs t and phase portrait dN/dt vs N',
    level: 'intro',
    keywords: ['logistic', 'population growth', 'carrying capacity', 'Verhulst', 'dN/dt', 'sigmoid'],
    related: ['biology/predator-prey', 'biology/sir'],
  };

  build() {
    this.model = new LogisticModel({ N0: 10, r: 0.3, K: 1000 });
    this.logView = new LogisticView(this.view);
    this._tMax = 50;

    // N₀ slider
    this.layout.addControl(new Slider({
      id: this.controlId('n0'),
      label: 'N₀',
      min: 1, max: 100, step: 1,
      value: this.model.N0,
      format: v => v.toFixed(0),
      onInput: v => { this.model.N0 = v; },
    }));

    // r slider
    this.layout.addControl(new Slider({
      id: this.controlId('r'),
      label: 'r',
      min: 0.05, max: 2, step: 0.05,
      value: this.model.r,
      format: v => v.toFixed(2),
      onInput: v => { this.model.r = v; },
    }));

    // K slider
    this.layout.addControl(new Slider({
      id: this.controlId('K'),
      label: 'K',
      min: 100, max: 2000, step: 50,
      value: this.model.K,
      format: v => v.toFixed(0),
      onInput: v => { this.model.K = v; },
    }));

    // tMax slider
    this.layout.addControl(new Slider({
      id: this.controlId('tmax'),
      label: 't max',
      min: 10, max: 200, step: 5,
      value: this._tMax,
      format: v => `${v}`,
      onInput: v => { this._tMax = v; },
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'N0',      label: 'N₀' },
      { key: 'r',       label: 'r' },
      { key: 'K',       label: 'K' },
      { key: 'tHalf',   label: 't (K/2)' },
      { key: 'maxRate', label: 'max dN/dt' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.logView.draw(this.model, this._tMax);
    const tHalf = this.model.tHalf;
    this.readouts.set('N0',      this.model.N0.toFixed(0));
    this.readouts.set('r',       this.model.r.toFixed(2));
    this.readouts.set('K',       this.model.K.toFixed(0));
    this.readouts.set('tHalf',   tHalf !== null ? tHalf.toFixed(2) : 'N₀ ≥ K/2');
    this.readouts.set('maxRate', (this.model.r * this.model.K / 4).toFixed(2));
  }
}
