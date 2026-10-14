/**
 * MendelBench — Mendelian crosses, Punnett squares, chi-square test.
 */
import { Bench } from '../../../../core/Bench.js';
import { MendelModel } from './MendelModel.js';
import { MendelView } from './MendelView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ActionButton } from '../../../../ui/ActionButton.js';

export class MendelBench extends Bench {
  static meta = {
    id: 'mendel',
    title: "Mendel's laws",
    navLabel: 'Mendelian genetics',
    canvasLabel: 'Punnett square and phenotype ratios',
    level: 'intro',
    keywords: [
      'Mendel', 'genetics', 'Punnett square', 'dominant', 'recessive',
      'monohybrid', 'dihybrid', 'chi-square', 'linkage', 'recombination',
      'inheritance', 'allele', 'genotype', 'phenotype',
    ],
    related: ['biology/drift', 'biology/central-dogma'],
  };

  static info = {
    formula: 'Monohybrid Aa×Aa → 1:2:1 genotype, 3:1 phenotype (complete dominance)',
    predict: [
      'What phenotype ratio do you expect from Aa × Aa with complete dominance?',
      'How does the ratio change with incomplete dominance?',
      'What happens to the 9:3:3:1 ratio when genes are linked (r < 0.5)?',
    ],
    breaks: [
      'Only monoprotic (single-gene) and dihybrid crosses. Polygenic traits are not modelled.',
      'Chi-square assumes large sample sizes; it is unreliable with expected counts below 5.',
      'Linkage ignores interference (double crossovers treated as independent).',
    ],
    derive: [
      { text: 'Each parent contributes one allele at random, so offspring genotype follows the product of gamete frequencies.' },
      { text: 'The chi-square statistic measures deviation from expected ratios.', formula: 'χ² = Σ (O−E)² / E' },
      { text: 'For df degrees of freedom, the p-value is P(χ² > χ²_obs) = Q(df/2, χ²/2) using the upper incomplete gamma function.' },
    ],
    research: {
      questions: [
        'Why did Mendel choose peas? What traits made them ideal?',
        'What would Mendel have found if he had studied two linked genes?',
      ],
      challenge: 'Simulate 1000 litters and plot the distribution of chi-square statistics. Does it look like χ²(df)?',
      papers: [
        { authors: 'G. Mendel', year: 1866, title: 'Versuche über Pflanzenhybriden' },
        { authors: 'R. A. Fisher', year: 1936, title: 'Has Mendel\'s Work Been Rediscovered?' },
      ],
    },
    notePlaceholder: 'Record the chi-square and p-value for each cross…',
  };

  build() {
    this.model = new MendelModel();
    this.mendelView = new MendelView(this.view);
    this._observed = [];
    this._chiResult = null;

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('crosstype'),
      label: 'Cross type',
      options: [
        { label: 'Mono', value: 'mono' },
        { label: 'Di', value: 'di' },
      ],
      value: 'mono',
      onChange: (v) => { this.model.crossType = v; this._observed = []; },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('dominance'),
      label: 'Dominance',
      options: [
        { label: 'Complete', value: 'complete' },
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Codominance', value: 'codominance' },
      ],
      value: 'complete',
      onChange: (v) => { this.model.dominance = v; this._observed = []; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('recomb'),
      label: 'Recombination freq.',
      min: 0,
      max: 0.5,
      step: 0.05,
      value: 0.5,
      format: (v) => v === 0.5 ? 'independent' : v.toFixed(2),
      onInput: (v) => { this.model.recombFreq = v; this._observed = []; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('litter'),
      label: 'Litter size',
      min: 10,
      max: 500,
      step: 10,
      value: 100,
      format: (v) => `${v}`,
      onInput: (v) => { this.model.litterSize = v; },
    }));

    this.layout.addAction(new ActionButton({
      label: 'Cross',
      onClick: () => {
        const offspring = this.model.simulateLitter();
        const pq = this.model.punnettSquare();
        // Count observed by phenotype
        const cats = pq.phenotypeRatios.map(r => r.label);
        const counts = cats.map(() => 0);
        offspring.forEach(o => {
          const idx = cats.indexOf(o.phenotype);
          if (idx >= 0) counts[idx]++;
        });
        this._observed = counts;
        const expected = pq.phenotypeRatios.map(r => r.p);
        this._chiResult = this.model.chiSquare(counts, expected);
      },
    }));
  }

  update(_dt) { /* no time stepping needed */ }

  draw() {
    this.mendelView.draw(this.model, this._observed);
    if (this._chiResult) {
      this.layout.setReadout('chi2', this._chiResult.stat.toFixed(3));
      this.layout.setReadout('pvalue', this._chiResult.pValue.toFixed(4));
      this.layout.setReadout('df', String(this._chiResult.df));
    }
  }
}
