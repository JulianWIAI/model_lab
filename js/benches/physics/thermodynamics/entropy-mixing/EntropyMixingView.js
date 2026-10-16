/**
 * EntropyMixingView — bar chart of mole fractions + ΔS_mix curve for binary case.
 *
 * Left (60%): ΔS_mix vs x₁ curve for binary mixture; vertical line at current x₁.
 * Right (40%): horizontal bar showing component fractions with labels.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class EntropyMixingView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./EntropyMixingModel.js').EntropyMixingModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const isBinary = model.components.length === 2;

    if (isBinary) {
      this._drawCurvePanel(c, model, w, h);
    } else {
      this._drawMultiPanel(c, model, w, h);
    }
  }

  _drawCurvePanel(c, model, w, h) {
    const padL = 64, padT = 20, padR = 24, padB = 44;
    const { R_GAS } = model.constructor;

    // ΔS_max = R·ln2 for binary
    const dSmax = 6.02214076e23 * 1.380649e-23 * Math.LN2;

    const axes = new Axes(
      c,
      { left: padL, top: padT, right: w - padR, bottom: h - padB },
      [0, 1],
      [0, dSmax * 1.1],
    );

    axes.grid({
      xLabel: 'x₁ (mole fraction)',
      yLabel: 'ΔS_mix (J/mol·K)',
      xTicks: [0, 0.25, 0.5, 0.75, 1.0],
      yTicks: [0, dSmax * 0.5, dSmax, dSmax * 1.05].map(v => parseFloat(v.toFixed(3))),
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    // Curve
    const pts = model.binaryCurve(200);
    c.save();
    c.strokeStyle = theme.color('--accent');
    c.lineWidth = 2;
    c.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) c.moveTo(axes.x(p.x), axes.y(p.dS));
      else c.lineTo(axes.x(p.x), axes.y(p.dS));
    });
    c.stroke();
    c.restore();

    // Current x₁ vertical line
    const x1 = model.components[0].x;
    const dS  = model.deltaS();
    c.save();
    c.strokeStyle = theme.color('--ink') + '80';
    c.setLineDash([4, 3]);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(axes.x(x1), axes.y(0));
    c.lineTo(axes.x(x1), axes.y(dSmax * 1.1));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Current point
    c.save();
    c.fillStyle = theme.color('--accent');
    c.beginPath();
    c.arc(axes.x(x1), axes.y(dS), 4, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Label
    c.save();
    c.fillStyle = theme.color('--ink');
    c.font = '12px monospace';
    c.fillText(`x₁=${x1.toFixed(2)}  ΔS=${dS.toFixed(3)} J/mol·K`, padL + 4, h - padB + 14);
    c.restore();
  }

  _drawMultiPanel(c, model, w, h) {
    const { components } = model;
    const dS = model.deltaS();
    const N  = components.length;
    const barH = Math.min(40, (h - 80) / N);
    const padL = 80, padR = 24, padT = 30;

    c.save();
    c.fillStyle = theme.color('--ink');
    c.font = '13px monospace';
    c.fillText(`ΔS_mix = ${dS.toFixed(4)} J/(mol·K)`, padL, 20);
    c.restore();

    const colors = [
      theme.color('--accent'),
      theme.color('--good'),
      theme.color('--signal'),
      theme.color('--qr'),
      theme.color('--muted'),
    ];

    for (let i = 0; i < N; i++) {
      const { name, x } = components[i];
      const barW = (w - padL - padR) * x;
      const y = padT + i * (barH + 8);

      c.save();
      c.fillStyle = colors[i % colors.length];
      c.fillRect(padL, y, barW, barH);
      c.restore();

      c.save();
      c.fillStyle = theme.color('--ink');
      c.font = '12px monospace';
      c.textAlign = 'right';
      c.fillText(`${name}`, padL - 6, y + barH / 2 + 4);
      c.textAlign = 'left';
      c.fillText(` ${(x * 100).toFixed(1)}%`, padL + barW + 4, y + barH / 2 + 4);
      c.restore();
    }
  }
}
