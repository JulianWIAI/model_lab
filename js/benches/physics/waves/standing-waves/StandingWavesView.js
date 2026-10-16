/**
 * StandingWavesView — animated standing wave.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class StandingWavesView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model, t) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axBox = { left: 52, top: 24, right: w - 24, bottom: h - 60 };
    const ax = new Axes(c, axBox, [0, model.L], [-1.2, 1.2]);

    ax.grid({
      xLabel: 'x (m)',
      yLabel: 'y',
      xTicks: _niceTicks(0, model.L, 5),
      yTicks: [-1, -0.5, 0, 0.5, 1],
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(1),
    });

    // Draw multiple snapshots (ghost traces)
    const nGhost = 4;
    for (let g = nGhost; g >= 1; g--) {
      const tg = t - g * 0.04;
      const snap = model.snapshot(tg);
      c.save();
      c.globalAlpha = 0.15;
      ax.polyline(snap.map(p => [p.x, p.y]), { color: theme.color('--accent'), width: 1 });
      c.restore();
    }

    // Current snapshot
    const snap = model.snapshot(t);
    ax.polyline(snap.map(p => [p.x, p.y]), { color: theme.color('--accent'), width: 2.5 });

    // Mark nodes
    const nodes = model.nodePositions();
    c.save();
    c.fillStyle = theme.color('--signal');
    for (const xn of nodes) {
      const px = ax.x(xn);
      const py = ax.y(0);
      c.beginPath();
      c.arc(px, py, 4, 0, 2 * Math.PI);
      c.fill();
    }
    c.restore();

    // Frequency label
    const f = model.frequency();
    c.save();
    c.font = theme.font(12, 'sans');
    c.fillStyle = theme.color('--text');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    const modeStr = model.mode === 'closed' ? 'closed pipe' : model.mode === 'open' ? 'open pipe' : 'string';
    c.fillText(`n=${model.n}  f=${f.toFixed(1)} Hz  mode: ${modeStr}`, axBox.left + 4, axBox.top + 4);
    c.restore();

    // Harmonics table at bottom
    const freqs = model.frequencies(5);
    c.save();
    c.font = theme.font(11, 'mono');
    c.fillStyle = theme.color('--muted');
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const y0 = axBox.bottom + 16;
    let xoff = axBox.left;
    for (const { n: ni, f: fi } of freqs) {
      const lbl = `n${ni}=${fi.toFixed(1)}Hz `;
      c.fillStyle = ni === model.n ? theme.color('--accent') : theme.color('--muted');
      c.fillText(lbl, xoff, y0);
      xoff += c.measureText(lbl).width;
    }
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
