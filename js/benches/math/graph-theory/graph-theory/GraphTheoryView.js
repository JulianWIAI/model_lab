/**
 * GraphTheoryView — draws graph nodes and edges with labels.
 */
import { theme } from '../../../../core/Theme.js';

export class GraphTheoryView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(graph, nodePositions, highlights) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    if (!nodePositions || nodePositions.size === 0) return;

    // Scale positions to canvas
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [, pos] of nodePositions) {
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.y > maxY) maxY = pos.y;
    }
    const pad = 40;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = (v, lo, range, lo2, range2) => lo2 + ((v - lo) / range) * range2;

    // Draw edges
    const adj = graph.adjacencyList();
    c.strokeStyle = theme.color('--muted');
    c.lineWidth = 1.5;
    const drawn = new Set();
    for (const [u, edges] of adj) {
      const pu = nodePositions.get(u);
      if (!pu) continue;
      const ux = scale(pu.x, minX, rangeX, pad, w - 2 * pad);
      const uy = scale(pu.y, minY, rangeY, pad, h - 2 * pad);
      for (const { to } of edges) {
        const key = [u, to].sort().join('-');
        if (drawn.has(key)) continue;
        drawn.add(key);
        const pv = nodePositions.get(to);
        if (!pv) continue;
        const vx = scale(pv.x, minX, rangeX, pad, w - 2 * pad);
        const vy = scale(pv.y, minY, rangeY, pad, h - 2 * pad);
        c.beginPath();
        c.moveTo(ux, uy);
        c.lineTo(vx, vy);
        c.stroke();
      }
    }

    // Draw nodes
    for (const [id, pos] of nodePositions) {
      const px = scale(pos.x, minX, rangeX, pad, w - 2 * pad);
      const py = scale(pos.y, minY, rangeY, pad, h - 2 * pad);
      const isHighlight = highlights && highlights.has(id);
      c.fillStyle = isHighlight ? theme.color('--signal') : theme.color('--accent');
      c.beginPath();
      c.arc(px, py, 8, 0, 2 * Math.PI);
      c.fill();
      c.fillStyle = theme.color('--text');
      c.font = '11px sans-serif';
      c.textAlign = 'center';
      c.fillText(String(id), px, py - 12);
    }
  }
}
