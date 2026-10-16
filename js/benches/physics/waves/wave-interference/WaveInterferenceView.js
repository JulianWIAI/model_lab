/**
 * WaveInterferenceView — two-panel canvas.
 *
 * Left: intensity I(y) vs screen position y.
 * Right: schematic wavefront diagram.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class WaveInterferenceView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./WaveInterferenceModel.js').WaveInterferenceModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.60);

    this._drawIntensity(c, model, w, h, splitX);
    this._drawSchematic(c, model, w, h, splitX);
  }

  _drawIntensity(c, model, w, h, splitX) {
    const pad = { left: 52, top: 16, right: splitX - 8, bottom: h - 36 };

    const nFringes = 5;
    const yRange = nFringes * model.deltaY;
    const curve = model.curve({ yMin: -yRange, yMax: yRange, nPoints: 600 });

    const ax = new Axes(
      c,
      { left: pad.left, top: pad.top, right: pad.right, bottom: pad.bottom },
      [-yRange * 1000, yRange * 1000],  // display in mm
      [0, model.I0 * 1.1],
    );

    ax.grid({
      xLabel: 'y (mm)',
      yLabel: 'I/I₀',
      xTicks: _niceTicks(-yRange * 1000, yRange * 1000, 6),
      yTicks: [0, 0.25, 0.5, 0.75, 1.0],
      xFormat: v => v.toFixed(1),
      yFormat: v => v.toFixed(2),
    });

    // Intensity curve
    const pts = curve.map(p => [p.y * 1000, p.I / model.I0]);
    ax.polyline(pts, { color: theme.color('--accent'), width: 2 });

    // Mark first dark fringe
    const yd = model.yDark(0) * 1000;
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1;
    c.setLineDash([4, 3]);
    c.beginPath();
    c.moveTo(ax.x(yd), ax.box.top);
    c.lineTo(ax.x(yd), ax.box.bottom);
    c.stroke();
    c.moveTo(ax.x(-yd), ax.box.top);
    c.lineTo(ax.x(-yd), ax.box.bottom);
    c.stroke();
    c.restore();

    // Label
    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--text');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(`Δy = ${(model.deltaY * 1e3).toFixed(2)} mm`, pad.left + 4, pad.top + 4);
    c.restore();
  }

  _drawSchematic(c, model, w, h, splitX) {
    const x0 = splitX + 16;
    const cx = x0 + (w - x0) / 2;
    const cy = h / 2;
    const H  = h * 0.7;

    // Draw two slits (sources)
    const sep = H * 0.08;
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 2;
    // Screen barrier
    c.beginPath();
    c.moveTo(cx - 60, cy - H/2);
    c.lineTo(cx - 60, cy - sep - 3);
    c.stroke();
    c.beginPath();
    c.moveTo(cx - 60, cy - sep + 3);
    c.lineTo(cx - 60, cy + sep - 3);
    c.stroke();
    c.beginPath();
    c.moveTo(cx - 60, cy + sep + 3);
    c.lineTo(cx - 60, cy + H/2);
    c.stroke();
    c.restore();

    // Wavefronts from two slits
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.globalAlpha = 0.4;
    c.lineWidth = 1;
    for (let r = 15; r < 90; r += 18) {
      for (const ys of [-sep, sep]) {
        c.beginPath();
        c.arc(cx - 60, cy + ys, r, -Math.PI * 0.6, Math.PI * 0.6);
        c.stroke();
      }
    }
    c.restore();

    // Detection screen
    c.save();
    c.strokeStyle = theme.color('--text');
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx + 60, cy - H/2);
    c.lineTo(cx + 60, cy + H/2);
    c.stroke();

    // Intensity stripes on screen
    const nPts = 80;
    for (let i = 0; i <= nPts; i++) {
      const frac = i / nPts;
      const y_data = (frac - 0.5) * H;
      const y_m = y_data / 1000 * (model.deltaY / (H / 2));  // rough scale
      const I_norm = model.intensity(y_m * model.deltaY * 3) / model.I0;
      c.fillStyle = theme.color(I_norm > 0.5 ? '--on-surface' : '--surface');
      c.globalAlpha = Math.max(0, Math.min(1, I_norm));
      c.fillRect(cx + 58, cy - H/2 + frac * H, 8, H / nPts + 1);
    }
    c.restore();

    // Labels
    c.save();
    c.font = theme.font(10, 'sans');
    c.fillStyle = theme.color('--muted');
    c.textAlign = 'center';
    c.fillText('slits', cx - 60, cy + H/2 + 14);
    c.fillText('screen', cx + 60, cy + H/2 + 14);
    c.restore();
  }
}

function _niceTicks(lo, hi, n) {
  const span = hi - lo;
  if (span <= 0) return [lo, hi];
  const step = span / n;
  const mag  = Math.pow(10, Math.floor(Math.log10(step)));
  const nice = [1, 2, 2.5, 5, 10].find(f => f * mag >= step) * mag;
  const ticks = [];
  for (let v = Math.ceil(lo / nice) * nice; v <= hi + nice * 0.01; v += nice) {
    ticks.push(+v.toPrecision(10));
  }
  return ticks;
}
