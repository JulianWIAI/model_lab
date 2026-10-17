/**
 * ButlerVolmerView — two-panel canvas.
 *
 * Left (65%): i vs η polarization curve (−etaMax to +etaMax).
 *             Dashed lines at η=0 and η=b (Tafel slope marker).
 * Right (35%): Tafel plot — log₁₀|i/i₀| vs η for anodic branch (0 to +etaMax).
 *              Dashed line for linear Tafel region.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class ButlerVolmerView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./ButlerVolmerModel.js').ButlerVolmerModel} model
   * @param {number} etaMax  maximum overpotential for x-axis (V)
   */
  draw(model, etaMax) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.65);
    const pad    = { left: 60, top: 16, bottom: h - 36 };

    // ── LEFT PANEL: i vs η ────────────────────────────────────────────────────
    const pts = model.polarizationCurve(etaMax, 400);
    const iVals = pts.map(p => p.i);
    const iMax  = Math.max(...iVals.map(Math.abs)) * 1.08;

    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [-etaMax, etaMax],
      [-iMax, iMax],
    );
    axesL.grid({
      xLabel: 'η (V)',
      yLabel: 'i (i₀ units)',
      xFormat: v => v.toFixed(2),
      yFormat: v => {
        const a = Math.abs(v);
        if (a === 0) return '0';
        if (a >= 1000) return `${(v / 1000).toFixed(1)}k`;
        if (a >= 100)  return v.toFixed(0);
        if (a >= 10)   return v.toFixed(1);
        return v.toFixed(2);
      },
    });

    // Dashed vertical at η=0
    _dashed(c, axesL.x(0), pad.top, axesL.x(0), pad.bottom, theme.color('--muted'));

    // Dashed horizontal at i=0
    _dashed(c, axesL.box.left, axesL.y(0), splitX - 8, axesL.y(0), theme.color('--muted'));

    // Tafel slope marker at η=b (vertical dashed)
    const b = model.tafelSlope();
    if (b <= etaMax) {
      _dashed(c, axesL.x(b), pad.top, axesL.x(b), pad.bottom, theme.color('--muted'));
      // Label
      c.save();
      c.fillStyle = theme.color('--muted');
      c.font = '10px monospace';
      c.textAlign = 'center';
      c.fillText('b', axesL.x(b), pad.top + 12);
      c.restore();
    }

    // BV curve
    axesL.polyline(pts.map(p => [p.eta, p.i]), { color: theme.color('--accent'), width: 2.5 });

    // ── RIGHT PANEL: Tafel plot ───────────────────────────────────────────────
    // log₁₀|i/i₀| vs η for η ∈ [0, etaMax]
    const nR = 300;
    const tafelPts = [];
    for (let k = 1; k < nR; k++) {  // skip k=0 (η=0 → log undefined)
      const eta = etaMax * k / (nR - 1);
      const logI = Math.log10(Math.abs(model.currentNorm(eta)));
      if (isFinite(logI)) tafelPts.push({ eta, logI });
    }

    const logIMin = tafelPts.length > 0 ? Math.min(...tafelPts.map(p => p.logI)) : -2;
    const logIMax = tafelPts.length > 0 ? Math.max(...tafelPts.map(p => p.logI)) : 2;
    const logIPad = (logIMax - logIMin) * 0.08;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, etaMax],
      [logIMin - logIPad, logIMax + logIPad],
    );
    axesR.grid({
      xLabel: 'η (V)',
      yLabel: 'log₁₀|i/i₀|',
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(1),
    });

    // Tafel line (linear): log₁₀(tafelApprox/i0) = α·η/(V_T·ln10)
    const vt = model.thermalVoltage();
    const slope_log = model.alpha / (vt * Math.log(10));
    const tafelLinePts = [];
    for (let k = 0; k < nR; k++) {
      const eta = etaMax * k / (nR - 1);
      tafelLinePts.push([eta, slope_log * eta]);
    }
    _dashedPolyline(c, axesR, tafelLinePts, theme.color('--muted'));

    // BV Tafel plot curve
    axesR.polyline(tafelPts.map(p => [p.eta, p.logI]), { color: theme.color('--signal'), width: 2.5 });

    // Label
    c.save();
    c.fillStyle = theme.color('--signal');
    c.font = '11px monospace';
    c.textAlign = 'left';
    c.fillText('BV', axesR.box.left + 4, pad.top + 14);
    c.fillStyle = theme.color('--muted');
    c.fillText('Tafel', axesR.box.left + 4, pad.top + 26);
    c.restore();
  }
}

function _dashed(c, x1, y1, x2, y2, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth   = 1;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

function _dashedPolyline(c, axes, pts, color) {
  if (pts.length < 2) return;
  c.save();
  c.strokeStyle = color;
  c.lineWidth   = 1;
  c.setLineDash([4, 4]);
  c.beginPath();
  const first = pts[0];
  c.moveTo(axes.x(first[0]), axes.y(first[1]));
  for (let i = 1; i < pts.length; i++) {
    c.lineTo(axes.x(pts[i][0]), axes.y(pts[i][1]));
  }
  c.stroke();
  c.setLineDash([]);
  c.restore();
}
