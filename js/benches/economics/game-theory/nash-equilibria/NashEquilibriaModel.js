/**
 * NashEquilibriaModel — 2×2 two-player normal-form game.
 *
 * Row player payoff matrix A = [[a,b],[c,d]]
 * Col player payoff matrix B = [[e,f],[g,h]]
 *
 * Mixed Nash equilibrium (when unique):
 *   q* = (d-b) / (a-b-c+d)   (makes Row indifferent)
 *   p* = (h-g) / (e-f-g+h)   (makes Col indifferent)
 *
 * Row value = (a*d - b*c) / (a-b-c+d)
 *
 * Pure Nash: (i,j) is pure NE iff:
 *   A[i][j] >= A[1-i][j]  AND  B[i][j] >= B[i][1-j]
 */
export class NashEquilibriaModel {
  /**
   * @param {{ A?: number[][], B?: number[][] }} opts
   *   A: Row payoff 2×2 (default: Matching Pennies)
   *   B: Col payoff 2×2 (default: -A)
   */
  constructor({
    A = [[1,-1],[-1,1]],
    B = [[-1,1],[1,-1]],
  } = {}) {
    this.A = A;
    this.B = B;
  }

  /**
   * Compute mixed Nash equilibrium.
   *
   * @returns {{ p: number, q: number, rowValue: number, colValue: number,
   *             denomRow: number, denomCol: number,
   *             degenerate: boolean, dominated: boolean }}
   */
  mixedNE() {
    const [[a, b], [c, d]] = this.A;
    const [[e, f], [g, h]] = this.B;

    const denomRow = a - b - c + d;  // denominator for q*
    const denomCol = e - f - g + h;  // denominator for p*

    const degenerate = Math.abs(denomRow) < 1e-14 || Math.abs(denomCol) < 1e-14;

    if (degenerate) {
      return { p: null, q: null, rowValue: null, colValue: null, denomRow, denomCol, degenerate: true, dominated: false };
    }

    const q = (d - b) / denomRow;
    const p = (h - g) / denomCol;

    const dominated = p < -1e-10 || p > 1 + 1e-10 || q < -1e-10 || q > 1 + 1e-10;

    // Row expected payoff at (p*, q*)
    const rowValue = p * (q * a + (1-q) * b) + (1-p) * (q * c + (1-q) * d);
    const colValue = p * (q * e + (1-q) * f) + (1-p) * (q * g + (1-q) * h);

    return { p, q, rowValue, colValue, denomRow, denomCol, degenerate: false, dominated };
  }

  /**
   * Find all pure Nash equilibria.
   * @returns {{ row: number, col: number }[]}
   */
  pureNE() {
    const A = this.A;
    const B = this.B;
    const result = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const rowNoBenefitFromDeviating = A[i][j] >= A[1-i][j] - 1e-12;
        const colNoBenefitFromDeviating = B[i][j] >= B[i][1-j] - 1e-12;
        if (rowNoBenefitFromDeviating && colNoBenefitFromDeviating) {
          result.push({ row: i, col: j });
        }
      }
    }
    return result;
  }

  /**
   * Count all Nash equilibria (pure + mixed if interior).
   * @returns {number}
   */
  countNE() {
    const pure = this.pureNE().length;
    const { p, q, degenerate, dominated } = this.mixedNE();
    // Mixed NE exists if p in (0,1) and q in (0,1) strictly
    const hasMixed = !degenerate && !dominated && p > 1e-10 && p < 1-1e-10 && q > 1e-10 && q < 1-1e-10;
    return pure + (hasMixed ? 1 : 0);
  }

  /**
   * Row best response at Col mixing probability q.
   * Returns row index (0 or 1) or 'indifferent'.
   * @param {number} q  probability Col plays column 0
   * @returns {0|1|'indifferent'}
   */
  bestResponseRow(q) {
    const [[a, b], [c, d]] = this.A;
    const payRow0 = q * a + (1-q) * b;
    const payRow1 = q * c + (1-q) * d;
    if (Math.abs(payRow0 - payRow1) < 1e-12) return 'indifferent';
    return payRow0 > payRow1 ? 0 : 1;
  }

  /**
   * Col best response at Row mixing probability p.
   * Returns col index (0 or 1) or 'indifferent'.
   * @param {number} p  probability Row plays row 0
   * @returns {0|1|'indifferent'}
   */
  bestResponseCol(p) {
    const [[e, f], [g, h]] = this.B;
    const payCol0 = p * e + (1-p) * g;
    const payCol1 = p * f + (1-p) * h;
    if (Math.abs(payCol0 - payCol1) < 1e-12) return 'indifferent';
    return payCol0 > payCol1 ? 0 : 1;
  }

  /**
   * Row's expected payoff given (p, q).
   */
  rowPayoff(p, q) {
    const [[a, b], [c, d]] = this.A;
    return p * (q * a + (1-q) * b) + (1-p) * (q * c + (1-q) * d);
  }

  /**
   * Col's expected payoff given (p, q).
   */
  colPayoff(p, q) {
    const [[e, f], [g, h]] = this.B;
    return p * (q * e + (1-q) * f) + (1-p) * (q * g + (1-q) * h);
  }
}
