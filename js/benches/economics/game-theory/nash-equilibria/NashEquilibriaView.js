/**
 * NashEquilibriaView — best-response diagram.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class NashEquilibriaView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad = { left: 56, top: 16, right: w - 16, bottom: h - 40 };
    const ax = new Axes(c, pad, [0, 1], [0, 1]);
    ax.grid({
      xLabel: 'q (Col plays col 0)',
      yLabel: 'p (Row plays row 0)',
      xTicks: [0, 0.25, 0.5, 0.75, 1],
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    const N = 200;
    // Row's best response: for each q, which p is best for Row?
    // p=1 if BR=row0, p=0 if BR=row1, 0.5 if indifferent
    const rowBR = [];
    for (let i = 0; i <= N; i++) {
      const q = i / N;
      const br = model.bestResponseRow(q);
      rowBR.push([q, br === 0 ? 1 : br === 1 ? 0 : 0.5]);
    }

    // Col's best response: for each p, which q is best for Col?
    const colBR = [];
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      const br = model.bestResponseCol(p);
      colBR.push([br === 0 ? 1 : br === 1 ? 0 : 0.5, p]);
    }

    // Draw Col BR as horizontal segments
    ax.polyline(colBR, { color: theme.color('--signal'), width: 2.5 });
    // Draw Row BR as vertical segments
    ax.polyline(rowBR, { color: theme.color('--accent'), width: 2.5 });

    // Mark pure NE
    const pureNE = model.pureNE();
    c.save();
    c.fillStyle = theme.color('--on-surface');
    for (const { row, col } of pureNE) {
      const px = ax.x(1 - col);
      const py = ax.y(1 - row);
      c.beginPath();
      c.arc(px, py, 7, 0, 2 * Math.PI);
      c.fill();
    }
    c.restore();

    // Mark mixed NE
    const { p, q, degenerate, dominated } = model.mixedNE();
    if (!degenerate && !dominated && p !== null && q !== null &&
        p > -0.05 && p < 1.05 && q > -0.05 && q < 1.05) {
      c.save();
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.arc(ax.x(q), ax.y(p), 7, 0, 2 * Math.PI);
      c.fill();
      c.restore();
    }

    // Legend
    c.save();
    c.font = theme.font(11, 'sans');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = theme.color('--accent');
    c.fillText('Row BR', pad.left + 4, pad.top + 4);
    c.fillStyle = theme.color('--signal');
    c.fillText('Col BR', pad.left + 4, pad.top + 18);
    c.fillStyle = theme.color('--on-surface');
    c.fillText('● pure NE', pad.left + 4, pad.top + 32);
    c.fillStyle = theme.color('--signal');
    c.fillText('● mixed NE', pad.left + 4, pad.top + 46);
    c.restore();
  }
}
