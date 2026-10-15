/**
 * PredatorPreyBench — Lotka-Volterra predator-prey controls.
 */
import { Bench } from '../../../../core/Bench.js';
import { PredatorPreyModel } from './PredatorPreyModel.js';
import { PredatorPreyView } from './PredatorPreyView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ActionButton } from '../../../../ui/ActionButton.js';

export class PredatorPreyBench extends Bench {
  static meta = {
    id: 'predator-prey', title: 'Predator–prey (Lotka–Volterra)',
    navLabel: 'Predator–prey',
    canvasLabel: 'Prey and predator populations over time',
    level: 'university',
    keywords: ['Lotka-Volterra', 'predator', 'prey', 'oscillation', 'population dynamics', 'ecology', 'cycle'],
    related: ['biology/logistic', 'biology/sir'],
  };

  build() {
    this.model = new PredatorPreyModel();
    this.ppView = new PredatorPreyView(this.view);

    // α slider (prey growth)
    this.layout.addControl(new Slider({
      id: this.controlId('alpha'),
      label: 'α (prey growth)',
      min: 0.1, max: 2, step: 0.05,
      value: this.model.alpha,
      format: v => v.toFixed(2),
      onInput: v => { this.model.alpha = v; this.model.reset(); },
    }));

    // β slider (predation)
    this.layout.addControl(new Slider({
      id: this.controlId('beta'),
      label: 'β (predation)',
      min: 0.01, max: 0.2, step: 0.01,
      value: this.model.beta,
      format: v => v.toFixed(2),
      onInput: v => { this.model.beta = v; this.model.reset(); },
    }));

    // δ slider (conversion)
    this.layout.addControl(new Slider({
      id: this.controlId('delta'),
      label: 'δ (conversion)',
      min: 0.01, max: 0.1, step: 0.005,
      value: this.model.delta,
      format: v => v.toFixed(3),
      onInput: v => { this.model.delta = v; this.model.reset(); },
    }));

    // γ slider (predator death)
    this.layout.addControl(new Slider({
      id: this.controlId('gamma'),
      label: 'γ (predator death)',
      min: 0.1, max: 2, step: 0.05,
      value: this.model.gamma,
      format: v => v.toFixed(2),
      onInput: v => { this.model.gamma = v; this.model.reset(); },
    }));

    // Reset button
    this.layout.addControl(new ActionButton({
      id: this.controlId('reset'),
      label: 'Reset',
      onClick: () => this.model.reset(),
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'prey',      label: 'Prey x' },
      { key: 'pred',      label: 'Predator y' },
      { key: 'conserved', label: 'V' },
      { key: 'drift',     label: 'V − V₀' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {
    // Step multiple times per frame for animation
    for (let i = 0; i < 5; i++) this.model.step(0.05);
  }

  draw() {
    this.ppView.draw(this.model);
    const V = this.model.conserved;
    const V0 = this.model.V0;
    this.readouts.set('prey',      this.model.x.toFixed(2));
    this.readouts.set('pred',      this.model.y.toFixed(2));
    this.readouts.set('conserved', isFinite(V) ? V.toFixed(4) : 'NaN');
    this.readouts.set('drift',     isFinite(V) ? (V - V0).toFixed(6) : 'NaN');
  }
}
