/**
 * SIRView — S, I, R fractions over time with peak I marker.
 */
import { Axes } from '../../../../core/Axes.js';
import { theme } from '../../../../core/Theme.js';

export class SIRView {
  /** @param {import('../../../../core/CanvasView.js').CanvasView} canvasView */
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  /**
   * @param {import('./SIRModel.js').SIRModel} model
   */
  draw(model) {
    const cv = this.canvasView;
    const c  = cv.begin();
    const { width: w, height: h } = cv;

    c.fillStyle = theme.color('--surface');
    c.fillRect(0, 0, w, h);

    const hist = model.history;
    if (hist.length < 2) return;

    const tMin = hist[0].t;
    const tMax = hist[hist.length - 1].t;

    const axes = new Axes(
      c,
      { left: 56, top: 16, right: w - 16, bottom: h - 36 },
      [tMin, tMax],
      [0, 1],
    );
    axes.grid({
      xLabel: 't (days)',
      yLabel: 'fraction',
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      yFormat: v => v.toFixed(2),
    });

    // Find peak I time for vertical line
    let peakITime = tMin;
    let peakIVal = 0;
    for (const pt of hist) {
      if (pt.I > peakIVal) {
        peakIVal = pt.I;
        peakITime = pt.t;
      }
    }

    // Dashed vertical at peak I
    if (peakIVal > model.I0 * 2) {
      c.save();
      c.strokeStyle = theme.color('--signal');
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(axes.x(peakITime), axes.box.top);
      c.lineTo(axes.x(peakITime), axes.box.bottom);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // S curve (accent)
    const sPts = hist.map(pt => [pt.t, pt.S]);
    axes.polyline(sPts, { color: theme.color('--accent'), width: 2.5 });

    // I curve (signal)
    const iPts = hist.map(pt => [pt.t, pt.I]);
    axes.polyline(iPts, { color: theme.color('--signal'), width: 2.5 });

    // R curve (muted)
    const rPts = hist.map(pt => [pt.t, pt.R]);
    axes.polyline(rPts, { color: theme.color('--muted'), width: 2.5 });

    // Legend
    c.save();
    c.font = '11px monospace';
    const legendX = axes.box.left + 8;
    let legendY = axes.box.top + 14;
    c.fillStyle = theme.color('--accent');
    c.textAlign = 'left';
    c.fillText('S', legendX, legendY);
    legendY += 16;
    c.fillStyle = theme.color('--signal');
    c.fillText('I', legendX, legendY);
    legendY += 16;
    c.fillStyle = theme.color('--muted');
    c.fillText('R', legendX, legendY);
    c.restore();
  }
}
