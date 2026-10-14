/**
 * HardyWeinbergBench — deterministic allele-frequency dynamics.
 */
import { Bench } from '../../../../core/Bench.js';
import { HardyWeinbergModel } from './HardyWeinbergModel.js';
import { HardyWeinbergView } from './HardyWeinbergView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class HardyWeinbergBench extends Bench {
  static meta = {
    id: 'hardy-weinberg',
    title: 'Hardy–Weinberg equilibrium',
    navLabel: 'Hardy–Weinberg',
    canvasLabel: 'de Finetti triangle and allele frequency over generations',
    level: 'intro',
    keywords: [
      'Hardy-Weinberg', 'allele frequency', 'genotype frequency', 'selection',
      'mutation', 'migration', 'equilibrium', 'fitness', 'de Finetti', 'population genetics',
      'dominant', 'recessive', 'heterozygote', 'mutation-selection balance',
    ],
    related: ['biology/mendel', 'biology/drift'],
  };

  static info = {
    formula:
      'w̄ = p²·wAA + 2pq·wAa + q²·waa\n' +
      "p' = (p²·wAA + pq·wAa) / w̄   [selection]\n" +
      "p'' = p'·(1−μ) + (1−p')·ν    [mutation]\n" +
      "p''' = p''·(1−m) + p_m·m     [migration]\n" +
      'q̂_rec ≈ √(μ/s)   q̂_dom ≈ μ/(h·s)',
    predict: [
      'With wAA=wAa=waa=1 and no mutation: does p change? Why or why not?',
      'If allele a is recessive lethal (waa=0), does it ever reach zero frequency? Why not?',
      'How does increasing migration towards a population with p_m=0.8 shift equilibrium?',
    ],
    breaks: [
      'Deterministic model only: drift (finite population sampling error) is not included.',
      'Assumes non-overlapping generations, random mating, and no linkage disequilibrium.',
      'The logistic substitution μ/(h·s) is accurate only for small μ and rare a (q ≪ 1).',
    ],
    derive: [
      { text: 'After random mating, genotype frequencies equal HW proportions: AA=p², Aa=2pq, aa=q².' },
      { text: 'Selection changes p in proportion to how much each genotype contributes to the next generation.', formula: "p' = (p²·wAA + pq·wAa) / w̄" },
      { text: 'Mutation and migration shift p independently of selection each generation.' },
      { text: 'At equilibrium (Δp=0) with recessive lethal and mutation μ:', formula: 'q̂ ≈ √(μ/s)  (s=1−waa)' },
      { text: 'For a dominant deleterious allele (heterozygote affected, h=0.5):', formula: 'q̂ ≈ μ/(h·s)  (much lower than recessive case)' },
    ],
    research: {
      questions: [
        'Why are recessive deleterious alleles maintained at higher frequencies than dominant ones?',
        'Under what conditions does heterozygote advantage (overdominance) lead to a stable polymorphism?',
      ],
      challenge: 'Set wAa > wAA = waa (overdominance) and find the equilibrium p analytically. Verify with the simulation.',
      papers: [
        { authors: 'G. H. Hardy', year: 1908, title: 'Mendelian Proportions in a Mixed Population', url: 'https://doi.org/10.1126/science.28.706.49' },
        { authors: 'W. Weinberg', year: 1908, title: 'Über den Nachweis der Vererbung beim Menschen' },
        { authors: 'D. S. Falconer & T. F. C. Mackay', year: 1996, title: 'Introduction to Quantitative Genetics, 4th ed.' },
      ],
    },
    notePlaceholder: 'Describe where the trajectory ends on the de Finetti triangle and why…',
  };

  build() {
    this.model = new HardyWeinbergModel({ p: 0.5 });
    this.hwView = new HardyWeinbergView(this.view);
    this._running = false;
    this._stepsPerFrame = 1;

    // Pause/Play
    this.layout.addAction(this.createPauseButton());
    this.paused = true; // start paused; user presses play

    this.layout.addControl(new Slider({
      id: this.controlId('p0'),
      label: 'Initial p (freq A)',
      min: 0.01,
      max: 0.99,
      step: 0.01,
      value: 0.5,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.p0 = v; this.model.reset(); this.model.p = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('wAA'),
      label: 'w_AA',
      min: 0,
      max: 2,
      step: 0.01,
      value: 1,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.wAA = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('wAa'),
      label: 'w_Aa',
      min: 0,
      max: 2,
      step: 0.01,
      value: 1,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.wAa = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('waa'),
      label: 'w_aa',
      min: 0,
      max: 2,
      step: 0.01,
      value: 1,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.waa = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('mu'),
      label: 'Mutation μ (A→a)',
      min: 0,
      max: 0.01,
      step: 0.0001,
      value: 0,
      format: (v) => v.toFixed(4),
      onInput: (v) => { this.model.mu = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('nu'),
      label: 'Mutation ν (a→A)',
      min: 0,
      max: 0.01,
      step: 0.0001,
      value: 0,
      format: (v) => v.toFixed(4),
      onInput: (v) => { this.model.nu = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('m'),
      label: 'Migration rate m',
      min: 0,
      max: 0.5,
      step: 0.01,
      value: 0,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.migrationRate = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('mp'),
      label: 'Migrant freq p_m',
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.5,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.migrantFreq = v; },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('speed'),
      label: 'Speed',
      options: [
        { label: '1×', value: 1 },
        { label: '10×', value: 10 },
        { label: '100×', value: 100 },
      ],
      value: 1,
      onChange: (v) => { this._stepsPerFrame = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'p',    label: 'p (A)' },
      { key: 'q',    label: 'q (a)' },
      { key: 'AA',   label: 'AA' },
      { key: 'Aa',   label: 'Aa' },
      { key: 'aa',   label: 'aa' },
      { key: 'gen',  label: 'Generation' },
      { key: 'eq',   label: 'Equilibrium p' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {
    for (let i = 0; i < this._stepsPerFrame; i++) {
      if (this.model.generation < this.model.history.length - 1) {
        this.model.step();
      }
    }
  }

  draw() {
    this.hwView.draw(this.model);

    const p = this.model.p;
    const q = 1 - p;
    const { AA, Aa, aa } = this.model.genotypeFrequencies();
    const eq = this.model.equilibrium();

    this.readouts.set('p',   p.toFixed(4));
    this.readouts.set('q',   q.toFixed(4));
    this.readouts.set('AA',  AA.toFixed(4));
    this.readouts.set('Aa',  Aa.toFixed(4));
    this.readouts.set('aa',  aa.toFixed(4));
    this.readouts.set('gen', String(this.model.generation));
    this.readouts.set('eq',  eq.toFixed(4));
  }
}
