import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

/**
 * Top: membrane voltage over the last 100 ms.
 * Bottom: the three gating variables m, h, n on the same time axis.
 */
export class NeuronView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('../../../../core/TimeSeries.js').TimeSeries} trace  channels: V, m, h, n
   * @param {import('./HodgkinHuxleyModel.js').HodgkinHuxleyModel} model
   */
  draw(trace, model) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    const t1 = Math.max(trace.window, trace.latestTime);
    const t0 = t1 - trace.window;

    const voltage = new Axes(c, { left: 44, top: 20, right: w - 8, bottom: h * 0.6 }, [t0, t1], [-90, 60]);
    voltage.grid({ yTicks: [-80, -65, 0, 40], yLabel: 'mV' });

    const gates = new Axes(c, { left: 44, top: h * 0.6 + 34, right: w - 8, bottom: h - 24 }, [t0, t1], [0, 1]);
    gates.grid({ yTicks: [0, 0.5, 1], yFormat: (v) => v.toFixed(1), yLabel: 'fraction of gates open', xLabel: 'last 100 ms' });

    gates.polyline(trace.channel(1), { color: theme.color('--signal'), width: 1.5 });
    gates.polyline(trace.channel(2), { color: theme.color('--third'), width: 1.5 });
    gates.polyline(trace.channel(3), { color: theme.color('--good'), width: 1.5 });
    voltage.polyline(trace.channel(0), { color: theme.color('--accent'), width: 2 });

    if (model.pulseActive) voltage.label('pulse', t1, 55, { color: theme.color('--signal'), align: 'right', dx: -4, dy: 0 });
  }
}
