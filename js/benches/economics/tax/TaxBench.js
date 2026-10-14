import { Bench } from '../../../core/Bench.js';
import { Slider } from '../../../ui/Slider.js';
import { ReadoutPanel } from '../../../ui/ReadoutPanel.js';
import { Legend } from '../../../ui/Legend.js';
import { TaxMarketModel } from './TaxMarketModel.js';
import { TaxMarketView } from './TaxMarketView.js';

/**
 * Tax incidence bench: who really pays a tax, and what it costs beyond the revenue.
 * Not animated; the diagram simply redraws each frame from the current settings.
 */
export class TaxBench extends Bench {
  static meta = {
    id: 'tax',
    title: 'Who really pays a tax',
    navLabel: 'Tax incidence',
    canvasLabel: 'Supply and demand with a tax wedge',
  };

  static info = {
    formula:
      'demand:   P = 80 − b·Q\n' +
      'supply:   P = 10 + d·Q\n' +
      'taxed Q:  Qt = (70 − t) / (b + d)\n' +
      'buyers’ share = b / (b + d)\n' +
      'DWL = t² / (2·(b + d))',
    predict: [
      'The law says sellers pay the tax. Make demand very steep. Who actually ends up paying?',
      'Double the tax. Does the revenue double? Does the lost-trade triangle double?',
      'Find the tax that raises the most money.',
    ],
    breaks: [
      'Straight lines, one market, perfect competition and no time. Real taxes shift behaviour over years, create black markets and spill into other markets.',
      'Use it to find the direction of an effect, not its exact size.',
    ],
    derive: [
      { text: 'Demand slopes down (higher price, fewer buyers) and supply slopes up (higher price, more sellers). Where they cross, the market clears.', formula: '80 − b·Q = 10 + d·Q   →   Q* = 70/(b+d)' },
      { text: 'A tax t per unit opens a gap: buyers pay Pb, sellers keep Ps, the state takes the difference.', formula: 'Pb − Ps = t' },
      { text: 'Fewer trades happen at the new prices. Solve for the taxed quantity.', formula: 'Qt = (70 − t)/(b + d)' },
      { text: 'Who pays depends only on the slopes, not on who hands the money over. The steeper, less flexible side pays more.', formula: 'buyers’ share = b/(b + d)' },
      { text: 'Trades that would have helped both sides but no longer happen are pure loss: the deadweight loss. It grows with the square of the tax.', formula: 'DWL = ½·t·(Q* − Qt) = t²/(2(b+d))' },
      { text: 'Revenue t·Qt first rises, then falls as the tax kills the market. Its peak is the top of the Laffer curve for this market.', formula: 't_max = 70/2 = €35' },
    ],
    research: {
      questions: [
        'To raise money with the least damage, you should tax the goods people cannot do without. What is the ethical problem with that answer?',
        'Germany has debated a sugar tax. Using this model, who would actually pay it?',
      ],
      challenge: 'Replace the straight lines with constant-elasticity curves Q = k·P^ε and allow a subsidy (negative tax). Does the deadweight loss behave the same way?',
      papers: [
        { authors: 'F. P. Ramsey', year: 1927, title: 'A contribution to the theory of taxation' },
        { authors: 'H. Dalton', year: 1922, title: 'Principles of Public Finance' },
        { authors: 'A. C. Harberger', year: 1964, title: 'The measurement of waste' },
      ],
    },
    notePlaceholder: 'Whoever can walk away more easily…',
  };

  build() {
    this.model = new TaxMarketModel();
    this.marketView = new TaxMarketView(this.view);

    this.layout.setLegend(new Legend([
      { label: 'demand', token: '--accent' },
      { label: 'supply', token: '--signal' },
      { label: 'tax revenue', token: '--third' },
      { label: 'lost trades', token: '--muted' },
    ]));

    this.readouts = new ReadoutPanel([
      { key: 'q', label: 'Quantity sold' },
      { key: 'pb', label: 'Buyers pay' },
      { key: 'ps', label: 'Sellers keep' },
      { key: 'rev', label: 'Tax revenue' },
      { key: 'dwl', label: 'Deadweight loss' },
      { key: 'share', label: 'Buyers’ share' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('tax'), label: 'Tax per unit', min: 0, max: 60, value: 15,
      format: (v) => `€${v}`,
      onInput: (v) => { this.model.tax = v; },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('b'), label: 'Demand slope b (buyers’ reaction)', min: 0.2, max: 3, step: 0.1, value: 0.8,
      format: (v) => v.toFixed(1),
      onInput: (v) => { this.model.b = v; },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('d'), label: 'Supply slope d (sellers’ reaction)', min: 0.2, max: 3, step: 0.1, value: 0.6,
      format: (v) => v.toFixed(1),
      onInput: (v) => { this.model.d = v; },
    }));
    this.layout.addHint('Higher slope = steeper line = people react less to price (inelastic). Insulin is steep; one brand of cola is flat.');
  }

  draw() {
    const r = this.model.solve();
    this.marketView.draw(this.model, r);
    this.readouts.set('q', `${r.qt.toFixed(1)} (was ${r.q0.toFixed(1)})`);
    this.readouts.set('pb', `€${r.buyerPrice.toFixed(2)}`);
    this.readouts.set('ps', `€${r.sellerPrice.toFixed(2)}`);
    this.readouts.set('rev', `€${r.revenue.toFixed(0)}`);
    this.readouts.set('dwl', `€${r.deadweightLoss.toFixed(0)}`);
    this.readouts.set('share', `${(r.buyerShare * 100).toFixed(0)}%`);
  }
}
