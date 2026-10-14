/**
 * GeneticCodeView — concentric codon-wheel diagram.
 *
 * Three rings:
 *   Inner (radius 25 %): 4 sectors — 1st base (U/C/A/G).
 *   Middle (radius 50 %): 16 sectors — 2nd base.
 *   Outer (radius 75 %): 64 cells — 3rd base, coloured by amino acid.
 *
 * A selected codon highlights its outer cell and greys out non-synonymous
 * neighbours.
 */
import { theme } from '../../../../core/Theme.js';
import { CODONS } from '../../../../data/geneticCode.js';

const BASES = ['U', 'C', 'A', 'G'];
const TWO_PI = 2 * Math.PI;

export class GeneticCodeView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./GeneticCodeModel.js').GeneticCodeModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: W, height: H } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    // Leave room for a legend strip at bottom
    const legendH = 48;
    const cx = W / 2;
    const cy = (H - legendH) / 2;
    const Rmax = Math.min(cx, cy) * 0.92;

    const r1 = Rmax * 0.22; // inner ring outer edge
    const r2 = Rmax * 0.48; // middle ring outer edge
    const r3 = Rmax * 0.80; // outer ring outer edge

    const sel = model.selected;
    const syns = sel ? new Set(model.synonymousMutations(sel)) : null;
    syns?.add(sel);

    // Each codon occupies 1/64 of the circle → angle = TWO_PI/64
    // Order: b1 fastest changing outermost, b3 fastest in outer ring
    // Standard codon wheel: first base divides into 4 quadrants,
    // second base into 4 each, third base into 4 each (UCAG order)

    c.save();
    c.translate(cx, cy);

    // ── Outer ring (3rd base) ──────────────────────────────────────
    const dA = TWO_PI / 64;
    let idx = 0;
    for (const b1 of BASES) {
      for (const b2 of BASES) {
        for (const b3 of BASES) {
          const codon = b1 + b2 + b3;
          const aa = CODONS[codon];
          const startA = idx * dA - Math.PI / 2; // start at top
          const endA   = startA + dA;

          // Colour by amino acid
          const isSelected = codon === sel;
          const isSyn      = syns && syns.has(codon);
          let baseColor = model.aaInfo(aa)?.color ?? '#aaaaaa';

          if (sel) {
            if (isSelected) {
              baseColor = '#ffffff';
            } else if (!isSyn) {
              baseColor = theme.color('--surface'); // grey out
            }
          }

          c.beginPath();
          c.moveTo(r2 * Math.cos(startA), r2 * Math.sin(startA));
          c.arc(0, 0, r3, startA, endA);
          c.arc(0, 0, r2, endA, startA, true);
          c.closePath();
          c.fillStyle = baseColor;
          c.fill();
          c.strokeStyle = theme.color('--surface');
          c.lineWidth = 0.5;
          c.stroke();

          // 3rd base label (only enough room for a letter at large radii)
          const midA = startA + dA / 2;
          const labelR = (r2 + r3) / 2;
          c.save();
          c.translate(labelR * Math.cos(midA), labelR * Math.sin(midA));
          c.rotate(midA + Math.PI / 2);
          c.fillStyle = (isSelected || isSyn || !sel) ? '#111111' : theme.color('--muted');
          c.font = `bold ${Math.max(7, Math.floor(dA * r2 * 0.55))}px system-ui, sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(b3, 0, 0);
          c.restore();

          idx++;
        }
      }
    }

    // ── Middle ring (2nd base) ─────────────────────────────────────
    const dA2 = TWO_PI / 16;
    idx = 0;
    for (const b1 of BASES) {
      for (const b2 of BASES) {
        const startA = idx * dA2 - Math.PI / 2;
        const endA   = startA + dA2;
        c.beginPath();
        c.moveTo(r1 * Math.cos(startA), r1 * Math.sin(startA));
        c.arc(0, 0, r2, startA, endA);
        c.arc(0, 0, r1, endA, startA, true);
        c.closePath();
        c.fillStyle = theme.color('--grid');
        c.fill();
        c.strokeStyle = theme.color('--surface');
        c.lineWidth = 1;
        c.stroke();

        const midA = startA + dA2 / 2;
        const labelR = (r1 + r2) / 2;
        c.fillStyle = theme.color('--text');
        c.font = `${Math.floor(dA2 * labelR * 0.35)}px system-ui, sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.save();
        c.translate(labelR * Math.cos(midA), labelR * Math.sin(midA));
        c.rotate(midA + Math.PI / 2);
        c.fillText(b2, 0, 0);
        c.restore();
        idx++;
      }
    }

    // ── Inner ring (1st base) ──────────────────────────────────────
    const dA1 = TWO_PI / 4;
    const baseColors1 = ['#3a86ff', '#ff6b6b', '#2ec4b6', '#ff9f1c'];
    for (let i = 0; i < 4; i++) {
      const startA = i * dA1 - Math.PI / 2;
      const endA   = startA + dA1;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, r1, startA, endA);
      c.closePath();
      c.fillStyle = baseColors1[i];
      c.fill();
      c.strokeStyle = theme.color('--surface');
      c.lineWidth = 1.5;
      c.stroke();

      const midA = startA + dA1 / 2;
      const labelR = r1 * 0.65;
      c.fillStyle = '#ffffff';
      c.font = `bold ${Math.floor(r1 * 0.32)}px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(BASES[i], labelR * Math.cos(midA), labelR * Math.sin(midA));
    }

    c.restore(); // un-translate

    // ── Legend strip ───────────────────────────────────────────────
    this._drawLegend(c, W, H - legendH + 4);

    // ── Selected codon annotation ──────────────────────────────────
    if (sel) {
      const aa = CODONS[sel];
      const info = model.aaInfo(aa);
      const text = `${sel} → ${aa}${info ? ` (${info.name})` : ''}`;
      const synCount = syns ? syns.size - 1 : 0;
      c.fillStyle = theme.color('--text');
      c.font = `13px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(text, W / 2, 6);
      c.font = `11px system-ui, sans-serif`;
      c.fillStyle = theme.color('--muted');
      c.fillText(`${synCount} synonymous neighbour${synCount !== 1 ? 's' : ''}`, W / 2, 22);
    }
  }

  _drawLegend(c, W, y) {
    // Show a colour key for amino acid classes
    const classes = [
      { label: 'Nonpolar',   color: '#e8a838' },
      { label: 'Polar',      color: '#2ecc71' },
      { label: 'Charged +',  color: '#3498db' },
      { label: 'Charged −',  color: '#e74c3c' },
      { label: 'Special',    color: '#9b59b6' },
      { label: 'Stop',       color: '#95a5a6' },
    ];
    const sw = W / classes.length;
    for (let i = 0; i < classes.length; i++) {
      const x = i * sw + sw / 2;
      c.fillStyle = classes[i].color;
      c.fillRect(x - sw * 0.35, y, sw * 0.7, 10);
      c.fillStyle = theme.color('--muted');
      c.font = `9px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(classes[i].label, x, y + 13);
    }
  }
}
