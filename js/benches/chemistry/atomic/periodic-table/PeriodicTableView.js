/**
 * PeriodicTableView — two views: 18×7 grid table and periodic trend line plot.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

// Standard periodic table layout: [Z, group, period] for main group + d/p block
// f-block lanthanides/actinides shown as extra rows
export class PeriodicTableView {
  constructor(canvasView) {
    this.canvasView = canvasView;
    this.showTrend = false;
  }

  draw(model) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    if (this.showTrend) {
      this._drawTrend(c, w, h, model);
    } else {
      this._drawTable(c, w, h, model);
    }
  }

  _drawTable(c, w, h, model) {
    const propVals = model.propertyValues();
    const vals = propVals.map(p => p.value).filter(v => v !== null);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);

    // 18 groups × 7 periods + 2 extra rows for f-block
    const rows = 9; // 7 main + 2 f-block
    const cols = 18;
    const cellW = Math.floor((w - 4) / cols);
    const cellH = Math.floor((h - 4) / rows);

    model.data.forEach((el) => {
      let col, row;
      if (el.block === 'f') {
        // Lanthanides (Z=57-71) in row 8, actinides (Z=89-103) in row 9
        if (el.period === 6) { col = el.Z - 57 + 3; row = 8; }
        else { col = el.Z - 89 + 3; row = 9; }
      } else {
        col = el.group || 1;
        row = el.period;
      }
      if (!col || !row) return;

      const x = (col - 1) * cellW + 2;
      const y = (row - 1) * cellH + 2;
      const val = el[model.property];
      const color = val !== null ? this._propColor(val, minV, maxV) : theme.color('--muted') + '44';
      const isSelected = model.selected === el.Z;

      c.fillStyle = color;
      c.fillRect(x, y, cellW - 1, cellH - 1);
      if (isSelected) {
        c.strokeStyle = theme.color('--accent');
        c.lineWidth = 2;
        c.strokeRect(x + 1, y + 1, cellW - 3, cellH - 3);
      }
      if (cellW >= 18) {
        c.fillStyle = theme.color('--text');
        c.font = `${Math.min(9, cellW - 4)}px system-ui`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(el.symbol, x + cellW / 2 - 0.5, y + cellH / 2);
      }
    });
    c.textBaseline = 'alphabetic';
  }

  _drawTrend(c, w, h, model) {
    const propVals = model.propertyValues().filter(p => p.value !== null);
    const maxZ = 118;
    const maxV = Math.max(...propVals.map(p => p.value));
    const axes = new Axes(c, { left: 50, top: 16, right: w - 12, bottom: h - 24 }, [0, maxZ], [0, maxV * 1.1]);
    axes.grid({
      xTicks: [0, 20, 40, 60, 80, 100, 118],
      yTicks: [0, maxV / 2, maxV],
      xLabel: 'Atomic number Z',
      yLabel: model.property,
    });
    const pts = propVals.map(p => [p.Z, p.value]);
    pts.sort((a, b) => a[0] - b[0]);
    // Draw line
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 1.5 });
    // Mark selected
    if (model.selected) {
      const el = model.byZ(model.selected);
      if (el && el[model.property] !== null) {
        axes.point([el.Z, el[model.property]], { color: theme.color('--accent'), r: 5 });
      }
    }
  }

  _propColor(val, min, max) {
    const t = max > min ? (val - min) / (max - min) : 0.5;
    const r = Math.round(30 + t * 200);
    const g = Math.round(100 + t * 60);
    const b = Math.round(220 - t * 160);
    return `rgb(${r},${g},${b})`;
  }
}
