/**
 * PopulationCodingView — draws tuning curves and Fisher information.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class PopulationCodingView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model, stimulus) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 52, top: 16, right: w - 12, bottom: h - 32 },
      [-Math.PI, Math.PI],
      [0, model.rMax * 1.1],
    );
    axes.grid({
      xTicks: [-3, -2, -1, 0, 1, 2, 3],
      yTicks: [0, 10, 20, 30, 40, 50],
      xLabel: 'theta (rad)',
      yLabel: 'firing rate',
    });

    // Draw tuning curves for each neuron
    const nPlot = 200;
    for (let ni = 0; ni < model.N; ni++) {
      const pts = [];
      for (let k = 0; k < nPlot; k++) {
        const th = -Math.PI + (2 * Math.PI / (nPlot - 1)) * k;
        pts.push(axes.toPixel(th, model.tuning(ni, th)));
      }
      const hue = (ni / model.N) * 360;
      axes.polyline(pts, { color: `hsl(${hue}, 60%, 50%)`, lineWidth: 1.2 });
    }

    // Draw stimulus line
    if (stimulus !== undefined) {
      const px = axes.toPixel(stimulus, 0);
      c.save();
      c.strokeStyle = theme.color('--signal');
      c.lineWidth = 2;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(px.x, axes.top);
      c.lineTo(px.x, axes.bottom);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }
  }
}
