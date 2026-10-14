import { Axes } from '../../../core/Axes.js';
import { theme } from '../../../core/Theme.js';

/**
 * Supply and demand diagram with the tax wedge:
 * shaded revenue rectangle and the deadweight-loss triangle.
 */
export class TaxMarketView {
  /** @param {import('../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./TaxMarketModel.js').TaxMarketModel} model
   * @param {ReturnType<import('./TaxMarketModel.js').TaxMarketModel['solve']>} r  solved market
   */
  draw(model, r) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    const qMax = Math.max(100, r.q0 * 1.4);
    const axes = new Axes(c, { left: 44, top: 20, right: w - 12, bottom: h - 36 }, [0, qMax], [0, 100]);

    const qStep = qMax > 150 ? 50 : 20;
    const xTicks = [];
    for (let q = 0; q <= qMax; q += qStep) xTicks.push(q);
    axes.grid({ yTicks: [0, 20, 40, 60, 80, 100], yFormat: (v) => `€${v}`, xTicks, xLabel: 'quantity' });

    // Tax revenue: the gap between prices times the quantity still sold
    axes.fillPolygon(
      [[0, r.buyerPrice], [r.qt, r.buyerPrice], [r.qt, r.sellerPrice], [0, r.sellerPrice]],
      { color: theme.color('--third'), alpha: 0.22 },
    );
    // Deadweight loss: trades between qt and q0 that would have benefited both sides
    axes.fillPolygon(
      [[r.qt, r.buyerPrice], [r.q0, r.p0], [r.qt, r.sellerPrice]],
      { color: theme.color('--muted'), alpha: 0.3 },
    );

    axes.plotFunction((q) => model.demandPrice(q), { color: theme.color('--accent') });
    axes.plotFunction((q) => model.supplyPrice(q), { color: theme.color('--signal') });
    if (model.tax > 0) {
      axes.plotFunction((q) => model.supplyPrice(q) + model.tax, { color: theme.color('--signal'), dash: [5, 4] });
    }

    // Guides from the taxed quantity to both prices
    const guide = { color: theme.color('--muted'), width: 1, dash: [2, 3] };
    axes.polyline([[0, r.buyerPrice], [r.qt, r.buyerPrice]], guide);
    axes.polyline([[0, r.sellerPrice], [r.qt, r.sellerPrice]], guide);
    axes.polyline([[r.qt, r.buyerPrice], [r.qt, 0]], guide);

    // Untaxed equilibrium point
    c.fillStyle = theme.color('--ink');
    c.beginPath();
    c.arc(axes.x(r.q0), axes.y(r.p0), 3.5, 0, Math.PI * 2);
    c.fill();
    axes.label('no-tax point', r.q0, r.p0, { dx: 6, dy: -6 });
    if (model.tax > 0) {
      const qLabel = Math.min(qMax * 0.75, r.qt + 10);
      axes.label('supply + tax', qLabel, model.supplyPrice(qLabel) + model.tax, { dy: -6 });
    }
  }
}
