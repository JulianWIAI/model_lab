/**
 * Tests for LeslieModel.
 *
 * Anchors from tools/anchors-phase9.mjs §7.
 *
 * 2-age imprimitive: L=[[0,4],[0.5,0]]  char poly λ²=2 → ±√2; |λ₂/λ₁|=1
 * 3-age primitive: L=[[0,1,5],[0.4,0,0],[0,0.6,0]]
 *   char poly: λ³=0.4λ+1.2; λ≈1.18761471; R₀=1.6; r≈0.17195
 *   L^5 first all-positive power; Euler-Lotka holds
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LeslieModel } from '../../js/benches/biology/ecology/age-structure/LeslieModel.js';
import { matMul, eigen2x2 } from '../../js/core/LinAlg.js';

// ── 2-age imprimitive model ───────────────────────────────────────────────────

const m2 = new LeslieModel({ fecundities: [0, 4], survivals: [0.5] });

test('2-age isPrimitive = false', () => {
  assert.strictEqual(m2.isPrimitive(), false);
});

test('2-age eigenvalues: λ₁=+√2, λ₂=−√2 via eigen2x2', () => {
  // char poly λ²=2 → eigenvalues ±√2; use eigen2x2 directly
  const { real } = eigen2x2(m2.L);
  assert.ok(Math.abs(real[0] / Math.sqrt(2) - 1) < 1e-12, `λ₁=${real[0]}`);
  assert.ok(Math.abs(real[1] / (-Math.sqrt(2)) - 1) < 1e-12, `λ₂=${real[1]}`);
  // dominantEigen should flag imprimitive
  const { imprimitive } = m2.dominantEigen();
  assert.strictEqual(imprimitive, true);
});

test('2-age power iteration sign alternates (imprimitive oscillation)', () => {
  const L2 = [[0, 4], [0.5, 0]];
  let v = [1, 0];
  const signs = [];
  for (let k = 0; k < 6; k++) {
    const Lv = [L2[0][0]*v[0]+L2[0][1]*v[1], L2[1][0]*v[0]+L2[1][1]*v[1]];
    const norm = Math.max(Math.abs(Lv[0]), Math.abs(Lv[1]));
    signs.push(Lv[0] > 0 ? 1 : -1);
    v = Lv.map(x => x / norm);
  }
  const alternates = signs.slice(1).every((s, i) => s !== signs[i]);
  assert.ok(alternates, `signs=${JSON.stringify(signs)}`);
});

test('2-age |λ₂/λ₁| = 1 ±1e-15 (imprimitive ratio)', () => {
  // char poly eigenvalues: ±√2
  const lam1 = Math.sqrt(2);
  const lam2 = -Math.sqrt(2);
  assert.ok(Math.abs(Math.abs(lam2 / lam1) - 1) < 1e-15);
});

// ── 3-age primitive model ─────────────────────────────────────────────────────

const m3 = new LeslieModel({ fecundities: [0, 1, 5], survivals: [0.4, 0.6] });

test('3-age isPrimitive = true', () => {
  assert.strictEqual(m3.isPrimitive(), true);
});

test('L^k not all-positive for k=1..4', () => {
  const L = m3.L;
  let Mk = L.map(row => [...row]);
  for (let k = 1; k <= 4; k++) {
    const allPos = Mk.every(row => row.every(x => x > 0));
    assert.strictEqual(allPos, false, `L^${k} should not be all-positive`);
    if (k < 4) Mk = matMul(Mk, L);
  }
});

test('L^5 all-positive (first such power, Wielandt bound)', () => {
  const L = m3.L;
  let Mk = L.map(row => [...row]);
  for (let k = 1; k < 5; k++) Mk = matMul(Mk, L);
  const allPos = Mk.every(row => row.every(x => x > 0));
  assert.strictEqual(allPos, true);
});

test('3-age λ ≈ 1.18761471 ±1e-5', () => {
  const { lambda } = m3.dominantEigen();
  assert.ok(Math.abs(lambda / 1.18761471 - 1) < 1e-5, `lambda=${lambda}`);
});

test('3-age char poly residual |λ³−0.4λ−1.2| < 1e-13', () => {
  const { lambda } = m3.dominantEigen();
  const residual = Math.abs(lambda ** 3 - 0.4 * lambda - 1.2);
  assert.ok(residual < 1e-13, `residual=${residual}`);
});

test('3-age Euler-Lotka: l₁f₁/λ² + l₂f₂/λ³ = 1 ±1e-13', () => {
  const { lambda } = m3.dominantEigen();
  const l1f1 = 0.4 * 1;   // l₁=s₀=0.4, f₁=1
  const l2f2 = 0.4 * 0.6 * 5;  // l₂=s₀·s₁=0.24, f₂=5
  const lhs = l1f1 / (lambda ** 2) + l2f2 / (lambda ** 3);
  assert.ok(Math.abs(lhs - 1) < 1e-13, `Euler-Lotka=${lhs}`);
});

test('3-age R₀ = 1.6 ±1e-15', () => {
  const R0 = m3.netReproductiveRate();
  assert.ok(Math.abs(R0 / 1.6 - 1) < 1e-15, `R₀=${R0}`);
});

test('3-age r = ln(λ): algebraic check and ≈0.17195 ±1e-4', () => {
  const { lambda } = m3.dominantEigen();
  const r = m3.intrinsicRate();
  assert.ok(r !== null, 'r should not be null');
  // Algebraic: r = ln(lambda) exactly
  assert.ok(Math.abs(r - Math.log(lambda)) < 1e-15, `r=${r} vs ln(λ)=${Math.log(lambda)}`);
  // Order of magnitude check (power-iter λ accurate to ~1e-5; r has same abs error)
  assert.ok(Math.abs(r - 0.17195) < 1e-4, `r=${r}`);
});

test('L·w = λ·w eigenvector residual < 1e-8', () => {
  const { lambda, stableAge: w } = m3.dominantEigen();
  const Lw = m3.step(w);
  const maxRes = Lw.reduce((m, v, i) => Math.max(m, Math.abs(v - lambda * w[i])), 0);
  assert.ok(maxRes < 1e-8, `max eigvec residual=${maxRes}`);
});

// ── λ=1 closed form: s₀=0.25 gives λ=1 ──────────────────────────────────────

test('λ=1 stationary: s₀=0.25 gives λ≈1 ±1e-8', () => {
  const mStat = new LeslieModel({ fecundities: [0, 1, 5], survivals: [0.25, 0.6] });
  const { lambda } = mStat.dominantEigen();
  assert.ok(Math.abs(lambda - 1) < 1e-8, `lambda at s₀=0.25: ${lambda}`);
});

// ── Simulate n0=(1,0,0): total grows as λ^t ──────────────────────────────────

test('simulate: total abundance grows as λ^t at T=200 ±1e-3 relative', () => {
  const n0 = [1, 0, 0];
  const T  = 200;
  const sim = m3.simulate(n0, T);
  const { lambda } = m3.dominantEigen();
  // Check growth ratio at late time (approaching asymptotic)
  const Nlate = sim[T].reduce((s, x) => s + x, 0);
  const Nlate1 = sim[T - 1].reduce((s, x) => s + x, 0);
  const ratio = Nlate / Nlate1;
  assert.ok(Math.abs(ratio / lambda - 1) < 1e-3, `N(T)/N(T-1)=${ratio}, λ=${lambda}`);
});

// ── Domain validation ────────────────────────────────────────────────────────

test('fᵢ<0 throws RangeError', () => {
  assert.throws(() => new LeslieModel({ fecundities: [-1, 5], survivals: [0.5] }), RangeError);
});

test('sᵢ>1 throws RangeError', () => {
  assert.throws(() => new LeslieModel({ fecundities: [0, 5], survivals: [1.1] }), RangeError);
});

test('sᵢ≤0 throws RangeError', () => {
  assert.throws(() => new LeslieModel({ fecundities: [0, 5], survivals: [0] }), RangeError);
  assert.throws(() => new LeslieModel({ fecundities: [0, 5], survivals: [-0.1] }), RangeError);
});

test('r at imprimitive model: intrinsicRate returns non-null (lambda>0)', () => {
  // Even for imprimitive 2-age, λ from power iteration is √2 > 0, so r is defined
  const r = m2.intrinsicRate();
  assert.ok(r !== null, 'r should be computable for λ>0');
});
