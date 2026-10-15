/**
 * PredatorPreyView — two-panel: time series (left) and phase portrait (right).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class PredatorPreyView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./PredatorPreyModel.js').PredatorPreyModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const hist = model.history;
    if (hist.length < 2) return;

    const splitX = Math.floor(w * 0.6);
    const margin = { left: 52, top: 16, bottom: h - 36 };

    // Compute ranges
    let tMin = hist[0].t, tMax = hist[hist.length - 1].t;
    let maxXY = 0;
    for (const pt of hist) {
      if (pt.x > maxXY) maxXY = pt.x;
      if (pt.y > maxXY) maxXY = pt.y;
    }
    maxXY = maxXY * 1.1 + 1;

    // ── LEFT PANEL: time series ──
    const axesL = new Axes(
      c,
      { left: margin.left, top: margin.top, right: splitX - 8, bottom: margin.bottom },
      [tMin, tMax],
      [0, maxXY],
    );
    axesL.grid({
      xLabel: 't',
      yLabel: 'population',
    });

    // Prey (accent)
    const preyPts = hist.map(pt => [pt.t, pt.x]);
    axesL.polyline(preyPts, { color: theme.color('--accent'), width: 2 });

    // Predator (signal)
    const predPts = hist.map(pt => [pt.t, pt.y]);
    axesL.polyline(predPts, { color: theme.color('--signal'), width: 2 });

    // Legend
    c.save();
    c.font = '11px monospace';
    c.fillStyle = theme.color('--accent');
    c.textAlign = 'left';
    c.fillText('Prey', margin.left + 4, margin.top + 14);
    c.fillStyle = theme.color('--signal');
    c.fillText('Predator', margin.left + 4, margin.top + 28);
    c.restore();

    // ── RIGHT PANEL: phase portrait ──
    const eq = model.equilibrium();
    const xMax = maxXY;
    const yMax = maxXY;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: margin.top, right: w - 12, bottom: margin.bottom },
      [0, xMax],
      [0, yMax],
    );
    axesR.grid({
      xLabel: 'prey x',
      yLabel: 'predator y',
    });

    // History trajectory
    const phasePts = hist.map(pt => [pt.x, pt.y]);
    axesR.polyline(phasePts, { color: theme.color('--accent'), width: 1.5, alpha: 0.7 });

    // Current point
    c.save();
    c.fillStyle = theme.color('--accent');
    c.beginPath();
    c.arc(axesR.x(model.x), axesR.y(model.y), 5, 0, 2 * Math.PI);
    c.fill();
    c.restore();

    // Equilibrium point
    if (eq.x <= xMax && eq.y <= yMax) {
      c.save();
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(axesR.x(eq.x), axesR.y(eq.y), 5, 0, 2 * Math.PI);
      c.fill();
      axesR.label('eq', eq.x, eq.y, { color: theme.color('--signal'), align: 'left', dx: 7, dy: -2 });
      c.restore();
    }
  }
}
