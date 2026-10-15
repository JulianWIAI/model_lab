/**
 * IntegrateAndFireView — two-panel canvas.
 *
 * Left (60%): V(t) membrane potential trace with spike markers.
 * Right (40%): f-I curve with current operating point marked.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class IntegrateAndFireView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./IntegrateAndFireModel.js').IntegrateAndFireModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.60);
    const pad = { left: 56, top: 20, bottom: h - 36 };

    // ── LEFT: V(t) trace ──────────────────────────────────────────────────────
    const tEnd = Math.min(200, model.ISI * 6 || 200);
    const dt = 0.05;
    const { t: ts, V: Vs, spikeTimes } = model.simulate(tEnd, dt);

    const Vmin = Math.min(...Vs, model.Vrest - 5);
    const Vmax = model.Vth + 5;

    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, tEnd], [Vmin, Vmax],
    );
    axesL.grid({ xLabel: 't (ms)', yLabel: 'V (mV)' });

    // Threshold dashed line
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(pad.left, axesL.y(model.Vth));
    c.lineTo(splitX - 8, axesL.y(model.Vth));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    c.font = '11px sans-serif';
    c.fillStyle = theme.color('--signal');
    c.fillText('V_th', pad.left + 3, axesL.y(model.Vth) - 3);

    // V(t) trace
    axesL.polyline(ts.map((ti, i) => [ti, Vs[i]]),
      { color: theme.color('--accent'), width: 1.5 });

    // Spike markers (vertical lines at spike times)
    for (const st of spikeTimes) {
      if (st > tEnd) break;
      c.strokeStyle = theme.color('--signal');
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(axesL.x(st), pad.top);
      c.lineTo(axesL.x(st), axesL.y(model.Vth));
      c.stroke();
    }

    // Subthreshold annotation
    if (model.ISI === Infinity) {
      c.font = '14px sans-serif';
      c.fillStyle = theme.color('--muted');
      c.textAlign = 'center';
      c.fillText('subthreshold — no spikes', (pad.left + splitX) / 2, h / 2);
      c.textAlign = 'left';
    }

    // ── RIGHT: f-I curve ──────────────────────────────────────────────────────
    const fIPts = model.fICurve(0, model.Ith * 4, 200);
    const fMax = Math.max(...fIPts.map(p => p.f)) * 1.1 || 100;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, model.Ith * 4], [0, fMax],
    );
    axesR.grid({ xLabel: 'I (nA)', yLabel: 'f (Hz)' });

    axesR.polyline(fIPts.filter(p => p.f > 0).map(p => [p.I, p.f]),
      { color: theme.color('--accent'), width: 2.5 });

    // Mark rheobase
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axesR.x(model.Ith), pad.top);
    c.lineTo(axesR.x(model.Ith), pad.bottom);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    c.font = '11px sans-serif';
    c.fillStyle = theme.color('--muted');
    c.fillText('I_th', axesR.x(model.Ith) + 3, pad.top + 14);

    // Current operating point
    if (model.firingRate > 0 && model.I <= model.Ith * 4) {
      const ox = axesR.x(model.I), oy = axesR.y(model.firingRate);
      c.beginPath();
      c.arc(ox, oy, 5, 0, 2 * Math.PI);
      c.fillStyle = theme.color('--signal');
      c.fill();
    }
  }
}
