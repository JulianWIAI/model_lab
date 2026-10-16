/**
 * EigenvectorsView — unit circle mapped to ellipse by A.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';
import { matVec } from '../../../../core/LinAlg.js';

export class EigenvectorsView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const A = model.matrix;
    let eig;
    try {
      eig = model.solve();
    } catch (_) {
      c.save();
      c.fillStyle = theme.color('--text');
      c.font = theme.font(14, 'sans');
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('Matrix not symmetric', w/2, h/2);
      c.restore();
      return;
    }

    const { values, vectors } = eig;
    const maxLam = Math.max(...values.map(Math.abs));
    const scale = maxLam < 1e-10 ? 1 : maxLam;

    const splitX = Math.floor(w * 0.5);
    const padL = { left: 52, top: 16, right: splitX - 8, bottom: h - 36 };
    const padR = { left: splitX + 8, top: 16, right: w - 16, bottom: h - 36 };

    // LEFT: unit circle → ellipse
    this._drawEllipse(c, A, values, vectors, padL, scale);
    // RIGHT: eigenvalue spectrum
    this._drawSpectrum(c, values, vectors, padR);
  }

  _drawEllipse(c, A, values, vectors, pad, scale) {
    const ax = new Axes(c, pad, [-scale * 1.3, scale * 1.3], [-scale * 1.3, scale * 1.3]);
    ax.grid({
      xLabel: 'x', yLabel: 'y',
      xTicks: _niceTicks(-scale * 1.3, scale * 1.3, 4),
      yTicks: _niceTicks(-scale * 1.3, scale * 1.3, 4),
      xFormat: v => v.toFixed(1),
      yFormat: v => v.toFixed(1),
    });

    // Draw unit circle
    const nPts = 200;
    const circlePts = [];
    for (let i = 0; i <= nPts; i++) {
      const theta = (2 * Math.PI * i) / nPts;
      circlePts.push([Math.cos(theta), Math.sin(theta)]);
    }
    ax.polyline(circlePts, { color: theme.color('--muted'), width: 1 });

    // Draw A * (unit circle) = ellipse
    const ellipsePts = circlePts.map(([x, y]) => {
      const [ax_, ay_] = matVec(A, [x, y]);
      return [ax_, ay_];
    });
    ax.polyline(ellipsePts, { color: theme.color('--accent'), width: 2 });

    // Draw eigenvectors scaled by eigenvalues
    for (let k = 0; k < values.length; k++) {
      const lam = values[k];
      const v = vectors[k];
      const ex = v[0] * lam;
      const ey = v[1] * lam;
      c.save();
      c.strokeStyle = k === 0 ? theme.color('--signal') : theme.color('--on-surface');
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(ax.x(0), ax.y(0));
      c.lineTo(ax.x(ex), ax.y(ey));
      c.stroke();
      c.restore();
    }

    // Label
    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--muted');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('circle → ellipse', pad.left + 4, pad.top + 4);
    c.fillStyle = theme.color('--accent');
    c.fillText(`semi-axes: |λ₁|=${Math.abs(values[0]).toFixed(2)}, |λ₂|=${Math.abs(values[1] ?? 0).toFixed(2)}`, pad.left + 4, pad.top + 18);
    c.restore();
  }

  _drawSpectrum(c, values, vectors, pad) {
    const maxAbs = Math.max(...values.map(Math.abs), 1);
    const ax = new Axes(c, pad, [0, values.length + 1], [-maxAbs * 1.3, maxAbs * 1.3]);
    ax.grid({
      xLabel: 'index', yLabel: 'λ',
      xTicks: values.map((_, i) => i + 1),
      yTicks: _niceTicks(-maxAbs * 1.3, maxAbs * 1.3, 4),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(2),
    });

    // Zero line
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(pad.left, ax.y(0));
    c.lineTo(pad.right, ax.y(0));
    c.stroke();
    c.restore();

    // Eigenvalue bars
    for (let k = 0; k < values.length; k++) {
      const px = ax.x(k + 1);
      const py = ax.y(values[k]);
      const py0 = ax.y(0);
      c.save();
      c.fillStyle = theme.color('--accent');
      c.fillRect(px - 12, Math.min(py, py0), 24, Math.abs(py - py0));
      c.fillStyle = theme.color('--text');
      c.font = theme.font(11, 'mono');
      c.textAlign = 'center';
      c.textBaseline = values[k] >= 0 ? 'bottom' : 'top';
      c.fillText(values[k].toFixed(4), px, py - (values[k] >= 0 ? 2 : -2));
      c.restore();
    }

    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--muted');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    const trace = values.reduce((a, b) => a + b, 0);
    const det   = values.reduce((a, b) => a * b, 1);
    c.fillText(`trace=Σλ=${trace.toFixed(4)}  det=Πλ=${det.toFixed(4)}`, pad.left + 4, pad.top + 4);
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
