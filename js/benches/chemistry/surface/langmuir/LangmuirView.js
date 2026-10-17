/**
 * LangmuirView — draws the adsorption isotherm.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class LangmuirView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model, cursorP) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 52, top: 16, right: w - 12, bottom: h - 32 },
      [model.pMin, model.pMax],
      [0, 1],
    );
    axes.grid({
      xTicks: [0, 1, 2, 3, 4, 5],
      yTicks: [0, 0.25, 0.5, 0.75, 1.0],
      xLabel: 'Pressure p',
      yLabel: 'Coverage theta',
    });

    // Isotherm curve
    const curve = model.isothermCurve(300);
    const pts = curve.map(({ p, theta }) => axes.toPixel(p, theta));
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2.5 });

    // Half-coverage dashed lines
    const pHalf = model.halfCoverageP();
    if (pHalf <= model.pMax) {
      const px = axes.toPixel(pHalf, 0.5);
      c.save();
      c.strokeStyle = theme.color('--muted');
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(axes.left, px.y);
      c.lineTo(axes.right, px.y);
      c.stroke();
      c.beginPath();
      c.moveTo(px.x, axes.top);
      c.lineTo(px.x, axes.bottom);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // Cursor
    if (cursorP !== undefined && cursorP >= model.pMin) {
      const theta = model.coverage(cursorP);
      const px = axes.toPixel(cursorP, theta);
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(px.x, px.y, 4, 0, 2 * Math.PI);
      c.fill();
    }
  }
}
