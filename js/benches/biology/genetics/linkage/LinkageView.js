/**
 * LinkageView — mapping function curves (Haldane and Kosambi).
 *
 * Left panel (~60%): M (cM) vs θ with both curves overlaid.
 *   Dashed vertical line at current θ; horizontal labels.
 * Right panel (~40%): LOD vs θ for current N and observed R.
 */
import { theme } from '../../../../core/Theme.js';
import { Axes } from '../../../../core/Axes.js';

export class LinkageView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    /** Extra state from bench: nParental, nRecombinant */
    this.nParental    = 90;
    this.nRecombinant = 10;
  }

  /** @param {import('./LinkageModel.js').LinkageModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: W, height: H } = this.canvasView;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, W, H);

    const margin = { top: 18, bottom: 38, left: 54, right: 8 };
    const splitX = Math.floor(W * 0.58);

    this._drawCurves(c, model, margin.left, margin.top, splitX - margin.left - 4, H - margin.top - margin.bottom);
    this._drawLOD(c, model, splitX + 4, margin.top, W - splitX - 4 - margin.right, H - margin.top - margin.bottom);
  }

  _drawCurves(c, model, x0, y0, w, h) {
    const { thetas, haldaneCM, kosambiCM } = model.curveData(200);
    const maxCM = 150; // display up to 150 cM
    const box   = { left: x0 + 0, right: x0 + w, top: y0, bottom: y0 + h };
    const axes  = new Axes(c, box, [0, 0.5], [0, maxCM]);

    axes.grid({
      xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      yTicks: [0, 25, 50, 75, 100, 125, 150],
      xFormat: (v) => v.toFixed(1),
      yFormat: (v) => String(v),
      xLabel: 'θ (recombination frequency)',
      yLabel: 'Distance (cM)',
    });

    // Haldane: dashed
    const hPts = Array.from(thetas).map((th, i) => [th, Math.min(haldaneCM[i], maxCM)]);
    axes.polyline(hPts, { color: theme.color('--accent'), lineWidth: 2, dash: [6, 3] });

    // Kosambi: solid
    const kPts = Array.from(thetas).map((th, i) => [th, Math.min(kosambiCM[i], maxCM)]);
    axes.polyline(kPts, { color: theme.color('--accent'), lineWidth: 2 });

    // Current theta vertical line
    const th = model.theta;
    const hM = model.haldane(th) * 100;
    const kM = model.kosambi(th) * 100;
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([3, 3]);
    const px = axes.x(th);
    c.beginPath();
    c.moveTo(px, box.top);
    c.lineTo(px, box.bottom);
    c.stroke();
    c.restore();

    // Labels on curves
    c.fillStyle = theme.color('--accent');
    c.font = `9px system-ui, sans-serif`;
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    const hPx = axes.x(0.42), hPy = axes.y(Math.min(model.haldane(0.42) * 100, maxCM));
    c.fillText('Haldane', hPx + 2, hPy - 12);

    const kPx = axes.x(0.44), kPy = axes.y(Math.min(model.kosambi(0.44) * 100, maxCM));
    c.fillText('Kosambi', kPx - 52, kPy + 12);

    // Annotation at current theta
    if (th > 0 && th < 0.5) {
      c.fillStyle = theme.color('--muted');
      c.font = `9px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(`θ=${th.toFixed(2)}`, px, box.top - 2);

      c.textAlign = 'right';
      c.textBaseline = 'middle';
      c.fillText(`H:${hM.toFixed(1)}`, px - 3, axes.y(Math.min(hM, maxCM - 5)));
      c.fillText(`K:${kM.toFixed(1)}`, px - 3, axes.y(Math.min(kM, maxCM - 15)));
    }
  }

  _drawLOD(c, model, x0, y0, w, h) {
    const N = this.nParental + this.nRecombinant;
    if (N === 0) return;

    const nPoints = 100;
    const thetas = new Float64Array(nPoints);
    const lods   = new Float64Array(nPoints);
    let maxLOD = -Infinity, minLOD = 0;

    for (let i = 1; i < nPoints; i++) { // skip θ=0 (undefined)
      const th = (i / nPoints) * 0.499;
      thetas[i] = th;
      const lod = model.lodScore(this.nParental, this.nRecombinant, th);
      lods[i] = isFinite(lod) ? lod : -10;
      if (lod > maxLOD) maxLOD = lod;
      if (lod < minLOD) minLOD = lod;
    }

    if (!isFinite(maxLOD)) maxLOD = 5;
    const yMax = Math.ceil(Math.max(maxLOD + 0.5, 4));
    const yMin = Math.max(minLOD - 0.5, -5);

    const box = { left: x0 + 28, right: x0 + w, top: y0, bottom: y0 + h };
    const axes = new Axes(c, box, [0, 0.5], [yMin, yMax]);

    const yTicks = [];
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) yTicks.push(y);

    axes.grid({
      xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      yTicks,
      xFormat: (v) => v.toFixed(1),
      xLabel: 'θ',
      yLabel: 'LOD',
    });

    // LOD curve
    const pts = Array.from(thetas).map((th, i) => [th, lods[i]]).filter((_, i) => i > 0);
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2 });

    // LOD=3 significance line
    if (3 >= yMin && 3 <= yMax) {
      c.save();
      c.strokeStyle = '#e74c3c';
      c.lineWidth = 1;
      c.setLineDash([3, 3]);
      const py3 = axes.y(3);
      c.beginPath();
      c.moveTo(box.left, py3);
      c.lineTo(box.right, py3);
      c.stroke();
      c.restore();
      c.fillStyle = '#e74c3c';
      c.font = `9px system-ui, sans-serif`;
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      c.fillText('LOD=3', box.left + 2, py3 - 1);
    }

    // Current theta marker
    const th = model.theta;
    if (th > 0 && th < 0.5) {
      const lod = model.lodScore(this.nParental, this.nRecombinant, th);
      if (isFinite(lod)) {
        const px = axes.x(th);
        c.beginPath();
        c.arc(px, axes.y(lod), 4, 0, 2 * Math.PI);
        c.fillStyle = theme.color('--accent');
        c.fill();
      }
    }
  }
}
