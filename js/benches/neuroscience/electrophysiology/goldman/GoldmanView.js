/**
 * GoldmanView — membrane potential vs PNa/PK permeability ratio.
 *
 * Shows:
 *   - Vm vs PNa curve (sweeping PNa at fixed PK=1, PCl)
 *   - Horizontal dashed lines for EK, ENa, ECl (Nernst reference potentials)
 *   - Cursor dot at the current operating point (PNa, Vm)
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

const PNA_MAX = 30;   // upper axis limit
const PNA_MIN = 0.01;
const VM_MIN  = -120;
const VM_MAX  = 80;

export class GoldmanView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./GoldmanModel.js').GoldmanModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const axes = new Axes(
      c,
      { left: 52, top: 16, right: w - 16, bottom: h - 36 },
      [PNA_MIN, PNA_MAX],
      [VM_MIN, VM_MAX],
    );
    axes.grid({
      xTicks: [0, 5, 10, 15, 20, 25, 30],
      yTicks: [-120, -80, -40, 0, 40, 80],
      xLabel: 'P_Na (relative to P_K = 1)',
      yLabel: 'V_m (mV)',
    });

    const { EK, ENa, ECl } = model.nernstPotentials;

    // ── Nernst reference lines ──
    c.save();
    c.lineWidth = 1;
    c.setLineDash([5, 4]);

    const drawNernstLine = (E, color, label) => {
      if (E < VM_MIN || E > VM_MAX) return;
      const { y } = axes.toPixel(PNA_MIN, E);
      c.strokeStyle = color;
      c.beginPath();
      c.moveTo(axes.left, y);
      c.lineTo(axes.right, y);
      c.stroke();
      // Label on right edge
      c.fillStyle = color;
      c.font = `11px ${theme.fontFamily ?? 'monospace'}`;
      c.textAlign = 'left';
      c.fillText(label, axes.right + 2, y + 4);
    };

    drawNernstLine(EK,  theme.color('--accent'),  `E_K ${EK.toFixed(0)} mV`);
    drawNernstLine(ENa, theme.color('--signal'),   `E_Na ${ENa.toFixed(0)} mV`);
    drawNernstLine(ECl, theme.color('--third'),    `E_Cl ${ECl.toFixed(0)} mV`);

    c.setLineDash([]);
    c.restore();

    // ── Vm vs PNa curve ──
    const pts = model.vCurve(PNA_MIN, PNA_MAX, 400)
      .map(({ PNa, Vm }) => axes.toPixel(PNa, Vm));
    axes.polyline(pts, { color: theme.color('--accent'), lineWidth: 2.5 });

    // ── Cursor dot at current (PNa, Vm) ──
    const Vm = model.Vm;
    const px = axes.toPixel(model.PNa, Vm);
    c.save();
    c.strokeStyle = theme.color('--signal');
    c.lineWidth   = 1;
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(px.x, axes.bottom);
    c.lineTo(px.x, px.y);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = theme.color('--signal');
    c.beginPath();
    c.arc(px.x, px.y, 5, 0, 2 * Math.PI);
    c.fill();
    c.restore();
  }
}
