/**
 * HessView — enthalpy level diagram with arrows between levels.
 */
import { theme } from '../../../../core/Theme.js';

export class HessView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./HessModel.js').HessModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const levels = model.enthalpyLevels();
    const dH = model.deltaH();

    // Sort levels by H value for vertical placement
    const Hvals = levels.map(l => l.H);
    const Hmin = Math.min(...Hvals);
    const Hmax = Math.max(...Hvals);
    const Hrange = Hmax - Hmin || 1;

    // Layout
    const padTop = 48, padBottom = 48, padLeft = 100, padRight = 40;
    const plotH = h - padTop - padBottom;
    const plotW = w - padLeft - padRight;

    // Map H value to y pixel (higher H = lower y = higher on screen)
    const toY = (Hval) => padTop + ((Hmax - Hval) / Hrange) * plotH;

    // Color scheme
    const colors = [
      theme.color('--muted'),   // elements
      theme.color('--accent'),  // reactants
      theme.color('--signal'),  // products
    ];

    const levelW = plotW * 0.4;
    const levelX = [padLeft + plotW * 0.05, padLeft + plotW * 0.3, padLeft + plotW * 0.55];

    // Draw level lines
    for (let i = 0; i < levels.length; i++) {
      const lv = levels[i];
      const y = toY(lv.H);
      const x = levelX[i];

      c.save();
      c.strokeStyle = colors[i];
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + levelW, y);
      c.stroke();

      // Label
      c.fillStyle = colors[i];
      c.font = '12px monospace';
      c.textAlign = 'left';
      c.fillText(lv.label, x, y - 8);
      c.fillStyle = theme.color('--on-surface');
      c.font = '11px monospace';
      c.fillText(`${lv.H.toFixed(1)} kJ/mol`, x, y + 16);
      c.restore();
    }

    // Draw arrow from reactants to products
    const reacLevel = levels[1];
    const prodLevel = levels[2];
    const reacY = toY(reacLevel.H);
    const prodY = toY(prodLevel.H);
    const arrowX = levelX[1] + levelW / 2;
    const arrowX2 = levelX[2] + levelW / 2;

    // Arrow color: blue for exothermic (dH < 0), red for endothermic
    const arrowColor = dH < 0 ? '#3b82f6' : '#ef4444';

    c.save();
    c.strokeStyle = arrowColor;
    c.fillStyle = arrowColor;
    c.lineWidth = 2;

    // Draw vertical arrow between reactant level and product level
    const startX = padLeft + plotW * 0.75;
    const startY = reacY;
    const endY = prodY;

    c.beginPath();
    c.moveTo(startX, startY);
    c.lineTo(startX, endY);
    c.stroke();

    // Arrowhead
    const dir = endY > startY ? 1 : -1;
    c.beginPath();
    c.moveTo(startX, endY);
    c.lineTo(startX - 6, endY - dir * 12);
    c.lineTo(startX + 6, endY - dir * 12);
    c.closePath();
    c.fill();

    // ΔH annotation
    const midY = (startY + endY) / 2;
    c.font = 'bold 13px monospace';
    c.textAlign = 'left';
    c.fillText(`ΔH° = ${dH.toFixed(1)} kJ/mol`, startX + 10, midY);
    c.font = '11px monospace';
    c.fillText(dH < 0 ? 'exothermic' : 'endothermic', startX + 10, midY + 16);
    c.restore();

    // Title
    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.font = 'bold 13px monospace';
    c.textAlign = 'center';
    c.fillText(model.reaction.equation, w / 2, padTop / 2);
    c.restore();
  }
}
