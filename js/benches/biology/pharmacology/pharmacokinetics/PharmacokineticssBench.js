/**
 * PharmacokineticssBench — 1-compartment PK explorer.
 *
 * NOTE: export name is PharmacokineticssBench (two s) to match the catalog.
 * The extra s is an acknowledged typo that is kept for catalog consistency.
 */
import { Bench } from '../../../../core/Bench.js';
import { PharmacokineticsModel } from './PharmacokineticsModel.js';
import { PharmacokineticsView } from './PharmacokineticsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class PharmacokineticssBench extends Bench {
  static meta = {
    id: 'pharmacokinetics',
    title: 'Pharmacokinetics',
    navLabel: 'Pharmacokinetics',
    canvasLabel: 'Semi-log plot of plasma concentration C(t) vs time',
    level: 'university',
    keywords: [
      'pharmacokinetics', 'PK', 'Bateman', 'half-life', 'AUC', 'oral bioavailability',
      'first-pass', 'elimination', 'absorption', 'one-compartment', 'drug',
    ],
    related: [],
  };

  static info = {
    formula:
      'IV:   C(t) = C₀·e^{-ke·t}   C₀=D/Vd\n' +
      'Oral: C(t) = A·(e^{-ke·t}−e^{-ka·t})\n' +
      '      A = ka·F·D/(Vd·(ka−ke))\n' +
      'R = 1/(1−e^{-ke·τ})',
    predict: [
      'Set t½=24h, τ=12h in multi-dose. Read accumulation ratio R. (R=2+√2)',
      'In oral mode, set ka very close to ke. Does C_max blow up?',
      'Swap ka and ke. Does AUC change? Does C_max change?',
    ],
    breaks: [
      '1-compartment: assumes instantaneous mixing. Real drugs have multi-compartment kinetics.',
      'Non-linear (Michaelis-Menten) elimination at high doses not modelled.',
      'Protein binding, active transport, enterohepatic circulation ignored.',
    ],
    derive: [
      { text: 'IV: dC/dt=-ke·C → C(t)=C₀·e^{-ke·t}; AUC=C₀/ke; t½=ln2/ke.' },
      { text: 'Oral: dA/dt=-ka·A; dC/dt=ka·A(t)/Vd−ke·C. Solve: Bateman function.' },
      { text: "ka=ke limit: L'Hôpital → C=F·D·ke·t·e^{-ke·t}/Vd." },
      { text: 'Accumulation: C_trough=C₀·e^{-ke·τ}/(1−e^{-ke·τ}); R=1/(1−e^{-ke·τ}).' },
    ],
    research: {
      questions: [
        'Why does AUC depend only on F, D, Vd, ke and not on ka?',
        'What is the flip-flop phenomenon and when is it clinically relevant?',
      ],
      challenge: 'Show algebraically that ke·C(t;ka,ke) = ka·C(t;ke,ka) for the Bateman function.',
      papers: [
        {
          authors: 'Rowland & Tozer',
          year: 1995,
          title: 'Clinical Pharmacokinetics, 3rd ed.',
          url: null,
        },
        {
          authors: 'H. Bateman',
          year: 1910,
          title: 'Solution of a system of differential equations (radioactive transformations)',
          url: null,
          note: 'Attribution unverified — cited, not fetched',
        },
      ],
    },
    notePlaceholder: 'Why is a semi-log plot useful for PK data?',
  };

  build() {
    this.model  = new PharmacokineticsModel({ ke: 0.1, ka: 1, D: 100, Vd: 10, F: 1, iv: true });
    this.pkView = new PharmacokineticsView(this.view);

    this.layout.setStageNote('C(t) on semi-log scale — straight line = monoexponential');

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('route'),
      label: 'Route',
      options: [
        { label: 'IV', value: 'iv' },
        { label: 'Oral', value: 'oral' },
      ],
      value: 'iv',
      onChange: (v) => { this.model.iv = (v === 'iv'); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('ke'),
      label: 'ke (1/h)',
      min: 0.01, max: 1, step: 0.01,
      value: this.model.ke,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.ke = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('ka'),
      label: 'ka (1/h)',
      min: 0.01, max: 5, step: 0.01,
      value: this.model.ka,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.ka = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('D'),
      label: 'Dose D (mg)',
      min: 10, max: 500, step: 10,
      value: this.model.D,
      format: v => v.toFixed(0),
      onInput: (v) => { this.model.D = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'C0',    label: 'C₀' },
      { key: 'tHalf', label: 't½' },
      { key: 'AUC',   label: 'AUC' },
      { key: 'tMax',  label: 't_max' },
      { key: 'R',     label: 'R(τ=t½)' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.pkView.draw(this.model);
    const { model } = this;
    this.readouts.set('C0',    `${model.C0.toFixed(2)} mg/L`);
    this.readouts.set('tHalf', `${model.tHalf.toFixed(3)} h`);
    this.readouts.set('AUC',   `${model.AUC.toFixed(2)} mg·h/L`);
    this.readouts.set('tMax',  model.iv ? '0 (IV)' : `${model.tMax.toFixed(3)} h`);
    this.readouts.set('R',     model.accumulationRatio(model.tHalf).toFixed(3));
  }
}
