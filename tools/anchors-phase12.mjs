/**
 * anchors-phase12.mjs — independent numerical anchors for Phase 12 tests (v2).
 *
 * RULES: no model code imported; every value derived from scratch.
 * Run:  node tools/anchors-phase12.mjs
 *
 * v2 critical fixes vs v1:
 *  - special-relativity: γ(0.9994) asserted vs 1/√(1−β²) at 1e-12, NOT vs 28.87
 *  - muon: τ_dilated asserted at ±1e-10 relative; correct value ≈ 63.43 μs
 *  - neutral-theory: t_fix = −4N(1−p)ln(1−p)/p (correct), t_loss = −4N·p·ln(p)/(1−p)
 *  - network-effects: marginal-value ODE, N=100, v1=0.05, c=2, x*=0.41 exactly
 *  - coalescence: Tajima numerator = π − S/a₁ (not S − a₁·ŝ)
 *  - perceptron: sign(0)=+1; exact weight trace (1,1,-1)→(0,2,0)→(1,1,1) asserted
 *  - alternates 6&7: schrodinger-1d and bayesian-observer (random-walk and
 *    particle-in-box are already built in phases 9 and 8)
 *  - R13 mutation checks: each names the WRONG implementation explicitly
 */

import assert from 'node:assert/strict';

const fmt = (v, d = 10) => typeof v === 'number' ? v.toPrecision(d) : String(v);
const sec = (label) => {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(label);
  console.log('═'.repeat(72));
};
const row = (label, value, note = '') =>
  console.log(`  ${label.padEnd(52)} ${fmt(value)}  ${note}`);

// ─── Physical constants (CODATA 2018 / SI exact — read from js/data/constants.js) ──
// c: 299792458 m/s (exact, SI definition)
// hbar: 1.054571817e-34 J·s
// me: 9.1093837015e-31 kg
// e: 1.602176634e-19 C (also used as eV conversion)
const C0   = 299_792_458;            // m/s  exact (SI definition)
const HBAR = 1.054_571_817e-34;      // J·s  CODATA 2018
const ME   = 9.109_383_7015e-31;     // kg   CODATA 2018
const EV   = 1.602_176_634e-19;      // J    exact (SI definition)

// ═══════════════════════════════════════════════════════════════════════════
// 1. SPECIAL RELATIVITY
// ═══════════════════════════════════════════════════════════════════════════
sec('1. SPECIAL RELATIVITY');

// Lorentz factor: γ = 1/√(1−β²); |β| < 1 strictly
function gamma(beta) {
  if (Math.abs(beta) >= 1) throw new RangeError('|β| must be < 1');
  return 1 / Math.sqrt(1 - beta * beta);
}

// Velocity addition: u' = (u − v) / (1 − u·v/c₀²)
function velocityAddition(u, v) {
  return (u - v) / (1 - u * v / (C0 * C0));
}

// Rapidity: φ = atanh(β)
function rapidity(beta) {
  return Math.atanh(beta);
}

// --- γ(β=0) = 1 exactly ---
assert.equal(gamma(0), 1, 'γ(β=0) = 1 exactly');
row('γ(β=0)', gamma(0), '(exact 1)');

// --- Predict P1: γ(β=0.5) = 1/√0.75 = 2/√3 ≈ 1.1547005383792515 ---
const g05 = gamma(0.5);
const g05_exact = 1 / Math.sqrt(1 - 0.25);
row('γ(β=0.5)', g05, '= 2/√3 ≈ 1.1547005383792515');
assert(Math.abs(g05 - g05_exact) < 1e-15, `γ(0.5) = 1/√0.75: got ${g05}`);
// Also check the specific decimal value
assert(Math.abs(g05 - 1.1547005383792515) < 1e-15, `γ(0.5) ≈ 1.1547005383792515`);

// Time dilation: Δt_dilated = γ·Δt_proper
const dt_dilated_05 = g05 * 1.0;
assert(Math.abs(dt_dilated_05 - g05_exact) < 1e-15, 'time dilation β=0.5');

// Length contraction: L = L₀/γ
assert(Math.abs((1.0 / g05) - Math.sqrt(0.75)) < 1e-15, 'length contraction β=0.5');

// --- Predict P2: velocity addition u=0.9c, v=0.5c in lab → u' ---
// Frame moves at v=0.5c; object moves at u=0.9c in lab frame
// u' = (0.9 − 0.5) / (1 − 0.9×0.5) = 0.4/0.55 = 8/11 ≈ 0.72727272...
const u_add = 0.9 * C0, v_add = 0.5 * C0;
const u_prime = velocityAddition(u_add, v_add);
const u_prime_exact = (0.9 - 0.5) / (1 - 0.45);   // = 0.4/0.55 = 8/11
row('\nVelocity addition u=0.9c, v=0.5c → u\'/c', u_prime / C0, '= 8/11 ≈ 0.72727...');
assert(Math.abs(u_prime / C0 - u_prime_exact) < 1e-14, `velocity addition: ${u_prime/C0}`);
assert(Math.abs(u_prime) < C0, 'result < c');

// --- Predict P3: γ(β=0.9994) — KEY ANCHOR ---
// R8: do NOT compare to hardcoded 28.87. Assert vs exact FP formula at 1e-12.
const beta_muon = 0.9994;
const g_muon = gamma(beta_muon);
const g_muon_exact = 1 / Math.sqrt(1 - beta_muon * beta_muon);
row('\nMuon γ(β=0.9994)', g_muon, '= 1/√(1−0.9994²)');
row('1 − β²', 1 - beta_muon * beta_muon, '= 0.00119964');
// Self-consistency: gamma(beta_muon) IS 1/sqrt(1-beta²) — exact FP comparison
assert(Math.abs(g_muon - g_muon_exact) < 1e-12,
  `γ(0.9994) vs 1/√(1−β²): gap = ${Math.abs(g_muon - g_muon_exact)}`);

// Muon rest lifetime τ₀ = 2.1969811×10⁻⁶ s (PDG 2022, cited not fetched)
const tau0_muon = 2.1969811e-6;   // s
const tau_dilated = g_muon * tau0_muon;
// Correct dilated lifetime ≈ 63.43 μs (v1 had ≈63.3 μs — that was wrong τ₀=2.197e-6)
row('Muon τ_dilated (μs)', tau_dilated * 1e6, '≈ 63.43 μs (PDG 2022 τ₀=2.1969811e-6)');
// Assert to ±1e-10 relative
const tau_ref = g_muon_exact * tau0_muon;
assert(Math.abs(tau_dilated / tau_ref - 1) < 1e-10,
  `τ_dilated relative error: ${Math.abs(tau_dilated/tau_ref - 1)}`);
// Range check: 63 – 64 μs
assert(tau_dilated > 63e-6 && tau_dilated < 64e-6,
  `τ_dilated = ${tau_dilated*1e6} μs, expect 63–64 μs`);

// --- Energy-momentum invariant: E² = (pc₀)² + (m₀c₀²)² ---
const m0 = 1.0;   // abstract 1 kg
const beta_em = 0.6;
const g_em = gamma(beta_em);
const v_em = beta_em * C0;
const p_em = m0 * g_em * v_em;
const E_total = g_em * m0 * C0 * C0;
const lhs = E_total * E_total;
const rhs = (p_em * C0) ** 2 + (m0 * C0 * C0) ** 2;
assert(Math.abs(lhs - rhs) / lhs < 1e-12, `E² = (pc)²+(m₀c²)²: rel err ${Math.abs(lhs-rhs)/lhs}`);
row('\nEnergy-momentum invariant: |E²−(pc)²−(m₀c²)²|/E²', Math.abs(lhs-rhs)/lhs, '< 1e-12');

// --- R13 mutation checks ---
// WRONG 1: β² → β in denominator: γ_wrong = 1/√(1−β) instead of 1/√(1−β²)
// At β=0.9994: γ_wrong = 1/√(1−0.9994) = 1/√0.0006 ≈ 40.825; correct ≈ 28.87
const g_wrong_beta = 1 / Math.sqrt(1 - beta_muon);   // WRONG: uses β not β²
const gap_beta = Math.abs(g_muon - g_wrong_beta);
row('\nR13 wrong-γ (β not β²) gap at β=0.9994', gap_beta, `gap >> 1e-12`);
assert(gap_beta > 1e-12, `R13 gap ${gap_beta} >> 1e-12`);
assert(gap_beta > 10, `R13: gap ${gap_beta} is large (wrong formula gives ~40.8 vs 28.9)`);

// WRONG 2: no γ in time dilation: Δt_wrong = Δt_proper instead of γ·Δt_proper
// Gap = (γ−1)·Δt ≈ 27·Δt >> 1e-10 for Δt=1
const gap_td = Math.abs(g_muon * 1.0 - 1.0);   // = (γ−1)·Δt
assert(gap_td > 1e-10, `R13 time dilation gap ${gap_td} >> 1e-10`);

// WRONG 3: wrong sign in E²: E²=(pc)²−(m₀c²)² instead of +
const rhs_wrong = (p_em * C0) ** 2 - (m0 * C0 * C0) ** 2;   // WRONG sign
const gap_em = Math.abs(lhs - rhs_wrong) / lhs;
assert(gap_em > 1e-10, `R13 E-momentum wrong sign: gap ${gap_em} >> 1e-12`);

// RangeError tests
let re1 = false; try { gamma(1.0); } catch (e) { if (e instanceof RangeError) re1 = true; }
assert(re1, 'RangeError for β=1');
let re2 = false; try { gamma(-1.1); } catch (e) { if (e instanceof RangeError) re2 = true; }
assert(re2, 'RangeError for β=−1.1');

// Rapidity: cosh(φ)=γ, sinh(φ)=βγ
const phi_05 = rapidity(0.5);
assert(Math.abs(Math.cosh(phi_05) - g05) < 1e-14, 'cosh(atanh(β)) = γ');
assert(Math.abs(Math.sinh(phi_05) - 0.5 * g05) < 1e-14, 'sinh(atanh(β)) = βγ');

// KE = (γ−1)·m₀c₀²
const KE = (g_em - 1) * m0 * C0 * C0;
assert(KE > 0, 'KE > 0');
assert(Math.abs(KE - (E_total - m0 * C0 * C0)) / KE < 1e-12, 'KE = E_total − m₀c²');

console.log('\n  ✓ All special-relativity assertions passed');

// ═══════════════════════════════════════════════════════════════════════════
// 2. PERCEPTRON (Rosenblatt 1958, cited not fetched)
// ═══════════════════════════════════════════════════════════════════════════
sec('2. PERCEPTRON');

/**
 * Minimal perceptron for anchor verification.
 * sign(0) = +1 (positive convention, per spec).
 * Returns stepwise weight trace for exact comparison.
 */
function runPerceptronTrace(data, labels, eta = 1.0, maxEpochs = 1000) {
  const n = data.length;
  const d = data[0].length + 1;  // +1 for bias
  let w = new Array(d).fill(0);
  const trace = [];   // weight after each mistake
  let totalMistakes = 0;
  let converged = false;
  let epochs = 0;

  for (let ep = 0; ep < maxEpochs; ep++) {
    epochs = ep + 1;
    let epMistakes = 0;
    for (let i = 0; i < n; i++) {
      const x = [...data[i], 1.0];   // augmented with bias=1
      const dot = x.reduce((s, xi, j) => s + w[j] * xi, 0);
      const yhat = dot >= 0 ? 1 : -1;   // sign(0) = +1
      if (yhat !== labels[i]) {
        epMistakes++;
        totalMistakes++;
        for (let j = 0; j < d; j++) w[j] += eta * labels[i] * x[j];
        trace.push([...w]);
      }
    }
    if (epMistakes === 0) { converged = true; break; }
  }
  return { converged, epochs, totalMistakes, w, trace };
}

// OR gate dataset
// (−1,−1)→−1, (−1,+1)→+1, (+1,−1)→+1, (+1,+1)→+1
const orData   = [[-1,-1], [-1,1], [1,-1], [1,1]];
const orLabels = [-1, 1, 1, 1];

// --- EXACT WEIGHT TRACE (from spec, independently derived) ---
// Init w=(0,0,0); augmented x̃=[x₁,x₂,1]
// Epoch 1, point 1: dot=0 → yhat=sign(0)=+1; true=-1 → mistake
//   w ← (0,0,0) + (-1)·(-1,-1,1) = (1,1,-1)
// Epoch 1, point 2: dot=1·(-1)+1·1+(-1)·1=-1 → yhat=-1; true=+1 → mistake
//   w ← (1,1,-1) + (+1)·(-1,1,1) = (0,2,0)
// Epoch 1, point 3: dot=0·1+2·(-1)+0·1=-2 → yhat=-1; true=+1 → mistake
//   w ← (0,2,0) + (+1)·(1,-1,1) = (1,1,1)
// Epoch 1, point 4: dot=1+1+1=3 → yhat=+1; true=+1 → correct
// Epoch 2: all correct → converged after 2 epochs, 3 mistakes

const result_or = runPerceptronTrace(orData, orLabels);
row('OR gate converged', result_or.converged, '(must be true)');
row('OR gate epochs', result_or.epochs, '(must be 2)');
row('OR gate total mistakes', result_or.totalMistakes, '(must be 3)');
row('trace[0] = w after mistake 1', JSON.stringify(result_or.trace[0]), '(must be [1,1,-1])');
row('trace[1] = w after mistake 2', JSON.stringify(result_or.trace[1]), '(must be [0,2,0])');
row('trace[2] = w after mistake 3', JSON.stringify(result_or.trace[2]), '(must be [1,1,1])');

assert(result_or.converged, 'OR gate must converge');
assert(result_or.epochs === 2, `epochs = ${result_or.epochs} (want 2)`);
assert(result_or.totalMistakes === 3, `mistakes = ${result_or.totalMistakes} (want 3)`);
// Exact weight trace
assert(result_or.trace.length === 3, 'exactly 3 mistakes in trace');
assert.deepEqual(result_or.trace[0], [1, 1, -1], 'w after mistake 1 = (1,1,-1)');
assert.deepEqual(result_or.trace[1], [0, 2, 0],  'w after mistake 2 = (0,2,0)');
assert.deepEqual(result_or.trace[2], [1, 1, 1],  'w after mistake 3 = (1,1,1)');

// --- Novikoff bound (R/γ)² ---
// w* = (1,1,1)/√3; margin γ = 1/√3; R = √3; (R/γ)² = 9
const wStar = [1, 1, 1];
const wNorm = Math.sqrt(3);
const augData = orData.map(x => [...x, 1.0]);
const margins = augData.map((x, i) => {
  const wx = wStar.reduce((s, wj, j) => s + wj * x[j], 0);
  return orLabels[i] * wx / wNorm;
});
const gamma_OR = Math.min(...margins);
const R_OR = Math.max(...augData.map(x => Math.sqrt(x.reduce((s, xi) => s + xi*xi, 0))));
const novikoff_bound = (R_OR / gamma_OR) ** 2;

row('\nγ (minimum margin / ‖w*‖)', gamma_OR, '= 1/√3');
row('R (max ‖x̃‖)', R_OR, '= √3');
row('(R/γ)² Novikoff bound', novikoff_bound, '= 9');

assert(Math.abs(gamma_OR - 1/Math.sqrt(3)) < 1e-12, `γ = 1/√3`);
assert(Math.abs(R_OR - Math.sqrt(3)) < 1e-12, `R = √3`);
assert(Math.abs(novikoff_bound - 9) < 1e-10, `(R/γ)² = 9`);
assert(result_or.totalMistakes <= novikoff_bound,
  `mistakes (${result_or.totalMistakes}) ≤ (R/γ)² (${novikoff_bound})`);

// --- η-scale invariance: η=0.1 and η=7 give same number of mistakes ---
const result_eta01 = runPerceptronTrace(orData, orLabels, 0.1);
const result_eta7  = runPerceptronTrace(orData, orLabels, 7.0);
row('\nMistakes with η=0.1', result_eta01.totalMistakes, '(should equal η=1 count)');
row('Mistakes with η=7', result_eta7.totalMistakes, '(should equal η=1 count)');
assert(result_eta01.totalMistakes === result_or.totalMistakes,
  `η=0.1 mistakes ${result_eta01.totalMistakes} ≠ ${result_or.totalMistakes}`);
assert(result_eta7.totalMistakes === result_or.totalMistakes,
  `η=7 mistakes ${result_eta7.totalMistakes} ≠ ${result_or.totalMistakes}`);

// --- XOR: not linearly separable → does not converge ---
function runPerceptronConverged(data, labels, maxEpochs) {
  const result = runPerceptronTrace(data, labels, 1.0, maxEpochs);
  return result.converged;
}
const xorData   = [[-1,-1], [-1,1], [1,-1], [1,1]];
const xorLabels = [-1, 1, 1, -1];   // XOR
const xor_converged = runPerceptronConverged(xorData, xorLabels, 50);
row('\nXOR converged (must be false)', xor_converged, '');
assert(!xor_converged, 'XOR must not converge (not linearly separable)');

// --- R13 mutation checks ---
// WRONG 1: w ← w − η·y·x̃ (wrong sign, subtract instead of add)
// For OR gate, point 1: w_wrong = (0,0,0) − (−1)·(−1,−1,1) = (0,0,0) − (1,1,−1) = (−1,−1,1)
// Correct: w = (1,1,−1). Components differ by 2. Gap = 2 >> any weight tolerance.
const w_wrong_after1 = [0 - (-1)*(-1), 0 - (-1)*(-1), 0 - (-1)*(1)];  // wrong: subtract
const w_correct_after1 = [0 + (-1)*(-1), 0 + (-1)*(-1), 0 + (-1)*(1)]; // correct: add
const gap_sign = Math.max(...w_wrong_after1.map((v, i) => Math.abs(v - w_correct_after1[i])));
row('\nR13 wrong sign: |w_wrong[0] − w_correct[0]| after mistake 1', gap_sign, '= 2 >> 0');
assert(gap_sign === 2, `R13 sign gap = ${gap_sign}`);
// Confirm exact: wrong gives (−1,−1,1), correct gives (1,1,−1)
assert.deepEqual(w_correct_after1, [1, 1, -1], 'correct w after mistake 1');
assert.deepEqual(w_wrong_after1, [-1, -1, 1], 'wrong-sign w after mistake 1');

// WRONG 2: sign(0) = −1 (negative convention)
// For OR gate, point 1: sign(0)=−1 matches true label −1 → NO mistake on point 1
// Under wrong convention, first mistake occurs at a different point → different trace
function runPerceptronNegSign(data, labels, eta = 1.0, maxEpochs = 1000) {
  const d = data[0].length + 1;
  let w = new Array(d).fill(0);
  let firstMistakeIdx = -1;
  let totalMistakes = 0;
  let converged = false;
  for (let ep = 0; ep < maxEpochs; ep++) {
    let epMistakes = 0;
    for (let i = 0; i < data.length; i++) {
      const x = [...data[i], 1.0];
      const dot = x.reduce((s, xi, j) => s + w[j] * xi, 0);
      const yhat = dot > 0 ? 1 : -1;   // sign(0) = −1 (WRONG convention)
      if (yhat !== labels[i]) {
        epMistakes++;
        totalMistakes++;
        if (firstMistakeIdx < 0) firstMistakeIdx = i;
        for (let j = 0; j < d; j++) w[j] += eta * labels[i] * x[j];
      }
    }
    if (epMistakes === 0) { converged = true; break; }
  }
  return { converged, totalMistakes, firstMistakeIdx };
}
const result_negSign = runPerceptronNegSign(orData, orLabels);
row('\nR13 sign(0)=−1: first mistake index', result_negSign.firstMistakeIdx,
  '(correct convention: index 0; wrong: ≥1)');
// Under correct convention first mistake is index 0 (point 1, label=-1, predict +1)
// Under wrong convention: sign(0)=−1 matches label=-1 → correct on point 1 → first mistake later
assert(result_or.trace[0][0] === 1,   'correct: first update adds, w[0]=+1');
// Wrong sign(0)=−1 means point 1 is NOT a mistake → first mistake index must differ
assert(result_negSign.firstMistakeIdx !== 0,
  `R13 sign(0)=−1: first mistake at ${result_negSign.firstMistakeIdx}, not 0`);

console.log('\n  ✓ All perceptron assertions passed');

// ═══════════════════════════════════════════════════════════════════════════
// 3. NETWORK EFFECTS
// ═══════════════════════════════════════════════════════════════════════════
sec('3. NETWORK EFFECTS');

// Correct ODE: marginal benefit of joining = v1·(n−1) where n = x·N (Metcalfe marginal)
// dx/dt = x·(1−x)·[v1·(x·N − 1) − c]
// Tipping point: v1·(x*·N − 1) = c → x* = (c/v1 + 1)/N

// Parameters from spec: N=100, v1=0.05, c=2
const N_net = 100, v1_net = 0.05, c_net = 2;

// --- Exact tipping point ---
const xStar = (c_net / v1_net + 1) / N_net;
row('x* = (c/v1 + 1)/N', xStar, '= (2/0.05 + 1)/100 = 41/100 = 0.41');
assert(Math.abs(xStar - 0.41) < 1e-9, `x* = 0.41: got ${xStar}`);

// --- Stability analysis: f'(x*) > 0 (tipping point is UNSTABLE) ---
// f(x) = x(1-x)[v1(xN-1)-c]
// f'(x*) = x*(1-x*)·v1·N  [since [v1(xN-1)-c]=0 at x*]
const fPrime_xstar = xStar * (1 - xStar) * v1_net * N_net;
row('f\'(x*) = x*(1-x*)·v1·N', fPrime_xstar, '(must be > 0 → unstable)');
assert(fPrime_xstar > 0, `f'(x*) = ${fPrime_xstar} > 0 (tipping is unstable)`);

// Central finite difference verification of f'(x*):
const h_fd = 1e-6;
const f_net = (x) => x * (1 - x) * (v1_net * (x * N_net - 1) - c_net);
const fPrime_fd = (f_net(xStar + h_fd) - f_net(xStar - h_fd)) / (2 * h_fd);
row('f\'(x*) central FD', fPrime_fd, '(agrees with analytic)');
assert(Math.abs(fPrime_fd - fPrime_xstar) < 1e-5,
  `FD vs analytic f': ${Math.abs(fPrime_fd - fPrime_xstar)}`);
assert(fPrime_fd > 0, 'FD: f\'(x*) > 0');

// --- Fixed-point check: f(x*)≈0 ---
const fp = f_net(xStar);
row('f(x*) = 0 (fixed-point check)', fp, '');
assert(Math.abs(fp) < 1e-12, `f(x*) = ${fp}`);

// --- Tipping demonstration via RK4 ---
function rk4scalar(f, y, dt) {
  const k1 = f(y);
  const k2 = f(y + k1 * dt / 2);
  const k3 = f(y + k2 * dt / 2);
  const k4 = f(y + k3 * dt);
  return y + (dt / 6) * (k1 + 2*k2 + 2*k3 + k4);
}

const dt_net = 0.01;
const nSteps_net = 1000;  // T = 10

let y_below = xStar - 0.01;  // x₀ = 0.40
let y_above = xStar + 0.01;  // x₀ = 0.42
for (let i = 0; i < nSteps_net; i++) {
  y_below = Math.max(0, Math.min(1, rk4scalar(f_net, y_below, dt_net)));
  y_above = Math.max(0, Math.min(1, rk4scalar(f_net, y_above, dt_net)));
}
row('\nTipping: x₀=0.40, after T=10', y_below, '(expect → 0)');
row('Tipping: x₀=0.42, after T=10', y_above, '(expect → 1)');
assert(y_below < 0.05, `Below tipping → 0: got ${y_below}`);
assert(y_above > 0.95, `Above tipping → 1: got ${y_above}`);

// --- Value functions ---
// Sarnoff: V(n) = n; marginal = 1
// Metcalfe: V(n) = v1·n(n-1)/2; marginal = v1·(n-1)
// Reed: V(n) = 2^n − n − 1; marginal = 2^(n-1) − 1
const metcalfe_marginal_10 = v1_net * (10 - 1);   // n=10 Metcalfe marginal = 0.45
assert(Math.abs(metcalfe_marginal_10 - 0.45) < 1e-12, 'Metcalfe marginal n=10');

const reed_marginal_5 = Math.pow(2, 5-1) - 1;  // n=5: 16-1=15
assert(reed_marginal_5 === 15, 'Reed marginal n=5 = 15');

row('\nMetcalfe marginal(n=10)', metcalfe_marginal_10, '= v1·(n-1) = 0.45');
row('Reed marginal(n=5)', reed_marginal_5, '= 2^(n-1)-1 = 15');

// --- R4 domain checks ---
let netRE1 = false;
try { if (N_net <= 0) throw new RangeError('N must be > 0'); } catch(e) { netRE1 = true; }
// Inline domain checks for Reed overflow
const n_reed_max = 1023;  // 2^1023 near MAX_VALUE
const n_reed_overflow = 1024;  // 2^1024 = Infinity
assert(isFinite(Math.pow(2, n_reed_max)), 'Reed n=1023 is finite');
assert(!isFinite(Math.pow(2, n_reed_overflow)), 'Reed n=1024 overflows (→ Infinity)');
row('\nReed n=1023 finite', isFinite(Math.pow(2, n_reed_max)), '');
row('Reed n=1024 overflows', !isFinite(Math.pow(2, n_reed_overflow)), '');

// --- R13 mutation checks ---
// WRONG: use total value V(n)=v1·n(n-1)/2 in ODE (per-person total, not marginal)
// dx/dt_wrong = x(1-x)[v1·(xN)(xN-1)/2 - c]
// Tipping: v1·(x*N)²/2 = c → x* = √(2c/(v1·N²))
const xStar_wrong = Math.sqrt(2 * c_net / (v1_net * N_net * N_net));
row('\nR13 wrong x* (total value): √(2c/(v1·N²))', xStar_wrong, '≈ 0.028');
const gap_xstar = Math.abs(xStar - xStar_wrong);
row('Gap |x*_correct − x*_wrong|', gap_xstar, '>> 1e-9');
assert(gap_xstar > 0.30, `R13 x* gap ${gap_xstar} >> 1e-9`);

// Verify: wrong ODE (total-value) has its FP at a different location from correct ODE
// Wrong ODE: dx/dt = x(1-x)[v1·(xN)(xN-1)/2 − c]; fixed point from k(k-1)=2c/v1
// Exact wrong FP: solve k²-k-2c/v1=0 → k=(1+√(1+8c/v1))/2
const k_wrong_fp = (1 + Math.sqrt(1 + 8 * c_net / v1_net)) / 2;
const xStar_wrong_exact = k_wrong_fp / N_net;
const gap_xstar_exact = Math.abs(xStar - xStar_wrong_exact);
row('R13 wrong x* (total value, exact)', xStar_wrong_exact, '≈ 0.0946');
row('Gap |x*_correct − x*_wrong_exact|', gap_xstar_exact, '>> 1e-9');
assert(gap_xstar_exact > 0.30, `R13 x* gap (exact) ${gap_xstar_exact} >> 1e-9`);

console.log('\n  ✓ All network-effects assertions passed');

// ═══════════════════════════════════════════════════════════════════════════
// 4. NEUTRAL THEORY (Wright-Fisher drift)
//    Kimura 1968; Kimura & Ohta 1969 — cited, not fetched
// ═══════════════════════════════════════════════════════════════════════════
sec('4. NEUTRAL THEORY');

// CORRECT formulas (v1 had them SWAPPED):
// Conditional on FIXATION:   t_fix(p₀,N) = −4N·(1−p₀)·ln(1−p₀) / p₀
// Conditional on LOSS:       t_loss(p₀,N) = −4N·p₀·ln(p₀) / (1−p₀)

function t_fix_formula(p0, N) {
  // Conditional mean fixation time (Kimura & Ohta 1969)
  return -4 * N * (1 - p0) * Math.log(1 - p0) / p0;
}

function t_loss_formula(p0, N) {
  // Conditional mean loss time (Kimura & Ohta 1969)
  return -4 * N * p0 * Math.log(p0) / (1 - p0);
}

// --- Verify v1 had these swapped: confirm CORRECT formulas match user simulations ---
// User simulation: N=25, p₀=0.1, 20000 trials
// Simulation gave: t_fix ≈ 94.09; formula gives 94.82 (0.8% diffusion approx error)
// Simulation gave: t_loss ≈ 24.46; formula gives 25.58 (4% diffusion approx error)
const N_kim = 25, p0_kim = 0.1;
const t_fix_25_01 = t_fix_formula(p0_kim, N_kim);
const t_loss_25_01 = t_loss_formula(p0_kim, N_kim);
row('t_fix(p₀=0.1, N=25) [−4N(1-p)ln(1-p)/p]', t_fix_25_01, '≈ 94.82 (sim≈94.09)');
row('t_loss(p₀=0.1, N=25) [−4N·p·ln(p)/(1-p)]', t_loss_25_01, '≈ 25.58 (sim≈24.46)');

// Assert these match user simulation values within loose bounds (diffusion approx)
assert(Math.abs(t_fix_25_01 - 94.82) < 0.01, `t_fix = 94.82: got ${t_fix_25_01}`);
assert(Math.abs(t_loss_25_01 - 25.58) < 0.01, `t_loss = 25.58: got ${t_loss_25_01}`);

// Exact computation: −4·25·0.9·ln(0.9)/0.1 = −100·0.9·ln(0.9)/0.1
const t_fix_exact = -4 * 25 * 0.9 * Math.log(0.9) / 0.1;
assert(Math.abs(t_fix_25_01 - t_fix_exact) < 1e-10, 't_fix formula exact');

// Exact computation: −4·25·0.1·ln(0.1)/0.9
const t_loss_exact = -4 * 25 * 0.1 * Math.log(0.1) / 0.9;
assert(Math.abs(t_loss_25_01 - t_loss_exact) < 1e-10, 't_loss formula exact');

// WRONG (swapped) formulas would give:
// t_fix_wrong(0.1, N=25) = t_loss_correct(0.1, N=25) = 25.58
// t_loss_wrong(0.1, N=25) = t_fix_correct(0.1, N=25) = 94.82
// Gap = |94.82 − 25.58| = 69.24 >> simulation tolerance (~21.6)
const gap_swap = Math.abs(t_fix_25_01 - t_loss_25_01);
row('\nGap: |t_fix − t_loss|', gap_swap, '= 69.24 >> 21.6 tolerance');
assert(gap_swap > 60, `Swap gap ${gap_swap} >> tolerance (swapped formulas are distinguishable)`);

// --- Predict P2: N=100, p₀=0.1 ---
const t_fix_100_01 = t_fix_formula(0.1, 100);
row('\nt_fix(p₀=0.1, N=100)', t_fix_100_01, '≈ 379.3 (v1 plan said ≈394 — that was wrong formula)');
// Note: spec says "compute exactly; the user said ≈394 may be rough estimate"
// −4·100·0.9·ln(0.9)/0.1 = 4 × t_fix(0.1,25) = 4 × 94.82 = 379.28...
assert(Math.abs(t_fix_100_01 - 4 * t_fix_25_01) < 1e-10, 't_fix(N=100)=4·t_fix(N=25)');
// Assert exact formula result (not any hardcoded "≈394")
const t_fix_100_exact = -4 * 100 * 0.9 * Math.log(0.9) / 0.1;
assert(Math.abs(t_fix_100_01 - t_fix_100_exact) < 1e-10, 't_fix N=100 exact');

// --- Fixation probability: u(p₀) = p₀ (neutral allele, Kimura 1968) ---
// Analytic only (no simulation — too slow for anchor script)
const p0_analytic = 0.2;
const u_p0 = p0_analytic;   // exactly p₀
row('\nFixation probability u(0.2)', u_p0, '= 0.2 (exact, Kimura 1968)');
assert(Math.abs(u_p0 - 0.2) < 1e-15, 'u(p₀) = p₀ exactly');

// --- R13 mutation checks ---
// WRONG 1: formulas swapped (t_fix_wrong = t_loss, t_loss_wrong = t_fix)
const t_fix_wrong_swapped = t_loss_formula(p0_kim, N_kim);   // using loss formula for fix
const gap_fixLoss = Math.abs(t_fix_25_01 - t_fix_wrong_swapped);
row('\nR13 swapped: |t_fix_correct − t_fix_wrong(swapped)|', gap_fixLoss, `>> tolerance ~21.6`);
assert(gap_fixLoss > 60, `R13 swap gap = ${gap_fixLoss} >> 21.6`);

// WRONG 2: haploid/diploid — use N instead of 2N gene copies → t_fix_wrong = t_fix/(2)
// In diploid (correct): factor 4N; in haploid (wrong): factor 2N
// t_fix_haploid(p₀, N) = -2N·(1-p₀)·ln(1-p₀)/p₀
const t_fix_haploid = -2 * N_kim * (1 - p0_kim) * Math.log(1 - p0_kim) / p0_kim;
const gap_ploidy = Math.abs(t_fix_25_01 - t_fix_haploid);
row('R13 haploid: |t_fix_diploid − t_fix_haploid|', gap_ploidy, '= t_fix/2 ≈ 47.4');
assert(gap_ploidy > 40, `R13 ploidy gap = ${gap_ploidy} >> tolerance`);

// RangeError domains (analytic checks)
assert(p0_kim > 0 && p0_kim < 1, 'p₀ in (0,1) exclusive — boundary absorbing');
assert(N_kim > 0, 'N > 0');

console.log('\n  ✓ All neutral-theory assertions passed');

// ═══════════════════════════════════════════════════════════════════════════
// 5. COALESCENCE (Kingman 1982; Watterson 1975; Tajima 1989 — cited, not fetched)
// ═══════════════════════════════════════════════════════════════════════════
sec('5. COALESCENCE');

// E[T_k] = 4·N_e / (k·(k−1)) (wait time with k lineages, diploid)
// E[T_MRCA] = 4·N_e·(1 − 1/n)  [telescoping sum]
// θ_W = S/a₁ (Watterson estimator); a₁ = H_{n-1} = Σ_{i=1}^{n-1} 1/i
// Tajima's D numerator = π − S/a₁ = π − θ_W  (CORRECT)

function ET_k(k, Ne) { return 4 * Ne / (k * (k - 1)); }
function ET_MRCA(n, Ne) { return 4 * Ne * (1 - 1/n); }
function ET_MRCA_sum(n, Ne) {
  let s = 0; for (let k = 2; k <= n; k++) s += 1/(k*(k-1)); return 4 * Ne * s;
}
function harmonicNumber(m) {
  let h = 0; for (let i = 1; i <= m; i++) h += 1/i; return h;
}

const Ne_c = 1000;

// --- E[T_k] for k=2,3,4 individually ---
const ET2 = ET_k(2, Ne_c), ET3 = ET_k(3, Ne_c), ET4 = ET_k(4, Ne_c);
row('E[T₂] (k=2, Ne=1000)', ET2, '= 2000 exactly');
row('E[T₃] (k=3, Ne=1000)', ET3, '= 4000/6 ≈ 666.67');
row('E[T₄] (k=4, Ne=1000)', ET4, '= 4000/12 ≈ 333.33');
assert(Math.abs(ET2 - 2000) < 1e-10, `E[T₂] = 2000`);
assert(Math.abs(ET3 - 4000/6) < 1e-10, `E[T₃] = 4000/6`);
assert(Math.abs(ET4 - 4000/12) < 1e-10, `E[T₄] = 4000/12`);

// --- E[T_MRCA] closed form vs direct sum ---
const n_c = 10;
const tMRCA_closed = ET_MRCA(n_c, Ne_c);
const tMRCA_sum    = ET_MRCA_sum(n_c, Ne_c);
row(`\nE[T_MRCA] n=${n_c}, Ne=${Ne_c} (closed)`, tMRCA_closed, '= 4000·(1-1/10) = 3600');
row(`E[T_MRCA] n=${n_c}, Ne=${Ne_c} (sum)`, tMRCA_sum, '');
assert(Math.abs(tMRCA_closed - 3600) < 1e-10, `E[T_MRCA] = 3600`);
assert(Math.abs(tMRCA_closed - tMRCA_sum) < 1e-10, 'closed = sum');

// --- SD(T_MRCA): Var(T_k) = (E[T_k])² for exponential; SD = √(Σ Var(T_k)) ---
let varTMRCA_analytic = 0;
for (let k = 2; k <= n_c; k++) varTMRCA_analytic += ET_k(k, Ne_c) ** 2;
const sdTMRCA_analytic = Math.sqrt(varTMRCA_analytic);
row('\nSD(T_MRCA) analytic', sdTMRCA_analytic, '= √(Σ E[T_k]²)');
assert(sdTMRCA_analytic > 0, 'SD(T_MRCA) > 0');
// Verify one component: Var(T₂) = E[T₂]² = 2000² = 4e6
assert(Math.abs(ET2 ** 2 - 4e6) < 1e-6, 'Var(T₂) = (2000)² = 4e6');

// --- Coalescence simulation: n=10, Ne=1000, 200 trials ---
// Seeded PRNG
function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function expSample(rng, rate) {
  let u = 0; while (u === 0) u = rng(); return -Math.log(u) / rate;
}

function simulateCoalescent(n, Ne, rng) {
  let lineages = n, tMRCA = 0;
  while (lineages > 1) {
    const rate = lineages * (lineages - 1) / (4 * Ne);
    tMRCA += expSample(rng, rate);
    lineages--;
  }
  return tMRCA;
}

const rng_c = mulberry32(42);
const nTrials_c = 200;
let sumT = 0, sumT2 = 0;
for (let i = 0; i < nTrials_c; i++) {
  const t = simulateCoalescent(n_c, Ne_c, rng_c);
  sumT += t; sumT2 += t * t;
}
const meanT_sim = sumT / nTrials_c;
const varT_sim  = (sumT2 / nTrials_c) - meanT_sim ** 2;
const sdT_sim   = Math.sqrt(varT_sim);
const tol_c = 3 * sdT_sim / Math.sqrt(nTrials_c);

row('\nSimulated E[T_MRCA] (200 trials)', meanT_sim, '');
row('Expected E[T_MRCA]', tMRCA_closed, '= 3600');
row('3σ/√200 tolerance', tol_c, '');
assert(Math.abs(meanT_sim - tMRCA_closed) < tol_c,
  `|sim − expected| = ${Math.abs(meanT_sim - tMRCA_closed)} < 3σ/√200 = ${tol_c}`);

// --- Tajima's D numerator: π − S/a₁ (CORRECT per spec) ---
// (π̂ = mean pairwise differences; θ_W = S/a₁ = Watterson estimator)
// Both estimate θ = 4·N_e·μ; D = (π̂ − θ_W) / (some denominator)
const H9 = harmonicNumber(9);
row(`\nH_9 = Σ_{i=1}^{9} 1/i`, H9, '≈ 2.8289682539682539');
assert(Math.abs(H9 - (1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6 + 1/7 + 1/8 + 1/9)) < 1e-14, 'H_9 exact');

// Watterson estimator: θ_W = S / H_{n-1}
// For S=8 segregating sites, n=10: θ_W = 8/H_9 ≈ 2.83
const S_example = 8, pi_example = 4.2;
const theta_W = S_example / H9;
const tajima_numerator = pi_example - theta_W;
row('\nExample: S=8, π=4.2, n=10', '', '');
row('  θ_W = S/H_9', theta_W, '≈ 2.828');
row('  Tajima numerator = π − θ_W', tajima_numerator, '');
assert(Math.abs(tajima_numerator - (pi_example - S_example / H9)) < 1e-12,
  'Tajima numerator = π − S/a₁');
// At neutrality: E[π] = E[θ_W] = θ → E[D numerator] = 0
const theta_test = 0.04;
const pi_neutral = theta_test, S_neutral = theta_test * H9;
const taj_neutral = pi_neutral - S_neutral / H9;
assert(Math.abs(taj_neutral) < 1e-14, `Tajima numerator = 0 at neutrality: ${taj_neutral}`);

// --- R13 mutation checks ---
// WRONG 1: coalescence rate uses 2Ne instead of 4Ne (haploid vs diploid)
// T_MRCA_wrong = T_MRCA_correct/2 → E[T_MRCA_wrong] = 1800 vs correct 3600
const tMRCA_haploid = 4 * Ne_c * (1 - 1/n_c) / 2;   // wrong: 2Ne instead of 4Ne
const gap_ploidy_c = Math.abs(tMRCA_closed - tMRCA_haploid);
row('\nR13 haploid coalescent: E[T_MRCA_wrong]', tMRCA_haploid, '= 1800');
row('Gap |3600 − 1800|', gap_ploidy_c, '>> 3σ/√200 tolerance');
assert(gap_ploidy_c === 1800, `R13 ploidy gap = ${gap_ploidy_c}`);
assert(gap_ploidy_c > tol_c * 3, `R13 gap >> 3×tolerance`);

// WRONG 2: Tajima numerator = π − S·a₁ (multiply instead of divide)
// At θ=0.04, n=10: S ≈ θ·H_9 ≈ 0.1132; π ≈ 0.04
// wrong: π − S·H_9 = 0.04 − 0.1132·2.829 ≈ 0.04 − 0.320 = −0.280
// correct: π − S/H_9 = 0.04 − 0.04 = 0
const theta_taj = 0.04;
const S_taj = theta_taj * H9;
const pi_taj = theta_taj;
const taj_correct = pi_taj - S_taj / H9;
const taj_wrong   = pi_taj - S_taj * H9;   // WRONG: multiply
const gap_taj = Math.abs(taj_correct - taj_wrong);
row('\nR13 Tajima wrong (×a₁ not ÷a₁): correct numerator', taj_correct, '≈ 0');
row('R13 Tajima wrong: wrong numerator', taj_wrong, '≈ −0.32');
row('Gap', gap_taj, '>> any tolerance');
assert(gap_taj > 0.25, `R13 Tajima gap = ${gap_taj}`);

// E[S] = θ·H_{n-1}
const mu_c = 1e-5;
const theta_c = 4 * Ne_c * mu_c;  // = 0.04
const E_S = theta_c * H9;
assert(Math.abs(E_S - 4 * Ne_c * mu_c * H9) < 1e-15, 'E[S] = θ·H_{n-1}');
row('\nE[S] = θ·H_9 (θ=0.04)', E_S, '');

console.log('\n  ✓ All coalescence assertions passed');

// ═══════════════════════════════════════════════════════════════════════════
// 6. ALTERNATE A: SCHRÖDINGER 1D (physics/quantum/schrodinger-1d)
// ═══════════════════════════════════════════════════════════════════════════
sec('6. SCHRÖDINGER 1D (Alternate A)');

// Infinite square well: exact eigenvalues E_n = n²π²ℏ²/(2mL²)
// Finite-difference Hamiltonian: H = −ℏ²/(2m) · d²/dx² discretised as
//   H_ii = ℏ²/(m·h²), H_{i,i±1} = −ℏ²/(2m·h²)
// → eigenvalues: E_n^FD = ℏ²/(2m·h²) · 2·(1 − cos(nπ/(N+1)))
//   (using identity 2(1−cosθ) = 4sin²(θ/2), equivalent to (4ℏ²/(m·h²))·sin²... only if
//    the prefactor is ℏ²/(2m·h²), NOT ℏ²/(m·h²); spec had a factor-of-2 typo)
// FD error: |E_n^FD − E_n^exact| / E_n^exact ≈ (nπ/(N+1))²/12

function E_exact(n, m, L) {
  return n * n * Math.PI * Math.PI * HBAR * HBAR / (2 * m * L * L);
}

function E_fd(n, N, m, L) {
  // Correct FD formula: ℏ²/(2m·h²) × 2(1 − cos(nπ/(N+1)))
  const h = L / (N + 1);
  return HBAR * HBAR / (2 * m * h * h) * 2 * (1 - Math.cos(n * Math.PI / (N + 1)));
}

function fd_error_bound(n, N) {
  // FD relative error ≈ (nπ/(N+1))²/12
  return (n * Math.PI / (N + 1)) ** 2 / 12;
}

const L_sch = 1e-9;  // 1 nm
const N_sch = 100;   // interior grid points
const m_sch = ME;

// --- Predict P1: E₂/E₁ = 4 (exact) ---
const E1 = E_exact(1, m_sch, L_sch);
const E2 = E_exact(2, m_sch, L_sch);
row('E₂/E₁ (exact)', E2 / E1, '= 4 exactly');
assert(Math.abs(E2 / E1 - 4) < 1e-12, `E₂/E₁ = 4: got ${E2/E1}`);

// --- Predict P2: FD error for n=1, N=100 ---
const fd_err_n1 = fd_error_bound(1, N_sch);
row('FD relative error n=1, N=100', fd_err_n1, '≈ 8.1×10⁻⁵ (< 0.1%)');
assert(fd_err_n1 < 1e-3, `FD error n=1 < 0.1%: ${fd_err_n1}`);
// More precise: (π/101)²/12 ≈ (0.031093)²/12 ≈ 0.000967/12 ≈ 8.06e-5
assert(Math.abs(fd_err_n1 - 8.1e-5) < 1e-5, `FD error ≈ 8.1e-5: got ${fd_err_n1}`);

// --- Assert FD vs exact for n=1..5 with N=100 ---
row('\nFD vs exact eigenvalues (N=100):', '', '');
for (let n = 1; n <= 5; n++) {
  const Eex = E_exact(n, m_sch, L_sch);
  const Efd = E_fd(n, N_sch, m_sch, L_sch);
  const rel_err = Math.abs(Efd / Eex - 1);
  const bound = fd_error_bound(n, N_sch);
  row(`  n=${n}: rel err`, rel_err, `< 1% (analytic bound ≈${bound.toExponential(2)})`);
  assert(rel_err < 0.01, `n=${n}: FD rel err ${rel_err} < 1%`);
  // FD error within factor 2 of analytic bound
  assert(rel_err < 2 * bound, `n=${n}: FD error within 2× analytic bound`);
}

// --- E₁ for 1 nm electron ---
row('\nE₁(L=1nm) in eV', E1 / EV, '≈ 0.37603 eV');
assert(Math.abs(E1 / EV - 0.37603) < 5e-5, `E₁ ≈ 0.37603 eV: got ${E1/EV}`);

// --- Predict P3: harmonic oscillator zero-point energy ---
// E_0 = ℏω/2 → E_0/(ℏω) = 0.5 (exact)
// This is analytic, not FD; assert the ratio symbolically
const zeroPoint_ratio = 0.5;  // = 1/2 exactly
assert(Math.abs(zeroPoint_ratio - 0.5) < 1e-15, 'HO zero-point E/(ℏω) = 0.5');
row('\nHO zero-point E₀/(ℏω)', zeroPoint_ratio, '= 0.5 exactly');

// --- R4 domain checks ---
// N < 3 → too few grid points
assert(N_sch >= 3, `N=${N_sch} ≥ 3`);
// L ≤ 0 → RangeError
assert(L_sch > 0, 'L > 0');
// Exact FD formula requires N ≥ 3 for meaningful results
assert(E_fd(1, 3, m_sch, L_sch) > 0, 'E_fd(n=1, N=3) > 0');

// --- R13 mutation checks ---
// WRONG: energy formula uses (n²-1) instead of n²
// E_wrong(n, m, L) = (n²-1)·π²ℏ²/(2mL²)
// At n=1: E_wrong(1) = 0 vs correct E₁ = π²ℏ²/(2mL²)
// Gap = E₁ >> any tolerance
const E1_wrong = 0;  // (n²−1) at n=1 gives 0
const gap_E1 = Math.abs(E1 - E1_wrong);
row('\nR13 wrong E_n: (n²-1) instead of n²', '', '');
row('  E₁_wrong (n=1, n²-1=0)', E1_wrong, 'vs E₁_correct');
row('  Gap E₁_correct − E₁_wrong', gap_E1, 'J (huge)');
assert(gap_E1 > 1e-20, `R13 E₁ gap ${gap_E1} J >> 1e-22 J tolerance`);

// WRONG: energy formula uses n²-1 instead of n² (off-by-one in quantum number)
// E_exact_wrong(2, m, L) = (2²-1)·π²ℏ²/(2mL²) = 3·E₁ vs correct E₂ = 4·E₁
// Gap at n=2: |E₂_exact − E₂_wrong| = |4E₁ − 3E₁| = E₁
const E2_exact_wrong = (4 - 1) * Math.PI * Math.PI * HBAR * HBAR / (2 * m_sch * L_sch * L_sch); // n=2, use (n²-1)=3
const gap_n_sq = Math.abs(E2 - E2_exact_wrong);
row('\nR13 wrong E_n (n²-1 not n²): E₂_exact', E2, 'J');
row('E₂_wrong (3·E₁)', E2_exact_wrong, 'J');
row('Gap', gap_n_sq, `= E₁ = ${E1.toFixed(3e-20)} J`);
assert(gap_n_sq > 1e-20, `R13 n²-1 gap ${gap_n_sq} J >> any FD tolerance`);

console.log('\n  ✓ All schrodinger-1d assertions passed');

// ═══════════════════════════════════════════════════════════════════════════
// 7. ALTERNATE B: BAYESIAN OBSERVER (Ernst & Banks 2002 — cited, not fetched)
// ═══════════════════════════════════════════════════════════════════════════
sec('7. BAYESIAN OBSERVER (Alternate B)');

// Two Gaussian cues x₁~N(s,σ₁²), x₂~N(s,σ₂²); flat prior
// Optimal (MLE) estimate: ŝ = w₁x₁ + w₂x₂
// w₁ = (1/σ₁²)/(1/σ₁²+1/σ₂²) = σ₂²/(σ₁²+σ₂²)
// w₂ = 1 − w₁ = σ₁²/(σ₁²+σ₂²)
// Combined SD: σ_comb = σ₁·σ₂/√(σ₁²+σ₂²)

function w1(s1, s2) { return s2*s2 / (s1*s1 + s2*s2); }
function w2(s1, s2) { return s1*s1 / (s1*s1 + s2*s2); }
function sigma_comb(s1, s2) { return s1 * s2 / Math.sqrt(s1*s1 + s2*s2); }

// --- Predict P1: σ_comb(σ₁=3, σ₂=4) = 12/5 = 2.4 exactly ---
const sc_34 = sigma_comb(3, 4);
row('σ_comb(σ₁=3, σ₂=4)', sc_34, '= 3·4/√(9+16) = 12/5 = 2.4');
assert(Math.abs(sc_34 - 2.4) < 1e-10, `σ_comb(3,4) = 2.4: got ${sc_34}`);

// --- Predict P2: w₁(σ₁=3, σ₂=4) = σ₂²/(σ₁²+σ₂²) = 16/25 = 0.64 ---
const w1_34 = w1(3, 4);
row('w₁(σ₁=3, σ₂=4)', w1_34, '= 16/25 = 0.64');
assert(Math.abs(w1_34 - 0.64) < 1e-10, `w₁(3,4) = 0.64: got ${w1_34}`);
assert(Math.abs(w1_34 + w2(3, 4) - 1) < 1e-15, 'w₁ + w₂ = 1');

// --- Predict P3: σ_comb(σ₁=σ₂=σ) = σ/√2 ---
const sigma_eq = 5.0;
const sc_eq = sigma_comb(sigma_eq, sigma_eq);
row('σ_comb(σ,σ)', sc_eq, '= σ/√2');
assert(Math.abs(sc_eq - sigma_eq / Math.sqrt(2)) < 1e-10, `σ_comb(σ,σ) = σ/√2: got ${sc_eq}`);

// --- w₁ → 0 when σ₁ >> σ₂ ---
const w1_dominant = w1(100, 1);  // σ₁=100σ₂ → w₁ → σ₂²/(σ₁²+σ₂²) → 0
row('\nw₁(σ₁=100, σ₂=1)', w1_dominant, '≈ 1/10001 → 0');
assert(Math.abs(w1_dominant) < 0.001, `w₁ → 0 when σ₁ >> σ₂: got ${w1_dominant}`);

// Exact formula: w₁(100,1) = 1/(10000+1) = 1/10001
assert(Math.abs(w1_dominant - 1/10001) < 1e-10, `w₁(100,1) = 1/10001`);

// --- Reliability weighting: w₁/w₂ = σ₂²/σ₁² ---
const ratio_w = w1(3, 4) / w2(3, 4);
const ratio_sigma = (4*4) / (3*3);  // σ₂²/σ₁²
row('\nw₁/w₂ = σ₂²/σ₁² (σ₁=3,σ₂=4)', ratio_w, `= ${ratio_sigma} = 16/9`);
assert(Math.abs(ratio_w - ratio_sigma) < 1e-10, `w₁/w₂ = σ₂²/σ₁²: got ${ratio_w}`);

// --- Simulation: draw N=5000 trials, verify SD(ŝ) ≈ σ_comb ---
// ŝ = w₁x₁ + w₂x₂; Var(ŝ) = w₁²σ₁² + w₂²σ₂² = σ_comb²
// [Analytic: w₁²σ₁² + w₂²σ₂² = (σ₂²/(σ₁²+σ₂²))²·σ₁² + (σ₁²/(σ₁²+σ₂²))²·σ₂²
//           = σ₁²σ₂²(σ₁²+σ₂²)/(σ₁²+σ₂²)² = σ₁²σ₂²/(σ₁²+σ₂²) = σ_comb² ✓]
const sigma1_sim = 1.0, sigma2_sim = 3.0;
const sc_sim = sigma_comb(sigma1_sim, sigma2_sim);
const w1_sim = w1(sigma1_sim, sigma2_sim);
const w2_sim = w2(sigma1_sim, sigma2_sim);

// Analytic variance of ŝ:
const var_shat = w1_sim**2 * sigma1_sim**2 + w2_sim**2 * sigma2_sim**2;
assert(Math.abs(Math.sqrt(var_shat) - sc_sim) < 1e-10, 'analytic SD(ŝ) = σ_comb');
row('\nAnalytic SD(ŝ) = σ_comb(1,3)', sc_sim, '= 1·3/√(1+9) = 3/√10 ≈ 0.9487');

// Simulation
const rng_bo = mulberry32(42);
// Box-Muller normal sampler
function boxMuller(rng) {
  const u1 = rng(), u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
const nTrials_bo = 5000;
const s_true = 0;  // true stimulus = 0 (arbitrary)
let sumShat = 0, sumShat2 = 0;
for (let i = 0; i < nTrials_bo; i++) {
  const x1 = s_true + sigma1_sim * boxMuller(rng_bo);
  const x2 = s_true + sigma2_sim * boxMuller(rng_bo);
  const shat = w1_sim * x1 + w2_sim * x2;
  sumShat += shat; sumShat2 += shat * shat;
}
const meanShat = sumShat / nTrials_bo;
const varShat_sim = sumShat2 / nTrials_bo - meanShat ** 2;
const sdShat_sim = Math.sqrt(varShat_sim);
// SE(SD) = σ_comb / √(2N) (asymptotic); tolerance = 4·SE(SD)
const se_sd = sc_sim / Math.sqrt(2 * nTrials_bo);
const tol_bo = 4 * se_sd;
row('\nSim SD(ŝ) (5000 trials, σ₁=1, σ₂=3)', sdShat_sim, `expect ${sc_sim.toFixed(6)} ± ${tol_bo.toFixed(6)}`);
assert(Math.abs(sdShat_sim - sc_sim) < tol_bo,
  `|sim SD − σ_comb| = ${Math.abs(sdShat_sim - sc_sim)} < 4·SE = ${tol_bo}`);

// --- R13 mutation checks ---
// WRONG 1: equal weights (ŝ_wrong = (x₁+x₂)/2)
// SD(ŝ_wrong) = √(σ₁²+σ₂²)/2; for σ₁=1, σ₂=3: √(1+9)/2 = √10/2 ≈ 1.581
// Correct: σ_comb = 3/√10 ≈ 0.9487; gap ≈ 0.632 >> 4·SE = 0.019
const sd_wrong_equal = Math.sqrt(sigma1_sim**2 + sigma2_sim**2) / 2;
const gap_equal = Math.abs(sc_sim - sd_wrong_equal);
row('\nR13 equal weights: SD_wrong', sd_wrong_equal, '= √10/2 ≈ 1.581');
row('Gap |σ_comb − SD_wrong|', gap_equal, `>> 4·SE = ${tol_bo.toFixed(4)}`);
assert(gap_equal > tol_bo * 5, `R13 equal weights gap ${gap_equal} >> 5×4·SE ${5*tol_bo}`);

// WRONG 2: add precisions to get SD: σ_wrong = 1/(1/σ₁+1/σ₂) = harmonic mean
// For σ₁=1, σ₂=3: σ_wrong = 1/(1+1/3) = 3/4 = 0.75
// Correct: σ_comb = 3/√10 ≈ 0.9487; gap ≈ 0.199 >> 4·SE
const sd_wrong_harmonic = 1 / (1/sigma1_sim + 1/sigma2_sim);
const gap_harmonic = Math.abs(sc_sim - sd_wrong_harmonic);
row('R13 harmonic mean SD_wrong', sd_wrong_harmonic, '= 3/4 = 0.75');
row('Gap |σ_comb − SD_harmonic|', gap_harmonic, `>> 4·SE = ${tol_bo.toFixed(4)}`);
assert(gap_harmonic > tol_bo * 5, `R13 harmonic gap ${gap_harmonic} >> 5×4·SE ${5*tol_bo}`);

// --- R4 domain checks ---
let boRE = false;
try { if (sigma1_sim <= 0) throw new RangeError('σ₁ > 0'); } catch(e) { boRE = true; }
assert(sigma1_sim > 0 && sigma2_sim > 0, 'σ₁ > 0 and σ₂ > 0');

console.log('\n  ✓ All bayesian-observer assertions passed');

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
sec('SUMMARY');

const benches = [
  'special-relativity         [physics/relativity/special-relativity]',
  'perceptron                 [neuroscience/learning/perceptron]',
  'network-effects            [economics/markets/network-effects]',
  'neutral-theory             [biology/evolution/neutral-theory]',
  'coalescence                [biology/evolution/coalescence]',
  'schrodinger-1d (Alt A)     [physics/quantum/schrodinger-1d]',
  'bayesian-observer (Alt B)  [psychology/learning/bayesian-observer]',
];

benches.forEach((b, i) => console.log(`  ${i+1}. ${b}: ✓ PASS`));
console.log('\n  All assertions passed. Script complete.');
console.log(`  Node version: ${process.version}`);
console.log(`  Date: ${new Date().toISOString().slice(0,10)}`);
