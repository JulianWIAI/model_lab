/**
 * MaxwellBoltzmannView — f(v) speed distribution with v_p, v_mean, v_rms markers.
 * Optionally overlays a second curve for comparison.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class MaxwellBoltzmannView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    /** @type {import('./MaxwellBoltzmannModel.js').MaxwellBoltzmannModel|null} */
    this.compareModel = null;
  }

  /**
   * @param {import('./MaxwellBoltzmannModel.js').MaxwellBoltzmannModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    // Use 4 × v_rms of the slower model as x-axis limit
    const slowModel = this.compareModel
      ? (this.compareModel.vp < model.vp ? this.compareModel : model)
      : model;
    const vMax  = 4 * slowModel.vrms;
    const fMax  = model.f(model.vp) * 1.15;
    const fMaxC = this.compareModel ? this.compareModel.f(this.compareModel.vp) * 1.15 : 0;

    const axes = new Axes(
      c,
      { left: 56, top: 16, right: w - 16, bottom: h - 36 },
      [0, vMax],
      [0, Math.max(fMax, fMaxC)],
    );
    axes.grid({
      xLabel: 'v (m/s)',
      yLabel: 'f(v) (s/m)',
    });

    // ── Comparison curve (behind main) ──
    if (this.compareModel) {
      const ptsC = this.compareModel.curve(vMax, 400)
        .map(({ v, f }) => axes.toPixel(v, f));
      axes.polyline(ptsC, { color: theme.color('--third'), lineWidth: 2 });
    }

    // ── Main curve ──
    const pts = model.curve(vMax, 400).map(({ v, f }) => axes.toPixel(v, f));
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2.5 });

    // ── v_p, v_mean, v_rms markers ──
    const markers = [
      { v: model.vp,    label: 'v_p',    color: theme.color('--accent') },
      { v: model.vmean, label: 'v̄',      color: theme.color('--signal') },
      { v: model.vrms,  label: 'v_rms',  color: theme.color('--muted') },
    ];

    c.save();
    c.lineWidth   = 1;
    c.setLineDash([3, 3]);
    for (const { v, label, color } of markers) {
      if (v > vMax) continue;
      const { x, y } = axes.toPixel(v, model.f(v));
      c.strokeStyle = color;
      c.beginPath();
      c.moveTo(x, axes.bottom);
      c.lineTo(x, y);
      c.stroke();
      // Dot
      c.setLineDash([]);
      c.fillStyle = color;
      c.beginPath();
      c.arc(x, y, 4, 0, 2 * Math.PI);
      c.fill();
      c.setLineDash([3, 3]);
      // Label
      c.fillStyle = color;
      c.font = `10px monospace`;
      c.textAlign = 'center';
      c.fillText(label, x, y - 8);
    }
    c.setLineDash([]);
    c.restore();
  }
}
