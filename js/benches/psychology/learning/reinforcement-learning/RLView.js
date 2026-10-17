/**
 * RLView — corridor MDP visualisation.
 *
 * Top row: 9 cells (states 0..8) coloured by V*(s) = max_a Q(s,a).
 * Terminal cells labelled with their rewards (+1 / +10).
 * Arrow overlay shows greedy policy at each non-terminal state.
 * Bottom: Q-value heatmap colour scale bar.
 */
import { theme } from '../../../../core/Theme.js';

const N_STATES = 9;
const TERMINAL_LEFT  = 0;
const TERMINAL_RIGHT = 8;

export class RLView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./RLModel.js').RLModel} model
   * @param {number} episodes  number of training episodes so far
   */
  draw(model, episodes) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const padL = 20, padR = 20, padT = 40, padB = 60;
    const rowH = Math.min(80, (h - padT - padB) * 0.7);
    const cellW = (w - padL - padR) / N_STATES;
    const rowY  = padT;

    // Compute value range for colour scaling
    const values = model.states.map(s => Math.max(...model.actions.map(a => model.Q(s, a))));
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    // Draw cells
    for (let s = 0; s < N_STATES; s++) {
      const cx = padL + s * cellW;
      const v  = values[s];
      const t  = (v - minV) / range; // 0..1

      // Colour: cool (--accent-soft) → warm (--accent) interpolated by value
      const r  = Math.round(lerp(0xe2, 0x23, t));
      const g  = Math.round(lerp(0xe8, 0x47, t));
      const b  = Math.round(lerp(0xfb, 0xc4, t));

      const isTerminal = s === TERMINAL_LEFT || s === TERMINAL_RIGHT;

      c.save();
      c.fillStyle = isTerminal ? theme.color('--good') : `rgb(${r},${g},${b})`;
      c.globalAlpha = isTerminal ? 0.85 : 0.9;
      c.fillRect(cx, rowY, cellW - 2, rowH);
      c.globalAlpha = 1;
      c.restore();

      // Border
      c.save();
      c.strokeStyle = theme.color('--line');
      c.lineWidth = 1;
      c.strokeRect(cx, rowY, cellW - 2, rowH);
      c.restore();

      // State label
      c.save();
      c.fillStyle = theme.color('--ink');
      c.font = theme.font(10, 'mono');
      c.textAlign = 'center';
      c.fillText(`s${s}`, cx + cellW / 2 - 1, rowY + 14);
      c.restore();

      // Terminal reward label
      if (isTerminal) {
        const reward = s === TERMINAL_LEFT ? '+1' : '+10';
        c.save();
        c.fillStyle = theme.color('--panel');
        c.font = theme.font(14, 'mono', 700);
        c.textAlign = 'center';
        c.fillText(reward, cx + cellW / 2 - 1, rowY + rowH / 2 + 5);
        c.restore();
      } else {
        // V*(s) value
        c.save();
        c.fillStyle = theme.color('--ink');
        c.font = theme.font(10, 'mono');
        c.textAlign = 'center';
        c.fillText(v.toFixed(2), cx + cellW / 2 - 1, rowY + rowH - 8);
        c.restore();

        // Greedy policy arrow
        const best = model.bestAction(s);
        const arrowY = rowY + rowH / 2 + 2;
        const ax = cx + cellW / 2 - 1;
        const arrowLen = cellW * 0.25;
        drawArrow(c, ax, arrowY, best === 'right' ? arrowLen : -arrowLen, theme.color('--ink'));
      }
    }

    // Heatmap bar
    const barY = rowY + rowH + 16;
    const barH = 12;
    const barW = w - padL - padR;
    const grad = c.createLinearGradient(padL, 0, padL + barW, 0);
    grad.addColorStop(0, `rgb(${Math.round(0xe2)},${Math.round(0xe8)},${Math.round(0xfb)})`);
    grad.addColorStop(1, `rgb(${Math.round(0x23)},${Math.round(0x47)},${Math.round(0xc4)})`);
    c.fillStyle = grad;
    c.fillRect(padL, barY, barW, barH);

    c.save();
    c.fillStyle = theme.color('--ink');
    c.font = theme.font(9, 'mono');
    c.textAlign = 'left';
    c.fillText(minV.toFixed(2), padL, barY + barH + 12);
    c.textAlign = 'right';
    c.fillText(maxV.toFixed(2), padL + barW, barY + barH + 12);
    c.textAlign = 'center';
    c.fillText('V*(s)', padL + barW / 2, barY + barH + 12);
    c.restore();

    // Episode count
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = theme.font(10, 'mono');
    c.textAlign = 'left';
    c.fillText(`episodes: ${episodes}`, padL, rowY - 8);
    c.restore();
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawArrow(c, x, y, dx, color) {
  const headLen = 6;
  const dir = dx > 0 ? 1 : -1;
  const x2 = x + dx;

  c.save();
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 1.5;

  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y);
  c.stroke();

  // Arrowhead
  c.beginPath();
  c.moveTo(x2, y);
  c.lineTo(x2 - dir * headLen, y - headLen * 0.5);
  c.lineTo(x2 - dir * headLen, y + headLen * 0.5);
  c.closePath();
  c.fill();
  c.restore();
}
