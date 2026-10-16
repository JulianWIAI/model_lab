/**
 * RandomWalkView — two-panel display.
 *
 * Left (60%): 1D walk trajectory (position vs step).
 * Right (40%): 2D walk path on a grid.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class RandomWalkView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {{ walk1D: number[], walk2D: Array<{x:number,y:number}> }} data
   * @param {number} n
   */
  draw({ walk1D, walk2D }, n) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const split = Math.floor(w * 0.6);

    // Left panel: 1D trajectory
    this._draw1D(c, walk1D, n, 0, w, h, split);
    // Right panel: 2D walk
    this._draw2D(c, walk2D, split, w, h);
  }

  _draw1D(c, pos, n, _xOff, w, h, split) {
    const padL = 50, padT = 20, padR = 10, padB = 40;

    const maxAbs = Math.max(...pos.map(Math.abs), 1);
    const axes = new Axes(
      c,
      { left: padL, top: padT, right: split - padR, bottom: h - padB },
      [0, n],
      [-maxAbs * 1.1, maxAbs * 1.1],
    );

    axes.grid({
      xLabel: 'step',
      yLabel: 'X',
      xTicks: [0, Math.round(n / 4), Math.round(n / 2), Math.round(3 * n / 4), n],
      yTicks: [-maxAbs, 0, maxAbs].map(Math.round),
    });

    // Zero line
    c.save();
    c.strokeStyle = theme.color('--grid');
    c.lineWidth = 1;
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(axes.x(0), axes.y(0));
    c.lineTo(axes.x(n), axes.y(0));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Walk
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 1.5;
    c.beginPath();
    pos.forEach((y, i) => {
      if (i === 0) c.moveTo(axes.x(i), axes.y(y));
      else c.lineTo(axes.x(i), axes.y(y));
    });
    c.stroke();
    c.restore();
  }

  _draw2D(c, pts, xOff, w, h) {
    if (!pts || pts.length < 2) return;

    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const padL = 20, padT = 20, padR = 20, padB = 40;

    const rng  = Math.max(xMax - xMin, yMax - yMin, 1) * 0.6;
    const cx   = (xMin + xMax) / 2;
    const cy   = (yMin + yMax) / 2;

    const axes = new Axes(
      c,
      { left: xOff + padL, top: padT, right: w - padR, bottom: h - padB },
      [cx - rng, cx + rng],
      [cy - rng, cy + rng],
    );

    axes.grid({
      xLabel: 'x', yLabel: 'y',
      xTicks: [Math.round(cx - rng), Math.round(cx), Math.round(cx + rng)],
      yTicks: [Math.round(cy - rng), Math.round(cy), Math.round(cy + rng)],
    });

    c.save();
    c.strokeStyle = theme.color('--accent') + 'a0';
    c.lineWidth = 1;
    c.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) c.moveTo(axes.x(p.x), axes.y(p.y));
      else c.lineTo(axes.x(p.x), axes.y(p.y));
    });
    c.stroke();
    c.restore();

    // Start (origin)
    c.save();
    c.fillStyle = theme.color('--good');
    c.beginPath();
    c.arc(axes.x(0), axes.y(0), 4, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // End
    const last = pts[pts.length - 1];
    c.save();
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(axes.x(last.x), axes.y(last.y), 4, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
