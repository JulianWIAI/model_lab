/**
 * WeberFechnerBench — Weber, Fechner, and Stevens psychophysical laws.
 * IMPORTANT: Modality values are ILLUSTRATIVE AND UNVERIFIED.
 */
import { Bench } from '../../../../core/Bench.js';
import { WeberFechnerModel, MODALITIES } from './WeberFechnerModel.js';
import { WeberFechnerView } from './WeberFechnerView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class WeberFechnerBench extends Bench {
  static meta = {
    id: 'weber-fechner',
    title: 'Weber–Fechner & Stevens',
    navLabel: 'Weber–Fechner',
    canvasLabel: 'Weber JND, Fechner log law, Stevens power law',
    level: 'intro',
    keywords: [
      'Weber', 'Fechner', 'Stevens', 'psychophysics', 'JND', 'just-noticeable difference',
      'power law', 'logarithmic', 'sensation', 'perception', 'threshold',
    ],
    related: ['psychology/signal-detection'],
  };

  static info = {
    formula:
      'Weber:   JND(I) = k_W · I\n' +
      'Fechner: S(I) = (1/k_W) · ln(I/I₀)    [integrate Weber]\n' +
      'Stevens: S(I) = k_S · I^n              [empirical power law]\n' +
      'JND steps exact:   m = ln(I/I₀) / ln(1+k_W)\n' +
      'JND steps Fechner: m ≈ ln(I/I₀) / k_W  [Fechner UNDERcounts; ratio k_W/ln(1+k_W) ≥ 1]\n' +
      'Limit: (I^n − 1)/n → ln(I) as n → 0   [L\'Hôpital]\n\n' +
      'WARNING: Modality k_W and n values are ILLUSTRATIVE AND UNVERIFIED.',
    predict: [
      'Brightness increases 8×. How many Fechner steps does that add? (Answer: ln(8)/k_W)',
      'For which modality does doubling the stimulus most increase the sensation?',
      'Where does Weber\'s law break down for auditory stimuli?',
    ],
    breaks: [
      'Weber\'s law fails near absolute threshold (I→0) and at saturation.',
      'Fechner\'s derivation assumes all JNDs are perceptually equal — not empirically established.',
      'Stevens exponents are fitted empirically and vary by observer, stimulus range, and method.',
      'Reference variable matters: loudness n≈0.67 for SPL, n≈0.3 for intensity.',
      'MODALITY VALUES ARE UNVERIFIED ILLUSTRATIVE ESTIMATES — verify against Stevens (1957) or Gescheider (1997) before teaching.',
    ],
    derive: [
      { text: 'Weber: at threshold, ΔI/I = k_W (empirical law).', formula: 'JND(I) = k_W · I' },
      { text: 'Fechner: let each JND be one unit of sensation. dS = dI/(k_W·I).', formula: 'S = (1/k_W)·ln(I/I₀)' },
      { text: 'Stevens: observes power law empirically. (I^n−1)/n → ln(I) as n→0 by L\'Hôpital.', formula: 'S = k_S·I^n' },
    ],
    research: {
      questions: [
        'Why might equal JND steps NOT produce equal perceived differences?',
        'How would you test whether the power-law exponent n depends on the observer or the stimulus?',
      ],
      challenge: 'Derive the Fechner–Stevens limit: show (I^n − 1)/n → ln(I) as n→0 using L\'Hôpital\'s rule.',
      papers: [
        { authors: 'E. H. Weber', year: 1834, title: 'De Tactu' },
        { authors: 'G. T. Fechner', year: 1860, title: 'Elemente der Psychophysik' },
        {
          authors: 'S. S. Stevens',
          year: 1957,
          title: 'On the psychophysical law',
          url: 'https://doi.org/10.1037/h0046162',
        },
      ],
    },
    notePlaceholder: 'Weber: equal ratios → equal JNDs. Fechner: integrates that into log sensation…',
  };

  build() {
    const def = MODALITIES[0];  // brightness as default
    this.model = new WeberFechnerModel({
      kW: def.kW, n: def.n, kS: def.kS, I0: 1, IMin: 1, IMax: 100,
    });
    this.wfView = new WeberFechnerView(this.view);

    this.layout.setStageNote(
      'WARNING: Modality k_W and n values are ILLUSTRATIVE AND UNVERIFIED. ' +
      'Verify against Stevens (1957) or Gescheider (1997) before teaching.',
    );

    // ── Modality preset ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('modality'),
      label: 'Modality (UNVERIFIED)',
      options: MODALITIES.map(md => ({ label: md.name.split(' ')[0], value: md.id })),
      value: def.id,
      onChange: (v) => {
        const md = MODALITIES.find(m => m.id === v);
        this.model.kW = md.kW;
        this.model.n  = md.n;
        this.model.kS = md.kS;
      },
    }));

    // ── Weber fraction k_W ──
    this.layout.addControl(new Slider({
      id: this.controlId('kW'),
      label: 'Weber fraction k_W',
      min: 0.01, max: 0.30, step: 0.005,
      value: this.model.kW,
      format: v => v.toFixed(3),
      onInput: v => { this.model.kW = v; },
    }));

    // ── Stevens exponent n ──
    this.layout.addControl(new Slider({
      id: this.controlId('n'),
      label: 'Stevens exponent n',
      min: 0.1, max: 4, step: 0.05,
      value: this.model.n,
      format: v => v.toFixed(2),
      onInput: v => { this.model.n = v; },
    }));

    // ── Intensity range ──
    this.layout.addControl(new Slider({
      id: this.controlId('IMax'),
      label: 'I max',
      min: 10, max: 1000, step: 10,
      value: this.model.IMax,
      format: v => v.toFixed(0),
      onInput: v => { this.model.IMax = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'kW',       label: 'k_W' },
      { key: 'n',        label: 'n (Stevens)' },
      { key: 'mExact',   label: 'Steps exact (I=10·I₀)' },
      { key: 'mFechner', label: 'Steps Fechner (I=10·I₀)' },
      { key: 'ratio',    label: 'Ratio (exact/Fechner)' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.wfView.draw(this.model);

    const I10 = this.model.I0 * 10;
    this.readouts.set('kW',       this.model.kW.toFixed(4));
    this.readouts.set('n',        this.model.n.toFixed(3));
    this.readouts.set('mExact',   this.model.stepsExact(I10).toFixed(3));
    this.readouts.set('mFechner', this.model.stepsFechner(I10).toFixed(3));
    this.readouts.set('ratio',    this.model.stepRatio(I10).toFixed(4));
  }
}
