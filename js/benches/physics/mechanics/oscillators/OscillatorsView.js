/**
 * OscillatorsView — two-panel canvas.
 *
 * Left (60%): x(t) transient simulation curve.
 * Right (40%): A(ω) resonance curve with ω_r marked.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

function _dashed(c, x1, y1, x2, y2, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

export class OscillatorsView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.60);
    const pad = { left: 56, top: 20, bottom: h - 36 };

    // ── LEFT: transient x(t) ──────────────────────────────────────────────────
    const tEnd = Math.max(20, 8 * Math.PI / (model.omega0 || 1));
    const dt = tEnd / 2000;
    const { t: ts, x: xs } = model.simulate(tEnd, dt);

    const xMax = Math.max(...xs.map(Math.abs)) * 1.1 || 0.1;

    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, tEnd], [-xMax, xMax],
    );
    axesL.grid({ xLabel: 't (s)', yLabel: 'x (m)' });
    axesL.polyline(ts.map((ti, i) => [ti, xs[i]]),
      { color: theme.color('--accent'), width: 2 });

    // zero line
    _dashed(c, pad.left, axesL.y(0), splitX - 8, axesL.y(0), theme.color('--muted'));

    // ── RIGHT: A(ω) resonance curve ───────────────────────────────────────────
    const omegaMax = model.omega0 * 3;
    const pts = model.amplitudeCurve(omegaMax, 400);
    const AMax = Math.max(...pts.map(p => p.A)) * 1.1;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, omegaMax], [0, AMax],
    );
    axesR.grid({ xLabel: 'ω (rad/s)', yLabel: 'A (m)' });
    axesR.polyline(pts.map(p => [p.omega, p.A]),
      { color: theme.color('--signal'), width: 2.5 });

    // Mark ω_r
    const wr = model.omegaR;
    if (!isNaN(wr) && wr > 0 && wr <= omegaMax) {
      _dashed(c, axesR.x(wr), pad.top, axesR.x(wr), pad.bottom, theme.color('--accent'));
      c.font = '11px sans-serif';
      c.fillStyle = theme.color('--accent');
      c.fillText('ω_r', axesR.x(wr) + 3, pad.top + 14);
    }

    // Mark ω₀
    _dashed(c, axesR.x(model.omega0), pad.top, axesR.x(model.omega0), pad.bottom, theme.color('--muted'));
    c.font = '11px sans-serif';
    c.fillStyle = theme.color('--muted');
    c.fillText('ω₀', axesR.x(model.omega0) + 3, pad.top + 28);

    // Mark current driving frequency
    const curA = model.amplitude();
    if (model.omega <= omegaMax) {
      const px = axesR.x(model.omega);
      const py = axesR.y(curA);
      c.beginPath();
      c.arc(px, py, 5, 0, 2 * Math.PI);
      c.fillStyle = theme.color('--accent');
      c.fill();
    }
  }
}
