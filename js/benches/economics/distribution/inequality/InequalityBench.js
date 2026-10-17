/**
 * InequalityBench — Lorenz curve and Gini coefficient for different distributions.
 */
import { Bench } from '../../../../core/Bench.js';
import { InequalityModel } from './InequalityModel.js';
import { InequalityView } from './InequalityView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class InequalityBench extends Bench {
  static meta = {
    id: 'inequality',
    title: 'Income inequality',
    navLabel: 'Inequality',
    canvasLabel: 'Lorenz curve',
    level: 'intro',
    keywords: [
      'Lorenz curve', 'Gini coefficient', 'inequality', 'Pareto', 'income distribution',
      'top share', 'wealth', 'economics',
    ],
  };

  static info = {
    formula: 'G = 1 - 2 integral_0^1 L(p) dp',
    predict: [
      'A perfectly equal distribution has Gini = 0 and Lorenz(p) = p.',
      'Uniform distribution has Gini = 1/3; Exponential has Gini = 0.5.',
    ],
    breaks: [
      'Only three parametric distributions; real income data is more complex.',
      'No household size adjustment or purchasing power parity.',
    ],
    derive: [
      { text: 'For a Pareto distribution with shape alpha, Gini = 1/(2*alpha - 1).' },
      { text: 'For uniform [0, b], Lorenz(p) = p^2 and Gini = 1/3.' },
      { text: 'For exponential, Lorenz(p) = p + (1-p)*ln(1-p) and Gini = 1/2.' },
    ],
    research: {
      questions: [
        'Why is the Lorenz curve always convex?',
        'How does the Pareto alpha relate to the tail heaviness of the income distribution?',
      ],
      challenge: 'Show that the trapezoid rule for Gini has error bounded by 2*|zeta(-1/2)|*h^1.5.',
      papers: [
        { authors: 'M. O. Lorenz', year: 1905, title: 'Methods of measuring the concentration of wealth', note: '(cited, not fetched)' },
        { authors: 'C. Gini', year: 1912, title: 'Variabilita e mutabilita', note: '(cited, not fetched)' },
      ],
    },
    notePlaceholder: 'How does changing the Pareto alpha affect the top 10% income share?',
  };

  build() {
    this.model = new InequalityModel({ dist: 'pareto', alpha: 2 });
    this.ineqView = new InequalityView(this.view);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('dist'),
      label: 'Distribution',
      options: [
        { label: 'Pareto', value: 'pareto' },
        { label: 'Uniform', value: 'uniform' },
        { label: 'Exponential', value: 'exponential' },
      ],
      value: 'pareto',
      onChange: (v) => {
        this.model = new InequalityModel({ dist: v, alpha: this._alpha });
      },
    }));

    this._alpha = 2;
    this.layout.addControl(new Slider({
      id: this.controlId('alpha'),
      label: 'Pareto alpha',
      min: 1.1, max: 5, step: 0.1,
      value: 2,
      format: (v) => v.toFixed(1),
      onInput: (v) => {
        this._alpha = v;
        if (this.model.dist === 'pareto') {
          this.model = new InequalityModel({ dist: 'pareto', alpha: v });
        }
      },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'gini', label: 'Gini' },
      { key: 'top10', label: 'Top 10% share' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.ineqView.draw(this.model);
    this.readouts.set('gini', this.model.gini().toFixed(4));
    this.readouts.set('top10', (this.model.topShare(0.9) * 100).toFixed(1) + '%');
  }
}
