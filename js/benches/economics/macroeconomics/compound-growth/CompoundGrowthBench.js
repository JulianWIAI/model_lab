/**
 * CompoundGrowthBench — compound interest / growth with discrete and continuous compounding.
 * EDUCATIONAL USE ONLY — NOT FINANCIAL ADVICE.
 */
import { Bench } from '../../../../core/Bench.js';
import { CompoundGrowthModel, FREQUENCIES } from './CompoundGrowthModel.js';
import { CompoundGrowthView } from './CompoundGrowthView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class CompoundGrowthBench extends Bench {
  static meta = {
    id: 'compound-growth',
    title: 'Compound growth',
    navLabel: 'Compound growth',
    canvasLabel: 'A(t) growth curves and rule-of-72 error',
    level: 'intro',
    keywords: [
      'compound interest', 'growth', 'exponential', 'doubling time', 'rule of 72',
      'effective annual rate', 'present value', 'compounding', 'continuous compounding',
    ],
    related: ['biology/logistic', 'biology/pcr'],
  };

  static info = {
    formula:
      'Discrete:   A(t) = P·(1 + r/m)^(m·t)\n' +
      'Continuous: A(t) = P·e^(r·t)\n' +
      'EAR = (1 + r/m)^m − 1\n' +
      't₂ = ln(2)/(m·ln(1+r/m))    [exact doubling time]\n' +
      't₂ ≈ 0.72/r                  [rule of 72, ≈ at r≈8%]\n' +
      'PV  = FV·e^(−r·T)            [continuous discounting]\n\n' +
      'EDUCATIONAL USE ONLY — NOT FINANCIAL ADVICE.',
    predict: [
      'At 7% annual rate, will money double in 10 years? (Hint: rule of 72.)',
      'Does compounding monthly instead of annually make a large difference at 5% over 20 years?',
      'At which interest rate does the rule of 72 give the most accurate estimate?',
    ],
    breaks: [
      'Assumes constant rate r throughout; real returns vary year to year.',
      'No inflation, taxes, or management fees — all of which reduce real returns.',
      'Rule of 72 is a convenient approximation; continuous compounding gives exactly 69.3 (ln2×100).',
      'This bench shows accumulation only; discounted cash-flow series (NPV) is planned for a future bench.',
      'EDUCATIONAL USE ONLY — NOT FINANCIAL ADVICE.',
    ],
    derive: [
      { text: 'After one period: A = P(1+r/m). After m·t periods:',
        formula: 'A(t) = P·(1 + r/m)^(m·t)' },
      { text: 'Continuous limit: let x = m/r → (1+r/m)^m = (1+1/x)^(rx) → e^(rx)',
        formula: 'A(t) = P·e^(r·t)' },
      { text: 'Doubling: 2 = e^(r·t₂) → t₂ = ln2/r. Rule of 72: ln2 ≈ 0.693 ≈ 72/100 near r≈8%.',
        formula: 't₂ = ln 2 / r' },
    ],
    research: {
      questions: [
        'Why does the rule of 72 use 72 rather than 69.3 (the exact continuous value)?',
        'If inflation is 3% and your account grows at 5%, what is your real return?',
      ],
      challenge: 'Derive the present-value formula PV=FV·e^(−rT) from the continuous-compounding equation, then apply it to compare two projects with different cash flows.',
      papers: [
        {
          authors: 'J. Bernoulli',
          year: 1690,
          title: 'Quaestiones nonnullae de usuris (on the constant e from compound interest)',
        },
      ],
    },
    notePlaceholder: 'Continuous compounding gives e^(r·t) — where does e come from?',
  };

  build() {
    this.model    = new CompoundGrowthModel({ P: 1000, r: 0.07, m: 1, tMax: 30 });
    this.growView = new CompoundGrowthView(this.view);

    this.layout.setStageNote(
      'EDUCATIONAL USE ONLY — NOT FINANCIAL ADVICE. ' +
      'Rule of 72: t₂_exact × r% ≈ 71 at 5%, 72.7 at 10%, 76 at 20%.',
    );

    // ── Compounding frequency ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('freq'),
      label: 'Compounding',
      options: FREQUENCIES.map(f => ({ label: f.label, value: f.id })),
      value: 'annual',
      onChange: (v) => {
        const freq = FREQUENCIES.find(f => f.id === v);
        this.model.m = freq.m;
      },
    }));

    // ── Principal ──
    this.layout.addControl(new Slider({
      id: this.controlId('P'),
      label: 'Principal P',
      min: 100, max: 10000, step: 100,
      value: this.model.P,
      format: v => `${v.toFixed(0)}`,
      onInput: (v) => { this.model.P = v; },
    }));

    // ── Rate ──
    this.layout.addControl(new Slider({
      id: this.controlId('r'),
      label: 'Annual rate r',
      min: 0.01, max: 0.25, step: 0.01,
      value: this.model.r,
      format: v => `${(v * 100).toFixed(0)}%`,
      onInput: (v) => { this.model.r = v; },
    }));

    // ── Time horizon ──
    this.layout.addControl(new Slider({
      id: this.controlId('tMax'),
      label: 't max (years)',
      min: 5, max: 60, step: 5,
      value: this.model.tMax,
      format: v => `${v.toFixed(0)} y`,
      onInput: (v) => { this.model.tMax = v; },
    }));

    // ── Readouts ──
    this.readouts = new ReadoutPanel([
      { key: 'EAR',    label: 'EAR' },
      { key: 't2',     label: 't₂ (exact)' },
      { key: 't2_72',  label: 't₂ (rule 72)' },
      { key: 'AT',     label: `A(t max)` },
      { key: 'PV',     label: 'PV of A(t max)' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.growView.draw(this.model);
    const { EAR, doublingTime, rule72, tMax, P, r } = this.model;
    const AT = this.model.A(tMax);
    const pv = this.model.PV(AT, tMax);

    this.readouts.set('EAR',   `${(EAR * 100).toFixed(3)}%`);
    this.readouts.set('t2',    `${doublingTime.toFixed(2)} y`);
    this.readouts.set('t2_72', `${rule72.toFixed(2)} y`);
    this.readouts.set('AT',    `${_fmtNum(AT)}`);
    this.readouts.set('PV',    `${_fmtNum(pv)}`);
  }
}

function _fmtNum(v) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(3)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}k`;
  return v.toFixed(2);
}
