/**
 * CarnotView — T-S diagram showing the rectangular Carnot cycle.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class CarnotView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./CarnotModel.js').CarnotModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad = { left: 64, top: 20, right: 24, bottom: h - 44 };
    const Tpad = model.Th * 0.08;

    const axes = new Axes(
      c,
      { left: pad.left, top: pad.top, right: w - pad.right, bottom: pad.bottom },
      [0, model.dS * 1.4],
      [0, model.Th + Tpad],
    );

    axes.grid({
      xLabel: 'ΔS (J/K)',
      yLabel: 'T (K)',
      xTicks: [0, model.dS * 0.5, model.dS, model.dS * 1.2].map(v => +v.toFixed(3)),
      yTicks: [0, model.Tc, model.Th].map(v => +v.toFixed(1)),
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(0),
    });

    // Shaded work area W
    const pts = model.tsDiagram();
    c.save();
    c.beginPath();
    c.moveTo(axes.x(pts[0].S), axes.y(pts[0].T));
    for (const p of pts) c.lineTo(axes.x(p.S), axes.y(p.T));
    c.closePath();
    c.fillStyle = theme.color('--accent') + '30';
    c.fill();
    c.restore();

    // Cycle outline
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth   = 2;
    c.beginPath();
    c.moveTo(axes.x(pts[0].S), axes.y(pts[0].T));
    for (const p of pts) c.lineTo(axes.x(p.S), axes.y(p.T));
    c.stroke();
    c.restore();

    // Dashed T_h and T_c lines
    _dashed(c, pad.left, axes.y(model.Th), w - pad.right, axes.y(model.Th), theme.color('--signal'));
    _dashed(c, pad.left, axes.y(model.Tc), w - pad.right, axes.y(model.Tc), theme.color('--muted'));

    // Labels
    c.save();
    c.fillStyle = theme.color('--signal');
    c.font      = '11px monospace';
    c.textAlign = 'left';
    c.fillText(`T_h = ${model.Th.toFixed(0)} K`, pad.left + 4, axes.y(model.Th) - 4);
    c.fillStyle = theme.color('--muted');
    c.fillText(`T_c = ${model.Tc.toFixed(0)} K`, pad.left + 4, axes.y(model.Tc) - 4);
    c.restore();

    // W label in centre of rectangle
    const cx = axes.x(model.dS * 0.5);
    const cy = axes.y((model.Th + model.Tc) / 2);
    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.font      = 'bold 13px monospace';
    c.textAlign = 'center';
    c.fillText(`W = ${model.W.toFixed(2)} J`, cx, cy);
    c.restore();
  }
}

function _dashed(c, x1, y1, x2, y2, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth   = 1;
  c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}
