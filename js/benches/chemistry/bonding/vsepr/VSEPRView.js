/**
 * VSEPRView — 3D orthographic projection of molecular geometry.
 * Mouse drag to rotate.
 */
import { theme } from '../../../../core/Theme.js';

export class VSEPRView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this._model = null;

    // Set up mouse event listeners on the canvas element
    const el = canvasView.canvas || canvasView._canvas;
    if (el) {
      el.addEventListener('mousedown', (e) => this._onMouseDown(e));
      el.addEventListener('mousemove', (e) => this._onMouseMove(e));
      el.addEventListener('mouseup',   () => { this._dragging = false; });
      el.addEventListener('mouseleave',() => { this._dragging = false; });
    }
  }

  _onMouseDown(e) {
    this._dragging = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
  }

  _onMouseMove(e) {
    if (!this._dragging || !this._model) return;
    const dx = e.clientX - this._lastX;
    const dy = e.clientY - this._lastY;
    this._model.rotate(dx * 3, dy * 3);
    this._lastX = e.clientX;
    this._lastY = e.clientY;
  }

  /**
   * @param {import('./VSEPRModel.js').VSEPRModel} model
   */
  draw(model) {
    this._model = model;
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const g = model.geometry;
    const cx = w / 2;
    const cy = (h - 50) / 2 + 16;
    const scale = Math.min(w, h - 80) * 0.3;

    const { ligands } = model.atoms3D(1);

    // Sort by z (back to front)
    const sorted = ligands.slice().sort((a, b) => a.pos[2] - b.pos[2]);

    // Ligand colors
    const ligandColors = [
      theme.color('--accent'),
      theme.color('--signal'),
      '#a855f7', // purple
      '#f97316', // orange
      '#10b981', // green
      '#06b6d4', // cyan
    ];

    // Draw bonds (grey lines from centre to ligand)
    for (const lig of sorted) {
      const px = cx + lig.pos[0] * scale;
      const py = cy - lig.pos[1] * scale;
      c.save();
      c.strokeStyle = theme.color('--muted');
      c.lineWidth = 3;
      c.globalAlpha = 0.6 + 0.4 * (1 - (lig.pos[2] + 1) / 2);
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(px, py);
      c.stroke();
      c.restore();
    }

    // Draw centre atom
    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.globalAlpha = 0.9;
    c.beginPath();
    c.arc(cx, cy, 14, 0, 2 * Math.PI);
    c.fill();
    c.restore();

    // Draw ligand atoms
    for (let i = 0; i < sorted.length; i++) {
      const lig = sorted[i];
      const px = cx + lig.pos[0] * scale;
      const py = cy - lig.pos[1] * scale;
      const alpha = 0.5 + 0.5 * ((lig.pos[2] + 1) / 2);
      const radius = 10;
      const colorIdx = ligands.indexOf(lig) % ligandColors.length;
      c.save();
      c.fillStyle = ligandColors[colorIdx];
      c.globalAlpha = alpha;
      c.beginPath();
      c.arc(px, py, radius, 0, 2 * Math.PI);
      c.fill();
      c.restore();
    }

    // Text annotation at bottom
    c.save();
    c.fillStyle = theme.color('--on-surface');
    c.font = '13px monospace';
    c.textAlign = 'center';
    const infoY = h - 40;
    c.fillText(`${g.name}  (${g.type})  — ideal angle: ${g.idealAngle}°`, cx, infoY);
    if (g.realAngle !== null) {
      c.fillStyle = theme.color('--signal');
      c.fillText(`${g.realExample}: real angle ${g.realAngle}°  (ideal ${g.idealAngle}°)`, cx, infoY + 18);
    } else if (g.realExample) {
      c.fillStyle = theme.color('--muted');
      c.fillText(`example: ${g.realExample}`, cx, infoY + 18);
    }
    c.restore();
  }
}
