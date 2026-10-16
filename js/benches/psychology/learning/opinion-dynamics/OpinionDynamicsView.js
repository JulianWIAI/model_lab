/**
 * OpinionDynamicsView — DeGroot consensus dynamics.
 *
 * Left (60%): opinion trajectories x_i(t) for all agents.
 * Right (40%): bar chart of current opinions vs consensus.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

const AGENT_COLORS = ['--accent', '--good', '--signal', '--qr', '--muted'];

export class OpinionDynamicsView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./OpinionDynamicsModel.js').OpinionDynamicsModel} model
   * @param {number[][]} history  [x₀, x₁, ..., x_T]
   * @param {number}     consensus
   */
  draw(model, history, consensus) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const split = Math.floor(w * 0.62);
    this._drawTrajectories(c, model, history, consensus, 0, split, h);
    this._drawBar(c, model, history[history.length - 1], consensus, split, w, h);
  }

  _drawTrajectories(c, model, history, consensus, x0, x1, h) {
    if (!history || history.length < 2) return;
    const T = history.length - 1;
    const n = model.n;

    const padL = 54, padT = 20, padR = 8, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: x1 - padR, bottom: h - padB },
      [0, T],
      [0, 1],
    );

    axes.grid({
      xLabel: 't (steps)',
      yLabel: 'opinion xᵢ',
      xTicks: [0, Math.round(T / 2), T],
      yTicks: [0, 0.25, 0.5, 0.75, 1],
    });

    for (let i = 0; i < n; i++) {
      const col = AGENT_COLORS[i % AGENT_COLORS.length];
      c.save();
      c.strokeStyle = theme.color(col);
      c.lineWidth = 1.5;
      c.beginPath();
      history.forEach((x, t) => {
        if (t === 0) c.moveTo(axes.x(t), axes.y(x[i]));
        else c.lineTo(axes.x(t), axes.y(x[i]));
      });
      c.stroke();
      c.restore();
    }

    // Consensus dashed line
    c.save();
    c.strokeStyle = theme.color('--ink');
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(0), axes.y(consensus));
    c.lineTo(axes.x(T), axes.y(consensus));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    c.save();
    c.fillStyle = theme.color('--ink');
    c.font = '11px monospace';
    c.fillText(`x*=${consensus.toFixed(3)}`, x0 + padL + 4, axes.y(consensus) - 4);
    c.restore();
  }

  _drawBar(c, model, xCurrent, consensus, x0, w, h) {
    const n = model.n;
    const padL = 24, padT = 20, padR = 16, padB = 44;
    const axes = new Axes(
      c,
      { left: x0 + padL, top: padT, right: w - padR, bottom: h - padB },
      [-0.5, n - 0.5],
      [0, 1],
    );

    axes.grid({
      xLabel: 'agent',
      yLabel: 'opinion',
      xTicks: Array.from({ length: n }, (_, i) => i),
      yTicks: [0, 0.5, 1],
    });

    const bw = (axes.x(0.5) - axes.x(-0.5)) * 0.6;
    for (let i = 0; i < n; i++) {
      const col = AGENT_COLORS[i % AGENT_COLORS.length];
      const bx = axes.x(i) - bw / 2;
      const by = axes.y(xCurrent[i]);
      const bh = axes.y(0) - by;
      c.save();
      c.fillStyle = theme.color(col);
      c.globalAlpha = 0.75;
      c.fillRect(bx, by, bw, bh);
      c.globalAlpha = 1;
      c.restore();
    }

    // Consensus line
    c.save();
    c.strokeStyle = theme.color('--ink');
    c.setLineDash([4, 3]);
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(axes.x(-0.5), axes.y(consensus));
    c.lineTo(axes.x(n - 0.5), axes.y(consensus));
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }
}
