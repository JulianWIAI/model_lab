/**
 * BufferView — buffer capacity curve (β vs pH) and species fractions.
 *
 * Left panel (~55 %): β vs pH with vertical dashed lines at each pKa.
 * Right panel (~45 %): stacked-area speciation chart (α₀…αₙ vs pH).
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

/** Fixed colour palette for species (0 = fully protonated … n = fully deprotonated). */
const SPECIES_COLORS = ['#e74c3c', '#e8a838', '#2ecc71', '#3498db', '#9b59b6'];

export class BufferView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./BufferModel.js').BufferModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: W, height: H } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    const margin = { top: 24, bottom: 36, left: 52, right: 8 };
    const splitX = Math.floor(W * 0.55);

    const { pHs, betas, fractionCurves } = model.capacityCurve(300);
    const maxBeta = Math.max(...betas) * 1.1 || 0.1;

    // ── Left: β vs pH ─────────────────────────────────────────────
    const leftBox = { left: margin.left, right: splitX - 4, top: margin.top, bottom: H - margin.bottom };
    const axL = new Axes(c, leftBox, [0, 14], [0, maxBeta]);

    const pHaTicks = [0, 2, 4, 6, 7, 8, 10, 12, 14];
    axL.grid({
      xTicks: pHaTicks,
      yTicks: [],
      xLabel: 'pH',
      yLabel: 'β (mol/L/pH)',
    });

    // β curve
    const ptsB = Array.from(pHs).map((pH, i) => [pH, betas[i]]);
    axL.polyline(ptsB, { color: theme.color('--accent'), lineWidth: 2 });

    // Vertical dashed lines at each pKa
    const preset = model.preset;
    for (const pKa of preset.pKas) {
      const px = axL.x(pKa);
      c.save();
      c.strokeStyle = theme.color('--muted');
      c.lineWidth = 1;
      c.setLineDash([3, 3]);
      c.beginPath();
      c.moveTo(px, leftBox.top);
      c.lineTo(px, leftBox.bottom);
      c.stroke();
      c.restore();

      // pKa label
      c.fillStyle = theme.color('--muted');
      c.font = `9px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(`pKₐ=${pKa.toFixed(2)}`, px, leftBox.top + 1);
    }

    // ── Right: species fractions ───────────────────────────────────
    const rightBox = { left: splitX + 4, right: W - margin.right, top: margin.top, bottom: H - margin.bottom };
    const axR = new Axes(c, rightBox, [0, 14], [0, 1]);

    axR.grid({
      xTicks: [0, 4, 7, 10, 14],
      yTicks: [0, 0.5, 1],
      yFormat: (v) => v.toFixed(1),
      xLabel: 'pH',
      yLabel: 'α',
    });

    // Stacked area for each species
    const n  = fractionCurves.length;
    const nP = pHs.length;

    // Compute cumulative stacks
    const cumulative = new Float64Array(nP);
    for (let k = 0; k < n; k++) {
      // Draw filled area from cumulative[i] to cumulative[i]+alpha_k[i]
      const color = SPECIES_COLORS[k % SPECIES_COLORS.length];
      c.beginPath();
      // Bottom edge (cumulative)
      c.moveTo(axR.x(pHs[0]), axR.y(cumulative[0]));
      for (let i = 1; i < nP; i++) c.lineTo(axR.x(pHs[i]), axR.y(cumulative[i]));
      // Top edge (cumulative + alpha_k), reversed
      for (let i = nP - 1; i >= 0; i--) {
        cumulative[i] += fractionCurves[k][i];
        c.lineTo(axR.x(pHs[i]), axR.y(cumulative[i]));
      }
      c.closePath();
      c.fillStyle = color;
      c.globalAlpha = 0.75;
      c.fill();
      c.globalAlpha = 1;

      // Re-compute cumulative (it was updated in the reversed loop above)
    }

    // Legend for species
    const labels = preset.pKas.map((_, i) => {
      const ch = preset.pKas.length;
      if (i === 0) return `${preset.formula}`;
      return `−${i}H`;
    });
    labels[0] = `${preset.formula} (fully protonated)`;
    // Simplified: just show α₀, α₁ … αₙ labels
    for (let k = 0; k < n; k++) {
      const lx = rightBox.right - 4;
      const ly = rightBox.top + k * 14;
      c.fillStyle = SPECIES_COLORS[k % SPECIES_COLORS.length];
      c.fillRect(lx - 20, ly, 12, 8);
      c.fillStyle = theme.color('--muted');
      c.font = `9px system-ui, sans-serif`;
      c.textAlign = 'right';
      c.textBaseline = 'top';
      c.fillText(`α${_sub(k)}`, lx - 24, ly);
    }
  }
}

/** Convert number to unicode subscript digits. */
function _sub(n) {
  return String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
}
