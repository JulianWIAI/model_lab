/**
 * Root-finding algorithms.
 *
 * All methods are static and assume f is continuous on the given interval.
 * The interval [a, b] must bracket a root: f(a) and f(b) must have opposite signs.
 */
export class RootFinding {
  /**
   * Bisection: halves the bracket at every step.
   *
   * Requires O(log₂((b−a)/tol)) evaluations; always converges but slowly.
   * Useful when f is noisy or when a guaranteed bracket is more important than speed.
   *
   * @param {function(number): number} f
   * @param {number} a    left bound (f(a) and f(b) must have opposite signs)
   * @param {number} b    right bound
   * @param {number} [tol=1e-10]  half-width of the final bracket
   * @returns {number} root ≈ midpoint of the final bracket
   */
  static bisect(f, a, b, tol = 1e-10) {
    let fa = f(a);
    const fb = f(b);
    if (fa * fb > 0) throw new RangeError('bisect: f(a) and f(b) must have opposite signs');
    // Normalise so fa < 0 (side a), regardless of whether a < b or a > b.
    if (fa > 0) { [a, b] = [b, a]; fa = -fa; }
    for (let i = 0; i < 200; i++) {
      if (Math.abs(b - a) <= tol) break;
      const mid = (a + b) / 2;
      if (f(mid) <= 0) a = mid;
      else b = mid;
    }
    return (a + b) / 2;
  }

  /**
   * Brent's method: combines bisection, secant, and inverse quadratic interpolation.
   *
   * Converges superlinearly for smooth f while retaining bisection as a safe fallback.
   * Usually the best choice for a scalar root.
   *
   * Reference: R. P. Brent, "Algorithms for Minimization without Derivatives",
   * Prentice-Hall, 1973.  Chapter 4.
   *
   * @param {function(number): number} f
   * @param {number} a    left bound
   * @param {number} b    right bound (opposite sign to f(a))
   * @param {number} [tol=1e-10]  convergence tolerance
   * @returns {number} root
   */
  static brent(f, a, b, tol = 1e-10) {
    let fa = f(a);
    let fb = f(b);
    if (fa * fb > 0) throw new RangeError('brent: f(a) and f(b) must have opposite signs');

    // Ensure |f(b)| ≤ |f(a)|
    if (Math.abs(fa) < Math.abs(fb)) {
      [a, b] = [b, a];
      [fa, fb] = [fb, fa];
    }

    let c = a;
    let fc = fa;
    let d = b - a;
    let e = d;
    let mflag = true;

    for (let i = 0; i < 200; i++) {
      if (Math.abs(fb) < tol || Math.abs(b - a) < tol) break;

      let s;
      if (fa !== fc && fb !== fc) {
        // Inverse quadratic interpolation
        s =
          (a * fb * fc) / ((fa - fb) * (fa - fc)) +
          (b * fa * fc) / ((fb - fa) * (fb - fc)) +
          (c * fa * fb) / ((fc - fa) * (fc - fb));
      } else {
        // Secant step
        s = b - fb * ((b - a) / (fb - fa));
      }

      const mid = (a + b) / 2;
      const cond1 = s < (3 * a + b) / 4 || s > b;
      const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
      const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2;
      const cond4 = mflag && Math.abs(b - c) < tol;
      const cond5 = !mflag && Math.abs(c - d) < tol;

      if (cond1 || cond2 || cond3 || cond4 || cond5) {
        s = mid; // fall back to bisection
        mflag = true;
      } else {
        mflag = false;
      }

      const fs = f(s);
      d = c;
      c = b;
      fc = fb;

      if (fa * fs < 0) {
        b = s;
        fb = fs;
      } else {
        a = s;
        fa = fs;
      }

      // Keep b as the better estimate
      if (Math.abs(fa) < Math.abs(fb)) {
        [a, b] = [b, a];
        [fa, fb] = [fb, fa];
      }
    }
    return b;
  }
}
