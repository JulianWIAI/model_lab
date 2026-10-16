/**
 * MarkovView — two panels.
 * Left: 2-state transition diagram with arc labels.
 * Right: convergence plot π^(t) vs step t.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class MarkovView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./MarkovModel.js').MarkovModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.4);

    this._drawDiagram(c, model, 0, 0, splitX, h);
    this._drawConvergence(c, model, splitX + 8, 0, w, h);
  }

  _drawDiagram(c, model, x0, y0, x1, y1) {
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    const r    = Math.min((x1 - x0) * 0.18, (y1 - y0) * 0.18);
    const cx0  = x0 + (x1 - x0) * 0.28;
    const cx1  = x0 + (x1 - x0) * 0.72;
    const cy   = midY;

    // Draw state circles
    for (const [cx, label] of [[cx0, '0'], [cx1, '1']]) {
      c.save();
      c.beginPath();
      c.arc(cx, cy, r, 0, 2 * Math.PI);
      c.strokeStyle = theme.color('--accent');
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = theme.color('--surface');
      c.fill();
      c.restore();

      c.save();
      c.fillStyle = theme.color('--on-surface');
      c.font = `bold 14px monospace`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, cx, cy);
      c.restore();
    }

    // Arc 0→1 (above)
    _arc(c, cx0, cy, cx1, cy, r, true,
      `p=${model.p.toFixed(2)}`, theme.color('--accent'));
    // Arc 1→0 (below)
    _arc(c, cx1, cy, cx0, cy, r, false,
      `q=${model.q.toFixed(2)}`, theme.color('--signal'));

    // Self-loops labels
    const pi = model.stationary;
    c.save();
    c.fillStyle = theme.color('--muted');
    c.font = '10px monospace';
    c.textAlign = 'center';
    c.fillText(`1-p=${(1 - model.p).toFixed(2)}`, cx0, cy - r - 14);
    c.fillText(`1-q=${(1 - model.q).toFixed(2)}`, cx1, cy - r - 14);
    c.restore();

    // Stationary distribution
    if (pi) {
      c.save();
      c.fillStyle = theme.color('--on-surface');
      c.font = '11px monospace';
      c.textAlign = 'center';
      c.fillText(`π₀=${pi[0].toFixed(3)}  π₁=${pi[1].toFixed(3)}`, midX, y1 - 14);
      c.restore();
    } else {
      c.save();
      c.fillStyle = theme.color('--muted');
      c.font = '11px monospace';
      c.textAlign = 'center';
      c.fillText('no unique stationary distribution', midX, y1 - 14);
      c.restore();
    }
  }

  _drawConvergence(c, model, x0, y0, x1, y1) {
    const pad    = { left: x0 + 48, top: y0 + 16, right: x1 - 12, bottom: y1 - 36 };
    const kMax   = 30;
    const pi     = model.stationary;
    if (!pi) return;

    const axes = new Axes(
      c,
      { left: pad.left, top: pad.top, right: pad.right, bottom: pad.bottom },
      [0, kMax],
      [0, 1],
    );
    axes.grid({
      xLabel: 'step k',
      yLabel: 'π^(k)',
      xTicks: [0, 10, 20, 30],
      yTicks: [0, 0.5, 1],
      xFormat: v => v.toFixed(0),
      yFormat: v => v.toFixed(1),
    });

    // Simulate convergence from [1, 0]
    const pts0 = [], pts1 = [];
    let v = [1, 0];
    const PT = [[1 - model.p, model.q], [model.p, 1 - model.q]];
    pts0.push([0, v[0]]);
    pts1.push([0, v[1]]);
    for (let k = 1; k <= kMax; k++) {
      v = [PT[0][0] * v[0] + PT[0][1] * v[1], PT[1][0] * v[0] + PT[1][1] * v[1]];
      pts0.push([k, v[0]]);
      pts1.push([k, v[1]]);
    }

    axes.polyline(pts0, { color: theme.color('--accent'),  width: 2 });
    axes.polyline(pts1, { color: theme.color('--signal'),  width: 2 });

    // Stationary lines
    _hDashed(c, pad.left, pad.right, axes.y(pi[0]), theme.color('--accent'));
    _hDashed(c, pad.left, pad.right, axes.y(pi[1]), theme.color('--signal'));

    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.font = '10px monospace';
    c.textAlign = 'left';
    c.fillText(`π₀`, pad.right + 2, axes.y(pi[0]) + 4);
    c.fillText(`π₁`, pad.right + 2, axes.y(pi[1]) + 4);
    c.restore();
  }
}

function _arc(c, x0, y0, x1, y1, r, above, label, color) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const ang  = Math.atan2(dy, dx);
  const sign = above ? -1 : 1;
  const bulge = dist * 0.28 * sign;
  const cpx = (x0 + x1) / 2 - Math.sin(ang) * bulge;
  const cpy = (y0 + y1) / 2 + Math.cos(ang) * bulge;

  // Start / end on circle boundary
  const sx = x0 + r * Math.cos(ang + 0.35 * sign);
  const sy = y0 + r * Math.sin(ang + 0.35 * sign);
  const ex = x1 - r * Math.cos(ang - 0.35 * sign);
  const ey = y1 - r * Math.sin(ang - 0.35 * sign);

  c.save();
  c.strokeStyle = color;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(sx, sy);
  c.quadraticCurveTo(cpx, cpy, ex, ey);
  c.stroke();

  // Arrowhead
  const tangAng = Math.atan2(ey - cpy, ex - cpx);
  const aLen = 8;
  c.beginPath();
  c.moveTo(ex, ey);
  c.lineTo(ex - aLen * Math.cos(tangAng - 0.4), ey - aLen * Math.sin(tangAng - 0.4));
  c.lineTo(ex - aLen * Math.cos(tangAng + 0.4), ey - aLen * Math.sin(tangAng + 0.4));
  c.closePath();
  c.fillStyle = color;
  c.fill();

  // Label at control point
  c.fillStyle = color;
  c.font = '11px monospace';
  c.textAlign = 'center';
  c.fillText(label, cpx, cpy - 4 * Math.sign(bulge));
  c.restore();
}

function _hDashed(c, x0, x1, y, color) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(x1, y);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}
