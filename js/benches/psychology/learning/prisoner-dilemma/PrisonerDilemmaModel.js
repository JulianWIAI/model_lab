/**
 * PrisonerDilemmaModel — infinitely repeated Prisoner's Dilemma.
 *
 * Payoff matrix:
 *   Both cooperate: each gets R
 *   Row defects, Col cooperates: Row gets T, Col gets S
 *   Both defect: each gets P
 *   Row cooperates, Col defects: Row gets S, Col gets T
 *
 * Prisoner's Dilemma conditions:
 *   T > R > P > S  AND  2R > T + S
 *
 * δ* (threshold for cooperation under grim trigger):
 *   δ* = (T-R)/(T-P)
 *
 * TFT threshold: max((T-R)/(T-P), (T-R)/(R-S))
 */
export class PrisonerDilemmaModel {
  /**
   * @param {{ T?: number, R?: number, P?: number, S?: number, delta?: number }} opts
   */
  constructor({ T = 5, R = 3, P = 1, S = 0, delta = 0.6 } = {}) {
    this.T = T;
    this.R = R;
    this.P = P;
    this.S = S;
    this.delta = delta;
  }

  /**
   * Check if payoffs form a Prisoner's Dilemma.
   * Requires T>R>P>S and 2R>T+S.
   */
  isPD() {
    return this.T > this.R && this.R > this.P && this.P > this.S && (2 * this.R > this.T + this.S);
  }

  /**
   * Critical discount factor for cooperation under grim trigger.
   * δ* = (T-R)/(T-P)
   */
  deltastar() {
    return (this.T - this.R) / (this.T - this.P);
  }

  /**
   * TFT cooperation threshold = max(δ*, (T-R)/(R-S)).
   */
  tftThreshold() {
    return Math.max(this.deltastar(), (this.T - this.R) / (this.R - this.S));
  }

  /**
   * Present value of perpetual cooperation at discount factor delta.
   * PV_coop = R / (1-δ)
   * @param {number} [delta]
   */
  pvCooperate(delta = this.delta) {
    return this.R / (1 - delta);
  }

  /**
   * Present value of defecting once then both playing Nash forever.
   * PV_defect = T + δP/(1-δ)
   * @param {number} [delta]
   */
  pvDefect(delta = this.delta) {
    return this.T + delta * this.P / (1 - delta);
  }

  /**
   * Numerical partial sum of cooperation PV: Σ_{t=0}^{N-1} R·δ^t.
   * @param {number} [delta]
   * @param {number} [N=2000]
   */
  pvNumerical(delta = this.delta, N = 2000) {
    let sum = 0;
    let dPow = 1;
    for (let t = 0; t < N; t++) {
      sum += this.R * dPow;
      dPow *= delta;
    }
    return sum;
  }

  /**
   * Derivative of deltastar with respect to T: (R-P)/(T-P)^2
   */
  deltaStarDerivTwrtT() {
    return (this.R - this.P) / Math.pow(this.T - this.P, 2);
  }

  /**
   * Simulate grim trigger strategy for nRounds.
   * Cooperate iff delta >= deltastar().
   * @param {{ nRounds?: number, delta?: number }} opts
   * @returns {{ actions: Array<{row: string, col: string}>, totalRow: number, totalCol: number }}
   */
  grimTrigger({ nRounds = 20, delta = this.delta } = {}) {
    const cooperate = delta >= this.deltastar();
    const actions = [];
    let totalRow = 0;
    let totalCol = 0;

    for (let t = 0; t < nRounds; t++) {
      const rowAction = cooperate ? 'C' : 'D';
      const colAction = cooperate ? 'C' : 'D';
      actions.push({ row: rowAction, col: colAction });
      if (cooperate) {
        totalRow += this.R;
        totalCol += this.R;
      } else {
        totalRow += this.P;
        totalCol += this.P;
      }
    }

    return { actions, totalRow, totalCol };
  }
}
