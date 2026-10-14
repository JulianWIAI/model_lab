/**
 * Shared numerical ODE integrators.
 *
 * State vectors are plain Arrays. The derivative function has signature:
 *   f(y: number[], t: number) → dy: number[]
 *
 * All methods are pure and return a new array without mutating the input.
 */
export class Integrators {
  /**
   * Classic 4th-order Runge–Kutta (RK4) for vector ODEs.
   *
   * Samples the derivative at the start, twice at the midpoint, and once at
   * the end, then takes the weighted average  (1 + 2 + 2 + 1) / 6.
   * Local truncation error is O(dt⁵); one step is exact for polynomials up to degree 3.
   *
   * @param {function(number[], number): number[]} f  derivative function f(y, t)
   * @param {number[]} y   current state vector
   * @param {number}   t   current time (seconds or whatever unit f uses)
   * @param {number}   dt  step size
   * @returns {number[]} state at t + dt
   */
  static rk4(f, y, t, dt) {
    const k1 = f(y, t);
    const k2 = f(y.map((yi, i) => yi + (k1[i] * dt) / 2), t + dt / 2);
    const k3 = f(y.map((yi, i) => yi + (k2[i] * dt) / 2), t + dt / 2);
    const k4 = f(y.map((yi, i) => yi + k3[i] * dt), t + dt);
    return y.map((yi, i) => yi + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  /**
   * Backward (implicit) Euler using Newton–Raphson iteration.
   *
   * Solves  r(z) = z − y − dt·f(z, t+dt) = 0  at each step via Newton's method
   * with a finite-difference Jacobian.  Stable for arbitrarily stiff problems as
   * long as the step size is not so large that the Newton iteration fails to converge.
   *
   * @param {function(number[], number): number[]} f  derivative function f(y, t)
   * @param {number[]} y    current state vector
   * @param {number}   t    current time
   * @param {number}   dt   step size (may be large compared to the stiff time scale)
   * @param {number}   [tol=1e-9]  convergence tolerance on the residual infinity-norm
   * @returns {number[]} state at t + dt
   */
  static backwardEuler(f, y, t, dt, tol = 1e-9) {
    const n = y.length;
    const tNext = t + dt;
    // Euler predictor as initial Newton guess
    let z = y.map((yi, i) => yi + dt * f(y, t)[i]);

    for (let iter = 0; iter < 50; iter++) {
      const fz = f(z, tNext);
      // Residual r(z) = z − y − dt·f(z, t+dt)
      const r = z.map((zi, i) => zi - y[i] - dt * fz[i]);
      const maxR = r.reduce((m, ri) => Math.max(m, Math.abs(ri)), 0);
      if (maxR < tol) return z;

      // Finite-difference Jacobian J[i][j] = ∂r_i/∂z_j ≈ δ_ij − dt·∂f_i/∂z_j
      const eps = 1e-7 * (1 + z.reduce((m, zi) => Math.max(m, Math.abs(zi)), 0));
      const J = Array.from({ length: n }, (_, i) => Array(n).fill(0));
      for (let j = 0; j < n; j++) {
        const zp = [...z]; zp[j] += eps;
        const fp = f(zp, tNext);
        const rp = zp.map((zi, i) => zi - y[i] - dt * fp[i]);
        for (let i = 0; i < n; i++) J[i][j] = (rp[i] - r[i]) / eps;
      }

      // Newton step: solve J·δ = −r via Gaussian elimination with partial pivoting
      z = z.map((zi, i) => zi + Integrators.#gaussSolve(J, r.map((ri) => -ri))[i]);
    }
    return z;
  }

  /**
   * Gaussian elimination with partial pivoting. Solves A·x = b.
   * @param {number[][]} A  n×n matrix (will be modified in place on a copy)
   * @param {number[]}   b  right-hand side
   * @returns {number[]} solution x
   */
  static #gaussSolve(A, b) {
    const n = b.length;
    // Build augmented matrix
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      // Partial pivot
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
      }
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      const pivot = M[col][col];
      if (Math.abs(pivot) < 1e-14) continue;
      for (let row = col + 1; row < n; row++) {
        const factor = M[row][col] / pivot;
        for (let k = col; k <= n; k++) M[row][k] -= factor * M[col][k];
      }
    }
    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = M[i][n];
      for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
      x[i] /= M[i][i];
    }
    return x;
  }
}
