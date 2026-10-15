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

// ── Numerical check (independent of closed form) ─────────────────────────────

test('solveNumerical().Pstar agrees with closed form ±1e-6', () => {
  const m = new SupplyDemandModel({ a: 80, b: 1.2, c: 5, d: 0.9 });
  const closed  = m.solve().Pstar;
  const numeric = m.solveNumerical().Pstar;
  assert.ok(Math.abs(numeric - closed) < 1e-6,
    `numeric P* = ${numeric}, closed-form P* = ${closed}`);
});

// ── Consumer + producer surplus ──────────────────────────────────────────────
//
// CS = ½·Q*²/b, PS = ½·Q*²/d (for c=0).
// CS + PS = ½·Q*²·(1/b + 1/d) = ½·Q*²·(b+d)/(b·d)
//
// Simpson welfare test: CS via numerical integration ∫_P* ^(a/b) Q_D(P) dP
// This is independent of the algebraic formula.

test('CS + PS = ½·Q*²·(b+d)/(bd) ±1e-10 (c=0)', () => {
  const b = 1.4, d = 0.7;
  const m = new SupplyDemandModel({ a: 80, b, c: 0, d });
  const { Pstar, Qstar, CS, PS } = m.solve();
  const expected = 0.5 * Qstar * Qstar * (b + d) / (b * d);
  assert.ok(Math.abs(CS + PS - expected) < 1e-10,
    `CS+PS = ${CS + PS}, expected ${expected}`);
});

test('CS numerical (Simpson) ≈ algebraic CS ±1e-4', () => {
  const b = 1.2, d = 0.8;
  const m = new SupplyDemandModel({ a: 80, b, c: 0, d });
  const { Pstar, CS } = m.solve();
  // CS = ∫_P* ^{a/b} Q_D(P) dP = ∫_P* ^{a/b} (a - b·P) dP
  const Pchoke = m.a / b;
  const n = 10000;
  const h = (Pchoke - Pstar) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const P = Pstar + h * i;
    const w = (i === 0 || i === n) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += w * m.QD(P);
  }
  const CS_numeric = (h / 3) * sum;
  assert.ok(Math.abs(CS_numeric - CS) < 1e-4,
    `CS_numeric = ${CS_numeric.toFixed(4)}, CS_algebraic = ${CS.toFixed(4)}`);
});

// ── No-trade condition ────────────────────────────────────────────────────────

test('noTrade === true when a < c (demand below supply)', () => {
  // Q* = (a·d + b·c)/(b+d); if a<c and c large enough Q*<0
  const m = new SupplyDemandModel({ a: 10, b: 1, c: 50, d: 1 });
  assert.strictEqual(m.solve().noTrade, true);
});

test('noTrade === false when a > c with positive equilibrium', () => {
  const m = new SupplyDemandModel({ a: 80, b: 1, c: 0, d: 1 });
  assert.strictEqual(m.solve().noTrade, false);
});

// ── Cost-shock incidence ──────────────────────────────────────────────────────
//
// Supply shift: costs rise by κ → c_new = c − κ (supply curve shifts left).
// ΔP* = κ/(b+d)   buyers bear κ·b/(b+d), sellers bear κ·d/(b+d)

test('cost shock ΔP* = κ/(b+d) ±1e-10', () => {
  const b = 1.5, d = 0.8, kappa = 10;
  const m1 = new SupplyDemandModel({ a: 80, b, c: 5,         d });
  const m2 = new SupplyDemandModel({ a: 80, b, c: 5 - kappa, d });
  const dP = m2.solve().Pstar - m1.solve().Pstar;
  const expected = kappa / (b + d);
  assert.ok(Math.abs(dP - expected) < 1e-10,
    `ΔP* = ${dP}, expected ${expected}`);
});

test('buyer-bears-all limit: b≈0, ΔP* ≈ κ (±1%)', () => {
  const b = 0.001, d = 1, kappa = 1;
  const m1 = new SupplyDemandModel({ a: 80, b, c: 5,         d });
  const m2 = new SupplyDemandModel({ a: 80, b, c: 5 - kappa, d });
  const dP = m2.solve().Pstar - m1.solve().Pstar;
  assert.ok(Math.abs(dP - kappa) / kappa < 0.01,
    `ΔP* = ${dP.toFixed(4)}, expected ≈${kappa} (buyers bear >99%)`);
});
