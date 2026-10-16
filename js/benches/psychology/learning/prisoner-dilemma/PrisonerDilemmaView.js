/**
 * PrisonerDilemmaView — PV of cooperation vs defection.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class PrisonerDilemmaView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad = { left: 56, top: 20, right: w - 16, bottom: h - 40 };

    // Plot PV_coop(δ) and PV_defect(δ) from δ=0 to 0.99
    const N = 300;
    const deltaMin = 0;
    const deltaMax = 0.99;
    const pvCoopPts = [];
    const pvDefPts  = [];

    for (let i = 0; i < N; i++) {
      const d = deltaMin + (deltaMax - deltaMin) * i / (N - 1);
      pvCoopPts.push([d, model.pvCooperate(d)]);
      pvDefPts.push([d, model.pvDefect(d)]);
    }

    const yMax = Math.min(model.pvCooperate(0.9) * 1.2, 100);
    const ax = new Axes(c, pad, [deltaMin, deltaMax], [0, yMax]);
    ax.grid({
      xLabel: 'δ (discount factor)',
      yLabel: 'PV',
      xTicks: [0, 0.2, 0.4, 0.6, 0.8, 0.99],
      yTicks: _niceTicks(0, yMax, 4),
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(1),
    });

    // Clip curves to visible range
    const coopClipped = pvCoopPts.filter(([, y]) => y <= yMax * 1.01);
    const defClipped  = pvDefPts.filter(([, y]) => y <= yMax * 1.01);

    ax.polyline(coopClipped, { color: theme.color('--accent'), width: 2.5 });
    ax.polyline(defClipped,  { color: theme.color('--signal'), width: 2.5 });

    // Mark δ* (crossover)
    const dstar = model.deltastar();
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([4, 3]);
    c.beginPath();
    c.moveTo(ax.x(dstar), ax.box.top);
    c.lineTo(ax.x(dstar), ax.box.bottom);
    c.stroke();
    c.restore();

    // Mark current δ
    const d = model.delta;
    c.save();
    c.strokeStyle = theme.color('--on-surface');
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(ax.x(d), ax.box.top);
    c.lineTo(ax.x(d), ax.box.bottom);
    c.stroke();
    c.restore();

    // Labels
    c.save();
    c.font = theme.font(11, 'sans');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = theme.color('--accent');
    c.fillText('PV cooperate = R/(1-δ)', pad.left + 4, pad.top + 4);
    c.fillStyle = theme.color('--signal');
    c.fillText('PV defect = T + δP/(1-δ)', pad.left + 4, pad.top + 18);
    c.fillStyle = theme.color('--muted');
    c.fillText(`δ*=${dstar.toFixed(3)}`, ax.x(dstar) + 3, pad.top + 4);
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
