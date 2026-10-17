/**
 * IsingBench — 2D Ising model with Metropolis dynamics.
 * Visualises spin lattice and magnetisation near the critical temperature.
 */
import { Bench } from '../../../../core/Bench.js';
import { IsingModel } from './IsingModel.js';
import { IsingView } from './IsingView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class IsingBench extends Bench {
  static meta = {
    id: 'ising',
    title: '2D Ising model',
    navLabel: 'Ising model',
    canvasLabel: 'Spin lattice and magnetisation',
    level: 'university',
    keywords: [
      'Ising model', 'phase transition', 'critical temperature', 'magnetisation',
      'Metropolis', 'statistical mechanics', 'Onsager', 'ferromagnet', 'spin',
    ],
    related: ['physics/maxwell-boltzmann'],
  };

  static info = {
    formula: 'H = -J sum_{<ij>} s_i s_j ;  T_c = 2J / [k_B ln(1+sqrt(2))]',
    predict: [
      'Start from an ordered state at T < Tc. What happens to |m| over many sweeps?',
      'At T ~ 0.5 Tc with random start (L=16, 400 sweeps), what fraction of runs freeze in a striped metastable state?',
    ],
    breaks: [
      'Metropolis is slow near Tc (critical slowing down); Wolff cluster algorithm is faster but not implemented.',
      '~4% of random-start runs at T=0.5Tc freeze in a striped metastable state with |m|~0.078.',
      'Finite-size effects: L=32 lattice does not match infinite-lattice Onsager results exactly.',
    ],
    derive: [
      { text: 'At T=0, all spins align: E = -2NJ (each bond counted once), |m| = 1.' },
      { text: 'Onsager (1944) gave the exact critical temperature: Tc = 2J / [kB * ln(1+sqrt(2))] ~ 2.269.' },
      { text: 'Yang (1952) gave the spontaneous magnetisation: m(T) = [1 - sinh^{-4}(2K)]^{1/8} for T < Tc.' },
    ],
    research: {
      questions: [
        'Why does the Metropolis algorithm slow down near Tc?',
        'How does the Wolff cluster algorithm avoid critical slowing down?',
      ],
      challenge: 'Derive the Onsager partition function for the 2D Ising model on a finite square lattice.',
      papers: [
        { authors: 'E. Ising', year: 1925, title: 'Beitrag zur Theorie des Ferromagnetismus', note: '(cited, not fetched)' },
        { authors: 'L. Onsager', year: 1944, title: 'Crystal statistics. I. A two-dimensional model with an order-disorder transition', note: '(cited, not fetched)' },
        { authors: 'C. N. Yang', year: 1952, title: 'The spontaneous magnetization of a two-dimensional Ising model', note: '(cited, not fetched)' },
      ],
    },
    notePlaceholder: 'How does finite lattice size affect the sharpness of the phase transition?',
  };

  build() {
    this.model = new IsingModel({ L: 32, T: 2.5 });
    this.isingView = new IsingView(this.view);

    this.layout.addControl(new Slider({
      id: this.controlId('temp'),
      label: 'Temperature T',
      min: 0.5, max: 5, step: 0.05,
      value: this.model.T,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.T = v; },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('init'),
      label: 'Reset',
      options: [
        { label: 'Ordered', value: 'ordered' },
        { label: 'Random', value: 'random' },
      ],
      value: 'random',
      onChange: (v) => { this.model.reset(v); },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'm', label: '|m|' },
      { key: 'E', label: 'E' },
      { key: 'T', label: 'T / Tc' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {
    this.model.sweep(5);
  }

  draw() {
    this.isingView.draw(this.model);
    this.readouts.set('m', Math.abs(this.model.magnetisation()).toFixed(4));
    this.readouts.set('E', this.model.energy().toFixed(1));
    this.readouts.set('T', (this.model.T / this.model.Tc).toFixed(3));
  }
}
