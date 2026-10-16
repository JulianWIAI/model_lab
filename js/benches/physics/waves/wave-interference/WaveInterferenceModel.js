/**
 * WaveInterferenceModel — Young's double-slit interference (paraxial model).
 *
 * h(y) = I0 * cos²(π·d·y / (λ·L))
 * Fringe spacing Δy = λL/d
 *
 * Paraxial approximation: valid when y ≪ L, i.e. θ ≪ 1.
 * Paraxial error at angle θ ≈ θ²/2.
 * Fraunhofer condition: a²/(λL) ≪ 1 (slit width a must be small).
 */
export class WaveInterferenceModel {
  /**
   * @param {{ lambda?: number, d?: number, L?: number, I0?: number }} opts
   *   lambda: wavelength in metres (default 500e-9)
   *   d:      slit separation in metres (default 1e-3)
   *   L:      screen distance in metres (default 1.0)
   *   I0:     peak intensity (default 1.0)
   */
  constructor({ lambda = 500e-9, d = 1e-3, L = 1.0, I0 = 1.0 } = {}) {
    if (lambda <= 0) throw new RangeError('WaveInterferenceModel: lambda must be > 0');
    if (d <= 0)      throw new RangeError('WaveInterferenceModel: d must be > 0');
    if (L <= 0)      throw new RangeError('WaveInterferenceModel: L must be > 0');

    this.lambda = lambda;
    this.d = d;
    this.L = L;
    this.I0 = I0;
  }

  /** Fringe spacing Δy = λL/d (m) */
  get deltaY() {
    return this.lambda * this.L / this.d;
  }

  /**
   * Intensity at screen position y (m).
   * I(y) = I0 · cos²(π·d·y / (λ·L))
   * @param {number} y  screen position in metres
   * @returns {number}
   */
  intensity(y) {
    const phase = Math.PI * this.d * y / (this.lambda * this.L);
    const c = Math.cos(phase);
    return this.I0 * c * c;
  }

  /**
   * Position of dark fringe m (first dark at m=0 is Δy/2).
   * y_dark(m) = (m + 0.5) · λL/d
   * @param {number} m  integer fringe order (default 0)
   * @returns {number}
   */
  yDark(m = 0) {
    return (m + 0.5) * this.deltaY;
  }

  /**
   * Position of bright fringe m.
   * y_bright(m) = m · λL/d
   * @param {number} m  integer fringe order
   * @returns {number}
   */
  yBright(m = 0) {
    return m * this.deltaY;
  }

  /**
   * Paraxial error at angle θ (radians) ≈ θ²/2.
   * @param {number} theta  angle in radians
   * @returns {number}
   */
  paraxialError(theta) {
    return theta * theta / 2;
  }

  /**
   * Intensity curve for plotting.
   * @param {{ yMin?: number, yMax?: number, nPoints?: number }} opts
   * @returns {{ y: number, I: number }[]}
   */
  curve({ yMin = -5 * this.deltaY, yMax = 5 * this.deltaY, nPoints = 500 } = {}) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const y = yMin + (yMax - yMin) * i / (nPoints - 1);
      pts.push({ y, I: this.intensity(y) });
    }
    return pts;
  }
}
