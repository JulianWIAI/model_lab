/**
 * VotingView — two-panel view for voting systems.
 *
 * Left panel:  pairwise matrix grid showing M[i][j] with majority arrows.
 * Right panel: Borda score bar chart.
 */
import { theme } from '../../../../core/Theme.js';

export class VotingView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const midX = Math.floor(w / 2) - 8;

    // ---- Left panel: pairwise matrix ----
    this._drawPairwiseMatrix(c, model, { left: 16, top: 16, right: midX - 8, bottom: h - 16 });

    // ---- Right panel: Borda score bar chart ----
    this._drawBordaChart(c, model, { left: midX + 8, top: 16, right: w - 16, bottom: h - 16 });
  }

  _drawPairwiseMatrix(c, model, box) {
    const { left, top, right, bottom } = box;
    const bw = right - left;
    const bh = bottom - top;
    const n = model.n;
    const alts = model.alternatives;
    const M = model.pairwiseMatrix();
    const half = model.m / 2;

    // Panel title
    c.save();
    c.font = theme.font(12, 'sans');
    c.fillStyle = theme.color('--on-surface');
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('Pairwise majority matrix', (left + right) / 2, top);
    c.restore();

    // Matrix layout: leave room for row/col headers
    const headerSize = 28;
    const matrixLeft = left + headerSize;
    const matrixTop  = top + 28;
    const matrixW    = Math.min(bw - headerSize - 8, bh - 28 - 8);
    const matrixH    = matrixW;
    const cellW      = matrixW / n;
    const cellH      = matrixH / n;

    // Column headers (alternatives across top)
    c.save();
    c.font = theme.font(11, 'sans', 600);
    c.fillStyle = theme.color('--on-surface');
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let j = 0; j < n; j++) {
      c.fillText(alts[j], matrixLeft + j * cellW + cellW / 2, matrixTop - 10);
    }
    c.restore();

    // Row headers (alternatives down the left)
    c.save();
    c.font = theme.font(11, 'sans', 600);
    c.fillStyle = theme.color('--on-surface');
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      c.fillText(alts[i], matrixLeft - 6, matrixTop + i * cellH + cellH / 2);
    }
    c.restore();

    // Draw cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cx = matrixLeft + j * cellW;
        const cy = matrixTop + i * cellH;

        if (i === j) {
          // Diagonal: grey out
          c.save();
          c.fillStyle = theme.color('--grid');
          c.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
          c.restore();
        } else {
          // Cell background: accent if row beats col by majority
          const majority = M[i][j] > half;
          c.save();
          c.fillStyle = majority ? theme.color('--accent-soft') : theme.color('--surface');
          c.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
          c.restore();

          // Value
          c.save();
          c.font = theme.font(12, 'mono');
          c.fillStyle = majority ? theme.color('--accent') : theme.color('--on-surface');
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(String(M[i][j]), cx + cellW / 2, cy + cellH / 2);
          c.restore();
        }

        // Cell border
        c.save();
        c.strokeStyle = theme.color('--line');
        c.lineWidth = 1;
        c.strokeRect(cx + 0.5, cy + 0.5, cellW, cellH);
        c.restore();
      }
    }

    // Legend
    const legendY = matrixTop + matrixH + 12;
    c.save();
    c.font = theme.font(10, 'sans');
    c.fillStyle = theme.color('--on-surface');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('M[row][col] = # voters preferring row over col', left, legendY);
    c.restore();

    c.save();
    c.fillStyle = theme.color('--accent-soft');
    c.fillRect(left, legendY + 14, 12, 12);
    c.strokeStyle = theme.color('--line');
    c.lineWidth = 1;
    c.strokeRect(left + 0.5, legendY + 14.5, 12, 12);
    c.restore();

    c.save();
    c.font = theme.font(10, 'sans');
    c.fillStyle = theme.color('--accent');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('majority win', left + 16, legendY + 15);
    c.restore();
  }

  _drawBordaChart(c, model, box) {
    const { left, top, right, bottom } = box;
    const bw = right - left;
    const bh = bottom - top;
    const n = model.n;
    const alts = model.alternatives;
    const scores = model.bordaScores();
    const maxScore = Math.max(...Object.values(scores));
    const winner = model.bordaWinner();

    // Panel title
    c.save();
    c.font = theme.font(12, 'sans');
    c.fillStyle = theme.color('--on-surface');
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('Borda scores', (left + right) / 2, top);
    c.restore();

    const chartTop    = top + 28;
    const chartBottom = bottom - 32;
    const chartLeft   = left + 36;
    const chartRight  = right - 8;
    const chartH      = chartBottom - chartTop;
    const chartW      = chartRight - chartLeft;

    // Y-axis gridlines and labels
    const yTicks = maxScore > 0 ? [0, Math.ceil(maxScore / 2), maxScore] : [0, 1, 2];
    c.save();
    c.lineWidth = 1;
    c.strokeStyle = theme.color('--grid');
    c.fillStyle = theme.color('--muted');
    c.font = theme.font(10, 'mono');
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (const tick of yTicks) {
      const py = chartBottom - (maxScore > 0 ? (tick / maxScore) * chartH : 0);
      c.beginPath();
      c.moveTo(chartLeft, py + 0.5);
      c.lineTo(chartRight, py + 0.5);
      c.stroke();
      c.fillText(String(tick), chartLeft - 4, py);
    }
    c.restore();

    // Bars
    const barPad  = 12;
    const barW    = (chartW - barPad * (n + 1)) / n;
    for (let i = 0; i < n; i++) {
      const score = scores[alts[i]];
      const barH  = maxScore > 0 ? (score / maxScore) * chartH : 0;
      const bx    = chartLeft + barPad + i * (barW + barPad);
      const by    = chartBottom - barH;
      const isWinner = alts[i] === winner;

      c.save();
      c.fillStyle = isWinner ? theme.color('--accent') : theme.color('--accent-soft');
      c.fillRect(bx, by, barW, barH);
      c.restore();

      // Score label above bar
      c.save();
      c.font = theme.font(11, 'mono');
      c.fillStyle = isWinner ? theme.color('--accent') : theme.color('--on-surface');
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(String(score), bx + barW / 2, by - 2);
      c.restore();

      // Alternative name below bar
      c.save();
      c.font = theme.font(11, 'sans', isWinner ? 600 : 400);
      c.fillStyle = isWinner ? theme.color('--accent') : theme.color('--on-surface');
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(alts[i], bx + barW / 2, chartBottom + 4);
      c.restore();
    }

    // Winner label
    c.save();
    c.font = theme.font(11, 'sans');
    c.fillStyle = theme.color('--accent');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(winner ? `Winner: ${winner}` : 'Winner: tie', chartLeft, chartBottom + 18);
    c.restore();
  }
}
