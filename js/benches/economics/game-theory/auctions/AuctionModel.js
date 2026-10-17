/**
 * AuctionModel — symmetric independent private value (IPV) auction theory.
 *
 * First-price sealed-bid BNE (symmetric IPV, uniform [0,1]):
 *   b*(v) = (N-1)/N · v
 *
 * Expected revenue (symmetric IPV, uniform [0,1]):
 *   E[R] = (N-1)/(N+1)
 *
 * Optimal reserve (Myerson, uniform [0,1]):
 *   r* = 0.5
 *
 * Revenue equivalence theorem: E[R_1st] = E[R_2nd] for symmetric IPV.
 */
import { Random } from '../../../../core/Random.js';

export class AuctionModel {
  /**
   * @param {{ N: number, distribution?: 'uniform' }} opts
   * @throws {RangeError} if N < 2
   */
  constructor({ N, distribution = 'uniform' }) {
    if (!Number.isInteger(N) || N < 2)
      throw new RangeError('AuctionModel: N must be ≥ 2');
    this.N = N;
    this.distribution = distribution;  // only 'uniform' supported in Phase 10
  }

  /**
   * BNE bid in symmetric IPV first-price auction (uniform [0,1]).
   * b*(v) = (N-1)/N · v
   * @param {number} v  private value in [0,1]
   * @throws {RangeError} if v ∉ [0,1]
   */
  bneBid(v) {
    if (v < 0 || v > 1) throw new RangeError('AuctionModel: v must be in [0,1]');
    return (this.N - 1) / this.N * v;
  }

  /**
   * Expected revenue for first-price auction (symmetric IPV, uniform [0,1]).
   * E[R] = (N-1)/(N+1)
   */
  expectedRevenue() {
    return (this.N - 1) / (this.N + 1);
  }

  /**
   * Myerson optimal reserve price (uniform [0,1]).
   * Virtual value v - (1-F(v))/f(v) = 2v-1 = 0 → r* = 0.5
   */
  optimalReserve() {
    return 0.5;
  }

  /**
   * Truthful bid (Vickrey second-price dominant strategy).
   * @param {number} v
   */
  truthfulBid(v) {
    if (v < 0 || v > 1) throw new RangeError('AuctionModel: v must be in [0,1]');
    return v;
  }

  /**
   * Monte Carlo simulation of first-price auction revenue.
   * Each bidder draws v ~ Uniform[0,1], bids b*(v). Winner pays their bid.
   * @param {number} nTrials
   * @param {Random} rng
   * @returns {number} average revenue
   */
  simulateFirstPrice(nTrials, rng) {
    let total = 0;
    for (let t = 0; t < nTrials; t++) {
      let maxBid = -1;
      for (let i = 0; i < this.N; i++) {
        const v = rng.next();
        const b = this.bneBid(v);
        if (b > maxBid) maxBid = b;
      }
      total += maxBid;
    }
    return total / nTrials;
  }

  /**
   * Monte Carlo simulation of second-price (Vickrey) auction revenue.
   * Each bidder draws v ~ Uniform[0,1], bids v (dominant strategy). Winner pays second-highest bid.
   * @param {number} nTrials
   * @param {Random} rng
   * @returns {number} average revenue
   */
  simulateSecondPrice(nTrials, rng) {
    let total = 0;
    for (let t = 0; t < nTrials; t++) {
      const bids = [];
      for (let i = 0; i < this.N; i++) bids.push(rng.next());  // truthful bids = values
      bids.sort((a, b) => b - a);
      total += bids[1];  // second-highest
    }
    return total / nTrials;
  }

  /**
   * Bid curve for plotting: array of {v, bid} for v in [0,1].
   * @param {number} [nPoints=200]
   * @returns {Array<{v: number, bid: number}>}
   */
  bidCurve(nPoints = 200) {
    const pts = [];
    for (let i = 0; i <= nPoints; i++) {
      const v = i / nPoints;
      pts.push({ v, bid: this.bneBid(v) });
    }
    return pts;
  }
}
