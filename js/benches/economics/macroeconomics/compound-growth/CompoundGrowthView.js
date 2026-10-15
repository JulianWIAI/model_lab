/**
 * CompoundGrowthView — two-panel canvas.
 *
 * Left (65%): A(t) for discrete and continuous compounding on the same axes.
 *             Dashed horizontals at 2P and 3P.
 * Right (35%): rule-of-72 error curve — t₂_exact(r, m=1) × (r×100) vs r.
 *              Horizontal dashed at 72; label shows "72 accurate near 8%".
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class CompoundGrowthView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./CompoundGrowthModel.js').CompoundGrowthModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.65);
    const pad    = { left: 60, top: 16, bottom: h - 36 };

    const pts   = model.curve(400);
    const Amax  = Math.max(...pts.map(p => Math.max(p.A, p.Acont)));
    const yMax  = Math.max(Amax, model.P * 3.2) * 1.05;

    // ── LEFT PANEL: A(t) ──────────────────────────────────────────────────────
    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, model.tMax],
      [0, yMax],
    );
    axesL.grid({
      xLabel: 't (years)',
      yLabel: 'A',
      xTicks: _niceTicks(0, model.tMax, 6),
      yTicks: _niceTicks(0, yMax, 5),
      xFormat: v => v.toFixed(0),
      yFormat: v => _fmtCurrency(v),
    });

    // Dashed horizontals at 2P and 3P
    _dashed(c, axesL.box.left, axesL.y(model.P * 2), splitX - 8,
      axesL.y(model.P * 2), theme.color('--muted'));
    axesL.label('2P', 0, model.P * 2,
      { color: theme.color('--muted'), align: 'left', dx: 4, dy: -6 });

    if (model.P * 3 <= yMax) {
      _dashed(c, axesL.box.left, axesL.y(model.P * 3), splitX - 8,
        axesL.y(model.P * 3), theme.color('--muted'));
      axesL.label('3P', 0, model.P * 3,
        { color: theme.color('--muted'), align: 'left', dx: 4, dy: -6 });
    }

    // Continuous curve (always shown as reference)
    axesL.polyline(pts.map(p => [p.t, p.Acont]),
      { color: theme.color('--muted'), width: 1.5, dash: [6, 3] });

    // Discrete / chosen-m curve
    axesL.polyline(pts.map(p => [p.t, p.A]),
      { color: theme.color('--accent'), width: 2.5 });

    // ── RIGHT PANEL: rule-of-72 error ─────────────────────────────────────────
    const r72pts = model.rule72Curve(200);
    const rMin = r72pts[0].r, rMax = r72pts[r72pts.length - 1].r;
    const pctMin = Math.min(...r72pts.map(p => p.pct));
    const pctMax = Math.max(...r72pts.map(p => p.pct));
    const pctSpan = Math.max(pctMax - pctMin, 5);

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [rMin, rMax],
      [pctMin - pctSpan * 0.1, pctMax + pctSpan * 0.1],
    );
    axesR.grid({
      xLabel: 'r',
      yLabel: 't₂ × r%',
      xTicks: [0.02, 0.05, 0.08, 0.10, 0.15, 0.20, 0.25].filter(v => v <= rMax),
      yTicks: _niceTicks(pctMin - pctSpan * 0.1, pctMax + pctSpan * 0.1, 5),
      xFormat: v => `${(v * 100).toFixed(0)}%`,
      yFormat: v => v.toFixed(1),
    });

    // Dashed at 72
    _dashed(c, axesR.box.left, axesR.y(72), w - 12,
      axesR.y(72), theme.color('--signal'));
    axesR.label('72', rMax, 72,
      { color: theme.color('--signal'), align: 'right', dx: -4, dy: -6 });

    axesR.polyline(r72pts.map(p => [p.r, p.pct]),
      { color: theme.color('--accent'), width: 2 });
  }
}

function _dashed(c, x1, y1, x2, y2, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth   = 1;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

function _fmtCurrency(v) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return v.toFixed(0);
}

function _niceTicks(lo, hi, n) {
  const step = (hi - lo) / n;
  const mag  = Math.pow(10, Math.floor(Math.log10(step)));
  const nice = [1, 2, 2.5, 5, 10].find(f => f * mag >= step) * mag;
  const ticks = [];
  for (let v = Math.ceil(lo / nice) * nice; v <= hi + nice * 0.01; v += nice) {
    ticks.push(+v.toPrecision(10));
  }
  return ticks;
}
