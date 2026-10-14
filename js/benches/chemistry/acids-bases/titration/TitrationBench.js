/**
 * TitrationBench — acid-base titration curves.
 */
import { Bench } from '../../../../core/Bench.js';
import { TitrationModel } from './TitrationModel.js';
import { TitrationView } from './TitrationView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';

export class TitrationBench extends Bench {
  static meta = {
    id: 'titration',
    title: 'Acid-base titration',
    navLabel: 'Titration curves',
    canvasLabel: 'pH vs volume of titrant added',
    level: 'intro',
    keywords: [
      'titration', 'acid', 'base', 'pH', 'equivalence point', 'buffer',
      'pKa', 'Henderson-Hasselbalch', 'strong acid', 'weak acid', 'indicator',
      'charge balance', 'acetic acid', 'ammonium',
    ],
    related: ['chemistry/orbitals', 'biology/enzyme-kinetics'],
  };

  static info = {
    formula: 'pH at half-equivalence: pH = pKa   (weak acid)   |   charge balance: [H⁺]+[Na⁺]=[A⁻]+[OH⁻]',
    predict: [
      'For a strong acid titration, what is the pH at the equivalence point?',
      'Why is the pH at half-equivalence equal to pKa for a weak acid?',
      'Which indicator would you use for an acetic acid titration?',
    ],
    breaks: [
      'Only monoprotic acids (single pKa). Polyprotic acids (H₂CO₃ 2nd step, H₃PO₄) are not modelled.',
      'Temperature fixed at 25°C. Kw changes significantly with temperature.',
      'Activity corrections (ionic strength) are neglected; deviations appear above ~0.5 mol/L.',
    ],
    derive: [
      { text: 'Charge balance requires: [H⁺] + [cation] = [A⁻] + [OH⁻] at any point in the titration.' },
      { text: 'For weak acid: [A⁻] = Ca·Ka/(h+Ka) where h=[H⁺]. Solving for h gives exact pH.', formula: 'h + Cb = Ca·Ka/(h+Ka) + Kw/h' },
      { text: 'At half-equivalence, [HA] = [A⁻], so Ka = [H⁺] and pH = pKa (Henderson–Hasselbalch limit).' },
    ],
    research: {
      questions: [
        'Why does carbonic acid have two pKa values? What does each correspond to?',
        'How does a buffer resist pH changes? What is its capacity?',
      ],
      challenge: 'Extend the model to diprotic acids (two Ka values) and compare to the H₂CO₃ data.',
      papers: [
        { authors: 'L. J. Henderson', year: 1908, title: 'Concerning the relationship between the strength of acids and their capacity to preserve neutral reactions' },
        { authors: 'K. A. Hasselbalch', year: 1917, title: 'Die Berechnung der Wasserstoffzahl des Blutes' },
      ],
    },
    notePlaceholder: 'Compare the equivalence point pH for strong vs. weak acid…',
  };

  build() {
    this.model = new TitrationModel();
    this.titrationView = new TitrationView(this.view);

    const presetNames = Object.keys(TitrationModel.PRESETS);
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Acid',
      options: presetNames.map((k) => ({ label: k.split(' ')[0], value: k })),
      value: presetNames[0],
      onChange: (v) => {
        const preset = TitrationModel.PRESETS[v];
        this.model.acidType = preset.acidType;
        this.model.pKa = preset.pKa;
        this.model.preset = v;
      },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('ca'),
      label: '[Acid]',
      min: 0.01, max: 0.5, step: 0.01, value: 0.1,
      format: (v) => `${v.toFixed(2)} M`,
      onInput: (v) => { this.model.ca = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('cb'),
      label: '[Base]',
      min: 0.01, max: 0.5, step: 0.01, value: 0.1,
      format: (v) => `${v.toFixed(2)} M`,
      onInput: (v) => { this.model.cb = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('va'),
      label: 'Va (acid vol.)',
      min: 5, max: 50, step: 1, value: 25,
      format: (v) => `${v} mL`,
      onInput: (v) => { this.model.va = v; },
    }));
  }

  update(_dt) {}

  draw() {
    this.titrationView.draw(this.model, 0);
    this.layout.setReadout('veq', `${this.model.equivalenceVolume.toFixed(2)} mL`);
    this.layout.setReadout('eq-ph', this.model.solve(this.model.equivalenceVolume).toFixed(2));
    if (this.model.acidType === 'weak' && this.model.pKa !== null) {
      this.layout.setReadout('pka', this.model.pKa.toFixed(3));
    }
    const ind = this.model.indicator(this.model.solve(this.model.equivalenceVolume));
    this.layout.setReadout('indicator', ind.name);
  }
}
