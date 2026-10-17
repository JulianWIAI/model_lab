/**
 * anchors-phase10-lc.mjs — standalone LC-oscillator formula verification
 *
 * Task: verify all LC-oscillator formulas for R=10Ω, L=1mH, C=1μF
 *       using only first-principles derivations.
 *
 * R8 flag caught: the task brief claimed Q≈10 for these parameters,
 *   but Q = √(L/C)/R = √1000/10 = √10 ≈ 3.162 (not 10).
 *   Q=10 would require R ≈ 3.16 Ω.
 */

function assert(cond, msg) {
  if (!cond) throw new Error(`VERIFICATION FAILED: ${msg}`);
}

// Parameters
const R = 10;       // Ω
const L = 1e-3;     // H
const C = 1e-6;     // F

console.log('=== LC Oscillator Formula Verification ===');
console.log(`R=${R}Ω  L=${L*1e3}mH  C=${C*1e6}μF\n`);

// 1. Neper frequency
const alpha = R / (2 * L);
console.log(`α = R/(2L) = ${alpha} rad/s`);
assert(alpha === 5000, `α should be 5000`);

// 2. Natural frequency
const omega0 = 1 / Math.sqrt(L * C);
console.log(`ω₀ = 1/√(LC) = ${omega0} rad/s`);
// Verify: ω₀ = 10⁴·√10
assert(Math.abs(omega0 / (1e4 * Math.sqrt(10)) - 1) < 1e-14, `ω₀ ≠ 10⁴√10`);

// 3. Quality factor — THREE equivalent forms
const Q_form1 = omega0 / (2 * alpha);           // ω₀/(2α)
const Q_form2 = Math.sqrt(L / C) / R;           // √(L/C)/R
const Q_form3 = 1 / (R * Math.sqrt(C / L));     // 1/(R√(C/L))
console.log(`Q = ω₀/(2α)    = ${Q_form1}`);
console.log(`Q = √(L/C)/R   = ${Q_form2}`);
console.log(`Q = 1/(R√(C/L))= ${Q_form3}`);
// All three forms agree:
assert(Math.abs(Q_form1 / Q_form2 - 1) < 1e-14, `Q forms 1,2 disagree`);
assert(Math.abs(Q_form1 / Q_form3 - 1) < 1e-14, `Q forms 1,3 disagree`);
// Q = √10 exactly for these parameters (L/C = 1000, R = 10)
const Q_exact = Math.sqrt(10);
assert(Math.abs(Q_form1 / Q_exact - 1) < 1e-14, `Q ≠ √10`);
console.log(`Q = √10 = ${Q_exact} (EXACT for R=10, L=1mH, C=1μF)`);
// R8 FLAG: brief claimed Q≈10 but Q=√10≈3.16
console.log(`R8 FLAG: Brief said Q≈10 — INCORRECT. Q = √10 ≈ 3.162.`);
console.log(`  For Q=10: R must be √(L/C)/10 = √1000/10 = √10 ≈ 3.162 Ω\n`);

// 4. Three distinct frequencies
const omegad = Math.sqrt(omega0 ** 2 - alpha ** 2);         // damped natural
const omegaC = Math.sqrt(omega0 ** 2 - 2 * alpha ** 2);     // V_C peak (series)
// Verify ωd = ω₀·√(1 − 1/(4Q²)):
const omegad_form2 = omega0 * Math.sqrt(1 - 1 / (4 * Q_exact ** 2));
assert(Math.abs(omegad / omegad_form2 - 1) < 1e-14, `ωd forms disagree`);
// Verify ωC = ω₀·√(1 − 1/(2Q²)):
const omegaC_form2 = omega0 * Math.sqrt(1 - 1 / (2 * Q_exact ** 2));
assert(Math.abs(omegaC / omegaC_form2 - 1) < 1e-14, `ωC forms disagree`);

console.log(`ωd (damped natural)  = √(ω₀²−α²)    = ${omegad} rad/s = 10⁴√9.75`);
console.log(`ω₀ (current peak)    = ω₀             = ${omega0} rad/s = 10⁴√10`);
console.log(`ωC (V_C peak)        = √(ω₀²−2α²)   = ${omegaC} rad/s = 10⁴√9.5`);

// Verify algebraic forms:
assert(Math.abs(omegad / (1e4 * Math.sqrt(9.75)) - 1) < 1e-14, `ωd ≠ 10⁴√9.75`);
assert(Math.abs(omegaC / (1e4 * Math.sqrt(9.5)) - 1) < 1e-14, `ωC ≠ 10⁴√9.5`);

// Ordering:
assert(omegaC < omegad, `ωC_peak < ωd violated`);
assert(omegad < omega0, `ωd < ω₀ violated`);
console.log(`Ordering: ωC_peak < ωd < ω₀ ✓ (${omegaC.toFixed(0)} < ${omegad.toFixed(0)} < ${omega0.toFixed(0)})\n`);

// 5. Bandwidth = R/L (EXACTLY, algebraic proof)
// Half-power frequencies satisfy ωL − 1/(ωC) = ±R
// ω± = −α ± √(α²+ω₀²) ... but we need positive roots:
// ω+ = +α + √(α²+ω₀²)  [upper half-power]
// ω− = −α + √(α²+ω₀²)  [lower half-power]
// Δω = ω+ − ω− = 2α = R/L
const omega_plus  = alpha + Math.sqrt(alpha ** 2 + omega0 ** 2);
const omega_minus = -alpha + Math.sqrt(alpha ** 2 + omega0 ** 2);
const BW = omega_plus - omega_minus;
assert(Math.abs(BW / (R / L) - 1) < 1e-12, `BW ≠ R/L: ${BW} vs ${R/L}`);
// BW = 2α exactly (algebraic), but sqrt introduces floating point rounding
assert(Math.abs(BW - 10000) < 1e-8, `BW should be 10000 rad/s; got ${BW}`);
console.log(`Bandwidth Δω = R/L = 2α = ${BW} rad/s (EXACTLY ${R/L} rad/s)`);
console.log(`  Algebraic proof: ω± = ±α + √(α²+ω₀²) → Δω = 2α ✓\n`);

// 6. Critical damping: R_crit = 2√(L/C)
// Condition: discriminant of Ls² + Rs + 1/C = 0 equals zero
// (R/2L)² = 1/LC → R = 2L/√(LC) = 2√(L/C)
const R_crit = 2 * Math.sqrt(L / C);
// = 2√1000 = 20√10
assert(Math.abs(R_crit / (20 * Math.sqrt(10)) - 1) < 1e-14, `R_crit ≠ 20√10`);
console.log(`R_crit = 2√(L/C) = 20√10 = ${R_crit} Ω (our R=${R}Ω < R_crit → underdamped ✓)\n`);

// 7. Poles: s = −α ± j·ωd
// Verify L·s² + R·s + 1/C = 0 algebraically:
// At s = -α + jωd: s² = α²−ωd² − 2jαωd = α²−(ω₀²−α²) − 2jαωd = 2α²−ω₀² − 2jαωd
// L·s² = L(2α²−ω₀²) − 2jLαωd
// R·s = −Rα + jRωd
// 1/C = Lω₀²
// Real: L(2α²−ω₀²) − Rα + Lω₀² = 2Lα² − Rα = R²/(2L) − R·R/(2L) = 0 ✓
// Imag: −2Lαωd + Rωd = ωd(−2Lα + R) = ωd·0 = 0 ✓ (since α=R/2L → R=2Lα)
const s_re = -alpha, s_im = omegad;
const s2_re = s_re ** 2 - s_im ** 2;
const s2_im = 2 * s_re * s_im;
const char_re = L * s2_re + R * s_re + 1 / C;
const char_im = L * s2_im + R * s_im;
assert(Math.abs(char_re) < 1e-6, `Char eq real part ≠ 0: ${char_re}`);
assert(Math.abs(char_im) < 1e-6, `Char eq imag part ≠ 0: ${char_im}`);
console.log(`Poles s = −α ± jωd verified (char eq: real=${char_re.toExponential(2)}, imag=${char_im})\n`);

// 8. Step response formula (underdamped, V₀=1)
// V_C(t) = 1 − e^{−αt}[cos(ωd·t) + (α/ωd)·sin(ωd·t)]
function Vc_step(t) {
  return 1 - Math.exp(-alpha * t) * (Math.cos(omegad * t) + (alpha / omegad) * Math.sin(omegad * t));
}
// Cross-check via RK4
function rk4Step(y, dt) {
  const f = ([vC, I]) => [I / C, (1 - R * I - vC) / L];
  const k1 = f(y);
  const y2 = y.map((v, i) => v + dt / 2 * k1[i]);
  const k2 = f(y2);
  const y3 = y.map((v, i) => v + dt / 2 * k2[i]);
  const k3 = f(y3);
  const y4 = y.map((v, i) => v + dt * k3[i]);
  const k4 = f(y4);
  return y.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

const t_test = Math.PI / (2 * omegad);  // quarter period ≈ 50 μs
const Vc_formula = Vc_step(t_test);
const N_steps = 5000;
const dt_rk4 = t_test / N_steps;
let y = [0, 0];
for (let i = 0; i < N_steps; i++) y = rk4Step(y, dt_rk4);
const Vc_rk4 = y[0];
const rk4_err = Math.abs(Vc_rk4 / Vc_formula - 1);
assert(rk4_err < 1e-9, `Step response: RK4 vs formula rel err=${rk4_err}`);
console.log(`Step response V_C(t=π/(2ωd)):`);
console.log(`  Formula: ${Vc_formula}`);
console.log(`  RK4 (${N_steps} steps): ${Vc_rk4}`);
console.log(`  Rel error: ${rk4_err.toExponential(2)} < 1e-9 ✓`);
console.log(`  t_test = ${(t_test * 1e6).toFixed(2)} μs\n`);

// ═══════════════════════════════════════════════════════════════════════
// NEW SECTION A: RK4 halving ratio test
// ═══════════════════════════════════════════════════════════════════════
console.log('--- A. RK4 halving ratio test ---');
// R8 FLAG: The spec says to test at t_qtr with N=5000 and N=10000, but at t_qtr
// both errors are at machine epsilon (~1e-15), giving ratio ~1.4, NOT [12,20].
// RK4 order-4 halving (ratio~2^4=16) only observable above the rounding floor.
// At t=10*t_qtr: err_5000~6.6e-13, err_10000~4.2e-14, ratio~15.6 ∈ [12,20]. ✓
// We use t=10*t_qtr for the halving test and note this R8 flag.
// R8 FLAG: spec said "at t_qtr" but t_qtr with N=5000/10000 gives ratio ~1.4
// (machine-epsilon-dominated), not [12,20]. Using t=10*t_qtr instead.
console.log('  R8 FLAG: spec said to use t_qtr but at t_qtr both err_5000 and');
console.log('  err_10000 are at machine epsilon (~1e-15); ratio ~1.4, not [12,20].');
console.log('  Using t=10*t_qtr where errors are above rounding floor.');

const t_halving = 10 * t_test;  // use 10*t_qtr so errors are above machine epsilon

function runRK4(t_end, N) {
  let s = [0, 0];
  const dt = t_end / N;
  for (let i = 0; i < N; i++) s = rk4Step(s, dt);
  return s[0];
}

const formula_at_thalving = Vc_step(t_halving);
const rk4_5k  = runRK4(t_halving, 5000);
const rk4_10k = runRK4(t_halving, 10000);
const err_5000  = Math.abs(rk4_5k  - formula_at_thalving);
const err_10000 = Math.abs(rk4_10k - formula_at_thalving);
const halving_ratio = err_5000 / err_10000;
console.log(`  err_5000  = ${err_5000.toExponential(4)}`);
console.log(`  err_10000 = ${err_10000.toExponential(4)}`);
console.log(`  ratio = err_5000/err_10000 = ${halving_ratio.toFixed(4)} (expected ~16 = 2^4 for RK4)`);
assert(halving_ratio >= 12 && halving_ratio <= 20,
  `RK4 halving ratio ${halving_ratio} not in [12,20]; RK4 order-4 expected ~16`);
console.log('  RK4 halving ratio in [12,20] ✓\n');

// ═══════════════════════════════════════════════════════════════════════
// NEW SECTION B: Golden section search for |V_C(jω)| max gain
// ═══════════════════════════════════════════════════════════════════════
console.log('--- B. Golden section search for |H_C(ω)| max gain ---');
// |H_C(ω)| = ω₀² / sqrt((ω₀²−ω²)² + (Rω/L)²)
//           = ω₀² / sqrt((ω₀²−ω²)² + (2αω)²)
// Peak occurs at ωC = sqrt(ω₀²−2α²) = 10⁴√9.5 (verified above)
// At peak: gain = Q / sqrt(1 − 1/(4Q²)) = √10 / sqrt(1 − 1/40) = sqrt(400/39)
// = sqrt(10 * 40/39) = sqrt(400/39)

function Hc_gain(w) {
  return omega0 ** 2 / Math.sqrt((omega0 ** 2 - w ** 2) ** 2 + (2 * alpha * w) ** 2);
}

function goldenSection(f, lo, hi, tol) {
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = lo, b = hi;
  let c = b - phi * (b - a);
  let d = a + phi * (b - a);
  while ((b - a) > tol) {
    if (f(c) < f(d)) { a = c; } else { b = d; }
    c = b - phi * (b - a);
    d = a + phi * (b - a);
  }
  return (a + b) / 2;
}

// R8 FLAG: the spec says "golden section finds minimum, so negate gain to find maximum".
// However, the goldenSection code as written (if f(c)<f(d) → a=c; else b=d) is REVERSED
// from the standard minimum convention (which would be b=d when f(c)<f(d)).
// This means the spec's goldenSection code actually finds the MAXIMUM of f directly.
// Passing -Hc_gain would find the minimum (i.e., endpoints), NOT the gain peak.
// Using Hc_gain directly (without negation) to find the maximum.
// R8 FLAG: spec said "negate gain to find maximum" but spec's code finds max directly.
const omega_star = goldenSection(Hc_gain, 0.001, 2 * omega0, 1e-6);
const gain_peak = Hc_gain(omega_star);
console.log(`  ω* (golden section) = ${omega_star.toFixed(4)} rad/s`);
console.log(`  omegaC (algebraic)  = ${omegaC.toFixed(4)} rad/s`);
console.log(`  |ω* − omegaC| = ${Math.abs(omega_star - omegaC).toExponential(3)}`);
assert(Math.abs(omega_star - omegaC) < 1e-3, `golden section ω* vs algebraic omegaC: ${Math.abs(omega_star - omegaC)}`);

// Exact gain = sqrt(400/39)
const gain_exact = Math.sqrt(400 / 39);
console.log(`  gain at ω* = ${gain_peak.toPrecision(15)}`);
console.log(`  sqrt(400/39) = ${gain_exact.toPrecision(15)}`);
console.log(`  user-specified = 3.2025630761`);
// Verify gain matches user-specified to 1e-8
assert(Math.abs(gain_peak - 3.2025630761) < 1e-8,
  `gain at peak ${gain_peak} differs from user-specified 3.2025630761 by ${Math.abs(gain_peak - 3.2025630761)}`);
// Verify exact formula agrees
assert(Math.abs(gain_exact - 3.2025630761) < 1e-8,
  `sqrt(400/39) = ${gain_exact} differs from user spec 3.2025630761 by ${Math.abs(gain_exact - 3.2025630761)}`);
console.log('  Max gain = sqrt(400/39) = 3.2025630761 ✓\n');

// ═══════════════════════════════════════════════════════════════════════
// NEW SECTION C: Half-power frequencies by bisection (IMPEDANCE half-power)
// ═══════════════════════════════════════════════════════════════════════
console.log('--- C. Half-power frequencies (impedance-based) ---');
// R8 FLAG: The spec says to bisect where |H_C(ω)|² = G_peak²/2 and then assert
// omega_lo*omega_hi ≈ ω₀² and omega_hi-omega_lo ≈ R/L (within 1e-8 relative).
// However, these properties do NOT hold for the |H_C| half-power points:
//   - For |H_C| half-power: product ≈ 8.97e8 (not 1e9 = ω₀²), rel diff ≈ 10.3%
//   - For |H_C| half-power: BW ≈ 10274 (not 10000 = R/L), rel diff ≈ 2.7%
// The product and BW identities ONLY hold for the impedance half-power frequencies:
//   ω± = ±α + √(α²+ω₀²)  →  ω₊·ω₋ = ω₀² exactly, ω₊−ω₋ = 2α = R/L exactly.
// We use the correct impedance half-power freqs and flag the spec error.
console.log('  R8 FLAG: spec claims omega_lo*omega_hi=omega0^2 and BW=R/L for');
console.log('  |H_C|² half-power points. INCORRECT: those identities only hold for');
console.log('  impedance half-power freq (omega_pm = +-alpha + sqrt(alpha^2+omega0^2)).');
console.log('  Using impedance half-power freqs for the product and BW assertions.');

// Impedance half-power frequencies (where |Z(ω)|² = 2·R² i.e. gain²=1/2 of peak)
// ω± = ±α + √(α²+ω₀²)
const omega_hp_lo = -alpha + Math.sqrt(alpha ** 2 + omega0 ** 2);
const omega_hp_hi =  alpha + Math.sqrt(alpha ** 2 + omega0 ** 2);

console.log(`  omega_hp_lo = ${omega_hp_lo.toFixed(4)} rad/s`);
console.log(`  omega_hp_hi = ${omega_hp_hi.toFixed(4)} rad/s`);
console.log(`  product = ${(omega_hp_lo * omega_hp_hi).toExponential(10)}`);
console.log(`  ω₀²    = ${(omega0 ** 2).toExponential(10)}`);
console.log(`  diff   = ${(omega_hp_hi - omega_hp_lo).toFixed(4)}`);
console.log(`  R/L    = ${(R / L).toFixed(4)}`);

assert(Math.abs(omega_hp_lo * omega_hp_hi / omega0 ** 2 - 1) < 1e-8,
  `omega_lo*omega_hi / omega0^2 - 1 = ${Math.abs(omega_hp_lo * omega_hp_hi / omega0 ** 2 - 1)}`);
assert(Math.abs((omega_hp_hi - omega_hp_lo) / (R / L) - 1) < 1e-8,
  `(omega_hi - omega_lo)/(R/L) - 1 = ${Math.abs((omega_hp_hi - omega_hp_lo) / (R / L) - 1)}`);
console.log('  omega_lo * omega_hi = omega0^2 (within 1e-8 relative) ✓');
console.log('  omega_hi - omega_lo = R/L (within 1e-8 relative) ✓\n');

// For completeness, also compute the |H_C| half-power points (where gain^2 = G_peak^2/2)
// and show they do NOT satisfy those identities
function bisectRoot(f, lo, hi, tol) {
  let a = lo, b = hi;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (f(a) * f(m) < 0) b = m; else a = m;
    if (b - a < tol) break;
  }
  return (a + b) / 2;
}
const G_peak_sq = gain_peak ** 2;
const omega_hc_lo = bisectRoot(w => Hc_gain(w) ** 2 - G_peak_sq / 2, 1, omegaC - 1, 0.001);
const omega_hc_hi = bisectRoot(w => Hc_gain(w) ** 2 - G_peak_sq / 2, omegaC + 1, 3 * omega0, 0.001);
console.log(`  |H_C| half-power: omega_lo=${omega_hc_lo.toFixed(0)}, omega_hi=${omega_hc_hi.toFixed(0)}`);
console.log(`  |H_C| half-power product rel err = ${(Math.abs(omega_hc_lo*omega_hc_hi/omega0**2-1)).toFixed(4)} (NOT ~0)`);
console.log(`  |H_C| half-power BW rel err      = ${(Math.abs((omega_hc_hi-omega_hc_lo)/(R/L)-1)).toFixed(4)} (NOT ~0)\n`);

// ═══════════════════════════════════════════════════════════════════════
// NEW SECTION D: Critical step response
// ═══════════════════════════════════════════════════════════════════════
console.log('--- D. Critical damping step response ---');
// At R = R_crit = 20√10: critical damping, α_crit = R_crit/(2L) = ω₀
// V_C_crit(t) = 1 − (1 + α_crit·t)·e^{−α_crit·t}
const alpha_crit = R_crit / (2 * L);
assert(Math.abs(alpha_crit / omega0 - 1) < 1e-13,
  `alpha_crit should equal omega0; got alpha_crit=${alpha_crit}, omega0=${omega0}`);
console.log(`  alpha_crit = ${alpha_crit.toPrecision(15)} (= ω₀ = ${omega0.toPrecision(15)})`);

const t_crit_test = 1 / alpha_crit;  // t = 1/α_crit
const Vc_crit_val = 1 - (1 + alpha_crit * t_crit_test) * Math.exp(-alpha_crit * t_crit_test);
// = 1 − 2·e^{−1} = 1 − 2/e
const expected_crit = 1 - 2 / Math.E;

console.log(`  V_C_crit(1/α_crit) = ${Vc_crit_val.toPrecision(17)}`);
console.log(`  1 − 2/e            = ${expected_crit.toPrecision(17)}`);
console.log(`  user-specified     = 0.26424111765711533`);

// Verify formula matches 1-2/e exactly (to floating point precision)
assert(Math.abs(Vc_crit_val - expected_crit) < 1e-14,
  `V_C_crit(1/alpha_crit) - (1-2/e) = ${Math.abs(Vc_crit_val - expected_crit)}`);
// Verify 1-2/e matches user-specified 0.26424111765711533 (within 1e-12 relative)
assert(Math.abs(expected_crit / 0.26424111765711533 - 1) < 1e-12,
  `1-2/e = ${expected_crit} vs user-specified 0.26424111765711533, rel diff = ${Math.abs(expected_crit / 0.26424111765711533 - 1)}`);
console.log('  V_C_crit(1/alpha_crit) = 1 - 2/e = 0.26424111765711533 ✓\n');

// ═══════════════════════════════════════════════════════════════════════
// NEW SECTION E: Overdamped regime
// ═══════════════════════════════════════════════════════════════════════
console.log('--- E. Overdamped step response ---');
// At R = 2*R_crit: overdamped
const R_over = 2 * R_crit;
const alpha_over = R_over / (2 * L);
const omega0sq = omega0 ** 2;
assert(alpha_over ** 2 > omega0sq,
  `overdamped condition failed: alpha_over^2=${alpha_over**2} should > omega0^2=${omega0sq}`);

const s1 = -alpha_over + Math.sqrt(alpha_over ** 2 - omega0sq);  // negative
const s2 = -alpha_over - Math.sqrt(alpha_over ** 2 - omega0sq);  // more negative

console.log(`  R_over = ${R_over.toFixed(4)} Ω  alpha_over = ${alpha_over.toFixed(4)} rad/s`);
console.log(`  s1 = ${s1.toFixed(4)} rad/s`);
console.log(`  s2 = ${s2.toFixed(4)} rad/s`);
assert(s1 < 0, `s1 should be negative; got ${s1}`);
assert(s2 < s1, `s2 should be more negative than s1; got s2=${s2}, s1=${s1}`);

// V_C_over(t) = 1 − [s₂·e^{s₁t} − s₁·e^{s₂t}] / (s₂ − s₁)
function Vc_over(t) {
  return 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
}

// Verify V_C_over(0) = 0 exactly
const Vc_over_0 = Vc_over(0);
console.log(`  V_C_over(0) = ${Vc_over_0} (should be 0)`);
assert(Math.abs(Vc_over_0) < 1e-14,
  `V_C_over(0) = ${Vc_over_0}, should be 0 to 1e-14`);
console.log('  V_C_over(0) = 0 ✓');

// Verify V_C_over(∞) → 1 (use t = 10/|s1| as proxy for infinity)
const t_inf = 10 * (1 / Math.abs(s1));
const Vc_over_inf = Vc_over(t_inf);
console.log(`  V_C_over(10/|s1|) = ${Vc_over_inf} (should be ≈ 1)`);
assert(Math.abs(Vc_over_inf - 1) < 1e-3,
  `V_C_over(t_inf) = ${Vc_over_inf}, should be ≈ 1 within 1e-3`);
console.log('  V_C_over(∞) → 1 ✓\n');

// ═══════════════════════════════════════════════════════════════════════
// NEW SECTION F: Continuity at R_crit
// ═══════════════════════════════════════════════════════════════════════
console.log('--- F. Continuity at R_crit ---');
// Underdamped formula (R slightly below R_crit) should approach critically damped formula
const R_near = R_crit * (1 - 1e-6);
const alpha_near = R_near / (2 * L);
const omegad_near = Math.sqrt(Math.abs(omega0 ** 2 - alpha_near ** 2));
const t_pi_2_om0 = Math.PI / (2 * omega0);  // test time

function Vc_underdamped_near(t) {
  return 1 - Math.exp(-alpha_near * t) * (Math.cos(omegad_near * t) + (alpha_near / omegad_near) * Math.sin(omegad_near * t));
}
function Vc_crit_fn(t) {
  return 1 - (1 + alpha_crit * t) * Math.exp(-alpha_crit * t);
}

const Vc_ud = Vc_underdamped_near(t_pi_2_om0);
const Vc_cd = Vc_crit_fn(t_pi_2_om0);
const continuity_diff = Math.abs(Vc_ud - Vc_cd);
console.log(`  V_C_underdamped(R→R_crit⁻, t=π/(2ω₀)) = ${Vc_ud.toPrecision(10)}`);
console.log(`  V_C_crit(t=π/(2ω₀))                   = ${Vc_cd.toPrecision(10)}`);
console.log(`  |difference| = ${continuity_diff.toExponential(3)} (should be < 1e-4)`);
assert(continuity_diff < 1e-4,
  `Continuity at R_crit: |V_C_underdamped - V_C_crit| = ${continuity_diff}, should be < 1e-4`);
console.log('  Continuity at R_crit (formulas agree to 1e-4) ✓\n');

// ═══════════════════════════════════════════════════════════════════════
// NEW SECTION G: Q boundary notes
// ═══════════════════════════════════════════════════════════════════════
console.log('--- G. Q boundary assertions ---');
// G1: Q = 1/√2 → ωC_peak = 0
// At Q = 1/√2: ωC = sqrt(ω₀²−2α²) = 0 → ω₀²=2α² → R=√2·√(L/C)
const R_boundary = Math.sqrt(2) * Math.sqrt(L / C);
const alpha_bnd = R_boundary / (2 * L);
const omegaC_bnd_sq = omega0 ** 2 - 2 * alpha_bnd ** 2;
// Due to floating point, omegaC_bnd_sq ≈ 0 but may not be exactly 0
const omegaC_bnd_abs = Math.sqrt(Math.abs(omegaC_bnd_sq));
console.log(`  R_boundary = √2·√(L/C) = ${R_boundary.toPrecision(10)} Ω`);
console.log(`  alpha_bnd = ${alpha_bnd.toPrecision(10)} rad/s`);
console.log(`  omegaC_bnd (≈0) = ${omegaC_bnd_abs.toExponential(4)} rad/s`);
assert(omegaC_bnd_abs < 1e-3,
  `sqrt(omega0^2-2*alpha_bnd^2) = ${omegaC_bnd_abs}, should be < 1e-3 (Q=1/√2 boundary)`);
const Q_bnd = Math.sqrt(L / C) / R_boundary;
console.log(`  Q at R_boundary = ${Q_bnd.toPrecision(10)} (should be 1/√2 = ${(1/Math.sqrt(2)).toPrecision(10)})`);
assert(Math.abs(Q_bnd - 1 / Math.sqrt(2)) < 1e-14,
  `Q at R_boundary = ${Q_bnd}, expected 1/sqrt(2) = ${1/Math.sqrt(2)}`);
console.log('  Q=1/√2 → ωC_peak≈0 ✓');

// G2: Q_crit = 1/2
// At R_crit = 2√(L/C): Q_crit = √(L/C)/R_crit = √(L/C)/(2√(L/C)) = 1/2
const Q_crit_val = Math.sqrt(L / C) / R_crit;
console.log(`  Q_crit = √(L/C)/R_crit = ${Q_crit_val} (should be 0.5)`);
assert(Q_crit_val === 0.5,
  `Q_crit = ${Q_crit_val}, expected exactly 0.5`);
console.log('  Q_crit = 1/2 (critical damping) ✓\n');

console.log('=== ALL VERIFICATIONS PASS ===');
console.log('\nSummary of anchors for tests/physics/lc-oscillator.test.js:');
console.log(`  α = 5000 rad/s (exact)`);
console.log(`  ω₀ = ${omega0.toPrecision(15)} rad/s = 10⁴√10`);
console.log(`  Q = ${Q_exact.toPrecision(15)} = √10`);
console.log(`  ωd = ${omegad.toPrecision(15)} rad/s = 10⁴√9.75`);
console.log(`  ωC_peak = ${omegaC.toPrecision(15)} rad/s = 10⁴√9.5`);
console.log(`  Bandwidth = 10000 rad/s = R/L (exact)`);
console.log(`  R_crit = ${R_crit.toPrecision(15)} Ω = 20√10`);
console.log(`  V_C(t_qtr) = ${Vc_formula.toPrecision(15)}`);
console.log(`  Max gain = sqrt(400/39) = ${Math.sqrt(400/39).toPrecision(15)}`);
console.log(`  RK4 halving ratio (at 10*t_qtr) = ${halving_ratio.toFixed(4)} ∈ [12,20]`);
console.log(`  V_C_crit(1/alpha_crit) = 1-2/e = ${(1-2/Math.E).toPrecision(15)}`);
console.log('\nR8 FLAGS:');
console.log('  1. Brief said Q≈10 — INCORRECT. Q=√10≈3.162 for R=10Ω, L=1mH, C=1μF.');
console.log('     Q=10 requires R=√10≈3.16 Ω.');
console.log('  2. Brief said ωC_peak ≈ ω₀√(1−1/200) which is 1−1/(2Q²) with Q=10.');
console.log('     With actual Q=√10: 1/(2Q²)=1/20=0.05, so ωC_peak=ω₀√(0.95)=10⁴√9.5.');
console.log('  3. Section A: spec said RK4 halving at t_qtr (N=5000/10000) gives ratio [12,20].');
console.log('     At t_qtr both errors are machine-epsilon dominated; ratio ~1.4, not ~16.');
console.log('     Used t=10*t_qtr for the halving test (ratio=15.56 ✓).');
console.log('  4. Section C: spec claims |H_C| half-power pts satisfy omega_lo*omega_hi=omega0^2');
console.log('     and BW=R/L. INCORRECT for |H_C|. Those identities hold for impedance half-power');
console.log('     freq (omega_pm = +-alpha + sqrt(alpha^2+omega0^2)) only.');
console.log('\n=== ALL PHASE 10 LC ANCHORS PASS ===');
