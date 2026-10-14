/**
 * Tests for TaxMarketModel.
 * Key result: revenue-maximising tax = (a−c)/2; for defaults that is t = 35.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TaxMarketModel } from '../../js/benches/economics/taxation/tax/TaxMarketModel.js';

test('revenue peaks at t = (a−c)/2 = 35 with default parameters', () => {
  // Default: a=80, c=10 → t* = (80−10)/2 = 35
  const m = new TaxMarketModel();
  assert.strictEqual(m.revenueMaximisingTax, 35);
});

test('revenue at t=35 exceeds revenue at t=20 and t=50', () => {
  const revenue = (t) => new TaxMarketModel({ tax: t }).solve().revenue;
  assert.ok(revenue(35) > revenue(20), `revenue(35) should exceed revenue(20)`);
  assert.ok(revenue(35) > revenue(50), `revenue(35) should exceed revenue(50)`);
});

test('no-tax equilibrium: qt = q0 and buyerPrice = sellerPrice = p0', () => {
  const m = new TaxMarketModel({ tax: 0 });
  const s = m.solve();
  assert.ok(Math.abs(s.qt - s.q0) < 1e-10, 'qt should equal q0 at t=0');
  assert.ok(Math.abs(s.buyerPrice - s.sellerPrice) < 1e-10, 'no wedge at t=0');
});

test('buyerShare = b/(b+d) (Ramsey incidence)', () => {
  const b = 0.8, d = 0.6;
  const m = new TaxMarketModel({ demandSlope: b, supplySlope: d });
  const s = m.solve();
  assert.ok(Math.abs(s.buyerShare - b / (b + d)) < 1e-10);
});

test('deadweight loss is zero at t=0 and positive at t>0', () => {
  assert.strictEqual(new TaxMarketModel({ tax: 0 }).solve().deadweightLoss, 0);
  assert.ok(new TaxMarketModel({ tax: 15 }).solve().deadweightLoss > 0);
});

test('revenue = 0 when tax exceeds market-clearing gap', () => {
  // When tax is so large that qt → 0, revenue → 0
  const m = new TaxMarketModel({ tax: 1000 }); // far above (a−c)=70
  assert.strictEqual(m.solve().qt, 0);
  assert.strictEqual(m.solve().revenue, 0);
});
