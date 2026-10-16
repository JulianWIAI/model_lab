/**
 * Tests for RandomWalkModel.
 *
 * Anchors computed in tools/anchors-phase9.mjs §4.
 *
 * Key values:
 *  E[|X₁₀₀|] EXACT (BigInt) = 7.958923738717877  (tolerance 1e-12)
 *  E[|X₁₀₀|] asymptotic √(200/π) = 7.978845608    (overestimates by 0.020)
 *  Gambler k=30, N=100: P(win)=0.3, E[T]=2100  (exact integer formulae)
 *  2D NN: Var(r²) = n²−n = 9900; 4·SE = 4·√(9900/10000) ≈ 3.98
 *  1D:    Var(X²) = 2n²−2n = 19800; 4·SE = 4·√(19800/10000) ≈ 5.63
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RandomWalkModel } from '../../js/benches/math/probability/random-walk/RandomWalkModel.js';

// ── walk1D basics ─────────────────────────────────────────────────────────────

test('walk1D starts at 0', () => {
  const m = new RandomWalkModel({ seed: 1 });
  assert.strictEqual(m.walk1D(10)[0], 0);
});

test('walk1D returns array of length n+1', () => {
  const m = new RandomWalkModel({ seed: 1 });
  assert.strictEqual(m.walk1D(50).length, 51);
});

test('walk1D steps are ±1', () => {
  const m = new RandomWalkModel({ seed: 7 });
  const pos = m.walk1D(200);
  for (let i = 1; i < pos.length; i++) {
    assert.strictEqual(Math.abs(pos[i] - pos[i - 1]), 1, `step ${i} must be ±1`);
  }
});

// ── walk2D basics ─────────────────────────────────────────────────────────────

test('walk2D starts at (0,0)', () => {
  const m = new RandomWalkModel({ seed: 2 });
  const w = m.walk2D(20);
  assert.strictEqual(w[0].x, 0);
  assert.strictEqual(w[0].y, 0);
});

test('walk2D returns n+1 points', () => {
  const m = new RandomWalkModel({ seed: 2 });
  assert.strictEqual(m.walk2D(100).length, 101);
});

test('walk2D steps: Manhattan distance = 1', () => {
  const m = new RandomWalkModel({ seed: 3 });
  const w = m.walk2D(100);
  for (let i = 1; i < w.length; i++) {
    const d = Math.abs(w[i].x - w[i - 1].x) + Math.abs(w[i].y - w[i - 1].y);
    assert.strictEqual(d, 1, `step ${i} Manhattan distance must be 1`);
  }
});

// ── Exact E[|X|] ──────────────────────────────────────────────────────────────

test('exactAbsMean(100) = 7.958923738717877 ±1e-12', () => {
  const val = RandomWalkModel.exactAbsMean(100);
  const ref = 7.958923738717877;
  assert.ok(Math.abs(val / ref - 1) < 1e-12,
    `exactAbsMean(100)=${val}, expected ${ref}, rel err=${val / ref - 1}`);
});

test('asymptoticAbsMean(100) = √(200/π) ≈ 7.97885 ±1e-12', () => {
  const val = RandomWalkModel.asymptoticAbsMean(100);
  const ref = Math.sqrt(200 / Math.PI);
  assert.ok(Math.abs(val / ref - 1) < 1e-12, `asymptotic mismatch: ${val} vs ${ref}`);
});

test('asymptotic overestimates exact at n=100', () => {
  const exact = RandomWalkModel.exactAbsMean(100);
  const asymp = RandomWalkModel.asymptoticAbsMean(100);
  assert.ok(asymp > exact, `asymptotic ${asymp} must be > exact ${exact}`);
  // Difference is ≈ 0.020 per anchor
  assert.ok(Math.abs(asymp - exact - 0.0199) < 0.001, `diff ≈ 0.020`);
});

test('exactAbsMean throws for odd n', () => {
  assert.throws(() => RandomWalkModel.exactAbsMean(5), RangeError);
});

// ── ⟨X²⟩ = n (exact integer) ─────────────────────────────────────────────────

test('msd(100, 10000) ≈ 100 within 4·√(19800/10000)≈5.63', () => {
  // 1D: Var(X²) = 2n²−2n = 19800; 4·SE = 4·√(19800/10000)
  const m = new RandomWalkModel({ seed: 42 });
  const msdVal = m.msd(100, 10000);
  const tol = 4 * Math.sqrt(19800 / 10000);  // ≈5.63
  assert.ok(Math.abs(msdVal - 100) < tol,
    `MSD 1D = ${msdVal}, expected 100, tolerance ${tol}`);
});

// ── 2D ⟨r²⟩ = n ──────────────────────────────────────────────────────────────

test('msd2D(100, 10000) ≈ 100 within 4·√(9900/10000)≈3.98', () => {
  // 2D NN: Var(r²) = n²−n = 9900; 4·SE = 4·√(9900/10000)
  const m = new RandomWalkModel({ seed: 42 });
  const val = m.msd2D(100, 10000);
  const tol = 4 * Math.sqrt(9900 / 10000);  // ≈3.98
  assert.ok(Math.abs(val - 100) < tol,
    `MSD 2D = ${val}, expected 100, tolerance ${tol}`);
});

// ── Gambler's ruin — closed form ──────────────────────────────────────────────

test("gambler's ruin P(win) k=30 N=100 = 0.3 exactly", () => {
  const m = new RandomWalkModel({ seed: 0 });
  assert.strictEqual(m.gamblersRuin({ k: 30, N: 100 }).pWin, 0.3);
});

test("gambler's ruin E[T] k=30 N=100 = 2100 exactly", () => {
  const m = new RandomWalkModel({ seed: 0 });
  assert.strictEqual(m.gamblersRuin({ k: 30, N: 100 }).meanTime, 2100);
});

// ── Gambler's ruin — MC cross-check ──────────────────────────────────────────

test("gambler's ruin MC P(win) ≈ 0.3 within 4·SE ≈ 0.026", () => {
  const m = new RandomWalkModel({ seed: 99 });
  const pMC = m.gamblersRuinMC({ k: 30, N: 100, trials: 5000 });
  // SE = √(0.3·0.7/5000) ≈ 0.00648; 4·SE ≈ 0.026
  const tol = 4 * Math.sqrt(0.3 * 0.7 / 5000);
  assert.ok(Math.abs(pMC - 0.3) < tol,
    `MC P(win)=${pMC}, expected 0.3, tolerance ${tol}`);
});
