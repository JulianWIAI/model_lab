/**
 * STDPView — STDP kernel and weight trajectory.
 *
 * Left (55%): STDP kernel Δw(Δt); LTP region shaded above zero,
 *             LTD region shaded below zero; dashed zero line.
 * Right (45%): Cumulative weight change vs spike pair count
 *              for a single synapse under repeated pairing.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class STDPView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./STDPModel.js').STDPModel} model
   * @param {{dt: number[], dw: number[]}} kernelData
   * @param {{n: number[], w: number[]}} trajectoryData
   */
  draw(model, kernelData, trajectoryData) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const split = Math.floor(w * 0.55);
    this._drawKernel(c, model, kernelData, 0, split, h);
    this._drawTrajectory(c, trajectoryData, split, w, h);
  }

  _drawKernel(c, model, data, x0, x1, h) {
    if (!data || data.dt.length < 2) return;

    const yMin = Math.min(...data.dw) * 1.2;
    const yMax = Math.max(...data.dw) * 1.2;

    const padL = 54, padT = 24, padR = 8, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: x1 - padR, bottom: h - padB },
      [data.dt[0], data.dt[data.dt.length - 1]],
      [yMin, yMax],
    );

    axes.grid({
      xLabel: 'Δt (ms)',
      yLabel: 'Δw',
      xTicks: [-100, -50, 0, 50, 100],
      yTicks: [yMin * 0.8, 0, yMax * 0.8].map(v => parseFloat(v.toFixed(4))),
    });

    // Dashed zero line
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(data.dt[0]), axes.y(0));
    c.lineTo(axes.x(data.dt[data.dt.length - 1]), axes.y(0));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // LTP fill (Δt > 0, Δw > 0)
    c.save();
    c.fillStyle = theme.color('--good');
    c.globalAlpha = 0.15;
    c.beginPath();
    let started = false;
    for (let i = 0; i < data.dt.length; i++) {
      if (data.dt[i] <= 0) continue;
      const px = axes.x(data.dt[i]);
      const py = axes.y(Math.max(0, data.dw[i]));
      if (!started) { c.moveTo(px, axes.y(0)); c.lineTo(px, py); started = true; }
      else c.lineTo(px, py);
    }
    if (started) { c.lineTo(axes.x(data.dt[data.dt.length - 1]), axes.y(0)); c.closePath(); }
    c.fill();
    c.globalAlpha = 1;
    c.restore();

    // LTD fill (Δt < 0, Δw < 0)
    c.save();
    c.fillStyle = theme.color('--signal');
    c.globalAlpha = 0.15;
    c.beginPath();
    started = false;
    for (let i = 0; i < data.dt.length; i++) {
      if (data.dt[i] >= 0) continue;
      const px = axes.x(data.dt[i]);
      const py = axes.y(Math.min(0, data.dw[i]));
      if (!started) { c.moveTo(axes.x(data.dt[0]), axes.y(0)); c.lineTo(px, py); started = true; }
      else c.lineTo(px, py);
    }
    if (started) { c.lineTo(axes.x(0), axes.y(0)); c.closePath(); }
    c.fill();
    c.globalAlpha = 1;
    c.restore();

    // Kernel curve
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    data.dt.forEach((dt, i) => {
      if (i === 0) c.moveTo(axes.x(dt), axes.y(data.dw[i]));
      else c.lineTo(axes.x(dt), axes.y(data.dw[i]));
    });
    c.stroke();
    c.restore();

    // Labels
    c.save();
    c.fillStyle = theme.color('--good');
    c.font = '11px monospace';
    c.fillText('LTP', axes.x(60), axes.y(yMax * 0.6));
    c.fillStyle = theme.color('--signal');
    c.fillText('LTD', axes.x(-90), axes.y(yMin * 0.6));
    c.restore();
  }

  _drawTrajectory(c, data, x0, w, h) {
    if (!data || data.n.length < 2) return;

    const yMin = Math.min(...data.w);
    const yMax = Math.max(...data.w);
    const yRange = Math.max(yMax - yMin, 1e-10);

    const padL = 24, padT = 24, padR = 16, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: w - padR, bottom: h - padB },
      [0, data.n[data.n.length - 1]],
      [yMin - yRange * 0.1, yMax + yRange * 0.1],
    );

    axes.grid({
      xLabel: 'Pairing #',
      yLabel: 'Δw cumulative',
      xTicks: [0, Math.round(data.n[data.n.length - 1] / 2), data.n[data.n.length - 1]],
    });

    c.save();
    c.strokeStyle = theme.color('--ink');
    c.lineWidth = 1.5;
    c.beginPath();
    data.n.forEach((n, i) => {
      if (i === 0) c.moveTo(axes.x(n), axes.y(data.w[i]));
      else c.lineTo(axes.x(n), axes.y(data.w[i]));
    });
    c.stroke();
    c.restore();
  }
}
