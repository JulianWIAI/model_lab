/**
 * CompetitiveExclusionView — N₁-N₂ phase portrait with nullclines and trajectories.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class CompetitiveExclusionView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./CompetitiveExclusionModel.js').CompetitiveExclusionModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const Nmax = Math.max(model.K1, model.K2) * 1.3;
    const pad  = { left: 56, top: 16, right: 16, bottom: h - 40 };

    const axes = new Axes(c,
      { left: pad.left, top: pad.top, right: w - pad.right, bottom: pad.bottom },
      [0, Nmax], [0, Nmax]);

    axes.grid({
      xLabel: 'N₁',
      yLabel: 'N₂',
      xTicks: [0, model.K1 * 0.5, model.K1, Nmax * 0.9].map(v => Math.round(v)),
      yTicks: [0, model.K2 * 0.5, model.K2, Nmax * 0.9].map(v => Math.round(v)),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(0),
    });

    // Nullcline 1: N₂ = (K₁ − N₁)/α₁₂
    const nc1 = model.nullcline1();  // N₁-axis intercept=K1, slope for N₂ vs N₁
    // N₂ = (K1 − a12·N2) → as function of N1: N₂ = (K1 − N1)/a12 if a12>0
    const nc1pts = [[0, model.K1], [model.K1, 0]];
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i < nc1pts.length; i++) {
      const [n1, n2] = nc1pts[i];
      const N2 = model.a12 > 0 ? (model.K1 - n1) / model.a12 : model.K1;
      if (i === 0) c.moveTo(axes.x(n1), axes.y(Math.max(0, N2)));
      else         c.lineTo(axes.x(n1), axes.y(Math.max(0, N2)));
    }
    c.stroke();
    c.restore();

    // Nullcline 2: N₁ = (K₂ − N₂)/α₂₁
    const N2vals = [0, Nmax];
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i < N2vals.length; i++) {
      const N2 = N2vals[i];
      const N1 = model.a21 > 0 ? (model.K2 - N2) / model.a21 : model.K2;
      if (i === 0) c.moveTo(axes.x(Math.max(0, N1)), axes.y(N2));
      else         c.lineTo(axes.x(Math.max(0, N1)), axes.y(N2));
    }
    c.stroke();
    c.restore();

    // Multiple trajectories from various ICs
    const ICs = [
      [model.K1 * 0.1, model.K2 * 0.9],
      [model.K1 * 0.9, model.K2 * 0.1],
      [model.K1 * 0.5, model.K2 * 0.5],
      [model.K1 * 0.2, model.K2 * 0.4],
    ];
    for (let i = 0; i < ICs.length; i++) {
      const traj = model.trajectory(ICs[i], 100, 0.2);
      c.save();
      c.strokeStyle = theme.color('--on-surface') + (i === 0 ? 'BB' : '66');
      c.lineWidth   = 1.5;
      c.beginPath();
      for (let k = 0; k < traj.length; k++) {
        const px = axes.x(traj[k].N1), py = axes.y(traj[k].N2);
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      c.restore();
    }

    // Equilibrium point
    const [N1s, N2s] = model.equilibrium;
    if (N1s > 0 && N2s > 0 && N1s < Nmax && N2s < Nmax) {
      c.save();
      c.beginPath();
      c.arc(axes.x(N1s), axes.y(N2s), 5, 0, 2 * Math.PI);
      const col = model.outcome === 'coexistence'
        ? theme.color('--accent') : theme.color('--muted');
      c.fillStyle   = col;
      c.strokeStyle = theme.color('--on-surface');
      c.lineWidth   = 1.5;
      c.fill(); c.stroke();
      c.restore();
    }

    // Outcome label
    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.font = 'bold 12px monospace';
    c.textAlign = 'center';
    c.fillText(`Outcome: ${model.outcome}`, (pad.left + w - pad.right) / 2, pad.top + 20);
    c.restore();
  }
}
