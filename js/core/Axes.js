import { theme } from './Theme.js';

/**
 * A rectangular plot area that maps data values to pixels.
 * Handles grid lines, tick labels and drawing lines or filled shapes.
 */
export class Axes {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{left: number, top: number, right: number, bottom: number}} box  plot area in pixels
   * @param {[number, number]} xRange  data value at left and right edge
   * @param {[number, number]} yRange  data value at bottom and top edge
   */
  constructor(ctx, box, xRange, yRange) {
    this.ctx = ctx;
    this.box = box;
    [this.xMin, this.xMax] = xRange;
    [this.yMin, this.yMax] = yRange;
  }

  get left()   { return this.box.left; }
  get right()  { return this.box.right; }
  get top()    { return this.box.top; }
  get bottom() { return this.box.bottom; }

  /** Data x value -> pixel x */
  x(value) {
    const { left, right } = this.box;
    return left + ((value - this.xMin) / (this.xMax - this.xMin)) * (right - left);
  }

  /** Data y value -> pixel y (y grows upwards in data, downwards on screen) */
  y(value) {
    const { top, bottom } = this.box;
    return bottom - ((value - this.yMin) / (this.yMax - this.yMin)) * (bottom - top);
  }

  /**
   * Draws horizontal grid lines with labels, x tick labels and axis titles.
   * @param {object} options
   */
  grid({ xTicks = [], yTicks = [], xFormat = String, yFormat = String, xLabel = '', yLabel = '' } = {}) {
    const c = this.ctx;
    const { left, right, top, bottom } = this.box;
    c.save();
    c.lineWidth = 1;
    c.strokeStyle = theme.color('--grid');
    c.fillStyle = theme.color('--muted');
    c.font = theme.font(11);

    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (const v of yTicks) {
      const py = Math.round(this.y(v)) + 0.5; // half-pixel keeps 1px lines crisp
      c.beginPath();
      c.moveTo(left, py);
      c.lineTo(right, py);
      c.stroke();
      c.fillText(yFormat(v), left - 6, py);
    }

    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (const v of xTicks) c.fillText(xFormat(v), this.x(v), bottom + 6);

    if (xLabel) {
      // Sits below the tick labels if there are any, otherwise right under the axis.
      c.textAlign = 'right';
      c.fillText(xLabel, right, bottom + (xTicks.length ? 20 : 6));
    }
    if (yLabel) {
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      c.fillText(yLabel, left, top - 4);
    }
    c.restore();
  }

  /**
   * Draws a line through data points, clipped to the plot area.
   * @param {[number, number][]} points
   * @param {{color: string, width?: number, dash?: number[], alpha?: number}} style
   */
  polyline(points, { color, width, lineWidth, dash = [], alpha = 1 }) {
    if (points.length < 2) return;
    const lw = width ?? lineWidth ?? 2;
    const c = this.ctx;
    c.save();
    this.#clip();
    c.strokeStyle = color;
    c.lineWidth = lw;
    c.lineJoin = 'round';
    c.setLineDash(dash);
    c.globalAlpha = alpha;
    c.beginPath();
    if (Array.isArray(points[0])) {
      // Data coordinates: [x, y] pairs
      points.forEach(([px, py], i) => (i ? c.lineTo(this.x(px), this.y(py)) : c.moveTo(this.x(px), this.y(py))));
    } else {
      // Pixel coordinates: {x, y} objects (pre-converted via toPixel)
      points.forEach(({ x, y }, i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    }
    c.stroke();
    c.restore();
  }

  /** Draws a filled circle at a data-coordinate point. */
  point([xv, yv], { color, r = 4, fill = true }) {
    const px = this.x(xv);
    const py = this.y(yv);
    const c = this.ctx;
    c.save();
    c.fillStyle = color;
    c.strokeStyle = color;
    c.beginPath();
    c.arc(px, py, r, 0, 2 * Math.PI);
    if (fill) c.fill(); else c.stroke();
    c.restore();
  }

  /**
   * Plots y = fn(x) across the whole x range.
   * @param {(x: number) => number} fn
   */
  plotFunction(fn, style, steps = 240) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const xv = this.xMin + ((this.xMax - this.xMin) * i) / steps;
      points.push([xv, fn(xv)]);
    }
    this.polyline(points, style);
  }

  /**
   * Fills a closed shape given in data coordinates.
   * @param {[number, number][]} points
   */
  fillPolygon(points, { color, alpha = 0.25 }) {
    if (points.length < 3) return;
    const c = this.ctx;
    c.save();
    this.#clip();
    c.fillStyle = color;
    c.globalAlpha = alpha;
    c.beginPath();
    points.forEach(([px, py], i) => (i ? c.lineTo(this.x(px), this.y(py)) : c.moveTo(this.x(px), this.y(py))));
    c.closePath();
    c.fill();
    c.restore();
  }

  /**
   * Converts a data point to pixel coordinates.
   * @param {number} xValue
   * @param {number} yValue
   * @returns {{x: number, y: number}}
   */
  toPixel(xValue, yValue) {
    return { x: this.x(xValue), y: this.y(yValue) };
  }

  /** Writes a small label at a data position. */
  label(text, xv, yv, { color = theme.color('--muted'), align = 'left', dx = 4, dy = -4 } = {}) {
    const c = this.ctx;
    c.save();
    c.font = theme.font(11);
    c.fillStyle = color;
    c.textAlign = align;
    c.fillText(text, this.x(xv) + dx, this.y(yv) + dy);
    c.restore();
  }

  /** Restricts drawing to the plot area (with a little room for line width). */
  #clip() {
    const { left, right, top, bottom } = this.box;
    this.ctx.beginPath();
    this.ctx.rect(left, top - 2, right - left, bottom - top + 4);
    this.ctx.clip();
  }
}
