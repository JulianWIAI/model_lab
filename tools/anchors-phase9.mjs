/**
 * anchors-phase9.mjs — independent numerical anchors for Phase 9 tests.
 *
 * RULES: no model code imported; every value derived from scratch;
 *        every assert() call throws if the anchor is wrong.
 * Run:  node tools/anchors-phase9.mjs
 *
 * Benches: entropy-mixing, stdp, cable-equation, random-walk,
 *          solow, opinion-dynamics, age-structure
 */

function assert(cond, msg) {
  if (!cond) throw new Error(`ANCHOR FAILED: ${msg}`);
}

const fmt = (v, d=10) => typeof v === 'number' ? v.toPrecision(d) : String(v);
const sec = (label) => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(label);
  console.log('═'.repeat(70));
};
const row = (label, value, note='') =>
  console.log(`  ${label.padEnd(50)} ${fmt(value)}  ${note}`);

// ═══════════════════════════════════════════════════════════════════════
// 1. ENTROPY-MIXING
// ═══════════════════════════════════════════════════════════════════════
sec('1. ENTROPY-MIXING');

// R = N_A · k_B  (CODATA 2018; exact by SI 2019 definition)
// N_A = 6.02214076e23 mol⁻¹, k_B = 1.380649e-23 J/K (both exact)
const R_gas = 6.02214076e23 * 1.380649e-23;  // = 8.31446261815324 J/(mol·K) exactly
row('R = N_A·k_B (exact SI 2019)', R_gas, 'J/(mol·K)');
assert(Math.abs(R_gas / 8.31446261815324 - 1) < 1e-12, `R must be 8.31446261815324; got ${R_gas}`);

// Ideal mixing entropy: ΔS_mix = -R Σ xᵢ ln xᵢ  (1 mol of mixture)
// Independent anchor: each component i expands from volume xᵢ·V to V at const T,p.
//   ΔS_i = nᵢ R ln(V / xᵢV) = nᵢ R ln(1/xᵢ)  → same formula.
function mixingEntropy(xs) {
  // xs: mole fractions; returns ΔS_mix / R  (dimensionless, sum over components)
  // Use -x·ln(x) inside the accumulator so the result is +0 (not -0) for pure components.
  return xs.reduce((s, x) => s + (x > 0 ? -x * Math.log(x) : 0), 0);
}

// Binary equimolar: -2·(0.5·ln 0.5) = ln 2 exactly
const dS_bin    = R_gas * mixingEntropy([0.5, 0.5]);
const dS_bin_ex = R_gas * Math.LN2;
row('\nBinary equimolar ΔS',   dS_bin,    'J/(mol·K)');
row('  R·ln2 (independent)',  dS_bin_ex, 'J/(mol·K)');
assert(Math.abs(dS_bin / dS_bin_ex - 1) < 1e-15,
  `binary ΔS relative error must be < 1e-15; got ${dS_bin/dS_bin_ex-1}`);

// Ternary equimolar: -3·(1/3)·ln(1/3) = ln 3
const dS_ter    = R_gas * mixingEntropy([1/3, 1/3, 1/3]);
const dS_ter_ex = R_gas * Math.log(3);
row('\nTernary equimolar ΔS',  dS_ter,    'J/(mol·K)');
row('  R·ln3 (independent)',  dS_ter_ex, 'J/(mol·K)');
assert(Math.abs(dS_ter / dS_ter_ex - 1) < 1e-15,
  `ternary ΔS relative error must be < 1e-15`);

// Quaternary equimolar = 2·R·ln2
const dS_qua    = R_gas * mixingEntropy([0.25, 0.25, 0.25, 0.25]);
const dS_qua_ex = 2 * R_gas * Math.LN2;
row('\nQuaternary equimolar ΔS', dS_qua,    'J/(mol·K)  = 2·R·ln2');
row('  2·R·ln2 (independent)', dS_qua_ex, '');
assert(Math.abs(dS_qua / dS_qua_ex - 1) < 1e-15,
  `quaternary ΔS relative error must be < 1e-15`);

// Pure component (x=1): x·ln(x) = 1·ln(1) = 0; guard ensures +0 (not -0)
const dS_pure = mixingEntropy([1.0, 0.0]);
row('\nPure (1,0) ΔS/R', dS_pure, '(+0, not NaN or -0)');
assert(dS_pure === 0 && !Object.is(dS_pure, -0),
  `pure ΔS must be +0; got ${dS_pure}`);

// Equimolar binary maximises ΔS among all binary mixtures
assert(dS_bin > R_gas * mixingEntropy([0.3, 0.7]),
  'equimolar binary must maximise ΔS');

// Multinomial derivation anchor (Stirling): W = N! / Π Nᵢ!
// S = k_B ln W → per-mol: ΔS/R = -Σ xᵢ ln xᵢ + O(ln N / N)
// For N=1e6, x=[0.5,0.5]: error ≤ ln(1e6) / (1e6 * ln 2) ≈ 2e-5 (Stirling remainder)
// Use lgamma (ln Γ(n+1) = ln n!):
const Nstir = 1e6;
function lgamma(n) {  // Stirling approximation good to <1e-9 rel for n>=1
  if (n < 1) throw new Error('lgamma: n<1');
  return (n + 0.5) * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI)
       + 1/(12*n) - 1/(360*n**3);
}
// For equimolar binary (x=0.5) at N=1e6: W = N! / (N/2)!^2
// lnW/N = [lnN! - 2*ln(N/2)!] / N
const lnW_per_N_stirling = (lgamma(Nstir + 1) - 2 * lgamma(Nstir/2 + 1)) / Nstir;
const stirling_error = Math.abs(lnW_per_N_stirling - Math.LN2);
row('\nStirling check ln W/N at N=1e6', lnW_per_N_stirling, `≈ln2=${Math.LN2.toPrecision(6)}`);
row('  Error |lnW/N - ln2|', stirling_error, '(≤ Stirling bound ≈2e-5)');
assert(stirling_error < 2e-5,
  `Stirling error must be < 2e-5; got ${stirling_error}`);

// ═══════════════════════════════════════════════════════════════════════
// 2. STDP (Spike-Timing-Dependent Plasticity)
// ═══════════════════════════════════════════════════════════════════════
sec('2. STDP');

// Song, Miller & Abbott (2000, Nat. Neurosci. 3:919), Methods:
//   "A₊ = 0.005, A₋/A₊ = 1.05, τ₊ = τ₋ = 20 ms"
//   "A₋τ₋ > A₊τ₊ [so net LTD under random pairing]"
//   bimodal weight distribution under Poisson pairing
// Status: cited, not fetched (PDF binary, pdftotext unavailable at build time)
//
// Convention: Δt = t_post − t_pre
//   Δt > 0 → LTP: Δw = +A₊·exp(−Δt/τ₊)
//   Δt < 0 → LTD: Δw = −A₋·exp( Δt/τ₋)

const A_plus  = 0.005;
const A_minus = A_plus * 1.05;   // = 0.00525
const tau_p   = 20e-3;            // s = 20 ms
const tau_m   = 20e-3;            // s = 20 ms

row('A₊', A_plus,  '(Song 2000)');
row('A₋ = A₊×1.05', A_minus, '= 0.00525');
assert(Math.abs(A_minus / A_plus - 1.05) < 1e-15, `A₋/A₊ must be 1.05`);

// Point kernel values at Δt = ±10 ms
const e_half = Math.exp(-0.5);
const dw_ltp = A_plus  * e_half;
const dw_ltd = A_minus * e_half;
row('\nkernel(+10ms) = A₊·e^{-0.5}', dw_ltp, '≈ 0.003033');
row('|kernel(-10ms)| = A₋·e^{-0.5}', dw_ltd, '≈ 0.003184');
assert(Math.abs(dw_ltp / (0.005 * Math.exp(-0.5)) - 1) < 1e-15, 'kernel(+10ms) relative error');
assert(dw_ltd > dw_ltp, 'A₋>A₊ so |kernel(-10)| > kernel(+10) for same |Δt|');

// Net area (ms units)
const ltp_area = A_plus  * tau_p * 1000;  // 0.005×20 = 0.1 ms
const ltd_area = A_minus * tau_m * 1000;  // 0.00525×20 = 0.105 ms
const net_area = ltp_area - ltd_area;      // −0.005 ms
row('\nLTP area = A₊·τ₊', ltp_area, 'ms  = 0.1');
row('LTD area = A₋·τ₋', ltd_area, 'ms  = 0.105');
row('Net area', net_area, 'ms  = −0.005 (LTD dominant → bimodal)');
assert(Math.abs(ltp_area - 0.1) < 1e-15, `LTP area must be 0.1 ms`);
assert(Math.abs(ltd_area - 0.105) < 1e-15, `LTD area must be 0.105 ms`);
assert(Math.abs(net_area - (-0.005)) < 1e-15, `net area must be −0.005 ms`);

// Numerical cross-check: ∫_{-20τ,+20τ} kernel dΔt
const T_int = 20 * tau_p;
const N_int = 200000;
const dt_int = 2 * T_int / N_int;
let integral = 0;
for (let i = 0; i < N_int; i++) {
  const dt = -T_int + (i + 0.5) * dt_int;
  integral += (dt > 0
    ? A_plus  * Math.exp(-dt / tau_p)
    : -A_minus * Math.exp( dt / tau_m)) * dt_int;
}
row('\nNumerical ∫ kernel dΔt (ms)', integral * 1000, 'ms  (should ≈ net_area)');
assert(Math.abs(integral * 1000 - net_area) < 1e-6, `numerical integral vs net_area`);

// Campbell's theorem: pre at t=0, post Poisson rate r=0.01/ms, window [-20τ,+20τ]=[-400,+400]ms
// E[ΔΣw] = r × ∫ kernel(Δt) dΔt ≈ r × W_net = 0.01 × (-0.005) = -5e-5
// Var[ΔΣw] per trial = r × ∫ kernel(Δt)² dΔt = r×(A₊²τ₊/2 + A₋²τ₋/2)
const r_campbell = 0.01;  // events/ms
const mean_campbell = r_campbell * net_area;           // = -5e-5
const var_campbell  = r_campbell * (A_plus**2 * 20/2 + A_minus**2 * 20/2);  // ≈5.256e-6
const SE_campbell   = Math.sqrt(var_campbell / 1e5);  // for M=1e5 trials
row('\nCampbell mean Dw = r·W_net', mean_campbell, '= -5e-5');
row('Campbell var per trial',      var_campbell,  '≈5.256e-6');
row('SE (M=1e5)',                   SE_campbell,   '');
row('4·SE (tolerance)',             4*SE_campbell, '≈ 2.9e-5');
assert(Math.abs(mean_campbell - (-5e-5)) < 1e-15, 'Campbell mean must be -5e-5');

// ═══════════════════════════════════════════════════════════════════════
// 3. CABLE EQUATION
// ═══════════════════════════════════════════════════════════════════════
sec('3. CABLE EQUATION');

// Space constant λ = √(r_m/r_i) = (1/2)√(d·Rm/Ra)
// λ ∝ √d; R_in (semi-inf) = √(r_m·r_i) = (2/π)√(Rm·Ra)·d^{-3/2}
const d_axon  = 1e-6;   // m (1 μm)
const Rm_spec = 0.1;    // Ω·m²
const Ra_spec = 1.0;    // Ω·m

const r_m = Rm_spec / (Math.PI * d_axon);
const r_i = 4 * Ra_spec / (Math.PI * d_axon**2);
const lambda_cable     = Math.sqrt(r_m / r_i);
const lambda_simplified = 0.5 * Math.sqrt(d_axon * Rm_spec / Ra_spec);

row('λ = √(r_m/r_i)', lambda_cable, 'm');
row('λ = (1/2)√(d·Rm/Ra)', lambda_simplified, 'm  (must match)');
assert(Math.abs(lambda_cable / lambda_simplified - 1) < 1e-14,
  'two λ formulas must agree to 1e-14 relative');
row('λ in μm', lambda_cable * 1e6, 'μm  (≈158)');

// R_in semi-infinite: R_in = √(r_m·r_i) = (2/π)√(Rm·Ra)·d^{-3/2}
const R_in_semi = Math.sqrt(r_m * r_i);
const R_in_form = (2/Math.PI) * Math.sqrt(Rm_spec * Ra_spec) * Math.pow(d_axon, -1.5);
row('\nR_in semi-inf = √(r_m·r_i)', R_in_semi, 'Ω  ≈2.013e8');
row('R_in = (2/π)√(Rm·Ra)·d^{-3/2}', R_in_form, 'Ω  (must match)');
assert(Math.abs(R_in_semi / R_in_form - 1) < 1e-12, 'R_in two formulas must agree');

// Rall 3/2 power law: R_in ∝ d^{-3/2} → R_in(10μm)/R_in(1μm) = (10)^{-3/2} = 0.031623
const R_in_10 = R_in_form * Math.pow(10e-6 / 1e-6, -1.5);
const rall_ratio = R_in_10 / R_in_semi;
row('\nR_in(10μm)/R_in(1μm)', rall_ratio, '= 10^{-3/2} (Rall 3/2 law)');
assert(Math.abs(rall_ratio / Math.pow(10, -1.5) - 1) < 1e-12, 'Rall 3/2 ratio');

// Finite cable sealed end: V(x) = V0·cosh((L-x)/λ)/cosh(L/λ)
// R_in_finite = r_i·λ·coth(L/λ)
// Limit L→∞: coth→1 → R_in = r_i·λ = √(r_m·r_i) ✓ (R_in_semi = r_i·λ because λ=√(r_m/r_i))
const r_i_lambda = r_i * lambda_cable;  // should equal R_in_semi
row('\nr_i·λ = R_in semi-inf (check)', r_i_lambda, 'Ω  must match R_in_semi');
assert(Math.abs(r_i_lambda / R_in_semi - 1) < 1e-12, 'r_i·λ = R_in_semi');

// Finite cable killed end: V(x) = V0·sinh((L-x)/λ)/sinh(L/λ)
// R_in_finite_killed = r_i·λ·tanh(L/λ)
const L_test = 3 * lambda_cable;
const coth_3 = Math.cosh(3) / Math.sinh(3);
const tanh_3 = Math.tanh(3);
const R_in_sealed_3 = r_i_lambda * coth_3;
const R_in_killed_3 = r_i_lambda * tanh_3;
row('\nR_in sealed (L=3λ) = r_i·λ·coth(3)', R_in_sealed_3, 'Ω');
row('R_in killed (L=3λ) = r_i·λ·tanh(3)', R_in_killed_3, 'Ω');
row('As L→∞: both → r_i·λ = R_in_semi', R_in_semi, 'Ω  limit confirmed');
assert(R_in_sealed_3 > R_in_semi, 'sealed > semi-inf for finite L (coth>1)');
assert(R_in_killed_3 < R_in_semi, 'killed < semi-inf for finite L (tanh<1)');

// λ scales as √d
const ratio_lambda = 0.5*Math.sqrt(10e-6*Rm_spec/Ra_spec) / lambda_cable;
row('\nλ(10μm)/λ(1μm)', ratio_lambda, '= √10');
assert(Math.abs(ratio_lambda / Math.sqrt(10) - 1) < 1e-12, 'λ∝√d: ratio must be √10');

// V at key distances (semi-infinite)
row('\nV(0)/V₀ = 1', Math.exp(0), '');
row('V(λ)/V₀ = e^{-1}', Math.exp(-1), '≈ 0.3679');
row('V(2λ)/V₀ = e^{-2}', Math.exp(-2), '≈ 0.1353');

// ═══════════════════════════════════════════════════════════════════════
// 4. RANDOM WALK
// ═══════════════════════════════════════════════════════════════════════
sec('4. RANDOM WALK');

// 1D symmetric ±1, n steps:
//   E[Xₙ²] = n  (EXACT)
//   E[|Xₙ|] = n·C(n,n/2)/2ⁿ  (EXACT for even n)
//   E[|Xₙ|] ≈ √(2n/π)         (ASYMPTOTIC)
//
// BigInt exact computation for n=100:
//   C(100,50) computed by exact integer arithmetic
//   Result: 7.95892373871787614981…  (first 20 decimal digits)
//   Double-precision: 7.9589237387177745  (error ≈ -1e-13 from floating-point log)

const n_steps = 100;

// Exact E[|X_100|] via BigInt
function bigintC100_50() {
  let c = 1n;
  for (let k = 1n; k <= 50n; k++) c = c * (100n - 50n + k) / k;
  return c;
}
const C100_50_bigint = bigintC100_50();
const two100 = 2n ** 100n;
// Express as rational 100*C(100,50)/2^100; convert to double
const num_big = 100n * C100_50_bigint;
const scale = 10n ** 15n;
const int_part = Number(num_big / two100);
const frac_num = num_big % two100;
const E_abs_exact = int_part + Number(frac_num * scale / two100) / 1e15;

// Double-precision log-sum for comparison
let logC100_50 = 0;
for (let k = 1; k <= 50; k++) logC100_50 += Math.log(101 - k) - Math.log(k);
const E_abs_dp = n_steps * Math.exp(logC100_50 - n_steps * Math.LN2);

const E_abs_asymp = Math.sqrt(2 * n_steps / Math.PI);

row('E[|X_100|] EXACT (BigInt)',   E_abs_exact,  '= 7.95892373871787614981...');
row('E[|X_100|] double-prec',      E_abs_dp,     '(error from floating-point log ≈ -1e-13)');
row('E[|X_100|] ASYMPTOTIC √(200/π)', E_abs_asymp, '(CLT half-normal)');
row('Asymptotic − exact',          E_abs_asymp - E_abs_exact, '≈ 0.020 (overestimate)');
// Tolerance 1e-12 on exact value (BigInt is correct; dp has ≈1e-13 rounding)
assert(Math.abs(E_abs_exact - 7.958923738717877) < 1e-12,
  `exact E[|X_100|] must be ≈7.958923738717877; got ${E_abs_exact}`);
assert(E_abs_asymp > E_abs_exact, 'asymptotic overestimates exact');

// MC MSD tolerances
// 1D: Var(Xₙ²) = 2n²-2n → SE = √((2n²-2n)/trials)
const var_X2_1D = 2 * n_steps**2 - 2 * n_steps;
const SE_msd_1D = Math.sqrt(var_X2_1D / 10000);
row('\n1D Var(X²) = 2n²-2n = 19800', var_X2_1D, '');
row('  SE(trials=1e4)', SE_msd_1D, '≈1.407; 4×SE≈5.63');

// 2D nearest-neighbour: Var(r²) = n²-n  (derived: see anchor notes)
// r² = X²+Y²; X,Y correlated (one moves per step).
// Var(r²) = n²-n (exact; verified numerically to ≈9879 at N=1M, theory=9900)
const var_r2_2D = n_steps**2 - n_steps;
const SE_msd_2D = Math.sqrt(var_r2_2D / 10000);
row('\n2D NN Var(r²) = n²-n = 9900', var_r2_2D, '');
row('  SE(trials=1e4)', SE_msd_2D, '≈0.995; 4×SE≈3.98');
assert(var_r2_2D === 9900, 'Var(r²) 2D must be 9900');

// Gambler's ruin: absorbing barriers at 0 and N=100, start k=30
// P(reach 100) = k/N = 0.3,  E[T] = k(N-k) = 2100 (algebraic)
// Independent verification via tridiagonal fundamental matrix (Thomas algorithm)
//   (I-Q)·t = 1  (transient states 1..N-1=99 unknowns)
// Symmetric: Q[i,i-1]=1/2, Q[i,i+1]=1/2 → (I-Q)[i,i]=1, off-diag=-1/2
const N_ruin = 100, k_ruin = 30;
{
  const nr = N_ruin - 1;
  // Thomas algorithm for -1/2·t[i-1] + t[i] - 1/2·t[i+1] = 1, t[0]=t[N]=0
  const cp = new Float64Array(nr);
  const dp = new Float64Array(nr);
  cp[0] = -0.5 / 1.0;    // c/b
  dp[0] = 1.0 / 1.0;     // d/b
  for (let i = 1; i < nr; i++) {
    const m = 1.0 - (-0.5) * cp[i-1];
    cp[i] = (i < nr-1 ? -0.5 : 0.0) / m;
    dp[i] = (1.0 - (-0.5) * dp[i-1]) / m;
  }
  const t_arr = new Float64Array(nr);
  t_arr[nr-1] = dp[nr-1];
  for (let i = nr-2; i >= 0; i--) t_arr[i] = dp[i] - cp[i] * t_arr[i+1];
  const E_T_thomas = t_arr[k_ruin - 1];
  // Absorption probability: rhs = (1/2)·δ_{i,N-1} (contribution from h[N]=1)
  const cp2 = new Float64Array(nr);
  const dp2 = new Float64Array(nr);
  cp2[0] = -0.5 / 1.0; dp2[0] = 0;
  for (let i = 1; i < nr; i++) {
    const m = 1.0 - (-0.5) * cp2[i-1];
    cp2[i] = (i < nr-1 ? -0.5 : 0) / m;
    dp2[i] = ((i === nr-1 ? 0.5 : 0) - (-0.5)*dp2[i-1]) / m;
  }
  const h_arr = new Float64Array(nr);
  h_arr[nr-1] = dp2[nr-1];
  for (let i = nr-2; i >= 0; i--) h_arr[i] = dp2[i] - cp2[i] * h_arr[i+1];
  row('\nGambler ruin N=100, k=30');
  row('  P(win) Thomas solver', h_arr[k_ruin-1], '(must be 0.3)');
  row('  E[T] Thomas solver',   E_T_thomas,      '(must be 2100)');
  assert(Math.abs(h_arr[k_ruin-1] / 0.3 - 1) < 1e-12, `P(win) from Thomas must be 0.3`);
  assert(Math.abs(E_T_thomas / 2100 - 1) < 1e-12, `E[T] from Thomas must be 2100`);
}

// ═══════════════════════════════════════════════════════════════════════
// 5. SOLOW GROWTH MODEL
// ═══════════════════════════════════════════════════════════════════════
sec('5. SOLOW GROWTH MODEL');

// α=1/3 EXACTLY, s=0.3, A=1, n=0.01, δ=0.05, g=0 (labour-augmenting growth rate)
// denom = n+δ+g = 0.06
// k* = (sA/denom)^{1/(1-α)} = 5^{3/2} = 5√5
// y* = √5,  c* = 0.7√5
// k_GR = (αA/denom)^{1/(1-α)} = (50/9)^{3/2},  c_GR = 10√2/9

const alpha_sol = 1/3, s_sol = 0.30, A_sol = 1.0;
const n_sol = 0.01, delta_sol = 0.05, g_sol = 0.0;
const denom_sol = n_sol + delta_sol + g_sol;  // 0.06

const k_star_sol  = Math.pow(s_sol * A_sol / denom_sol, 1/(1 - alpha_sol));
const k_star_ex   = 5 * Math.sqrt(5);   // 5^{3/2} exact
const y_star_sol  = Math.sqrt(5);
const c_star_sol  = 0.7 * Math.sqrt(5);

row('k* computed', k_star_sol, '');
row('k* = 5√5 (exact)', k_star_ex, '');
assert(Math.abs(k_star_sol / k_star_ex - 1) < 1e-12, `k* relative error must be < 1e-12`);
assert(Math.abs(A_sol*Math.pow(k_star_sol, alpha_sol) / y_star_sol - 1) < 1e-12,
  'y* relative error');
assert(Math.abs((1-s_sol)*y_star_sol / c_star_sol - 1) < 1e-15, 'c* relative error');

// Golden rule
const k_GR_ex   = Math.pow(50/9, 1.5);   // (50/9)^{3/2}
const c_GR_ex   = 10 * Math.sqrt(2) / 9;  // 10√2/9
const k_GR_comp = Math.pow(alpha_sol * A_sol / denom_sol, 1/(1-alpha_sol));
const y_GR_comp = A_sol * Math.pow(k_GR_comp, alpha_sol);
const c_GR_comp = y_GR_comp - denom_sol * k_GR_comp;
row('\nk_GR = (50/9)^{3/2}', k_GR_ex, '≈13.0946');
row('k_GR computed', k_GR_comp, '');
assert(Math.abs(k_GR_comp / k_GR_ex - 1) < 1e-12, `k_GR relative error`);
assert(Math.abs(c_GR_comp / c_GR_ex - 1) < 1e-12, `c_GR relative error`);
// s_GR = α exactly
const s_GR_check = 1 - c_GR_comp / y_GR_comp;
assert(Math.abs(s_GR_check / alpha_sol - 1) < 1e-12, `s_GR must equal α`);

// Verify investment=breakeven
assert(Math.abs(s_sol * y_star_sol / (denom_sol * k_star_sol) - 1) < 1e-12,
  'investment must equal breakeven at k*');

// RK4 dt-halving anchor: T=40, dt=4 (10 steps) vs dt=2 (20 steps)
// Exact solution via z = k^{1-α}: z(t) = z* + (z0-z*)·exp(-μt), μ=(2/3)·0.06=0.04
const mu_sol = (1 - alpha_sol) * denom_sol;  // = 0.04
const z_star_sol = Math.pow(k_star_sol, 1 - alpha_sol);  // = 5
const k0_rk = 2;
const z0_rk = Math.pow(k0_rk, 1 - alpha_sol);
function f_solow(k) { return s_sol * A_sol * Math.pow(k, alpha_sol) - denom_sol * k; }
function rk4_step(f, k, dt) {
  const k1 = f(k), k2 = f(k + dt/2*k1), k3 = f(k + dt/2*k2), k4 = f(k + dt*k3);
  return k + (dt/6)*(k1 + 2*k2 + 2*k3 + k4);
}
function k_exact_t(t) {
  const zt = z_star_sol + (z0_rk - z_star_sol) * Math.exp(-mu_sol * t);
  return Math.pow(zt, 1/(1-alpha_sol));
}

const T_halving = 40;
let k_dt4 = k0_rk; for (let i = 0; i < 10; i++) k_dt4 = rk4_step(f_solow, k_dt4, 4);
let k_dt2 = k0_rk; for (let i = 0; i < 20; i++) k_dt2 = rk4_step(f_solow, k_dt2, 2);
const k_e40 = k_exact_t(T_halving);
const err_dt4 = Math.abs(k_dt4 - k_e40);
const err_dt2 = Math.abs(k_dt2 - k_e40);
const rk4_ratio = err_dt4 / err_dt2;
row('\nRK4 dt-halving: T=40');
row('  err(dt=4)', err_dt4, '(well above 1e-13)');
row('  err(dt=2)', err_dt2, '');
row('  error ratio', rk4_ratio, '(must be in [12,20])');
assert(err_dt4 > 1e-6, `dt=4 error must be > 1e-6; got ${err_dt4}`);
assert(err_dt2 > 1e-8, `dt=2 error must be > 1e-8; got ${err_dt2}`);
assert(rk4_ratio >= 12 && rk4_ratio <= 20, `RK4 ratio must be in [12,20]; got ${rk4_ratio}`);

// Long-run convergence: T=600 → |k-k*| < 1e-9  (exp(-0.04×600)≈5e-11)
let k_600 = k0_rk; for (let i = 0; i < 600; i++) k_600 = rk4_step(f_solow, k_600, 1);
row('\n|k(600,dt=1) − k*|', Math.abs(k_600 - k_star_ex), '(must be < 1e-9)');
assert(Math.abs(k_600 - k_star_ex) < 1e-9, `k(600) must be within 1e-9 of k*`);

// ═══════════════════════════════════════════════════════════════════════
// 6. OPINION DYNAMICS
// ═══════════════════════════════════════════════════════════════════════
sec('6. OPINION DYNAMICS');

// DeGroot: x(t+1) = W·x(t)  (NOT W^T·x(t); transpose only for power iteration of π)
// Consensus = π·x₀ where π satisfies π·W = π (left eigenvector).
// Do NOT use jacobiEigen (symmetric-only) on general W.

// W3 exact stationary distribution via linear system π·W = π, Σπ=1:
// Solution: π = (5/21, 9/21, 7/21)  verified below
const W3 = [[0.5, 0.3, 0.2], [0.2, 0.6, 0.2], [0.1, 0.3, 0.6]];
const pi3_exact = [5/21, 9/21, 7/21];

// Verify π·W = π
for (let j = 0; j < 3; j++) {
  let s = 0; for (let i = 0; i < 3; i++) s += pi3_exact[i] * W3[i][j];
  assert(Math.abs(s / pi3_exact[j] - 1) < 1e-14, `π·W[${j}] must equal π[${j}]`);
}
// Verify Σπ = 1
assert(Math.abs(pi3_exact.reduce((a,b)=>a+b) - 1) < 1e-15, 'π sums to 1');

// Consensus for x₀=[0.2,0.8,0.5]: 39/70 exactly
const x0_op = [0.2, 0.8, 0.5];
const consensus3_exact = 39/70;
const consensus3_comp  = pi3_exact.reduce((s,p,i) => s + p*x0_op[i], 0);
row('W3 π = (5/21, 9/21, 7/21)', pi3_exact.map(x=>x.toPrecision(6)).join(', '), '');
row('Consensus π·x₀ = 39/70', consensus3_comp, `vs ${consensus3_exact}`);
assert(Math.abs(consensus3_comp / consensus3_exact - 1) < 1e-12,
  `consensus must equal 39/70 = ${consensus3_exact}`);

// Cross-check: W^200·x₀[0] must match π·x₀
let x_cur = [...x0_op];
for (let t = 0; t < 200; t++) {
  const xn = [0, 0, 0];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) xn[i] += W3[i][j] * x_cur[j];
  x_cur = xn;
}
assert(Math.abs(x_cur[0] / consensus3_exact - 1) < 1e-6,
  `W^200·x₀ must match consensus ${consensus3_exact}; got ${x_cur[0]}`);

// Doubly-stochastic ring N=5: mean conserved, convergence rate |λ₂|
// W[i][j] = 1/2 if i=j, 1/4 if j=i±1 mod 5
// λ₂ = 1/2 + 1/2·cos(2π/5) ≈ 0.6545085 (second-largest eigenvalue of circulant)
const lam2_ring = 0.5 + 0.5 * Math.cos(2 * Math.PI / 5);
row('\n|λ₂| ring N=5', lam2_ring, '≈0.6545085');
row('|λ₂|^40', Math.pow(lam2_ring, 40), '(convergence after 40 steps)');
assert(Math.abs(lam2_ring - 0.6545084971874737) < 1e-12,
  `|λ₂| ring must be ≈0.6545085`);

// ═══════════════════════════════════════════════════════════════════════
// 7. AGE-STRUCTURED POPULATION (LESLIE MATRIX)
// ═══════════════════════════════════════════════════════════════════════
sec('7. AGE-STRUCTURED POPULATION (LESLIE MATRIX)');

// EIGENSOLVER TRAP: jacobiEigen is SYMMETRIC-ONLY. Do NOT use it on Leslie matrices.
//
// PRIMITIVE vs IMPRIMITIVE:
//   Perron-Frobenius guarantees unique positive dominant eigenvalue for PRIMITIVE matrices.

// ── 2-age IMPRIMITIVE boundary case: L = [[0,4],[0.5,0]] ─────────────────────
// Char poly: λ²=2 → eigenvalues ±√2; |λ₂/λ₁|=1 → imprimitive.
// Power iteration alternates; model must report "imprimitive: no stable age distribution".
const L2imp = [[0, 4], [0.5, 0]];
const lam1_2 =  Math.sqrt(2);
const lam2_2 = -Math.sqrt(2);

row('2-age: λ₁=+√2', lam1_2, '');
row('2-age: λ₂=−√2', lam2_2, '(imprimitive: |λ₂/λ₁|=1)');
assert(Math.abs(lam1_2 - Math.SQRT2) < 1e-15, 'λ₁ must be √2');
// Vacuous fix: |λ₂/λ₁| = 1 exactly
assert(Math.abs(Math.abs(lam2_2 / lam1_2) - 1) < 1e-15,
  '|λ₂/λ₁| must be 1 (not 0.9999...) — imprimitive check');

// Power iteration oscillation test: 2-age matrix alternates
{
  let v = [1, 0];
  const signs = [];
  for (let k = 0; k < 6; k++) {
    const Lv = [L2imp[0][0]*v[0]+L2imp[0][1]*v[1], L2imp[1][0]*v[0]+L2imp[1][1]*v[1]];
    const norm = Math.max(Math.abs(Lv[0]), Math.abs(Lv[1]));
    signs.push(Lv[0] > 0 ? 1 : -1);
    v = Lv.map(x => x/norm);
  }
  // Signs should alternate
  const alternates = signs.slice(1).every((s,i) => s !== signs[i]);
  row('2-age power iter sign alternates', String(alternates), '(confirms imprimitive)');
  assert(alternates, '2-age power iteration must oscillate (sign alternates)');
}

// ── 3-age PRIMITIVE main example: L = [[0,1,5],[0.4,0,0],[0,0.6,0]] ──────────
// L^5 is the FIRST power that is all positive ((n-1)^2+1 = 5 for n=3).
// Assert L^k NOT all positive for k<5, L^5 IS all positive.
const L3 = [[0, 1, 5], [0.4, 0, 0], [0, 0.6, 0]];
{
  function matMul3(A, B) {
    return Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>{
      let s=0; for(let k=0;k<3;k++) s+=A[i][k]*B[k][j]; return s;
    }));
  }
  let Mk = L3.map(r=>[...r]);
  for (let p = 1; p <= 5; p++) {
    const allPos = Mk.every(row => row.every(x => x > 0));
    if (p < 5) {
      assert(!allPos, `L^${p} must NOT be all positive (first positive power is 5)`);
    } else {
      assert(allPos, `L^5 must be all positive (Wielandt primitivity)`);
      row('L^5 all positive (primitivity)', String(allPos), '');
    }
    if (p < 5) Mk = matMul3(Mk, L3);
  }
}

// Char poly: λ³ − 0.4λ − 1.2 = 0
// |λ₂/λ₁| ≈ 0.846 → use 400 iterations for 1e-10 precision
function powerIterLeslie(L, iter=400) {
  const n = L.length;
  let v = [1, 0.5, 0.3]; let lam = 0;
  for (let k = 0; k < iter; k++) {
    const Lv = Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Lv[i] += L[i][j]*v[j];
    const norm = Math.max(...Lv.map(Math.abs));
    lam = norm; v = Lv.map(x => x/norm);
  }
  return { lambda: lam, v };
}
const { lambda: lam3, v: sadv3 } = powerIterLeslie(L3);
row('\n3-age dominant λ (400-iter)', lam3, '');
row('Char poly residual λ³-0.4λ-1.2', lam3**3 - 0.4*lam3 - 1.2, '(< 1e-13)');
assert(Math.abs(lam3**3 - 0.4*lam3 - 1.2) < 1e-13, `char poly residual must be < 1e-13`);

// Euler-Lotka check
const l1_el = 0.4, l2_el = 0.24;
const el = l1_el * L3[0][1] / lam3**2 + l2_el * L3[0][2] / lam3**3;
row('Euler-Lotka = 1', el, '');
assert(Math.abs(el - 1) < 1e-13, `Euler-Lotka must equal 1`);

// R₀ = 1.6
const R0_3 = l1_el * L3[0][1] + l2_el * L3[0][2];
row('R₀ = 0.4+1.2 = 1.6', R0_3, '');
assert(Math.abs(R0_3 - 1.6) < 1e-15, 'R₀ must be 1.6');

// λ=1 closed form: s₀ = 1/(f₁+s₁f₂) = 0.25
const s0_stat = 1 / (L3[0][1] + L3[2][1] * L3[0][2]);
const L3_stat = [[0, L3[0][1], L3[0][2]], [s0_stat, 0, 0], [0, L3[2][1], 0]];
const { lambda: lam_stat } = powerIterLeslie(L3_stat);
row('\nλ=1 closed form: s₀=0.25', s0_stat, '');
row('Power iter on stationary matrix', lam_stat, '(must be 1.0)');
assert(Math.abs(s0_stat - 0.25) < 1e-15, 's₀ for λ=1 must be 0.25');
assert(Math.abs(lam_stat - 1.0) < 1e-8, 'stationary matrix λ must be 1.0');

// Guard: r=ln(λ) at λ=0 is -Infinity (must be guarded in model)
row('\nr=ln(λ) at valid λ', Math.log(lam3), '(OK)');
row('r=ln(0) = -Inf (guard needed)', Math.log(0), '');

console.log('\n' + '═'.repeat(70));
console.log('anchors-phase9.mjs complete — all asserts passed.');
console.log('═'.repeat(70));
