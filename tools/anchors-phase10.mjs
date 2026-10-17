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

// ───────────────────────────────────────────────────────────────────────
// BV1: sinh form at α=0.5
// ───────────────────────────────────────────────────────────────────────
// For α=0.5: i/i₀ = exp(η/(2V_T)) - exp(-η/(2V_T)) = 2·sinh(η/(2V_T))
const eta_bv1 = 0.3;  // V
const i_bv1_formula = Math.exp(alpha_bv * eta_bv1 / V_T) - Math.exp(-(1 - alpha_bv) * eta_bv1 / V_T);
const i_bv1_sinh    = 2 * Math.sinh(eta_bv1 / (2 * V_T));
const bv1_rel_diff  = Math.abs(i_bv1_formula / i_bv1_sinh - 1);
assert(bv1_rel_diff < 1e-12,
  `BV1 sinh form: |BV - 2*sinh| / 2*sinh = ${bv1_rel_diff}, expected < 1e-12`);
row('BV1: |BV(η=0.3V) - 2·sinh(η/(2V_T))|/BV', bv1_rel_diff, '< 1e-12 ✓');
console.log('  BV1: i/i₀ = 2·sinh(η/(2V_T)) for α=0.5 verified ✓');

// ───────────────────────────────────────────────────────────────────────
// BV2: Linear deviation = (η/V_T)²/24 at η=1mV
// ───────────────────────────────────────────────────────────────────────
// For α=0.5: i = i₀·2·sinh(u), i_linear = i₀·2u, u=η/(2V_T)
// Relative error = sinh(u)/u - 1 ≈ u²/6 for small u
//                = (η/(2V_T))²/6 = (η/V_T)²/24
const eta_bv2 = 0.001;  // 1 mV
const i_bv2_full  = 2 * Math.sinh(eta_bv2 / (2 * V_T));
const i_bv2_lin   = eta_bv2 / V_T;
const actual_rel  = Math.abs(i_bv2_full / i_bv2_lin - 1);
const theory_rel  = (eta_bv2 / V_T) ** 2 / 24;
// User-specified 6.312e-5 (to 4 sig figs): check both actual and theory agree
assert(Math.abs(actual_rel / 6.312e-5 - 1) < 0.01,
  `BV2 actual rel err = ${actual_rel}, expected ≈ 6.312e-5, rel diff = ${Math.abs(actual_rel/6.312e-5-1)}`);
assert(Math.abs(theory_rel / actual_rel - 1) < 0.001,
  `BV2 theory ${theory_rel} vs actual ${actual_rel}, should agree to 0.1%`);
row('BV2: actual rel err at η=1mV', actual_rel, '≈ 6.312e-5');
row('BV2: (η/V_T)²/24 theory', theory_rel, '≈ 6.312e-5');
console.log('  BV2: linear deviation (η/V_T)²/24 ≈ 6.312e-5 at η=1mV ✓');

// ───────────────────────────────────────────────────────────────────────
// BV3: Exact log10(i/i₀) at η=b
// ───────────────────────────────────────────────────────────────────────
// b = V_T·ln10/alpha_bv = 2·V_T·ln10
// At η=b: i/i₀ = 2·sinh(b/(2V_T)) = 2·sinh(V_T·ln10/V_T) = 2·sinh(ln10)
// sinh(ln10) = (10 - 1/10)/2 = 9.9/2
// 2·sinh(ln10) = 9.9 exactly
const bv3_sinh_val = 2 * Math.sinh(Math.log(10));
assert(Math.abs(bv3_sinh_val - 9.9) < 1e-14,
  `2·sinh(ln10) = ${bv3_sinh_val}, should be 9.9 within 1e-14`);
const bv3_log10 = Math.log10(9.9);
assert(Math.abs(bv3_log10 - 0.9956351945975499) < 1e-15,
  `log10(9.9) = ${bv3_log10}, user-specified 0.9956351945975499, diff = ${Math.abs(bv3_log10 - 0.9956351945975499)}`);
row('BV3: 2·sinh(ln10)', bv3_sinh_val, '= 9.9 exactly');
row('BV3: log10(9.9)', bv3_log10, '= 0.9956351945975499');
console.log('  BV3: log10(i/i₀) at η=b = 0.9956351945975499 ✓');

// ───────────────────────────────────────────────────────────────────────
// BV4: Cathodic/anodic ratio at large η
// ───────────────────────────────────────────────────────────────────────
// For α=0.5: cathodic = exp(-η/(2V_T)), anodic = exp(η/(2V_T))
// cathodic/anodic = exp(-η/V_T) exactly
const eta_bv4 = 0.5;  // V (large overpotential)
const cathodic_bv4 = Math.exp(-0.5 * eta_bv4 / V_T);
const anodic_bv4   = Math.exp( 0.5 * eta_bv4 / V_T);
const ratio_bv4    = cathodic_bv4 / anodic_bv4;
const expected_ratio_bv4 = Math.exp(-eta_bv4 / V_T);
assert(Math.abs(ratio_bv4 / expected_ratio_bv4 - 1) < 1e-14,
  `BV4: cathodic/anodic = ${ratio_bv4}, exp(-η/V_T)=${expected_ratio_bv4}`);
row('BV4: cathodic/anodic = exp(-η/V_T)', ratio_bv4, '= exp(-0.5/V_T)');
console.log('  BV4: cathodic/anodic = exp(-η/V_T) exactly ✓');

// BV5: Domain guard — note only, no code needed
console.log('  BV5 (note): |η|/V_T > 700 → exp(η/V_T) overflows IEEE 754 double.');
console.log('             Domain limit: |η| < 700·V_T ≈ 18.0 V for safe evaluation.');

// ───────────────────────────────────────────────────────────────────────
// Predict 3 correction
// ───────────────────────────────────────────────────────────────────────
// Plan says η≈6.3mV for 1% linear deviation — INCORRECT.
// Correct: (η/V_T)²/24 = 0.01 → (η/V_T)² = 0.24 → η = V_T·√0.24
// η_1pct = V_T·√0.24 ≈ 0.025693·0.489898 ≈ 12.587 mV
// User spec: 12.57 mV (3 sig figs)
// Note: plan's 6.3 mV was off by 2× (used (η/V_T)²/6 = 0.01 instead of /24 = 0.01)
const eta_1pct = V_T * Math.sqrt(0.24);
console.log(`  Predict 3 correction: η_1pct = V_T·√0.24 = ${(eta_1pct*1000).toPrecision(6)} mV`);
console.log(`  Plan said 6.3 mV — INCORRECT (off by ~2×). Correct value ≈ 12.57 mV.`);
// Verify to 1% tolerance (user gave 3 digits: 12.57 mV)
assert(Math.abs(eta_1pct * 1000 / 12.57 - 1) < 0.01,
  `eta_1pct = ${eta_1pct*1000} mV, user-specified 12.57 mV, rel diff = ${Math.abs(eta_1pct*1000/12.57-1)}`);
row('Predict3: η_1pct = V_T·√0.24 [mV]', eta_1pct * 1000, '≈ 12.57 mV (plan said 6.3 mV — wrong)');

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

// BS1: d1 tolerance
// d1=0.35 is computed as 0.07/0.20. In IEEE 754, 0.07 and 0.20 are not exactly
// representable, but 0.07/0.20 evaluates to the closest double to 0.35. Using 1e-15.
assert(Math.abs(d1_exact - 0.35) < 1e-15, 'd1 should be 0.35 exactly');
assert(Math.abs(d2_exact - 0.15) < 1e-15, 'd2 should be 0.15 exactly');
row('d₁ = (0+0.07)/0.20', d1_exact, 'exact for ATM');
row('d₂ = d₁ − 0.20', d2_exact, 'exact');

const Phi_d1 = Phi(d1_exact);
const Phi_d2 = Phi(d2_exact);
row('Φ(d₁) = Φ(0.35)', Phi_d1, '');
row('Φ(d₂) = Φ(0.15)', Phi_d2, '');

const call_bs = S_bs * Phi_d1 - K_bs * Math.exp(-r_bs * T_bs) * Phi_d2;
const put_bs2 = K_bs * Math.exp(-r_bs * T_bs) * (1 - Phi_d2) - S_bs * (1 - Phi_d1);
row('call (S=K=100, r=5%, σ=20%, T=1)', call_bs, '[USD]');
row('put (same params)', put_bs2, '[USD]');

// BS2: Exact call value — user-specified 10.450583572185565 (16 digits)
assert(Math.abs(call_bs - 10.450583572185565) < 1e-12,
  `call = ${call_bs}, expected 10.450583572185565, diff=${Math.abs(call_bs-10.450583572185565)}`);
row('call exact', call_bs, '10.450583572185565 ±1e-12');

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

// ───────────────────────────────────────────────────────────────────────
// BS3: σ→∞ limit
// ───────────────────────────────────────────────────────────────────────
// When sigma → ∞: d1 → +∞, d2 → -∞
// Φ(d1)→1, Φ(d2)→0 → C → S·1 − K·e^{-rT}·0 = S
function callBS(S, K, r, sigma, T) {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return S * Phi(d1) - K * Math.exp(-r * T) * Phi(d2);
}
const call_sigma_inf = callBS(100, 100, 0.05, 1000, 1);
assert(Math.abs(call_sigma_inf - 100) < 1e-6,
  `BS3: call(sigma=1000) = ${call_sigma_inf}, expected ≈ 100`);
row('BS3: call(σ=1000) → S=100', call_sigma_inf, '≈ 100 within 1e-6 ✓');

// ───────────────────────────────────────────────────────────────────────
// BS4: σ→0 limit
// ───────────────────────────────────────────────────────────────────────
// When sigma → 0: C → max(S - K·e^{-rT}, 0) = S - K·e^{-rT} (for S > K·e^{-rT})
// = 100 - 100·exp(-0.05)
// User-specified: 4.877057549928594
const intrinsic_val = 100 - 100 * Math.exp(-0.05);
assert(Math.abs(intrinsic_val - 4.877057549928594) < 1e-12,
  `S-K·e^{-rT} = ${intrinsic_val}, user-specified 4.877057549928594`);
const call_sigma_zero = callBS(100, 100, 0.05, 1e-8, 1);
assert(Math.abs(call_sigma_zero - 4.877057549928594) < 1e-4,
  `BS4: call(sigma=1e-8) = ${call_sigma_zero}, expected 4.877057549928594`);
row('BS4: call(σ→0) → S-K·e^{-rT}', call_sigma_zero, '= 4.877057549928594 within 1e-4 ✓');

// ───────────────────────────────────────────────────────────────────────
// BS5: Deep ITM put
// ───────────────────────────────────────────────────────────────────────
// S=50, K=100, r=5%, σ=20%, T=1
// d1 = (ln(50/100) + 0.07) / 0.20 = (-ln2 + 0.07)/0.20
// d2 = d1 - 0.20
const S_itm = 50, K_itm = 100, r_itm = 0.05, sigma_itm = 0.20, T_itm = 1;
const d1_itm = (Math.log(S_itm / K_itm) + (r_itm + sigma_itm ** 2 / 2) * T_itm) / (sigma_itm * Math.sqrt(T_itm));
const d2_itm = d1_itm - sigma_itm * Math.sqrt(T_itm);
const put_itm = K_itm * Math.exp(-r_itm * T_itm) * (1 - Phi(d2_itm)) - S_itm * (1 - Phi(d1_itm));
// User-specified: 45.12534186762472
assert(Math.abs(put_itm - 45.12534186762472) < 1e-8,
  `BS5: put(S=50) = ${put_itm}, expected 45.12534186762472, diff=${Math.abs(put_itm-45.12534186762472)}`);
row('BS5: put(S=50,K=100,r=5%,σ=20%,T=1)', put_itm, '= 45.12534186762472 ±1e-8 ✓');

// ───────────────────────────────────────────────────────────────────────
// BS6: Price bounds
// ───────────────────────────────────────────────────────────────────────
// For any European call: S ≥ call ≥ max(S - K·e^{-rT}, 0)
const lb_call = Math.max(S_bs - K_bs * Math.exp(-r_bs * T_bs), 0);
assert(call_bs >= lb_call,
  `BS6: call = ${call_bs} < lower bound ${lb_call}`);
assert(call_bs <= S_bs,
  `BS6: call = ${call_bs} > S = ${S_bs}`);
row('BS6: lb = max(S-K·e^{-rT},0)', lb_call, `call=${call_bs.toPrecision(8)} ∈ [lb, S] ✓`);

// ───────────────────────────────────────────────────────────────────────
// BS7: Implied vol round-trip
// ───────────────────────────────────────────────────────────────────────
// Bisect to find sigma such that callBS(sigma) = call_bs
let iv_lo = 0.001, iv_hi = 10;
for (let i = 0; i < 100; i++) {
  const iv_mid = (iv_lo + iv_hi) / 2;
  if (callBS(S_bs, K_bs, r_bs, iv_mid, T_bs) < call_bs) iv_lo = iv_mid;
  else iv_hi = iv_mid;
}
const sigma_implied = (iv_lo + iv_hi) / 2;
assert(Math.abs(sigma_implied - 0.20) < 1e-6,
  `BS7: implied vol = ${sigma_implied}, expected 0.20, diff=${Math.abs(sigma_implied-0.20)}`);
row('BS7: implied vol round-trip', sigma_implied, '≈ 0.20 within 1e-6 ✓');

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

// ───────────────────────────────────────────────────────────────────────
// H1: ΔE formula correction
// ───────────────────────────────────────────────────────────────────────
// ΔE = s_old·h_i − |h_i| ≤ 0  (correct sign, plan had wrong sign)
// Verify all 4 cases with h_i = +2 and h_i = -2
console.log('  H1: ΔE = s_old·h_i - |h_i| ≤ 0 (correct formula)');
for (const h_i of [2, -2]) {
  for (const s_old of [1, -1]) {
    const deltaE = s_old * h_i - Math.abs(h_i);
    assert(deltaE <= 0, `H1: ΔE = s_old·h_i - |h_i| = ${deltaE} > 0 for h=${h_i}, s_old=${s_old}`);
  }
}
console.log('  H1: ΔE ≤ 0 for all 4 sign combinations ✓');

// ───────────────────────────────────────────────────────────────────────
// H2: Energy formula E = (1 - N·m²) / 2
// ───────────────────────────────────────────────────────────────────────
// m = overlap = (1/N)·Σ ξ_i·s_i (order parameter)
// Proof: E = -(1/2)·Σ_{i≠j} w_ij·s_i·s_j
//          = -(1/(2N))·[(Σ_i ξ_i·s_i)² - N]  (since ξ_i²=s_i²=1)
//          = -(N²m² - N)/(2N) = (1 - N·m²)/2 ✓
const m_stored_hop = xi.reduce((acc, v, i) => acc + xi[i] * v, 0) / N_hop;  // m=1
const E_formula_stored = (1 - N_hop * m_stored_hop ** 2) / 2;
assert(Math.abs(E_formula_stored - E_theory) < 1e-14,
  `H2: E formula for stored pattern = ${E_formula_stored}, theory = ${E_theory}`);

const m_orth_hop = xi_orth.reduce((acc, v, i) => acc + xi[i] * v, 0) / N_hop;
const E_formula_orth = (1 - N_hop * m_orth_hop ** 2) / 2;
// User-specified: +0.5
assert(Math.abs(E_formula_orth - 0.5) < 1e-14,
  `H2: E_orth formula = ${E_formula_orth}, expected 0.5`);
assert(Math.abs(E_orth - 0.5) < 1e-14,
  `H2: E_orth computed = ${E_orth}, expected 0.5`);
row('H2: E(orthogonal) = (1 - N·m²)/2 = 0.5', E_formula_orth, 'user-spec +0.5 ✓');

// ───────────────────────────────────────────────────────────────────────
// H3: h_i=0 behavior
// ───────────────────────────────────────────────────────────────────────
// When h_i=0, update must keep s_i unchanged (treat sign(0) = s_old)
// Verify: hopfieldUpdate uses h >= 0 ? 1 : -1, so h=0 → s_new=1
// This means if s_old=−1 and h=0, the update incorrectly sets s_new=+1.
// The correct implementation should keep s_old when h=0.
// The code above uses h>=0 → 1, which is a common but potentially wrong convention.
// Note this as a caution (not an assert failure — convention may be intentional).
console.log('  H3: h_i=0 convention: current code sets s_new=+1 when h_i=0.');
console.log('  H3: physically correct: keep s_old when h_i=0 (no driving force).');
console.log('  H3: for benchmarks, h_i=0 is a degenerate edge case; note for implementation.');

// ───────────────────────────────────────────────────────────────────────
// H4: P(bit error) = Φ(−√(N/(M−1)))
// ───────────────────────────────────────────────────────────────────────
// For N=1000, M=301: signal = √(1000/300) = √(10/3) ≈ 1.82574
// P(error) = Φ(-signal)
// User-specified: 0.0339446
const N_h4 = 1000, M_h4 = 301;
const signal_h4 = Math.sqrt(N_h4 / (M_h4 - 1));  // = sqrt(1000/300)
const p_error_h4 = Phi(-signal_h4);
console.log(`  H4: signal = √(N/(M-1)) = √(1000/300) = ${signal_h4.toPrecision(8)}`);
console.log(`  H4: P(error) = Φ(-signal) = ${p_error_h4.toPrecision(8)}`);
console.log(`  H4: user-specified = 0.0339446`);
assert(Math.abs(p_error_h4 - 0.0339446) < 1e-5,
  `H4: P(bit error) = ${p_error_h4}, user-specified 0.0339446, diff=${Math.abs(p_error_h4-0.0339446)}`);
row('H4: P(bit error) N=1000, M=301', p_error_h4, '≈ 0.0339446 within 1e-5 ✓');

// ───────────────────────────────────────────────────────────────────────
// H5: Exhaustive small N — E = (1 - N·m²)/2 for all 2^4 = 16 states
// ───────────────────────────────────────────────────────────────────────
let h5_ok = true;
for (let mask = 0; mask < 16; mask++) {
  const s_h5 = [0,1,2,3].map(bit => ((mask >> bit) & 1) ? 1 : -1);
  // Compute energy directly
  let E_direct = 0;
  for (let i = 0; i < N_hop; i++)
    for (let j = 0; j < N_hop; j++)
      E_direct -= 0.5 * W_hop[i][j] * s_h5[i] * s_h5[j];
  // Compute energy via formula
  const m_h5 = s_h5.reduce((acc, v, i) => acc + xi[i] * v, 0) / N_hop;
  const E_formula_h5 = (1 - N_hop * m_h5 ** 2) / 2;
  if (Math.abs(E_direct - E_formula_h5) > 1e-13) {
    h5_ok = false;
    console.log(`  H5 FAIL: state=${s_h5}, E_direct=${E_direct}, E_formula=${E_formula_h5}`);
  }
}
assert(h5_ok, 'H5: E=(1-Nm^2)/2 failed for some state in {±1}^4');
console.log('  H5: E = (1 - N·m²)/2 verified for ALL 16 states in {±1}^4 ✓');

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

// ───────────────────────────────────────────────────────────────────────
// RL1: Corridor environment — γ* threshold
// ───────────────────────────────────────────────────────────────────────
// Corridor: states 0,...,8. Start=2. Terminals: 0 (reward +1), 8 (reward +10).
// V*(start→0) = γ²·1  (2 steps from start=2 to terminal=0)
// V*(start→8) = γ⁶·10 (6 steps from start=2 to terminal=8)
// Equal when 10·γ⁶ = γ² → 10·γ⁴ = 1 → γ = 10^{-1/4}
// User-specified: γ* = 10^{-1/4} = 0.5623413251903491
const gamma_star = Math.pow(10, -0.25);
assert(Math.abs(gamma_star - 0.5623413251903491) < 1e-14,
  `RL1: gamma* = ${gamma_star}, user-specified 0.5623413251903491, diff=${Math.abs(gamma_star-0.5623413251903491)}`);
row('RL1: γ* = 10^{-1/4}', gamma_star, '= 0.5623413251903491 ✓');

// ───────────────────────────────────────────────────────────────────────
// RL2: Gambler's ruin P(reach 8 before 0) from start=2
// ───────────────────────────────────────────────────────────────────────
// Unbiased random walk, barriers at 0 and 8:
// P(reach 8 | start=2) = 2/8 = 1/4 (linear ruin formula)
const P_reach8 = 2 / 8;
assert(P_reach8 === 0.25, `RL2: P(reach 8)=2/8 should be 0.25`);
row('RL2: P(reach 8 before 0 | start=2) = 1/4', P_reach8, '= 0.25 algebraic ✓');

// ───────────────────────────────────────────────────────────────────────
// RL3: Optimal V*(start) at γ > γ*
// ───────────────────────────────────────────────────────────────────────
// For γ=0.9 > γ* = 10^{-1/4}: prefer +10 terminal
// V*(start=2, via +10) = γ^6·10 = 0.9^6·10 = 0.531441·10 = 5.31441
const gamma_rl3 = 0.9;
const V_via10 = gamma_rl3 ** 6 * 10;
const V_via1  = gamma_rl3 ** 2 * 1;
assert(V_via10 > V_via1, `RL3: V*(+10) should > V*(+1) for gamma=0.9`);
// User-specified: 5.31441
assert(Math.abs(V_via10 - 5.31441) < 1e-12,
  `RL3: V*(+10) = ${V_via10}, user-specified 5.31441, diff=${Math.abs(V_via10-5.31441)}`);
row('RL3: V*(γ=0.9, start=2, via +10) = 0.9^6·10', V_via10, '= 5.31441 ✓');
row('RL3: V*(γ=0.9, start=2, via +1)  = 0.9^2·1', V_via1, '= 0.81 < 5.31441');

// ───────────────────────────────────────────────────────────────────────
// RL4: γ below γ* → prefer +1
// ───────────────────────────────────────────────────────────────────────
const gamma_rl4 = 0.5;
const V_via1_low  = gamma_rl4 ** 2 * 1;
const V_via10_low = gamma_rl4 ** 6 * 10;
assert(V_via1_low > V_via10_low, `RL4: should prefer +1 for gamma=0.5`);
assert(Math.abs(V_via1_low - 0.25) < 1e-15,
  `RL4: V*(+1)=0.5^2·1=${V_via1_low}, expected 0.25`);
assert(Math.abs(V_via10_low - 0.15625) < 1e-15,
  `RL4: V*(+10)=0.5^6·10=${V_via10_low}, expected 0.15625`);
row('RL4: V*(γ=0.5, start=2, via +1)  = 0.5^2·1 = 0.25', V_via1_low, '✓');
row('RL4: V*(γ=0.5, start=2, via +10) = 0.5^6·10 = 0.15625', V_via10_low, '< 0.25 → prefer +1 ✓');

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

// ───────────────────────────────────────────────────────────────────────
// A1: GL quadrature for E[second-highest]
// ───────────────────────────────────────────────────────────────────────
// E[2nd-highest of N uniforms] = (N-1)/(N+1)
// = N(N-1)·∫₀¹ (v^{N-1} - v^N) dv
// Verify via 5-point Gauss-Legendre quadrature on [0,1]
// GL nodes/weights on [-1,1]:
const gl_t_ref = [0, 0.538469310105683, -0.538469310105683, 0.906179845938664, -0.906179845938664];
const gl_w_ref = [0.568888888888889, 0.478628670499366, 0.478628670499366, 0.236926885056189, 0.236926885056189];
// Transform to [0,1]: x=(1+t)/2, dx=dt/2
const gl_x = gl_t_ref.map(t => (1 + t) / 2);
const gl_w = gl_w_ref.map(w => w / 2);

for (const N_gl of [2, 3, 4]) {
  let I_gl = 0;
  for (let i = 0; i < 5; i++) {
    const v = gl_x[i];
    I_gl += gl_w[i] * (v ** (N_gl - 1) - v ** N_gl);
  }
  const E_2nd_gl = N_gl * (N_gl - 1) * I_gl;
  const E_2nd_exact = (N_gl - 1) / (N_gl + 1);
  assert(Math.abs(E_2nd_gl - E_2nd_exact) < 1e-13,
    `A1: GL E[2nd] N=${N_gl}: ${E_2nd_gl} vs exact ${E_2nd_exact}`);
  row(`A1: GL E[2nd-highest] N=${N_gl}`, E_2nd_gl, `exact=${E_2nd_exact} ✓`);
}
console.log('  A1: 5-point GL quadrature verifies E[2nd-highest] = (N-1)/(N+1) ✓');

// ───────────────────────────────────────────────────────────────────────
// A2: argmax expected payoff
// ───────────────────────────────────────────────────────────────────────
// N=2, v=0.8: BNE bid b=0.4
// Expected payoff = (v-b)·P(win) = (0.8-0.4)·P(V_other < 0.4) = 0.4·0.4 = 0.16
const v_a2 = 0.8;
const b_a2_N2 = 0.4;
const payoff_bne_N2 = (v_a2 - b_a2_N2) * b_a2_N2;  // (v-b)·b for uniform[0,1]
assert(Math.abs(payoff_bne_N2 - 0.16) < 1e-15,
  `A2: payoff_BNE_N2 = ${payoff_bne_N2}, expected 0.16`);
// Verify BNE is optimal: deviations to 0.3 or 0.5 are worse
const payoff_03 = (v_a2 - 0.3) * 0.3;  // = 0.5 * 0.3 = 0.15
const payoff_05 = (v_a2 - 0.5) * 0.5;  // = 0.3 * 0.5 = 0.15
assert(payoff_bne_N2 >= payoff_03, `A2: BNE payoff 0.16 should >= payoff(0.3)=0.15`);
assert(payoff_bne_N2 >= payoff_05, `A2: BNE payoff 0.16 should >= payoff(0.5)=0.15`);
row('A2: payoff_BNE(v=0.8,N=2) = 0.16', payoff_bne_N2, '>= payoff(0.3)=0.15 and payoff(0.5)=0.15 ✓');

// N=3, v=0.8: BNE bid b=2/3·0.8 = 8/15
// Expected payoff = (v-b)·P(both others < b) = (v-b)·b^2
// = (12/15 - 8/15)·(8/15)^2 = (4/15)·(64/225) = 256/3375
const b_a2_N3 = 8 / 15;
const payoff_bne_N3 = (v_a2 - b_a2_N3) * b_a2_N3 ** 2;
assert(Math.abs(payoff_bne_N3 - 256 / 3375) < 1e-14,
  `A2: payoff_N3 = ${payoff_bne_N3}, 256/3375 = ${256/3375}, diff=${Math.abs(payoff_bne_N3 - 256/3375)}`);
row('A2: payoff_BNE(v=0.8,N=3) = 256/3375', payoff_bne_N3, `≈ ${(256/3375).toPrecision(6)} ✓`);

// ───────────────────────────────────────────────────────────────────────
// A3: MC SE bound (note only)
// ───────────────────────────────────────────────────────────────────────
// With 100000 trials: SE ≤ sqrt(1/(3·100000)) ≈ 0.00183
// 4·SE ≈ 0.0073 (tolerance for MC assertions)
const mc_se_bound = Math.sqrt(1 / (3 * 100000));
row('A3: MC SE bound (n=100000)', mc_se_bound, '≤ 0.00183; 4·SE ≈ 0.0073');
console.log(`  A3: For MC verification, use tolerance 4·SE ≈ ${(4*mc_se_bound).toPrecision(3)}`);

// ═══════════════════════════════════════════════════════════════════════
// 7. VOTING-SYSTEMS (economics/voting/voting-systems)
//    field id: social-choice
// ═══════════════════════════════════════════════════════════════════════
sec('7. VOTING-SYSTEMS (field: social-choice)');

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

// ───────────────────────────────────────────────────────────────────────
// V2: Exhaustive cycle count — 3-voter, 3-alt profiles
// ───────────────────────────────────────────────────────────────────────
// All 6 orderings for 3 alternatives A=0, B=1, C=2:
// pref = ordered array [most preferred, ..., least preferred]
const ORDERINGS = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];

function hasCycle(profile) {
  const n = profile.length;
  const beats = [[0,0,0],[0,0,0],[0,0,0]];
  for (const pref of profile) {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if (i !== j && pref.indexOf(i) < pref.indexOf(j)) beats[i][j]++;
    }
  }
  const maj = (i, j) => beats[i][j] > n / 2;
  return (maj(0,1) && maj(1,2) && maj(2,0)) || (maj(0,2) && maj(2,1) && maj(1,0));
}

let cycleCount = 0;
for (let v1 = 0; v1 < 6; v1++) for (let v2 = 0; v2 < 6; v2++) for (let v3 = 0; v3 < 6; v3++) {
  if (hasCycle([ORDERINGS[v1], ORDERINGS[v2], ORDERINGS[v3]])) cycleCount++;
}
assert(cycleCount === 12, `V2: Condorcet cycles in 216 profiles: ${cycleCount}, expected 12`);
row('V2: Condorcet cycles in 3-voter 3-alt profiles', cycleCount, '= 12 out of 216 ✓');

// ───────────────────────────────────────────────────────────────────────
// V3: Borda winner cannot be Condorcet loser (3 alts) — exhaustive proof
// ───────────────────────────────────────────────────────────────────────
let counterexampleFound = false;
for (let v1 = 0; v1 < 6; v1++) for (let v2 = 0; v2 < 6; v2++) for (let v3 = 0; v3 < 6; v3++) {
  const profile3 = [ORDERINGS[v1], ORDERINGS[v2], ORDERINGS[v3]];
  const n3 = 3;
  // Borda scores
  const borda3 = [0, 0, 0];
  for (const pref of profile3) {
    for (let a = 0; a < 3; a++) borda3[a] += (2 - pref.indexOf(a));
  }
  // Pairwise
  const beats3 = [[0,0,0],[0,0,0],[0,0,0]];
  for (const pref of profile3) {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if (i !== j && pref.indexOf(i) < pref.indexOf(j)) beats3[i][j]++;
    }
  }
  // Find Condorcet loser: loses all pairwise comparisons
  for (let a = 0; a < 3; a++) {
    const isLoser = [0, 1, 2].filter(b => b !== a).every(b => beats3[b][a] > n3 / 2);
    if (isLoser) {
      const maxBorda = Math.max(...borda3);
      if (borda3[a] === maxBorda) { counterexampleFound = true; }
    }
  }
}
assert(!counterexampleFound, 'V3: Borda winner cannot be Condorcet loser for 3 alternatives');
console.log('  V3: Borda winner ≠ Condorcet loser (3 alts): verified exhaustively over all 216 profiles ✓');

// ───────────────────────────────────────────────────────────────────────
// V4: 3xABC + 2xBCA profile
// ───────────────────────────────────────────────────────────────────────
// 3 voters: A>B>C = [0,1,2]
// 2 voters: B>C>A = [1,2,0]
const prefs_v4 = [[0,1,2],[0,1,2],[0,1,2],[1,2,0],[1,2,0]];
const borda_v4_A = bordaScore(0, prefs_v4, 3);
const borda_v4_B = bordaScore(1, prefs_v4, 3);
const borda_v4_C = bordaScore(2, prefs_v4, 3);
// Expected: A=3*2+2*0=6, B=3*1+2*2=7, C=3*0+2*1=2
assert(borda_v4_A === 6, `V4: borda_A = ${borda_v4_A}, expected 6`);
assert(borda_v4_B === 7, `V4: borda_B = ${borda_v4_B}, expected 7`);
assert(borda_v4_C === 2, `V4: borda_C = ${borda_v4_C}, expected 2`);
// Pairwise
const pf4_A_vs_B = pairCount(0, 1, prefs_v4);
const pf4_A_vs_C = pairCount(0, 2, prefs_v4);
const pf4_B_vs_C = pairCount(1, 2, prefs_v4);
assert(pf4_A_vs_B === 3, `V4: A vs B: ${pf4_A_vs_B}, expected 3`);
assert(pf4_A_vs_C === 3, `V4: A vs C: ${pf4_A_vs_C}, expected 3`);
assert(pf4_B_vs_C === 5, `V4: B vs C: ${pf4_B_vs_C}, expected 5`);
// Plurality
const plur_v4 = [0, 0, 0];
prefs_v4.forEach(p => plur_v4[p[0]]++);
assert(plur_v4[0] === 3, `V4: plurality A = ${plur_v4[0]}, expected 3`);
assert(plur_v4[1] === 2, `V4: plurality B = ${plur_v4[1]}, expected 2`);
assert(plur_v4[2] === 0, `V4: plurality C = ${plur_v4[2]}, expected 0`);
// A is Condorcet winner (beats B 3:2, beats C 3:2), Borda winner is B, Plurality winner is A
row('V4: Borda A=6, B=7 (Borda winner=B)', borda_v4_B, '> borda_A=6');
row('V4: Plurality winner=A (3 first-place)', plur_v4[0], '> plur_B=2');
row('V4: Condorcet winner=A (beats B 3:2)', pf4_A_vs_B, ': A is Condorcet winner');
console.log('  V4: Borda picks B; Plurality and Condorcet pick A — shows Borda ≠ Plurality/Condorcet ✓');

// ───────────────────────────────────────────────────────────────────────
// V5: IIA violation note
// ───────────────────────────────────────────────────────────────────────
// Borda violates Independence of Irrelevant Alternatives (IIA).
// Example: 3xABC + 2xBCA → Borda: A=6, B=7 (B wins over A).
// The relative Borda ranking of A vs B depends on how C is ranked.
// If all voters ranked C last (ignoring C entirely): A gets 3 pts, B gets 2 pts → A wins.
// Adding C changes the Borda ranking of A vs B — IIA failure.
console.log('  V5: IIA failure — Borda ranking of A vs B changed by presence of C.');
console.log('     (3xABC+2xBCA: B wins Borda; removing C: A wins. See V4 profile.)');

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
butler-volmer       | 2·sinh(ln10)=9.9; log10(9.9)=0.9956... | algebraic
butler-volmer       | Predict3: η_1pct=V_T·√0.24≈12.57mV     | algebraic (plan said 6.3mV — wrong)
options-pricing     | d1=0.35, d2=0.15 (exact ATM)           | algebraic
options-pricing     | call=10.450583572185565 ±1e-12          | algebraic+cited
options-pricing     | put(S=50)=45.12534186762472 ±1e-8       | algebraic
options-pricing     | σ→∞: call→S; σ→0: call→S-K·e^{-rT}    | algebraic
options-pricing     | implied vol round-trip ≈0.20 within 1e-6| numerical
hopfield            | w_01=1/N; E_stored=-(N-1)/2=-1.5       | algebraic
hopfield            | recall from 1-bit error (N=4)           | algebraic
hopfield            | E=(1-Nm²)/2 verified for all 16 states  | algebraic
hopfield            | P(bit error)≈0.0339446 N=1000,M=301     | algebraic
reinforcement-learn | V*(s0)=1 (2-state); TD-error=0 at Q*   | algebraic
reinforcement-learn | γ*=10^{-1/4}=0.5623...; V*(γ=0.9)=5.31441 | algebraic
auctions            | b*(v,N=2)=v/2; E[rev]=1/3              | algebraic
auctions            | GL quadrature E[2nd-highest] N=2,3,4   | algebraic+numerical
auctions            | payoff(v=0.8,N=3)=256/3375             | algebraic
voting-systems      | Condorcet cycle (3 voters, 3 alts)      | algebraic
voting-systems      | 12 cyclic profiles out of 216           | exhaustive
voting-systems      | Borda winner ≠ Condorcet loser (3 alts) | exhaustive
voting-systems      | 3xABC+2xBCA: Borda=B, Condorcet=A      | algebraic
`);

console.log('\n=== ALL PHASE 10 ANCHORS PASS ===');
