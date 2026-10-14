import { Bench } from '../../../../core/Bench.js';
import { TimeSeries } from '../../../../core/TimeSeries.js';
import { Slider } from '../../../../ui/Slider.js';
import { ActionButton } from '../../../../ui/ActionButton.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { Legend } from '../../../../ui/Legend.js';
import { PendulumModel } from './PendulumModel.js';
import { PendulumView } from './PendulumView.js';

/**
 * Pendulum bench: the exact pendulum next to the small-angle shortcut
 * every textbook uses. The simplest bench, and a good template to copy.
 */
export class PendulumBench extends Bench {
  static meta = {
    id: 'pendulum',
    title: 'When the textbook formula fails',
    navLabel: 'Pendulum',
    canvasLabel: 'Two pendulums swinging side by side with a trace of their angles',
    level: 'intro',
    keywords: ['pendulum', 'oscillation', 'harmonic oscillator', 'runge-kutta', 'small-angle', 'period', 'AGM'],
    related: ['math/fourier', 'neuroscience/neuron'],
  };

  static info = {
    formula:
      'θ″ = −(g/L)·sin θ − γ·θ′    exact\n' +
      'θ″ = −(g/L)·θ     − γ·θ′    shortcut\n\n' +
      'T₀ = 2π·√(L/g)              shortcut period\n' +
      'T  = T₀ / AGM(1, cos(θ₀/2)) exact period',
    predict: [
      'Release both from 10°. Will you be able to tell them apart after a minute?',
      'At 150°, which one takes longer to come back: the exact pendulum or the shortcut?',
      'Does a heavier bob change anything? Check the formula before you answer.',
    ],
    breaks: [
      'The shortcut sin θ ≈ θ is only good below about 20°. The famous T₀ = 2π√(L/g) quietly assumes it.',
      'Real pendulums have a rod with mass, air drag that grows with speed squared and pivot friction. This model has one simple damping term.',
    ],
    derive: [
      { text: 'Gravity pulls the bob down with force m·g. Only the part along the arc moves it.', formula: 'F = −m·g·sin θ' },
      { text: 'The bob travels along an arc of length s = L·θ, so its acceleration along the arc is L·θ″.', formula: 'm·L·θ″ = −m·g·sin θ' },
      { text: 'The mass cancels. That is why the weight of the bob does not matter.', formula: 'θ″ = −(g/L)·sin θ' },
      { text: 'For small angles sin θ ≈ θ (in radians). The equation becomes a simple harmonic oscillator with a fixed period.', formula: 'θ″ = −(g/L)·θ   →   T₀ = 2π·√(L/g)' },
      { text: 'Without the shortcut, energy conservation leads to an elliptic integral. Gauss’s arithmetic–geometric mean evaluates it exactly in a few steps.', formula: 'T = T₀ / AGM(1, cos(θ₀/2))' },
      { text: 'There is no simple formula for θ(t) itself, so the computer steps forward in tiny time slices with Runge–Kutta (RK4), which samples the slope four times per step.' },
    ],
    research: {
      questions: [
        'Why does the period grow without limit as the release angle approaches 180°?',
        'Hang a second pendulum from the first. Why does the double pendulum become chaotic while this one never does?',
      ],
      challenge: 'Add a driving force F·cos(ωt) with a slider for ω. Find resonance, then push the drive hard enough to see chaos.',
      papers: [
        { authors: 'Christiaan Huygens', year: 1673, title: 'Horologium Oscillatorium' },
        { authors: 'C. G. Carvalhaes & P. Suppes', year: 2008, title: 'Approximations for the period of the simple pendulum based on the arithmetic-geometric mean' },
      ],
    },
    notePlaceholder: 'The shortcut falls behind at large angles because…',
  };

  build() {
    this.model = new PendulumModel({ angleDeg: 60 });
    this.trace = new TimeSeries(10);
    this.pendulumView = new PendulumView(this.view);

    this.layout.addAction(new ActionButton({ label: 'Restart', onClick: () => this.restart() }));
    this.layout.addAction(this.createPauseButton());
    this.layout.setLegend(new Legend([
      { label: 'exact (sin θ)', token: '--accent' },
      { label: 'shortcut (θ)', token: '--signal' },
    ]));

    this.readouts = new ReadoutPanel([
      { key: 't0', label: 'Shortcut period' },
      { key: 'texact', label: 'Exact period' },
      { key: 'mexact', label: 'Measured exact' },
      { key: 'gap', label: 'Angle gap now' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('angle'), label: 'Release angle', min: 5, max: 179, value: 60,
      format: (v) => `${v}°`,
      onInput: (v) => { this.model.startAngleDeg = v; this.restart(); },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('length'), label: 'Rod length', min: 0.2, max: 2, step: 0.05, value: 1,
      format: (v) => `${v.toFixed(2)} m`,
      onInput: (v) => { this.model.length = v; this.restart(); },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('damping'), label: 'Friction γ', min: 0, max: 0.5, step: 0.01, value: 0,
      format: (v) => `${v.toFixed(2)} /s`,
      onInput: (v) => { this.model.damping = v; },
    }));
    this.layout.addHint('Changing the angle or length restarts both pendulums together.');
  }

  restart() {
    this.model.reset(this.model.startAngleDeg);
    this.trace.clear();
  }

  update(dt) {
    this.model.step(dt);
    const toDeg = 180 / Math.PI;
    this.trace.push(this.model.time, [this.model.exact.theta * toDeg, this.model.shortcut.theta * toDeg]);
  }

  draw() {
    this.pendulumView.draw(this.model, this.trace);

    const measured = this.model.measuredPeriod('exact');
    const gap = Math.abs(this.model.exact.theta - this.model.shortcut.theta) * (180 / Math.PI);
    this.readouts.set('t0', `${this.model.smallAnglePeriod.toFixed(3)} s`);
    this.readouts.set('texact', `${this.model.exactPeriod.toFixed(3)} s`);
    this.readouts.set('mexact', measured ? `${measured.toFixed(3)} s` : 'wait…');
    this.readouts.set('gap', `${gap.toFixed(1)}°`);
  }
}
