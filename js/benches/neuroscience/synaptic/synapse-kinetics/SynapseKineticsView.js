/**
 * SynapseKineticsView — plot h(t) vs t.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class SynapseKineticsView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const tMax = 6 * model.tau;
    const curve = model.curve({ tMax, nPoints: 400 });
    const peakH = model.hPeak;

    const ax = new Axes(
      c,
      { left: 56, top: 16, right: w - 24, bottom: h - 40 },
      [0, tMax],
      [0, peakH * 1.2],
    );

    ax.grid({
      xLabel: 't (ms)',
      yLabel: 'h(t)',
      xTicks: _niceTicks(0, tMax, 6),
      yTicks: _niceTicks(0, peakH * 1.2, 4),
      xFormat: v => v.toFixed(1),
      yFormat: v => v.toFixed(3),
    });

    // Alpha function curve
    ax.polyline(curve.map(p => [p.t, p.h]), { color: theme.color('--accent'), width: 2.5 });

    // Mark peak
    const tPk = model.tPeak;
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1;
    c.setLineDash([4, 3]);
    c.beginPath();
    c.moveTo(ax.x(tPk), ax.box.top);
    c.lineTo(ax.x(tPk), ax.box.bottom);
    c.stroke();
    c.setLineDash([]);

    // Mark half-decay time
    const tHalf = model.timeToEFraction();
    if (tHalf < tMax) {
      c.strokeStyle = theme.color('--muted');
      c.setLineDash([2, 4]);
      c.beginPath();
      c.moveTo(ax.x(tHalf), ax.box.top);
      c.lineTo(ax.x(tHalf), ax.box.bottom);
      c.stroke();
    }
    c.restore();

    // Annotations
    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--text');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(`τ=${model.tau.toFixed(1)}ms  peak=Ae⁻¹  t½=${model.timeToEFraction().toFixed(1)}ms`, ax.box.left + 4, ax.box.top + 4);
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
