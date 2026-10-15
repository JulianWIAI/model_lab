/**
 * SIRBench — SIR epidemic model controls.
 */
import { Bench } from '../../../../core/Bench.js';
import { SIRModel } from './SIRModel.js';
import { SIRView } from './SIRView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ActionButton } from '../../../../ui/ActionButton.js';

export class SIRBench extends Bench {
  static meta = {
    id: 'sir', title: 'SIR epidemic model', navLabel: 'SIR epidemic',
    canvasLabel: 'Susceptible, infected and recovered fractions over time',
    level: 'university',
    keywords: ['SIR', 'epidemic', 'R0', 'herd immunity', 'Kermack-McKendrick', 'infectious disease', 'final size'],
    related: ['biology/logistic', 'biology/predator-prey'],
  };

  build() {
    this.model = new SIRModel({ beta: 0.3, gamma: 0.1, I0: 0.001 });
    this.sirView = new SIRView(this.view);
    this._running = false;

    // β slider
    this.layout.addControl(new Slider({
      id: this.controlId('beta'),
      label: 'β (transmission)',
      min: 0.05, max: 1.0, step: 0.05,
      value: this.model.beta,
      format: v => v.toFixed(2),
      onInput: v => { this.model.beta = v; this.model.reset(); },
    }));

    // γ slider
    this.layout.addControl(new Slider({
      id: this.controlId('gamma'),
      label: 'γ (recovery)',
      min: 0.01, max: 0.5, step: 0.01,
      value: this.model.gamma,
      format: v => v.toFixed(2),
      onInput: v => { this.model.gamma = v; this.model.reset(); },
    }));

    // Run button
    this.layout.addControl(new ActionButton({
      id: this.controlId('run'),
      label: 'Run',
      onClick: () => {
        // Step until I < 1e-6
        for (let i = 0; i < 50000 && this.model.I > 1e-6; i++) {
          this.model.step(0.1);
        }
      },
    }));

    // Reset button
    this.layout.addControl(new ActionButton({
      id: this.controlId('reset'),
      label: 'Reset',
      onClick: () => this.model.reset(),
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'R0',    label: 'R₀' },
      { key: 'Rt',    label: 'Rt' },
      { key: 'herd',  label: 'h* (herd)' },
      { key: 'peakI', label: 'peak I' },
      { key: 'finalR', label: 'final R∞' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {
    // Step continuously while I > threshold
    if (this.model.I > 1e-8) {
      for (let i = 0; i < 3; i++) this.model.step(0.1);
    }
  }

  draw() {
    this.sirView.draw(this.model);
    const fs = this.model.finalSize;
    this.readouts.set('R0',     this.model.R0.toFixed(2));
    this.readouts.set('Rt',     this.model.Rt.toFixed(3));
    this.readouts.set('herd',   (this.model.herdThreshold * 100).toFixed(1) + '%');
    this.readouts.set('peakI',  (this.model.peakI * 100).toFixed(2) + '%');
    this.readouts.set('finalR', (fs * 100).toFixed(1) + '%');
  }
}
