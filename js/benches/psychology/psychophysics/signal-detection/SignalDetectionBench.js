/**
 * SignalDetectionBench — normal equal-variance signal detection theory.
 */
import { Bench } from '../../../../core/Bench.js';
import { SignalDetectionModel } from './SignalDetectionModel.js';
import { SignalDetectionView } from './SignalDetectionView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class SignalDetectionBench extends Bench {
  static meta = {
    id: 'signal-detection',
    title: 'Signal detection theory',
    navLabel: 'Signal detection',
    canvasLabel: 'ROC curve and overlapping distributions',
    level: 'intro',
    keywords: [
      'signal detection', 'SDT', 'd-prime', 'hit rate', 'false alarm', 'ROC',
      'criterion', 'sensitivity', 'AUC', 'psychophysics', 'Tanner', 'Swets',
    ],
    related: ['psychology/weber-fechner'],
  };

  static info = {
    formula:
      'H  = Φ(d′/2 − c)        FA = Φ(−d′/2 − c)\n' +
      'd′ = Φ⁻¹(H) − Φ⁻¹(FA)\n' +
      'β  = exp(d′·c)          [likelihood ratio; β=1 unbiased]\n' +
      'AUC = Φ(d′/√2)          [parametric, equal-variance Gaussian]\n' +
      'A′ = ½ + (H−FA)(1+H−FA)/(4H(1−FA))  [Grier 1971 approx, H≥FA]\n' +
      'c measured from midpoint d′/2; c=0 → unbiased',
    predict: [
      'If d′=2 and your criterion is unbiased (c=0), what are H and FA?',
      'What happens to the ROC curve as d′→0?',
      'A radiologist wants to miss no cancers. Should they use a liberal or conservative criterion?',
    ],
    breaks: [
      'Equal-variance Gaussian only; real signal distributions often have higher variance than noise.',
      'No response time or temporal uncertainty.',
      'A′ is an approximation for H<FA — use parametric AUC=Φ(d′/√2) as the primary measure.',
      'No account of prior probabilities or payoff matrices in the criterion setting.',
    ],
    derive: [
      { text: 'Signal: X ~ N(d′, 1). Noise: X ~ N(0, 1). Observer says "signal" when X > c_abs.',
        formula: 'H = P(X > c_abs | signal) = Φ(d′ − c_abs)' },
      { text: 'False alarm: observer says "signal" when no signal.',
        formula: 'FA = P(X > c_abs | noise) = Φ(−c_abs) = 1 − Φ(c_abs)' },
      { text: 'Measuring c from the midpoint d′/2: c_abs = d′/2 + c.',
        formula: 'H = Φ(d′/2 − c)   FA = Φ(−d′/2 − c)' },
      { text: 'AUC = area under ROC = probability correct in 2AFC.',
        formula: 'AUC = Φ(d′/√2)' },
    ],
    research: {
      questions: [
        'How would you design an experiment to measure d′ for a radiology task?',
        'Why is AUC preferred to percent correct as a sensitivity measure?',
      ],
      challenge: 'Derive AUC=Φ(d′/√2) from the integral definition: AUC = P(X_s > X_n) where X_s~N(d′,1) and X_n~N(0,1).',
      papers: [
        {
          authors: 'W. P. Tanner & J. A. Swets',
          year: 1954,
          title: 'A decision-making theory of visual detection',
          url: 'https://doi.org/10.1037/h0058700',
        },
        {
          authors: 'D. M. Green & J. A. Swets',
          year: 1966,
          title: 'Signal Detection Theory and Psychophysics',
        },
        {
          authors: 'J. B. Grier',
          year: 1971,
          title: 'Nonparametric indexes for sensitivity and bias: Computing formulas',
          url: 'https://doi.org/10.1037/h0031246',
        },
      ],
    },
    notePlaceholder: 'Sensitivity (d′) is independent of criterion. ROC shows all possible trade-offs…',
  };

  build() {
    this.model   = new SignalDetectionModel({ d: 1, c: 0 });
    this.sdtView = new SignalDetectionView(this.view);

    this.layout.setStageNote(
      'c = criterion from midpoint (c=0 = unbiased). ' +
      'AUC = Φ(d′/√2) — area under ROC, parametric.',
    );

    // ── d′ slider ──
    this.layout.addControl(new Slider({
      id: this.controlId('d'),
      label: 'd′ (sensitivity)',
      min: 0, max: 4, step: 0.1,
      value: this.model.d,
      format: v => v.toFixed(1),
      onInput: v => { this.model.d = v; },
    }));

    // ── c slider ──
    this.layout.addControl(new Slider({
      id: this.controlId('c'),
      label: 'c (criterion, 0 = unbiased)',
      min: -2.5, max: 2.5, step: 0.05,
      value: this.model.c,
      format: v => v.toFixed(2),
      onInput: v => { this.model.c = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'H',      label: 'H (hit rate)' },
      { key: 'FA',     label: 'FA (false alarm)' },
      { key: 'dprime', label: 'd′' },
      { key: 'beta',   label: 'β (likelihood ratio)' },
      { key: 'AUC',    label: 'AUC = Φ(d′/√2)' },
      { key: 'Aprime', label: "A′ (Grier 1971)" },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.sdtView.draw(this.model);

    this.readouts.set('H',      this.model.H().toFixed(4));
    this.readouts.set('FA',     this.model.FA().toFixed(4));
    this.readouts.set('dprime', this.model.d.toFixed(2));
    this.readouts.set('beta',   this.model.beta().toFixed(4));
    this.readouts.set('AUC',    this.model.AUC().toFixed(4));
    this.readouts.set('Aprime', this.model.Aprime().toFixed(4));
  }
}
