/**
 * PhasePlaneView — two panels.
 * Left (45%): τ-Δ plane with classification regions and current A point.
 * Right (55%): phase portrait (quiver + RK4 orbits).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class PhasePlaneView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./PhasePlaneModel.js').PhasePlaneModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.42);
    this._drawTauDelta(c, model, 0, 0, splitX, h);
    this._drawPortrait(c, model, splitX + 4, 0, w, h);
  }

  _drawTauDelta(c, model, x0, y0, x1, y1) {
    const tauMax = 4, DMax = 5;
    const pad = { left: x0 + 44, top: y0 + 16, right: x1 - 8, bottom: y1 - 36 };

    const axes = new Axes(c,
      { left: pad.left, top: pad.top, right: pad.right, bottom: pad.bottom },
      [-tauMax, tauMax], [-0.5, DMax]);

    axes.grid({
      xLabel: 'τ (trace)',
      yLabel: 'Δ (det)',
      xTicks: [-4, -2, 0, 2, 4],
      yTicks: [0, 1, 2, 3, 4],
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(0),
    });

    // Parabola τ²=4Δ
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth   = 1.5;
    c.setLineDash([4, 3]);
    c.beginPath();
    let first = true;
    for (let i = -200; i <= 200; i++) {
      const tau = tauMax * i / 200;
      const D   = tau * tau / 4;
      if (D > DMax) continue;
      const px = axes.x(tau), py = axes.y(D);
      if (first) { c.moveTo(px, py); first = false; } else c.lineTo(px, py);
    }
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Label parabola
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = '10px monospace';
    c.fillText('τ²=4Δ', axes.x(3.2), axes.y(2.6) - 6);
    c.restore();

    // Current A point
    const { tau, det: D } = model;
    const px = axes.x(Math.max(-tauMax, Math.min(tauMax, tau)));
    const py = axes.y(Math.max(-0.5,    Math.min(DMax,   D)));

    c.save();
    c.beginPath();
    c.arc(px, py, 5, 0, 2 * Math.PI);
    c.fillStyle   = theme.color('--accent');
    c.strokeStyle = theme.color('--on-surface');
    c.lineWidth   = 1.5;
    c.fill();
    c.stroke();
    c.restore();

    // Classification label
    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.font = 'bold 11px monospace';
    c.textAlign = 'center';
    c.fillText(model.classification, (x0 + x1) / 2, y1 - 10);
    c.restore();
  }

  _drawPortrait(c, model, x0, y0, x1, y1) {
    const xRange = 2;
    const pad = { left: x0 + 36, top: y0 + 12, right: x1 - 8, bottom: y1 - 36 };

    const axes = new Axes(c,
      { left: pad.left, top: pad.top, right: pad.right, bottom: pad.bottom },
      [-xRange, xRange], [-xRange, xRange]);

    axes.grid({
      xLabel: 'x₁',
      yLabel: 'x₂',
      xTicks: [-2, -1, 0, 1, 2],
      yTicks: [-2, -1, 0, 1, 2],
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(0),
    });

    // Quiver
    const field = model.vectorField(xRange, 10);
    const maxNorm = Math.max(...field.map(p => Math.hypot(p.dx, p.dy)), 1e-9);
    const scale   = xRange * 0.12 / maxNorm;

    c.save();
    c.strokeStyle = theme.color('--muted') + 'AA';
    c.lineWidth   = 1;
    for (const { x, y, dx, dy } of field) {
      const px  = axes.x(x), py = axes.y(y);
      const edx = dx * scale, edy = -dy * scale;
      const len = Math.hypot(edx, edy);
      if (len < 1) continue;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + edx, py + edy);
      c.stroke();
    }
    c.restore();

    // 4 orbits from corners
    const tMax = 8;
    const ICs  = [[1, 0], [-1, 0], [0, 1], [0.7, 0.7]];
    for (let i = 0; i < ICs.length; i++) {
      const orbit = model.orbit(ICs[i], tMax, tMax / 600);
      c.save();
      c.strokeStyle = theme.color('--accent');
      c.lineWidth   = 1.5;
      c.globalAlpha = 0.7 - i * 0.12;
      c.beginPath();
      for (let k = 0; k < orbit.length; k++) {
        const px = axes.x(orbit[k].x), py = axes.y(orbit[k].y);
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      c.restore();
    }
  }
}
