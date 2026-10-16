/**
 * BayesView — prior and posterior Beta distributions.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class BayesView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const priorCurve = model.priorCurve(200);
    const postCurve  = model.posteriorCurve(200);
    const yMax = Math.max(
      Math.max(...priorCurve.map(p => p.pdf)),
      Math.max(...postCurve.map(p => p.pdf)),
      0.1
    ) * 1.15;

    const pad = { left: 56, top: 16, right: w - 16, bottom: h - 40 };
    const ax = new Axes(c, pad, [0, 1], [0, yMax]);
    ax.grid({
      xLabel: 'θ',
      yLabel: 'p(θ)',
      xTicks: [0, 0.25, 0.5, 0.75, 1],
      yTicks: _niceTicks(0, yMax, 4),
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    // Prior
    ax.polyline(priorCurve.map(p => [p.x, p.pdf]), { color: theme.color('--muted'), width: 1.5 });

    // Posterior
    ax.polyline(postCurve.map(p => [p.x, p.pdf]), { color: theme.color('--accent'), width: 2.5 });

    // Posterior mean
    const mean = model.posteriorMean();
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1.5;
    c.setLineDash([4, 3]);
    c.beginPath();
    c.moveTo(ax.x(mean), ax.box.top);
    c.lineTo(ax.x(mean), ax.box.bottom);
    c.stroke();
    c.restore();

    // Credible interval
    const [lo, hi] = model.credibleInterval(0.95);
    c.save();
    c.fillStyle = theme.color('--accent');
    c.globalAlpha = 0.12;
    c.fillRect(ax.x(lo), ax.box.top, ax.x(hi) - ax.x(lo), ax.box.bottom - ax.box.top);
    c.restore();

    // Labels
    c.save();
    c.font = theme.font(11, 'sans');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = theme.color('--muted');
    c.fillText('Prior', pad.left + 4, pad.top + 4);
    c.fillStyle = theme.color('--accent');
    c.fillText('Posterior', pad.left + 4, pad.top + 18);
    c.fillStyle = theme.color('--signal');
    c.fillText(`E[θ]=${mean.toFixed(4)}`, pad.left + 4, pad.top + 32);
    c.fillStyle = theme.color('--text');
    c.fillText(`95% CI: [${lo.toFixed(3)}, ${hi.toFixed(3)}]`, pad.left + 4, pad.top + 46);
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
