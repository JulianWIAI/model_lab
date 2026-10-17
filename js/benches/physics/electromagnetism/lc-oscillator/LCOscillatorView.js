/**
 * LCOscillatorView — two-panel canvas.
 *
 * Left  (65%): V_C(t) step response with dashed vertical at 1/ω₀.
 * Right (35%): frequency response |H_C(ω)| with dashed verticals at ωd, ω₀, ωC.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class LCOscillatorView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./LCOscillatorModel.js').LCOscillatorModel} model
   * @param {number} tMax  maximum time for step-response panel [s]
   * @param {number} [V0=1]  step amplitude [V]
   */
  draw(model, tMax, V0 = 1) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.65);
    const pad    = { left: 56, top: 16, bottom: h - 36 };

    // ── LEFT PANEL: V_C(t) step response ────────────────────────────────────
    const pts    = model.simulate(tMax, 300, V0);
    const yMax   = V0 * 1.2;
    const w0     = model.omega0();

    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, tMax],
      [0, yMax],
    );

    axesL.grid({
      xLabel: 't (s)',
      yLabel: 'V_C (V)',
      xTicks: [0, tMax * 0.25, tMax * 0.5, tMax * 0.75, tMax].map(v => +v.toPrecision(4) * 1),
      yTicks: [0, V0 * 0.5, V0, yMax].map(v => +v.toFixed(3) * 1),
      xFormat: v => {
        if (v === 0) return '0';
        return v < 1e-3 ? `${(v * 1e6).toFixed(1)}μ` : v < 1 ? `${(v * 1000).toFixed(3)}m` : v.toFixed(4);
      },
      yFormat: v => v.toFixed(2),
    });

    // Dashed vertical at t = 1/ω₀ (natural period reference)
    const tRef = 1 / w0;
    if (tRef <= tMax) {
      _dashed(c, axesL.x(tRef), pad.top, axesL.x(tRef), pad.bottom, theme.color('--signal'));
      axesL.label('ω₀', tRef, yMax * 0.9,
        { color: theme.color('--signal'), align: 'center', dx: 0, dy: 0 });
    }

    // Dashed horizontal at V0 (steady-state target)
    _dashed(c, axesL.box.left, axesL.y(V0), splitX - 8, axesL.y(V0), theme.color('--muted'));
    axesL.label('V₀', tMax * 0.02, V0,
      { color: theme.color('--muted'), align: 'left', dx: 4, dy: -10 });

    // V_C(t) curve
    axesL.polyline(pts.map(p => [p.t, p.Vc]), { color: theme.color('--accent'), width: 2.5 });

    // ── RIGHT PANEL: frequency response |H_C(ω)| ────────────────────────────
    const wMax   = 3 * w0;
    const wPoints = 200;
    const frPts  = [];
    for (let i = 0; i <= wPoints; i++) {
      const omega = (wMax * i) / wPoints;
      // avoid ω=0 divide issues — use tiny offset
      const om = omega === 0 ? 1e-6 : omega;
      frPts.push([om, model.frequencyResponse(om)]);
    }

    // Find the max of frequency response to set y range
    const hMax = Math.max(...frPts.map(p => p[1])) * 1.15;
    const hMaxSafe = isFinite(hMax) && hMax > 0 ? hMax : 5;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, wMax],
      [0, hMaxSafe],
    );

    axesR.grid({
      xLabel: 'ω (rad/s)',
      yLabel: '|H_C|',
      xTicks: [0, w0, 2 * w0, 3 * w0].map(v => +v.toPrecision(4) * 1),
      yTicks: [0, hMaxSafe * 0.5, hMaxSafe].map(v => +v.toFixed(3) * 1),
      xFormat: v => {
        if (v === 0) return '0';
        return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
      },
      yFormat: v => v.toFixed(2),
    });

    // Dashed verticals at ωd, ω₀, ωC
    const wd  = model.omegaDamped();
    const wC  = model.omegaVcPeak();

    if (wd != null && wd <= wMax) {
      _dashed(c, axesR.x(wd), pad.top, axesR.x(wd), pad.bottom, theme.color('--muted'));
      axesR.label('ωd', wd, hMaxSafe * 0.9,
        { color: theme.color('--muted'), align: 'center', dx: 0, dy: 0 });
    }

    // ω₀ — always shown
    _dashed(c, axesR.x(w0), pad.top, axesR.x(w0), pad.bottom, theme.color('--signal'));
    axesR.label('ω₀', w0, hMaxSafe * 0.75,
      { color: theme.color('--signal'), align: 'center', dx: 0, dy: 0 });

    if (wC != null && wC <= wMax) {
      _dashed(c, axesR.x(wC), pad.top, axesR.x(wC), pad.bottom, theme.color('--accent'));
      axesR.label('ωC', wC, hMaxSafe * 0.6,
        { color: theme.color('--accent'), align: 'center', dx: 0, dy: 0 });
    }

    // |H_C(ω)| curve
    axesR.polyline(frPts, { color: theme.color('--accent'), width: 2.5 });
  }
}

/**
 * Draw a dashed line between two pixel points.
 * @param {CanvasRenderingContext2D} c
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} color
 */
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
