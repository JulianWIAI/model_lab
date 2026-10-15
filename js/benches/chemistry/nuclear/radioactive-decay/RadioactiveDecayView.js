/**
 * RadioactiveDecayView — two-panel canvas.
 *
 * Left (65%): N(t) on a linear scale; dashed markers at t½, 2t½, 3t½ and N₀/2, N₀/4, N₀/8.
 *             Stochastic overlay drawn in muted colour when model is in stochastic mode.
 * Right (35%): Activity A(t) = λ·N(t) on linear scale.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class RadioactiveDecayView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    // Stochastic history: [{t, N}] collected by bench each step
    this.stochasticHistory = [];
  }

  /**
   * @param {import('./RadioactiveDecayModel.js').RadioactiveDecayModel} model
   * @param {number} tHalfMax  time axis in units of t½
   */
  draw(model, tHalfMax) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.65);
    const pad    = { left: 56, top: 16, bottom: h - 36 };

    const pts = model.curve(tHalfMax, 400);

    // ── LEFT PANEL: N(t) ──────────────────────────────────────────────────────
    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, tHalfMax],
      [0, model.N0 * 1.05],
    );
    axesL.grid({
      xLabel: 't (t½)',
      yLabel: 'N',
      xTicks: [0, 1, 2, 3, tHalfMax].filter((v, i, a) => a.indexOf(v) === i && v <= tHalfMax),
      yTicks: [0, model.N0 * 0.25, model.N0 * 0.5, model.N0].map(v => +v.toFixed(0)),
      xFormat: v => v.toFixed(1),
      yFormat: v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toFixed(0),
    });

    // Dashed horizontals at N₀/2, N₀/4, N₀/8
    for (const frac of [0.5, 0.25, 0.125]) {
      _dashed(c, axesL.box.left, axesL.y(model.N0 * frac), splitX - 8,
        axesL.y(model.N0 * frac), theme.color('--muted'));
    }

    // Dashed verticals at t½, 2t½, 3t½
    for (const k of [1, 2, 3]) {
      if (k > tHalfMax) break;
      _dashed(c, axesL.x(k), pad.top, axesL.x(k), pad.bottom, theme.color('--muted'));
      axesL.label(`${k}t½`, k, model.N0 * 1.0,
        { color: theme.color('--muted'), align: 'center', dx: 0, dy: -14 });
    }

    // Deterministic curve
    axesL.polyline(pts.map(p => [p.t, p.N]), { color: theme.color('--accent'), width: 2.5 });

    // Stochastic overlay
    if (this.stochasticHistory.length > 1) {
      const spts = this.stochasticHistory.filter(p => p.t <= tHalfMax);
      axesL.polyline(spts.map(p => [p.t, p.N]),
        { color: theme.color('--signal'), width: 1.5, alpha: 0.6 });
    }

    // ── RIGHT PANEL: A(t) ─────────────────────────────────────────────────────
    const A0 = model.A(0);
    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, tHalfMax],
      [0, A0 * 1.05],
    );
    axesR.grid({
      xLabel: 't (t½)',
      yLabel: 'A (Bq)',
      xTicks: [0, 1, 2, 3, tHalfMax].filter((v, i, a) => a.indexOf(v) === i && v <= tHalfMax),
      yTicks: [0, A0 * 0.5, A0].map(v => +v.toPrecision(3)),
      xFormat: v => v.toFixed(1),
      yFormat: v => {
        if (v === 0) return '0';
        if (v >= 1e9) return `${(v / 1e9).toFixed(2)}G`;
        if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
        if (v >= 1e3) return `${(v / 1e3).toFixed(2)}k`;
        return v.toFixed(2);
      },
    });

    axesR.polyline(pts.map(p => [p.t, p.A]), { color: theme.color('--signal'), width: 2.5 });
  }
}

function _dashed(c, x1, y1, x2, y2, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth   = 1;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}
