/**
 * SupplyDemandModel — linear supply and demand with shifts and incidence.
 *
 * Q_D(P) = a − b·P       (a > 0, b > 0 — demand: downward sloping)
 * Q_S(P) = c + d·P       (d > 0 — supply: upward sloping)
 *
 * Closed-form equilibrium (from setting Q_D = Q_S):
 *   P* = (a − c) / (b + d)
 *   Q* = (a·d + b·c) / (b + d)
 *
 * Consumer surplus (triangle above P* under demand down to Q=0):
 *   CS = ½ · Q*² / b
 *
 * Producer surplus (triangle below P* above supply up from P-intercept):
 *   PS = ½ · Q*² / d          [exact when c=0, i.e. supply passes through origin]
 *   General: PS = ½ · d · P*² − c·P* + c²/(2d)  but bench uses default c=0.
 *
 * Price elasticities at equilibrium:
 *   eD = −b · P*divided by Q*  (negative; price elasticity of demand)
 *   eS =  d · P*divided by Q*  (positive)
 *
 * Cost shock κ (supply shifts: c_new = c − κ, cost rise shifts supply left):
 *   New P* = P* + κ/(b+d)     buyers bear κ·b/(b+d), sellers bear κ·d/(b+d)
 *
 * No-trade condition: P* ≤ 0 or Q* ≤ 0 (noTrade = true).
 *
 * Independent numerical check via RootFinding.brent on Q_D(P) − Q_S(P) = 0.
 */
import { RootFinding } from '../../../../core/RootFinding.js';

export class SupplyDemandModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.a=80]   demand intercept (Q_D = a − b·P)
   * @param {number} [opts.b=1]    demand slope
   * @param {number} [opts.c=0]    supply intercept (Q_S = c + d·P)
   * @param {number} [opts.d=1]    supply slope
   */
  constructor({ a = 80, b = 1, c = 0, d = 1 } = {}) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  /** Q_D(P) — demand quantity at price P */
  QD(P) { return this.a - this.b * P; }

  /** Q_S(P) — supply quantity at price P */
  QS(P) { return this.c + this.d * P; }

  /**
   * Closed-form equilibrium.
   * @returns {{ Pstar, Qstar, CS, PS, eD, eS, noTrade }}
   */
  solve() {
    const { a, b, c, d } = this;
    const Pstar = (a - c) / (b + d);
    const Qstar = (a * d + b * c) / (b + d);
    const noTrade = Pstar <= 0 || Qstar <= 0;

    if (noTrade) {
      return { Pstar, Qstar, CS: 0, PS: 0, eD: 0, eS: 0, noTrade: true };
    }

    // CS = ½ · Q*² / b  (triangle under demand above P*)
    const CS = 0.5 * Qstar * Qstar / b;
    // PS = ½ · Q*² / d  (exact when c=0)
    const PS = 0.5 * Qstar * Qstar / d;

    const eD = -b * Pstar / Qstar;
    const eS =  d * Pstar / Qstar;

    return { Pstar, Qstar, CS, PS, eD, eS, noTrade: false };
  }

  /**
   * Numerical equilibrium via RootFinding.brent on excess demand Q_D − Q_S = 0.
   * Independent check of closed-form solve().
   * @returns {{ Pstar: number, Qstar: number }}
   */
  solveNumerical() {
    const { a, b, c, d } = this;
    // Price range: 0 to a/b (choke price where Q_D = 0)
    const Pmax = (a - c) / Math.min(b, d) * 2 + 1;
    const f = P => this.QD(P) - this.QS(P);
    // f(0) = a − c; f(Pmax) should be negative (supply exceeds demand)
    // Bracket carefully: at P=0 f=a-c; need f>0 at low end
    const Plo = 0;
    const Phi = a / b + 1;  // well above demand-choke price
    if (f(Plo) * f(Phi) >= 0) {
      // No trade or degenerate — fall back to closed form
      const r = this.solve();
      return { Pstar: r.Pstar, Qstar: r.Qstar };
    }
    const Pstar = RootFinding.brent(f, Plo, Phi, 1e-10);
    return { Pstar, Qstar: this.QD(Pstar) };
  }

  /**
   * Demand curve as price–quantity pairs (P on y-axis, Q on x-axis for diagram).
   * Returns [{ P, Q }] from Q=0 to Q=a (choke).
   */
  demandCurve(nPoints = 200) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const Q = (this.a) * i / (nPoints - 1);
      const P = (this.a - Q) / this.b;
      if (P >= 0) pts.push({ P, Q });
    }
    return pts;
  }

  /**
   * Supply curve: P from 0 up to choke price.
   * Returns [{ P, Q }].
   */
  supplyCurve(nPoints = 200) {
    const Pmax = (this.a - this.c) / this.b * 1.5 + 10;
    const pts  = [];
    for (let i = 0; i < nPoints; i++) {
      const P = Pmax * i / (nPoints - 1);
      const Q = this.QS(P);
      if (Q >= 0) pts.push({ P, Q });
    }
    return pts;
  }
}
