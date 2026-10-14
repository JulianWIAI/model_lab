/**
 * Wraps a <canvas> so drawings stay sharp on high-resolution screens
 * and follow the canvas's size on the page.
 *
 * Usage in a view:  const ctx = this.canvasView.begin();  then draw in CSS pixels
 * using canvasView.width and canvasView.height.
 */
export class CanvasView {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
  }

  /**
   * Resizes the pixel buffer if needed, clears it, and returns the context.
   * @returns {CanvasRenderingContext2D}
   */
  begin() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.width = rect.width;
    this.height = rect.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
    this.ctx.clearRect(0, 0, this.width, this.height);
    return this.ctx;
  }
}
