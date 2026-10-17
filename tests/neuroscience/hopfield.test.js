/**
 * Tests for HopfieldModel.
 *
 * N=4, single pattern ξ = [1, 1, −1, −1].
 * Weight formula: w_ij = (1/N) Σ_μ ξ_i ξ_j  (i≠j), w_ii=0
 * Energy formula: E = −½ Σ_{i,j} w_ij s_i s_j  (diagonal is 0)
 * Equivalently:   E = (1 − N·m²) / 2  for single stored pattern.
 *
 * Analytical anchors:
 *   w_01 = ξ₀ξ₁/N = 1/4
 *   w_02 = ξ₀ξ₂/N = (1)(−1)/4 = −1/4
 *   E(ξ) = −(N−1)/2 = −1.5  (stored pattern is a minimum)
 *   E(−ξ) = E(ξ)  (W is symmetric → energy symmetric in s ↔ −s)
 *   Orthogonal pattern [1,−1,1,−1]: overlap m=0, E=(1−0)/2=0.5
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HopfieldModel } from '../../js/benches/neuroscience/networks/hopfield/HopfieldModel.js';

const N = 4;
const xi = [1, 1, -1, -1];
const m = new HopfieldModel({ N, patterns: [xi] });

// ── Weight matrix ─────────────────────────────────────────────────────────────

test('w_01 = ξ₀ξ₁/N = 1/4 exactly', () => {
  assert.strictEqual(m.W[0][1], 1 / 4);
});

test('w_02 = ξ₀ξ₂/N = −1/4 exactly', () => {
  assert.strictEqual(m.W[0][2], -1 / 4);
});

test('w_ii = 0 for all i', () => {
  for (let i = 0; i < N; i++) {
    assert.strictEqual(m.W[i][i], 0, `W[${i}][${i}] should be 0`);
  }
});

// ── Energy ────────────────────────────────────────────────────────────────────

test('E_stored = −(N−1)/2 = −1.5 ±1e-14', () => {
  const E = m.energy(xi);
  const ref = -(N - 1) / 2;
  assert.ok(Math.abs(E - ref) < 1e-14, `E(ξ)=${E}, ref=${ref}`);
});

test('E(−ξ) = E(ξ) (symmetry) ±1e-14', () => {
  const E1 = m.energy(xi);
  const E2 = m.energy([-1, -1, 1, 1]);
  assert.ok(Math.abs(E2 - E1) < 1e-14, `E(ξ)=${E1}, E(−ξ)=${E2}`);
});

test('E_orthogonal = +0.5 ±1e-14', () => {
  // [1,−1,1,−1] is orthogonal to ξ: m=(1/4)(1−1−1+1)=0, E=(1−4·0)/2=0.5
  const E = m.energy([1, -1, 1, -1]);
  assert.ok(Math.abs(E - 0.5) < 1e-14, `E_ortho=${E}, ref=0.5`);
});

test('E_orthogonal > E_stored', () => {
  const Eortho  = m.energy([1, -1, 1, -1]);
  const Estored = m.energy(xi);
  assert.ok(Eortho > Estored, `E_ortho=${Eortho}, E_stored=${Estored}`);
});

// ── Recall ────────────────────────────────────────────────────────────────────

test('recall from 1-bit error → stored pattern', () => {
  // Flip the 4th bit: [1,1,−1,1]
  const stateErr = [1, 1, -1, 1];
  const final = m.asyncRun(stateErr, 20);
  assert.ok(
    final.every((v, i) => v === xi[i]),
    `recovered=${JSON.stringify(final)}, expected=${JSON.stringify(xi)}`,
  );
});

test('asyncUpdate decreases E (or stays same)', () => {
  const state = [1, 1, 1, -1];  // not a stored pattern
  const before = m.energy(state);
  const after  = m.energy(m.asyncUpdate(state));
  assert.ok(after <= before + 1e-14, `before=${before}, after=${after}`);
});

test('exact ΔE = −(|h_3|−s_old·h_3) for single flip in [1,1,−1,1] ±1e-14', () => {
  // State [1,1,−1,1]: only neuron 3 is misaligned (ξ[3]=−1 but s_3=1).
  // asyncUpdate flips only s_3 → [1,1,−1,−1]=ξ.
  // h_3 = W[3][0]×1 + W[3][1]×1 + W[3][2]×(−1) = −1/4−1/4−1/4 = −3/4
  // ΔE_formula = −(|h_3| − s_old·h_3) = −(3/4 − 1×(−3/4)) = −3/2
  // E_before([1,1,−1,1]) = 0 (energy formula); E_after = −3/2
  const s0 = [1, 1, -1, 1];
  const h3 = m.localField(s0, 3);
  const deltaE_formula = -(Math.abs(h3) - s0[3] * h3);
  const E_before = m.energy(s0);
  const E_after  = m.energy(m.asyncUpdate(s0));
  assert.ok(Math.abs(h3 + 3 / 4) < 1e-14,         `h_3=${h3}, expected=−3/4`);
  assert.ok(Math.abs(deltaE_formula + 3 / 2) < 1e-14, `ΔE_formula=${deltaE_formula}`);
  assert.ok(
    Math.abs((E_after - E_before) - deltaE_formula) < 1e-14,
    `ΔE_actual=${E_after - E_before}, ΔE_formula=${deltaE_formula}`,
  );
});

// ── Overlap ───────────────────────────────────────────────────────────────────

test('overlapWith stored pattern = 1 ±1e-14', () => {
  const ov = m.overlapWith(xi, 0);
  assert.ok(Math.abs(ov - 1) < 1e-14, `overlap=${ov}`);
});

test('overlapWith orthogonal = 0 ±1e-14', () => {
  const ov = m.overlapWith([1, -1, 1, -1], 0);
  assert.ok(Math.abs(ov) < 1e-14, `overlap=${ov}`);
});

// ── Validation ────────────────────────────────────────────────────────────────

test('patterns not ±1 throws RangeError', () => {
  assert.throws(() => new HopfieldModel({ N: 2, patterns: [[1, 0]] }), RangeError);
});

// ── Capacity formula (algebraic test, not of HopfieldModel) ──────────────────

test('P(bit error) N=1000, M=301: Φ(−√(1000/300)) ≈ 0.0339446 ±1e-5', () => {
  // Signal-to-noise argument: each stored pattern contributes a signal of 1
  // and M-1 other patterns contribute noise variance (M-1)/N per weight.
  // P(bit error) = Φ(−√(N/(M−1))) ≈ Φ(−√(1000/300)) for M=301, N=1000.
  function erf(x) {
    if (Math.abs(x) > 6) return x > 0 ? 1 : -1;
    let sum = 0, term = x, n = 0;
    while (Math.abs(term) > 1e-17 && n < 200) {
      sum += term;
      n++;
      term *= -x * x * (2 * n - 1) / (n * (2 * n + 1));
    }
    return 2 / Math.sqrt(Math.PI) * sum;
  }
  function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }

  const Nnet = 1000;
  const M    = 301;
  const arg  = -Math.sqrt(Nnet / (M - 1));   // −√(1000/300)
  const result = Phi(arg);
  const ref    = 0.0339446;
  assert.ok(
    Math.abs(result - ref) < 1e-5,
    `Φ(−√(1000/300))=${result}, ref=${ref}, diff=${Math.abs(result - ref)}`,
  );
});
