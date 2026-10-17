/**
 * AuctionView — two-panel view for auction theory.
 *
 * Left panel:  bid curves (first-price BNE b*(v) and truth-telling v).
 * Right panel: expected revenue vs N (N = 2..8).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';
import { AuctionModel } from './AuctionModel.js';

export class AuctionView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const midX = Math.floor(w / 2) - 8;

    // ---- Left panel: bid curves ----
    const padL = { left: 56, top: 16, right: midX - 8, bottom: h - 40 };
    const axL = new Axes(c, padL, [0, 1], [0, 1]);
    axL.grid({
      xLabel: 'v (private value)',
      yLabel: 'bid',
      xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      xFormat: v => v.toFixed(1),
      yFormat: v => v.toFixed(1),
    });

    // Truth-telling line: bid = v
    const truthPts = [[0, 0], [1, 1]];
    axL.polyline(truthPts, { color: theme.color('--signal'), width: 2 });

    // BNE bid curve: b*(v) = (N-1)/N * v
    const curve = model.bidCurve(200);
    const bnePts = curve.map(({ v, bid }) => [v, bid]);
    axL.polyline(bnePts, { color: theme.color('--accent'), width: 2.5 });

    // Mark current v on the BNE curve
    const currentV = model._displayV ?? 0.8;
    const currentBid = model.bneBid(currentV);
    c.save();
    c.fillStyle = theme.color('--accent');
    c.beginPath();
    c.arc(axL.x(currentV), axL.y(currentBid), 5, 0, 2 * Math.PI);
    c.fill();
    c.restore();

    // Panel title
    c.save();
    c.font = theme.font(12, 'sans');
    c.fillStyle = theme.color('--on-surface');
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('Bid curves', (padL.left + padL.right) / 2, padL.top + 2);
    c.restore();

    // Legend
    c.save();
    c.font = theme.font(11, 'sans');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = theme.color('--accent');
    c.fillText('b*(v) first-price BNE', padL.left + 4, padL.top + 18);
    c.fillStyle = theme.color('--signal');
    c.fillText('v  truth-telling (2nd-price)', padL.left + 4, padL.top + 32);
    c.restore();

    // ---- Right panel: expected revenue vs N ----
    const padR = { left: midX + 56, top: 16, right: w - 16, bottom: h - 40 };
    const maxRev = 1;
    const axR = new Axes(c, padR, [1.5, 8.5], [0, maxRev]);
    axR.grid({
      xLabel: 'N (bidders)',
      yLabel: 'E[R]',
      xTicks: [2, 3, 4, 5, 6, 7, 8],
      yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      xFormat: v => String(v),
      yFormat: v => v.toFixed(1),
    });

    // Draw revenue bars for N=2..8
    const barWidth = (axR.x(3) - axR.x(2)) * 0.6;
    for (let n = 2; n <= 8; n++) {
      const m = new AuctionModel({ N: n });
      const rev = m.expectedRevenue();
      const px = axR.x(n);
      const py = axR.y(rev);
      const base = axR.y(0);
      c.save();
      c.fillStyle = n === model.N
        ? theme.color('--accent')
        : theme.color('--grid');
      c.fillRect(px - barWidth / 2, py, barWidth, base - py);
      c.restore();
    }

    // Panel title
    c.save();
    c.font = theme.font(12, 'sans');
    c.fillStyle = theme.color('--on-surface');
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('Expected revenue vs N', (padR.left + padR.right) / 2, padR.top + 2);
    c.restore();

    // Highlight current N label
    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--accent');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(`N=${model.N}  E[R]=${model.expectedRevenue().toFixed(3)}`, padR.left + 4, padR.top + 18);
    c.restore();
  }
}
