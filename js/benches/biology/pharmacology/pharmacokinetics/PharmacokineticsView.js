/**
 * PharmacokineticsView — semi-log plot of C(t) vs t.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class PharmacokineticsView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./PharmacokineticsModel.js').PharmacokineticsModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad = { left: 64, top: 16, right: 16, bottom: h - 40 };

    // Display 5 half-lives
    const tMax = 5 * model.tHalf;
    const C0   = model.iv ? model.C0 : model.C(model.tMax);
    const Cmin = Math.max(C0 / 1000, 0.001);

    // Log-scale: convert log10 values for y
    const logMin = Math.log10(Cmin);
    const logMax = Math.log10(C0 * 1.2);

    const axes = new Axes(c,
      { left: pad.left, top: pad.top, right: w - pad.right, bottom: pad.bottom },
      [0, tMax],
      [logMin, logMax]);

    // Custom grid for semi-log
    axes.grid({
      xLabel: 't (h)',
      yLabel: 'log₁₀C',
      xTicks: [0, tMax * 0.25, tMax * 0.5, tMax * 0.75, tMax].map(v => +v.toFixed(1)),
      yTicks: [Math.ceil(logMin), Math.floor(logMax)],
      xFormat: v => v.toFixed(1),
      yFormat: v => v.toFixed(0),
    });

    // Curve: draw in log scale
    const pts = model.curve(tMax, 400);
    const logPts = pts.filter(p => p.C > 0).map(p => [p.t, Math.log10(p.C)]);

    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth   = 2.5;
    c.beginPath();
    for (let i = 0; i < logPts.length; i++) {
      const px = axes.x(logPts[i][0]), py = axes.y(logPts[i][1]);
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
    c.restore();

    // t½ dashed vertical
    const th = model.tHalf;
    if (th <= tMax) {
      c.save();
      c.strokeStyle = theme.color('--signal');
      c.lineWidth   = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(axes.x(th), pad.top);
      c.lineTo(axes.x(th), pad.bottom);
      c.stroke();
      c.setLineDash([]);
      c.restore();

      c.save();
      c.fillStyle = theme.color('--signal');
      c.font = '11px monospace';
      c.textAlign = 'center';
      c.fillText(`t½=${th.toFixed(2)}h`, axes.x(th), pad.top + 12);
      c.restore();
    }
  }
}
