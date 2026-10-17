/**
 * InequalityView — draws Lorenz curve and equality line.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class InequalityView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 52, top: 16, right: w - 12, bottom: h - 32 },
      [0, 1],
      [0, 1],
    );
    axes.grid({
      xTicks: [0, 0.25, 0.5, 0.75, 1.0],
      yTicks: [0, 0.25, 0.5, 0.75, 1.0],
      xLabel: 'Cumulative population share',
      yLabel: 'Cumulative income share',
    });

    // Equality line
    const eqPts = [axes.toPixel(0, 0), axes.toPixel(1, 1)];
    axes.polyline(eqPts, { color: theme.color('--muted'), lineWidth: 1.5 });

    // Lorenz curve
    const curve = model.lorenzCurve(200);
    const pts = curve.map(({ p, L }) => axes.toPixel(p, L));
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2.5 });

    // Gini coefficient annotation
    c.fillStyle = theme.color('--text');
    c.font = '12px sans-serif';
    c.textAlign = 'left';
    c.fillText(`Gini = ${model.gini().toFixed(4)}`, 60, 34);
    c.fillText(`Dist: ${model.dist}`, 60, 50);
  }
}
