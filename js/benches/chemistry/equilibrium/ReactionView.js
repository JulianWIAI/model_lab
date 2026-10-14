import { Axes } from '../../../core/Axes.js';
import { theme } from '../../../core/Theme.js';

/**
 * Left (or top on phones): concentrations of A, B and C over time.
 * Right (or bottom): the energy profile with the barrier and ΔH.
 */
export class ReactionView {
  /** @param {import('../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./ReactionModel.js').ReactionModel} model
   * @param {import('../../../core/TimeSeries.js').TimeSeries} trace  channels: A, B, C
   */
  draw(model, trace) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    const sideBySide = w > 560;

    const concBox = sideBySide
      ? { left: 44, top: 20, right: w * 0.63, bottom: h - 26 }
      : { left: 44, top: 20, right: w - 8, bottom: h * 0.5 };
    const energyBox = sideBySide
      ? { left: w * 0.63 + 40, top: 20, right: w - 10, bottom: h - 26 }
      : { left: 44, top: h * 0.5 + 44, right: w - 10, bottom: h - 12 };

    this.#drawConcentrations(c, concBox, model, trace);
    this.#drawEnergy(c, energyBox, model);
  }

  #drawConcentrations(c, box, model, trace) {
    const t1 = Math.max(20, trace.latestTime);
    let top = 2;
    for (const s of trace.samples) top = Math.max(top, ...s.values);
    top = Math.ceil(top * 2) / 2; // round up to the next 0.5

    const axes = new Axes(c, box, [t1 - 20, t1], [0, top]);
    const yTicks = [];
    for (let v = 0; v <= top + 1e-9; v += top > 2.5 ? 1 : 0.5) yTicks.push(v);
    axes.grid({
      yTicks,
      yFormat: (v) => v.toFixed(1),
      yLabel: 'mol/L',
      xTicks: [Math.ceil(t1 - 20), Math.round(t1 - 10), Math.floor(t1)],
      xFormat: (v) => `${v}s`,
    });
    axes.polyline(trace.channel(1), { color: theme.color('--signal'), width: 1.5, dash: [5, 4] });
    axes.polyline(trace.channel(0), { color: theme.color('--accent'), width: 2 });
    axes.polyline(trace.channel(2), { color: theme.color('--third'), width: 2.5 });
  }

  /** Energy along the reaction path: flat reactants, a hump, flat products. */
  #drawEnergy(c, box, model) {
    const ea = model.activationForward;
    const dH = model.reactionEnergy;
    const low = Math.min(-40, dH - 10);
    const axes = new Axes(c, box, [0, 1], [low, 100]);
    // ΔH gets a text label on the curve instead of a tick, so labels never collide near 0.
    axes.grid({ yTicks: [0, ea], yFormat: (v) => `${Math.round(v)}`, yLabel: 'kJ/mol' });

    const path = (barrier) => (x) => {
      if (x < 0.2) return 0;
      if (x < 0.5) return (barrier * (1 - Math.cos((Math.PI * (x - 0.2)) / 0.3))) / 2;
      if (x < 0.8) return dH + ((barrier - dH) * (1 + Math.cos((Math.PI * (x - 0.5)) / 0.3))) / 2;
      return dH;
    };

    axes.plotFunction(path(ea), { color: theme.color('--ink'), width: 2 });
    if (model.catalyst) {
      axes.plotFunction(path(model.effectiveBarrier(ea)), { color: theme.color('--good'), width: 2, dash: [5, 4] });
      axes.label('with catalyst', 0.5, model.effectiveBarrier(ea), { color: theme.color('--good'), align: 'center', dy: 14 });
    }
    axes.label('A + B', 0.02, 0, { dy: -6 });
    axes.label('C', 0.88, dH, { dy: -6 });
    axes.label(`Ea ${Math.round(ea)}`, 0.5, ea, { align: 'center', dy: -6 });
    axes.label(`ΔH ${dH > 0 ? '+' : ''}${Math.round(dH)}`, 0.98, dH, { align: 'right', dy: 14 });
  }
}
