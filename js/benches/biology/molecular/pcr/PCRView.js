/**
 * PCRView — semi-log copy number vs cycle plot.
 *
 * Two curves:
 *   Coloured: plateau model (actual PCR with saturation)
 *   Grey dashed: ideal exponential reference (no plateau)
 *
 * Horizontal dashed threshold line; vertical Ct marker.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

export class PCRView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./PCRModel.js').PCRModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: W, height: H } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    const margin = { top: 16, bottom: 42, left: 60, right: 16 };
    const box = {
      left:   margin.left,
      right:  W - margin.right,
      top:    margin.top,
      bottom: H - margin.bottom,
    };

    const arr = model.copiesArray();
    const n   = model.nCycles;

    // Log10 range: from log10(N0) − 1 to log10(Nmax) + 0.5
    const yMin = Math.max(0, Math.floor(Math.log10(model.N0)) - 0.5);
    const yMax = Math.log10(model.Nmax) + 0.5;
    const xRange = [0, n];
    const yRange = [yMin, yMax];

    // Generate y ticks at integer log10 values
    const yTicks = [];
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) yTicks.push(y);

    const axes = new Axes(c, box, xRange, yRange);
    const xTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40].filter((v) => v <= n);

    axes.grid({
      xTicks,
      yTicks,
      xLabel: 'Cycle',
      yLabel: 'log₁₀(copies)',
      yFormat: (v) => `10${_sup(v)}`,
    });

    // ── Grey reference: ideal exponential ─────────────────────────
    const expPts = [];
    for (let i = 0; i <= n; i++) {
      const y = Math.log10(model.copiesExponential(i));
      if (isFinite(y)) expPts.push([i, Math.min(y, yMax + 1)]);
    }
    axes.polyline(expPts, { color: theme.color('--muted'), lineWidth: 1, dash: [4, 3] });

    // ── Coloured: plateau model ────────────────────────────────────
    const platPts = [];
    for (let i = 0; i <= n; i++) {
      const y = Math.log10(arr[i]);
      if (isFinite(y)) platPts.push([i, Math.min(y, yMax + 1)]);
    }
    axes.polyline(platPts, { color: theme.color('--accent'), lineWidth: 2 });

    // ── Threshold line ─────────────────────────────────────────────
    const logThr = Math.log10(model.threshold);
    if (logThr >= yMin && logThr <= yMax) {
      c.save();
      c.strokeStyle = theme.color('--accent');
      c.lineWidth = 1;
      c.setLineDash([3, 3]);
      c.globalAlpha = 0.6;
      const py = axes.y(logThr);
      c.beginPath();
      c.moveTo(box.left, py);
      c.lineTo(box.right, py);
      c.stroke();
      c.restore();

      c.fillStyle = theme.color('--muted');
      c.font = `9px system-ui, sans-serif`;
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      c.fillText('threshold', box.left + 2, py - 1);
    }

    // ── Ct marker ─────────────────────────────────────────────────
    const Ct = model.Ct;
    if (Ct !== null) {
      c.save();
      c.strokeStyle = theme.color('--accent');
      c.lineWidth = 1.5;
      c.setLineDash([2, 2]);
      c.globalAlpha = 0.8;
      const px = axes.x(Ct);
      c.beginPath();
      c.moveTo(px, box.top);
      c.lineTo(px, box.bottom);
      c.stroke();
      c.restore();

      c.fillStyle = theme.color('--accent');
      c.font = `bold 10px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(`Ct=${Ct}`, axes.x(Ct), box.top - 2);
    }

    // ── Legend ─────────────────────────────────────────────────────
    const lx = box.right - 4;
    const ly = box.top + 4;

    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.setLineDash([]);
    c.beginPath(); c.moveTo(lx - 28, ly + 5); c.lineTo(lx - 8, ly + 5); c.stroke();
    c.fillStyle = theme.color('--text');
    c.font = `9px system-ui, sans-serif`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillText('Plateau', lx - 30, ly + 5);

    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([4, 3]);
    c.beginPath(); c.moveTo(lx - 28, ly + 18); c.lineTo(lx - 8, ly + 18); c.stroke();
    c.setLineDash([]);
    c.fillStyle = theme.color('--muted');
    c.fillText('Ideal 2ⁿ', lx - 30, ly + 18);
  }
}

/** Convert integer to unicode superscript digits. */
function _sup(n) {
  const map = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return String(n).split('').map((d) => map[+d]).join('');
}
