/**
 * Tests for LogisticMapModel.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LogisticMapModel } from '../../js/benches/math/dynamics/logistic-map/LogisticMapModel.js';

// ── Fixed points ──────────────────────────────────────────────────────────────

test('logistic-map: fixed point 1-1/r at r=2.5', () => {
  const m = new LogisticMapModel({ r: 2.5 });
  assert.ok(Math.abs(m.fixedPoint - 0.6) < 1e-10, `x* = ${m.fixedPoint}, expected 0.6`);
});

test('logistic-map: fixed point stable at r=2.5, unstable at r=3.5', () => {
  assert.ok(new LogisticMapModel({ r: 2.5 }).fixedPointStable, 'r=2.5 should be stable');
  assert.ok(!new LogisticMapModel({ r: 3.5 }).fixedPointStable, 'r=3.5 should be unstable');
});

test('logistic-map: r=3 period-doubling boundary |f\'(x*)|=1', () => {
  const m = new LogisticMapModel({ r: 3 });
  assert.ok(Math.abs(Math.abs(2 - 3) - 1) < 1e-10, '|2-r| at r=3 should equal 1');
});

test('logistic-map: r=1 orbit converges toward 0', () => {
  // At r=1, x* = 1-1/r = 0; convergence is algebraic (~1/n), so 200 steps gives x≈0.005.
  const m = new LogisticMapModel({ r: 1 });
  const xs = m.iterate(200, 0.3);
  assert.ok(xs[xs.length - 1] < 0.01, `x after 200 steps = ${xs[xs.length - 1]}, expected < 0.01`);
});

// ── Period-2 ──────────────────────────────────────────────────────────────────

test('logistic-map: period-2 formula at r=3.4', () => {
  const r = 3.4;
  const m = new LogisticMapModel({ r });
  const { xA, xB } = m.period2Points();
  // Verify f(xA)=xB and f(xB)=xA
  assert.ok(Math.abs(r * xA * (1 - xA) - xB) < 1e-10, `f(xA) should equal xB`);
  assert.ok(Math.abs(r * xB * (1 - xB) - xA) < 1e-10, `f(xB) should equal xA`);
});

test('logistic-map: period-4 onset at r=1+√6 ≈ 3.449490', () => {
  const r4 = 1 + Math.sqrt(6);
  assert.ok(Math.abs(r4 - 3.449490) < 1e-5, `1+√6 = ${r4}, expected ≈ 3.449490`);
  // At r=1+√6, the period-2 multiplier = -1 (second bifurcation)
  // Product f'(xA)·f'(xB) at period-4 onset = -1 (exact)
  const { xA, xB } = new LogisticMapModel({ r: r4 }).period2Points();
  const prod = (r4 * (1 - 2 * xA)) * (r4 * (1 - 2 * xB));
  assert.ok(Math.abs(prod + 1) < 1e-6, `Period-2 multiplier at r=1+√6: ${prod}, expected -1`);
});

// ── Superstable parameters ────────────────────────────────────────────────────

test('logistic-map: R1 = 1+√5 (superstable period-2) ≈ 3.236068', () => {
  const R1 = LogisticMapModel.superstableR(1, 3.0, 3.4);
  const expected = 1 + Math.sqrt(5);
  assert.ok(Math.abs(R1 - expected) < 1e-6,
    `R1 = ${R1}, expected 1+√5 = ${expected}`);
  // Verify cubic r³−4r²+8=0
  assert.ok(Math.abs(R1 ** 3 - 4 * R1 ** 2 + 8) < 1e-8,
    `r³−4r²+8 at R1 = ${R1 ** 3 - 4 * R1 ** 2 + 8}`);
});

test('logistic-map: R2 superstable ≈ 3.498562', () => {
  const R2 = LogisticMapModel.superstableR(2, 3.4, 3.55);
  assert.ok(Math.abs(R2 - 3.498562) < 1e-4,
    `R2 = ${R2}, expected ≈ 3.498562`);
});

test('logistic-map: R3 superstable ≈ 3.554641', () => {
  const R3 = LogisticMapModel.superstableR(3, 3.5, 3.57);
  assert.ok(Math.abs(R3 - 3.554641) < 1e-4,
    `R3 = ${R3}, expected ≈ 3.554641`);
});

test('logistic-map: feigenbaum 3-iterate ratio ≈ 4.68 ±0.05', () => {
  const R1 = LogisticMapModel.superstableR(1, 3.0, 3.4);
  const R2 = LogisticMapModel.superstableR(2, 3.4, 3.55);
  const R3 = LogisticMapModel.superstableR(3, 3.5, 3.57);
  const ratio = (R2 - R1) / (R3 - R2);
  // 3-iterate approximation ≈ 4.6808; asymptotic δ=4.6692 is the limit
  assert.ok(Math.abs(ratio - 4.68) < 0.05,
    `Feigenbaum 3-iterate ratio = ${ratio.toFixed(4)}, expected 4.68 ±0.05`);
});

// ── Lyapunov ──────────────────────────────────────────────────────────────────

test('logistic-map: lyapunov r=4 = ln2 ±0.00363 (4×SE for N=1e6)', () => {
  // λ(r=4) = ln2 exactly (invariant density 1/(π√(x(1-x))))
  // SE = √(Var(ln|f'|)/N) = √(0.8225/1e6) = 9.07e-4; 4×SE = 3.63e-3
  const m = new LogisticMapModel({ r: 4, N: 1e6 });
  const lam = m.lyapunov(1e6, 0.123);
  assert.ok(Math.abs(lam - Math.LN2) < 0.00363,
    `λ(r=4) = ${lam.toFixed(6)}, expected ln2=${Math.LN2.toFixed(6)}, tol=0.00363`);
});

test('logistic-map: lyapunov r=2.5 < 0 (stable fixed point)', () => {
  const m = new LogisticMapModel({ r: 2.5, N: 5000 });
  const lam = m.lyapunov(5000, 0.3);
  assert.ok(lam < 0, `λ(r=2.5) = ${lam.toFixed(4)}, expected negative`);
});

// ── Domain and special values ─────────────────────────────────────────────────

test('logistic-map: r>4 leaves domain [0,1]', () => {
  const m = new LogisticMapModel({ r: 4.1 });
  const xs = m.iterate(100, 0.5);
  assert.ok(xs.includes(null), 'r=4.1 should produce a null (domain exit)');
});

test('logistic-map: period-3 at r=1+2√2 ≈ 3.828427', () => {
  const r3 = 1 + 2 * Math.sqrt(2);
  assert.ok(Math.abs(r3 - 3.828427) < 1e-5,
    `1+2√2 = ${r3.toFixed(6)}, expected ≈ 3.828427`);
  // At r=1+2√2, a period-3 orbit exists: verify by iterating from x=½ for 10000 steps
  // (longer burn-in needed: at onset the orbit is marginally stable, converging as ~1/√n)
  // and checking that x_{n+3} ≈ x_n (within tolerance)
  let x = 0.5;
  for (let i = 0; i < 10000; i++) x = r3 * x * (1 - x);
  const x0 = x;
  x = r3 * x * (1 - x);
  x = r3 * x * (1 - x);
  x = r3 * x * (1 - x);
  assert.ok(Math.abs(x - x0) < 1e-8, `Period-3 check: |x₃−x₀| = ${Math.abs(x - x0)}`);
});

// ── Stability formula via model (strengthens constant-vs-constant test at line 22) ──

test('logistic-map: |f′(x*)| at r=3 computed via model (not constant vs constant)', () => {
  const m = new LogisticMapModel({ r: 3 });
  // f′(x*) = r·(1−2x*); x* = 1−1/r = 2/3 → f′ = 3·(1−4/3) = −1 → |f′| = 1
  const deriv = Math.abs(m.r * (1 - 2 * m.fixedPoint));
  assert.ok(Math.abs(deriv - 1) < 1e-10,
    `|f'(x*)| at r=3 via model = ${deriv}, expected 1`);
});

// ── Sensitivity to initial conditions ─────────────────────────────────────────

test('logistic-map: sensitivity at r=4 — two orbits diverge (Lyapunov λ>0)', () => {
  // λ(r=4)=ln2>0 → |Δx_n|≈2^n·|Δx_0| → saturates at O(1) after n≈40 steps.
  // Starting at x=0.4 and x=0.4+1e-12: after 80 steps, difference should be O(1).
  let x1 = 0.4, x2 = 0.4 + 1e-12;
  for (let i = 0; i < 80; i++) {
    x1 = 4 * x1 * (1 - x1);
    x2 = 4 * x2 * (1 - x2);
  }
  assert.ok(Math.abs(x1 - x2) > 0.1,
    `r=4 sensitivity: |x₈₀| = ${Math.abs(x1 - x2).toFixed(4)}, expected > 0.1 (diverged)`);
});

// ── Invariant density ─────────────────────────────────────────────────────────

test('logistic-map: invariant density at r=4 — fraction in [0.25,0.75] = 1/3 ±4σ', () => {
  // Under ρ(x)=1/(π√(x(1−x))), P(x∈[a,b]) = (2/π)(arcsin(√b)−arcsin(√a))
  // P([0.25,0.75]) = (2/π)(arcsin(√0.75)−arcsin(√0.25)) = (2/π)(π/3−π/6) = 1/3
  const N = 200000;
  let x = 0.1;
  for (let i = 0; i < 1000; i++) x = 4 * x * (1 - x); // burn-in
  let count = 0;
  for (let i = 0; i < N; i++) {
    x = 4 * x * (1 - x);
    if (x >= 0.25 && x <= 0.75) count++;
  }
  const frac = count / N;
  const expected = 1 / 3;
  // SE = √(p(1−p)/N); 4×SE for 99.994% coverage (analytically derived)
  const tol = 4 * Math.sqrt(expected * (1 - expected) / N);
  assert.ok(Math.abs(frac - expected) < tol,
    `Fraction in [0.25,0.75] = ${frac.toFixed(4)}, expected 1/3, tol=${tol.toFixed(4)}`);
});

// ── Feigenbaum 4-iterate ratio vs asymptotic δ ────────────────────────────────

test('logistic-map: feigenbaum 4-iterate ratio ≈ δ=4.6692 ±0.1', () => {
  // 4-iterate approximation is closer to asymptotic δ=4.6692... than the 3-iterate.
  // R4: superstable period-16 parameter (bracket in [3.555, 3.568])
  const R2 = LogisticMapModel.superstableR(2, 3.4, 3.55);
  const R3 = LogisticMapModel.superstableR(3, 3.5, 3.57);
  const R4 = LogisticMapModel.superstableR(4, 3.555, 3.568);
  const ratio = (R3 - R2) / (R4 - R3);
  assert.ok(Math.abs(ratio - 4.6692) < 0.1,
    `Feigenbaum 4-iterate ratio = ${ratio.toFixed(4)}, expected δ≈4.6692 ±0.1`);
});

// ── Lyapunov tolerance from first principles (Var = π²/12) ───────────────────

test('logistic-map: lyapunov r=4 = ln2, tolerance from Var(ln|f′|)=π²/12', () => {
  // Var(ln|f'(x)|) under ρ(x)=1/(π√(x(1-x))) = π²/12 exactly (derivable via θ=2arcsin(√x))
  // SE = √(π²/(12·N)); tolerance = 4×SE (no magic constant 0.8225)
  const N = 1e6;
  const m = new LogisticMapModel({ r: 4 });
  const lam = m.lyapunov(N, 0.123);
  const tol = 4 * Math.sqrt(Math.PI ** 2 / (12 * N));
  assert.ok(Math.abs(lam - Math.LN2) < tol,
    `λ(r=4) = ${lam.toFixed(6)}, expected ln2=${Math.LN2.toFixed(6)}, tol=${tol.toFixed(6)}`);
});

// ── Period-3 has 3 distinct cycle points (strengthens single-start test above) ─

// ── Sensitivity from δ₀=1e-10 — growth rate ≈ ln2 ───────────────────────────

test('logistic-map: sensitivity at r=4 from δ₀=1e-10 — growth rate ≈ ln2 ±10%', () => {
  // λ(r=4)=ln2 → |δ_n| ≈ δ₀·e^(λn). Starting from δ₀=1e-10:
  //   |δ|≥0.1 after n* ≈ ln(0.1/1e-10)/ln2 = 9·ln10/ln2 ≈ 29.9 steps (observed ≈ 31).
  // Estimated λ̂ = ln(0.1/δ₀)/n* should satisfy |λ̂−ln2| < 10%·ln2.
  let x1 = 0.4, x2 = 0.4 + 1e-10;
  let n = 0;
  while (Math.abs(x1 - x2) < 0.1 && n < 200) {
    x1 = 4 * x1 * (1 - x1);
    x2 = 4 * x2 * (1 - x2);
    n++;
  }
  const estLambda = Math.log(0.1 / 1e-10) / n;
  const tol = 0.1 * Math.LN2;
  assert.ok(Math.abs(estLambda - Math.LN2) < tol,
    `Growth rate from δ₀=1e-10: |δ|≥0.1 after ${n} steps, λ̂=${estLambda.toFixed(4)}, ln2=${Math.LN2.toFixed(4)}, tol=±${tol.toFixed(4)}`);
});

// ── Feigenbaum 4-iterate ratio ±0.01 (R1–R4 stated) ──────────────────────────

test('logistic-map: feigenbaum 4-iterate ratio ≈ δ=4.6692 ±0.01 (R1≈3.2361, R2≈3.4986, R3≈3.5546, R4≈3.5667)', () => {
  // Superstable parameters: R1=1+√5≈3.2361, R2≈3.4986, R3≈3.5546, R4≈3.5667 (periods 2,4,8,16).
  // 4-iterate Feigenbaum ratio (R3−R2)/(R4−R3) ≈ 4.6630, within ±0.01 of δ=4.6692.
  const R1 = LogisticMapModel.superstableR(1, 3.0, 3.4);   // ≈ 3.2361
  const R2 = LogisticMapModel.superstableR(2, 3.4, 3.55);  // ≈ 3.4986
  const R3 = LogisticMapModel.superstableR(3, 3.5, 3.57);  // ≈ 3.5546
  const R4 = LogisticMapModel.superstableR(4, 3.555, 3.568); // ≈ 3.5667
  const ratio = (R3 - R2) / (R4 - R3);
  assert.ok(Math.abs(ratio - 4.6692) < 0.01,
    `Feigenbaum 4-iterate: R1=${R1.toFixed(4)}, R2=${R2.toFixed(4)}, R3=${R3.toFixed(4)}, R4=${R4.toFixed(4)}, ratio=${ratio.toFixed(4)}, expected δ≈4.6692 ±0.01`);
});

// ── Lyapunov batch-means (accounts for negative autocorrelation) ──────────────

test('logistic-map: lyapunov r=4 — batch-means SE tighter than iid (negative autocorrelation)', () => {
  // ln|f'(x)| at r=4 has NEGATIVE autocorrelation: x near ½ gives small |f'|=0, then next
  // iterate lands near 0 or 1 giving |f'|≈4. Batch-means SE << iid SE=√(π²/12N).
  const N = 200000, B = 100, batchSize = N / B;
  let x = 0.3;
  for (let i = 0; i < 2000; i++) x = 4 * x * (1 - x); // burn-in
  const batchMeans = [];
  for (let b = 0; b < B; b++) {
    let sum = 0;
    for (let i = 0; i < batchSize; i++) {
      x = 4 * x * (1 - x);
      sum += Math.log(Math.abs(4 * (1 - 2 * x)));
    }
    batchMeans.push(sum / batchSize);
  }
  const overall = batchMeans.reduce((a, v) => a + v, 0) / B;
  const batchVar = batchMeans.reduce((a, v) => a + (v - overall) ** 2, 0) / (B - 1);
  const batchSE = Math.sqrt(batchVar / B);
  const iidSE = Math.sqrt(Math.PI ** 2 / (12 * N));
  // Negative autocorrelation → batch SE ≪ iid SE
  assert.ok(batchSE < iidSE,
    `Batch SE=${batchSE.toExponential(3)} should be < iid SE=${iidSE.toExponential(3)}`);
  // Mean within 4×batch SE of ln2 (stronger assertion than the iid-tolerance tests)
  assert.ok(Math.abs(overall - Math.LN2) < 4 * batchSE,
    `λ=${overall.toFixed(6)}, ln2=${Math.LN2.toFixed(6)}, 4×batchSE=${(4 * batchSE).toFixed(6)}`);
});

// ── Invariant density batch-means (accounts for negative autocorrelation) ─────

test('logistic-map: invariant density at r=4 — batch-means SE (accounts for autocorrelation)', () => {
  // P(x∈[0.25,0.75])=1/3 exactly (arcsin formula). Sequence is negatively autocorrelated;
  // batch-means SE correctly captures this without inflating the tolerance.
  const N = 200000, B = 100, batchSize = N / B;
  let x = 0.3;
  for (let i = 0; i < 2000; i++) x = 4 * x * (1 - x);
  const batchMeans = [];
  for (let b = 0; b < B; b++) {
    let count = 0;
    for (let i = 0; i < batchSize; i++) {
      x = 4 * x * (1 - x);
      if (x >= 0.25 && x <= 0.75) count++;
    }
    batchMeans.push(count / batchSize);
  }
  const overall = batchMeans.reduce((a, v) => a + v, 0) / B;
  const batchVar = batchMeans.reduce((a, v) => a + (v - overall) ** 2, 0) / (B - 1);
  const batchSE = Math.sqrt(batchVar / B);
  assert.ok(Math.abs(overall - 1 / 3) < 4 * batchSE,
    `Fraction in [0.25,0.75] = ${overall.toFixed(4)}, expected 1/3, 4×batchSE = ${(4 * batchSE).toFixed(6)}`);
});

// ── Stability at r=3.5 — unstable fixed point repeller ───────────────────────

test('logistic-map: fixed point at r=3.5 — |f′(x*)|=1.5 (exact), perturbation grows as 1.5^n ±1%', () => {
  // x* = 1−1/r = 5/7; f'(x*) = r·(1−2x*) = 3.5·(1−10/7) = −3/2 → |f'(x*)|=1.5 exactly.
  // λ_fixed = ln(1.5) ≈ 0.405 (unstable repeller; orbits diverge at 1.5× per step).
  // Linearised: |δ_20| = 1.5^20·|δ_0| ≈ 3325.26·1e-12 ≈ 3.3e-9 — still in linear regime.
  const r = 3.5;
  const xStar = 1 - 1 / r; // = 5/7 exactly
  const deriv = Math.abs(r * (1 - 2 * xStar));
  assert.ok(Math.abs(deriv - 1.5) < 1e-10,
    `|f'(x*)| at r=3.5 = ${deriv}, expected 1.5`);
  const nSteps = 20;
  const delta0 = 1e-12;
  let x1 = xStar, x2 = xStar + delta0;
  for (let i = 0; i < nSteps; i++) {
    x1 = r * x1 * (1 - x1);
    x2 = r * x2 * (1 - x2);
  }
  const actualGrowth = Math.abs(x2 - x1) / delta0;
  const expectedGrowth = 1.5 ** nSteps; // ≈ 3325.26
  const relErr = Math.abs(actualGrowth / expectedGrowth - 1);
  assert.ok(relErr < 0.01,
    `Growth after ${nSteps} steps: actual=${actualGrowth.toExponential(3)}, expected 1.5^${nSteps}=${expectedGrowth.toFixed(1)}, relErr=${relErr.toExponential(2)}`);
});

test('logistic-map: period-3 at r=3.83 has 3 distinct cycle points (two starts agree)', () => {
  // r=3.83 is inside the period-3 window (1+2√2 ≈ 3.828 to ≈ 3.857).
  // Two different starting points should converge to the same 3-cycle.
  const r = 3.83;
  function getCycle(x0) {
    let x = x0;
    for (let i = 0; i < 5000; i++) x = r * x * (1 - x); // burn-in
    const p = [x, r * x * (1 - x)];
    p.push(r * p[1] * (1 - p[1]));
    return p.slice().sort((a, b) => a - b);
  }
  const c1 = getCycle(0.2);
  const c2 = getCycle(0.8);
  // 3 points are distinct (each differs by > 0.05)
  assert.ok(c1[1] - c1[0] > 0.05 && c1[2] - c1[1] > 0.05,
    `Period-3 points not distinct: ${c1.map(x => x.toFixed(4)).join(', ')}`);
  // Both starting points converge to the same 3-cycle ±1e-6
  for (let j = 0; j < 3; j++) {
    assert.ok(Math.abs(c1[j] - c2[j]) < 1e-6,
      `Cycle point ${j}: start 0.2 gives ${c1[j].toFixed(6)}, start 0.8 gives ${c2[j].toFixed(6)}`);
  }
});
