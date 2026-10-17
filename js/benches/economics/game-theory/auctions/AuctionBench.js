/**
 * AuctionBench — symmetric IPV auction explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { AuctionModel } from './AuctionModel.js';
import { AuctionView } from './AuctionView.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { Slider } from '../../../../ui/Slider.js';

export class AuctionBench extends Bench {
  static meta = {
    id: 'auctions',
    title: 'Auctions',
    navLabel: 'Auctions',
    canvasLabel: 'Bid curves and expected revenue by N',
    level: 'university',
    keywords: [
      'auction', 'BNE', 'Bayesian Nash equilibrium', 'first-price', 'second-price',
      'Vickrey', 'revenue equivalence', 'private values', 'optimal mechanism',
    ],
    related: ['economics/game-theory/nash-equilibria'],
  };

  static info = {
    summary: [
      'In a symmetric independent private value (IPV) auction, each bidder privately draws a value v ~ Uniform[0,1].',
      'First-price sealed-bid: the highest bidder wins and pays their own bid.',
      'Second-price (Vickrey): the highest bidder wins but pays the second-highest bid.',
      'Revenue equivalence: both formats yield the same expected revenue E[R] = (N−1)/(N+1).',
    ],
    symbols: [
      { sym: 'N', desc: 'number of bidders' },
      { sym: 'v', desc: 'private value, drawn from Uniform[0,1]' },
      { sym: 'b*(v)', desc: 'BNE bid in first-price auction: (N−1)/N · v' },
      { sym: 'E[R]', desc: 'expected revenue: (N−1)/(N+1)' },
      { sym: 'r*', desc: 'Myerson optimal reserve price: 0.5 (uniform)' },
    ],
    predict: [
      'As N → ∞, what happens to b*(v) and E[R]?',
      'Why is truth-telling a dominant strategy in a second-price auction?',
      'Does setting a reserve price always increase expected revenue?',
    ],
    derive: [
      {
        text: 'Symmetric BNE first-price (uniform [0,1]):',
        formula: 'b*(v) = (N−1)/N · v',
      },
      {
        text: 'Expected revenue (order statistics, uniform [0,1]):',
        formula: 'E[R] = E[Y_(N-1:N)] = (N−1)/(N+1)',
      },
      {
        text: 'Myerson virtual value (uniform [0,1]):',
        formula: 'ψ(v) = v − (1−F(v))/f(v) = 2v − 1 = 0  →  r* = 0.5',
      },
    ],
    papers: [
      { authors: 'W. Vickrey', year: 1961, title: 'Counterspeculation, Auctions, and Competitive Sealed Tenders' },
      { authors: 'R. Myerson', year: 1981, title: 'Optimal Auction Design' },
      { authors: 'R. Riley & W. Samuelson', year: 1981, title: 'Optimal Auctions' },
    ],
    breaks: [
      'Revenue equivalence breaks down with risk-averse bidders (first-price yields more revenue).',
      'Correlated private values invalidate the standard BNE formula.',
      'With asymmetric bidders, the symmetric BNE b*(v) no longer applies.',
    ],
  };

  build() {
    this.model = new AuctionModel({ N: 2 });
    this.model._displayV = 0.8;
    this.auctionView = new AuctionView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'bneBid',   label: 'b*(v)' },
      { key: 'expRev',   label: 'E[R]' },
      { key: 'reserve',  label: 'r*' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('N'),
      label: 'N (bidders)',
      min: 2,
      max: 8,
      step: 1,
      value: 2,
      format: v => String(v),
      onInput: v => {
        this.model = new AuctionModel({ N: v });
        this.model._displayV = this._v ?? 0.8;
      },
    }));

    this._v = 0.8;
    this.layout.addControl(new Slider({
      id: this.controlId('v'),
      label: 'v (value)',
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.8,
      format: v => v.toFixed(2),
      onInput: v => {
        this._v = v;
        this.model._displayV = v;
      },
    }));
  }

  update(_dt) {}

  draw() {
    this.auctionView.draw(this.model);

    const v = this._v ?? 0.8;
    const bid = this.model?.bneBid(v);
    const rev = this.model?.expectedRevenue();
    const res = this.model?.optimalReserve();

    this.readouts.set('bneBid',  bid  != null ? bid.toFixed(4)  : '–');
    this.readouts.set('expRev',  rev  != null ? rev.toFixed(4)  : '–');
    this.readouts.set('reserve', res  != null ? res.toFixed(4)  : '–');
  }
}
