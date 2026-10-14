import { Axes } from '../../../core/Axes.js';
import { theme } from '../../../core/Theme.js';

/**
 * Draws the two pendulums in the top part of the canvas and
 * a scrolling trace of both angles underneath.
 */
export class PendulumView {
  /** @param {import('../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./PendulumModel.js').PendulumModel} model
   * @param {import('../../../core/TimeSeries.js').TimeSeries} trace  angles in degrees
   */
  draw(model, trace) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    const swingHeight = h * 0.56;

    // Rod length on screen: the longest allowed rod (2 m) just fits.
    const pixelsPerMetre = (swingHeight - 34) / 2;
    const rod = model.length * pixelsPerMetre;
    const pivots = [
      { x: w * 0.3, state: model.exact, color: theme.color('--accent'), label: 'exact · sin θ' },
      { x: w * 0.7, state: model.shortcut, color: theme.color('--signal'), label: 'shortcut · θ' },
    ];

    c.font = theme.font(11);
    c.textAlign = 'center';
    for (const p of pivots) this.#drawPendulum(c, p, rod, model.startAngleDeg);
    c.textAlign = 'start';

    // Angle trace: last 10 seconds
    const t1 = Math.max(10, trace.latestTime);
    const span = Math.max(10, model.startAngleDeg) * 1.15;
    const axes = new Axes(c, { left: 44, top: swingHeight + 22, right: w - 8, bottom: h - 24 }, [t1 - 10, t1], [-span, span]);
    axes.grid({
      yTicks: [-Math.round(model.startAngleDeg), 0, Math.round(model.startAngleDeg)],
      yFormat: (v) => `${v}°`,
      yLabel: 'angle',
      xTicks: [Math.ceil(t1 - 10), Math.ceil(t1 - 5), Math.floor(t1)],
      xFormat: (v) => `${v}s`,
    });
    axes.polyline(trace.channel(1), { color: theme.color('--signal'), width: 1.5 });
    axes.polyline(trace.channel(0), { color: theme.color('--accent'), width: 2 });
  }

  /** One pendulum: faint release-angle guide, rod, bob and caption. */
  #drawPendulum(c, { x, state, color, label }, rod, startAngleDeg) {
    const top = 22;
    const start = (startAngleDeg * Math.PI) / 180;

    // Arc showing the release angle on both sides
    c.strokeStyle = theme.color('--grid');
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, top, rod, Math.PI / 2 - start, Math.PI / 2 + start);
    c.stroke();

    // Pivot
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 24, top);
    c.lineTo(x + 24, top);
    c.stroke();

    // θ is measured from straight down, positive to the right
    const bx = x + rod * Math.sin(state.theta);
    const by = top + rod * Math.cos(state.theta);
    c.strokeStyle = theme.color('--ink');
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x, top);
    c.lineTo(bx, by);
    c.stroke();

    c.fillStyle = color;
    c.beginPath();
    c.arc(bx, by, 10, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = theme.color('--muted');
    c.fillText(label, x, 12);
  }
}
