/**
 * SupplyDemandBench — linear supply and demand with shifts.
 * No tax wedge (see tax-incidence bench for that).
 */
import { Bench } from '../../../../core/Bench.js';
import { SupplyDemandModel } from './SupplyDemandModel.js';
import { SupplyDemandView } from './SupplyDemandView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { Legend } from '../../../../ui/Legend.js';

export class SupplyDemandBench extends Bench {
  static meta = {
    id: 'supply-demand',
    title: 'Supply and demand',
    navLabel: 'Supply & demand',
    canvasLabel: 'Supply and demand equilibrium with shifts',
    level: 'intro',
    keywords: [
      'supply', 'demand', 'equilibrium', 'consumer surplus', 'producer surplus',
      'elasticity', 'incidence', 'shift', 'Marshall', 'price',
    ],
    related: ['economics/tax'],
  };

  static info = {
    formula:
      'Q_D = a − b·P      Q_S = c + d·P\n' +
      'P* = (a−c)/(b+d)   Q* = (a·d+b·c)/(b+d)\n' +
      'CS = ½·Q*²/b       PS = ½·Q*²/d  (c=0)\n' +
      'ε_D = −b·P*/Q*     ε_S = d·P*/Q*\n' +
      'Cost shock κ: ΔP* = κ/(b+d)',
    predict: [
      'If raw-material costs rise (supply shifts left), does P* go up or down?',
      'At Q*=10, P*=5, b=1: what is the price elasticity of demand?',
      'Who bears more of a cost shock — buyers or sellers — when demand is very inelastic?',
    ],
    breaks: [
      'Linear supply and demand only — constant-elasticity (CES) and kinked curves not modelled.',
      'Partial equilibrium: no income effects, no cross-market feedback.',
      'Perfect competition — no market power, no externalities.',
      'No dynamics: treats equilibrium as instantaneous.',
      'Tax wedge and deadweight loss are shown in the separate "Tax incidence" bench.',
    ],
    derive: [
      { text: 'Set Q_D = Q_S to find the market-clearing price.',
        formula: 'a − b·P = c + d·P  →  P* = (a−c)/(b+d)' },
      { text: 'CS is the area of the triangle between the demand curve and P*.',
        formula: 'CS = ½·(P_choke − P*)·Q* = ½·Q*²/b' },
      { text: 'A cost shock shifts supply: c_new = c − κ. New equilibrium:',
        formula: 'ΔP* = κ/(b+d)  (buyers bear b/(b+d), sellers d/(b+d))' },
    ],
    research: {
      questions: [
        'Germany debated a sugar tax. Using this model, who would actually pay it?',
        'When does shifting the supply curve left increase total revenue for producers?',
      ],
      challenge: 'Derive the price elasticity of demand at P* from the linear demand curve and show how it changes as b→0 (perfectly inelastic demand).',
      papers: [
        {
          authors: 'A. Marshall',
          year: 1890,
          title: 'Principles of Economics',
        },
        {
          authors: 'A. Cournot',
          year: 1838,
          title: 'Researches into the Mathematical Principles of the Theory of Wealth',
        },
      ],
    },
    notePlaceholder: 'The steeper, less flexible side bears more of any cost shock…',
  };

  build() {
    this.model    = new SupplyDemandModel({ a: 80, b: 1, c: 0, d: 1 });
    this.sdView   = new SupplyDemandView(this.view);

    this.layout.setLegend(new Legend([
      { label: 'demand', token: '--accent' },
      { label: 'supply', token: '--signal' },
    ]));

    // ── Demand intercept a ──
    this.layout.addControl(new Slider({
      id: this.controlId('a'),
      label: 'Demand intercept a (max willingness to pay × b)',
      min: 20, max: 150, step: 5,
      value: this.model.a,
      format: v => v.toFixed(0),
      onInput: v => { this.model.a = v; },
    }));

    // ── Demand slope b ──
    this.layout.addControl(new Slider({
      id: this.controlId('b'),
      label: 'Demand slope b (buyers\' reaction)',
      min: 0.2, max: 3, step: 0.1,
      value: this.model.b,
      format: v => v.toFixed(1),
      onInput: v => { this.model.b = v; },
    }));

    // ── Supply shift c (cost shock) ──
    this.layout.addControl(new Slider({
      id: this.controlId('c'),
      label: 'Supply shift c (cost base)',
      min: -20, max: 40, step: 1,
      value: this.model.c,
      format: v => v.toFixed(0),
      onInput: v => { this.model.c = v; },
    }));

    // ── Supply slope d ──
    this.layout.addControl(new Slider({
      id: this.controlId('d'),
      label: 'Supply slope d (sellers\' reaction)',
      min: 0.2, max: 3, step: 0.1,
      value: this.model.d,
      format: v => v.toFixed(1),
      onInput: v => { this.model.d = v; },
    }));

    this.layout.addHint(
      'Higher b or d = steeper line = people react less to price (inelastic). ' +
      'Insulin is steep; one brand of cola is flat.',
    );

    this.readouts = new ReadoutPanel([
      { key: 'Pstar', label: 'P*' },
      { key: 'Qstar', label: 'Q*' },
      { key: 'CS',    label: 'Consumer surplus' },
      { key: 'PS',    label: 'Producer surplus' },
      { key: 'eD',    label: 'ε_D at equilibrium' },
      { key: 'eS',    label: 'ε_S at equilibrium' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    const r = this.model.solve();
    this.sdView.draw(this.model, r);

    if (r.noTrade) {
      this.readouts.set('Pstar', 'no trade');
      this.readouts.set('Qstar', '—');
      this.readouts.set('CS', '—');
      this.readouts.set('PS', '—');
      this.readouts.set('eD', '—');
      this.readouts.set('eS', '—');
    } else {
      this.readouts.set('Pstar', r.Pstar.toFixed(2));
      this.readouts.set('Qstar', r.Qstar.toFixed(2));
      this.readouts.set('CS',    r.CS.toFixed(1));
      this.readouts.set('PS',    r.PS.toFixed(1));
      this.readouts.set('eD',    r.eD.toFixed(3));
      this.readouts.set('eS',    r.eS.toFixed(3));
    }
  }
}
