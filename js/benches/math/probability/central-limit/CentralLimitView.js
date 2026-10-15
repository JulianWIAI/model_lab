/**
 * CentralLimitView — two-panel canvas.
 *
 * Left (60%): histogram of N sample means; overlay theoretical N(μ, σ²/n) in red.
 *             For Cauchy: no theoretical curve; "CLT fails" label.
 * Right (40%): parent distribution shape (n=1 view).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class CentralLimitView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./CentralLimitModel.js').CentralLimitModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.60);
    const pad    = { top: 16, bottom: h - 36 };

    if (model.means.length === 0) {
      _label(c, w / 2, h / 2, 'Press ▶ to run simulation', theme.color('--muted'));
      return;
    }

    const hist = model.histogram(40);
    if (hist.length === 0) return;

    const theoCurve = model.theoreticalCurve(300);
    const yMax = _histYMax(hist, theoCurve);

    // ── LEFT: histogram of means ──────────────────────────────────────────────
    const xMin = hist[0].x - hist[0].width / 2;
    const xMax = hist[hist.length - 1].x + hist[hist.length - 1].width / 2;

    const axL = new Axes(
      c,
      { left: 56, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [xMin, xMax],
      [0, yMax * 1.1],
    );
    axL.grid({
      xLabel: 'Sample mean',
      yLabel: 'Density',
      xTicks: _niceTicks(xMin, xMax, 5),
      yTicks: _niceTicks(0, yMax * 1.1, 4),
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    // Histogram bars
    c.save();
    c.fillStyle   = theme.color('--accent');
    c.globalAlpha = 0.5;
    for (const bin of hist) {
      const x1 = axL.x(bin.x - bin.width / 2);
      const x2 = axL.x(bin.x + bin.width / 2);
      const y0 = axL.y(0);
      const y1 = axL.y(bin.density);
      c.fillRect(x1, y1, x2 - x1, y0 - y1);
    }
    c.restore();

    // Theoretical curve (CLT normal)
    if (theoCurve && theoCurve.length > 1) {
      axL.polyline(theoCurve.map(p => [p.x, p.pdf]),
        { color: theme.color('--signal'), width: 2.5 });
    } else if (model.dist === 'cauchy') {
      _label(c, (axL.box.left + axL.box.right) / 2, axL.y(yMax * 0.5),
        'CLT fails — Cauchy has no finite mean', theme.color('--signal'));
    }

    // Stats annotation
    const se = model.SE;
    const obs = model.observedMean;
    const annoY = pad.top + 18;
    c.save();
    c.font      = '11px sans-serif';
    c.fillStyle = theme.color('--text');
    c.textAlign = 'left';
    c.fillText(`n=${model.n}, N=${model.N}`, axL.box.left + 4, annoY);
    if (se !== null) {
      c.fillText(`SE=${se.toFixed(4)}  x̄=${obs.toFixed(4)}`, axL.box.left + 4, annoY + 14);
    }
    c.restore();

    // ── RIGHT: parent distribution shape ────────────────────────────────────
    this._drawParent(c, model, splitX + 16, pad, w - 8);
  }

  _drawParent(c, model, xLeft, pad, xRight) {
    // Show approximately what one draw looks like
    const info = model.distInfo;
    const nSamples = 500;

    // Generate parent samples for histogram
    const tmpModel = _cloneForParent(model);
    const samples  = [];
    for (let i = 0; i < nSamples; i++) samples.push(tmpModel.draw());

    const sorted = [...samples].sort((a, b) => a - b);
    // Trim extreme Cauchy outliers for display
    const lo = sorted[Math.floor(nSamples * 0.02)];
    const hi = sorted[Math.floor(nSamples * 0.98)];
    const w  = (hi - lo) / 20 || 0.1;
    const counts = new Array(20).fill(0);
    for (const v of samples) {
      const bi = Math.min(Math.floor((v - lo) / w), 19);
      if (bi >= 0) counts[bi]++;
    }
    const maxCount = Math.max(...counts);

    const axP = new Axes(
      c,
      { left: xLeft + 36, top: pad.top, right: xRight, bottom: pad.bottom },
      [lo, hi],
      [0, maxCount * 1.1],
    );
    axP.grid({
      xLabel: 'x (parent)',
      yLabel: 'Count',
      xTicks: _niceTicks(lo, hi, 4),
      yTicks: _niceTicks(0, maxCount * 1.1, 3),
      xFormat: v => v.toFixed(1),
      yFormat: v => v.toFixed(0),
    });

    c.save();
    c.fillStyle   = theme.color('--muted');
    c.globalAlpha = 0.6;
    for (let i = 0; i < 20; i++) {
      const x1 = axP.x(lo + i * w);
      const x2 = axP.x(lo + (i + 1) * w);
      const y0 = axP.y(0);
      const y1 = axP.y(counts[i]);
      c.fillRect(x1, y1, x2 - x1, y0 - y1);
    }
    c.restore();

    const title = info ? info.name : 'Parent';
    _label(c, (axP.box.left + axP.box.right) / 2, pad.top + 4, title,
      theme.color('--text'));
  }
}

function _cloneForParent(model) {
  const { CentralLimitModel } = model.constructor !== undefined
    ? { CentralLimitModel: model.constructor }
    : {};
  // Build a fresh model instance for drawing parent samples
  const Cls = model.constructor;
  const tmp = new Cls({ dist: model.dist, n: 1, N: 1, seed: model.seed + 99999 });
  return tmp;
}

function _histYMax(hist, theoCurve) {
  const hMax = Math.max(...hist.map(b => b.density));
  if (!theoCurve || theoCurve.length === 0) return hMax;
  return Math.max(hMax, Math.max(...theoCurve.map(p => p.pdf)));
}

function _label(c, x, y, text, color) {
  c.save();
  c.fillStyle    = color;
  c.font         = '12px sans-serif';
  c.textAlign    = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, x, y);
  c.restore();
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
