/**
 * RescorlaWagnerView — two-panel canvas: V_i vs trial (left) + scenario diagram (right).
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class RescorlaWagnerView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./RescorlaWagnerModel.js').RescorlaWagnerModel} model
   * @param {string} scenario
   * @param {number} nTrials
   */
  draw(model, scenario, nTrials) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const pad = { left: 56, top: 20, bottom: h - 36 };

    const { n: ns, VA, VB } = model.simulate(scenario, nTrials);

    const allV = [...VA, ...VB];
    const vMin = Math.min(...allV, -0.1) * 1.1;
    const vMax = Math.max(...allV, model.lambda + 0.1) * 1.1;

    const axes = new Axes(
      c,
      { left: pad.left, top: pad.top, right: w - 12, bottom: pad.bottom },
      [0, nTrials], [vMin, vMax],
    );
    axes.grid({ xLabel: 'trial n', yLabel: 'V' });

    // λ dashed line
    c.save();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(pad.left, axes.y(model.lambda));
    c.lineTo(w - 12, axes.y(model.lambda));
    c.stroke();
    c.setLineDash([]);
    c.restore();

    c.font = '11px sans-serif';
    c.fillStyle = theme.color('--muted');
    c.fillText('λ', w - 24, axes.y(model.lambda) - 3);

    // V_A curve
    axes.polyline(ns.map((ni, i) => [ni, VA[i]]),
      { color: theme.color('--accent'), width: 2.5 });

    // V_B curve (show if non-zero)
    const maxVB = Math.max(...VB.map(Math.abs));
    if (maxVB > 1e-10) {
      axes.polyline(ns.map((ni, i) => [ni, VB[i]]),
        { color: theme.color('--signal'), width: 2 });
    }

    // Legend
    const labels = {
      'acquisition': ['V_A', null],
      'extinction': ['V_A', null],
      'blocking': ['V_A', 'V_B'],
      'overshadowing': ['V_A', 'V_B'],
      'overexpectation': ['V_A', 'V_B'],
      'conditioned-inhibition': ['V_A', 'V_X'],
    };
    const [labelA, labelB] = labels[scenario] || ['V_A', 'V_B'];
    c.font = '12px sans-serif';
    c.fillStyle = theme.color('--accent');
    c.fillText(labelA, pad.left + 8, pad.top + 16);
    if (labelB && maxVB > 1e-10) {
      c.fillStyle = theme.color('--signal');
      c.fillText(labelB, pad.left + 8, pad.top + 32);
    }
  }
}
