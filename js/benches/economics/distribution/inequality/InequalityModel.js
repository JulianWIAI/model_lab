/**
 * InequalityModel — Lorenz curve and Gini coefficient.
 *
 * Supports Pareto, Uniform, and Exponential distributions.
 * References: Lorenz (1905), Gini (1912) (cited, not fetched).
 */
export class InequalityModel {
  constructor({ dist = 'pareto', alpha = 2, b = 1, lambda = 1 } = {}) {
    if (alpha <= 1 && dist === 'pareto') throw new RangeError('Pareto requires alpha > 1');
    if (b <= 0 && dist === 'uniform') throw new RangeError('Uniform requires b > 0');
    if (lambda <= 0 && dist === 'exponential') throw new RangeError('Exponential requires lambda > 0');
    this.dist = dist; this.alpha = alpha; this.b = b; this.lambda = lambda;
  }

  lorenz(p) {
    if (p < 0 || p > 1) throw new RangeError(`lorenz: p=${p} must be in [0,1]`);
    if (p >= 1) return 1;
    if (p <= 0) return 0;
    if (this.dist === 'pareto') return 1 - Math.pow(1-p, (this.alpha-1)/this.alpha);
    if (this.dist === 'uniform') return p * p;
    return p + (1-p) * Math.log(1-p);
  }

  gini() {
    if (this.dist === 'pareto') return 1 / (2*this.alpha - 1);
    if (this.dist === 'uniform') return 1/3;
    return 0.5;
  }

  giniNumerical(nPoints = 2000) {
    let intL = 0;
    const dp = 1/nPoints;
    for (let i = 0; i <= nPoints; i++) {
      const p = i/nPoints;
      const Lp = this.lorenz(p);
      const w = (i===0 || i===nPoints) ? 0.5 : 1;
      intL += w * Lp * dp;
    }
    return 1 - 2*intL;
  }

  /**
   * topShare(q) returns the income share of the **top (1−q) fraction**,
   * i.e., the fraction of total income earned by those above the q-th quantile.
   * Equivalently, topShare(q) = 1 − lorenz(q).
   */
  topShare(q) {
    if (this.dist === 'pareto') return Math.pow(1-q, (this.alpha-1)/this.alpha);
    if (this.dist === 'uniform') return 1 - q*q;
    // Exponential: topShare(q) = 1 - lorenz(q) = 1 - [q + (1-q)*ln(1-q)]
    //            = (1-q)*(1 - ln(1-q))
    return (1-q) * (1 - Math.log(1-q));
  }

  lorenzCurve(nPoints = 200) {
    return Array.from({length: nPoints+1}, (_, i) => {
      const p = i/nPoints;
      return { p, L: this.lorenz(p) };
    });
  }
}
