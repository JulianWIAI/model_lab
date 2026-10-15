import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CentralLimitModel, DISTRIBUTIONS } from '../../js/benches/math/probability/central-limit/CentralLimitModel.js';

// ── SE getter (exact, no simulation) ─────────────────────────────────────────

test('SE === sigma/√n ±1e-10 (uniform, n=30)', () => {
  const m = new CentralLimitModel({ dist: 'uniform', n: 30 });
  const info = m.distInfo;
  const expected = info.sigma / Math.sqrt(30);
  assert.ok(Math.abs(m.SE - expected) < 1e-10,
    `SE = ${m.SE}, expected ${expected}`);
});

// ── Uniform n=30, N=2000 ───────────────────────────────────────────────────────
//
// sigma = 1/√12; SE = 1/(√12·√30)
// Tolerance = 4×SE_of_SD_estimate ≈ 4×(SE/√(2N)) = 4×(1/(√12·√30))/√4000
// = 4/(√12·√30·√4000) = 4/(√(12·30·4000)) ≈ 4/√1440000 ≈ 4/1200 ≈ 0.00333

test('Uniform n=30 N=2000: observedSD ≈ 1/(√12·√30) ±4×SE_SD', () => {
  const m = new CentralLimitModel({ dist: 'uniform', n: 30, N: 2000, seed: 42 });
  m.run();
  const expected = 1 / (Math.sqrt(12) * Math.sqrt(30));
  const tol = 4 * expected / Math.sqrt(2 * 2000);
  assert.ok(Math.abs(m.observedSD - expected) < tol,
    `observedSD = ${m.observedSD.toFixed(5)}, expected ${expected.toFixed(5)} ±${tol.toFixed(5)}`);
});

// ── Uniform n=1, N=2000 (parent distribution itself) ─────────────────────────
// SE = 1/√12; tol = 4×(1/√12)/√4000

test('Uniform n=1 N=2000: observedSD ≈ 1/√12 ±4×SE_SD', () => {
  const m = new CentralLimitModel({ dist: 'uniform', n: 1, N: 2000, seed: 42 });
  m.run();
  const expected = 1 / Math.sqrt(12);
  const tol = 4 * expected / Math.sqrt(2 * 2000);
  assert.ok(Math.abs(m.observedSD - expected) < tol,
    `observedSD = ${m.observedSD.toFixed(5)}, expected ${expected.toFixed(5)} ±${tol.toFixed(5)}`);
});

// ── Exponential n=30, N=2000 ─────────────────────────────────────────────────
// mu=1; SE=1/√30; tol=4×(1/√30)/√2000 for mean

test('Exponential n=30 N=2000: observedMean ≈ 1 ±4×SE_mean', () => {
  const m = new CentralLimitModel({ dist: 'exponential', n: 30, N: 2000, seed: 42 });
  m.run();
  const SE   = m.SE;  // 1/√30
  const tol  = 4 * SE / Math.sqrt(2000);
  assert.ok(Math.abs(m.observedMean - 1) < tol,
    `observedMean = ${m.observedMean.toFixed(5)}, expected 1 ±${tol.toFixed(5)}`);
});

// Skewness of sample means ~ skew_parent/√n = 2/√30
// SE_skew ≈ √(6/N) for large N (approximately)

test('Exponential n=30 N=2000: observedSkewness ≈ 2/√30 ±SE_skew', () => {
  const m = new CentralLimitModel({ dist: 'exponential', n: 30, N: 2000, seed: 42 });
  m.run();
  const expected = 2 / Math.sqrt(30);
  // SE of skewness ≈ √(6/N) (approximate formula for large N)
  const seSk = Math.sqrt(6 / 2000);
  const tol  = 4 * seSk;
  assert.ok(Math.abs(m.observedSkewness() - expected) < tol,
    `skewness = ${m.observedSkewness().toFixed(4)}, expected ${expected.toFixed(4)} ±${tol.toFixed(4)}`);
});

// ── Exponential n=5, N=5000 — skewness is large and measurable ───────────────
//
// With n=5 the sample mean of Exp(1) is Gamma(5,5), still skewed.
// skewness(X̄_5) = skewness(Exp)/√5 = 2/√5 ≈ 0.894
// SE_skewness ≈ √(6/N); use 1.5× safety factor for the non-normal distribution.
// seed=42 default, not tuned; tolerance is analytically derived.

test('Exponential n=5 N=5000: observedSkewness ≈ 2/√5 ±4×1.5×SE_skew', () => {
  const m = new CentralLimitModel({ dist: 'exponential', n: 5, N: 5000, seed: 42 });
  m.run();
  const expected = 2 / Math.sqrt(5);
  const tol      = 4 * 1.5 * Math.sqrt(6 / 5000);
  assert.ok(Math.abs(m.observedSkewness() - expected) < tol,
    `skewness = ${m.observedSkewness().toFixed(4)}, expected ${expected.toFixed(4)} ±${tol.toFixed(4)}`);
});

// ── Bernoulli n=30, N=2000 ───────────────────────────────────────────────────
// sigma=0.5; SE=0.5/√30; tol=4×(0.5/√30)/√4000

test('Bernoulli n=30 N=2000: observedSD ≈ 0.5/√30 ±4×SE_SD', () => {
  const m = new CentralLimitModel({ dist: 'bernoulli', n: 30, N: 2000, seed: 42 });
  m.run();
  const expected = 0.5 / Math.sqrt(30);
  const tol = 4 * expected / Math.sqrt(2 * 2000);
  assert.ok(Math.abs(m.observedSD - expected) < tol,
    `observedSD = ${m.observedSD.toFixed(5)}, expected ${expected.toFixed(5)} ±${tol.toFixed(5)}`);
});

// ── Erlang exact distribution check ──────────────────────────────────────────
//
// X̄ of n=5 Exp(1) ~ Gamma(5, 5) [shape=5, rate=5, mean=1]
// P(X̄ < 0.8) = P(Gamma(5,1) < 4.0) = regularised lower incomplete gamma P(5, 4.0)
// = e^{-4} · (1 + 4 + 8 + 32/3 + 32/3) ... exact series
// Known value: P(5, 4.0) ≈ 0.371163  (computed independently)
// Tolerance ±0.01 (observed fraction from N=2000 trials has SE = √(p(1-p)/N) ≈ 0.011)

test('Erlang exact: P(X̄ < 0.8, n=5, Exp) ≈ 0.371163 ±0.003 (formula)', () => {
  // Test the formula itself first (no simulation needed)
  const pExact = CentralLimitModel.erlangCDF(5, 0.8);
  assert.ok(Math.abs(pExact - 0.371163) < 0.003,
    `erlangCDF(5, 0.8) = ${pExact.toFixed(6)}, expected ≈0.371163`);
});

// seed=42 is the default, not hand-tuned; tolerance is analytically derived below.
// SE of observed fraction = sqrt(p(1-p)/N); tol = 4×SE
// p ≈ 0.371163, N=2000: tol = 4×sqrt(0.371163×0.628837/2000) ≈ 0.0432

test('Erlang exact vs observed fraction ±4·sqrt(p(1-p)/N) (n=5, Exp, N=2000)', () => {
  const m = new CentralLimitModel({ dist: 'exponential', n: 5, N: 2000, seed: 42 });
  m.run();
  const pExact   = CentralLimitModel.erlangCDF(5, 0.8);
  const observed = m.means.filter(v => v < 0.8).length / m.means.length;
  const tol      = 4 * Math.sqrt(pExact * (1 - pExact) / 2000);
  assert.ok(Math.abs(observed - pExact) < tol,
    `observed P(X̄<0.8) = ${observed.toFixed(4)}, Erlang exact = ${pExact.toFixed(4)} ±${tol.toFixed(4)}`);
});

// ── Cauchy CLT failure ────────────────────────────────────────────────────────
//
// For Cauchy(0,1): sum of n Cauchy is Cauchy(0,n), so X̄ = Sum/n ~ Cauchy(0,1)
// IQR of sample means ≈ IQR of single Cauchy ≈ 2 (the IQR of Cauchy(0,1))
// Test: IQR should NOT decrease to IQR_parent/√30 ≈ 2/√30 ≈ 0.365
// Specifically, IQR should remain > 1 (more than 1/3 of the Cauchy IQR)

test('Cauchy CLT failure: IQR of means n=30 ≈ IQR of single Cauchy (not /√30)', () => {
  const m = new CentralLimitModel({ dist: 'cauchy', n: 30, N: 500, seed: 42 });
  m.run();
  const iqr = m.observedIQR();
  // Cauchy IQR ≈ 2; CLT would give ≈ 2/√30 ≈ 0.365
  // Confirm IQR >> 0.365 (i.e. CLT is NOT shrinking spread)
  assert.ok(iqr > 1,
    `Cauchy IQR of means = ${iqr.toFixed(3)}, expected > 1 (CLT fails; not ≈ 2/√30 ≈ 0.365)`);
});
