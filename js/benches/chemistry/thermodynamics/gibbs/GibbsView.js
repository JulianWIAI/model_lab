/**
 * GibbsView — ΔG vs T plot showing ΔH line, TΔS line, and crossover.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class GibbsView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./GibbsModel.js').GibbsModel} model
   * @param {number} Tmin  axis start (K)
   * @param {number} Tmax  axis end (K)
   * @param {number} cursorT  cursor position (K)
   */
  draw(model, Tmin, Tmax, cursorT) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    // ── Axis range: find min/max ΔG over the T range ──
    const pts = model.curve(Tmin, Tmax, 300);
    const dGvals = pts.map(p => p.dG);
    const dGmin = Math.min(...dGvals);
    const dGmax = Math.max(...dGvals);
    const pad   = (dGmax - dGmin) * 0.15 || 1000;
    const yLo   = dGmin - pad;
    const yHi   = dGmax + pad;

    const axes = new Axes(
      c,
      { left: 72, top: 16, right: w - 16, bottom: h - 36 },
      [Tmin, Tmax],
      [yLo, yHi],
    );
    axes.grid({
      xLabel: 'T (K)',
      yLabel: 'ΔG (J/mol)',
    });

    // ── Zero line ──
    const zeroY = axes.toPixel(Tmin, 0).y;
    if (zeroY >= axes.top && zeroY <= axes.bottom) {
      c.save();
      c.strokeStyle = theme.color('--muted');
      c.lineWidth   = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(axes.left, zeroY);
      c.lineTo(axes.right, zeroY);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // ── TΔS line (dashed, thin) ──
    const tDSpts = pts.map(({ T }) => axes.toPixel(T, T * model.dS));
    axes.polyline(tDSpts, { color: theme.color('--third'), lineWidth: 1.5, dash: [5, 4] });

    // ── ΔH horizontal line (dashed, thin) ──
    const dHy = axes.toPixel(Tmin, model.dH).y;
    if (dHy >= axes.top && dHy <= axes.bottom) {
      c.save();
      c.strokeStyle = theme.color('--signal');
      c.lineWidth   = 1.5;
      c.setLineDash([3, 3]);
      c.beginPath();
      c.moveTo(axes.left, dHy);
      c.lineTo(axes.right, dHy);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // ── ΔG curve ──
    const pxG = pts.map(({ T, dG }) => axes.toPixel(T, dG));
    axes.polyline(pxG, { color: theme.color('--accent'), lineWidth: 2.5 });

    // ── Crossover marker ──
    const T0 = model.crossoverT;
    if (T0 !== null && T0 >= Tmin && T0 <= Tmax) {
      const cpx = axes.toPixel(T0, 0);
      c.save();
      c.strokeStyle = theme.color('--accent');
      c.lineWidth   = 1;
      c.setLineDash([3, 3]);
      c.beginPath();
      c.moveTo(cpx.x, axes.bottom);
      c.lineTo(cpx.x, cpx.y);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = theme.color('--accent');
      c.beginPath();
      c.arc(cpx.x, cpx.y, 5, 0, 2 * Math.PI);
      c.fill();
      c.font      = '10px monospace';
      c.textAlign = 'center';
      c.fillText(`T* = ${T0.toFixed(1)} K`, cpx.x, cpx.y - 10);
      c.restore();
    }

    // ── Cursor dot ──
    const dGcursor = model.deltaG(cursorT);
    if (cursorT >= Tmin && cursorT <= Tmax) {
      const px = axes.toPixel(cursorT, dGcursor);
      c.save();
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(px.x, px.y, 4, 0, 2 * Math.PI);
      c.fill();
      c.restore();
    }

    // ── Legend ──
    const lx = axes.left + 10;
    const legends = [
      { label: 'ΔG = ΔH − TΔS', color: theme.color('--accent'), dash: false },
      { label: 'ΔH (constant)',   color: theme.color('--signal'), dash: true },
      { label: 'TΔS',             color: theme.color('--third'),  dash: true },
    ];
    c.save();
    c.font = '10px monospace';
    c.textAlign = 'left';
    let ly = axes.top + 14;
    for (const { label, color, dash } of legends) {
      c.strokeStyle = color;
      c.lineWidth   = dash ? 1.5 : 2;
      if (dash) c.setLineDash([4, 3]); else c.setLineDash([]);
      c.beginPath();
      c.moveTo(lx, ly);
      c.lineTo(lx + 16, ly);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = color;
      c.fillText(label, lx + 20, ly + 4);
      ly += 16;
    }
    c.restore();
  }
}
