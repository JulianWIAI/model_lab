/**
 * HopfieldView — visualise stored patterns and current recall state.
 *
 * Left half: neuron activation grid — stored pattern (row 0) vs
 *            current state (row 1); each cell coloured ±1.
 * Right half: energy value as large text, overlap m as a filled bar.
 */
import { theme } from '../../../../core/Theme.js';

export class HopfieldView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./HopfieldModel.js').HopfieldModel} model
   * @param {number[]} currentState   ±1 array
   * @param {number} patternIdx       which stored pattern to compare against
   */
  draw(model, currentState, patternIdx = 0) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: W, height: H } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    const split = Math.floor(W * 0.55);
    this._drawGrid(c, model, currentState, patternIdx, 0, split, H);
    this._drawReadout(c, model, currentState, patternIdx, split, W, H);
  }

  /**
   * Draw stored pattern row and current state row as neuron grids.
   */
  _drawGrid(c, model, state, patternIdx, x0, x1, H) {
    const N = model.N;
    const pat = model.patterns[patternIdx];

    const padL = 8, padT = 30, padR = 8, padB = 30;
    const areaW = (x1 - x0) - padL - padR;
    const areaH = (H - padT - padB);

    // Two rows: stored + current
    const rows = 2;
    const cellSize = Math.min(Math.floor(areaW / N), Math.floor(areaH / rows) - 4);
    const cs = Math.max(2, cellSize);
    const gridW = cs * N;
    const startX = x0 + padL + Math.floor((areaW - gridW) / 2);
    const rowH = Math.floor(areaH / rows);

    // Labels
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = theme.font(11, 'mono');
    c.textAlign = 'left';
    c.fillText('stored', x0 + padL, padT - 8);
    c.fillText('current', x0 + padL, padT + rowH - 8);
    c.restore();

    // Row 0: stored pattern
    for (let i = 0; i < N; i++) {
      const cx = startX + i * cs;
      const cy = padT;
      c.fillStyle = pat[i] === 1 ? theme.color('--muted') : theme.color('--surface');
      c.fillRect(cx, cy, cs - 1, cs - 1);
      c.strokeStyle = theme.color('--line');
      c.lineWidth = 0.5;
      c.strokeRect(cx, cy, cs - 1, cs - 1);
    }

    // Row 1: current state
    for (let i = 0; i < N; i++) {
      const cx = startX + i * cs;
      const cy = padT + rowH;
      c.fillStyle = state[i] === 1 ? theme.color('--accent') : theme.color('--accent-soft');
      c.fillRect(cx, cy, cs - 1, cs - 1);
      c.strokeStyle = theme.color('--line');
      c.lineWidth = 0.5;
      c.strokeRect(cx, cy, cs - 1, cs - 1);
    }

    // Divider
    c.save();
    c.strokeStyle = theme.color('--line');
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x1 - 1, 0);
    c.lineTo(x1 - 1, H);
    c.stroke();
    c.restore();
  }

  /**
   * Draw energy as large text and overlap as a bar on the right half.
   */
  _drawReadout(c, model, state, patternIdx, x0, W, H) {
    const E = model.energy(state);
    const m = model.overlapWith(state, patternIdx);

    const cx = x0 + Math.floor((W - x0) / 2);

    // Energy label
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = theme.font(12, 'mono');
    c.textAlign = 'center';
    c.fillText('Energy E', cx, 28);
    c.restore();

    // Energy value
    c.save();
    c.fillStyle = theme.color('--ink');
    c.font = theme.font(22, 'mono', 700);
    c.textAlign = 'center';
    const Estr = (E != null && isFinite(E)) ? E.toFixed(3) : '–';
    c.fillText(Estr, cx, 60);
    c.restore();

    // Overlap label
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = theme.font(12, 'mono');
    c.textAlign = 'center';
    c.fillText('Overlap m', cx, 90);
    c.restore();

    // Overlap bar (−1 to +1)
    const barW = Math.floor((W - x0) * 0.7);
    const barH = 18;
    const barX = x0 + Math.floor(((W - x0) - barW) / 2);
    const barY = 100;

    // Background track
    c.save();
    c.fillStyle = theme.color('--grid');
    c.fillRect(barX, barY, barW, barH);

    // Filled portion: map m from [−1,1] to bar width
    const mVal = (m != null && isFinite(m)) ? Math.max(-1, Math.min(1, m)) : 0;
    const fillW = Math.floor(((mVal + 1) / 2) * barW);
    c.fillStyle = mVal >= 0 ? theme.color('--good') : theme.color('--signal');
    c.fillRect(barX, barY, fillW, barH);

    // Centre tick
    c.strokeStyle = theme.color('--line');
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(barX + Math.floor(barW / 2), barY);
    c.lineTo(barX + Math.floor(barW / 2), barY + barH);
    c.stroke();

    // Border
    c.strokeStyle = theme.color('--muted');
    c.strokeRect(barX, barY, barW, barH);
    c.restore();

    // m value text
    c.save();
    c.fillStyle = theme.color('--ink');
    c.font = theme.font(13, 'mono');
    c.textAlign = 'center';
    const mStr = (m != null && isFinite(m)) ? m.toFixed(3) : '–';
    c.fillText(mStr, cx, barY + barH + 16);
    c.restore();
  }
}
