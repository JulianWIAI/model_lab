/**
 * LogisticView — two-panel: N vs t (left) and phase portrait dN/dt vs N (right).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class LogisticView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./LogisticModel.js').LogisticModel} model
   * @param {number} tMax
   */
  draw(model, tMax) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.65);
    const margin = { left: 52, top: 16, bottom: h - 36 };

    // ── LEFT PANEL: N vs t ──
    const axesL = new Axes(
      c,
      { left: margin.left, top: margin.top, right: splitX - 8, bottom: margin.bottom },
      [0, tMax],
      [0, model.K + 10],
    );
    axesL.grid({
      xLabel: 't',
      yLabel: 'N',
      xTicks: [0, tMax * 0.25, tMax * 0.5, tMax * 0.75, tMax].map(v => Math.round(v)),
      yTicks: [0, model.K * 0.25, model.K * 0.5, model.K * 0.75, model.K].map(v => Math.round(v)),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(0),
    });

    // Carrying capacity K dashed line
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    const Kpx = { x: axesL.box.left, y: axesL.y(model.K) };
    c.moveTo(Kpx.x, Kpx.y);
    c.lineTo(axesL.box.right, Kpx.y);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // tHalf vertical dashed line
    const tHalf = model.tHalf;
    if (tHalf !== null && tHalf <= tMax) {
      c.save();
      c.strokeStyle = theme.color('--signal');
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      const tHalfX = axesL.x(tHalf);
      c.moveTo(tHalfX, axesL.box.top);
      c.lineTo(tHalfX, axesL.box.bottom);
      c.stroke();
      c.setLineDash([]);
      c.restore();

      // Dot at (tHalf, K/2)
      c.save();
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(axesL.x(tHalf), axesL.y(model.K / 2), 5, 0, 2 * Math.PI);
      c.fill();
      c.restore();
    }

    // N(t) curve
    const pts = model.curve(tMax, 400).map(({ t, N }) => [t, N]);
    axesL.polyline(pts, { color: theme.color('--accent'), width: 2.5 });

    // K label
    axesL.label('K', tMax * 0.05, model.K, { color: theme.color('--muted'), align: 'left', dx: 4, dy: -6 });

    // ── RIGHT PANEL: phase portrait dN/dt vs N ──
    const maxDNdt = model.r * model.K / 4 * 1.15;
    const axesR = new Axes(
      c,
      { left: splitX + 20, top: margin.top, right: w - 12, bottom: margin.bottom },
      [0, model.K],
      [0, maxDNdt],
    );
    axesR.grid({
      xLabel: 'N',
      yLabel: 'dN/dt',
      xTicks: [0, model.K * 0.5, model.K].map(v => Math.round(v)),
      yTicks: [0, model.r * model.K / 4].map(v => +v.toFixed(1)),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(1),
    });

    // Parabola curve dN/dt vs N
    const phasePts = [];
    const nSteps = 300;
    for (let i = 0; i <= nSteps; i++) {
      const Nv = model.K * i / nSteps;
      phasePts.push([Nv, model.dNdt(Nv)]);
    }
    axesR.polyline(phasePts, { color: theme.color('--accent'), width: 2.5 });

    // Current N vertical dashed line
    const currentN = model.N(tMax / 2);
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axesR.x(currentN), axesR.box.top);
    c.lineTo(axesR.x(currentN), axesR.box.bottom);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // K/2 label at peak
    axesR.label('K/2', model.K / 2, model.r * model.K / 4, { color: theme.color('--muted'), align: 'center', dx: 0, dy: -14 });
  }
}
