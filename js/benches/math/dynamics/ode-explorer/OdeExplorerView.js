/**
 * OdeExplorerView — two-panel canvas: solution curve (left) + convergence plot (right).
 *
 * Left (65%): numerical and exact solution curves.
 * Right (35%): log-log error vs h with slope annotation.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class OdeExplorerView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./OdeExplorerModel.js').OdeExplorerModel} model */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const splitX = Math.floor(w * 0.65);
    const pad = { left: 56, top: 20, bottom: h - 36 };

    // ── LEFT: solution curve ──────────────────────────────────────────────────
    const tEnd = model.preset === 'growth' ? 3 : 5;
    const { t: ts, y: ys } = model.integrate(tEnd);

    const exactPts = ts.map(ti => model.exact(ti));
    const yMin = Math.min(...ys, ...exactPts);
    const yMax = Math.max(...ys, ...exactPts);
    const yPad = (yMax - yMin) * 0.1 || 0.1;

    const axesL = new Axes(
      c,
      { left: pad.left, top: pad.top, right: splitX - 8, bottom: pad.bottom },
      [0, tEnd],
      [yMin - yPad, yMax + yPad],
    );
    axesL.grid({ xLabel: 't', yLabel: 'y' });

    // Exact solution (grey)
    axesL.polyline(ts.map((ti, i) => [ti, exactPts[i]]),
      { color: theme.color('--muted'), width: 1.5 });

    // Numerical solution (accent)
    axesL.polyline(ts.map((ti, i) => [ti, ys[i]]),
      { color: theme.color('--accent'), width: 2.5 });

    // Legend
    c.font = '11px sans-serif';
    c.fillStyle = theme.color('--muted');
    c.fillText('exact', pad.left + 4, pad.top + 14);
    c.fillStyle = theme.color('--accent');
    c.fillText('numerical', pad.left + 4, pad.top + 28);

    // ── RIGHT: log-log convergence ────────────────────────────────────────────
    if (model.method === 'backwardEuler') {
      // backwardEuler stability demo: just label
      c.font = '13px sans-serif';
      c.fillStyle = theme.color('--text');
      c.textAlign = 'center';
      c.fillText('Backward Euler: stable for all λh', (splitX + w) / 2, h / 2);
      c.textAlign = 'left';
      return;
    }

    const { hs, errors, slope } = model.convergence();
    const logHs = hs.map(Math.log10);
    const logEs = errors.map(e => Math.log10(Math.max(e, 1e-20)));

    const hMin = Math.min(...logHs) - 0.1;
    const hMax = Math.max(...logHs) + 0.1;
    const eMin = Math.min(...logEs) - 0.5;
    const eMax = Math.max(...logEs) + 0.5;

    const axesR = new Axes(
      c,
      { left: splitX + 20, top: pad.top, right: w - 12, bottom: pad.bottom },
      [hMin, hMax],
      [eMin, eMax],
    );
    axesR.grid({ xLabel: 'log₁₀ h', yLabel: 'log₁₀ |error|' });

    axesR.polyline(logHs.map((lh, i) => [lh, logEs[i]]),
      { color: theme.color('--accent'), width: 2.5 });

    // Mark each point
    for (let i = 0; i < 3; i++) {
      const px = axesR.x(logHs[i]);
      const py = axesR.y(logEs[i]);
      c.beginPath();
      c.arc(px, py, 4, 0, 2 * Math.PI);
      c.fillStyle = theme.color('--accent');
      c.fill();
    }

    // Slope annotation
    c.font = '12px sans-serif';
    c.fillStyle = theme.color('--text');
    c.fillText(`slope = ${slope.toFixed(2)}`, axesR.box.left + 8, pad.top + 18);
  }
}
