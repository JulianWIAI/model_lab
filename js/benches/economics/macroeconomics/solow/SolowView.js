/**
 * SolowView — k(t) convergence and Solow diagram (ŷ=sy^α vs break-even).
 *
 * Left (60%): k(t) simulation from k₀; dashed k* horizontal.
 * Right (40%): Solow diagram — investment sy^α and break-even (n+δ+g)k vs k.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class SolowView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./SolowModel.js').SolowModel} model */
  draw(model, sim) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const split = Math.floor(w * 0.62);

    this._drawSim(c, model, sim, 0, split, h);
    this._drawDiagram(c, model, split, w, h);
  }

  _drawSim(c, model, sim, x0, split, h) {
    if (!sim || sim.length < 2) return;
    const { kStar } = model.steadyState();
    const kMax = Math.max(kStar * 1.3, sim[0].k * 1.2, 1);
    const T    = sim[sim.length - 1].t;

    const padL = 54, padT = 20, padR = 8, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: split - padR, bottom: h - padB },
      [0, T],
      [0, kMax],
    );

    axes.grid({
      xLabel: 't (yr)',
      yLabel: 'k (per eff. worker)',
      xTicks: [0, T / 4, T / 2, 3 * T / 4, T].map(Math.round),
      yTicks: [0, kStar * 0.5, kStar, kMax * 0.9].map(v => parseFloat(v.toFixed(2))),
    });

    // Dashed k*
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(0), axes.y(kStar));
    c.lineTo(axes.x(T), axes.y(kStar));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // k(t) curve
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    sim.forEach((p, i) => {
      if (i === 0) c.moveTo(axes.x(p.t), axes.y(p.k));
      else c.lineTo(axes.x(p.t), axes.y(p.k));
    });
    c.stroke();
    c.restore();

    // k* label
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = '11px monospace';
    c.fillText(`k*=${kStar.toFixed(2)}`, x0 + padL + 4, axes.y(kStar) - 4);
    c.restore();
  }

  _drawDiagram(c, model, x0, w, h) {
    const { kStar } = model.steadyState();
    const kMax = kStar * 2;
    const n    = 60;

    const padL = 24, padT = 20, padR = 16, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: w - padR, bottom: h - padB },
      [0, kMax],
      [0, model.A * Math.pow(kMax, model.alpha) * 1.1],
    );

    axes.grid({
      xLabel: 'k',
      yLabel: 'per-worker flows',
      xTicks: [0, kStar * 0.5, kStar, kMax].map(v => parseFloat(v.toFixed(1))),
    });

    // Break-even line (n+δ+g)k
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(axes.x(0), axes.y(0));
    c.lineTo(axes.x(kMax), axes.y(model._denom * kMax));
    c.stroke();
    c.restore();

    // Investment curve s·y(k) = s·A·k^α
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const k = (i / n) * kMax;
      const inv = model.s * model._y(k);
      if (i === 0) c.moveTo(axes.x(k), axes.y(inv));
      else c.lineTo(axes.x(k), axes.y(inv));
    }
    c.stroke();
    c.restore();

    // Dot at k*
    const invStar = model.s * model._y(kStar);
    c.save();
    c.fillStyle = theme.color('--good');
    c.beginPath();
    c.arc(axes.x(kStar), axes.y(invStar), 4, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
