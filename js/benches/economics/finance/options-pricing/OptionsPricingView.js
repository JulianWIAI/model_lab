/**
 * OptionsPricingView — Black-Scholes call/put price curves and delta.
 *
 * Left (60%): call and put price vs spot S, with current S marked.
 * Right (40%): call delta Φ(d₁) vs spot S.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';
import { OptionsPricingModel } from './OptionsPricingModel.js';

export class OptionsPricingView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {OptionsPricingModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const split = Math.floor(w * 0.60);

    this._drawPriceCurves(c, model, 0, split, h);
    this._drawDeltaCurve(c, model, split, w, h);
  }

  _drawPriceCurves(c, model, x0, split, h) {
    const { S, K, r, sigma, T } = model;
    const N = 100;
    const sMin = 0.1 * K;
    const sMax = 2.0 * K;

    // compute curves
    const callPts = [], putPts = [];
    let maxPrice = 0;
    for (let i = 0; i <= N; i++) {
      const s = sMin + (i / N) * (sMax - sMin);
      const m = new OptionsPricingModel({ S: s, K, r, sigma, T });
      const cp = m.callPrice();
      const pp = m.putPrice();
      callPts.push({ x: s, y: cp });
      putPts.push({ x: s, y: pp });
      if (cp > maxPrice) maxPrice = cp;
      if (pp > maxPrice) maxPrice = pp;
    }
    maxPrice = Math.max(maxPrice * 1.1, 1);

    const padL = 54, padT = 20, padR = 8, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: split - padR, bottom: h - padB },
      [sMin, sMax],
      [0, maxPrice],
    );

    axes.grid({
      xLabel: 'S (spot price)',
      yLabel: 'option price',
      xTicks: [sMin, K * 0.5, K, K * 1.5, sMax].map(v => parseFloat(v.toFixed(0))),
      yTicks: [0, maxPrice * 0.25, maxPrice * 0.5, maxPrice * 0.75, maxPrice].map(v => parseFloat(v.toFixed(1))),
    });

    // Vertical dashed line at current S
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(S), axes.y(0));
    c.lineTo(axes.x(S), axes.y(maxPrice));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Dashed horizontal at K (strike)
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([2, 4]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(sMin), axes.y(0));
    c.lineTo(axes.x(sMax), axes.y(0));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Put curve
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 2;
    c.beginPath();
    putPts.forEach((p, i) => {
      if (i === 0) c.moveTo(axes.x(p.x), axes.y(p.y));
      else c.lineTo(axes.x(p.x), axes.y(p.y));
    });
    c.stroke();
    c.restore();

    // Call curve
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    callPts.forEach((p, i) => {
      if (i === 0) c.moveTo(axes.x(p.x), axes.y(p.y));
      else c.lineTo(axes.x(p.x), axes.y(p.y));
    });
    c.stroke();
    c.restore();

    // Labels
    c.save();
    c.font = '11px monospace';
    const lastCall = callPts[callPts.length - 1];
    const lastPut  = putPts[putPts.length - 1];
    c.fillStyle = theme.color('--accent');
    c.fillText('call', axes.x(lastCall.x) - 28, axes.y(lastCall.y) - 4);
    c.fillStyle = theme.color('--signal');
    c.fillText('put',  axes.x(lastPut.x)  - 24, axes.y(lastPut.y)  + 12);
    c.restore();

    // Dot at current S
    const mCurrent = model;
    const callY = mCurrent.callPrice();
    const putY  = mCurrent.putPrice();
    c.save();
    c.fillStyle = theme.color('--accent');
    c.beginPath();
    c.arc(axes.x(S), axes.y(callY), 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(axes.x(S), axes.y(putY), 4, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  _drawDeltaCurve(c, model, x0, w, h) {
    const { K, r, sigma, T } = model;
    const N = 100;
    const sMin = 0.1 * K;
    const sMax = 2.0 * K;

    const deltaPts = [];
    for (let i = 0; i <= N; i++) {
      const s = sMin + (i / N) * (sMax - sMin);
      const m = new OptionsPricingModel({ S: s, K, r, sigma, T });
      deltaPts.push({ x: s, y: m.delta('call') });
    }

    const padL = 24, padT = 20, padR = 16, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: w - padR, bottom: h - padB },
      [sMin, sMax],
      [0, 1],
    );

    axes.grid({
      xLabel: 'S (spot price)',
      yLabel: 'Δ (call delta)',
      xTicks: [sMin, K, sMax].map(v => parseFloat(v.toFixed(0))),
      yTicks: [0, 0.25, 0.5, 0.75, 1.0],
    });

    // Dashed 0.5 reference
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(sMin), axes.y(0.5));
    c.lineTo(axes.x(sMax), axes.y(0.5));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Vertical dashed at current S
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(model.S), axes.y(0));
    c.lineTo(axes.x(model.S), axes.y(1));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Delta curve
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    deltaPts.forEach((p, i) => {
      if (i === 0) c.moveTo(axes.x(p.x), axes.y(p.y));
      else c.lineTo(axes.x(p.x), axes.y(p.y));
    });
    c.stroke();
    c.restore();

    // Dot at current S
    c.save();
    c.fillStyle = theme.color('--accent');
    c.beginPath();
    c.arc(axes.x(model.S), axes.y(model.delta('call')), 4, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
