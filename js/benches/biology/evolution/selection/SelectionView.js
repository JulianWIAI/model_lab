/**
 * SelectionView — two-panel: i vs p (left) and R vs h² (right).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class SelectionView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./SelectionModel.js').SelectionModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.6);
    const margin = { left: 52, top: 16, bottom: h - 36 };

    // ── LEFT PANEL: i vs p ──
    const curvePts = model.curve(200);
    const maxI = curvePts.reduce((m, pt) => Math.max(m, pt.i), 0) * 1.1;

    const axesL = new Axes(
      c,
      { left: margin.left, top: margin.top, right: splitX - 8, bottom: margin.bottom },
      [0, 1],
      [0, maxI],
    );
    axesL.grid({
      xLabel: 'top fraction p',
      yLabel: 'selection intensity i',
      xTicks: [0, 0.25, 0.5, 0.75, 1],
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(1),
    });

    // Curve
    const iPts = curvePts.map(pt => [pt.p, pt.i]);
    axesL.polyline(iPts, { color: theme.color('--accent'), width: 2.5 });

    // Vertical dashed at current p
    const curI = model.selectionIntensity();
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axesL.x(model.p), axesL.box.top);
    c.lineTo(axesL.x(model.p), axesL.box.bottom);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Dot at (p, i)
    c.save();
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(axesL.x(model.p), axesL.y(curI), 5, 0, 2 * Math.PI);
    c.fill();
    c.restore();

    // ── RIGHT PANEL: R vs h² ──
    const S = model.selectionDifferential();
    const maxR = S * 1.1;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: margin.top, right: w - 12, bottom: margin.bottom },
      [0, 1],
      [0, maxR],
    );
    axesR.grid({
      xLabel: 'heritability h²',
      yLabel: 'response R',
      xTicks: [0, 0.25, 0.5, 0.75, 1],
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    // R vs h² line (for current S)
    const rPts = [[0, 0], [1, S]];
    axesR.polyline(rPts, { color: theme.color('--accent'), width: 2.5 });

    // Vertical dashed at current h²
    const curR = model.response();
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axesR.x(model.h2), axesR.box.top);
    c.lineTo(axesR.x(model.h2), axesR.box.bottom);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Dot at (h², R)
    c.save();
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(axesR.x(model.h2), axesR.y(curR), 5, 0, 2 * Math.PI);
    c.fill();
    c.restore();
  }
}
