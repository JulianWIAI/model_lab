/**
 * MendelView — draws the Punnett square and observed vs expected bar chart.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

export class MendelView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model, observed) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pq = model.punnettSquare();
    const cellCount = pq.gameteA.length;
    const gridSize = Math.min(w * 0.45, h - 40);
    const cellSize = Math.floor(gridSize / (cellCount + 1));
    const gridLeft = 20;
    const gridTop = 30;

    // Draw Punnett grid header
    c.fillStyle = theme.color('--muted');
    c.font = '11px system-ui';
    c.textAlign = 'center';
    // Column headers (gametes A)
    for (let j = 0; j < cellCount; j++) {
      c.fillText(pq.gameteA[j], gridLeft + (j + 1.5) * cellSize, gridTop - 6);
    }
    // Row headers (gametes B)
    c.textAlign = 'right';
    for (let i = 0; i < cellCount; i++) {
      c.fillText(pq.gameteB[i], gridLeft + cellSize - 4, gridTop + (i + 1.5) * cellSize + 4);
    }

    // Draw cells
    const phenoColors = this._phenoColorMap(pq.phenotypeRatios);
    for (let i = 0; i < cellCount; i++) {
      for (let j = 0; j < cellCount; j++) {
        const geno = pq.cells[i][j];
        const ph = model.phenotype(geno);
        const col = phenoColors[ph] || theme.color('--accent');
        const x = gridLeft + (j + 1) * cellSize;
        const y = gridTop + i * cellSize;
        c.fillStyle = col + '55';
        c.fillRect(x, y, cellSize - 1, cellSize - 1);
        c.strokeStyle = theme.color('--muted');
        c.lineWidth = 0.5;
        c.strokeRect(x, y, cellSize - 1, cellSize - 1);
        c.fillStyle = theme.color('--text');
        c.font = `${Math.min(12, cellSize - 6)}px monospace`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(geno, x + cellSize / 2, y + cellSize / 2);
      }
    }
    c.textBaseline = 'alphabetic';

    // Bar chart: expected vs observed on the right side
    if (observed && observed.length > 0) {
      const chartLeft = gridLeft + (cellCount + 1) * cellSize + 20;
      const chartRight = w - 10;
      const chartBottom = h - 30;
      const chartTop = 30;
      if (chartRight > chartLeft + 60) {
        this._drawBars(c, model, pq.phenotypeRatios, observed, chartLeft, chartTop, chartRight, chartBottom, phenoColors);
      }
    }
  }

  _phenoColorMap(ratios) {
    const palette = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'];
    const map = {};
    ratios.forEach((r, i) => { map[r.label] = palette[i % palette.length]; });
    return map;
  }

  _drawBars(c, model, expected, observed, left, top, right, bottom, colors) {
    const nCat = expected.length;
    const barW = Math.max(4, ((right - left) / nCat - 4) / 2);
    const totalObs = observed.reduce((a, b) => a + b, 0);
    const maxP = 1;
    const axes = new Axes(c, { left, top, right, bottom }, [0, nCat], [0, maxP]);
    axes.grid({ xTicks: [], yTicks: [0, 0.25, 0.5, 0.75, 1] });

    expected.forEach((exp, i) => {
      const x = left + (i + 0.5) * (right - left) / nCat;
      const expH = (exp.p / maxP) * (bottom - top);
      // Expected bar (light)
      c.fillStyle = (colors[exp.label] || '#999') + '66';
      c.fillRect(x - barW - 2, bottom - expH, barW, expH);
      // Observed bar (solid)
      if (observed[i] !== undefined) {
        const obsP = observed[i] / totalObs;
        const obsH = (obsP / maxP) * (bottom - top);
        c.fillStyle = colors[exp.label] || '#999';
        c.fillRect(x + 2, bottom - obsH, barW, obsH);
      }
      // Label
      c.fillStyle = theme.color('--muted');
      c.font = '9px system-ui';
      c.textAlign = 'center';
      c.fillText(exp.label, x, bottom + 12);
    });

    // Legend
    c.font = '9px system-ui';
    c.fillStyle = theme.color('--muted');
    c.fillRect(left, top - 12, 8, 8);
    c.fillStyle = theme.color('--muted') + '66';
    c.fillRect(left + 50, top - 12, 8, 8);
    c.fillStyle = theme.color('--text');
    c.textAlign = 'left';
    c.fillText('Obs', left + 10, top - 4);
    c.fillText('Exp', left + 60, top - 4);
  }
}
