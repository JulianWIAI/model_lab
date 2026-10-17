/**
 * IsingView — draws the spin lattice and magnetisation curve.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class IsingView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const L = model.L;
    const cellSize = Math.min((w * 0.45) / L, (h - 40) / L);
    const ox = 10, oy = 20;

    // Draw the spin lattice
    for (let r = 0; r < L; r++) {
      for (let col = 0; col < L; col++) {
        const s = model.spins[r * L + col];
        c.fillStyle = s > 0 ? theme.color('--accent') : theme.color('--third');
        c.fillRect(ox + col * cellSize, oy + r * cellSize, cellSize - 0.5, cellSize - 0.5);
      }
    }

    // Draw magnetisation readout
    const m = model.magnetisation();
    c.fillStyle = theme.color('--text');
    c.font = '12px sans-serif';
    c.textAlign = 'left';
    c.fillText(`m = ${m.toFixed(4)}`, ox, h - 5);

    // Right-side axes: energy histogram placeholder (just draw T and E readout)
    const E = model.energy();
    const axLeft = w * 0.55;
    c.fillText(`E = ${E.toFixed(1)}`, axLeft, h - 5);
    c.fillText(`T = ${model.T.toFixed(3)}, Tc = ${model.Tc.toFixed(4)}`, axLeft, oy);

    // Draw a simple bar for |m|
    const barW = w * 0.35;
    const barH = 16;
    const barY = h / 2 - barH / 2;
    c.strokeStyle = theme.color('--muted');
    c.strokeRect(axLeft, barY, barW, barH);
    c.fillStyle = theme.color('--signal');
    c.fillRect(axLeft, barY, barW * Math.abs(m), barH);
    c.fillStyle = theme.color('--text');
    c.fillText(`|m| = ${Math.abs(m).toFixed(4)}`, axLeft, barY - 4);
  }
}
