/**
 * PrisonerDilemma_Bench — repeated prisoner's dilemma.
 */
import { Bench } from '../../../../core/Bench.js';
import { PrisonerDilemmaModel } from './PrisonerDilemmaModel.js';
import { PrisonerDilemmaView } from './PrisonerDilemmaView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class PrisonerDilemma_Bench extends Bench {
  static meta = {
    id: 'prisoner-dilemma',
    title: "Prisoner's Dilemma",
    navLabel: "Prisoner's dilemma",
    canvasLabel: 'PV of cooperation vs defection by discount factor δ',
    level: 'university',
    keywords: [
      "prisoner's dilemma", 'cooperation', 'defection', 'grim trigger', 'TFT',
      'tit-for-tat', 'discount factor', 'present value', 'game theory',
    ],
    related: ['economics/nash-equilibria'],
  };

  static info = {
    predict: [
      'At the default settings, does cooperation or defection have a higher present value at δ=0.6?',
      'What is the minimum δ required for rational cooperation under grim trigger?',
      'If T increases from 5 to 6, does δ* increase or decrease?',
    ],
    breaks: [
      'Grim trigger requires infinite or uncertain-horizon repetition. With a fixed known endpoint, backward induction unravels cooperation.',
      'δ is the continuation probability (probability the game continues), not a time-discount factor per se.',
      '2R > T+S is required for the PD condition. If violated, cooperation is not a social optimum.',
      'Payoff sliders that violate T>R>P>S or 2R>T+S generate a "not a PD" warning.',
    ],
    derive: [
      { text: 'Grim trigger cooperates iff PV_coop ≥ PV_defect:', formula: 'R/(1-δ) ≥ T + δP/(1-δ)  →  δ ≥ (T-R)/(T-P)' },
      { text: 'Critical discount factor:', formula: 'δ* = (T-R)/(T-P)' },
      { text: 'dδ*/dT > 0 (higher temptation payoff raises threshold, independence of S):', formula: 'dδ*/dT = (R-P)/(T-P)² > 0' },
      { text: 'TFT threshold (stricter):', formula: 'δ_TFT = max((T-R)/(T-P), (T-R)/(R-S))' },
    ],
    research: {
      questions: [
        'Axelrod (unverified) ran tournaments showing TFT wins. Why might TFT outperform grim trigger in a noisy environment?',
        'Friedman (unverified) showed grim trigger is subgame perfect. What does "subgame perfect" mean?',
      ],
      challenge: 'Simulate a population of strategies (Cooperate, Defect, TFT, Grim) with δ=0.7 and T=5,R=3,P=1,S=0. Which strategy dominates?',
      papers: [
        { authors: 'R. Axelrod', year: 1984, title: 'The Evolution of Cooperation (unverified)' },
        { authors: 'J. Friedman', year: 1971, title: 'A Non-cooperative Equilibrium for Supergames (unverified)' },
      ],
    },
    notePlaceholder: 'Why does grim trigger require δ ≥ δ* for cooperation…',
  };

  build() {
    this.model = new PrisonerDilemmaModel({ T: 5, R: 3, P: 1, S: 0, delta: 0.6 });
    this.pdView = new PrisonerDilemmaView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'isPD',     label: 'Is PD?' },
      { key: 'dstar',    label: 'δ* = (T-R)/(T-P)' },
      { key: 'pvCoop',   label: 'PV cooperate' },
      { key: 'pvDef',    label: 'PV defect' },
      { key: 'tft',      label: 'TFT threshold' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('delta'),
      label: 'δ (discount factor)',
      min: 0, max: 0.99, step: 0.01, value: 0.6,
      format: v => v.toFixed(2),
      onInput: v => { this.model = new PrisonerDilemmaModel({ T: this.model.T, R: this.model.R, P: this.model.P, S: this.model.S, delta: v }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('T'),
      label: 'T (temptation)',
      min: 1, max: 10, step: 0.5, value: 5,
      format: v => v.toFixed(1),
      onInput: v => { this.model = new PrisonerDilemmaModel({ T: v, R: this.model.R, P: this.model.P, S: this.model.S, delta: this.model.delta }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('R'),
      label: 'R (reward)',
      min: 0, max: 9, step: 0.5, value: 3,
      format: v => v.toFixed(1),
      onInput: v => { this.model = new PrisonerDilemmaModel({ T: this.model.T, R: v, P: this.model.P, S: this.model.S, delta: this.model.delta }); },
    }));
  }

  update(_dt) {}

  draw() {
    this.pdView.draw(this.model);
    const m = this.model;
    const pdOk = m.isPD();
    this.readouts.set('isPD',   pdOk ? 'Yes ✓' : 'No — not a PD!');
    this.readouts.set('dstar',  m.deltastar().toFixed(4));
    this.readouts.set('pvCoop', m.pvCooperate().toFixed(3));
    this.readouts.set('pvDef',  m.pvDefect().toFixed(3));
    if (pdOk && m.R > m.S) {
      this.readouts.set('tft', m.tftThreshold().toFixed(4));
    } else {
      this.readouts.set('tft', '–');
    }
  }
}
