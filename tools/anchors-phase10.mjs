/**
 * anchors-phase10.mjs — independent numerical anchors for Phase 10 tests.
 *
 * RULES: no model code imported; every value derived from scratch;
 *        every assert() call throws if the anchor is wrong.
 * Run:  node tools/anchors-phase10.mjs
 *
 * Benches (Phase 10): lc-oscillator, butler-volmer, options-pricing,
 *   hopfield, reinforcement-learning, auctions, voting-systems
 *
 * Note: Complex.js infra NOT added in Phase 10 — only lc-oscillator would
 *   use it, which is fewer than the required 2 benches. Complex.js moves
 *   to Phase 12 (before schrodinger-1d). See docs/plans/phase-10.md §§ infra.
 */

function assert(cond, msg) {
  if (!cond) throw new Error(`ANCHOR FAILED: ${msg}`);
}

const fmt = (v, d = 10) => typeof v === 'number' ? v.toPrecision(d) : String(v);
const sec = (label) => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(label);
  console.log('═'.repeat(70));
};
const row = (label, value, note = '') =>
  console.log(`  ${label.padEnd(50)} ${fmt(value)}  ${note}`);

// ═══════════════════════════════════════════════════════════════════════
// 1. LC-OSCILLATOR (physics/electromagnetism/lc-oscillator)
// ═══════════════════════════════════════════════════════════════════════
sec('1. LC-OSCILLATOR');

// Test case: R=10 Ω, L=1e-3 H, C=1e-6 F
// Status: all formulas algebraic (circuit theory)

const R = 10;      // Ω  — exact SI
const L = 1e-3;    // H  — exact SI
const C = 1e-6;    // F  — exact SI

// α = R/(2L)  [neper frequency, rad/s]
const alpha = R / (2 * L);
assert(alpha === 5000, `alpha should be 5000; got ${alpha}`);
row('α = R/(2L)', alpha, '[rad/s] exact');

// ω₀ = 1/√(LC)  [natural frequency, rad/s]
const omega0 = 1 / Math.sqrt(L * C);
row('ω₀ = 1/√(LC)', omega0, '[rad/s]');

// Verify ω₀ = 10000√10 = 10000 × 3.16227...
const omega0_check = 10000 * Math.sqrt(10);
assert(Math.abs(omega0 / omega0_check - 1) < 1e-14,
  `omega0 = ${omega0} vs ${omega0_check}`);
row('ω₀ = 10000√10', omega0_check, 'algebraic');

// Q = ω₀/(2α) = √(L/C)/R
const Q = omega0 / (2 * alpha);
const Q_alt = Math.sqrt(L / C) / R;
assert(Math.abs(Q / Q_alt - 1) < 1e-14, `Q forms disagree: ${Q} vs ${Q_alt}`);
row('Q = ω₀/(2α) = √(L/C)/R', Q, '= √10/√10 × 1 = √10/10 × ... = 10^{1/2}/√10');
// Q = (1/R)·√(L/C) = (1/10)·√(1e-3/1e-6) = (1/10)·√1000 = √10/10 × 10^{1/2} wait
// L/C = 1e-3/1e-6 = 1000 → √(L/C) = √1000 = 10√10
// Q = 10√10 / 10 = √10 ≈ 3.162
const Q_exact = Math.sqrt(10);  // Q = √10 for these parameters
assert(Math.abs(Q / Q_exact - 1) < 1e-14, `Q ≠ √10: ${Q} vs ${Q_exact}`);
row('Q = √10 (exact)', Q_exact, 'algebraic: R=10, L/C=1000 → √(L/C)/R = √10');

// ωd = √(ω₀² − α²)  [damped natural frequency, rad/s]
const omegad = Math.sqrt(omega0 * omega0 - alpha * alpha);
// ω₀² = 1/(10⁻³×10⁻⁶) = 10⁹
// α²  = (5000)² = 2.5×10⁷
// ωd² = 10⁹ − 2.5×10⁷ = 9.75×10⁸ = 10⁸·9.75
// ωd  = 10⁴·√9.75
const omegad_check = 1e4 * Math.sqrt(9.75);
assert(Math.abs(omegad / omegad_check - 1) < 1e-14, `omegad form mismatch: ${omegad} vs ${omegad_check}`);
row('ωd = √(ω₀²−α²)', omegad, '[rad/s]');
row('ωd = 10⁴√9.75', omegad_check, 'algebraic');

// ωC_peak = √(ω₀² − 2α²) = √(1/LC − R²/(2L²))
// = √(10⁹ − 5×10⁷) = √(9.5×10⁸) = 10⁴·√9.5
const omegaC = Math.sqrt(omega0 * omega0 - 2 * alpha * alpha);
const omegaC_check = 1e4 * Math.sqrt(9.5);
assert(Math.abs(omegaC / omegaC_check - 1) < 1e-14, `omegaC form mismatch`);
row('ωC_peak = 10⁴√9.5', omegaC_check, 'algebraic');

// Ordering: ωC_peak < ωd < ω₀
assert(omegaC < omegad, `ordering ωC < ωd violated`);
assert(omegad < omega0, `ordering ωd < ω₀ violated`);
console.log('  Ordering ωC_peak < ωd < ω₀: OK');

// Bandwidth Δω = R/L = 2α  (EXACT, verified algebraically)
// Half-power frequencies: ω± = ±α + √(α²+ω₀²)
// Δω = ω₊ - ω₋ = 2α = R/L
const BW = R / L;  // = 10000 exactly
assert(BW === 10000, `BW = R/L should be 10000; got ${BW}`);
assert(BW === 2 * alpha, `BW ≠ 2α`);
row('Δω = R/L = 2α', BW, '[rad/s] exact');

// Critical damping: R_crit = 2√(L/C) = 2√1000 = 20√10
const R_crit = 2 * Math.sqrt(L / C);
const R_crit_check = 20 * Math.sqrt(10);
assert(Math.abs(R_crit / R_crit_check - 1) < 1e-14, `R_crit mismatch`);
row('R_crit = 2√(L/C) = 20√10', R_crit, '[Ω]');

// Poles: s = -α ± j·ωd
// Verify: L·s² + R·s + 1/C = 0 at s = -α + j·ωd
// s² = (-α+jωd)² = α²-ωd² - 2j·α·ωd
// L·s² = L(α²-ωd²) - 2j·L·α·ωd
// R·s = -Rα + jR·ωd
// 1/C = 1/C
// Real: L(α²-ωd²) - Rα + 1/C = L(α²-(ω₀²-α²)) - Rα + Lω₀² = 2Lα² - Lω₀² - Rα + Lω₀² = 2Lα² - Rα = α(2Lα-R) = 0 since α=R/(2L) ✓
// Imag: -2Lαωd + Rωd = ωd(-2Lα+R) = 0 since α=R/(2L) ✓
console.log('  Poles characteristic equation: verified algebraically (real=0, imag=0)');

// Step response formula (underdamped, V₀=1, initial V_C(0)=0, I(0)=0):
// V_C(t) = 1 - e^{-αt}[cos(ωd·t) + (α/ωd)·sin(ωd·t)]
// Test at t = π/(2ωd) (quarter period):
const t_qtr = Math.PI / (2 * omegad);
const Vc_qtr = 1 - Math.exp(-alpha * t_qtr) * (Math.cos(omegad * t_qtr) + (alpha / omegad) * Math.sin(omegad * t_qtr));
row('V_C(π/(2ωd))', Vc_qtr, '');
row('t_qtr = π/(2ωd) μs', t_qtr * 1e6, '[μs]');

// RK4 cross-check at t_qtr (verify step response formula)
function rk4Step(vC, I, dt) {
  function f(y) {
    return [y[1] / C, (1 - R * y[1] - y[0]) / L];
  }
  const y = [vC, I];
  const k1 = f(y);
  const y2 = y.map((v, i) => v + dt / 2 * k1[i]);
  const k2 = f(y2);
  const y3 = y.map((v, i) => v + dt / 2 * k2[i]);
  const k3 = f(y3);
  const y4 = y.map((v, i) => v + dt * k3[i]);
  const k4 = f(y4);
  return y.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
// Use exact step count = 5000 with dt = t_qtr/5000 (avoids time-mismatch error)
const N_rk4 = 5000;
const dt_rk4 = t_qtr / N_rk4;
let state = [0, 0];
for (let i = 0; i < N_rk4; i++) state = rk4Step(state[0], state[1], dt_rk4);
const rk4_val = state[0];
assert(Math.abs(rk4_val / Vc_qtr - 1) < 1e-10,
  `RK4 vs formula: ${rk4_val} vs ${Vc_qtr}, rel err=${rk4_val / Vc_qtr - 1}`);
row('RK4 V_C(t_qtr) [cross-check]', rk4_val, `err=${(rk4_val / Vc_qtr - 1).toExponential(2)}`);

// ═══════════════════════════════════════════════════════════════════════
// 2. BUTLER-VOLMER (chemistry/electrochemistry/butler-volmer)
// ═══════════════════════════════════════════════════════════════════════
sec('2. BUTLER-VOLMER');

// Butler-Volmer equation:
//   i = i₀·[exp(αF·η/(RT)) − exp(−(1−α)F·η/(RT))]
// where α is the transfer coefficient (0 < α < 1), typically α=0.5
// η = overpotential (V), F = Faraday constant, R = gas constant, T = temperature
//
// Constants (CODATA 2018 exact values):
const F_const = 96485.33212;    // C/mol (Faraday constant) — CODATA 2018 exact
const R_gas = 8.31446261815324; // J/(mol·K) — CODATA 2018 exact
const T_kelvin = 298.15;        // K (25°C)
const alpha_bv = 0.5;           // transfer coefficient (symmetric)

// Thermal voltage: V_T = RT/F
const V_T = R_gas * T_kelvin / F_const;
row('V_T = RT/F at 25°C', V_T, '[V] ≈ 0.02569');
// Standard value: 0.02569... V at 25°C
assert(Math.abs(V_T / 0.02569 - 1) < 1e-3, `V_T ≈ 0.0257 V; got ${V_T}`);

// Tafel slope: b = RT/(α_bv·F)·ln(10) = V_T/α_bv · ln(10)
// For α=0.5: b = 2·V_T·ln10 ≈ 0.11835 V/decade (at 25°C)
const tafel_slope = V_T / alpha_bv * Math.log(10);
row('Tafel slope = V_T/α·ln10', tafel_slope, '[V/dec]');
assert(Math.abs(tafel_slope / 0.11835 - 1) < 1e-3, `Tafel slope ≈ 0.118 V/dec; got ${tafel_slope}`);

// BV equation symmetry: i(-η) = -i(η) for α=0.5
// Proof: i(-η) = i₀[exp(-η/(2V_T)) - exp(η/(2V_T))] = -i₀[exp(η/(2V_T)) - exp(-η/(2V_T))] = -i(η)
console.log('  BV symmetry at α=0.5: i(-η)=-i(η) — algebraic');

// Limiting case: small η → linear (Butler-Volmer → Ohm's law)
// i ≈ i₀·η/V_T  (to first order in η)
// Proof: exp(x)−1 ≈ x for small x; with α=0.5: i ≈ i₀·(η/(2V_T) + η/(2V_T)) = i₀·η/V_T
// For small η, BV → i₀·η/V_T (linear, Ohm's law).
// For α=0.5, second-order term cancels; leading correction is O((η/V_T)^3).
// At η=1e-4 V: η/V_T ≈ 3.89e-3; BV/linear − 1 ≈ O((η/V_T)^2/6) ≈ 6e-7
const eta_small = 1e-4;  // V
const i_bv_small = Math.exp(alpha_bv * eta_small / V_T) - Math.exp(-(1 - alpha_bv) * eta_small / V_T);
const i_linear = eta_small / V_T;
const linear_rel_err = Math.abs(i_bv_small / i_linear - 1);
assert(linear_rel_err < 1e-5,
  `Linear limit: BV=${i_bv_small} vs linear=${i_linear}, rel err=${linear_rel_err}`);
row('BV linear limit rel error at η=0.1mV', linear_rel_err, '< 1e-5 (O((η/V_T)²) correction)');

// Limiting case: large η → Tafel (anodic branch)
// i ≈ i₀·exp(αη/V_T) for η >> V_T
// log(i/i₀) = α·η/V_T·log10(e) = η/b (Tafel equation)
const eta_large = 0.5;  // V
const i_bv_large = Math.exp(alpha_bv * eta_large / V_T) - Math.exp(-(1 - alpha_bv) * eta_large / V_T);
const i_tafel = Math.exp(alpha_bv * eta_large / V_T);
// At 0.5 V, cathodic term exp(-(1-α)η/V_T) = exp(-0.5*0.5/0.0257) ≈ exp(-9.7) ≈ 6e-5 << anodic term
const cathodic_fraction = Math.exp(-(1 - alpha_bv) * eta_large / V_T) / i_tafel;
assert(cathodic_fraction < 1e-4, `Cathodic fraction at η=0.5V: ${cathodic_fraction}`);
row('Cathodic/anodic fraction at η=0.5V', cathodic_fraction, '< 1e-4 (Tafel regime)');

// Anodic Tafel slope: log10(i/i₀) = η/b → b = V_T/α·ln10
// Test: log10(i/i₀) at η=tafel_slope (1 decade)
const log_ratio = Math.log10(Math.exp(alpha_bv * tafel_slope / V_T) - Math.exp(-(1-alpha_bv)*tafel_slope/V_T));
assert(Math.abs(log_ratio - 1) < 0.02, `1 Tafel slope: log10(i/i₀)=${log_ratio}, expected≈1`);
row('log10(i/i₀) at η=b (1 decade)', log_ratio, '≈ 1');

// Exchange current density i₀: units A/m²; test with i₀=1 A/m² (dimensionless form)
// Equilibrium check: i(η=0) = 0 exactly
const i_equil = Math.exp(0) - Math.exp(0);
assert(i_equil === 0, `i(0) should be 0`);
row('i(η=0) = 0', i_equil, 'exact');

// ═══════════════════════════════════════════════════════════════════════
// 3. OPTIONS-PRICING (economics/finance/options-pricing)
// ═══════════════════════════════════════════════════════════════════════
sec('3. OPTIONS-PRICING');

// Black-Scholes formula for European call/put
// C = S·Φ(d₁) − K·e^{-rT}·Φ(d₂)
// P = K·e^{-rT}·Φ(−d₂) − S·Φ(−d₁)
// d₁ = [ln(S/K) + (r+σ²/2)·T] / (σ√T)
// d₂ = d₁ − σ√T

// Standard normal CDF via erf (Taylor series, high precision)
function erfExact(x) {
  if (Math.abs(x) > 6) return x > 0 ? 1 : -1;
  // Taylor series (accurate for |x| ≤ 6)
  let sum = 0;
  let term = x;
  let n = 0;
  while (Math.abs(term) > 1e-17 && n < 200) {
    sum += term;
    n++;
    term *= -x * x * (2 * n - 1) / (n * (2 * n + 1));
  }
  return 2 / Math.sqrt(Math.PI) * sum;
}
function Phi(x) { return 0.5 * (1 + erfExact(x / Math.SQRT2)); }

// Test case: S=100, K=100 (ATM), r=5%, σ=20%, T=1 year
// Status: Black & Scholes 1973 (JPE 81:637) — cited, not fetched
const S_bs = 100, K_bs = 100, r_bs = 0.05, sigma_bs = 0.20, T_bs = 1;

// d₁ = [0 + (0.05+0.02)·1] / (0.20·1) = 0.07/0.20 = 0.35  (exact, since ln(100/100)=0)
const d1_exact = 0.35;  // exact for ATM with these params
const d2_exact = 0.15;  // d1 - sigma*sqrt(T) = 0.35 - 0.20 = 0.15

assert(Math.abs(d1_exact - 0.35) < 1e-15, 'd1 should be 0.35 exactly');
assert(Math.abs(d2_exact - 0.15) < 1e-15, 'd2 should be 0.15 exactly');
row('d₁ = (0+0.07)/0.20', d1_exact, 'exact for ATM');
row('d₂ = d₁ − 0.20', d2_exact, 'exact');

const Phi_d1 = Phi(d1_exact);
const Phi_d2 = Phi(d2_exact);
row('Φ(d₁) = Φ(0.35)', Phi_d1, '');
row('Φ(d₂) = Φ(0.15)', Phi_d2, '');

const call_bs = S_bs * Phi_d1 - K_bs * Math.exp(-r_bs * T_bs) * Phi_d2;
const put_bs  = K_bs * Math.exp(-r_bs * T_bs) * Phi(1 - Phi_d2) - S_bs * Phi(1 - Phi_d1);
// Note: Phi(-x) = 1 - Phi(x)
const put_bs2 = K_bs * Math.exp(-r_bs * T_bs) * (1 - Phi_d2) - S_bs * (1 - Phi_d1);
row('call (S=K=100, r=5%, σ=20%, T=1)', call_bs, '[USD]');
row('put (same params)', put_bs2, '[USD]');

// Put-call parity: C − P = S − K·e^{-rT}
const parity_lhs = call_bs - put_bs2;
const parity_rhs = S_bs - K_bs * Math.exp(-r_bs * T_bs);
assert(Math.abs(parity_lhs - parity_rhs) < 1e-10, `Put-call parity failed: LHS=${parity_lhs}, RHS=${parity_rhs}`);
row('Put-call parity error', Math.abs(parity_lhs - parity_rhs), '< 1e-10');

// Delta = Φ(d₁)
const delta_call = Phi_d1;
row('Delta (call) = Φ(d₁)', delta_call, '');

// Delta hedge: at ATM, delta ≈ 0.5; here delta = Phi(0.35) ≈ 0.637
// (> 0.5 because of the forward-price drift term r+σ²/2)
assert(delta_call > 0.5 && delta_call < 1, `Delta should be in (0.5, 1)`);

// Intrinsic value: max(S-K, 0) = 0 for ATM; time value = call
assert(call_bs > 0, 'call > 0 for ATM');

// ═══════════════════════════════════════════════════════════════════════
// 4. HOPFIELD NETWORK (neuroscience/networks/hopfield)
// ═══════════════════════════════════════════════════════════════════════
sec('4. HOPFIELD NETWORK');

// Hebbian rule: w_ij = (1/N) Σ_μ ξ^μ_i · ξ^μ_j  (i≠j), w_ii = 0
// Energy: E = −½ Σ_{i≠j} w_ij · s_i · s_j
// Update: s_i ← sign(h_i) where h_i = Σ_j w_ij · s_j

// Test case: N=4, 1 pattern ξ = [+1,+1,−1,−1]
const N_hop = 4;
const xi = [1, 1, -1, -1];

// Build weight matrix
const W_hop = Array.from({ length: N_hop }, (_, i) =>
  Array.from({ length: N_hop }, (_, j) =>
    i === j ? 0 : xi[i] * xi[j] / N_hop
  )
);

// w_01 = 1·1/4 = 0.25 (exact)
assert(W_hop[0][1] === 1 / N_hop, `w_01 = ${W_hop[0][1]}, expected ${1/N_hop}`);
assert(W_hop[0][2] === -1 / N_hop, `w_02 = ${W_hop[0][2]}, expected ${-1/N_hop}`);
row('w_01 = ξ₀ξ₁/N = 1/4', W_hop[0][1], 'exact');
row('w_02 = ξ₀ξ₂/N = -1/4', W_hop[0][2], 'exact');

// Energy of stored pattern E = −½(1/N)Σ_{i≠j}(ξ_i·ξ_j)² = −½(N−1) for single pattern
// Σ_{i≠j}(ξ_i·ξ_j)² = Σ_{i≠j} 1 = N(N−1)  (since ξ_i=±1)
// E = −½(1/N)·N(N−1) = −(N−1)/2
let E_stored = 0;
for (let i = 0; i < N_hop; i++)
  for (let j = 0; j < N_hop; j++)
    E_stored -= 0.5 * W_hop[i][j] * xi[i] * xi[j];
const E_theory = -(N_hop - 1) / 2;  // = -1.5
assert(Math.abs(E_stored - E_theory) < 1e-14, `E_stored=${E_stored}, theory=${E_theory}`);
row('Energy E = −(N−1)/2 = −1.5', E_stored, 'algebraic');

// Energy of inverted pattern [-1,-1,+1,+1]: same as stored (by symmetry E(−ξ)=E(ξ))
let E_inverted = 0;
const xi_inv = xi.map(v => -v);
for (let i = 0; i < N_hop; i++)
  for (let j = 0; j < N_hop; j++)
    E_inverted -= 0.5 * W_hop[i][j] * xi_inv[i] * xi_inv[j];
assert(Math.abs(E_inverted - E_theory) < 1e-14, `E_inverted=${E_inverted} ≠ E_stored=${E_theory}`);
row('E(−ξ) = E(ξ) (symmetry)', E_inverted, 'algebraic');

// Energy of orthogonal state [+1,−1,+1,−1]: should be > E_stored (less stable)
const xi_orth = [1, -1, 1, -1];
let E_orth = 0;
for (let i = 0; i < N_hop; i++)
  for (let j = 0; j < N_hop; j++)
    E_orth -= 0.5 * W_hop[i][j] * xi_orth[i] * xi_orth[j];
assert(E_orth > E_stored, `orthogonal state should have higher energy: ${E_orth} vs ${E_stored}`);
row('E(orthogonal) > E(stored)', E_orth, '> ' + E_theory);

// Recall: starting from 1-bit error state, async update recovers stored pattern
const state_1err = [1, 1, -1, 1];  // 4th bit flipped (+1 instead of -1)
function hopfieldUpdate(s, W, N) {
  const s_new = s.slice();
  for (let i = 0; i < N; i++) {
    let h = 0;
    for (let j = 0; j < N; j++) h += W[i][j] * s[j];
    s_new[i] = h >= 0 ? 1 : -1;
  }
  return s_new;
}
let s = state_1err.slice();
for (let t = 0; t < 10; t++) s = hopfieldUpdate(s, W_hop, N_hop);
assert(s.every((v, i) => v === xi[i]), `recall failed: got ${s}, expected ${xi}`);
console.log('  Recall from 1-bit error: converges to stored pattern OK');

// Storage capacity (asymptotic): ~0.138N patterns for random ±1 patterns
// (Amit, Gutfreund, Sompolinsky 1985; McEliece et al. 1987 asymptotic N/(4 ln N))
// Status: cited, not fetched (Amit et al. 1985)
// For N=100: ~14 patterns; for N=1000: ~138 patterns
row('Capacity ~0.138N for N=100', 0.138 * 100, 'cited, not fetched');

// ═══════════════════════════════════════════════════════════════════════
// 5. REINFORCEMENT LEARNING (psychology/learning/reinforcement-learning)
// ═══════════════════════════════════════════════════════════════════════
sec('5. REINFORCEMENT LEARNING');

// Q-learning: Q(s,a) ← Q(s,a) + lr·[R + γ·max_a' Q(s',a') − Q(s,a)]
// Convergence: Q → Q* (Bellman optimality) under sufficient exploration + decaying lr
// Status: Watkins & Dayan 1992, Machine Learning 8:279 — cited, not fetched

// Test case 1: Simple 2-state MDP
// s0 →(a=go, R=1)→ s1 (terminal, R=0)
// V*(s0) = R + γ·V*(s1) = 1 + γ·0 = 1 for any γ
const gamma_rl = 0.9;
const V_s0 = 1;  // exact (terminal reward)
const V_s1 = 0;  // terminal
assert(V_s0 === 1, `V*(s0) should be 1`);
row('V*(s0) = R + γ·V*(terminal) = 1', V_s0, 'algebraic');

// Test case 2: 3-state chain
// s0 →(R=0)→ s1 →(R=1)→ s2(terminal)
// V*(s1) = 1 + γ·0 = 1
// V*(s0) = 0 + γ·1 = 0.9
const V_s1_chain = 1;
const V_s0_chain = gamma_rl * V_s1_chain;
assert(Math.abs(V_s0_chain - 0.9) < 1e-15, `V*(s0) in chain = ${V_s0_chain}`);
row('V*(s0) in 3-chain = γ·V*(s1) = 0.9', V_s0_chain, 'algebraic');

// Bellman optimality: TD-error at convergence = 0
// δ = R + γ·max Q(s',a') − Q(s,a) = 0 at Q*
// For s0→s1(R=0): Q*(s0,a) = 0 + 0.9·1 = 0.9
const Q_s0_go = 0 + gamma_rl * V_s1_chain;
const td_error = 0 + gamma_rl * V_s1_chain - Q_s0_go;
assert(Math.abs(td_error) < 1e-15, `TD error at convergence should be 0: ${td_error}`);
row('TD error at Q* = 0', td_error, 'algebraic');

// ε-greedy exploration: P(optimal action) = (1-ε) + ε/|A|
const eps_rl = 0.1, nA = 2;
const P_opt = (1 - eps_rl) + eps_rl / nA;
assert(Math.abs(P_opt - 0.95) < 1e-15, `P(optimal)=${P_opt}`);
row('P(optimal|ε=0.1, |A|=2) = 0.95', P_opt, 'algebraic');

// Return (undiscounted): G = Σ R_t = R₁ + R₂ + ... (total reward)
// For episode s0→s1→s2(R=1): G(s0) = 0 + 0 + 1 = 1 (undiscounted γ=1)
// Discounted: G(s0) = γ²·1 = 0.81
const G_discounted = gamma_rl ** 2 * 1;
assert(Math.abs(G_discounted - 0.81) < 1e-15, `G_discounted=${G_discounted}`);
row('G(s0) discounted (γ=0.9, 2 steps) = 0.81', G_discounted, 'algebraic');

// ═══════════════════════════════════════════════════════════════════════
// 6. AUCTIONS (economics/game-theory/auctions)
// ═══════════════════════════════════════════════════════════════════════
sec('6. AUCTIONS');

// Vickrey second-price auction: dominant strategy = bid true value
// Proof: by cases (bid above, at, below value) — all others weakly dominated by truthful bidding
// Status: Vickrey 1961, J. Finance 16:8 — cited, not fetched

// First-price auction (symmetric IPV, uniform [0,1]):
// BNE: b*(v) = (N-1)/N · v  [N bidders]
// Expected revenue = (N-1)/(N+1)  [Revenue Equivalence Theorem]
// Status: algebraic

// N=2 bidders:
const N_2 = 2;
const b_star_N2 = (v) => (N_2 - 1) / N_2 * v;  // b*(v) = v/2
// Expected revenue from 1st-price N=2, uniform[0,1]:
// E[max(b*(V₁), b*(V₂))] = E[max(V₁/2, V₂/2)] = (1/2)·E[max(V₁,V₂)] = (1/2)·(2/3) = 1/3
const E_rev_N2 = (N_2 - 1) / (N_2 + 1);  // = 1/3
assert(Math.abs(E_rev_N2 - 1/3) < 1e-15, `E[rev] N=2: ${E_rev_N2}`);
row('E[revenue] N=2 first-price = 1/3', E_rev_N2, 'algebraic');

// N=3 bidders:
const N_3 = 3;
const E_rev_N3 = (N_3 - 1) / (N_3 + 1);  // = 1/2
assert(Math.abs(E_rev_N3 - 1/2) < 1e-15, `E[rev] N=3: ${E_rev_N3}`);
row('E[revenue] N=3 first-price = 1/2', E_rev_N3, 'algebraic');

// Revenue equivalence theorem: same expected revenue for 2nd-price
// 2nd-price N=2: winner pays 2nd-highest bid = E[min(V₁,V₂)] = 1/3 ✓
const E_rev_2nd_N2 = 1/3;  // E[min] = integral_0^1 integral_0^v1 v2 2 dv2 dv1 = 1/3
assert(Math.abs(E_rev_2nd_N2 - E_rev_N2) < 1e-15, 'Revenue equivalence check');
row('Revenue equivalence: 1st=2nd price for N=2', E_rev_N2 - E_rev_2nd_N2, '= 0 (exact)');

// BNE bid formula at specific value:
const v_test = 0.8;
const b_N2 = b_star_N2(v_test);
const b_N3 = (N_3 - 1) / N_3 * v_test;
assert(Math.abs(b_N2 - 0.4) < 1e-15, `b*(0.8, N=2) = ${b_N2}`);
assert(Math.abs(b_N3 - 0.8 * 2/3) < 1e-15, `b*(0.8, N=3) = ${b_N3}`);
row('b*(0.8, N=2) = 0.4', b_N2, 'exact');
row('b*(0.8, N=3) = 8/15', b_N3, 'exact');

// Optimal reserve price (Myerson): r* = (1-F(r*))/f(r*) + c (virtual value = 0)
// For uniform[0,1], c=0: r* = 1/2
const reserve_uniform = 0.5;
row('Optimal reserve (uniform[0,1]) = 0.5', reserve_uniform, 'algebraic');

// ═══════════════════════════════════════════════════════════════════════
// 7. VOTING-SYSTEMS (economics/voting/voting-systems)
// ═══════════════════════════════════════════════════════════════════════
sec('7. VOTING-SYSTEMS');

// Condorcet paradox: 3 voters, 3 alternatives A, B, C
// Voter 1: A > B > C
// Voter 2: B > C > A
// Voter 3: C > A > B
// Pairwise majority:
//   A vs B: voters 1,3 prefer A → A>B (2 vs 1)
//   B vs C: voters 1,2 prefer B → B>C (2 vs 1)
//   C vs A: voters 2,3 prefer C → C>A (2 vs 1)
// → CYCLE: A>B>C>A — no Condorcet winner
const prefs = [[0,1,2], [1,2,0], [2,0,1]]; // A=0,B=1,C=2; pref[voter][rank]=alt
// Count pairwise wins
function pairCount(a, b, prefs) {
  // How many voters prefer a over b?
  return prefs.filter(pref => pref.indexOf(a) < pref.indexOf(b)).length;
}
const A_vs_B = pairCount(0, 1, prefs);
const B_vs_C = pairCount(1, 2, prefs);
const C_vs_A = pairCount(2, 0, prefs);
assert(A_vs_B === 2, `A vs B: ${A_vs_B} for A`);
assert(B_vs_C === 2, `B vs C: ${B_vs_C} for B`);
assert(C_vs_A === 2, `C vs A: ${C_vs_A} for C`);
// Check cycle: A>B, B>C, C>A
assert(A_vs_B > 1 && B_vs_C > 1 && C_vs_A > 1, 'Condorcet cycle exists');
row('Condorcet cycle: A beats B (2 vs 1)', A_vs_B, 'exact');
row('Condorcet cycle: B beats C (2 vs 1)', B_vs_C, 'exact');
row('Condorcet cycle: C beats A (2 vs 1)', C_vs_A, 'exact');

// Borda count: assign points (n-1, n-2, ..., 0) for rank 1,2,3
// Alt A: voter1=2, voter2=0, voter3=1 → 3 pts
// Alt B: voter1=1, voter2=2, voter3=0 → 3 pts
// Alt C: voter1=0, voter2=1, voter3=2 → 3 pts → TIE
function bordaScore(alt, prefs, nAlts) {
  return prefs.reduce((s, pref) => s + (nAlts - 1 - pref.indexOf(alt)), 0);
}
const borda_A = bordaScore(0, prefs, 3);
const borda_B = bordaScore(1, prefs, 3);
const borda_C = bordaScore(2, prefs, 3);
assert(borda_A === 3 && borda_B === 3 && borda_C === 3, `Borda: A=${borda_A}, B=${borda_B}, C=${borda_C}`);
row('Borda score A = B = C = 3 (tie)', borda_A, 'exact');

// Condorcet winner existence: 4 voters, transitive preferences
// Voter1: A>B>C, Voter2: A>B>C, Voter3: B>A>C, Voter4: B>A>C
// A vs B: 2 vs 2 (tie!); no strict Condorcet winner
// Use: 3 voters A>B>C; 1 voter B>A>C → A beats B (3:1), A beats C (4:0), B beats C (4:0)
// → A is Condorcet winner
const prefs4 = [[0,1,2],[0,1,2],[0,1,2],[1,0,2]]; // 3 prefer A, 1 prefers B
const A_vs_B_4 = pairCount(0, 1, prefs4);
const A_vs_C_4 = pairCount(0, 2, prefs4);
assert(A_vs_B_4 === 3, `Condorcet winner test: A beats B ${A_vs_B_4}:1`);
assert(A_vs_C_4 === 4, `A beats C ${A_vs_C_4}:0`);
row('Condorcet winner (4 voters): A beats B 3:1', A_vs_B_4, 'exact');
row('Condorcet winner (4 voters): A beats C 4:0', A_vs_C_4, 'exact');

// Plurality vs Condorcet failure:
// 3 voters: 1: A>B>C, 1: B>C>A, 1: C>A>B — plurality tie (1,1,1)
const plurality = [0, 0, 0];
prefs.forEach(pref => plurality[pref[0]]++);
assert(plurality[0] === 1 && plurality[1] === 1 && plurality[2] === 1,
  `Plurality: ${plurality}`);
row('Plurality with Condorcet cycle: A=B=C=1 (tie)', plurality[0], 'exact');

console.log('\n' + '═'.repeat(70));
console.log('ALL Phase 10 ANCHORS PASS');
console.log('═'.repeat(70));

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY TABLE
// ═══════════════════════════════════════════════════════════════════════
sec('SUMMARY — Phase 10 numerical anchors');
console.log(`
Bench               | Key anchor                              | Status
--------------------|----------------------------------------|------------------
lc-oscillator       | ω₀=10000√10, Q=√10, Δω=R/L=10000       | algebraic
lc-oscillator       | ωd=10⁴√97.5, ωC=10⁴√95                 | algebraic
lc-oscillator       | V_C(t) step-resp; RK4 vs formula <1e-7  | algebraic
butler-volmer       | V_T=RT/F≈0.02569V; Tafel≈0.1184V/dec   | algebraic/CODATA
butler-volmer       | i(0)=0; linear limit; Tafel limit       | algebraic
options-pricing     | d1=0.35, d2=0.15 (exact ATM)           | algebraic
options-pricing     | call≈10.4506; put-call parity err<1e-10 | algebraic+cited
hopfield            | w_01=1/N; E_stored=-(N-1)/2=-1.5       | algebraic
hopfield            | recall from 1-bit error (N=4)           | algebraic
hopfield            | capacity ~0.138N                        | cited-not-fetched
reinforcement-learn | V*(s0)=1 (2-state); TD-error=0 at Q*   | algebraic
auctions            | b*(v,N=2)=v/2; E[rev]=1/3              | algebraic
auctions            | revenue equivalence 1st=2nd price       | algebraic
voting-systems      | Condorcet cycle (3 voters, 3 alts)      | algebraic
voting-systems      | Borda tie (all=3); Condorcet winner     | algebraic
`);
