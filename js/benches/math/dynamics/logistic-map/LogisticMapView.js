/**
 * LogisticMapView — two-panel canvas: bifurcation diagram (left) + cobweb (right).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class LogisticMapView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./LogisticMapModel.js').LogisticMapModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.60);
    const pad = { left: 48, top: 20, bottom: h - 36 };

    // ── LEFT: bifurcation diagram ─────────────────────────────────────────────
    const pts = model.bifurcationData(2.5, 4, 400, 500, 150);
    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [2.5, 4], [0, 1],
    );
    axesL.grid({ xLabel: 'r', yLabel: 'x' });

    // Draw bifurcation points as dots
    c.fillStyle = theme.color('--accent');
    for (const p of pts) {
      const px = axesL.x(p.r), py = axesL.y(p.x);
      c.fillRect(px - 0.5, py - 0.5, 1, 1);
    }

    // Mark current r
    const rx = axesL.x(model.r);
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1.5;
    c.setLineDash([4, 3]);
    c.beginPath();
    c.moveTo(rx, pad.top);
    c.lineTo(rx, pad.bottom);
    c.stroke();
    c.setLineDash([]);

    // ── RIGHT: cobweb diagram ─────────────────────────────────────────────────
    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, 1], [0, 1],
    );
    axesR.grid({ xLabel: 'x_n', yLabel: 'x_{n+1}' });

    // y = x diagonal
    axesR.polyline([[0, 0], [1, 1]], { color: theme.color('--muted'), width: 1 });

    // Parabola f(x) = r·x·(1−x)
    const nPar = 200;
    const parPts = [];
    for (let i = 0; i <= nPar; i++) {
      const x = i / nPar;
      parPts.push([x, model.r * x * (1 - x)]);
    }
    axesR.polyline(parPts, { color: theme.color('--signal'), width: 2 });

    // Cobweb lines (30 iterations)
    const cobwebPts = [];
    let x = model.x0;
    cobwebPts.push([x, 0]);
    for (let i = 0; i < 30; i++) {
      const xn = model.step(x);
      if (xn < 0 || xn > 1) break;
      cobwebPts.push([x, xn]);  // vertical line to parabola
      cobwebPts.push([xn, xn]); // horizontal line to diagonal
      x = xn;
    }
    axesR.polyline(cobwebPts, { color: theme.color('--accent'), width: 1.5 });
  }
}
