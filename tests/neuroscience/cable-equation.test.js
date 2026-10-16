/**
 * Tests for CableEquationModel.
 *
 * Anchors from tools/anchors-phase9.mjs §3.
 *
 * Parameters: d=1μm, Rm=0.1 Ω·m², Ra=1 Ω·m, Cm=0.01 F/m²
 *   λ = (1/2)√(1e-6·0.1/1) = 1.58113883×10⁻⁴ m
 *   R_in = (2/π)√(0.1·1)·(1e-6)^(−3/2) = 2.01316848×10⁸ Ω
 *   Rall 3/2 law: R_in(10μm)/R_in(1μm) = 10^(−3/2)
 *   λ(10μm)/λ(1μm) = √10
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CableEquationModel } from '../../js/benches/neuroscience/electrophysiology/cable-equation/CableEquationModel.js';

const d1um = new CableEquationModel({ d_m: 1e-6,  Rm_ohm_m2: 0.1, Ra_ohm_m: 1.0, Cm_F_m2: 0.01 });
const d10um = new CableEquationModel({ d_m: 1e-5, Rm_ohm_m2: 0.1, Ra_ohm_m: 1.0, Cm_F_m2: 0.01 });

// ── Space constant λ ──────────────────────────────────────────────────────────

test('λ formula 1 = (1/2)√(1e-6·0.1/1) ±1e-14 relative', () => {
  const lam = d1um.spaceConstant();
  const ref = 0.5 * Math.sqrt(1e-6 * 0.1 / 1);  // compute directly — same formula, independent
  assert.ok(Math.abs(lam / ref - 1) < 1e-14,
    `λ=${lam}, formula2=${ref}, rel err=${lam / ref - 1}`);
});

test('λ formula 1 = λ formula 2 ±1e-15 relative', () => {
  const lam1 = d1um.spaceConstant();
  const lam2 = d1um.spaceConstantAlt();
  assert.ok(Math.abs(lam1 / lam2 - 1) < 1e-15,
    `formulas disagree: ${lam1} vs ${lam2}`);
});

test('λ(d=10μm)/λ(d=1μm) = √10 ±1e-15 relative', () => {
  const ratio = d10um.spaceConstant() / d1um.spaceConstant();
  assert.ok(Math.abs(ratio / Math.sqrt(10) - 1) < 1e-15,
    `ratio=${ratio}, expected √10=${Math.sqrt(10)}`);
});

// ── Input resistance ──────────────────────────────────────────────────────────

test('R_in(d=1μm) matches (2/π)√(Rm·Ra)·d^(−3/2) ±1e-14 relative', () => {
  const Rin = d1um.inputResistance();
  // Independent formula: (2/π)·√(Rm·Ra)·d^{-3/2}
  const ref = (2 / Math.PI) * Math.sqrt(0.1 * 1.0) * Math.pow(1e-6, -1.5);
  assert.ok(Math.abs(Rin / ref - 1) < 1e-14,
    `R_in=${Rin}, ref=${ref}, rel err=${Rin / ref - 1}`);
});

test('Rall 3/2 law: R_in(10μm)/R_in(1μm) = 10^(−3/2) ±1e-15 relative', () => {
  const ratio = d10um.inputResistance() / d1um.inputResistance();
  const ref   = Math.pow(10, -1.5);
  assert.ok(Math.abs(ratio / ref - 1) < 1e-15,
    `ratio=${ratio}, expected ${ref}`);
});

// ── Steady-state voltage ──────────────────────────────────────────────────────

test('V(0)/V₀ = 1 ±1e-15 relative', () => {
  const v = d1um.steadyState(0, 1);
  assert.ok(Math.abs(v - 1) < 1e-15, `V(0)=${v}`);
});

test('V(λ)/V₀ = e^{-1} ±1e-15 relative', () => {
  const lam = d1um.spaceConstant();
  const v   = d1um.steadyState(lam, 1);
  assert.ok(Math.abs(v / Math.exp(-1) - 1) < 1e-15,
    `V(λ)=${v}, expected e^{-1}=${Math.exp(-1)}`);
});

test('V(2λ)/V₀ = e^{-2} ±1e-15 relative', () => {
  const lam = d1um.spaceConstant();
  const v   = d1um.steadyState(2 * lam, 1);
  assert.ok(Math.abs(v / Math.exp(-2) - 1) < 1e-15,
    `V(2λ)=${v}, expected e^{-2}=${Math.exp(-2)}`);
});

// ── Membrane time constant ────────────────────────────────────────────────────

test('τ_m = Rm·Cm = 0.001 s ±1e-15 relative', () => {
  const tau = d1um.timeConstant();
  assert.ok(Math.abs(tau / 0.001 - 1) < 1e-15, `τ_m=${tau}`);
});

// ── Finite cable ──────────────────────────────────────────────────────────────

test('finite sealed: V(0)=V₀, V(L)≥V_semi (seal raises V)', () => {
  const lam = d1um.spaceConstant();
  const L   = 3 * lam;
  const v0  = d1um.finiteCable(0, 1, L, 'sealed');
  assert.ok(Math.abs(v0 - 1) < 1e-15, `V(0) sealed must be 1; got ${v0}`);
  const vL_sealed = d1um.finiteCable(L, 1, L, 'sealed');
  const vL_semi   = d1um.steadyState(L, 1);
  assert.ok(vL_sealed > vL_semi, 'sealed end V(L) must be ≥ semi-infinite V(L)');
});

test('finite killed: V(L) = 0', () => {
  const lam = d1um.spaceConstant();
  const L   = 3 * lam;
  const vL  = d1um.finiteCable(L, 1, L, 'killed');
  assert.ok(Math.abs(vL) < 1e-14, `V(L) killed must be 0; got ${vL}`);
});

test('finite R_in sealed > R_in semi-infinite', () => {
  const lam = d1um.spaceConstant();
  const Rin_semi   = d1um.inputResistance();
  const Rin_sealed = d1um.finiteInputResistance(3 * lam, 'sealed');
  assert.ok(Rin_sealed > Rin_semi, 'sealed R_in must exceed semi-infinite');
});

test('finite R_in killed < R_in semi-infinite', () => {
  const lam = d1um.spaceConstant();
  const Rin_semi   = d1um.inputResistance();
  const Rin_killed = d1um.finiteInputResistance(3 * lam, 'killed');
  assert.ok(Rin_killed < Rin_semi, 'killed R_in must be less than semi-infinite');
});

// ── Finite-difference residual test ──────────────────────────────────────────
// Derivation (V(x) = V₀·e^{-x/λ}):
//   λ²·(V(x+h)−2V(x)+V(x−h))/h² − V(x) = h²·V(x)/(12λ²) + O(h⁴)  [truncation]
//   (round-off floor ~4·ε·V·(λ/h)²)
// At dx = λ/10000:  truncation ≈ V·(1e-4)²/12 ≈ 8.3e-10·V  (dominates)
//   round-off ≈ 4·2.2e-16·V·1e8 ≈ 8.8e-8·V (naive bound; actual ~6.8e-10·V)
// Derived tolerance: 2e-7·V(0.5λ) = 2e-7·e^{-0.5} ≈ 1.2e-7 >> actual ~6.8e-10

test('FD residual |λ²·V″−V| < 2e-7 at x=0.5λ (derived from h²/12 truncation)', () => {
  const lam = d1um.spaceConstant();
  const V0  = 1;
  const dx  = lam / 10000;
  const x   = 0.5 * lam;
  const Vm  = d1um.steadyState(x - dx, V0);
  const V0v = d1um.steadyState(x,      V0);
  const Vp  = d1um.steadyState(x + dx, V0);
  const Vpp = (Vm - 2 * V0v + Vp) / (dx * dx);
  const residual = Math.abs(lam * lam * Vpp - V0v);
  // Derived: truncation = h²·V/(12λ²) ≈ 8.3e-10·e^{-0.5} ≈ 5e-10
  //          round-off bound = 4·eps·V·(λ/h)² ≈ 5.4e-8
  //          tolerance = 2e-7 (3.7× the naive bound)
  assert.ok(residual < 2e-7, `FD residual=${residual}`);
});

test('FD residual halving ratio ≈ 4 (truncation regime, dx=λ/50 vs λ/100)', () => {
  // At h/λ = 1/50 and 1/100, truncation h²V/(12λ²) dominates round-off:
  //   trunc(1/50) ≈ 3.3e-5·V,  trunc(1/100) ≈ 8.3e-6·V  → ratio ≈ 4
  const lam = d1um.spaceConstant();
  const V0  = 1;
  const x   = 0.5 * lam;
  function fdResidual(dx) {
    const Vm  = d1um.steadyState(x - dx, V0);
    const V0v = d1um.steadyState(x,      V0);
    const Vp  = d1um.steadyState(x + dx, V0);
    const Vpp = (Vm - 2 * V0v + Vp) / (dx * dx);
    return Math.abs(lam * lam * Vpp - V0v);
  }
  const r50  = fdResidual(lam / 50);
  const r100 = fdResidual(lam / 100);
  const ratio = r50 / r100;
  assert.ok(ratio >= 3 && ratio <= 5, `halving ratio=${ratio}, expected ≈4`);
});

// ── Domain validation ─────────────────────────────────────────────────────────

test('d ≤ 0 throws RangeError', () => {
  assert.throws(() => new CableEquationModel({ d_m: 0 }), RangeError);
  assert.throws(() => new CableEquationModel({ d_m: -1e-6 }), RangeError);
});
