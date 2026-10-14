/**
 * A rolling window of samples over time, used for scrolling traces
 * (voltage over time, concentrations over time, ...).
 */
export class TimeSeries {
  /** @param {number} window how much time to keep, in the simulation's own units */
  constructor(window) {
    this.window = window;
    /** @type {{t: number, values: number[]}[]} */
    this.samples = [];
  }

  /**
   * Adds one sample and drops anything older than the window.
   * @param {number} t time of the sample
   * @param {number[]} values one number per channel
   */
  push(t, values) {
    this.samples.push({ t, values });
    const cutoff = t - this.window;
    let old = 0;
    while (old < this.samples.length && this.samples[old].t < cutoff) old++;
    if (old > 0) this.samples.splice(0, old);
  }

  clear() {
    this.samples = [];
  }

  /** Time of the newest sample, or 0 when empty. */
  get latestTime() {
    return this.samples.length ? this.samples[this.samples.length - 1].t : 0;
  }

  /**
   * @param {number} index channel number
   * @returns {[number, number][]} [time, value] pairs ready for Axes.polyline
   */
  channel(index) {
    return this.samples.map((s) => [s.t, s.values[index]]);
  }
}
