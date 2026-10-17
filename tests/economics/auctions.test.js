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

  it("revenue equivalence: GL5 ∫₀¹ b*(v)·N·v^{N-1} dv = (N-1)/(N+1) for N=2,3,8 ±1e-12", () => {
    // 5-point Gauss-Legendre nodes/weights on [-1,1].
    // Nodes are roots of P₅(x)=0; weights from standard formulas.
    // Computed analytically to full double precision — no hardcoded truncated constants.
    // Exact for polynomials of degree ≤9; integrand b*(v)·N·v^{N-1} has degree N (≤8 here).
    const sqrt70 = Math.sqrt(70);
    const n1 = Math.sqrt((35 - 2 * sqrt70) / 63);  // ≈ 0.538469
    const n2 = Math.sqrt((35 + 2 * sqrt70) / 63);  // ≈ 0.906180
    const w0 = 128 / 225;                            // weight for x=0
    const w1 = (322 + 13 * sqrt70) / 900;            // weight for ±n1
    const w2 = (322 - 13 * sqrt70) / 900;            // weight for ±n2
    const nodes   = [-n2, -n1, 0, n1, n2];
    const weights = [ w2,  w1, w0, w1, w2];
    for (const N of [2, 3, 8]) {
      const m = new AuctionModel({ N });
      // Change of variable v = (t+1)/2 maps [-1,1] → [0,1]; Jacobian = 1/2
      let integral = 0;
      for (let k = 0; k < 5; k++) {
        const v = (nodes[k] + 1) / 2;
        integral += weights[k] * m.bneBid(v) * N * Math.pow(v, N - 1);
      }
      integral *= 0.5;
      const expected = (N - 1) / (N + 1);
      assert.ok(
        Math.abs(integral - expected) < 1e-12,
        `N=${N}: GL5 integral=${integral}, (N-1)/(N+1)=${expected}`,
      );
    }
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
