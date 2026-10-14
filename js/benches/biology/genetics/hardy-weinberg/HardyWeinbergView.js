/**
 * HardyWeinbergView — de Finetti triangle + p vs generation plot.
 *
 * Left (55 %): de Finetti triangle with HW parabola, trajectory and current point.
 * Right (45 %): p vs generation line plot.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

export class HardyWeinbergView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./HardyWeinbergModel.js').HardyWeinbergModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: W, height: H } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    const splitX = Math.floor(W * 0.52);
    const margin = { top: 16, bottom: 36, left: 10, right: 8 };

    this._drawTriangle(c, model, margin.left, margin.top, splitX - margin.left - 4, H - margin.top - margin.bottom);
    this._drawTimeSeries(c, model, splitX + 4, margin.top, W - splitX - 4 - margin.right, H - margin.top - margin.bottom);
  }

  _drawTriangle(c, model, x0, y0, w, h) {
    // de Finetti triangle: vertices AA (top-left), Aa (top-right), aa (bottom-center)
    // Coordinates: let u = AA freq, v = Aa freq, then aa = 1 - u - v
    // Map: x = x0 + v/2*w + (1-u-v)*w/2  (horizontal); y = y0 + (1-v)*h (vertical: AA top)
    // Simpler: use triangle with AA at top-left, aa at top-right, Aa at bottom
    // Standard de Finetti: bottom axis = aa freq, left = AA, right = Aa
    // We use: x in [0,1] = aa freq; apex at top = p²+2pq+q² split
    // Projection: x_screen = x0 + f_Aa/2*w + f_aa*w/2 would work but let's simplify:
    // We use ternary coords: f_AA + f_Aa + f_aa = 1
    // Vertex AA at (0,0), vertex aa at (1,0), vertex Aa at (0.5, 1) in normalised coords

    const triPts = [ // [AA, Aa, aa] ternary → pixel
      [1, 0, 0], // AA vertex = left
      [0, 0, 1], // aa vertex = right
      [0, 1, 0], // Aa vertex = top
    ];

    const toPixel = ([fAA, fAa, faa]) => ({
      px: x0 + (faa + fAa / 2) * w,
      py: y0 + (1 - fAa) * h,
    });

    // Draw triangle outline
    c.beginPath();
    const vAA = toPixel(triPts[0]);
    const vaa = toPixel(triPts[1]);
    const vAa = toPixel(triPts[2]);
    c.moveTo(vAA.px, vAA.py);
    c.lineTo(vaa.px, vaa.py);
    c.lineTo(vAa.px, vAa.py);
    c.closePath();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.stroke();

    // Labels
    c.fillStyle = theme.color('--muted');
    c.font = `10px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.fillText('AA', vAA.px - 10, vAA.py + 4);
    c.fillText('aa', vaa.px + 10, vaa.py + 4);
    c.fillText('Aa', vAa.px, vAa.py - 8);

    // HW parabola: Aa = 2p(1-p), AA = p², aa = (1-p)²
    c.beginPath();
    let first = true;
    for (let pi = 0; pi <= 100; pi++) {
      const p = pi / 100;
      const q = 1 - p;
      const pt = toPixel([p * p, 2 * p * q, q * q]);
      if (first) { c.moveTo(pt.px, pt.py); first = false; }
      else c.lineTo(pt.px, pt.py);
    }
    c.strokeStyle = theme.color('--grid');
    c.lineWidth = 1;
    c.setLineDash([4, 3]);
    c.stroke();
    c.setLineDash([]);

    // Trajectory
    const maxTraj = Math.min(model.generation, model.history.length - 1);
    if (maxTraj > 1) {
      c.beginPath();
      for (let g = 0; g <= maxTraj; g++) {
        const p = model.history[g];
        const q = 1 - p;
        const pt = toPixel([p * p, 2 * p * q, q * q]);
        if (g === 0) c.moveTo(pt.px, pt.py);
        else c.lineTo(pt.px, pt.py);
      }
      c.strokeStyle = theme.color('--accent');
      c.lineWidth = 1.5;
      c.globalAlpha = 0.5;
      c.stroke();
      c.globalAlpha = 1;
    }

    // Current point
    const p = model.p, q = 1 - p;
    const cur = toPixel([p * p, 2 * p * q, q * q]);
    c.beginPath();
    c.arc(cur.px, cur.py, 5, 0, 2 * Math.PI);
    c.fillStyle = theme.color('--accent');
    c.fill();
  }

  _drawTimeSeries(c, model, x0, y0, w, h) {
    const genMax = Math.min(model.generation, model.history.length - 1);
    const xRange = [0, Math.max(genMax, 10)];
    const box = { left: x0 + 36, right: x0 + w, top: y0, bottom: y0 + h };
    const axes = new Axes(c, box, xRange, [0, 1]);

    axes.grid({
      xTicks: [0, Math.round(xRange[1] * 0.25), Math.round(xRange[1] * 0.5),
               Math.round(xRange[1] * 0.75), xRange[1]],
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      yFormat: (v) => v.toFixed(2),
      xLabel: 'Generation',
      yLabel: 'p (freq A)',
    });

    // p history line
    if (genMax > 0) {
      const pts = [];
      for (let g = 0; g <= genMax; g++) pts.push([g, model.history[g]]);
      axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2 });
    } else {
      // Just a dot at generation 0
      const px = axes.x(0), py = axes.y(model.p0);
      c.beginPath();
      c.arc(px, py, 3, 0, 2 * Math.PI);
      c.fillStyle = theme.color('--accent');
      c.fill();
    }

    // Generation label
    c.fillStyle = theme.color('--muted');
    c.font = `9px system-ui, sans-serif`;
    c.textAlign = 'right';
    c.textBaseline = 'top';
    c.fillText(`Gen ${model.generation}`, x0 + w, y0 + 1);
  }
}
