/**
 * NernstCellView — E vs log₁₀(Q) curve with current point and E° reference line.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class NernstCellView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./NernstCellModel.js').NernstCellModel} model
   * @param {number} logQ  current log10(Q)
   */
  draw(model, logQ) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const logQMin = -3, logQMax = 3;
    const curvePts = model.curve(logQMin, logQMax, 200);
    const Evals = curvePts.map(pt => pt.E);
    const Emin = Math.min(...Evals) - 0.05;
    const Emax = Math.max(...Evals) + 0.05;

    const axes = new Axes(
      c,
      { left: 64, top: 16, right: w - 16, bottom: h - 36 },
      [logQMin, logQMax],
      [Emin, Emax],
    );
    axes.grid({
      xLabel: 'log₁₀(Q)',
      yLabel: 'E (V)',
      xTicks: [-3, -2, -1, 0, 1, 2, 3],
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(2),
    });

    // E° dashed horizontal line
    const E0 = model.E_standard;
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([5, 4]);
    c.beginPath();
    c.moveTo(axes.box.left, axes.y(E0));
    c.lineTo(axes.box.right, axes.y(E0));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // E° label
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = '11px monospace';
    c.textAlign = 'left';
    c.fillText(`E° = ${E0.toFixed(4)} V`, axes.box.left + 6, axes.y(E0) - 6);
    c.restore();

    // E vs log₁₀(Q) curve
    const pts = curvePts.map(pt => [pt.logQ, pt.E]);
    axes.polyline(pts, { color: theme.color('--accent'), width: 2.5 });

    // Current point
    const Ecurrent = model.E(model.T, Math.pow(10, logQ));
    c.save();
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(axes.x(logQ), axes.y(Ecurrent), 6, 0, 2 * Math.PI);
    c.fill();
    c.restore();
  }
}
