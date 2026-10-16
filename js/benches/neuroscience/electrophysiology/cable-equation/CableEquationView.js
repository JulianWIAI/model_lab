/**
 * CableEquationView — steady-state voltage profile along the cable.
 *
 * Shows V(x)/V₀ vs x/λ (normalised axes).
 * Dashed lines at x=λ (V=e^{-1}) and x=2λ.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class CableEquationView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./CableEquationModel.js').CableEquationModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const lam = model.spaceConstant();
    const xMaxNorm = 4;   // show 0 to 4λ
    const V0 = 1;

    const padL = 64, padT = 20, padR = 20, padB = 44;
    const axes = new Axes(
      c,
      { left: padL, top: padT, right: w - padR, bottom: h - padB },
      [0, xMaxNorm],
      [0, 1.05],
    );

    axes.grid({
      xLabel: 'x / λ',
      yLabel: 'V(x) / V₀',
      xTicks: [0, 1, 2, 3, 4],
      yTicks: [0, Math.exp(-1), Math.exp(-2), 1].map(v => parseFloat(v.toFixed(3))),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(3),
    });

    // Curve
    const pts = model.profile(V0, xMaxNorm * lam, 300);
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    pts.forEach((p, i) => {
      const xn = p.x / lam;
      const yn = p.V / V0;
      if (i === 0) c.moveTo(axes.x(xn), axes.y(yn));
      else c.lineTo(axes.x(xn), axes.y(yn));
    });
    c.stroke();
    c.restore();

    // Dashed marks at x=λ
    const e1 = Math.exp(-1);
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    // vertical at x/λ=1
    c.beginPath(); c.moveTo(axes.x(1), axes.y(0)); c.lineTo(axes.x(1), axes.y(e1)); c.stroke();
    // horizontal at V/V0=e^{-1}
    c.beginPath(); c.moveTo(axes.x(0), axes.y(e1)); c.lineTo(axes.x(1), axes.y(e1)); c.stroke();
    c.setLineDash([]);
    c.restore();

    // Label λ
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = '11px monospace';
    c.fillText('λ', axes.x(1) - 4, axes.y(0) + 14);
    c.fillText(`e⁻¹≈${e1.toFixed(3)}`, axes.x(0) + 4, axes.y(e1) - 4);
    c.restore();
  }
}
