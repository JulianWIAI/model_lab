/**
 * OrbitalView — density heatmap (xz-plane) and radial distribution plot.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

export class OrbitalView {
  constructor(canvasView) {
    this.canvasView = canvasView;
    this._imageData = null;
    this._lastKey = null;
  }

  draw(model) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const halfW = Math.floor(w / 2) - 4;
    const heatSize = Math.min(halfW, h - 40);

    // Left: density heatmap
    this._drawHeatmap(c, model, 10, 20, heatSize);

    // Right: radial distribution
    const plotLeft = heatSize + 24;
    if (plotLeft + 80 < w) {
      this._drawRadial(c, model, plotLeft, 20, w - plotLeft - 8, h - 40);
    }
  }

  _drawHeatmap(c, model, x0, y0, size) {
    const pixels = 120; // lower res for performance
    const key = `${model.n},${model.l},${model.m},${pixels}`;
    if (key !== this._lastKey) {
      const heatmap = model.getHeatmap(pixels);
      const id = c.createImageData(pixels, pixels);
      // Colour: 0→background, 1→accent
      const bgR = 30, bgG = 30, bgB = 40; // dark fallback; overridden by theme below
      for (let i = 0; i < pixels * pixels; i++) {
        const v = Math.pow(heatmap[i], 0.5); // gamma 0.5 to brighten weak density
        const idx = i * 4;
        id.data[idx]     = Math.round(v * 80 + (1 - v) * bgR);
        id.data[idx + 1] = Math.round(v * 160 + (1 - v) * bgG);
        id.data[idx + 2] = Math.round(v * 220 + (1 - v) * bgB);
        id.data[idx + 3] = 255;
      }
      this._imageData = id;
      this._lastKey = key;
    }
    // Scale imageData to heatSize
    const tmp = document.createElement ? null : null; // canvas not available in Node
    c.save();
    // Draw imageData scaled
    const tmpCanvas = c.canvas ? null : null;
    // Use drawImage with scaling via a temporary offscreen canvas if available
    // In browser, create offscreen canvas
    if (typeof OffscreenCanvas !== 'undefined') {
      const off = new OffscreenCanvas(pixels, pixels);
      const octx = off.getContext('2d');
      octx.putImageData(this._imageData, 0, 0);
      c.drawImage(off, x0, y0, size, size);
    } else {
      // Fallback: draw pixels directly (slower)
      c.putImageData(this._imageData, x0, y0);
    }
    c.restore();

    // Border and label
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.strokeRect(x0, y0, size, size);
    c.fillStyle = theme.color('--muted');
    c.font = '10px system-ui';
    c.textAlign = 'center';
    c.fillText(`|ψ|² (xz-plane)  n=${model.n} l=${model.l} m=${model.m}`, x0 + size / 2, y0 + size + 14);
  }

  _drawRadial(c, model, left, top, width, height) {
    const rMax = Math.max(20, 6 * model.n * model.n);
    const nPoints = 300;
    const pts = [];
    let maxPr = 0;
    for (let i = 0; i < nPoints; i++) {
      const r = (i + 0.5) * rMax / nPoints;
      const Pr = model.radialDistribution(r);
      pts.push([r, Pr]);
      if (Pr > maxPr) maxPr = Pr;
    }
    const axes = new Axes(c, { left, top, right: left + width, bottom: top + height }, [0, rMax], [0, maxPr * 1.1]);
    axes.grid({
      xTicks: [0, rMax * 0.25, rMax * 0.5, rMax * 0.75, rMax].map(v => Math.round(v)),
      yTicks: [],
      xLabel: 'r (a₀)',
      yLabel: 'r²·R²',
    });
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2 });

    // Mark most probable radius
    const rMPR = model.mostProbableRadius;
    axes.polyline([[rMPR, 0], [rMPR, maxPr * 0.9]], { color: theme.color('--accent'), dash: [3, 3] });
    c.fillStyle = theme.color('--accent');
    c.font = '9px system-ui';
    c.textAlign = 'center';
    const px = left + (rMPR / rMax) * width;
    c.fillText(`r=${rMPR.toFixed(1)}`, px, top - 4);
  }
}
