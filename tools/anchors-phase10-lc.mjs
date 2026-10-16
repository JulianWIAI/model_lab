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
console.log('\nR8 FLAGS:');
console.log('  1. Brief said Q≈10 — INCORRECT. Q=√10≈3.162 for R=10Ω, L=1mH, C=1μF.');
console.log('     Q=10 requires R=√10≈3.16 Ω.');
console.log('  2. Brief said ωC_peak ≈ ω₀√(1−1/200) which is 1−1/(2Q²) with Q=10.');
console.log('     With actual Q=√10: 1/(2Q²)=1/20=0.05, so ωC_peak=ω₀√(0.95)=10⁴√9.5.');
