/**
 * OrbitsView — two-panel canvas.
 *
 * Left (55%): orbit trajectory (ellipse).
 * Right (45%): |ΔE/E| vs orbit number for Verlet (flat) and RK4 (sloped).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class OrbitsView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./OrbitModel.js').OrbitModel} model
   * @param {{ verletErrors: number[], rk4Errors: number[] }} energyData
   */
  draw(model, energyData) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.55);
    const pad = { left: 48, top: 20, bottom: h - 36 };

    // ── LEFT: orbit trajectory ────────────────────────────────────────────────
    const { x: xs, y: ys } = model.trajectory(400);
    const xyMax = model.a * (1 + model.e) * 1.15;

    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [-xyMax, xyMax], [-xyMax, xyMax],
    );
    axesL.grid({ xLabel: 'x (m)', yLabel: 'y (m)' });

    // Focus (sun) at origin
    const sunX = axesL.x(0), sunY = axesL.y(0);
    c.beginPath();
    c.arc(sunX, sunY, 5, 0, 2 * Math.PI);
    c.fillStyle = '#f5a623';
    c.fill();

    // Orbit path
    axesL.polyline(xs.map((xi, i) => [xi, ys[i]]),
      { color: theme.color('--accent'), width: 2 });

    // Perihelion marker
    const px = axesL.x(xs[0]), py = axesL.y(ys[0]);
    c.beginPath();
    c.arc(px, py, 4, 0, 2 * Math.PI);
    c.fillStyle = theme.color('--signal');
    c.fill();

    // ── RIGHT: energy error vs orbit ──────────────────────────────────────────
    if (!energyData) return;

    const { verletErrors, rk4Errors } = energyData;
    const nOrbits = verletErrors.length;

    const allErrors = [...verletErrors, ...rk4Errors].filter(e => e > 0);
    if (allErrors.length === 0) return;

    const logMin = Math.floor(Math.log10(Math.min(...allErrors))) - 0.5;
    const logMax = Math.ceil(Math.log10(Math.max(...allErrors))) + 0.5;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, nOrbits], [logMin, logMax],
    );
    axesR.grid({ xLabel: 'orbit #', yLabel: 'log₁₀|ΔE/E|' });

    const vPts = verletErrors.map((e, i) => [i + 1, Math.log10(Math.max(e, 1e-20))]);
    const rPts = rk4Errors.map((e, i) => [i + 1, Math.log10(Math.max(e, 1e-20))]);

    axesR.polyline(vPts, { color: theme.color('--accent'), width: 2 });
    axesR.polyline(rPts, { color: theme.color('--signal'), width: 2 });

    c.font = '11px sans-serif';
    c.fillStyle = theme.color('--accent');
    c.fillText('Verlet (bounded)', axesR.box.left + 4, pad.top + 14);
    c.fillStyle = theme.color('--signal');
    c.fillText('RK4 (secular)', axesR.box.left + 4, pad.top + 28);
  }
}
