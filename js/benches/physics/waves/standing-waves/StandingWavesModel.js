/**
 * StandingWavesModel — standing wave harmonics for strings and pipes.
 *
 * Conventions:
 *   mode='string' or 'open': fixed-fixed or open-open pipe
 *     f_n = n·v/(2L), n = 1,2,3,...
 *   mode='closed': closed-open pipe (one closed end), odd harmonics only
 *     f_m = m·v/(4L), m = 1,3,5,...
 *
 * Displacement (string):
 *   y(x,t) = sin(n·π·x/L) · cos(2·π·f_n·t)
 *
 * Where it breaks:
 *   - End correction: real pipes have an effective length L + 0.6r (r = radius).
 *   - v_air at 20°C ≈ 343 m/s (source "unverified").
 *   - Pressure vs displacement: pressure nodes are at displacement antinodes.
 */
export class StandingWavesModel {
  /**
   * @param {{ L?: number, v?: number, mode?: string, n?: number }} opts
   *   L:    string/pipe length in metres (default 1.0)
   *   v:    wave speed in m/s (default 343)
   *   mode: 'string' | 'open' | 'closed' (default 'string')
   *   n:    mode number (for closed pipe: odd only, e.g. 1,3,5)
   */
  constructor({ L = 1.0, v = 343, mode = 'string', n = 1 } = {}) {
    this.L = L;
    this.v = v;
    this.mode = mode;
    this.n = n;
  }

  /**
   * Frequency of harmonic n (string/open) or m (closed, must be odd).
   * @param {number} [harmonic]  defaults to this.n
   * @returns {number}
   */
  frequency(harmonic = this.n) {
    if (this.mode === 'closed') {
      // m must be odd; use m as-is
      return harmonic * this.v / (4 * this.L);
    }
    return harmonic * this.v / (2 * this.L);
  }

  /**
   * Wavelength of harmonic n.
   * @param {number} [harmonic]
   * @returns {number}
   */
  wavelength(harmonic = this.n) {
    return this.v / this.frequency(harmonic);
  }

  /**
   * Array of {n, f} for the first maxN harmonics.
   * For closed pipe, only odd m are included.
   * @param {number} [maxN=5]
   * @returns {{ n: number, f: number }[]}
   */
  frequencies(maxN = 5) {
    const result = [];
    if (this.mode === 'closed') {
      for (let m = 1; m <= 2 * maxN - 1; m += 2) {
        result.push({ n: m, f: this.frequency(m) });
        if (result.length >= maxN) break;
      }
    } else {
      for (let i = 1; i <= maxN; i++) {
        result.push({ n: i, f: this.frequency(i) });
      }
    }
    return result;
  }

  /**
   * Node positions for string mode harmonic n.
   * Nodes at x = k·L/n for k = 0,1,...,n.
   * @param {number} [harmonic]
   * @returns {number[]}
   */
  nodePositions(harmonic = this.n) {
    const positions = [];
    for (let k = 0; k <= harmonic; k++) {
      positions.push(k * this.L / harmonic);
    }
    return positions;
  }

  /**
   * Displacement of string at position x and time t.
   * @param {number} x  position in [0,L]
   * @param {number} t  time in seconds
   * @param {number} [harmonic]
   * @returns {number}
   */
  displacement(x, t, harmonic = this.n) {
    const f = this.frequency(harmonic);
    return Math.sin(harmonic * Math.PI * x / this.L) * Math.cos(2 * Math.PI * f * t);
  }

  /**
   * Snapshot of the string shape at time t: [{x, y}].
   * @param {number} t
   * @param {number} [harmonic]
   * @param {number} [nPoints=200]
   * @returns {{ x: number, y: number }[]}
   */
  snapshot(t, harmonic = this.n, nPoints = 200) {
    const pts = [];
    for (let i = 0; i <= nPoints; i++) {
      const x = (i / nPoints) * this.L;
      pts.push({ x, y: this.displacement(x, t, harmonic) });
    }
    return pts;
  }
}
