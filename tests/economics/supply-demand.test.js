import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SupplyDemandModel } from '../../js/benches/economics/markets/supply-demand/SupplyDemandModel.js';

// ── Closed-form equilibrium ──────────────────────────────────────────────────

test('solve().Pstar === (a−c)/(b+d) ±1e-10', () => {
  const m = new SupplyDemandModel({ a: 80, b: 1.5, c: 10, d: 0.8 });
  const { Pstar } = m.solve();
  const expected = (80 - 10) / (1.5 + 0.8);
  assert.ok(Math.abs(Pstar - expected) < 1e-10,
    `Pstar = ${Pstar}, expected ${expected}`);
});

test('solve().Qstar === (a·d+b·c)/(b+d) ±1e-10', () => {
  const m = new SupplyDemandModel({ a: 80, b: 1.5, c: 10, d: 0.8 });
  const { Qstar } = m.solve();
  const expected = (80 * 0.8 + 1.5 * 10) / (1.5 + 0.8);
  assert.ok(Math.abs(Qstar - expected) < 1e-10,
    `Qstar = ${Qstar}, expected ${expected}`);
});

// ── noTrade: condition is Q* ≤ 0  (i.e. a·d + b·c ≤ 0) ─────────────────────
//
// Example 1: a=1, b=1, c=−5, d=1
//   Q* = (1·1 + 1·(−5))/(1+1) = −4/2 = −2 ≤ 0 → noTrade
//   P* = (1−(−5))/(1+1) = 3 > choke price (a/b = 1), confirms no trade
//
// Example 2: a=80, b=1, c=−10, d=1
//   Q* = (80·1 + 1·(−10))/2 = 35 > 0 → trade
//   (c<0 means supply starts at positive price −c/d = 10)

test('noTrade true: a=1,b=1,c=−5,d=1 → Q*=−2 ≤ 0', () => {
  const m = new SupplyDemandModel({ a: 1, b: 1, c: -5, d: 1 });
  const r = m.solve();
  assert.strictEqual(r.noTrade, true,
    `Q* = ${r.Qstar}, expected noTrade`);
  assert.ok(r.Qstar <= 0, `Q* should be ≤0, got ${r.Qstar}`);
});

test('noTrade false: a=80,b=1,c=−10,d=1 → Q*=35 > 0', () => {
  const m = new SupplyDemandModel({ a: 80, b: 1, c: -10, d: 1 });
  const r = m.solve();
  assert.strictEqual(r.noTrade, false,
    `Q* = ${r.Qstar}, expected trade`);
  assert.ok(r.Qstar > 0);
});

test('noTrade false: standard case a=80,b=1,c=0,d=1 → Q*=40', () => {
  const m = new SupplyDemandModel({ a: 80, b: 1, c: 0, d: 1 });
  assert.strictEqual(m.solve().noTrade, false);
});

// ── Numerical check (independent of closed form) ─────────────────────────────

test('solveNumerical().Pstar agrees with closed form ±1e-6', () => {
  const m = new SupplyDemandModel({ a: 80, b: 1.2, c: 5, d: 0.9 });
  const closed  = m.solve().Pstar;
  const numeric = m.solveNumerical().Pstar;
  assert.ok(Math.abs(numeric - closed) < 1e-6,
    `numeric P* = ${numeric}, closed-form P* = ${closed}`);
});

// ── CS and PS formulas hold for any c ────────────────────────────────────────
//
// CS = ½·Q*²/b  (always: triangle under demand above P*)
// PS = ½·Q*²/d  (always: proved in model header; holds for any c including c<0)
//
// Total surplus = CS + PS = ½·Q*²·(b+d)/(b·d)
// Independent check: ∫₀^{Q*} (P_D(Q) − P_S(Q)) dQ via Simpson's rule
// where P_D(Q) = (a−Q)/b and P_S(Q) = (Q−c)/d

test('CS+PS = Simpson ∫₀^{Q*}(P_D−P_S)dQ ±1e-4  (c=−10, c<0)', () => {
  const a = 80, b = 1.2, c = -10, d = 0.8;
  const m = new SupplyDemandModel({ a, b, c, d });
  const { Qstar, CS, PS, noTrade } = m.solve();
  assert.strictEqual(noTrade, false, 'expected trade');

  const n = 10000;  // must be even
  const h = Qstar / n;
  // Simpson's 1/3 rule: ∫₀^{Q*} f(Q) dQ
  const PD = Q => (a - Q) / b;
  const PS_ = Q => (Q - c) / d;
  let sum = (PD(0) - PS_(0)) + (PD(Qstar) - PS_(Qstar));
  for (let i = 1; i < n; i++) {
    const Q = h * i;
    sum += (i % 2 === 0 ? 2 : 4) * (PD(Q) - PS_(Q));
  }
  const TS_simpson = (h / 3) * sum;
  const TS_formula = CS + PS;

  assert.ok(Math.abs(TS_formula - TS_simpson) < 1e-4,
    `formula CS+PS = ${TS_formula.toFixed(4)}, Simpson = ${TS_simpson.toFixed(4)}`);
});

// ── Cost-shock incidence ──────────────────────────────────────────────────────
//
// Cost shock κ: c_new = c − d·κ (parallel upward shift of marginal cost)
// ΔP* = d·κ/(b+d)
// ΔQ* = −b·d·κ/(b+d)
// Pass-through ρ = d/(b+d) = ε_S/(ε_S + |ε_D|)  [computed from elasticities]

test('cost shock ΔP* = d·κ/(b+d) ±1e-10', () => {
  const b = 1.5, d = 0.8, kappa = 10;
  const m = new SupplyDemandModel({ a: 80, b, c: 5, d });
  const { deltaP } = m.costShock(kappa);
  const expected = d * kappa / (b + d);
  assert.ok(Math.abs(deltaP - expected) < 1e-10,
    `ΔP* = ${deltaP}, expected ${expected}`);
});

test('cost shock ΔQ* = −b·d·κ/(b+d) ±1e-10', () => {
  const b = 1.5, d = 0.8, kappa = 10;
  const m = new SupplyDemandModel({ a: 80, b, c: 5, d });
  const { deltaQ } = m.costShock(kappa);
  const expected = -b * d * kappa / (b + d);
  assert.ok(Math.abs(deltaQ - expected) < 1e-10,
    `ΔQ* = ${deltaQ}, expected ${expected}`);
});

test('pass-through ρ = d/(b+d) = ε_S/(ε_S+|ε_D|) ±1e-10', () => {
  const b = 1.2, d = 0.9;
  const m  = new SupplyDemandModel({ a: 80, b, c: 0, d });
  const { rho, eD, eS } = m.costShock(1);  // κ=1; rho unchanged
  const rhoExpected    = d / (b + d);
  const rhoElasticity  = eS / (eS + Math.abs(eD));  // from elasticities
  assert.ok(Math.abs(rho - rhoExpected) < 1e-10,
    `ρ = ${rho}, expected ${rhoExpected}`);
  assert.ok(Math.abs(rho - rhoElasticity) < 1e-10,
    `ρ from elasticities = ${rhoElasticity}, expected ${rhoExpected}`);
});

test('buyer-bears-all limit: b→0, ρ→1 (buyers absorb >99%)', () => {
  const b = 0.001, d = 1;
  const m = new SupplyDemandModel({ a: 80, b, c: 5, d });
  const { rho } = m.costShock(1);
  assert.ok(Math.abs(rho - 1) < 0.01,
    `ρ = ${rho.toFixed(4)}, expected ≈1`);
});

test('seller-bears-all limit: d→0, ρ→0 (sellers absorb >99%)', () => {
  const b = 1, d = 0.001;
  const m = new SupplyDemandModel({ a: 80, b, c: 5, d });
  const { rho } = m.costShock(1);
  assert.ok(rho < 0.01,
    `ρ = ${rho.toFixed(4)}, expected ≈0`);
});
