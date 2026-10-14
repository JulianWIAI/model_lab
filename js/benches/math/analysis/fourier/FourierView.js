import { theme } from '../../../../core/Theme.js';

/** Horizontal pixels per radian of phase in the trailing wave. */
const PIXELS_PER_RADIAN = 60;

/**
 * Draws the stacked rotating circles (epicycles) on the left and the wave
 * they trace on the right, with the target wave dashed behind it.
 */
export class FourierView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    /** @type {{phase: number, y: number}[]} recent tip heights */
    this.trail = [];
  }

  /** Forgets the trace, e.g. after the wave type changes. */
  reset() {
    this.trail = [];
  }

  /**
   * @param {import('./FourierSeries.js').FourierSeries} series
   * @param {number} phase  current angle of the base circle in radians
   */
  draw(series, phase) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    const R = Math.min(h * 0.3, w * 0.14); // radius that a height of 1 maps to
    const cx = Math.min(w * 0.22, R * 1.6 + 10);
    const cy = h / 2;
    const waveStart = cx + R * 1.6;
    // Pixel position of a past phase in the trailing wave
    const xOf = (p) => waveStart + (phase - p) * PIXELS_PER_RADIAN;

    // Guide lines at +1, 0, −1
    c.strokeStyle = theme.color('--grid');
    c.lineWidth = 1;
    for (const y of [cy - R, cy, cy + R]) {
      c.beginPath();
      c.moveTo(waveStart, y);
      c.lineTo(w, y);
      c.stroke();
    }
    c.fillStyle = theme.color('--muted');
    c.font = theme.font(11);
    c.fillText('+1', waveStart + 4, cy - R - 4);
    c.fillText('−1', waveStart + 4, cy + R + 13);

    // Target wave, dashed
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.globalAlpha = 0.6;
    c.setLineDash([4, 4]);
    c.beginPath();
    for (let x = waveStart; x <= w; x += 2) {
      const y = cy - R * series.target(phase - (x - waveStart) / PIXELS_PER_RADIAN);
      x === waveStart ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
    c.restore();

    // Epicycles: each circle rides on the tip of the previous one
    let x = cx;
    let y = cy;
    for (const { n, a } of series.coefficients()) {
      const r = R * Math.abs(a);
      const angle = n * phase + (a < 0 ? Math.PI : 0); // negative amplitude = half-turn offset
      c.save();
      c.strokeStyle = theme.color('--muted');
      c.globalAlpha = 0.35;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      const nx = x + r * Math.cos(angle);
      const ny = y - r * Math.sin(angle);
      c.strokeStyle = theme.color('--ink');
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(nx, ny);
      c.stroke();
      x = nx;
      y = ny;
    }

    // Record the tip height for the trailing wave
    const last = this.trail[0];
    if (!last || last.phase !== phase) this.trail.unshift({ phase, y });
    while (this.trail.length && xOf(this.trail[this.trail.length - 1].phase) > w) this.trail.pop();

    // Connector from tip to the start of the wave
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.globalAlpha = 0.6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(waveStart, y);
    c.stroke();
    c.restore();

    // Trailing wave
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    this.trail.forEach((p, i) => (i ? c.lineTo(xOf(p.phase), p.y) : c.moveTo(xOf(p.phase), p.y)));
    c.stroke();
    c.lineWidth = 1;

    c.fillStyle = theme.color('--accent');
    c.beginPath();
    c.arc(x, y, 3.5, 0, Math.PI * 2);
    c.fill();
  }
}
