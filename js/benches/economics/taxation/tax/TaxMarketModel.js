/**
 * A competitive market with straight-line demand and supply and a per-unit tax.
 *
 *   demand:  P = a − b·Q
 *   supply:  P = c + d·Q
 *
 * Prices in €, quantities in units.
 */
export class TaxMarketModel {
  /**
   * @param {object} [options]
   * @param {number} [options.demandIntercept=80]  a: price at which nobody buys
   * @param {number} [options.demandSlope=0.8]     b: how fast willingness to pay falls
   * @param {number} [options.supplyIntercept=10]  c: lowest price any seller accepts
   * @param {number} [options.supplySlope=0.6]     d: how fast costs rise
   * @param {number} [options.tax=15]              t: tax per unit
   */
  constructor({ demandIntercept = 80, demandSlope = 0.8, supplyIntercept = 10, supplySlope = 0.6, tax = 15 } = {}) {
    this.a = demandIntercept;
    this.b = demandSlope;
    this.c = supplyIntercept;
    this.d = supplySlope;
    this.tax = tax;
  }

  demandPrice(q) {
    return this.a - this.b * q;
  }

  supplyPrice(q) {
    return this.c + this.d * q;
  }

  /**
   * Solves the market with and without the tax.
   * @returns {{q0: number, p0: number, qt: number, buyerPrice: number, sellerPrice: number,
   *            revenue: number, deadweightLoss: number, buyerShare: number}}
   */
  solve() {
    const { a, b, c, d, tax } = this;
    const q0 = (a - c) / (b + d); // where demand meets supply
    const p0 = this.demandPrice(q0);
    const qt = Math.max(0, (a - c - tax) / (b + d)); // the tax opens a gap of size t between the curves
    const buyerPrice = this.demandPrice(qt);
    const sellerPrice = buyerPrice - tax;

    return {
      q0,
      p0,
      qt,
      buyerPrice,
      sellerPrice,
      revenue: qt * tax,
      deadweightLoss: 0.5 * (q0 - qt) * tax, // triangle of trades that no longer happen
      buyerShare: b / (b + d), // the steeper (less flexible) side pays more
    };
  }

  /** The tax that raises the most money: revenue t·(a−c−t)/(b+d) peaks at t = (a−c)/2. */
  get revenueMaximisingTax() {
    return (this.a - this.c) / 2;
  }
}
