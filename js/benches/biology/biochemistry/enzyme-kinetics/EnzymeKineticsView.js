/**
 * EnzymeKineticsView — v vs [S] curve with data points, and Lineweaver–Burk plot.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

export class EnzymeKineticsView {
  constructor(canvasView) {
    this.canvasView = canvasView;
    this.showLineweaver = false;
  }

  draw(model, dataPoints = []) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    if (this.showLineweaver) {
      this._drawLineweaver(c, w, h, model, dataPoints);
    } else {
      this._drawMM(c, w, h, model, dataPoints);
    }
  }

  _drawMM(c, w, h, model, dataPoints) {
    const maxS = model.apparentKm * 10;
    const maxV = model.apparentVmax * 1.15;
    const axes = new Axes(c, { left: 50, top: 16, right: w - 12, bottom: h - 30 }, [0, maxS], [0, maxV]);
    axes.grid({
      xTicks: [0, maxS * 0.25, maxS * 0.5, maxS * 0.75, maxS],
      yTicks: [0, model.apparentVmax * 0.5, model.apparentVmax],
      xLabel: '[S] (µM)',
      yLabel: 'v (µM/s)',
    });

    // MM curve (no inhibitor)
    const base = { Vmax: model.Vmax, Km: model.Km };
    const nPoints = 100;
    const baseCurve = Array.from({ length: nPoints }, (_, i) => {
      const s = (i / (nPoints - 1)) * maxS;
      return [s, base.Vmax * s / (base.Km + s)];
    });
    axes.polyline(baseCurve, { color: theme.color('--muted'), dash: [4, 4] });

    // MM curve with inhibitor
    const curve = Array.from({ length: nPoints }, (_, i) => {
      const s = (i / (nPoints - 1)) * maxS;
      return [s, model.v(s)];
    });
    axes.polyline(curve, { color: theme.color('--accent'), lineWidth: 2 });

    // Km and Vmax markers
    const accentColor = theme.color('--accent');
    // Vmax_app horizontal dashed line
    axes.polyline([[0, model.apparentVmax], [maxS, model.apparentVmax]], { color: accentColor, dash: [4, 4] });
    // Km_app vertical dashed line
    axes.polyline([[model.apparentKm, 0], [model.apparentKm, model.apparentVmax / 2]], { color: accentColor, dash: [4, 4] });

    // Data points
    dataPoints.forEach(({ s, v }) => {
      axes.point([s, v], { color: theme.color('--accent'), r: 4 });
    });
  }

  _drawLineweaver(c, w, h, model, dataPoints) {
    const maxInvS = 1 / (model.apparentKm * 0.5);
    const maxInvV = 1 / (model.apparentVmax * 0.05);
    const axes = new Axes(c, { left: 60, top: 16, right: w - 12, bottom: h - 30 }, [0, maxInvS], [0, maxInvV]);
    axes.grid({
      xTicks: [0, maxInvS * 0.25, maxInvS * 0.5, maxInvS * 0.75, maxInvS],
      yTicks: [0, maxInvV * 0.5, maxInvV],
      xLabel: '1/[S]',
      yLabel: '1/v',
    });

    // LB line
    const nPoints = 50;
    const lbLine = Array.from({ length: nPoints }, (_, i) => {
      const invS = (i / (nPoints - 1)) * maxInvS;
      const invV = model.apparentKm / model.apparentVmax * invS + 1 / model.apparentVmax;
      return [invS, invV];
    });
    axes.polyline(lbLine, { color: theme.color('--accent'), lineWidth: 2 });

    // Data points
    dataPoints.forEach(({ s, v }) => {
      if (s > 0 && v > 0) {
        axes.point([1 / s, 1 / v], { color: theme.color('--accent'), r: 4 });
      }
    });
  }
}
