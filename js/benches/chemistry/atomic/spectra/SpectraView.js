/**
 * SpectraView — draws the hydrogen/deuterium spectral series.
 *
 * Layout (top → bottom):
 *   Visible spectrum gradient bar (380–700 nm) with Balmer line overlays.
 *   IR bar (700–2000 nm) with Paschen and Brackett lines.
 *   UV bar (90–380 nm) with Lyman lines.
 *   Selected-line detail text below.
 */
import { theme } from '../../../../core/Theme.js';
import { SpectraModel } from './SpectraModel.js';

/** Greyscale background hex for UV/IR regions. */
const GREY_BAR = '#444';

export class SpectraView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {SpectraModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: W, height: H } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    const margin = { left: 54, right: 12, top: 12 };
    const barH   = 28;  // height of each spectrum bar
    const gap    = 36;  // vertical gap between bars (for labels below)
    const labelY = 10;  // label text above bar

    // Three bars stacked vertically
    const bars = [
      { name: 'UV (Lyman)',        nmMin: 90,   nmMax: 380,  series: ['lyman'],              colour: GREY_BAR },
      { name: 'Visible (Balmer)',  nmMin: 380,  nmMax: 700,  series: ['balmer'],             colour: null },
      { name: 'IR (Paschen / Brackett)', nmMin: 700, nmMax: 2000, series: ['paschen', 'brackett'], colour: GREY_BAR },
    ];

    let y0 = margin.top;
    for (const bar of bars) {
      const x0   = margin.left;
      const bW   = W - margin.left - margin.right;
      const y    = y0 + labelY + 4;

      // Region label
      c.fillStyle = theme.color('--muted');
      c.font = `10px system-ui, sans-serif`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(bar.name, x0, y0 + labelY / 2);

      // Bar background
      if (bar.colour) {
        c.fillStyle = bar.colour;
        c.fillRect(x0, y, bW, barH);
      } else {
        // Visible: rainbow gradient
        const grad = c.createLinearGradient(x0, 0, x0 + bW, 0);
        for (let nm = 380; nm <= 700; nm += 10) {
          grad.addColorStop((nm - 380) / 320, SpectraModel.wavelengthToColor(nm));
        }
        c.fillStyle = grad;
        c.fillRect(x0, y, bW, barH);
      }

      // Spectral lines
      for (const seriesName of bar.series) {
        const s = model.seriesData(seriesName);
        for (const line of s.lines) {
          const lam = model.showAir ? line.lambdaAir : line.lambdaVac;
          if (lam < bar.nmMin || lam > bar.nmMax) continue;

          const px = x0 + ((lam - bar.nmMin) / (bar.nmMax - bar.nmMin)) * bW;

          // Line colour: white on UV/IR bars; wavelength colour on visible
          c.strokeStyle = bar.colour ? '#ffffff' : '#000000';
          c.lineWidth = line.n2 <= 5 ? 2 : 1;
          c.globalAlpha = line.n2 <= 6 ? 1 : 0.6;
          c.beginPath();
          c.moveTo(px, y);
          c.lineTo(px, y + barH);
          c.stroke();
          c.globalAlpha = 1;

          // Label first 4 lines of Balmer with Greek letters
          if (seriesName === 'balmer' && line.n2 <= 6) {
            const greek = ['α', 'β', 'γ', 'δ', 'ε'][line.n2 - 3];
            c.fillStyle = '#000000';
            c.font = `bold 9px system-ui, sans-serif`;
            c.textAlign = 'center';
            c.textBaseline = 'bottom';
            c.fillText(`H${greek}`, px, y);
          }
        }
      }

      // Border
      c.strokeStyle = theme.color('--muted');
      c.lineWidth = 1;
      c.globalAlpha = 0.5;
      c.strokeRect(x0, y, bW, barH);
      c.globalAlpha = 1;

      // x-axis tick labels at edges
      c.fillStyle = theme.color('--muted');
      c.font = `9px system-ui, sans-serif`;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText(`${bar.nmMin} nm`, x0, y + barH + 3);
      c.textAlign = 'right';
      c.fillText(`${bar.nmMax} nm`, x0 + bW, y + barH + 3);

      y0 += labelY + barH + gap;
    }

    // Isotope shift annotation when deuterium is shown
    if (model.isotope === 'D') {
      const balH = new SpectraModel({ isotope: 'H' });
      const balD = model;
      const shift = balH.wavelengthVac(2, 3) - balD.wavelengthVac(2, 3);
      c.fillStyle = theme.color('--muted');
      c.font = `10px system-ui, sans-serif`;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText(`Isotope shift (Balmer-α H−D): ${shift.toFixed(3)} nm`, margin.left, y0);
    }
  }
}
