import { Bench } from '../../../core/Bench.js';
import { Slider } from '../../../ui/Slider.js';
import { ButtonGroup } from '../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../ui/ReadoutPanel.js';
import { Legend } from '../../../ui/Legend.js';
import { FourierSeries } from './FourierSeries.js';
import { FourierView } from './FourierView.js';

/**
 * Fourier bench: build square, sawtooth and triangle waves out of rotating circles.
 */
export class FourierBench extends Bench {
  static meta = {
    id: 'fourier',
    title: 'Building a wave from circles',
    navLabel: 'Fourier series',
    canvasLabel: 'Rotating circles drawing a wave',
  };

  static info = {
    predict: [
      'At 60 circles, will the square wave’s corners become perfectly sharp?',
      'Why does the triangle look right with 3 circles while the square still looks wobbly?',
    ],
    breaks: [
      'Watch the overshoot as you add circles. It settles near 9% of the jump and never disappears. This is the Gibbs phenomenon: a finite sum of smooth waves cannot copy a sudden jump.',
      'The same effect causes ringing next to sharp edges in compressed images and audio.',
    ],
    derive: [
      { text: 'Fourier claimed that any repeating shape is a sum of sine and cosine waves at whole-number multiples of the base frequency.', formula: 'f(t) = Σ [aₙ·cos(nt) + bₙ·sin(nt)]' },
      { text: 'Sines of different frequencies are orthogonal: multiply two and average over a cycle, and you get zero unless they match. That lets you pick out one coefficient at a time.', formula: 'bₙ = (1/π)·∫ f(t)·sin(nt) dt   over one period' },
      { text: 'For the square wave the integral is zero for even n and 4/(πn) for odd n.', formula: 'bₙ = 4/(πn)   for odd n' },
      { text: 'Each sine is a point moving round a circle, seen from the side. Stack the circles tip to tail and the last tip draws the sum.' },
      { text: 'Smooth shapes have coefficients that fall fast (triangle: 1/n²). Shapes with jumps fall slowly (square: 1/n). How fast they fall measures smoothness.' },
    ],
    research: {
      questions: [
        'Your inner ear runs a Fourier analysis: the cochlea separates frequencies along its length. What does that suggest about how the brain represents sound?',
        'Why does the overshoot not shrink as you add terms, even though the total error does?',
      ],
      challenge: 'Let the user draw any closed path with the mouse, compute its discrete Fourier transform and redraw it with epicycles.',
      papers: [
        { authors: 'J. Fourier', year: 1822, title: 'Théorie analytique de la chaleur' },
        { authors: 'J. W. Gibbs', year: 1899, title: 'Fourier’s series' },
        { authors: 'J. W. Cooley & J. W. Tukey', year: 1965, title: 'An algorithm for the machine calculation of complex Fourier series' },
      ],
    },
    notePlaceholder: 'The square wave needs many circles because…',
  };

  build() {
    this.series = new FourierSeries('square', 5);
    this.phase = 0;
    this.speed = 1;
    this.paused = this.reduceMotion;
    this.fourierView = new FourierView(this.view);

    this.layout.addAction(this.createPauseButton());
    this.layout.setLegend(new Legend([
      { label: 'sum of circles', token: '--accent' },
      { label: 'target wave', token: '--signal' },
    ]));

    this.readouts = new ReadoutPanel([
      { key: 'terms', label: 'Circles' },
      { key: 'peak', label: 'Peak height' },
      { key: 'over', label: 'Overshoot' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('terms'), label: 'Number of circles (terms)', min: 1, max: 60, value: 5,
      onInput: (v) => { this.series.terms = v; this.refresh(); },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('speed'), label: 'Rotation speed', min: 0.2, max: 3, step: 0.1, value: 1,
      format: (v) => `${v.toFixed(1)}×`,
      onInput: (v) => { this.speed = v; },
    }));
    this.layout.addControl(new ButtonGroup({
      label: 'Target wave',
      value: 'square',
      options: [
        { value: 'square', label: 'Square' },
        { value: 'saw', label: 'Sawtooth' },
        { value: 'tri', label: 'Triangle' },
      ],
      onChange: (wave) => { this.series.wave = wave; this.refresh(); },
    }));

    this.refresh();
  }

  /** Recomputes the readouts and formula after the series changes. */
  refresh() {
    this.readouts.set('terms', String(this.series.terms));
    this.readouts.set('peak', this.series.peak().toFixed(3));
    this.readouts.set('over', `${this.series.overshootPercent().toFixed(1)}% of jump`);
    this.layout.setFormula(this.series.formula);
    this.fourierView.reset();
  }

  update(dt) {
    this.phase += dt * 1.2 * this.speed;
  }

  draw() {
    this.fourierView.draw(this.series, this.phase);
  }
}
