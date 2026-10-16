/**
 * AgeStructureView — Leslie matrix age-structure dynamics.
 *
 * Left (58%): N(t) total population and age-class trajectories (semi-log).
 * Right (42%): stable age distribution bar chart (if primitive).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

const CLASS_COLORS = ['--accent', '--good', '--signal', '--qr'];

export class AgeStructureView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./LeslieModel.js').LeslieModel} model
   * @param {number[][]} history  [n₀, n₁, ..., n_T]
   * @param {{lambda: number, stableAge?: number[], imprimitive?: boolean}} eigenResult
   */
  draw(model, history, eigenResult) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const split = Math.floor(w * 0.58);
    this._drawTrajectories(c, model, history, 0, split, h);
    this._drawStableAge(c, model, eigenResult, split, w, h);
  }

  _drawTrajectories(c, model, history, x0, x1, h) {
    if (!history || history.length < 2) return;
    const T = history.length - 1;
    const n = model.n;

    // Total population trajectory (log scale)
    const totals = history.map(nv => nv.reduce((s, x) => s + x, 0));
    const logMin = Math.log10(Math.max(totals[0] * 0.5, 1e-3));
    const logMax = Math.log10(Math.max(...totals) * 2);

    const padL = 60, padT = 20, padR = 8, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: x1 - padR, bottom: h - padB },
      [0, T],
      [logMin, logMax],
    );

    axes.grid({
      xLabel: 't (steps)',
      yLabel: 'log₁₀ N',
      xTicks: [0, Math.round(T / 2), T],
    });

    // Age-class trajectories (thin, semi-log)
    for (let i = 0; i < n; i++) {
      const col = CLASS_COLORS[i % CLASS_COLORS.length];
      c.save();
      c.strokeStyle = theme.color(col);
      c.lineWidth = 1;
      c.globalAlpha = 0.6;
      c.beginPath();
      let started = false;
      history.forEach((nv, t) => {
        if (nv[i] <= 0) return;
        const px = axes.x(t);
        const py = axes.y(Math.log10(nv[i]));
        if (!started) { c.moveTo(px, py); started = true; }
        else c.lineTo(px, py);
      });
      c.stroke();
      c.globalAlpha = 1;
      c.restore();
    }

    // Total N (thick)
    c.save();
    c.strokeStyle = theme.color('--ink');
    c.lineWidth = 2;
    c.beginPath();
    totals.forEach((N, t) => {
      if (N <= 0) return;
      if (t === 0) c.moveTo(axes.x(t), axes.y(Math.log10(N)));
      else c.lineTo(axes.x(t), axes.y(Math.log10(N)));
    });
    c.stroke();
    c.restore();
  }

  _drawStableAge(c, model, eigenResult, x0, w, h) {
    const n = model.n;
    const padL = 24, padT = 20, padR = 16, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: w - padR, bottom: h - padB },
      [-0.5, n - 0.5],
      [0, 1],
    );

    axes.grid({
      xLabel: 'age class',
      yLabel: 'proportion',
      xTicks: Array.from({ length: n }, (_, i) => i),
      yTicks: [0, 0.5, 1],
    });

    if (eigenResult.imprimitive) {
      // Label: imprimitive
      c.save();
      c.fillStyle = theme.color('--signal');
      c.font = '12px monospace';
      const cx = (axes.x(-0.5) + axes.x(n - 0.5)) / 2;
      c.textAlign = 'center';
      c.fillText('Imprimitive:', cx, (padT + (h - padB)) / 2 - 8);
      c.fillText('no stable age dist.', cx, (padT + (h - padB)) / 2 + 8);
      c.textAlign = 'left';
      c.restore();
      return;
    }

    const w_age = eigenResult.stableAge || [];
    const bw = (axes.x(0.5) - axes.x(-0.5)) * 0.6;
    for (let i = 0; i < n && i < w_age.length; i++) {
      const col = CLASS_COLORS[i % CLASS_COLORS.length];
      const bx = axes.x(i) - bw / 2;
      const by = axes.y(w_age[i]);
      const bh = axes.y(0) - by;
      c.save();
      c.fillStyle = theme.color(col);
      c.globalAlpha = 0.75;
      c.fillRect(bx, by, bw, bh);
      c.globalAlpha = 1;
      c.restore();
    }
  }
}
