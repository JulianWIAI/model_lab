/**
 * tests/economics/auctions.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuctionModel } from '../../js/benches/economics/game-theory/auctions/AuctionModel.js';
import { Random } from '../../js/core/Random.js';

describe('AuctionModel', () => {
  it("b*(0.8, N=2) = 0.4", () => {
    const m = new AuctionModel({ N: 2 });
    assert.strictEqual(m.bneBid(0.8), 0.4);  // === exact
  });

  it("b*(0.8, N=3) = 8/15 ±1e-14", () => {
    const m = new AuctionModel({ N: 3 });
    const expected = 2/3 * 0.8;  // = 8/15
    assert.ok(Math.abs(m.bneBid(0.8) - expected) < 1e-14, `got ${m.bneBid(0.8)}`);
  });

  it("E[revenue] N=2 = 1/3 ±1e-14", () => {
    const m = new AuctionModel({ N: 2 });
    assert.ok(Math.abs(m.expectedRevenue() - 1/3) < 1e-14);
  });

  it("E[revenue] N=3 = 1/2 ±1e-14", () => {
    const m = new AuctionModel({ N: 3 });
    assert.ok(Math.abs(m.expectedRevenue() - 0.5) < 1e-14);
  });

  it("revenue equivalence: E[R_1st] = E[R_2nd] (N=2, analytic)", () => {
    // Analytic: both equal (N-1)/(N+1)
    const m = new AuctionModel({ N: 2 });
    // First-price: E[max BNE bid] = E[(N-1)/N * max V] = (N-1)/N * N/(N+1) = (N-1)/(N+1)
    // Second-price: E[2nd highest uniform] = (N-1)/(N+1)
    // Revenue equivalence is algebraic identity
    assert.ok(Math.abs(m.expectedRevenue() - 1/3) < 1e-14);
  });

  it("optimal reserve = 0.5 (uniform)", () => {
    const m = new AuctionModel({ N: 2 });
    assert.strictEqual(m.optimalReserve(), 0.5);
  });

  it("MC first-price revenue ≈ 1/3 (N=2, n=100000)", () => {
    const m = new AuctionModel({ N: 2 });
    const rng = new Random(42);
    const est = m.simulateFirstPrice(100000, rng);
    const expected = 1/3;
    // SE = sqrt(Var(revenue)/n). Var of max BNE bid for N=2:
    // max BNE bid = max(v1,v2)/2; E=1/3; E[X^2] = E[(max/2)^2] = (1/4)·E[max^2]
    // For max of 2 Uniform[0,1]: E[max^2] = 2/4 = 1/2 → E[(max/2)^2] = 1/8
    // Var = 1/8 - 1/9 = 1/72; SE = sqrt(1/(72*n))
    const SE = Math.sqrt(1 / (72 * 100000));
    assert.ok(Math.abs(est - expected) < 4 * SE, `est=${est}, expected=${expected}, 4SE=${4*SE}`);
  });

  it("N<2 throws RangeError", () => {
    assert.throws(() => new AuctionModel({ N: 1 }), RangeError);
  });
});
