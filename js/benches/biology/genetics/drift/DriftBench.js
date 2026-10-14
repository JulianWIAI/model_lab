import { Bench } from '../../../../core/Bench.js';
import { Slider } from '../../../../ui/Slider.js';
import { ActionButton } from '../../../../ui/ActionButton.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { Legend } from '../../../../ui/Legend.js';
import { WrightFisherModel } from './WrightFisherModel.js';
import { DriftView } from './DriftView.js';

/**
 * Genetic drift bench: natural selection against pure chance,
 * in many populations at once.
 */
export class DriftBench extends Bench {
  static meta = {
    id: 'drift',
    title: 'Selection versus chance',
    navLabel: 'Genetic drift',
    canvasLabel: 'Allele frequency over generations in many populations',
    level: 'university',
    keywords: ['genetic drift', 'wright-fisher', 'selection', 'allele', 'fixation', 'kimura', 'population genetics', 'evolution'],
    related: ['chemistry/equilibrium'],
  };

  static info = {
    formula:
      'selection:  p′ = p·(1+s) / (1 + s·p)\n' +
      'drift:      count ~ Binomial(2N, p′)\n\n' +
      'Kimura:     P(fix) = (1−e^(−4Nsp₀)) / (1−e^(−4Ns))\n' +
      'neutral:    P(fix) = p₀   when s = 0',
    predict: [
      'With s = 0 and p₀ = 0.5, how many of 20 populations end up fixed for allele A?',
      'Give A a 1% advantage (s = 0.01). In a population of 20, does it reliably win? And with 2000?',
      'Set p₀ = 0.05 and s = 0. What fraction of new variants ever take over?',
    ],
    breaks: [
      'Real populations have mutation, migration, mate choice, overlapping generations and changing sizes. Each one changes the numbers.',
      'Fitness here is one fixed number. In nature it depends on the environment, on other genes and on what everyone else is doing.',
    ],
    derive: [
      { text: 'Hardy–Weinberg: with random mating and no forces acting, allele frequencies stay constant and genotypes settle at fixed ratios.', formula: 'AA : Aa : aa = p² : 2pq : q²' },
      { text: 'Selection: copies of A leave (1+s) times as many offspring. Divide by the average fitness to get the new frequency.', formula: 'p′ = p(1+s) / (1+sp)' },
      { text: 'Drift: only 2N gene copies make it into the next generation, drawn at random, like marbles from a bag.', formula: 'count ~ Binomial(2N, p′)' },
      { text: 'The random change per generation has a variance that shrinks with population size. Small populations wander fast; large ones barely move.', formula: 'Var(Δp) = p(1−p) / 2N' },
      { text: 'Selection wins when its push is larger than drift’s noise. The rule of thumb compares the two.', formula: '|4Ns| ≫ 1   selection dominates\n|4Ns| ≪ 1   drift dominates' },
      { text: 'Kimura solved the diffusion equation for the chance that an allele eventually takes over the whole population.', formula: 'P(fix) = (1 − e^(−4Nsp₀)) / (1 − e^(−4Ns))' },
    ],
    research: {
      questions: [
        'Kimura argued that most DNA changes in evolution are neutral and spread by drift. What would that mean for how we read genomes?',
        'Could a cultural rule, such as a marriage law or a religious practice, act like a selection coefficient s on a gene? What would you need to measure to test it?',
      ],
      challenge: 'Add a mutation rate μ that turns a into A and back. Find the balance where mutation keeps both alleles alive despite drift.',
      papers: [
        { authors: 'R. A. Fisher', year: 1930, title: 'The Genetical Theory of Natural Selection' },
        { authors: 'S. Wright', year: 1931, title: 'Evolution in Mendelian populations' },
        { authors: 'M. Kimura', year: 1962, title: 'On the probability of fixation of mutant genes in a population' },
        { authors: 'M. Kimura', year: 1968, title: 'Evolutionary rate at the molecular level' },
        { authors: 'P. J. Richerson & R. Boyd', year: 2005, title: 'Not by Genes Alone: How Culture Transformed Human Evolution' },
      ],
    },
    notePlaceholder: 'In small populations chance beats selection because…',
  };

  build() {
    this.settings = { size: 100, selection: 0, startFrequency: 0.5, replicates: 20 };
    this.model = new WrightFisherModel(this.settings);
    this.generationsPerSecond = 30;
    this.carry = 0; // fractional generations waiting to run
    this.driftView = new DriftView(this.view);

    this.layout.addAction(new ActionButton({ label: 'Run again', onClick: () => this.rebuild() }));
    this.layout.addAction(this.createPauseButton());
    this.layout.setLegend(new Legend([
      { label: 'still mixed', token: '--accent' },
      { label: 'A took over', token: '--good' },
      { label: 'A lost', token: '--signal' },
      { label: 'selection alone', token: '--ink' },
    ]));

    this.readouts = new ReadoutPanel([
      { key: 'gen', label: 'Generation' },
      { key: 'fixed', label: 'A took over' },
      { key: 'lost', label: 'A lost' },
      { key: 'mixed', label: 'Still mixed' },
      { key: 'kimura', label: 'Kimura predicts' },
      { key: 'ns', label: '4Ns' },
    ]);
    this.layout.setReadouts(this.readouts);

    // Changing a parameter restarts the run, so every line uses the same settings.
    const restartWith = (key) => (v) => { this.settings[key] = v; this.rebuild(); };
    this.layout.addControl(new Slider({
      id: this.controlId('size'), label: 'Population size N', min: 10, max: 2000, step: 10, value: 100,
      onInput: restartWith('size'),
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('selection'), label: 'Advantage of A (s)', min: -0.05, max: 0.05, step: 0.001, value: 0,
      format: (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`,
      onInput: restartWith('selection'),
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('start'), label: 'Starting frequency p₀', min: 0.05, max: 0.95, step: 0.05, value: 0.5,
      format: (v) => v.toFixed(2),
      onInput: restartWith('startFrequency'),
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('reps'), label: 'Number of populations', min: 1, max: 40, value: 20,
      onInput: restartWith('replicates'),
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('speed'), label: 'Generations per second', min: 5, max: 120, step: 5, value: 30,
      onInput: (v) => { this.generationsPerSecond = v; },
    }));
  }

  rebuild() {
    this.model = new WrightFisherModel(this.settings);
    this.carry = 0;
  }

  update(dt) {
    this.carry += dt * this.generationsPerSecond;
    while (this.carry >= 1 && !this.model.done) {
      this.model.step();
      this.carry -= 1;
    }
  }

  draw() {
    const m = this.model;
    this.driftView.draw(m);

    const { fixed, lost, mixed } = m.outcomes;
    const expected = m.fixationProbability * m.replicates;
    this.readouts.set('gen', `${m.generation} / ${m.maxGenerations}`);
    this.readouts.set('fixed', String(fixed));
    this.readouts.set('lost', String(lost));
    this.readouts.set('mixed', String(mixed));
    this.readouts.set('kimura', `${expected.toFixed(1)} take over`);
    this.readouts.set('ns', (4 * m.size * m.selection).toFixed(1));
  }
}
