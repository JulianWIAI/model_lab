import { theme } from '../../../core/Theme.js';
import { QUARKS } from './QuarkData.js';

/**
 * Draws the quarks as coloured spheres joined by wavy gluon "flux tubes".
 * Baryons sit in a triangle, mesons in a pair.
 */
export class QuarkView {
  /** @param {import('../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./HadronBuilder.js').HadronBuilder} builder
   * @param {number} time  seconds, drives the jiggle and the flux-tube waves
   * @param {boolean} still  true when reduced motion is requested
   */
  draw(builder, time, still) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    const cx = w / 2;
    const cy = h / 2 + 8;
    const ring = Math.min(w, h) * 0.27;
    const radius = Math.max(22, Math.min(w, h) * 0.07);
    const colours = [theme.color('--qr'), theme.color('--qg'), theme.color('--qb')];
    const count = builder.capacity;

    // Slot positions; a small jiggle hints that quarks are never at rest.
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count + (count === 2 ? Math.PI / 2 : 0);
      const jiggle = still ? 0 : 4 * Math.sin(time * 3 + i * 2.1);
      positions.push([cx + (ring + jiggle) * Math.cos(angle), cy + (ring + jiggle) * Math.sin(angle)]);
    }

    this.#drawFluxTubes(c, positions, builder.slots, time, still);

    positions.forEach(([x, y], i) => {
      const symbol = builder.slots[i];
      if (!symbol) {
        this.#drawEmptySlot(c, x, y, radius);
        return;
      }
      // Baryon: one quark of each colour. Meson: colour and anticolour swap over time.
      const colour = count === 3 ? colours[i] : colours[Math.floor(time / 1.2) % 3];
      this.#drawQuark(c, x, y, radius, symbol, colour);
    });

    c.font = theme.font(11);
    c.fillStyle = theme.color('--muted');
    c.textAlign = 'left';
    c.fillText(count === 3 ? 'colour charges red + green + blue = neutral' : 'colour + anticolour = neutral', 12, 18);
  }

  /** Wavy lines between filled slots, standing in for the gluon field. */
  #drawFluxTubes(c, positions, slots, time, still) {
    const links = positions.length === 3 ? [[0, 1], [1, 2], [2, 0]] : [[0, 1]];
    c.save();
    c.lineWidth = 2;
    c.strokeStyle = theme.color('--muted');
    c.globalAlpha = 0.6;
    for (const [a, b] of links) {
      if (slots[a] === undefined || slots[b] === undefined) continue;
      const [x1, y1] = positions[a];
      const [x2, y2] = positions[b];
      const length = Math.hypot(x2 - x1, y2 - y1) || 1;
      const nx = -(y2 - y1) / length; // unit normal to the link
      const ny = (x2 - x1) / length;
      c.beginPath();
      for (let s = 0; s <= 40; s++) {
        const t = s / 40;
        const wave = (still ? 0 : Math.sin(t * Math.PI * 8 - time * 8)) * 5 * Math.sin(t * Math.PI);
        const px = x1 + (x2 - x1) * t + nx * wave;
        const py = y1 + (y2 - y1) * t + ny * wave;
        s ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
    }
    c.restore();
  }

  #drawEmptySlot(c, x, y, radius) {
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  /** Quarks are solid; antiquarks are drawn as rings. */
  #drawQuark(c, x, y, radius, symbol, colour) {
    const anti = QUARKS[symbol].anti;
    c.save();
    c.fillStyle = colour;
    c.globalAlpha = anti ? 0.25 : 0.9;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    if (anti) {
      c.strokeStyle = colour;
      c.lineWidth = 3;
      c.stroke();
    }
    c.fillStyle = anti ? theme.color('--ink') : theme.color('--panel');
    c.font = theme.font(Math.round(radius * 0.9), 'sans', 600);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(symbol, x, y + 1);
    c.restore();
  }
}
