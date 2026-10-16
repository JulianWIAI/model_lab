import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

/**
 * Plots the frequency of allele A over generations, one line per population.
 * Lines turn green when A takes over and orange when A is lost.
 * The dashed line shows what selection alone would do without chance.
 */
export class DriftView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /** @param {import('./WrightFisherModel.js').WrightFisherModel} model */
  draw(model) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);
    const maxG = model.maxGenerations;
    const axes = new Axes(c, { left: 44, top: 20, right: w - 10, bottom: h - 36 }, [0, maxG], [0, 1]);

    const xTicks = [];
    for (let g = 0; g <= maxG; g += 50) xTicks.push(g);
    axes.grid({
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      yFormat: (v) => v.toFixed(2),
      yLabel: 'frequency of allele A',
      xTicks,
      xLabel: 'generation',
    });

    const accent = theme.color('--accent');
    const good = theme.color('--good');
    const signal = theme.color('--signal');
    for (const path of model.history) {
      const last = path[path.length - 1];
      const color = last === 1 ? good : last === 0 ? signal : accent;
      axes.polyline(path.map((p, g) => [g, p]), { color, width: 1.5, alpha: 0.6 });
    }

    axes.polyline(model.deterministic.map((p, g) => [g, p]), { color: theme.color('--ink'), width: 2, dash: [6, 4] });
  }
}
