/**
 * WilsonCowanView — draws phase plane with nullclines and trajectory.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class WilsonCowanView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model, trajectory) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 52, top: 16, right: w - 12, bottom: h - 32 },
      [0, 1],
      [0, 1],
    );
    axes.grid({
      xTicks: [0, 0.25, 0.5, 0.75, 1.0],
      yTicks: [0, 0.25, 0.5, 0.75, 1.0],
      xLabel: 'E (excitatory)',
      yLabel: 'I (inhibitory)',
    });

    // Draw E-nullcline
    const ncE = model.nullclineE(200);
    const ptsE = ncE.map(p => axes.toPixel(p.E, p.I));
    if (ptsE.length > 1) axes.polyline(ptsE, { color: theme.color('--accent'), lineWidth: 2 });

    // Draw I-nullcline
    const ncI = model.nullclineI(200);
    const ptsI = ncI.map(p => axes.toPixel(p.E, p.I));
    if (ptsI.length > 1) axes.polyline(ptsI, { color: theme.color('--third'), lineWidth: 2 });

    // Draw fixed points
    const fps = model.fixedPoints();
    for (const fp of fps) {
      const px = axes.toPixel(fp.E, fp.I);
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(px.x, px.y, 5, 0, 2 * Math.PI);
      c.fill();
    }

    // Draw trajectory
    if (trajectory && trajectory.length > 1) {
      const tPts = trajectory.map(p => axes.toPixel(p.E, p.I));
      axes.polyline(tPts, { color: theme.color('--text'), lineWidth: 1.5 });
    }
  }
}
