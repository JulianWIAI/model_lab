/**
 * CompetitiveExclusionModel — Lotka-Volterra 2-species competition.
 *
 * dN₁/dt = r₁N₁(1 − N₁/K₁ − α₁₂N₂/K₁)
 * dN₂/dt = r₂N₂(1 − N₂/K₂ − α₂₁N₁/K₂)
 *
 * Interior equilibrium:
 *   N₁* = (K₁ − α₁₂K₂) / (1 − α₁₂α₂₁)
 *   N₂* = (K₂ − α₂₁K₁) / (1 − α₁₂α₂₁)
 *
 * Coexistence iff N₁* > 0 AND N₂* > 0 (requires product condition AND
 * intersection in positive quadrant — both conditions are necessary).
 *
 * Outcomes:
 *   coexistence — both N* > 0 AND 1−α₁₂α₂₁ ≠ 0
 *   sp1-wins    — N₂* ≤ 0 (sp1 excludes sp2)
 *   sp2-wins    — N₁* ≤ 0 (sp2 excludes sp1)
 *   bistable    — α₁₂α₂₁ > 1 AND both N* > 0 (outcome depends on IC)
 *   parallel    — α₁₂α₂₁ = 1 (degenerate; neutral manifold)
 *
 * Jacobian at coexistence (r₁=r₂=1, N1e = N₁_eq, N2e = N₂_eq):
 *   J₁₁ = -N1e/K₁, J₁₂ = -α₁₂·N1e/K₁
 *   J₂₁ = -α₂₁·N2e/K₂, J₂₂ = -N2e/K₂
 *   Stable iff τ < 0 AND Δ > 0 ↔ 1−α₁₂α₂₁ > 0.
 *
 * Reference: Gause (1934). The Struggle for Existence.
 */
import { Integrators } from '../../../../core/Integrators.js';

export class CompetitiveExclusionModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.K1=100]  carrying capacity species 1
   * @param {number} [opts.K2=100]  carrying capacity species 2
   * @param {number} [opts.a12=0.5] α₁₂ effect of sp2 on sp1
   * @param {number} [opts.a21=0.5] α₂₁ effect of sp1 on sp2
   * @param {number} [opts.r1=1]    intrinsic growth rate sp1
   * @param {number} [opts.r2=1]    intrinsic growth rate sp2
   */
  constructor({ K1 = 100, K2 = 100, a12 = 0.5, a21 = 0.5, r1 = 1, r2 = 1 } = {}) {
    if (K1 <= 0) throw new RangeError(`K1 must be > 0; got ${K1}`);
    if (K2 <= 0) throw new RangeError(`K2 must be > 0; got ${K2}`);
    if (a12 < 0) throw new RangeError(`a12 must be ≥ 0; got ${a12}`);
    if (a21 < 0) throw new RangeError(`a21 must be ≥ 0; got ${a21}`);
    this.K1  = K1;  this.K2  = K2;
    this.a12 = a12; this.a21 = a21;
    this.r1  = r1;  this.r2  = r2;
  }

  /** Interior equilibrium [N₁*, N₂*]. May contain negative values. */
  get equilibrium() {
    const { K1, K2, a12, a21 } = this;
    const den = 1 - a12 * a21;
    if (Math.abs(den) < 1e-12) return [NaN, NaN];  // parallel nullclines
    return [(K1 - a12 * K2) / den, (K2 - a21 * K1) / den];
  }

  /**
   * Qualitative outcome based on single-species equilibrium stability.
   *
   * (K1, 0) is stable (sp1-wins) iff a21 > K2/K1   [sp2 cannot invade sp1's niche]
   * (0, K2) is stable (sp2-wins) iff a12 > K1/K2   [sp1 cannot invade sp2's niche]
   *
   * This avoids the sign-of-N* pitfall when α₁₂·α₂₁ > 1 and the interior
   * equilibrium is in a mixed-sign quadrant (e.g. a12=0.75, a21=1.5, K=K:
   * N1*<0 but sp1 wins because a21>1 yet a12<1).
   *
   * @returns {'coexistence'|'sp1-wins'|'sp2-wins'|'bistable'|'parallel'|'unknown'}
   */
  get outcome() {
    const { a12, a21, K1, K2 } = this;
    const prod = a12 * a21;
    if (Math.abs(1 - prod) < 1e-12) return 'parallel';
    // Single-species equilibrium stability (invasion criterion)
    const sp1stable = a21 > K2 / K1;  // (K1,0) stable: sp2 invasion rate < 0
    const sp2stable = a12 > K1 / K2;  // (0,K2) stable: sp1 invasion rate < 0
    if (!sp1stable && !sp2stable) return 'coexistence';
    if ( sp1stable && !sp2stable) return 'sp1-wins';
    if (!sp1stable &&  sp2stable) return 'sp2-wins';
    return 'bistable';
  }

  /**
   * Jacobian at the interior equilibrium (r₁=r₂=1 used for simplicity).
   * Returns null if no positive equilibrium.
   */
  get jacobianAtEquilibrium() {
    const [N1s, N2s] = this.equilibrium;
    if (!(N1s > 0 && N2s > 0)) return null;
    const { K1, K2, a12, a21, r1, r2 } = this;
    return [
      [-r1 * N1s / K1,        -r1 * a12 * N1s / K1],
      [-r2 * a21 * N2s / K2,  -r2 * N2s / K2],
    ];
  }

  /**
   * Integrate from initial condition using RK4.
   * @param {number[]} N0  [N1(0), N2(0)]
   * @param {number}   tMax
   * @param {number}   [dt=0.2]
   * @returns {{ t: number, N1: number, N2: number }[]}
   */
  trajectory(N0, tMax = 100, dt = 0.2) {
    const { K1, K2, a12, a21, r1, r2 } = this;
    const f = ([N1, N2]) => [
      r1 * N1 * (1 - N1 / K1 - a12 * N2 / K1),
      r2 * N2 * (1 - N2 / K2 - a21 * N1 / K2),
    ];
    const pts = [{ t: 0, N1: N0[0], N2: N0[1] }];
    let state = [...N0];
    let t = 0;
    const steps = Math.ceil(tMax / dt);
    for (let i = 0; i < steps; i++) {
      state = Integrators.rk4(f, state, t, dt);
      t += dt;
      const [N1, N2] = state.map(v => Math.max(0, v));
      pts.push({ t, N1, N2 });
      if (N1 < 1e-6 && N2 < 1e-6) break;
    }
    return pts;
  }

  /**
   * Nullcline for sp1: N₁ = K₁ − α₁₂N₂.
   * When α₁₂=0: N₁ = K₁ for all N₂ (vertical line).
   * Returns {slope, intercept} in N₂→N₁ form, or {type:'vertical', value:K₁}.
   */
  nullcline1() {
    if (this.a12 === 0) return { type: 'vertical', value: this.K1 };
    return { intercept: this.K1, slope: -this.a12 };
  }

  /**
   * Nullcline for sp2: N₂ = K₂ − α₂₁N₁.
   * When α₂₁=0: N₂ = K₂ for all N₁ (horizontal line).
   * Returns {slope, intercept} in N₁→N₂ form, or {type:'horizontal', value:K₂}.
   */
  nullcline2() {
    if (this.a21 === 0) return { type: 'horizontal', value: this.K2 };
    return { intercept: this.K2, slope: -this.a21 };
  }
}
