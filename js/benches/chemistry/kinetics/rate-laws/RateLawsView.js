/**
 * RateLawsView — [A] vs time for 0th, 1st, 2nd order reactions.
 *
 * Draws a single curve for the current order, with:
 *   - Half-life marker (vertical dashed line + dot at [A]₀/2)
 *   - Horizontal dashed line at [A]₀/2
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class RateLawsView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./RateLawsModel.js').RateLawsModel} model
   * @param {number} tMax  upper time limit for the x-axis
   */
  draw(model, tMax) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 56, top: 16, right: w - 16, bottom: h - 36 },
      [0, tMax],
      [0, model.A0],
    );
    axes.grid({
      yTicks: [0, model.A0 * 0.25, model.A0 * 0.5, model.A0 * 0.75, model.A0],
      yFormat: (v) => v.toFixed(2),
      xLabel: 't (s)',
      yLabel: '[A] (mol L⁻¹)',
    });

    // ── Half-life reference: [A]₀/2 horizontal ──
    const halfA = model.A0 / 2;
    const t_half = model.halfLife();
    const halfPx = axes.toPixel(0, halfA);
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth   = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axes.left, halfPx.y);
    c.lineTo(axes.right, halfPx.y);
    c.stroke();

    // ── Vertical at t½ (only if within axis range) ──
    if (t_half <= tMax) {
      const tPx = axes.toPixel(t_half, 0);
      c.beginPath();
      c.moveTo(tPx.x, axes.top);
      c.lineTo(tPx.x, axes.bottom);
      c.stroke();
    }
    c.setLineDash([]);
    c.restore();

    // ── Concentration curve ──
    const pts = model.curve(tMax, 400)
      .map(({ t, A }) => axes.toPixel(t, A));
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2.5 });

    // ── Half-life dot ──
    if (t_half <= tMax) {
      const dot = axes.toPixel(t_half, halfA);
      c.save();
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(dot.x, dot.y, 5, 0, 2 * Math.PI);
      c.fill();
      c.restore();

      // Label
      c.save();
      c.fillStyle = theme.color('--signal');
      c.font      = `11px monospace`;
      c.textAlign = 'center';
      c.fillText(`t½ = ${t_half.toFixed(1)} s`, dot.x, dot.y - 10);
      c.restore();
    }
  }
}
