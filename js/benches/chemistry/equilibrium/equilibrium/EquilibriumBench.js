import { Bench } from '../../../../core/Bench.js';
import { TimeSeries } from '../../../../core/TimeSeries.js';
import { Slider } from '../../../../ui/Slider.js';
import { ActionButton } from '../../../../ui/ActionButton.js';
import { ToggleButton } from '../../../../ui/ToggleButton.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { Legend } from '../../../../ui/Legend.js';
import { el } from '../../../../ui/el.js';
import { ReactionModel } from './ReactionModel.js';
import { ReactionView } from './ReactionView.js';

/**
 * Equilibrium bench: rates, temperature, catalysts and Le Chatelier's principle
 * for A + B ⇌ C.
 */
export class EquilibriumBench extends Bench {
  static meta = {
    id: 'equilibrium',
    title: 'Reaction rates and equilibrium',
    navLabel: 'Equilibrium',
    canvasLabel: 'Concentrations over time and the energy profile of the reaction',
  };

  static info = {
    formula:
      'A + B ⇌ C\n' +
      'forward = kf·[A]·[B]     back = kr·[C]\n' +
      'k = A·e^(−Ea / RT)                Arrhenius\n' +
      'K = kf / kr = [C] / ([A]·[B])     at equilibrium\n' +
      'Q < K → forward     Q > K → backward',
    predict: [
      'Switch the catalyst on. Does the final amount of C change, or only how fast you get there?',
      'This reaction releases heat (ΔH < 0). Heat it up. Will you end with more C or less?',
      'Once it has settled, press “Add A”. Which way does it shift, and does K change?',
    ],
    breaks: [
      'Real reactions usually go through several steps, and the rate law has to be measured. It cannot be read off the balanced equation.',
      'The model assumes a well-mixed solution at constant temperature with ideal behaviour. At high concentrations chemists replace concentrations with activities.',
    ],
    derive: [
      { text: 'Molecules react when they collide. The number of A–B collisions scales with how many of each there are.', formula: 'rate ∝ [A]·[B]' },
      { text: 'Only collisions with enough energy to cross the barrier count. The fraction of molecules that energetic follows the Boltzmann factor.', formula: 'k = A·e^(−Ea/RT)' },
      { text: 'The reverse reaction climbs from the product side, so its barrier is higher by the energy released.', formula: 'Ea(back) = Ea(forward) − ΔH' },
      { text: 'Equilibrium does not mean the reaction stopped. Both directions run at the same rate.', formula: 'kf·[A]·[B] = kr·[C]   →   K = kf/kr' },
      { text: 'Divide the two Arrhenius equations. A catalyst lowers both barriers equally, so it cancels out of K. Temperature only cancels when ΔH = 0.', formula: 'K = (Af/Ar)·e^(−ΔH/RT)' },
      { text: 'This lab solves the rate equations with a backward (implicit) Euler step, which stays stable even when the reaction is extremely fast.' },
    ],
    research: {
      questions: [
        'Why can a catalyst never push a reaction past equilibrium? What would that mean for energy conservation?',
        'Living cells keep many reactions far from equilibrium on purpose. How do they pay for it?',
      ],
      challenge: 'Add a second step C ⇌ D and plot all four species. Find settings where C rises then falls: that is how reaction intermediates behave.',
      papers: [
        { authors: 'C. M. Guldberg & P. Waage', year: 1864, title: 'Studies concerning affinity' },
        { authors: 'H. Le Chatelier', year: 1884, title: 'Sur un énoncé général des lois des équilibres chimiques' },
        { authors: 'S. Arrhenius', year: 1889, title: 'Über die Reaktionsgeschwindigkeit bei der Inversion von Rohrzucker durch Säuren' },
        { authors: 'H. Eyring', year: 1935, title: 'The activated complex in chemical reactions' },
      ],
    },
    notePlaceholder: 'A catalyst changes … but not … because…',
  };

  build() {
    this.model = new ReactionModel();
    this.trace = new TimeSeries(20);
    this.speed = 1;
    this.reactionView = new ReactionView(this.view);

    this.layout.addAction(new ActionButton({ label: 'Restart', onClick: () => this.restart() }));
    this.layout.addAction(this.createPauseButton());
    this.layout.setLegend(new Legend([
      { label: '[A]', token: '--accent' },
      { label: '[B]', token: '--signal' },
      { label: '[C] product', token: '--third' },
    ]));

    this.readouts = new ReadoutPanel([
      { key: 'A', label: '[A]' },
      { key: 'C', label: '[C]' },
      { key: 'K', label: 'K (target)' },
      { key: 'Q', label: 'Q (now)' },
      { key: 'dir', label: 'Direction' },
      { key: 'kf', label: 'kf' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('temp'), label: 'Temperature', min: 250, max: 400, value: 300,
      format: (v) => `${v} K (${v - 273} °C)`,
      onInput: (v) => { this.model.temperature = v; },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('ea'), label: 'Barrier height Ea', min: 45, max: 90, value: 55,
      format: (v) => `${v} kJ/mol`,
      onInput: (v) => { this.model.activationForward = v; },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('dh'), label: 'Reaction energy ΔH', min: -30, max: 30, value: -10,
      format: (v) => `${v > 0 ? '+' : ''}${v} kJ/mol`,
      onInput: (v) => { this.model.reactionEnergy = v; },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('speed'), label: 'Playback speed', min: 0.25, max: 4, step: 0.25, value: 1,
      format: (v) => `${v}×`,
      onInput: (v) => { this.speed = v; },
    }));
    this.layout.addControl(el('div', { class: 'row' }, [
      new ToggleButton({ label: 'Catalyst off', pressedLabel: 'Catalyst on', onToggle: (on) => { this.model.catalyst = on; } }).element,
      new ActionButton({ label: 'Add A (+0.5 M)', onClick: () => this.model.addA(0.5) }).element,
      new ActionButton({ label: 'Remove all C', onClick: () => this.model.removeC() }).element,
    ]));
    this.layout.addHint('ΔH below zero means the reaction releases heat (exothermic).');
  }

  restart() {
    this.model.reset();
    this.trace.clear();
  }

  update(dt) {
    this.model.step(dt * this.speed);
    this.trace.push(this.model.time, [this.model.A, this.model.B, this.model.C]);
  }

  draw() {
    const m = this.model;
    this.reactionView.draw(m, this.trace);

    const ratio = m.Q / m.K;
    let direction = 'at equilibrium';
    if (ratio < 0.98) direction = '→ forward';
    else if (ratio > 1.02) direction = '← backward';

    this.readouts.set('A', `${m.A.toFixed(3)} M`);
    this.readouts.set('C', `${m.C.toFixed(3)} M`);
    this.readouts.set('K', this.#formatNumber(m.K));
    this.readouts.set('Q', Number.isFinite(m.Q) ? this.#formatNumber(m.Q) : '∞');
    this.readouts.set('dir', direction);
    this.readouts.set('kf', `${this.#formatNumber(m.kForward)} /M·s`);
  }

  /** Short readable numbers across many orders of magnitude. */
  #formatNumber(v) {
    if (v === 0) return '0';
    if (v >= 1000 || v < 0.01) return v.toExponential(2);
    return v.toPrecision(3);
  }
}
