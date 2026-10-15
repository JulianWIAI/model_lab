/**
 * SelectionBench — breeder's equation with truncation selection controls.
 */
import { Bench } from '../../../../core/Bench.js';
import { SelectionModel } from './SelectionModel.js';
import { SelectionView } from './SelectionView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class SelectionBench extends Bench {
  static meta = {
    id: 'selection', title: 'Truncation selection', navLabel: 'Truncation selection',
    canvasLabel: 'Selection intensity vs top fraction selected',
    level: 'university',
    keywords: ['breeder\'s equation', 'truncation selection', 'heritability', 'selection differential', 'response', 'quantitative genetics'],
    related: ['biology/hardy-weinberg', 'biology/drift'],
  };

  build() {
    this.model = new SelectionModel({ p: 0.2, h2: 0.5, sigma: 1.0 });
    this.selView = new SelectionView(this.view);

    // p slider
    this.layout.addControl(new Slider({
      id: this.controlId('p'),
      label: 'top fraction p',
      min: 0.01, max: 0.99, step: 0.01,
      value: this.model.p,
      format: v => v.toFixed(2),
      onInput: v => { this.model.p = v; },
    }));

    // h² slider
    this.layout.addControl(new Slider({
      id: this.controlId('h2'),
      label: 'heritability h²',
      min: 0, max: 1, step: 0.01,
      value: this.model.h2,
      format: v => v.toFixed(2),
      onInput: v => { this.model.h2 = v; },
    }));

    // σ slider
    this.layout.addControl(new Slider({
      id: this.controlId('sigma'),
      label: 'trait SD σ',
      min: 0.1, max: 5, step: 0.1,
      value: this.model.sigma,
      format: v => v.toFixed(1),
      onInput: v => { this.model.sigma = v; },
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'i',    label: 'intensity i' },
      { key: 'S',    label: 'differential S' },
      { key: 'R',    label: 'response R' },
      { key: 't',    label: 'truncation t' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.selView.draw(this.model);
    const i = this.model.selectionIntensity();
    const S = this.model.selectionDifferential();
    const R = this.model.response();
    // Compute truncation point t = invNorm(1-p) approximately
    // Just compute from the model internals
    const p = this.model.p;
    const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
    const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
    const q = 1 - p < 0.5 ? (1 - p) : p;
    const tt = Math.sqrt(-2 * Math.log(q));
    const num = c0 + c1 * tt + c2 * tt * tt;
    const den = 1 + d1 * tt + d2 * tt * tt + d3 * tt * tt * tt;
    const truncT = (1 - p < 0.5 ? -1 : 1) * (tt - num / den);

    this.readouts.set('i', i.toFixed(4));
    this.readouts.set('S', S.toFixed(4));
    this.readouts.set('R', R.toFixed(4));
    this.readouts.set('t', truncT.toFixed(4));
  }
}
