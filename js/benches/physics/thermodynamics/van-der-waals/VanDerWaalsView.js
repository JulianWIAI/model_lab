/**
 * VanDerWaalsView — P vs V_m isotherms in reduced coordinates (P_r vs V_r).
 *
 * Draws:
 *   - Multiple isotherms at T_r = 0.8, 0.9, 1.0 (T_c), 1.1, 1.2
 *   - Critical point marker (P_r=1, V_r=1)
 *   - The active isotherm (at current T_r) highlighted
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

const TR_LINES = [0.8, 0.9, 1.0, 1.1, 1.2];
const VR_MIN = 0.4, VR_MAX = 7;
const PR_MIN = 0,   PR_MAX = 4;
const N_PTS  = 400;

export class VanDerWaalsView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./VanDerWaalsModel.js').VanDerWaalsModel} model
   * @param {number} Tr  current reduced temperature
   */
  draw(model, Tr) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 56, top: 16, right: w - 80, bottom: h - 36 },
      [VR_MIN, VR_MAX],
      [PR_MIN, PR_MAX],
    );
    axes.grid({
      xTicks: [1, 2, 3, 4, 5, 6, 7],
      yTicks: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
      xLabel: 'V_r = V_m / V_c',
      yLabel: 'P_r = P / P_c',
    });

    // ── All isotherms ──
    for (const Tr_line of TR_LINES) {
      const isCurrent = Math.abs(Tr_line - Tr) < 0.001;
      const isAbove   = Tr_line >= 1.0;
      const color = isCurrent
        ? theme.color('--signal')
        : isAbove
          ? theme.color('--accent')
          : theme.color('--muted');
      const lw = isCurrent ? 2.5 : 1.5;

      const pts = [];
      for (let i = 0; i < N_PTS; i++) {
        const Vr = VR_MIN + (VR_MAX - VR_MIN) * (i / (N_PTS - 1));
        if (Vr <= 1 / 3) continue;
        const Pr = model.pressureReduced(Tr_line, Vr);
        if (!isFinite(Pr)) continue;
        pts.push(axes.toPixel(Vr, Math.max(PR_MIN, Math.min(PR_MAX, Pr))));
      }

      // Only draw if not a degenerate single-point segment
      if (pts.length > 1) {
        axes.polyline(pts, { color, lineWidth: lw });
      }

      // T_r label on right edge
      const lastPt = pts[pts.length - 1];
      if (lastPt) {
        c.save();
        c.fillStyle = color;
        c.font = `10px monospace`;
        c.textAlign = 'left';
        c.fillText(`T_r=${Tr_line}`, axes.right + 4, lastPt.y + 4);
        c.restore();
      }
    }

    // ── Critical point marker ──
    const cp = axes.toPixel(1, 1);
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.fillStyle   = theme.color('--signal');
    c.lineWidth   = 1.5;
    c.beginPath();
    c.arc(cp.x, cp.y, 5, 0, 2 * Math.PI);
    c.fill();
    c.fillStyle = theme.color('--signal');
    c.font      = `10px monospace`;
    c.textAlign = 'left';
    c.fillText('T_c', cp.x + 7, cp.y + 4);
    c.restore();

    // ── P_r = 1 horizontal reference ──
    const yPc = axes.toPixel(VR_MIN, 1).y;
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth   = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axes.left, yPc);
    c.lineTo(axes.right, yPc);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }
}
