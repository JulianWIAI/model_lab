/**
 * InformationTheoryView — binary entropy curve H₂(p) and KL divergence.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class InformationTheoryView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.5);
    this._drawBinaryEntropy(c, model, w, h, splitX);
    this._drawBarChart(c, model, w, h, splitX);
  }

  _drawBinaryEntropy(c, model, w, h, splitX) {
    const pad = { left: 52, top: 16, right: splitX - 8, bottom: h - 36 };
    const ax = new Axes(c, pad, [0, 1], [0, 1.1]);
    ax.grid({
      xLabel: 'p',
      yLabel: 'H₂(p) bits',
      xTicks: [0, 0.25, 0.5, 0.75, 1],
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    const pts = [];
    for (let i = 1; i < 300; i++) {
      const p = i / 300;
      pts.push([p, model.binaryEntropy(p)]);
    }
    ax.polyline(pts, { color: theme.color('--accent'), width: 2.5 });

    // Mark H₂(0.5)=1 and H₂(p)=0.5 ≈ p=0.11
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(ax.x(0), ax.y(0.5));
    c.lineTo(ax.x(1), ax.y(0.5));
    c.stroke();
    c.restore();

    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--text');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('Binary entropy H₂(p)', pad.left + 4, pad.top + 4);
    c.fillStyle = theme.color('--muted');
    c.fillText('H₂(0.5)=1 bit  (maximum)', pad.left + 4, pad.top + 18);
    c.restore();
  }

  _drawBarChart(c, model, w, h, splitX) {
    const pad = { left: splitX + 36, top: 16, right: w - 8, bottom: h - 36 };
    const probs = model.probs;
    const n = probs.length;
    if (n === 0) return;

    const ax = new Axes(c, pad, [0, n + 1], [0, Math.max(...probs) * 1.3 + 0.05]);
    ax.grid({
      xLabel: 'outcome',
      yLabel: 'p',
      xTicks: Array.from({ length: n }, (_, i) => i + 1),
      yTicks: _niceTicks(0, Math.max(...probs) * 1.3 + 0.05, 3),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(2),
    });

    c.save();
    c.fillStyle = theme.color('--accent');
    for (let i = 0; i < n; i++) {
      const px = ax.x(i + 1);
      const py = ax.y(probs[i]);
      const py0 = ax.y(0);
      c.fillRect(px - 12, py, 24, py0 - py);
    }
    c.restore();

    const H = model.entropy();
    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--text');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(`H = ${H.toFixed(4)} bits`, pad.left - 28, pad.top + 4);
    c.fillText(`Hmax = log₂(${n}) = ${model.hMax(n).toFixed(4)}`, pad.left - 28, pad.top + 18);
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
