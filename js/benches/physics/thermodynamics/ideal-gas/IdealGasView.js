/**
 * IdealGasView — 2D XY-projection of a 3D ideal-gas particle simulation.
 *
 * Draws particles as coloured circles (speed → colour: blue=slow, red=fast).
 * Draws the box boundary. Optionally shows z-depth via opacity.
 */
import { theme } from '../../../../core/Theme.js';

export class IdealGasView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./IdealGasModel.js').IdealGasModel} model
   * @param {number} vMax  maximum speed for colour scale (set to v_rms or similar)
   */
  draw(model, vMax) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad = 20;
    const boxSize = Math.min(w, h) - 2 * pad;
    const ox = (w - boxSize) / 2 + pad;
    const oy = pad;
    const scale = boxSize / model.L;

    // Box outline
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1.5;
    c.strokeRect(ox, oy, boxSize, boxSize);
    c.restore();

    // Label: "XY projection (3D simulation)"
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = `10px monospace`;
    c.textAlign = 'left';
    c.fillText('XY projection (3D)', ox + 4, oy + boxSize - 5);
    c.restore();

    // Particles
    const pts = model.particles;
    for (const { x, y, z, speed } of pts) {
      const px = ox + x * scale;
      const py = oy + (model.L - y) * scale;  // flip y so +y is up
      // Speed-based colour: blue (0) → cyan → green → yellow → red (vMax)
      const t  = Math.min(speed / (vMax || 1), 1);
      const col = speedColor(t);
      // Depth-based opacity: z=0 (front) → full; z=L (back) → 40%
      const alpha = 0.4 + 0.6 * (1 - z / model.L);
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = col;
      c.beginPath();
      c.arc(px, py, 3, 0, 2 * Math.PI);
      c.fill();
      c.restore();
    }
  }
}

/**
 * Map t ∈ [0,1] to a colour string via blue→cyan→green→yellow→red.
 * @param {number} t
 * @returns {string}  CSS colour
 */
function speedColor(t) {
  // Four segments: 0→0.25→0.5→0.75→1
  let r, g, b;
  if (t < 0.25) {
    const s = t / 0.25;
    r = 0; g = Math.round(255 * s); b = 255;
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    r = 0; g = 255; b = Math.round(255 * (1 - s));
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    r = Math.round(255 * s); g = 255; b = 0;
  } else {
    const s = (t - 0.75) / 0.25;
    r = 255; g = Math.round(255 * (1 - s)); b = 0;
  }
  return `rgb(${r},${g},${b})`;
}
