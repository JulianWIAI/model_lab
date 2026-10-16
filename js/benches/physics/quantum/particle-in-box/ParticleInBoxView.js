/**
 * ParticleInBoxView — two-panel canvas.
 *
 * Left panel (60%): wavefunction ψ_n(x) (blue) and |ψ_n|² (filled, muted)
 * Right panel (40%): energy level diagram E₁…E₅, selected level highlighted
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class ParticleInBoxView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./ParticleInBoxModel.js').ParticleInBoxModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.60);
    const pad    = { left: 56, top: 16, right: 12, bottom: h - 36 };

    const pts    = model.curve(400);
    const L      = model.L;

    // ── LEFT PANEL: ψ and |ψ|² ───────────────────────────────────────────
    const psiMax = Math.sqrt(2 / L) * 1.15;
    const axesL  = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, L],
      [-psiMax, psiMax],
    );
    axesL.grid({
      xLabel: 'x',
      yLabel: 'ψ / |ψ|²',
      xTicks: [0, L * 0.5, L],
      yTicks: [-Math.sqrt(2 / L), 0, Math.sqrt(2 / L)],
      xFormat: v => `${(v / L).toFixed(1)}L`,
      yFormat: () => '',
    });

    // |ψ|² filled area (re-scaled to fit in [-psiMax, psiMax])
    const scale = psiMax / (2 / L);   // map prob density to axis range
    c.save();
    c.beginPath();
    const first = pts[0];
    c.moveTo(axesL.x(first.x), axesL.y(0));
    for (const p of pts) c.lineTo(axesL.x(p.x), axesL.y(p.prob * scale));
    c.lineTo(axesL.x(pts[pts.length - 1].x), axesL.y(0));
    c.closePath();
    c.fillStyle = theme.color('--muted') + '40';
    c.fill();
    c.restore();

    // ψ_n(x) curve
    axesL.polyline(pts.map(p => [p.x, p.psi]), { color: theme.color('--accent'), width: 2 });

    // zero line
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth   = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(axesL.box.left, axesL.y(0));
    c.lineTo(axesL.box.right, axesL.y(0));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // ── RIGHT PANEL: energy levels ────────────────────────────────────────
    const nLevels = 5;
    const energies = [];
    for (let k = 1; k <= nLevels; k++) energies.push(model.energy(k));

    const Emin = 0;
    const Emax = energies[nLevels - 1] * 1.1;
    const axesR = new Axes(
      c,
      { left: splitX + 24, top: pad.top, right: w - pad.right, bottom: pad.bottom },
      [0, 1],
      [Emin, Emax],
    );

    // background
    c.save();
    c.fillStyle = theme.color('--surface');
    c.fillRect(splitX + 24, pad.top, w - splitX - 24 - pad.right, pad.bottom - pad.top);
    c.restore();

    // y-axis label
    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.font      = `11px ${theme.font ?? 'monospace'}`;
    c.textAlign = 'center';
    c.save();
    c.translate(splitX + 13, (pad.top + pad.bottom) / 2);
    c.rotate(-Math.PI / 2);
    c.fillText('Energy (eV)', 0, 0);
    c.restore();
    c.restore();

    const { EV_J } = model.constructor.constants;
    const levelLeft  = splitX + 36;
    const levelRight = w - pad.right - 4;

    for (let k = 1; k <= nLevels; k++) {
      const Ek  = energies[k - 1];
      const py  = axesR.y(Ek);
      const isSelected = k === model.n;
      const col = isSelected ? theme.color('--accent') : theme.color('--muted');

      c.save();
      c.strokeStyle = col;
      c.lineWidth   = isSelected ? 2.5 : 1.5;
      c.beginPath();
      c.moveTo(levelLeft, py);
      c.lineTo(levelRight, py);
      c.stroke();
      c.restore();

      c.save();
      c.fillStyle = col;
      c.font      = `11px monospace`;
      c.textAlign = 'left';
      c.fillText(`n=${k}  ${(Ek / EV_J).toFixed(3)} eV`, levelLeft + 2, py - 3);
      c.restore();
    }
  }
}
