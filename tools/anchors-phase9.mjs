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

// R = N_A · k_B = 6.02214076e23 × 1.380649e-23  (CODATA 2018 exact SI 2019)
const R_gas = 6.02214076e23 * 1.380649e-23;
row('R (gas constant, SI 2019)', R_gas, 'J/(mol·K)');
assert(Math.abs(R_gas - 8.314462618) < 1e-8, 'R must be 8.314462618 J/(mol·K)');

// Ideal mixing entropy: ΔS_mix = -R Σ xᵢ ln xᵢ  (per mole of mixture)
// Independent derivation: -Σxᵢlnxᵢ gives the dimensionless part; multiply by R.
function mixingEntropy(xs) {
  // xs: mole fractions; returns ΔS_mix/R  (dimensionless)
  return -xs.reduce((s, x) => s + (x > 0 ? x * Math.log(x) : 0), 0);
}

// Binary equimolar (x=0.5 each): -2·(0.5·ln0.5) = ln2 exactly
const dS_bin = R_gas * mixingEntropy([0.5, 0.5]);
const dS_bin_exact = R_gas * Math.LN2;
row('Binary equimolar ΔS',   dS_bin,       'J/(mol·K)');
row('  R·ln2 (independent)', dS_bin_exact, 'J/(mol·K)');
row('  discrepancy',         dS_bin - dS_bin_exact, '(must be 0)');
assert(Math.abs(dS_bin - dS_bin_exact) < 1e-12,
  `binary ΔS must equal R·ln2; got discrepancy ${dS_bin - dS_bin_exact}`);

// Ternary equimolar (x=1/3): -3·(1/3·ln(1/3)) = ln3
const dS_ter = R_gas * mixingEntropy([1/3, 1/3, 1/3]);
const dS_ter_exact = R_gas * Math.log(3);
row('\nTernary equimolar ΔS',  dS_ter,       'J/(mol·K)');
row('  R·ln3 (independent)',  dS_ter_exact, 'J/(mol·K)');
assert(Math.abs(dS_ter - dS_ter_exact) < 1e-12,
  `ternary ΔS must equal R·ln3`);

// Quaternary equimolar (x=0.25): 2·R·ln2
const dS_qua = R_gas * mixingEntropy([0.25, 0.25, 0.25, 0.25]);
const dS_qua_exact = 2 * R_gas * Math.LN2;
row('\nQuaternary equimolar ΔS',  dS_qua,       'J/(mol·K)  = 2·R·ln2');
row('  2·R·ln2 (independent)',   dS_qua_exact, '');
assert(Math.abs(dS_qua - dS_qua_exact) < 1e-12,
  `quaternary ΔS must equal 2·R·ln2`);

// Asymmetric binary (0.3/0.7)
const dS_asym = R_gas * mixingEntropy([0.3, 0.7]);
row('\nAsymmetric binary (0.3/0.7)', dS_asym, 'J/(mol·K)');

// Pure component x=1 → ΔS=0 exactly (x·ln(x)→0 as x→1)
const dS_pure = mixingEntropy([1.0, 0.0]);
row('Pure component (1,0) ΔS/R', dS_pure, '(must be 0 exactly)');
assert(dS_pure === 0, `pure component ΔS must be 0; got ${dS_pure}`);

// Maximum at equimolar: binary ≥ asymmetric
assert(dS_bin >= dS_asym, 'equimolar binary must maximise ΔS among binary mixtures');
row('\nMax binary ΔS = R·ln2',  dS_bin_exact, 'J/(mol·K)  confirmed equimolar maximum');

// ═══════════════════════════════════════════════════════════════════════
// 2. STDP (Spike-Timing-Dependent Plasticity)
// ═══════════════════════════════════════════════════════════════════════
sec('2. STDP');

// Song, Miller & Abbott (2000, Nat. Neurosci. 3:919) parameters:
//   A₊ = 0.005,  A₋ = A₊ × 1.05 = 0.00525,  τ₊ = τ₋ = 20 ms
//
// Convention: Δt = t_post − t_pre
//   Δt > 0  (pre fires before post) → LTP:  Δw = +A₊ · exp(−Δt/τ₊)
//   Δt < 0  (post fires before pre) → LTD:  Δw = −A₋ · exp( Δt/τ₋)
//
// Net area (integral over all Δt):
//   ∫₀^∞ A₊·e^{-Δt/τ₊} dΔt − ∫₀^∞ A₋·e^{-Δt/τ₋} dΔt
//   = A₊·τ₊ − A₋·τ₋ (in time units of τ)
//
// TRAP: A₋/A₊ = 1.05 > 1 → net LTD → weights shrink under random Poisson pairing
//   → steady-state weight distribution is BIMODAL (Song 2000 Fig. 3)

const A_plus  = 0.005;           // LTP amplitude
const A_minus = A_plus * 1.05;   // LTD amplitude = 0.00525  (A₋/A₊ = 1.05)
const tau_p   = 20e-3;           // s  (20 ms)
const tau_m   = 20e-3;           // s  (20 ms)

row('A₊', A_plus,  '(Song 2000)');
row('A₋', A_minus, '= A₊ × 1.05');
row('A₋/A₊', A_minus/A_plus, '(must be 1.05 exactly)');
assert(Math.abs(A_minus/A_plus - 1.05) < 1e-15,
  `A₋/A₊ must be 1.05; got ${A_minus/A_plus}`);

// Point kernel values at Δt = ±10 ms  (independent: e^{-0.5} from Taylor)
const dt_ex = 10e-3;   // 10 ms
const e_half = Math.exp(-0.5);  // ≈ 0.60653
const dw_ltp = A_plus  * e_half;   // kernel(+10ms)
const dw_ltd = A_minus * e_half;   // |kernel(-10ms)|

row('\nkernel(Δt=+10ms) = A₊·e^{-0.5}', dw_ltp,   '(LTP)');
row('|kernel(Δt=−10ms)| = A₋·e^{-0.5}', dw_ltd,  '(LTD magnitude)');
assert(Math.abs(dw_ltp - 0.005 * Math.exp(-0.5)) < 1e-15,
  `kernel(+10ms) must be 0.005·e^{-0.5}`);
assert(dw_ltd > dw_ltp, 'LTD point value must exceed LTP for |Δt|=10ms (A₋>A₊, τ equal)');

// Net area (ms units)
const ltp_area = A_plus  * tau_p * 1000;   // 0.005 × 20 = 0.1 ms
const ltd_area = A_minus * tau_m * 1000;   // 0.00525 × 20 = 0.105 ms
const net_area = ltp_area - ltd_area;       // −0.005 ms  (LTD dominant)

row('\nLTP area = A₊·τ₊ (ms)', ltp_area, 'ms  = 0.1 exactly');
row('LTD area = A₋·τ₋ (ms)', ltd_area, 'ms  = 0.105 exactly');
row('Net area (ms)',           net_area, 'ms  NEGATIVE → LTD dominant → bimodal weights');
assert(Math.abs(ltp_area - 0.1) < 1e-15,
  `LTP area must be 0.1 ms; got ${ltp_area}`);
assert(Math.abs(ltd_area - 0.105) < 1e-15,
  `LTD area must be 0.105 ms; got ${ltd_area}`);
assert(Math.abs(net_area - (-0.005)) < 1e-15,
  `net area must be -0.005 ms; got ${net_area}`);

// Numerical ∫ kernel dΔt over [−5τ, +5τ]: cross-check
const T_int = 20 * Math.max(tau_p, tau_m);  // 20τ → truncation error ≈ A·τ·e^{-20} < 1e-10
const N_int = 100000;
const dt_int = 2 * T_int / N_int;
let integral = 0;
for (let i = 0; i < N_int; i++) {
  const dt = -T_int + (i + 0.5) * dt_int;
  // Δt = t_post − t_pre: dt>0 → LTP, dt<0 → LTD
  const dw = dt > 0
    ? A_plus  * Math.exp(-dt / tau_p)
    : -A_minus * Math.exp( dt / tau_m);
  integral += dw * dt_int;
}
row('\nNumerical ∫ kernel dΔt (ms)', integral * 1000, 'ms  (should ≈ net_area)');
assert(Math.abs(integral * 1000 - net_area) < 1e-5,
  `numerical integral ${integral*1000} must match net_area ${net_area}`);

// ═══════════════════════════════════════════════════════════════════════
// 3. CABLE EQUATION
// ═══════════════════════════════════════════════════════════════════════
sec('3. CABLE EQUATION');

// Steady-state semi-infinite cable: V(x) = V₀·e^{−x/λ}
// Space constant: λ = √(r_m / r_i)
//   r_m = Rm / (π·d)      [Ω·m]   membrane resistance per unit length
//   r_i = 4·Ra / (π·d²)   [Ω/m]   axial resistance per unit length
// Cancelling: λ = (1/2)·√(d·Rm/Ra)   [m]
// λ ∝ √d (NOT d or d²)

const d_axon  = 1e-6;    // m   (1 μm diameter)
const Rm_spec = 0.1;     // Ω·m²  (specific membrane resistance)
const Ra_spec = 1.0;     // Ω·m   (specific axial resistivity)

const r_m = Rm_spec / (Math.PI * d_axon);
const r_i = 4 * Ra_spec / (Math.PI * d_axon**2);
const lambda_from_ri = Math.sqrt(r_m / r_i);

// Independent check via simplified form
const lambda_simplified = 0.5 * Math.sqrt(d_axon * Rm_spec / Ra_spec);

row('r_m = Rm/(π·d)  [Ω·m]',       r_m,              'Ω·m per unit length');
row('r_i = 4Ra/(π·d²)  [Ω/m]',     r_i,              'Ω/m');
row('\nλ = √(r_m/r_i)  [m]',        lambda_from_ri,   'm');
row('λ = (1/2)·√(d·Rm/Ra)  [m]',    lambda_simplified,'m  (must match)');
row('λ in μm',                       lambda_from_ri*1e6,'μm  (≈158 μm)');
assert(Math.abs(lambda_from_ri - lambda_simplified) < 1e-20,
  `two λ formulas must agree; discrepancy ${lambda_from_ri - lambda_simplified}`);

// Verify V at key distances
row('\nV(0)/V₀ = e^0 = 1',          Math.exp(0),      '(boundary condition)');
row('V(λ)/V₀ = e^{-1}',             Math.exp(-1),     '≈ 0.36788');
row('V(2λ)/V₀ = e^{-2}',            Math.exp(-2),     '≈ 0.13534');
assert(Math.abs(Math.exp(-1) - 0.36787944117144233) < 1e-15,
  'e^{-1} spot check');

// λ scales as √d: 10 μm vs 1 μm → ratio = √10
const d_large = 10e-6;
const lambda_large = 0.5 * Math.sqrt(d_large * Rm_spec / Ra_spec);
const ratio_lambda = lambda_large / lambda_from_ri;
row('\nλ(10μm)/λ(1μm)',             ratio_lambda,      '= √10 (since λ ∝ √d)');
row('√10',                          Math.sqrt(10),     '(must match above)');
assert(Math.abs(ratio_lambda - Math.sqrt(10)) < 1e-12,
  `λ ratio must be √10; got ${ratio_lambda}`);

// ═══════════════════════════════════════════════════════════════════════
// 4. RANDOM WALK
// ═══════════════════════════════════════════════════════════════════════
sec('4. RANDOM WALK');

// 1D symmetric ±1 walk of n steps:
//   E[Xₙ] = 0                   (unbiased)
//   E[Xₙ²] = n                  (EXACT: independence gives Var = n·1)
//   E[|Xₙ|] = n·C(n,n/2)/2^n   (EXACT formula for even n)
//   E[|Xₙ|] ≈ √(2n/π)          (ASYMPTOTIC: from CLT / half-normal)
//
// These two are DIFFERENT. For n=100:
//   Exact: 100·C(100,50)/2^100 = 7.9589...
//   Asymp: √(200/π)            = 7.9788...
//   Error ≈ 0.020 (≈0.25%)

const n_steps = 100;

// Exact E[|X_100|] via log of C(100,50)
// log C(100,50) = Σ_{k=1}^{50} [log(101-k) - log(k)]
let logC100_50 = 0;
for (let k = 1; k <= 50; k++) logC100_50 += Math.log(101 - k) - Math.log(k);
const E_abs_exact = n_steps * Math.exp(logC100_50 - n_steps * Math.LN2);

// Asymptotic approximation
const E_abs_asymp = Math.sqrt(2 * n_steps / Math.PI);

row('n steps',                     n_steps,       '');
row('E[X²] = n (EXACT)',           n_steps,       'integer, zero tolerance');
row('E[|X|] EXACT = 100·C(100,50)/2^100', E_abs_exact,  '');
row('E[|X|] ASYMPTOTIC = √(200/π)', E_abs_asymp,  'CLT / half-normal approx');
row('Error (asymp − exact)',        E_abs_asymp - E_abs_exact, '≈ 0.020 (0.25%)');
assert(Math.abs(E_abs_exact - 7.9589) < 0.0001,
  `exact E[|X_100|] must be ≈7.9589; got ${E_abs_exact}`);
assert(E_abs_asymp > E_abs_exact,
  'asymptotic √(2n/π) overestimates exact for n=100');

// MC MSD tolerance
// Var(Xₙ²) = E[Xₙ⁴] − (E[Xₙ²])² = 2n² − 2n  (for symmetric ±1 walk)
// SE of MSD estimate from trials simulations: √((2n²−2n) / trials)
// Use tolerance = 4·SE
const trials_msd = 10000;
const var_X2 = 2*n_steps**2 - 2*n_steps;   // = 19800
const SE_msd  = Math.sqrt(var_X2 / trials_msd);
const tol_msd = 4 * SE_msd;
row('\nVar(X²) = 2n²−2n',          var_X2,    '= 19800 (not 2n²=20000)');
row('SE of MSD (trials=10000)',     SE_msd,    '≈ 1.407');
row('4·SE tolerance for MC test',  tol_msd,   '≈ 5.63');
assert(Math.abs(var_X2 - (2*n_steps**2 - 2*n_steps)) < 1e-9,
  `Var(X²) must be 2n²-2n=${2*n_steps**2-2*n_steps}`);

// 2D nearest-neighbour random walk: steps are {±1,0} or {0,±1}
// Each step moves exactly 1 unit in one axis (4 choices equally likely)
// X and Y are independent; each has n steps of ±1 with equal prob → E[X²]=n, E[Y²]=n
// Wait: in nearest-neighbour 2D, at each time step ONE coordinate changes by ±1.
// So after n steps, each coordinate changes on average n/2 times.
// E[X²] = n/2 (x-steps), E[Y²] = n/2 (y-steps) ... actually:
// The x-coordinate moves only when the walk goes left or right (prob 1/2 each step).
// So x takes a ±1 step each tick with prob 1/2, stays put with prob 1/2.
// E[x²] after n steps = n/2·1 = n/2 (only n/2 expected x-steps).
// E[r²] = E[x²]+E[y²] = n/2 + n/2 = n.
// CONTRAST: diagonal 2D walk (each step is (+/-1, +/-1)):
//   Each step contributes 1 to x AND 1 to y → E[r²] = E[x²]+E[y²] = n+n = 2n.
row('\n2D nearest-neighbour walk: E[r²] = n', n_steps, 'each step moves 1 axis');
row('2D diagonal walk: E[r²] = 2n',           2*n_steps, 'each step moves both axes');

// Gambler's ruin: absorbing barriers at 0 and N, start at k
const k_ruin = 30, N_ruin = 100;
const p_win = k_ruin / N_ruin;        // = 0.3 exact
const mean_T_ruin = k_ruin * (N_ruin - k_ruin);  // = 30×70 = 2100
row('\nGambler ruin (k=30, N=100)');
row('  P(win) = k/N = 0.3',         p_win,        'exact rational');
row('  E[T] = k(N−k) = 2100',       mean_T_ruin,  'exact integer');
assert(Math.abs(p_win - 0.3) < 1e-15, 'P(win) must be 0.3 exactly');
assert(mean_T_ruin === 2100,           'E[T] must be 2100 exactly');

// Gambler's ruin via absorbing Markov chain (fundamental matrix N = (I-Q)^{-1}):
// For k=1 start, N=3 barriers (0 and 3): transient states {1,2}
// Q = [[0, 1/2], [1/2, 0]];  I-Q = [[1,-1/2],[-1/2,1]]
// (I-Q)^{-1} = (1/(1-1/4))·[[1,1/2],[1/2,1]] = (4/3)·[[1,1/2],[1/2,1]]
// E[T | start 1] = row 1 sum of N·1 = (4/3)·(1+1/2) = (4/3)·(3/2) = 2
// Check: k(N-k) = 1·2 = 2 ✓
const k_small = 1, N_small = 3;
const E_T_check = k_small * (N_small - k_small);  // = 2
// Fundamental matrix for N=3: (I-Q)^{-1} where Q is 2×2 [[0,1/2],[1/2,0]]
// (I-Q)^{-1} = (4/3)[[1,1/2],[1/2,1]]  → row-1 sum = (4/3)(1+0.5) = 2  ✓
const N_fund_row1 = (4/3) * (1 + 0.5);
row('\nFundamental matrix check (k=1, N=3)');
row('  E[T] = k(N-k) = 1×2 = 2',   E_T_check,    'exact');
row('  (I-Q)^{-1} row 1 sum',       N_fund_row1,  '(must equal E[T]=2)');
assert(Math.abs(N_fund_row1 - E_T_check) < 1e-14,
  `fundamental matrix E[T] must be ${E_T_check}; got ${N_fund_row1}`);

// ═══════════════════════════════════════════════════════════════════════
// 5. SOLOW GROWTH MODEL
// ═══════════════════════════════════════════════════════════════════════
sec('5. SOLOW GROWTH MODEL');

// Cobb-Douglas per effective worker: y = A·k^α
// Capital accumulation: dk/dt = s·A·k^α − (n + δ + g)·k
// where g = labour-augmenting (TFP) growth rate.
// Steady state: k* = (sA/(n+δ+g))^{1/(1-α)}
//
// With α = 1/3 EXACTLY and s=0.3, A=1, n=0.01, δ=0.05, g=0:
//   denom = n+δ+g = 0.06 = 3/50
//   sA/denom = 0.3/0.06 = 5
//   k* = 5^{1/(1-1/3)} = 5^{3/2} = 5·√5 = 11.18034...  (EXACT)
//   y* = (k*)^{1/3} = (5^{3/2})^{1/3} = 5^{1/2} = √5    (EXACT)
//   c* = (1-s)·y* = 0.7·√5                               (EXACT)
//
// Golden rule: f'(k_GR) = n+δ+g → α·k_GR^{α-1} = 0.06 → k_GR^{1-α} = α/0.06 = 1/0.18 = 50/9
//   k_GR = (50/9)^{3/2} = (50/9)·√(50/9) = 250√2/27      (EXACT)
//   y_GR = (k_GR)^{1/3} = (50/9)^{1/2} = 5√2/3            (EXACT)
//   c_GR = y_GR − 0.06·k_GR = 5√2/3 − 0.06·250√2/27
//        = 5√2/3 − 5√2/9 = (15√2 − 5√2)/9 = 10√2/9       (EXACT)
//   s_GR = α = 1/3 for any A (golden rule condition)

const alpha_exact = 1/3;   // EXACTLY 1/3
const s_sol  = 0.30;
const A_sol  = 1.00;
const n_sol  = 0.01;
const delta_sol = 0.05;
const g_sol  = 0.00;   // g = labour-augmenting growth (0 for baseline)

const denom_sol = n_sol + delta_sol + g_sol;  // = 0.06

// k* via formula
const k_star_sol = Math.pow(s_sol * A_sol / denom_sol, 1 / (1 - alpha_exact));
// Independent derivation: 5^(3/2) = 5·√5
const k_star_exact = 5 * Math.sqrt(5);
const y_star_sol = Math.sqrt(5);               // = 5^{1/2}
const c_star_sol = 0.7 * Math.sqrt(5);         // = 0.7·√5

row('α = 1/3 (EXACT)',              alpha_exact, '');
row('sA/(n+δ+g) = 0.3/0.06 = 5',   s_sol*A_sol/denom_sol, '= 5 exactly');
row('\nk* computed',                 k_star_sol,  '');
row('k* = 5·√5 (exact)',            k_star_exact,'');
row('k* discrepancy',               k_star_sol - k_star_exact, '(must be ≈ 0)');
assert(Math.abs(k_star_sol - k_star_exact) < 1e-10,
  `k* must be 5·√5=${k_star_exact}; got ${k_star_sol}`);

row('\ny* = √5 (exact)',             y_star_sol,  '');
row('y* computed',                   A_sol * Math.pow(k_star_sol, alpha_exact), '');
assert(Math.abs(A_sol * Math.pow(k_star_sol, alpha_exact) - y_star_sol) < 1e-12,
  `y* must be √5=${y_star_sol}`);

row('\nc* = 0.7·√5 (exact)',         c_star_sol,  '');
assert(Math.abs((1-s_sol)*y_star_sol - c_star_sol) < 1e-15,
  `c* must be 0.7·√5`);

// Golden rule
const k_GR_sol = Math.pow(50/9, 3/2);           // = (50/9)^{3/2}
const c_GR_sol = 10 * Math.sqrt(2) / 9;          // = 10√2/9
const k_GR_comp = Math.pow(alpha_exact * A_sol / denom_sol, 1/(1-alpha_exact));

row('\nk_GR = (50/9)^{3/2} (exact)',  k_GR_sol,  '');
row('k_GR computed',                  k_GR_comp, '');
row('k_GR discrepancy',               k_GR_comp - k_GR_sol, '(must be ≈ 0)');
assert(Math.abs(k_GR_comp - k_GR_sol) < 1e-10,
  `k_GR must be (50/9)^{3/2}=${k_GR_sol}`);

row('\nc_GR = 10√2/9 (exact)',        c_GR_sol,  '');
const y_GR_comp = A_sol * Math.pow(k_GR_comp, alpha_exact);
const c_GR_comp = y_GR_comp - denom_sol * k_GR_comp;
row('c_GR computed',                  c_GR_comp, '');
assert(Math.abs(c_GR_comp - c_GR_sol) < 1e-10,
  `c_GR must be 10√2/9=${c_GR_sol}`);

// s_GR = α (exact, any A, Cobb-Douglas)
const s_GR_check = 1 - c_GR_comp / y_GR_comp;
row('\ns_GR computed',                s_GR_check,       '');
row('s_GR − α (must be ≈ 0)',        s_GR_check - alpha_exact, '');
assert(Math.abs(s_GR_check - alpha_exact) < 1e-12,
  `s_GR must equal α=1/3`);

// Verify steady state: investment = breakeven
const invest_sol = s_sol * y_star_sol;
const breakeven  = denom_sol * k_star_sol;
row('\nInvestment s·y*',             invest_sol,  '(must = (n+δ)·k*)');
row('Breakeven (n+δ)·k*',           breakeven,   '');
row('Discrepancy',                   invest_sol - breakeven, '(must be ≈ 0)');
assert(Math.abs(invest_sol - breakeven) < 1e-12,
  `investment must equal breakeven at steady state`);

// Exact linearization for RK4 dt-halving test:
// Change of variable z = k^{1-α}:
//   dz/dt = (1-α)·k^{-α}·dk/dt = (1-α)·[sA − (n+δ+g)·k^{1-α}]
//         = (1-α)·sA − (1-α)(n+δ+g)·z
// Steady state: z* = (k*)^{1-α} = 5 (= sA/denom)
// Linear ODE: dz/dt = −(1-α)(n+δ+g)·(z − z*)
// Solution: z(t) = z* + (z₀ − z*)·exp(−(1-α)(n+δ+g)·t)
// Convergence rate: μ = (1-α)·(n+δ+g) = (2/3)·0.06 = 0.04
const mu_solow = (1 - alpha_exact) * denom_sol;  // = 0.04
const z_star = Math.pow(k_star_sol, 1 - alpha_exact);  // = 5

row('\nExact linearization: z = k^{1-α}');
row('  z* = (k*)^{2/3} = 5',         z_star,    '');
row('  convergence rate μ = 2/3·0.06 = 0.04', mu_solow, '');
// Check: at k0=2, z0=2^(2/3); after t=200 yr z should be z* to within exp(-8)
const k0_sol = 2;
const z0_sol = Math.pow(k0_sol, 1 - alpha_exact);
const t_test = 200;
const z_t_exact = z_star + (z0_sol - z_star) * Math.exp(-mu_solow * t_test);
const k_t_exact = Math.pow(z_t_exact, 1/(1-alpha_exact));
row('  k(t=200, k0=2) from exact soln', k_t_exact, '(should be ≈ k*)');
row('  |k(200) − k*| / k*',          Math.abs(k_t_exact - k_star_sol)/k_star_sol, '(< 1e-3)');
assert(Math.abs(k_t_exact - k_star_sol) / k_star_sol < 1e-3,
  `exact solution must be within 0.1% of k* at t=200`);

// ═══════════════════════════════════════════════════════════════════════
// 6. OPINION DYNAMICS
// ═══════════════════════════════════════════════════════════════════════
sec('6. OPINION DYNAMICS');

// DeGroot model: x(t+1) = W·x(t)
// TRAP: consensus = π·x₀ where π is the LEFT eigenvector (stationary distribution).
//   π satisfies: π·W = π  (row vector; NOT W·π = π which is the right eigenvector).
//   For row-stochastic W: right eigenvector = 1 (all ones); NOT the consensus.
//   Left eigenvector found by power iteration on Wᵀ.
// Do NOT use jacobiEigen (symmetric-only) on a general W.

const opinions_0 = [0.1, 0.3, 0.5, 0.7, 0.9];
const mean_op = opinions_0.reduce((a,b)=>a+b,0) / opinions_0.length;
row('Mean of x₀ (conserved for doubly stochastic)', mean_op, '= 0.5');
assert(Math.abs(mean_op - 0.5) < 1e-15, 'initial mean must be 0.5');

// 3-agent example: W is not symmetric
const W3 = [[0.5, 0.3, 0.2],
            [0.2, 0.6, 0.2],
            [0.1, 0.3, 0.6]];

// Verify row sums = 1
W3.forEach((r, i) => {
  const s = r.reduce((a,b)=>a+b,0);
  assert(Math.abs(s - 1) < 1e-15, `W3 row ${i} sum must be 1; got ${s}`);
});
row('W3 row sums', 'all 1.0', 'validated');

// Power iteration for left eigenvector: v ← v·W  (row vector times matrix)
function leftEigenvec(W, iter=2000) {
  const n = W.length;
  let v = Array(n).fill(1/n);
  for (let k = 0; k < iter; k++) {
    const vn = Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        vn[j] += v[i] * W[i][j];
    const s = vn.reduce((a,b)=>a+b,0);
    v = vn.map(x => x/s);
  }
  return v;
}

const pi3 = leftEigenvec(W3);
// Verify π·W = π
const piW = Array(3).fill(0);
for (let i = 0; i < 3; i++)
  for (let j = 0; j < 3; j++)
    piW[j] += pi3[i] * W3[i][j];
const pi_residual = pi3.map((p,j) => Math.abs(p - piW[j])).reduce((a,b)=>a+b,0);
row('\nW3 left eigenvector π',  pi3.map(x=>x.toFixed(6)).join(', '), '');
row('π·W − π residual (must be ≈0)', pi_residual, '');
assert(pi_residual < 1e-10, `π·W=π residual must be < 1e-10; got ${pi_residual}`);

const x0_degroot = [0.2, 0.8, 0.5];
const consensus3 = pi3.reduce((s, pi_i, i) => s + pi_i * x0_degroot[i], 0);
row('Consensus = π·x₀ for x₀=[0.2,0.8,0.5]', consensus3, '≈ 0.5571');
assert(Math.abs(consensus3 - 0.5571) < 1e-3,
  `consensus must be ≈ 0.5571; got ${consensus3}`);

// Cross-check: long-run W^200·x₀ must match π·x₀
let x_cur = [...x0_degroot];
for (let t = 0; t < 200; t++) {
  const xn = Array(3).fill(0);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      xn[i] += W3[i][j] * x_cur[j];
  x_cur = xn;
}
row('\nW^200·x₀[0]',           x_cur[0],  '(must ≈ consensus)');
row('|W^200·x₀[0] − consensus|', Math.abs(x_cur[0] - consensus3), '(< 1e-6)');
assert(Math.abs(x_cur[0] - consensus3) < 1e-6,
  `W^200·x₀[0]=${x_cur[0]} must match consensus=${consensus3}`);

// ═══════════════════════════════════════════════════════════════════════
// 7. AGE-STRUCTURED POPULATION (LESLIE MATRIX)
// ═══════════════════════════════════════════════════════════════════════
sec('7. AGE-STRUCTURED POPULATION (LESLIE MATRIX)');

// EIGENSOLVER TRAP:
//   jacobiEigen (js/core/LinAlg.js) is SYMMETRIC-ONLY.
//   Leslie matrices are generally NOT symmetric → do NOT use jacobiEigen.
//   For 2-age: use eigen2x2 (exact) or solve char poly directly.
//   For 3-age: use power iteration.
//
// PRIMITIVE vs IMPRIMITIVE:
//   A non-negative matrix is primitive if it is irreducible AND aperiodic.
//   Power iteration converges to dominant eigenvalue only for PRIMITIVE matrices.
//   Perron-Frobenius guarantees a unique positive dominant eigenvalue for PRIMITIVE matrices.
//   (Not for general positive matrices — a positive periodic matrix is imprimitive.)

// ── 2-age IMPRIMITIVE boundary case: L = [[0, 4], [0.5, 0]]
// Char poly: λ² − f·s = 0  →  λ = ±√(4·0.5) = ±√2
// |λ₂/λ₁| = 1 (two eigenvalues of equal modulus) → IMPRIMITIVE
// Power iteration oscillates (does not converge to a stable age distribution).
// Primitivity check: L² = [[4·0.5, 0],[0, 4·0.5]] = [[2,0],[0,2]] is diagonal, not positive.
// Model MUST detect this and report "imprimitive: no stable age distribution".
const f_2age = 4, s_2age = 0.5;
const lambda_2age_pos = Math.sqrt(s_2age * f_2age);   //  +√2
const lambda_2age_neg = -Math.sqrt(s_2age * f_2age);  //  −√2
row('2-age L=[[0,4],[0.5,0]]: λ₁ = +√2', lambda_2age_pos, `= ${Math.SQRT2}`);
row('2-age: λ₂ = −√2',                    lambda_2age_neg, '(imprimitive: |λ₂|=|λ₁|)');
row('|λ₂/λ₁| = 1',  Math.abs(lambda_2age_neg/lambda_2age_pos), '(must be 1 exactly)');
assert(Math.abs(lambda_2age_pos - Math.SQRT2) < 1e-15,
  `λ₁ for 2-age must be √2; got ${lambda_2age_pos}`);
assert(Math.abs(lambda_2age_neg/lambda_2age_pos) - 1 < 1e-15,
  '|λ₂/λ₁| must be 1 (imprimitive)');

// ── 3-age PRIMITIVE main example: L = [[0, 1, 5], [s₀, 0, 0], [0, s₁, 0]]
// with s₀=0.4, s₁=0.6  (this is primitive: L³ has all positive entries)
// Char poly: λ³ − s₀·f₁·λ − s₀·s₁·f₂ = λ³ − 0.4·1·λ − 0.4·0.6·5
//           = λ³ − 0.4λ − 1.2 = 0
const L3 = [[0, 1, 5], [0.4, 0, 0], [0, 0.6, 0]];
row('\n3-age L=[[0,1,5],[0.4,0,0],[0,0.6,0]]', '', '');
row('  Char poly: λ³ − 0.4λ − 1.2 = 0', '', '');

// Power iteration — use 400 steps (|λ₂/λ₁|≈0.846; 400 steps → 0.846^400 ≈ 10^{-30})
function powerIterLeslie(L, iter=400) {
  const n = L.length;
  let v = [1, 0.5, 0.3];
  let lam = 0;
  for (let k = 0; k < iter; k++) {
    const Lv = Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        Lv[i] += L[i][j] * v[j];
    const norm = Math.max(...Lv.map(Math.abs));
    lam = norm;
    v = Lv.map(x => x / norm);
  }
  return { lambda: lam, v };
}

const { lambda: lambda_3age, v: stable_age_3 } = powerIterLeslie(L3);
row('  Dominant λ (400-iter power iter)',  lambda_3age, '');
row('  Char poly residual λ³−0.4λ−1.2',   lambda_3age**3 - 0.4*lambda_3age - 1.2, '(must be ≈ 0)');
assert(Math.abs(lambda_3age**3 - 0.4*lambda_3age - 1.2) < 1e-13,
  `char poly residual must be < 1e-13; got ${lambda_3age**3 - 0.4*lambda_3age - 1.2}`);
// |λ₂/λ₁| ≈ 0.846 (complex pair); ~110 iterations for 1e-8 convergence
row('  |λ₂/λ₁| ≈ 0.846 (complex pair)', 0.8464, '→ use 400 iters for 1e-10 precision');

// Euler-Lotka check: l₁f₁/λ² + l₂f₂/λ³ = 1 (derived from char poly ÷ λ³)
const s0_3 = L3[1][0];                  // 0.4
const s1_3 = L3[2][1];                  // 0.6
const l1_3 = s0_3;                       // 0.4
const l2_3 = s0_3 * s1_3;              // 0.24
const el_check = l1_3 * L3[0][1] / lambda_3age**2 + l2_3 * L3[0][2] / lambda_3age**3;
row('  Euler-Lotka: l₁f₁/λ² + l₂f₂/λ³', el_check, '(must be ≈ 1)');
assert(Math.abs(el_check - 1) < 1e-13,
  `Euler-Lotka must equal 1; got ${el_check}`);

// R₀ = net reproductive rate = Σ lₓ·fₓ
const R0_3 = l1_3 * L3[0][1] + l2_3 * L3[0][2];  // = 0.4 + 1.2 = 1.6
row('  R₀ = Σlₓfₓ = 0.4+1.2 = 1.6',   R0_3, '> 1 → growing');
assert(Math.abs(R0_3 - 1.6) < 1e-15, `R₀ must be 1.6; got ${R0_3}`);

// Closed form: λ=1 when s₀ = 1/(f₁ + s₁·f₂)
// Char poly at λ=1: 1 − s₀·f₁ − s₀·s₁·f₂ = 0 → s₀ = 1/(f₁+s₁·f₂)
const f1_3 = L3[0][1], f2_3 = L3[0][2];
const s0_for_lambda1 = 1 / (f1_3 + s1_3 * f2_3);   // = 1/(1+3) = 0.25
const L3_stat = [[0, f1_3, f2_3], [s0_for_lambda1, 0, 0], [0, s1_3, 0]];
const cp_at_1 = 1 - s0_for_lambda1*f1_3 - s0_for_lambda1*s1_3*f2_3;
row('\n  λ=1 closed form: s₀=1/(f₁+s₁f₂)=0.25', s0_for_lambda1, '');
row('  Char poly at λ=1 (must be 0)',            cp_at_1,         '');
assert(Math.abs(s0_for_lambda1 - 0.25) < 1e-15,
  `s₀ for λ=1 must be 0.25; got ${s0_for_lambda1}`);
assert(Math.abs(cp_at_1) < 1e-15,
  `char poly at λ=1 must be 0; got ${cp_at_1}`);

// Verify with power iteration on stationary matrix
const { lambda: lambda_stat } = powerIterLeslie(L3_stat);
row('  λ (power iter, s₀=0.25)',  lambda_stat, '(must be ≈ 1.0000)');
assert(Math.abs(lambda_stat - 1.0) < 1e-8,
  `stationary matrix λ must be 1.0; got ${lambda_stat}`);

// Guard: r = ln(λ) must be guarded when λ ≤ 0
// If λ=0, ln(0) = -Infinity; model must RangeError or return -Inf with a note.
row('\nr = ln(λ) guard: ln(1.1876) =', Math.log(lambda_3age), '(valid)');
row('r at λ=0: ln(0) =',              Math.log(0),            '(must be guarded in model)');

console.log('\n' + '═'.repeat(70));
console.log('anchors-phase9.mjs complete — all asserts passed.');
console.log('═'.repeat(70));
