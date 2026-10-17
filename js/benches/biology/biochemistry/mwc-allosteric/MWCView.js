/**
 * MWCView — draws the MWC saturation curve and R-state fraction.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class MWCView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model, cursorAlpha) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 52, top: 16, right: w - 12, bottom: h - 32 },
      [0, model.alphaMax],
      [0, 1],
    );
    axes.grid({
      xTicks: [0, 5, 10, 15, 20],
      yTicks: [0, 0.25, 0.5, 0.75, 1.0],
      xLabel: 'alpha (normalised [S])',
      yLabel: 'Y (saturation)',
    });

    // Saturation curve
    const curve = model.curve();
    const pts = curve.map(({ alpha, Y }) => axes.toPixel(alpha, Y));
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2.5 });

    // R-state fraction
    const rPts = curve.map(({ alpha, Rbar }) => axes.toPixel(alpha, Rbar));
    axes.polyline(rPts, { color: theme.color('--third'), lineWidth: 1.5 });

    // Cursor
    if (cursorAlpha !== undefined && cursorAlpha >= 0) {
      const Y = model.saturation(cursorAlpha);
      const px = axes.toPixel(cursorAlpha, Y);
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(px.x, px.y, 4, 0, 2 * Math.PI);
      c.fill();
    }

    // Annotations
    c.fillStyle = theme.color('--text');
    c.font = '12px sans-serif';
    c.textAlign = 'left';
    c.fillText(`n=${model.n}, L=${model.L}, c=${model.c}`, 60, 34);
  }
}
