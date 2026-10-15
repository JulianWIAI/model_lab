import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RadioactiveDecayModel, ISOTOPES } from '../../js/benches/chemistry/nuclear/radioactive-decay/RadioactiveDecayModel.js';
import { CONSTANTS } from '../../js/data/constants.js';

// ── Exact mathematical properties ──────────────────────────────────────────

test('N(1) = N0/2 (one half-life) ±1e-10', () => {
  const m = new RadioactiveDecayModel({ N0: 1000, isotopeId: 'c14' });
  assert.ok(Math.abs(m.N(1) - 500) < 1e-10, `N(1) = ${m.N(1)}`);
});

test('N(2) = N0/4 (two half-lives) ±1e-10', () => {
  const m = new RadioactiveDecayModel({ N0: 1000, isotopeId: 'c14' });
  assert.ok(Math.abs(m.N(2) - 250) < 1e-10, `N(2) = ${m.N(2)}`);
});

test('lambda = LN2 / halfLifeSI ±1e-14', () => {
  for (const iso of ISOTOPES) {
    const m = new RadioactiveDecayModel({ isotopeId: iso.id });
    assert.ok(Math.abs(m.lambda - Math.LN2 / m.halfLifeSI) < 1e-14,
      `${iso.id}: lambda=${m.lambda}`);
  }
});

test('age(0.5) = 1 half-life ±1e-10', () => {
  const m = new RadioactiveDecayModel({ isotopeId: 'c14' });
  assert.ok(Math.abs(m.age(0.5) - 1) < 1e-10, `age(0.5) = ${m.age(0.5)}`);
});

test('age(0.25) = 2 half-lives ±1e-10', () => {
  const m = new RadioactiveDecayModel({ isotopeId: 'u238' });
  assert.ok(Math.abs(m.age(0.25) - 2) < 1e-10, `age(0.25) = ${m.age(0.25)}`);
});

test('A(0) = lambda * N0 ±1e-10', () => {
  const m = new RadioactiveDecayModel({ N0: 1e20, isotopeId: 'ra226' });
  assert.ok(Math.abs(m.A(0) - m.lambda * 1e20) < 1e-10 * m.lambda * 1e20,
    `A(0) = ${m.A(0)}, expected ${m.lambda * 1e20}`);
});

test('N(t) monotonically decreasing', () => {
  const m = new RadioactiveDecayModel({ N0: 1000, isotopeId: 'i131' });
  const pts = m.curve(5, 100);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].N <= pts[i - 1].N,
      `N not decreasing at i=${i}: ${pts[i].N} > ${pts[i - 1].N}`);
  }
});

// ── Curie anchor (independent derivation) ──────────────────────────────────
//
// 1 g Ra-226: N = NA / M, t½ = 1600 y × 3.15576e7 s/y = 5.0492e10 s
// λ = ln(2)/t½ → A = λ·N ≈ 3.66e10 Bq ≈ 0.988 Ci
// Tolerances: t½ ±0.007 y (NUBASE2020 unc) → ΔA/A ≈ 0.004%; use ±0.05e10 Bq
test('Curie anchor: 1 g Ra-226 activity ≈ 3.66e10 Bq ±0.05e10', () => {
  const NA   = CONSTANTS.NA.value;              // 6.022 140 76e23 mol⁻¹
  const M    = 226.0254;                        // g/mol (molar mass Ra-226)
  const tHy  = 1600;                            // years (NUBASE2020 central value)
  const tHs  = tHy * 3.15576e7;                // seconds = 5.04922e10 s
  const lam  = Math.LN2 / tHs;                 // s⁻¹
  const N    = NA / M;                          // atoms per gram = 2.6643e21
  const A   = lam * N;                          // Bq

  // Cross-check via model
  const m   = new RadioactiveDecayModel({ N0: N, isotopeId: 'ra226' });
  const A_model = m.A(0);

  assert.ok(Math.abs(A - 3.66e10) < 0.05e10,
    `direct computation: A = ${A.toExponential(3)} Bq`);
  assert.ok(Math.abs(A_model - A) < 1e-6 * A,
    `model A(0) = ${A_model.toExponential(3)}, expected ${A.toExponential(3)}`);
});

// ── NUBASE2020 values present in ISOTOPES array ────────────────────────────
test('ISOTOPES contains C-14 with NUBASE2020 t½ = 5700 y', () => {
  const iso = ISOTOPES.find(i => i.id === 'c14');
  assert.ok(iso, 'c14 not found');
  assert.strictEqual(iso.tHalf, 5700);
  assert.strictEqual(iso.tHalf_godwin, 5730);
  assert.strictEqual(iso.tHalf_libby,  5568);
});

test('ISOTOPES contains Ra-226 with t½ = 1600 y', () => {
  const iso = ISOTOPES.find(i => i.id === 'ra226');
  assert.ok(iso, 'ra226 not found');
  assert.strictEqual(iso.tHalf, 1600);
});

// ── Stochastic mode ─────────────────────────────────────────────────────────
//
// N0=1000, 100 steps Δt=t½/100 = 0.01 t½ → total 1.00 t½ → mean remaining = 500
// Binomial(N0, survive_prob) where survive_prob = exp(−ln2×1) = 0.5
// Variance of N_remaining per trial = N0 × 0.5 × 0.5 = 250
//
// Run M=500 independent trials (different seeds).
// SE of mean = √(250/500) = √0.5 ≈ 0.707  → tolerance = 4 × 0.707 = 2.83
// SE of variance ≈ σ² × √(2/(M−1)) = 250 × √(2/499) ≈ 15.81  → tolerance ≈ 63
test('stochastic: mean remaining ≈ 500 ± 2.83 (4×SE), variance ≈ 250 ± 63 over 500 trials', () => {
  const M      = 500;  // independent trials
  const steps  = 100;
  const dtHalf = 0.01; // total = 1 t½
  const remaining = [];

  for (let trial = 0; trial < M; trial++) {
    const m = new RadioactiveDecayModel({ N0: 1000, isotopeId: 'c14', mode: 'stochastic', seed: trial + 1 });
    for (let s = 0; s < steps; s++) m.stepStochastic(dtHalf);
    remaining.push(m._N);
  }

  const mean = remaining.reduce((a, v) => a + v, 0) / M;
  const variance = remaining.reduce((a, v) => a + (v - mean) ** 2, 0) / (M - 1);

  assert.ok(Math.abs(mean - 500) < 2.83,
    `mean remaining = ${mean.toFixed(2)}, expected 500 ±2.83`);
  assert.ok(Math.abs(variance - 250) < 63,
    `variance = ${variance.toFixed(1)}, expected 250 ±63`);
});
