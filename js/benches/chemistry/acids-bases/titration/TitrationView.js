/**
 * TitrationView — pH vs volume curve with markers and derivative peak.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

export class TitrationView {
  constructor(canvasView) {
    this.canvasView = canvasView;
    this._currentVb = 0;
  }

  draw(model, currentVb = 0) {
    this._currentVb = currentVb;
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const { volumes, pHs, dpH } = model.curve(150);
    const vMax = volumes[volumes.length - 1];
    const topH = Math.floor(h * 0.65);
    const botH = h - topH - 8;

    // Main pH curve
    const axTop = new Axes(c, { left: 50, top: 10, right: w - 10, bottom: topH - 4 }, [0, vMax], [0, 14]);
    axTop.grid({
      xTicks: [0, model.equivalenceVolume / 2, model.equivalenceVolume, vMax * 0.8].map(v => Math.round(v * 10) / 10),
      yTicks: [0, 2, 4, 6, 7, 8, 10, 12, 14],
      xLabel: 'Volume NaOH (mL)',
      yLabel: 'pH',
    });

    // Buffer region shading (weak acid only)
    if (model.acidType === 'weak' && model.pKa !== null) {
      const bufLow = model.halfEquivalenceVolume * 0.5;
      const bufHigh = model.halfEquivalenceVolume * 1.5;
      // shade pKa ± 1 pH region
    }

    // pH curve
    const curve = volumes.map((v, i) => [v, pHs[i]]);
    axTop.polyline(curve, { color: theme.color('--accent'), lineWidth: 2 });

    // Equivalence point
    const eqPH = model.solve(model.equivalenceVolume);
    axTop.point([model.equivalenceVolume, eqPH], { color: theme.color('--accent'), r: 5 });
    c.fillStyle = theme.color('--accent');
    c.font = '10px system-ui';
    c.textAlign = 'left';
    c.fillText(`Veq=${model.equivalenceVolume.toFixed(1)} mL`, 52 + (model.equivalenceVolume / vMax) * (w - 62), topH - 14);

    // pKa line (weak acid)
    if (model.acidType === 'weak' && model.pKa !== null) {
      axTop.polyline([[0, model.pKa], [vMax, model.pKa]], { color: theme.color('--muted'), dash: [4, 4] });
      axTop.point([model.halfEquivalenceVolume, model.pKa], { color: theme.color('--muted'), r: 4 });
    }

    // dpH/dV peak chart
    const maxDpH = Math.max(...dpH.map(Math.abs)) * 1.2;
    if (maxDpH > 0 && botH > 30) {
      const axBot = new Axes(c, { left: 50, top: topH + 8, right: w - 10, bottom: h - 4 }, [0, vMax], [0, maxDpH]);
      axBot.grid({ xTicks: [], yTicks: [0, maxDpH / 2], yLabel: 'dpH/dV' });
      const dpHCurve = volumes.map((v, i) => [v, Math.max(0, dpH[i])]);
      axBot.polyline(dpHCurve, { color: theme.color('--accent'), lineWidth: 1.5 });
    }
  }
}
