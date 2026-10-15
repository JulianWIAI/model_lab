/**
 * SupplyDemandView — supply/demand diagram with shaded CS and PS.
 *
 * Single panel: Q on x-axis, P on y-axis.
 * Demand curve (blue/accent), supply curve (orange/signal).
 * Shaded CS triangle above P*, shaded PS triangle below P*.
 * Dashed crosshairs at (Q*, P*).
 * "No trade" banner when Q* ≤ 0.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class SupplyDemandView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./SupplyDemandModel.js').SupplyDemandModel} model
   * @param {{ Pstar, Qstar, CS, PS, eD, eS, noTrade }} result
   */
  draw(model, result) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    if (result.noTrade) {
      _banner(c, w, h, 'No trade — supply intercept exceeds demand choke price');
      return;
    }

    const { Pstar, Qstar } = result;
    const pad = { left: 60, top: 16, right: w - 16, bottom: h - 36 };

    // Axis ranges: Q from 0 to 1.2×Q*, P from 0 to 1.3×Pstar (or demand choke)
    const Pchoke = model.a / model.b;
    const Qmax   = Math.max(Qstar * 1.3, 10);
    const Pmax   = Math.max(Pchoke * 1.1, Pstar * 1.4);

    const axes = new Axes(c, pad, [0, Qmax], [0, Pmax]);
    axes.grid({
      xLabel: 'Q',
      yLabel: 'P',
      xTicks: _niceTicks(0, Qmax, 5),
      yTicks: _niceTicks(0, Pmax, 5),
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(0),
    });

    // ── Shaded CS (triangle: demand curve above P*, left of Q*) ──────────────
    const demPts  = model.demandCurve(200).filter(p => p.Q <= Qmax && p.P <= Pmax);
    const abovePstar = demPts.filter(p => p.P >= Pstar);
    if (abovePstar.length >= 2) {
      c.save();
      c.globalAlpha = 0.18;
      c.fillStyle = theme.color('--accent');
      c.beginPath();
      c.moveTo(axes.x(abovePstar[0].Q), axes.y(abovePstar[0].P));
      for (const pt of abovePstar) c.lineTo(axes.x(pt.Q), axes.y(pt.P));
      c.lineTo(axes.x(Qstar), axes.y(Pstar));
      c.lineTo(axes.x(0), axes.y(Pstar));
      c.closePath();
      c.fill();
      c.restore();
    }

    // ── Shaded PS (triangle: supply curve below P*, left of Q*) ──────────────
    const supPts   = model.supplyCurve(200).filter(p => p.Q <= Qmax && p.P <= Pmax);
    const belowPstar = supPts.filter(p => p.P <= Pstar);
    if (belowPstar.length >= 2) {
      c.save();
      c.globalAlpha = 0.18;
      c.fillStyle = theme.color('--signal');
      c.beginPath();
      c.moveTo(axes.x(0), axes.y(Pstar));
      c.lineTo(axes.x(Qstar), axes.y(Pstar));
      for (const pt of [...belowPstar].reverse()) c.lineTo(axes.x(pt.Q), axes.y(pt.P));
      c.closePath();
      c.fill();
      c.restore();
    }

    // ── Demand curve ──────────────────────────────────────────────────────────
    axes.polyline(demPts.map(p => [p.Q, p.P]),
      { color: theme.color('--accent'), width: 2.5 });

    // ── Supply curve ──────────────────────────────────────────────────────────
    const supVisible = supPts.filter(p => p.Q <= Qmax);
    axes.polyline(supVisible.map(p => [p.Q, p.P]),
      { color: theme.color('--signal'), width: 2.5 });

    // ── Crosshairs at (Q*, P*) ────────────────────────────────────────────────
    _dashed(c, axes.x(Qstar), axes.box.top, axes.x(Qstar), axes.y(Pstar),
      theme.color('--muted'));
    _dashed(c, axes.box.left, axes.y(Pstar), axes.x(Qstar), axes.y(Pstar),
      theme.color('--muted'));

    // Labels
    axes.label(`P*=${Pstar.toFixed(1)}`, 0, Pstar,
      { color: theme.color('--text'), align: 'left', dx: 4, dy: -6 });
    axes.label(`Q*=${Qstar.toFixed(1)}`, Qstar, 0,
      { color: theme.color('--text'), align: 'center', dx: 0, dy: -14 });
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

function _banner(c, w, h, msg) {
  c.fillStyle = theme.color('--text');
  c.font      = '16px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(msg, w / 2, h / 2);
}

function _niceTicks(lo, hi, n) {
  const step = (hi - lo) / n;
  const mag  = Math.pow(10, Math.floor(Math.log10(step)));
  const nice = [1, 2, 2.5, 5, 10].find(f => f * mag >= step) * mag;
  const ticks = [];
  for (let v = Math.ceil(lo / nice) * nice; v <= hi + nice * 0.01; v += nice) {
    ticks.push(+v.toPrecision(10));
  }
  return ticks;
}
