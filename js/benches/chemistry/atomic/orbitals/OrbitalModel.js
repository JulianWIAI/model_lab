/**
 * OrbitalModel — hydrogen-like atomic orbitals.
 *
 * Computes wavefunctions ψ_nlm(r,θ,φ) = R_nl(r)·Y_lm(θ,φ).
 * All lengths in Bohr radii (a₀ = 1).
 * Energy in eV: E_n = -13.606 eV / n².
 *
 * References:
 *   Griffiths, D.J. (2018). Introduction to Quantum Mechanics, 3rd ed. §4.2.
 *   Condon–Shortley phase convention used for real spherical harmonics.
 */
export class OrbitalModel {
  constructor({ n = 1, l = 0, m = 0 } = {}) {
    this.n = n; // principal quantum number 1–4
    this.l = l; // azimuthal 0..n-1
    this.m = m; // magnetic -l..l
    this._cache = null;
    this._cacheKey = null;
  }

  /** Energy in eV */
  get energy() { return -13.606 / (this.n * this.n); }

  /** Number of radial nodes: n - l - 1 */
  get radialNodes() { return this.n - this.l - 1; }

  /** Number of angular nodes: l */
  get angularNodes() { return this.l; }

  /** Most probable radius (in Bohr radii): grid search for peak of r²·R²(r) */
  get mostProbableRadius() {
    const nMax = 6 * this.n * this.n * 4; // generous max in a₀
    let bestR = 0.001;
    let bestVal = 0;
    const steps = 2000;
    for (let i = 1; i <= steps; i++) {
      const r = (i / steps) * nMax;
      const R = this.R(r);
      const val = r * r * R * R;
      if (val > bestVal) { bestVal = val; bestR = r; }
    }
    return bestR;
  }

  /**
   * Normalised radial wavefunction R_nl(r).
   * Uses associated Laguerre polynomials via 3-term recursion.
   * ρ = 2r/(n·a₀)
   * R_nl(r) = -N · e^(-ρ/2) · ρ^l · L_{n-l-1}^{2l+1}(ρ)
   * N = sqrt[(2/n)³ · (n-l-1)! / (2n · (n+l)!)] — from Griffiths eq. 4.73
   *
   * Actually the standard normalisation is:
   * N = -sqrt[(2/(na₀))³ · (n-l-1)! / (2n·(n+l)!)]
   * (the minus sign is the Condon-Shortley convention; it cancels in |ψ|²)
   */
  R(r) {
    const n = this.n, l = this.l;
    const rho = 2 * r / n;
    const L = OrbitalModel.assocLaguerre(n - l - 1, 2 * l + 1, rho);
    // Normalisation: sqrt[(2/n)³ * (n-l-1)! / (2n * (n+l)!)]
    const norm = Math.sqrt(
      Math.pow(2 / n, 3) * OrbitalModel.factorial(n - l - 1) /
      (2 * n * OrbitalModel.factorial(n + l))
    );
    return -norm * Math.exp(-rho / 2) * Math.pow(rho, l) * L;
  }

  /**
   * Radial distribution function: P(r) = r²·R_nl(r)²
   * Integrates to 1 over [0,∞).
   */
  radialDistribution(r) {
    const R = this.R(r);
    return r * r * R * R;
  }

  /**
   * Real spherical harmonic Y_lm(θ, φ).
   * Uses real combinations: Y_l^{+|m|} → cos(|m|φ) component, Y_l^{-|m|} → sin(|m|φ).
   * Implemented explicitly for l = 0, 1, 2, 3.
   */
  Y(theta, phi) {
    const l = this.l, m = this.m;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const cos2T = cosT * cosT, sin2T = sinT * sinT;

    if (l === 0) return 0.5 * Math.sqrt(1 / Math.PI);

    if (l === 1) {
      if (m === 0)  return 0.5 * Math.sqrt(3 / Math.PI) * cosT;
      if (m === 1)  return -0.5 * Math.sqrt(3 / (2 * Math.PI)) * sinT * Math.cos(phi);
      if (m === -1) return  0.5 * Math.sqrt(3 / (2 * Math.PI)) * sinT * Math.sin(phi);
    }

    if (l === 2) {
      if (m === 0)  return 0.25 * Math.sqrt(5 / Math.PI) * (3 * cos2T - 1);
      if (m === 1)  return -0.5 * Math.sqrt(15 / (2 * Math.PI)) * sinT * cosT * Math.cos(phi);
      if (m === -1) return  0.5 * Math.sqrt(15 / (2 * Math.PI)) * sinT * cosT * Math.sin(phi);
      if (m === 2)  return  0.25 * Math.sqrt(15 / (2 * Math.PI)) * sin2T * Math.cos(2 * phi);
      if (m === -2) return  0.25 * Math.sqrt(15 / (2 * Math.PI)) * sin2T * Math.sin(2 * phi);
    }

    if (l === 3) {
      const cos3T = cosT * cos2T, sin3T = sinT * sin2T;
      if (m === 0)  return 0.25 * Math.sqrt(7 / Math.PI) * (5 * cos3T - 3 * cosT);
      if (m === 1)  return -0.125 * Math.sqrt(21 / Math.PI) * sinT * (5 * cos2T - 1) * Math.cos(phi);
      if (m === -1) return  0.125 * Math.sqrt(21 / Math.PI) * sinT * (5 * cos2T - 1) * Math.sin(phi);
      if (m === 2)  return  0.25 * Math.sqrt(105 / (2 * Math.PI)) * sin2T * cosT * Math.cos(2 * phi);
      if (m === -2) return  0.25 * Math.sqrt(105 / (2 * Math.PI)) * sin2T * cosT * Math.sin(2 * phi);
      if (m === 3)  return -0.125 * Math.sqrt(35 / Math.PI) * sin3T * Math.cos(3 * phi);
      if (m === -3) return  0.125 * Math.sqrt(35 / Math.PI) * sin3T * Math.sin(3 * phi);
    }

    return 0;
  }

  /**
   * |ψ(x, z, 0)|² in the xz-plane (φ=0 for x>0, φ=π for x<0).
   * r = sqrt(x²+z²), θ = atan2(|x|, z) but adjusted for quadrant.
   */
  density(x, z) {
    const r = Math.sqrt(x * x + z * z);
    if (r < 1e-10) return 0;
    const theta = Math.acos(Math.max(-1, Math.min(1, z / r)));
    const phi = x >= 0 ? 0 : Math.PI;
    const R = this.R(r);
    const Ylm = this.Y(theta, phi);
    return R * R * Ylm * Ylm;
  }

  /**
   * Get (or regenerate) cached density heatmap as Float32Array.
   * pixels × pixels covering ±extent Bohr radii.
   * Only recomputes when n/l/m changes.
   */
  getHeatmap(pixels = 200) {
    const key = `${this.n},${this.l},${this.m},${pixels}`;
    if (this._cacheKey === key) return this._cache;
    const extent = Math.max(8, 5 * this.n * this.n);
    const arr = new Float32Array(pixels * pixels);
    let maxVal = 0;
    for (let py = 0; py < pixels; py++) {
      for (let px = 0; px < pixels; px++) {
        const x = ((px / (pixels - 1)) * 2 - 1) * extent;
        const z = ((1 - py / (pixels - 1)) * 2 - 1) * extent;
        const d = this.density(x, z);
        arr[py * pixels + px] = d;
        if (d > maxVal) maxVal = d;
      }
    }
    // Normalise to [0, 1]
    if (maxVal > 0) {
      for (let i = 0; i < arr.length; i++) arr[i] /= maxVal;
    }
    this._cache = arr;
    this._cacheKey = key;
    return arr;
  }

  // ── Static helpers ──────────────────────────────────────────────────────

  /**
   * Associated Laguerre polynomial L_p^alpha(x) via 3-term recursion.
   * L_0 = 1, L_1 = 1 + alpha - x
   * (k+1) L_{k+1} = (2k+alpha+1-x) L_k - (k+alpha) L_{k-1}
   */
  static assocLaguerre(p, alpha, x) {
    if (p === 0) return 1;
    if (p === 1) return 1 + alpha - x;
    let Lprev = 1;
    let Lcur = 1 + alpha - x;
    for (let k = 1; k < p; k++) {
      const Lnext = ((2 * k + alpha + 1 - x) * Lcur - (k + alpha) * Lprev) / (k + 1);
      Lprev = Lcur;
      Lcur = Lnext;
    }
    return Lcur;
  }

  static factorial(n) {
    if (n <= 1) return 1;
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
  }
}
