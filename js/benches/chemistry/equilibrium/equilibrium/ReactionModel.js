/** Gas constant in kJ/(mol·K), so activation energies can be given in kJ/mol. */
const R = 8.314e-3;

/**
 * The reversible reaction  A + B ⇌ C  in a well-mixed solution.
 *
 *   forward rate  = kf·[A]·[B]
 *   reverse rate  = kr·[C]
 *   k = prefactor · e^(−Ea / RT)          (Arrhenius)
 *
 * Concentrations are in mol/L, time in seconds, energies in kJ/mol.
 */
export class ReactionModel {
  constructor() {
    this.temperature = 300; // K
    this.activationForward = 55; // kJ/mol
    this.reactionEnergy = -10; // ΔH in kJ/mol; negative = releases heat
    this.catalyst = false;
    this.catalystDrop = 12; // how much a catalyst lowers both barriers, kJ/mol
    this.prefactor = 5e8; // same for both directions, so K depends only on ΔH and T
    this.reset();
  }

  /** Starting mixture: 1 M of A, 1.5 M of B (excess), no C. */
  reset() {
    this.A = 1;
    this.B = 1.5;
    this.C = 0;
    this.time = 0;
  }

  /** Barrier for C → A + B. Products sit ΔH below reactants, so the climb back is longer. */
  get activationReverse() {
    return this.activationForward - this.reactionEnergy;
  }

  /** Barrier actually felt, after an optional catalyst. Never below 1 kJ/mol. */
  effectiveBarrier(ea) {
    return Math.max(1, this.catalyst ? ea - this.catalystDrop : ea);
  }

  /** Arrhenius rate constant for a barrier. */
  rateConstant(ea) {
    return this.prefactor * Math.exp(-this.effectiveBarrier(ea) / (R * this.temperature));
  }

  get kForward() {
    return this.rateConstant(this.activationForward);
  }

  get kReverse() {
    return this.rateConstant(this.activationReverse);
  }

  /** Equilibrium constant K = kf/kr. */
  get K() {
    return this.kForward / this.kReverse;
  }

  /** Reaction quotient Q = [C]/([A][B]). Compared with K it tells the direction. */
  get Q() {
    const denominator = this.A * this.B;
    return denominator > 1e-12 ? this.C / denominator : Infinity;
  }

  /**
   * Advances time by dt seconds.
   *
   * Uses backward (implicit) Euler: it solves for the amount y reacting in a step
   * using the concentrations at the END of the step. That makes it stable even
   * when the reaction is extremely fast, where the simple forward method blows up.
   *
   *   y = h·[kf(A−y)(B−y) − kr(C+y)]   →   α·y² − β·y + γ = 0
   */
  step(dt) {
    const kf = this.kForward;
    const kr = this.kReverse;
    const substeps = 10;
    const h = dt / substeps;

    for (let i = 0; i < substeps; i++) {
      const { A, B, C } = this;
      const alpha = h * kf;
      const beta = 1 + h * kf * (A + B) + h * kr;
      const gamma = h * (kf * A * B - kr * C);
      const disc = Math.max(0, beta * beta - 4 * alpha * gamma);
      // Rearranged quadratic formula; avoids dividing by a tiny alpha.
      let y = (2 * gamma) / (beta + Math.sqrt(disc));
      y = Math.min(Math.min(A, B), Math.max(-C, y)); // never make a concentration negative

      this.A = A - y;
      this.B = B - y;
      this.C = C + y;
    }
    this.time += dt;
  }

  /** Le Chatelier experiments */
  addA(amount = 0.5) {
    this.A += amount;
  }

  removeC() {
    this.C = 0;
  }
}
