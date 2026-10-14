/**
 * Fourier series of three classic waves, cut off after a chosen number of terms.
 * Each term is  a·sin(n·t);  the list of (n, a) pairs fully describes the series.
 */
export class FourierSeries {
  /** Text shown in the formula card for each wave. */
  static FORMULAS = {
    square: 'f(t) = (4/π) · Σ sin(n·t) / n\n         n = 1, 3, 5, …\n\nOnly odd harmonics. Size falls as 1/n.',
    saw: 'f(t) = (2/π) · Σ (−1)ⁿ⁺¹ · sin(n·t) / n\n         n = 1, 2, 3, …\n\nAll harmonics. Size falls as 1/n.',
    tri: 'f(t) = (8/π²) · Σ (−1)^((n−1)/2) · sin(n·t) / n²\n         n = 1, 3, 5, …\n\nSize falls as 1/n², so it converges fast.',
  };

  /**
   * @param {'square'|'saw'|'tri'} wave
   * @param {number} terms  how many sine waves (circles) to use
   */
  constructor(wave = 'square', terms = 5) {
    this.wave = wave;
    this.terms = terms;
  }

  /** @returns {{n: number, a: number}[]} frequency n and amplitude a of every term */
  coefficients() {
    const list = [];
    for (let k = 1; k <= this.terms; k++) {
      if (this.wave === 'square') {
        const n = 2 * k - 1;
        list.push({ n, a: 4 / (Math.PI * n) });
      } else if (this.wave === 'saw') {
        list.push({ n: k, a: ((k % 2 ? 1 : -1) * 2) / (Math.PI * k) });
      } else {
        const n = 2 * k - 1;
        list.push({ n, a: ((k % 2 ? 1 : -1) * 8) / (Math.PI * Math.PI * n * n) });
      }
    }
    return list;
  }

  /** Value of the cut-off series at t. */
  evaluate(t) {
    return this.coefficients().reduce((sum, { n, a }) => sum + a * Math.sin(n * t), 0);
  }

  /** The exact wave the series is trying to copy (period 2π, height ±1). */
  target(t) {
    const x = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // wrap into [0, 2π)
    if (this.wave === 'square') return x < Math.PI ? 1 : -1;
    if (this.wave === 'saw') return x < Math.PI ? x / Math.PI : (x - 2 * Math.PI) / Math.PI;
    if (x < Math.PI / 2) return (2 * x) / Math.PI;
    if (x < (3 * Math.PI) / 2) return 2 - (2 * x) / Math.PI;
    return (2 * x) / Math.PI - 4;
  }

  /** Highest absolute value the series reaches over one period. */
  peak() {
    const coeffs = this.coefficients();
    let peak = 0;
    for (let i = 1; i < 1200; i++) {
      const t = (i / 1200) * 2 * Math.PI;
      let s = 0;
      for (const { n, a } of coeffs) s += a * Math.sin(n * t);
      peak = Math.max(peak, Math.abs(s));
    }
    return peak;
  }

  /**
   * How far the series overshoots, as a percentage of the jump it has to make.
   * Square and sawtooth jump by 2; the triangle has no jump, so we compare with its height.
   */
  overshootPercent() {
    const excess = this.peak() - 1;
    const jump = this.wave === 'tri' ? 1 : 2;
    return Math.max(0, (excess / jump) * 100);
  }

  get formula() {
    return FourierSeries.FORMULAS[this.wave];
  }
}
