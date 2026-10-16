/**
 * DriftDiffusionView — single-panel showing a simulated SDE path with boundaries.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';
import { Random } from '../../../../core/Random.js';

export class DriftDiffusionView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./DriftDiffusionModel.js').DriftDiffusionModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad = { left: 56, top: 16, right: 16, bottom: h - 40 };
    const { mu, sigma, a } = model;
    const tMax = Math.max(3, model.rtMean * 2.5);

    const axes = new Axes(
      c,
      { left: pad.left, top: pad.top, right: w - pad.right, bottom: pad.bottom },
      [0, tMax],
      [-a * 1.3, a * 1.3],
    );
    axes.grid({
      xLabel: 't (s)',
      yLabel: 'evidence',
      xTicks: [0, tMax * 0.5, tMax].map(v => +v.toFixed(2)),
      yTicks: [-a, 0, a].map(v => +v.toFixed(2)),
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    // Boundary lines
    _hLine(c, pad.left, w - pad.right, axes.y(a),  theme.color('--accent'));
    _hLine(c, pad.left, w - pad.right, axes.y(-a), theme.color('--signal'));
    _hLine(c, pad.left, w - pad.right, axes.y(0),  theme.color('--muted'), true);

    c.save();
    c.fillStyle = theme.color('--accent');
    c.font = '11px monospace';
    c.textAlign = 'right';
    c.fillText('+a', pad.left - 4, axes.y(a) + 4);
    c.fillStyle = theme.color('--signal');
    c.fillText('-a', pad.left - 4, axes.y(-a) + 4);
    c.restore();

    // Simulate 5 sample paths
    const rng = new Random(123);
    const dt  = 0.005;
    const sqDt = Math.sqrt(dt);
    const colors = [
      theme.color('--accent') + 'AA',
      theme.color('--signal') + 'AA',
      theme.color('--on-surface') + '66',
      theme.color('--accent') + '66',
      theme.color('--signal') + '66',
    ];
    for (let trial = 0; trial < 5; trial++) {
      const pts = [[0, 0]];
      let x = 0, t = 0;
      while (t < tMax && Math.abs(x) < a) {
        x += mu * dt + sigma * sqDt * rng.normalSeeded();
        t += dt;
        pts.push([t, Math.max(-a * 1.25, Math.min(a * 1.25, x))]);
        if (Math.abs(x) >= a) break;
      }
      c.save();
      c.strokeStyle = colors[trial % colors.length];
      c.lineWidth   = 1.5;
      c.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const px = axes.x(pts[i][0]);
        const py = axes.y(pts[i][1]);
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      c.restore();
    }
  }
}

function _hLine(c, x0, x1, y, color, dashed = false) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth   = dashed ? 1 : 2;
  if (dashed) c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(x1, y);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}
