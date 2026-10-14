/**
 * CentralDogmaView — draws the central dogma: DNA → mRNA → ribosome → protein.
 *
 * Layout (top to bottom):
 *   - DNA coding strand (bases coloured)
 *   - mRNA strand below with current codon highlighted
 *   - Ribosome block sliding along mRNA
 *   - Growing protein chain (amino acid beads)
 *
 * All colours come from theme tokens.
 */
import { theme } from '../../../../core/Theme.js';
import { AMINO_ACIDS } from '../../../../data/geneticCode.js';

const BASE_COLORS = {
  A: '#e74c3c', T: '#3498db', G: '#2ecc71', C: '#f39c12',
  U: '#3498db', // U uses same colour as T (replaces it in RNA)
};

export class CentralDogmaView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const dna = model.dnaCoding;
    const mrna = model.mrna;
    const protein = model.translate();
    const ribIdx = model.ribosomeCodonIndex;

    const baseW = Math.min(20, Math.floor((w - 40) / Math.max(dna.length, 1)));
    const startX = 20;

    // === DNA strand ===
    const dnaY = 40;
    this._drawLabel(c, 'DNA (coding)', startX, dnaY - 18);
    for (let i = 0; i < dna.length; i++) {
      this._drawBase(c, dna[i], startX + i * baseW, dnaY, baseW - 2, 18, false);
    }

    // === mRNA strand ===
    const mrnaY = dnaY + 60;
    this._drawLabel(c, 'mRNA', startX, mrnaY - 18);
    const startCodonPos = mrna.indexOf('AUG');
    for (let i = 0; i < mrna.length; i++) {
      // Highlight current codon
      let highlighted = false;
      if (ribIdx >= 0 && startCodonPos >= 0) {
        const codonStart = startCodonPos + ribIdx * 3;
        highlighted = i >= codonStart && i < codonStart + 3;
      }
      this._drawBase(c, mrna[i], startX + i * baseW, mrnaY, baseW - 2, 18, highlighted);
    }

    // === Ribosome ===
    const riboY = mrnaY + 36;
    if (ribIdx >= 0 && startCodonPos >= 0) {
      const riboX = startX + (startCodonPos + ribIdx * 3) * baseW - 4;
      const riboW = baseW * 3 + 8;
      c.fillStyle = theme.color('--accent');
      c.globalAlpha = 0.25;
      c.fillRect(riboX, mrnaY - 4, riboW, 26);
      c.globalAlpha = 1;
      c.strokeStyle = theme.color('--accent');
      c.lineWidth = 2;
      c.strokeRect(riboX, mrnaY - 4, riboW, 26);
      // Ribosome label
      c.fillStyle = theme.color('--accent');
      c.font = 'bold 11px system-ui';
      c.textAlign = 'center';
      c.fillText('ribosome', riboX + riboW / 2, riboY + 14);
    }

    // === Growing protein chain ===
    const protY = riboY + 44;
    this._drawLabel(c, 'Protein', startX, protY - 4);
    const beadR = Math.min(14, baseW * 0.9);
    const visibleAAs = ribIdx >= 0 ? protein.slice(0, ribIdx + 1) : [];
    for (let i = 0; i < visibleAAs.length; i++) {
      const { aa } = visibleAAs[i];
      const aaData = AMINO_ACIDS.find(a => a.abbrev3 === aa);
      const col = aaData ? aaData.color : '#bbb';
      const cx = startX + i * (beadR * 2 + 4) + beadR;
      const cy = protY + 20;
      c.beginPath();
      c.arc(cx, cy, beadR, 0, Math.PI * 2);
      c.fillStyle = col;
      c.fill();
      c.strokeStyle = theme.color('--surface');
      c.lineWidth = 1.5;
      c.stroke();
      c.fillStyle = '#fff';
      c.font = `bold ${Math.max(8, beadR - 2)}px system-ui`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(aaData ? aaData.abbrev1 : '?', cx, cy);
      // Peptide bond line
      if (i > 0) {
        const prevX = startX + (i - 1) * (beadR * 2 + 4) + beadR + beadR;
        c.beginPath();
        c.moveTo(prevX + 2, cy);
        c.lineTo(cx - beadR - 2, cy);
        c.strokeStyle = theme.color('--muted');
        c.lineWidth = 1.5;
        c.stroke();
      }
    }

    c.textBaseline = 'alphabetic';
  }

  _drawLabel(c, text, x, y) {
    c.fillStyle = theme.color('--muted');
    c.font = '11px system-ui';
    c.textAlign = 'left';
    c.fillText(text, x, y);
  }

  _drawBase(c, base, x, y, bw, bh, highlighted) {
    const col = BASE_COLORS[base] || theme.color('--muted');
    c.fillStyle = highlighted ? col : col + '99';
    c.beginPath();
    c.roundRect ? c.roundRect(x, y, bw, bh, 3) : c.rect(x, y, bw, bh);
    c.fill();
    if (highlighted) {
      c.strokeStyle = col;
      c.lineWidth = 1.5;
      c.stroke();
    }
    if (bw >= 10) {
      c.fillStyle = '#fff';
      c.font = `bold ${Math.min(12, bw - 2)}px monospace`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(base, x + bw / 2, y + bh / 2);
    }
    c.textBaseline = 'alphabetic';
  }
}
