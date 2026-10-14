/**
 * MechanismsView — three overlaid concentration curves A, B, C vs time.
 * Optionally overlays the steady-state approximation for B.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class MechanismsView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    /** Show steady-state approximation overlay for [B]. */
    this.showSsa = false;
  }

  /**
   * @param {import('./MechanismsModel.js').MechanismsModel} model
   * @param {number} tEnd  x-axis upper limit (s)
   */
  draw(model, tEnd) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 56, top: 20, right: w - 100, bottom: h - 36 },
      [0, tEnd],
      [0, model.A0],
    );
    axes.grid({
      yTicks: [0, model.A0 * 0.25, model.A0 * 0.5, model.A0 * 0.75, model.A0],
      yFormat: (v) => v.toFixed(2),
      xLabel: 't (s)',
      yLabel: 'concentration (mol L⁻¹)',
    });

    const pts = model.curve(tEnd, 400);
    const pxA   = pts.map(({ t, A })   => axes.toPixel(t, A));
    const pxB   = pts.map(({ t, B })   => axes.toPixel(t, B));
    const pxC   = pts.map(({ t, C })   => axes.toPixel(t, C));
    const pxBss = pts.map(({ t, Bss }) => axes.toPixel(t, Bss));

    axes.polyline(pxA, { color: theme.color('--accent'), lineWidth: 2 });
    axes.polyline(pxC, { color: theme.color('--third'),  lineWidth: 2 });
    axes.polyline(pxB, { color: theme.color('--signal'), lineWidth: 2 });

    if (this.showSsa) {
      axes.polyline(pxBss, { color: theme.color('--signal'), lineWidth: 1.5, dash: [5, 4] });
    }

    // ── t_max vertical dashed line ──
    const tM = model.tMax;
    if (tM <= tEnd) {
      const px = axes.toPixel(tM, 0);
      c.save();
      c.strokeStyle = theme.color('--muted');
      c.lineWidth   = 1;
      c.setLineDash([3, 3]);
      c.beginPath();
      c.moveTo(px.x, axes.top);
      c.lineTo(px.x, axes.bottom);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // ── Legend ──
    const lx = axes.right + 8;
    const entries = [
      { label: '[A]', color: theme.color('--accent') },
      { label: '[B]', color: theme.color('--signal') },
      { label: '[C]', color: theme.color('--third') },
    ];
    if (this.showSsa) {
      entries.push({ label: '[B] SSA', color: theme.color('--signal'), dash: true });
    }
    c.save();
    c.font      = `11px monospace`;
    c.textAlign = 'left';
    let ly = axes.top + 10;
    for (const { label, color, dash } of entries) {
      c.strokeStyle = color;
      c.lineWidth   = dash ? 1.5 : 2;
      if (dash) c.setLineDash([5, 4]); else c.setLineDash([]);
      c.beginPath();
      c.moveTo(lx, ly);
      c.lineTo(lx + 18, ly);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = color;
      c.fillText(label, lx + 22, ly + 4);
      ly += 18;
    }
    c.restore();
  }
}
