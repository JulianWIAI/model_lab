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
// Central-difference truncation error for the ODE λ²·V″ − V = 0:
//   λ²·(V(x+h)−2V(x)+V(x−h))/h² − V(x) = (h/λ)²/12 · V(x) + O(h⁴)
//
// At h/λ = 0.01: truncation = (0.01)²/12 · V(x) = 8.333e-6 · V(x)
//   V(0.5λ) = e^{−0.5} = 0.60653...; truncation ≈ 5.054e-6
//   round-off bound = 4·ε/(h/λ)² · V(x) = 4·2.22e-16/(1e-4) · V(x) ≈ 8.88e-12 · V(x) [negligible]
//
// At h/λ = 0.005: truncation = (0.005)²/12 · V(x) = 2.083e-6 · V(x)
//   truncation ≈ 1.264e-6; round-off ≈ 3.55e-11 [negligible]
//
// Both step sizes are well in the truncation-dominated regime.

test('FD residual at h/λ=0.01: within 1% of theoretical truncation', () => {
  const lam = d1um.spaceConstant();
  const V0  = 1;
  const hOverLam = 0.01;
  const dx  = hOverLam * lam;
  const x   = 0.5 * lam;
  const Vm  = d1um.steadyState(x - dx, V0);
  const V0v = d1um.steadyState(x,      V0);
  const Vp  = d1um.steadyState(x + dx, V0);
  const Vpp = (Vm - 2 * V0v + Vp) / (dx * dx);
  const residual = Math.abs(lam * lam * Vpp - V0v);
  const truncation = hOverLam * hOverLam / 12 * V0v;
  // residual should be very close to theoretical truncation
  assert.ok(Math.abs(residual - truncation) / truncation < 0.01,
    `|residual − truncation| / truncation = ${Math.abs(residual - truncation) / truncation}, expected < 0.01`);
});

test('FD residual at h/λ=0.005: within 1% of theoretical truncation', () => {
  const lam = d1um.spaceConstant();
  const V0  = 1;
  const hOverLam = 0.005;
  const dx  = hOverLam * lam;
  const x   = 0.5 * lam;
  const Vm  = d1um.steadyState(x - dx, V0);
  const V0v = d1um.steadyState(x,      V0);
  const Vp  = d1um.steadyState(x + dx, V0);
  const Vpp = (Vm - 2 * V0v + Vp) / (dx * dx);
  const residual = Math.abs(lam * lam * Vpp - V0v);
  const truncation = hOverLam * hOverLam / 12 * V0v;
  assert.ok(Math.abs(residual - truncation) / truncation < 0.01,
    `|residual − truncation| / truncation = ${Math.abs(residual - truncation) / truncation}, expected < 0.01`);
});

test('FD halving ratio ≈ 4 (central differences, h/λ=0.01 vs 0.005)', () => {
  // Central-difference truncation ∝ h² → ratio of residuals for h-halving = 4 exactly.
  const lam = d1um.spaceConstant();
  const V0  = 1;
  const x   = 0.5 * lam;
  function fdResidual(hOverLam) {
    const dx  = hOverLam * lam;
    const Vm  = d1um.steadyState(x - dx, V0);
    const V0v = d1um.steadyState(x,      V0);
    const Vp  = d1um.steadyState(x + dx, V0);
    const Vpp = (Vm - 2 * V0v + Vp) / (dx * dx);
    return Math.abs(lam * lam * Vpp - V0v);
  }
  const r1 = fdResidual(0.01);
  const r2 = fdResidual(0.005);
  const ratio = r1 / r2;
  assert.ok(ratio >= 3.98 && ratio <= 4.02, `halving ratio=${ratio}, expected ∈ [3.98, 4.02]`);
});

// ── Domain validation ─────────────────────────────────────────────────────────

test('d ≤ 0 throws RangeError', () => {
  assert.throws(() => new CableEquationModel({ d_m: 0 }), RangeError);
  assert.throws(() => new CableEquationModel({ d_m: -1e-6 }), RangeError);
});
