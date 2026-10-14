/**
 * HillBindingView — fractional O₂ saturation curve (Hill equation).
 * Draws the sigmoid for HbA and optionally the hyperbola for myoglobin.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

const PO2_MAX = 150; // mmHg — axis upper limit

export class HillBindingView {
  constructor(canvasView) {
    this.canvasView = canvasView;
    this.showMb = false;
    /** @type {import('./HillBindingModel.js').HillBindingModel|null} */
    this.mbModel = null;
  }

  /**
   * @param {import('./HillBindingModel.js').HillBindingModel} model  main model (HbA or custom)
   * @param {number} cursorPO2  cursor partial pressure (mmHg)
   */
  draw(model, cursorPO2) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 52, top: 16, right: w - 12, bottom: h - 32 },
      [0, PO2_MAX],
      [0, 1],
    );
    axes.grid({
      xTicks: [0, 25, 50, 75, 100, 125, 150],
      yTicks: [0, 0.25, 0.5, 0.75, 1.0],
      xLabel: 'pO₂ (mmHg)',
      yLabel: 'θ (saturation)',
    });

    // Dashed half-saturation cross-hairs
    const thetaHalf = axes.toPixel(model.P50, 0.5);
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth   = 1;
    c.setLineDash([4, 4]);
    // Horizontal at θ = 0.5
    c.beginPath();
    c.moveTo(axes.left, thetaHalf.y);
    c.lineTo(axes.right, thetaHalf.y);
    c.stroke();
    // Vertical at P50
    c.beginPath();
    c.moveTo(thetaHalf.x, axes.top);
    c.lineTo(thetaHalf.x, axes.bottom);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Myoglobin curve (n=1 hyperbola) when requested
    if (this.showMb && this.mbModel) {
      const mbPts = this.mbModel.curve(PO2_MAX, 200)
        .map(({ pO2, theta }) => axes.toPixel(pO2, theta));
      axes.polyline(mbPts, { color: theme.color('--third'), lineWidth: 2 });
    }

    // Main sigmoid curve (HbA or custom)
    const pts = model.curve(PO2_MAX, 300)
      .map(({ pO2, theta }) => axes.toPixel(pO2, theta));
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2.5 });

    // Cursor dot + vertical line
    const thetaCursor = model.theta(cursorPO2);
    const px = axes.toPixel(cursorPO2, thetaCursor);
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth   = 1;
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(px.x, axes.bottom);
    c.lineTo(px.x, px.y);
    c.stroke();
    c.setLineDash([]);
    // Dot
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(px.x, px.y, 4, 0, 2 * Math.PI);
    c.fill();
    c.restore();
  }
}
