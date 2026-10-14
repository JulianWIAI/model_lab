/**
 * LacOperonView — three stacked time series (mRNA, LacZ, allolactose).
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

/** Colours for the three state variables. */
const COLORS = {
  mRNA:        '#3498db',
  lacZ:        '#2ecc71',
  allolactose: '#e8a838',
};

/** How many time points to keep for the rolling plot. */
const WINDOW = 400;

export class LacOperonView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    /** Rolling history arrays {t, M, B, A} */
    this._hist = [];
  }

  /**
   * Record a sample from the model (call each frame).
   * @param {import('./LacOperonModel.js').LacOperonModel} model
   */
  record(model) {
    this._hist.push({ t: model.time, M: model.mRNA, B: model.lacZ, A: model.allolactose });
    if (this._hist.length > WINDOW) this._hist.shift();
  }

  clearHistory() { this._hist = []; }

  /** @param {import('./LacOperonModel.js').LacOperonModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: W, height: H } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    if (this._hist.length < 2) return;

    const hist = this._hist;
    const tMin = hist[0].t;
    const tMax = hist[hist.length - 1].t;

    const margin = { top: 8, left: 48, right: 12, bottom: 8 };
    const rowH = Math.floor((H - margin.top - margin.bottom) / 3) - 4;

    const rows = [
      { key: 'M', label: 'mRNA',       color: COLORS.mRNA },
      { key: 'B', label: 'LacZ',       color: COLORS.lacZ },
      { key: 'A', label: 'Allolactose', color: COLORS.allolactose },
    ];

    for (let ri = 0; ri < 3; ri++) {
      const { key, label, color } = rows[ri];
      const y0 = margin.top + ri * (rowH + 4);

      const vals = hist.map((h) => h[key]);
      const maxV = Math.max(...vals) * 1.1 || 0.1;

      const box = { left: margin.left, right: W - margin.right, top: y0, bottom: y0 + rowH };
      const axes = new Axes(c, box, [tMin, tMax], [0, maxV]);

      // Minimal grid: y=0 and y=max only; no x ticks on middle rows
      axes.grid({
        xTicks: ri === 2 ? [tMin, (tMin + tMax) / 2, tMax].map(Math.round) : [],
        yTicks: [0, maxV / 2, maxV],
        yFormat: (v) => v.toFixed(2),
        xLabel: ri === 2 ? 'Time' : '',
        yLabel: '',
      });

      // Row label
      c.fillStyle = color;
      c.font = `bold 9px system-ui, sans-serif`;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText(label, box.left + 2, box.top + 2);

      // Curve
      const pts = hist.map((h) => [h.t, h[key]]);
      axes.polyline(pts, { color, lineWidth: 1.5 });
    }
  }
}
