/**
 * RCCircuitView — two-panel canvas: V_C(t) on the left, I(t) on the right.
 *
 * Left panel (65%): V_C vs t curve with τ vertical dashed, 63%·V₀ horizontal dashed.
 * Right panel (35%): I vs t curve showing exponential decay.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class RCCircuitView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./RCCircuitModel.js').RCCircuitModel} model
   * @param {number} tMax  maximum time displayed  [s]
   */
  draw(model, tMax) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.65);
    const pad    = { left: 56, top: 16, bottom: h - 36 };

    const pts = model.curve(tMax, 400);

    // ── LEFT PANEL: V_C vs t ──────────────────────────────────────────────────
    const VcMax = model.V0 * 1.1;
    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, tMax],
      [0, VcMax],
    );
    axesL.grid({
      xLabel: 't (s)',
      yLabel: 'V_C (V)',
      xTicks: [0, tMax * 0.25, tMax * 0.5, tMax * 0.75, tMax].map(v => +v.toFixed(4)),
      yTicks: [0, model.V0 * 0.5, model.V0].map(v => +v.toFixed(2)),
      xFormat: v => v < 1e-3 ? `${(v * 1000).toFixed(2)}m` : v.toFixed(4),
      yFormat: v => v.toFixed(2),
    });

    // Dashed horizontal at 0.632·V₀  (= V₀·(1 − 1/e))
    const v63 = model.V0 * (1 - Math.exp(-1));
    _dashed(c, axesL.box.left, axesL.y(v63), splitX - 8, axesL.y(v63), theme.color('--muted'));
    axesL.label(`${(v63 / model.V0 * 100).toFixed(0)}%`, tMax * 0.03, v63,
      { color: theme.color('--muted'), align: 'left', dx: 4, dy: -10 });

    // Dashed vertical at τ
    const tau = model.tau;
    if (tau <= tMax) {
      _dashed(c, axesL.x(tau), pad.top, axesL.x(tau), pad.bottom, theme.color('--signal'));
      axesL.label('τ', tau, VcMax * 0.92,
        { color: theme.color('--signal'), align: 'center', dx: 0, dy: 0 });
    }

    // Dashed horizontal at V₀
    _dashed(c, axesL.box.left, axesL.y(model.V0), splitX - 8, axesL.y(model.V0),
      theme.color('--muted'));
    axesL.label('V₀', tMax * 0.03, model.V0,
      { color: theme.color('--muted'), align: 'left', dx: 4, dy: -10 });

    // V_C(t) curve
    axesL.polyline(pts.map(p => [p.t, p.Vc]), { color: theme.color('--accent'), width: 2.5 });

    // ── RIGHT PANEL: I vs t ───────────────────────────────────────────────────
    const Imax = model.V0 / model.R * 1.1;
    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, tMax],
      [0, Imax],
    );
    axesR.grid({
      xLabel: 't (s)',
      yLabel: 'I (A)',
      xTicks: [0, tMax * 0.5, tMax].map(v => +v.toFixed(4)),
      yTicks: [0, model.V0 / model.R * 0.5, model.V0 / model.R].map(v => +v.toFixed(4)),
      xFormat: v => v < 1e-3 ? `${(v * 1000).toFixed(2)}m` : v.toFixed(4),
      yFormat: v => {
        if (v === 0) return '0';
        return v < 0.001 ? `${(v * 1000).toFixed(2)}m` : v.toFixed(4);
      },
    });

    // Dashed vertical at τ
    if (tau <= tMax) {
      _dashed(c, axesR.x(tau), pad.top, axesR.x(tau), pad.bottom, theme.color('--signal'));
    }

    // I(t) curve
    axesR.polyline(pts.map(p => [p.t, p.I]), { color: theme.color('--signal'), width: 2.5 });
  }
}

/**
 * Draw a dashed line between two pixel points.
 * @param {CanvasRenderingContext2D} c
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} color
 */
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
