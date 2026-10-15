/**
 * WeberFechnerView — three-panel canvas.
 *
 * Left   (33%): Weber — JND vs I (linear axes; diagonal line slope k_W)
 * Middle (33%): Fechner — S vs I (x log-scale; straight on log-x)
 * Right  (34%): Stevens — S vs I on log–log axes (straight line, slope n)
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

const COLORS = ['--accent', '--signal', '--third', '--muted'];

export class WeberFechnerView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    /** @type {import('./WeberFechnerModel.js').WeberFechnerModel[]} */
    this.models = [];
  }

  /**
   * @param {import('./WeberFechnerModel.js').WeberFechnerModel} primaryModel
   */
  draw(primaryModel) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad   = { top: 16, bottom: h - 36 };
    const third = Math.floor(w / 3);

    const allModels = this.models.length > 0 ? this.models : [primaryModel];

    // ── PANEL 1: Weber JND vs I (linear) ────────────────────────────────────
    const IMax = primaryModel.IMax;
    const IMin = primaryModel.IMin;
    const jndMax = primaryModel.kW * IMax * 1.05;

    const axW = new Axes(
      c,
      { left: 52, top: pad.top, right: third - 8, bottom: pad.bottom },
      [IMin, IMax],
      [0, jndMax],
    );
    axW.grid({
      xLabel: 'I',
      yLabel: 'JND',
      xTicks: _niceTicks(IMin, IMax, 5),
      yTicks: _niceTicks(0, jndMax, 4),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(1),
    });
    for (let mi = 0; mi < allModels.length; mi++) {
      const m   = allModels[mi];
      const pts = m.weberCurve(200);
      axW.polyline(pts.map(p => [p.I, p.jnd]),
        { color: theme.color(COLORS[mi % COLORS.length]), width: 2 });
    }
    _panelLabel(c, axW, 'Weber: JND = k·I');

    // ── PANEL 2: Fechner S vs I (normal linear axes; log shape visible) ──────
    const sMax_f = Math.max(...allModels.map(m =>
      Math.abs(m.fechner(IMax)) * 1.1));
    const sMin_f = Math.min(0, ...allModels.map(m => m.fechner(IMin)));

    const axF = new Axes(
      c,
      { left: third + 44, top: pad.top, right: 2 * third - 8, bottom: pad.bottom },
      [IMin, IMax],
      [sMin_f, sMax_f],
    );
    axF.grid({
      xLabel: 'I',
      yLabel: 'S (Fechner)',
      xTicks: _niceTicks(IMin, IMax, 5),
      yTicks: _niceTicks(sMin_f, sMax_f, 4),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(1),
    });
    for (let mi = 0; mi < allModels.length; mi++) {
      const m   = allModels[mi];
      const pts = m.fechnerCurve(200);
      axF.polyline(pts.map(p => [p.I, p.S]),
        { color: theme.color(COLORS[mi % COLORS.length]), width: 2 });
    }
    _panelLabel(c, axF, 'Fechner: S = (1/k)·ln(I/I₀)');

    // ── PANEL 3: Stevens log–log (straight line slope n) ─────────────────────
    const sMin_s = primaryModel.stevens(IMin);
    const sMax_s = primaryModel.stevens(IMax);

    // Map log(I) → pixel x; log(S) → pixel y
    const logIMin = Math.log10(IMin), logIMax = Math.log10(IMax);
    const logSMin = Math.log10(Math.max(sMin_s, 1e-10));
    const logSMax = Math.log10(sMax_s * 1.1);

    const axS = new Axes(
      c,
      { left: 2 * third + 44, top: pad.top, right: w - 8, bottom: pad.bottom },
      [logIMin, logIMax],
      [logSMin, logSMax],
    );
    axS.grid({
      xLabel: 'log I',
      yLabel: 'log S (Stevens)',
      xTicks: _logTicks(logIMin, logIMax),
      yTicks: _logTicks(logSMin, logSMax),
      xFormat: v => `10^${v.toFixed(0)}`,
      yFormat: v => `10^${v.toFixed(1)}`,
    });
    for (let mi = 0; mi < allModels.length; mi++) {
      const m   = allModels[mi];
      const pts = m.stevensCurve(200)
        .filter(p => p.I > 0 && p.S > 0)
        .map(p => [Math.log10(p.I), Math.log10(p.S)]);
      axS.polyline(pts, { color: theme.color(COLORS[mi % COLORS.length]), width: 2 });
    }
    _panelLabel(c, axS, 'Stevens: S = k·Iⁿ (log–log)');
  }
}

function _panelLabel(c, axes, text) {
  c.save();
  c.fillStyle = theme.color('--muted');
  c.font      = '11px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillText(text, (axes.box.left + axes.box.right) / 2, axes.box.top + 2);
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

function _logTicks(logMin, logMax) {
  const ticks = [];
  for (let v = Math.floor(logMin); v <= Math.ceil(logMax); v += 0.5) {
    if (v >= logMin - 0.01 && v <= logMax + 0.01) ticks.push(v);
  }
  return ticks;
}
