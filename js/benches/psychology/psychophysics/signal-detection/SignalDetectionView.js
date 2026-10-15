/**
 * SignalDetectionView — two-panel canvas.
 *
 * Left (55%): ROC space — FA on x-axis, H on y-axis.
 *             Diagonal chance line; ROC curve; current operating point (dot).
 * Right (45%): Overlapping normal distributions — noise N(0,1) and signal N(d′,1).
 *              Shaded hit region (H) and false-alarm region (FA).
 *              Vertical criterion line.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class SignalDetectionView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./SignalDetectionModel.js').SignalDetectionModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.55);
    const pad    = { top: 16, bottom: h - 36 };

    // ── LEFT: ROC space ───────────────────────────────────────────────────────
    const axR = new Axes(
      c,
      { left: 52, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, 1],
      [0, 1],
    );
    axR.grid({
      xLabel: 'FA (false-alarm rate)',
      yLabel: 'H (hit rate)',
      xTicks: [0, 0.25, 0.5, 0.75, 1],
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      xFormat: v => v.toFixed(2),
      yFormat: v => v.toFixed(2),
    });

    // Chance diagonal
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth   = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axR.x(0), axR.y(0));
    c.lineTo(axR.x(1), axR.y(1));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // ROC curve
    const roc = model.rocCurve(300);
    axR.polyline(roc.map(p => [p.FA, p.H]), { color: theme.color('--accent'), width: 2.5 });

    // Operating point
    const H  = model.H();
    const FA = model.FA();
    c.save();
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(axR.x(FA), axR.y(H), 6, 0, 2 * Math.PI);
    c.fill();
    c.restore();

    // AUC label
    c.save();
    c.fillStyle = theme.color('--text');
    c.font      = '12px sans-serif';
    c.textAlign = 'left';
    c.fillText(`AUC = ${model.AUC().toFixed(3)}`, axR.box.left + 6, pad.top + 18);
    c.restore();

    // ── RIGHT: overlapping distributions ─────────────────────────────────────
    const xMin = -4, xMax = model.d + 4;
    const yMax = 0.42;  // slightly above 1/√(2π) ≈ 0.399

    const axD = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 8, bottom: pad.bottom },
      [xMin, xMax],
      [0, yMax],
    );
    axD.grid({
      xLabel: 'decision variable x',
      yLabel: 'p(x)',
      xTicks: [-3, -2, -1, 0, 1, 2, 3, Math.round(model.d * 10) / 10].filter(
        v => v >= xMin && v <= xMax).filter((v, i, a) => a.indexOf(v) === i),
      yTicks: [0, 0.1, 0.2, 0.3, 0.4],
      xFormat: v => v.toFixed(1),
      yFormat: v => v.toFixed(2),
    });

    const gauss = (x, mu) => Math.exp(-((x - mu) ** 2) / 2) / Math.sqrt(2 * Math.PI);

    // criterion absolute position
    const cAbs = model.d / 2 + model.c;

    // Build distribution curves
    const npts  = 300;
    const noisePts  = [];
    const signalPts = [];
    for (let i = 0; i <= npts; i++) {
      const x = xMin + (xMax - xMin) * i / npts;
      noisePts.push([x, gauss(x, 0)]);
      signalPts.push([x, gauss(x, model.d)]);
    }

    // Shade FA region (noise distribution, x > cAbs)
    _shadeRegion(c, axD, noisePts.filter(([x]) => x >= cAbs),
      theme.color('--signal'), 0.25);

    // Shade H region (signal distribution, x > cAbs)
    _shadeRegion(c, axD, signalPts.filter(([x]) => x >= cAbs),
      theme.color('--accent'), 0.25);

    // Draw distributions
    axD.polyline(noisePts, { color: theme.color('--muted'), width: 2 });
    axD.polyline(signalPts, { color: theme.color('--accent'), width: 2.5 });

    // Criterion line
    c.save();
    c.strokeStyle = theme.color('--text');
    c.lineWidth   = 2;
    c.beginPath();
    c.moveTo(axD.x(cAbs), axD.y(0));
    c.lineTo(axD.x(cAbs), pad.top);
    c.stroke();
    c.restore();

    // Labels: noise (N) and signal (S)
    axD.label('N', 0, gauss(0, 0) + 0.01,
      { color: theme.color('--muted'), align: 'center', dx: 0, dy: -10 });
    axD.label('S', model.d, gauss(model.d, model.d) + 0.01,
      { color: theme.color('--accent'), align: 'center', dx: 0, dy: -10 });
  }
}

function _shadeRegion(c, axes, pts, color, alpha) {
  if (pts.length < 2) return;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle   = color;
  c.beginPath();
  c.moveTo(axes.x(pts[0][0]), axes.y(0));
  for (const [x, y] of pts) c.lineTo(axes.x(x), axes.y(y));
  c.lineTo(axes.x(pts[pts.length - 1][0]), axes.y(0));
  c.closePath();
  c.fill();
  c.restore();
}
