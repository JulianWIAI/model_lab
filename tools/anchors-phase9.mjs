/**
 * anchors-phase9.mjs — independent numerical anchors for Phase 9 tests.
 *
 * RULES: no model code imported; every value derived from scratch.
 * Run:  node tools/anchors-phase9.mjs
 *
 * Benches: entropy-mixing, stdp, cable-equation, random-walk,
 *          solow, opinion-dynamics, age-structure, Complex.js (infra)
 */

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

// R = 8.314462618 J/(mol·K)  — CODATA 2018; exact since SI 2019 redefinition
// (R = N_A · k_B = 6.02214076e23 × 1.380649e-23 = 8.314462618... J/(mol·K))
const R_gas = 6.02214076e23 * 1.380649e-23;  // J/(mol·K)  exact SI 2019
row('R (gas constant, SI 2019)', R_gas, 'J/(mol·K)');

// Ideal mixing entropy: ΔS_mix = -nR Σ xᵢ ln xᵢ   (n = total moles)
// For 1 mol of mixture:
//   Binary equimolar (x₁=x₂=0.5): ΔS = R·ln 2
//   Ternary equimolar (xᵢ=1/3):   ΔS = R·ln 3
//   Quaternary equimolar (1/4):    ΔS = R·ln 4

function mixingEntropy(xs) {
  // xs: mole fractions (must sum to 1); returns ΔS_mix/R (dimensionless)
  return -xs.reduce((s, x) => s + (x > 0 ? x * Math.log(x) : 0), 0);
}

const dS_bin = R_gas * mixingEntropy([0.5, 0.5]);     // = R·ln2
const dS_ter = R_gas * mixingEntropy([1/3, 1/3, 1/3]); // = R·ln3
const dS_qua = R_gas * mixingEntropy([0.25, 0.25, 0.25, 0.25]); // = R·ln4

row('\nBinary equimolar ΔS (R·ln2)',    dS_bin, 'J/(mol·K)  exact');
row('  R·ln2 (check)',                  R_gas * Math.LN2, 'J/(mol·K)');
row('  discrepancy (should be 0)',       dS_bin - R_gas * Math.LN2, '');

row('\nTernary equimolar ΔS (R·ln3)',   dS_ter, 'J/(mol·K)');
row('  R·ln3 (check)',                  R_gas * Math.log(3), 'J/(mol·K)');

row('\nQuaternary equimolar ΔS (R·ln4)',dS_qua, 'J/(mol·K)  = 2·R·ln2');
row('  2·R·ln2 (check)',               2 * R_gas * Math.LN2, '');

// Non-equimolar binary: x₁=0.3, x₂=0.7
const dS_asym = R_gas * mixingEntropy([0.3, 0.7]);
row('\nAsymmetric binary (0.3/0.7) ΔS', dS_asym, 'J/(mol·K)');

// Boundary: pure component x₁=1 → ΔS = 0 (no mixing)
const dS_pure = mixingEntropy([1.0, 0.0]);
row('Pure component (1,0) ΔS/R',        dS_pure, '(must be 0 exactly)');

// Monotonicity: maximum at equimolar (ΔS_max = R·ln n_components)
row('\nMax binary entropy = R·ln2',    R_gas * Math.LN2, 'J/(mol·K)');
row('Max ternary entropy = R·ln3',     R_gas * Math.log(3), 'J/(mol·K)');

// ═══════════════════════════════════════════════════════════════════════
// 2. STDP (Spike-Timing-Dependent Plasticity)
// ═══════════════════════════════════════════════════════════════════════
sec('2. STDP');

// STDP kernel (Song, Miller & Abbott 2000, Nat. Neurosci. 3:919):
//   Δw(Δt > 0) = A₊ · exp(-Δt / τ₊)   [pre-before-post → LTP]
//   Δw(Δt < 0) = -A₋ · exp(Δt / τ₋)   [post-before-pre → LTD]
//
// Song et al. (2000) parameters (cited, not fetched):
//   τ₊ = τ₋ = 20 ms,  A₊ = 0.01,  A₋ = A₊ × (τ₊/τ₋) × 1.05 = 0.0105
//
// TRAP: net sign of weight change depends on A₊·τ₊ vs A₋·τ₋.
//   Net area = ∫₀^∞ A₊·e^{-Δt/τ₊} d(Δt) − ∫₀^∞ A₋·e^{-Δt/τ₋} d(Δt)
//            = A₊·τ₊ − A₋·τ₋

const A_plus  = 0.01;   // LTP amplitude
const A_minus = 0.0105; // LTD amplitude  (Song 2000: A₋ = A₊·1.05 for τ₊=τ₋)
const tau_p   = 20e-3;  // s   (20 ms)
const tau_m   = 20e-3;  // s   (20 ms)

const ltp_area = A_plus  * tau_p * 1000;  // convert to ms units
const ltd_area = A_minus * tau_m * 1000;
const net_area = ltp_area - ltd_area;

row('LTP area = A₊·τ₊ (ms)',       ltp_area,  'ms  (Song 2000)');
row('LTD area = A₋·τ₋ (ms)',       ltd_area,  'ms');
row('Net area = LTP − LTD (ms)',    net_area,  'ms  NEGATIVE → LTD dominant → weights shrink on avg');

// Point values at Δt = +10 ms and -10 ms
const dt_ex = 10e-3;  // 10 ms
const dw_ltp = A_plus  * Math.exp(-dt_ex / tau_p);
const dw_ltd = A_minus * Math.exp(-dt_ex / tau_m);  // note: negative contribution
row('\nΔw(Δt=+10ms) = A₊·e^{-0.5}',  dw_ltp, '(LTP)');
row('-Δw(Δt=-10ms) = A₋·e^{-0.5}',   dw_ltd, '(LTD magnitude)');
row('LTP > LTD for this Δt?',         dw_ltp > dw_ltd ? 'yes' : 'no', 'true for all |Δt| when A₊<A₋ but τ₊=τ₋');

// Symmetric simplified kernel: τ₊=τ₋=τ, A₊=A₋=A → net area = 0 (no bias)
// Song (2000) asymmetry: A₋/A₊ = 1.05 → slightly net LTD
row('\nA₋/A₊ ratio',                  A_minus/A_plus, '(>1 → net LTD; Song 2000: 1.05)');

// Integral test: ∫₋ᵀ^T kernel(Δt) d(Δt) ≈ (A₊τ₊ − A₋τ₋) for large T
const T_int = 5 * Math.max(tau_p, tau_m);
const N_int = 100000;
const dt_int = 2 * T_int / N_int;
let integral = 0;
for (let i = 0; i < N_int; i++) {
  const dt = -T_int + (i + 0.5) * dt_int;
  const dw = dt > 0
    ? A_plus  * Math.exp(-dt / tau_p)
    : -A_minus * Math.exp( dt / tau_m);
  integral += dw * dt_int;
}
row('\nNumerical ∫ kernel dΔt (s)',    integral * 1000, 'ms  (should match net_area)');
row('Closed form net area (ms)',       net_area, 'ms');

// ═══════════════════════════════════════════════════════════════════════
// 3. CABLE EQUATION
// ═══════════════════════════════════════════════════════════════════════
sec('3. CABLE EQUATION');

// Steady-state cable equation:
//   V(x) = V₀ · e^{-x/λ}
//   λ = √(r_m / r_i)
// where:
//   r_m = membrane resistance per unit length [Ω·m]  = Rm / (π·d)
//   r_i = axial resistance per unit length [Ω/m]    = 4Ra / (π·d²)
//   λ = d/2 · √(Rm / Ra)   (standard result after cancellation)
//
// Physical intuition: λ is the length over which V drops by 1/e.
// Larger d → larger λ (thicker axons have better signal propagation).
// Larger Rm (or lower Ra) → larger λ.
//
// Reference: Rall (1967) J. Neurophysiol. 30:1138 — cited, not fetched.

const d_axon  = 1e-6;    // m   (1 μm diameter, thin axon)
const Rm_spec = 0.1;     // Ω·m²  (specific membrane resistance = 1 Ω·cm² × 1e-4)
const Ra_spec = 1.0;     // Ω·m   (specific axial resistance = 100 Ω·cm × 1e-2)

// r_m = Rm / (π·d),  r_i = 4Ra / (π·d²)
const r_m = Rm_spec / (Math.PI * d_axon);
const r_i = 4 * Ra_spec / (Math.PI * d_axon**2);
const lambda_cable = Math.sqrt(r_m / r_i);
// λ = (1/2)·√(d·Rm/Ra)  — simplified from √(r_m/r_i)
const lambda_check = 0.5 * Math.sqrt(d_axon * Rm_spec / Ra_spec);

row('d (axon diameter, m)',            d_axon,        'm');
row('Rm (specific membrane R, Ω·m²)', Rm_spec,       'Ω·m²');
row('Ra (axial resistivity, Ω·m)',     Ra_spec,       'Ω·m');
row('r_m = Rm/(π·d)  [Ω·m]',          r_m,           'Ω·m  per unit length (not Ω·m²)');
row('r_i = 4Ra/(π·d²)  [Ω/m]',        r_i,           'Ω/m');
row('\nλ = √(r_m/r_i)  (m)',           lambda_cable,  'm');
row('λ = d/2·√(Rm/Ra) (check)',        lambda_check,  'm  (must match above)');
row('λ in μm',                         lambda_cable*1e6, 'μm  (≈158 μm for these params)');

// Verify: V at x=λ should be V₀/e = V₀·exp(-1)
row('\nV(λ)/V₀ = e^{-1}',             Math.exp(-1),  '≈ 0.368');
// V at x=2λ:
row('V(2λ)/V₀ = e^{-2}',             Math.exp(-2),  '≈ 0.135');

// Larger axon: d=10 μm → λ scales as √d  (since λ = (1/2)√(d·Rm/Ra) ∝ √d)
const d_large = 10e-6;
const lambda_large = 0.5 * Math.sqrt(d_large * Rm_spec / Ra_spec);
row('\nλ(d=10μm) / λ(d=1μm)',         lambda_large / lambda_cable, '= √10 ≈ 3.162 (since λ ∝ √d)');
row('√10 check',                      Math.sqrt(10),                '');

// Half-electrotonic length: V(L/2) / V₀ for L = λ
row('\nElectrotonic scaling (exact):');
row('  e^{-0} = 1',                   Math.exp(0),   '(boundary condition)');
row('  e^{-0.5} = √e⁻¹',             Math.exp(-0.5),'≈ 0.6065');
row('  e^{-1}',                       Math.exp(-1),  '≈ 0.3679');
row('  e^{-2}',                       Math.exp(-2),  '≈ 0.1353');

// ═══════════════════════════════════════════════════════════════════════
// 4. RANDOM WALK
// ═══════════════════════════════════════════════════════════════════════
sec('4. RANDOM WALK');

// 1D symmetric: steps ±1 with equal probability.
//   E[X_n] = 0 (unbiased)
//   E[X_n²] = n  (exact, by independence: Var(sum) = n·Var(single step) = n·1)
//   E[|X_n|] ≈ √(2n/π)  (Gaussian approx, valid for large n)
//   P(|X_n| ≤ k) ≈ erf(k/√(2n))  (by CLT)
//
// Gambler's ruin (absorbing barriers at 0 and N, start at k):
//   P(reach N before 0 | start k) = k/N  (symmetric)
//   For start at a above 0, absorbing walls at +a+b and -b:
//   P(reach +a+b) = (b+a)/(a+b) ... wait
//   Actually: P(reach +N before 0 | start at k) = k/N
//   So P(reach +a | start 0, absorbing at -b and +a) is NOT well-defined (0 is interior)
//   Standard: start at s, absorbing at 0 and N: P(reach N) = s/N
//
// Diffusion: D = σ²/(2Δt) for continuous time
//   For discrete ±1 steps with step size Δx and time step Δt:
//   D = (Δx)²/(2Δt)
//
// 2D isotropic: E[r²] = 4Dt = 4·(1/2)·n = 2n (for unit steps in 2D, D=1/2 per dimension)
//   Wait: for 2D walk with unit steps in x and y:
//   Var(x) = n (x steps), Var(y) = n (y steps), E[r²] = E[x²]+E[y²] = 2n
//   With D = Δx²/(2Δt) for each dimension: E[r²] = 4Dt (standard formula, D per direction)

const n_steps = 100;  // number of steps
row('n steps',                      n_steps,            '');
row('E[X²] = n (exact)',            n_steps,            'exact');
row('E[|X|] ≈ √(2n/π)',            Math.sqrt(2*n_steps/Math.PI), 'Gaussian approx');
row('RMS = √n',                     Math.sqrt(n_steps), 'exact (for unbiased walk)');

// Check: √(2n/π) vs √n
row('\n√(2/π) ≈ 0.7979',           Math.sqrt(2/Math.PI), '(ratio E[|X|]/RMS)');

// Gambler's ruin: start at s=30, N=100 → P(ruin=0) = 1 - 30/100 = 0.7
const s_start = 30, N_barrier = 100;
const p_win = s_start / N_barrier;
row('\nGambler\'s ruin: start=30, N=100');
row('  P(reach 100) = 30/100',      p_win,              'exact = 0.3');
row('  P(ruin at 0) = 70/100',      1 - p_win,          'exact = 0.7');

// Mean time to absorption: E[T | start k] = k·(N-k) for symmetric walk
const mean_T = s_start * (N_barrier - s_start);
row('  E[steps to absorption]',     mean_T,             '= k·(N-k) = 30·70 = 2100');

// 2D: E[r²] after n steps
row('\n2D random walk: E[r²] = 2n', 2 * n_steps,       'exact (unit steps in x and y)');

// Diffusion coefficient: D = 1/2 per dimension (unit steps, unit time)
// In 2D: E[r²] = 2·(2D)·t = 4Dt with D=1/2 → E[r²] = 4·(1/2)·n = 2n ✓
row('D (per dimension, unit steps)', 0.5,               'D = σ²/(2Δt) = 1/(2·1) = 0.5');

// ═══════════════════════════════════════════════════════════════════════
// 5. SOLOW GROWTH MODEL
// ═══════════════════════════════════════════════════════════════════════
sec('5. SOLOW GROWTH MODEL');

// Cobb-Douglas: Y = A·Kᵃ·L^{1-α}
// Per worker: y = A·kᵃ,  k = K/L
// Capital accumulation: k̇ = s·A·kᵃ − (n + δ + g)·k
// (g = TFP growth rate; k is capital per effective worker in general form)
//
// Steady state (k̇=0):
//   s·A·(k*)ᵃ = (n+δ+g)·k*
//   (k*)^{1-α} = sA/(n+δ+g)
//   k* = [sA/(n+δ+g)]^{1/(1-α)}
//
// TRAP: formula is k* = (sA/(n+δ+g))^{1/(1-α)}, NOT (s/(n+δ))^{1/(1-α)}.
//   TFP growth g shifts steady-state capital per effective worker downward.

const s_sol  = 0.30;   // savings rate
const A_sol  = 1.00;   // TFP
const n_sol  = 0.01;   // population growth
const delta  = 0.05;   // depreciation
const g_tfp  = 0.00;   // TFP growth (0 for baseline)
const alpha  = 0.333;  // capital share (≈1/3)

const denom = n_sol + delta + g_tfp;
const k_star = Math.pow(s_sol * A_sol / denom, 1 / (1 - alpha));
const y_star = A_sol * Math.pow(k_star, alpha);
const c_star = (1 - s_sol) * y_star;

row('s (savings rate)',              s_sol,  '');
row('A (TFP)',                       A_sol,  '');
row('n (pop growth)',                n_sol,  '');
row('δ (depreciation)',              delta,  '');
row('g (TFP growth)',                g_tfp,  '');
row('α (capital share)',             alpha,  '');
row('\nk* = (sA/(n+δ+g))^{1/(1-α)}',k_star, 'steady-state capital per worker');
row('y* = A·(k*)^α',                y_star, 'steady-state output per worker');
row('c* = (1-s)·y*',                c_star, 'steady-state consumption per worker');

// Verification: at k*, investment = depreciation
const investment = s_sol * y_star;
const break_even = denom * k_star;
row('\nInvestment s·y* (verify = (n+δ)·k*)', investment, '');
row('Breakeven (n+δ)·k*',           break_even, '(must match investment)');
row('Discrepancy (should be ≈0)',    investment - break_even, '');

// Golden rule: maximises c*  →  f\'(k_GR) = n+δ+g
//   α·A·k_GR^{α-1} = n+δ+g
//   k_GR = (α·A/(n+δ+g))^{1/(1-α)}
//   c_GR = A·k_GR^α − (n+δ+g)·k_GR
const k_GR = Math.pow(alpha * A_sol / denom, 1 / (1 - alpha));
const y_GR = A_sol * Math.pow(k_GR, alpha);
const c_GR = y_GR - denom * k_GR;
const s_GR = 1 - c_GR / y_GR;  // savings rate that achieves golden rule

row('\nGolden rule k_GR',           k_GR,  '(f\'(k_GR) = n+δ+g)');
row('Golden rule c_GR',             c_GR,  'max steady-state consumption');
row('Golden rule s_GR = α (exact)', s_GR,  `≈ α = ${alpha} (exact when A=1)`);
row('s_GR == α?',                   Math.abs(s_GR - alpha) < 1e-12 ? 'yes' : 'no', '(should be yes for A=1)');

// ═══════════════════════════════════════════════════════════════════════
// 6. OPINION DYNAMICS
// ═══════════════════════════════════════════════════════════════════════
sec('6. OPINION DYNAMICS');

// Deffuant bounded-confidence model:
//   Agents i,j update if |xᵢ − xⱼ| < ε
//   xᵢ ← xᵢ + μ(xⱼ − xᵢ),  xⱼ ← xⱼ + μ(xᵢ − xⱼ)   (μ typically 0.5)
//
// Key results (Deffuant et al. 2000, cited not fetched):
//   ε > 0.5: consensus → all converge to mean
//   ε < 0.5: possible polarization (≥2 clusters)
//   Conserved quantity: sum of opinions (mean is invariant)

const opinions_0 = [0.1, 0.3, 0.5, 0.7, 0.9];
const mean_op = opinions_0.reduce((a,b)=>a+b,0) / opinions_0.length;
row('N agents', opinions_0.length, '');
row('Initial opinions', opinions_0.join(', '), '');
row('Mean (conserved quantity)', mean_op, '');

// With ε=0.6 (>0.5): all pairs can interact → consensus = mean
row('ε=0.6 consensus value = mean', mean_op, '= 0.5 exactly');

// With ε=0.2: only adjacent pairs interact → 2 or 3 clusters expected
row('ε=0.2: polarization expected (ε < 0.5)', 'two clusters', 'near 0.2 and 0.8 roughly');

// DeGroot model: x(t+1) = W · x(t)
// TRAP: consensus = π · x(0) where π is the LEFT eigenvector of W (not right).
//   Left eigenvector: π · W = π   (row vector interpretation)
//   For row-stochastic W: right eigenvector is 1 (all ones);
//   left eigenvector for eigenvalue 1 is the stationary distribution π.
//   At convergence: W^∞ each row = π → x(∞) = (Σπᵢ·xᵢ(0)) · 1
//
// Simple 3-agent W (symmetric → π = [1/3,1/3,1/3]):
const W3 = [[0.5, 0.3, 0.2],
            [0.2, 0.6, 0.2],
            [0.1, 0.3, 0.6]];
// Row sums should be 1
W3.forEach((row_w, i) => {
  const s = row_w.reduce((a,b)=>a+b,0);
  console.log(`  W3 row ${i+1} sum: ${s.toPrecision(4)} (must be 1)`);
});

// Power iteration for left eigenvector (π W = π):
// Equivalent to right eigenvector of Wᵀ
function leftEigenvec(W, iter=1000) {
  const n = W.length;
  let v = Array(n).fill(1/n);
  for (let k = 0; k < iter; k++) {
    // v = v · W  (row vector times matrix)
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
const x0_degroot = [0.2, 0.8, 0.5];
const consensus3 = pi3.reduce((s, pi_i, i) => s + pi_i * x0_degroot[i], 0);

row('\nDeGroot W3 left eigenvector π',  pi3.map(x=>x.toFixed(6)).join(', '), '');
row('Consensus = π·x(0) for x0=[0.2,0.8,0.5]', consensus3, '');

// Verify: W^200·x0 should converge: x_i(t+1) = Σⱼ W[i][j]·x[j](t)
let x_cur = [...x0_degroot];
for (let t = 0; t < 200; t++) {
  const xn = Array(3).fill(0);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      xn[i] += W3[i][j] * x_cur[j];  // x_new[i] = Σⱼ W[i][j]·x[j]  (DeGroot update)
  x_cur = xn;
}
row('W^200·x0[0] (DeGroot update)',     x_cur[0], '(= consensus since W is ergodic)');
row('DeGroot consensus (π·x0)',          consensus3, '(should match above)');
row('|discrepancy|',                     Math.abs(x_cur[0] - consensus3), '(should be ≈0)');

// ═══════════════════════════════════════════════════════════════════════
// 7. AGE-STRUCTURED POPULATION (LESLIE MATRIX)
// ═══════════════════════════════════════════════════════════════════════
sec('7. AGE-STRUCTURED POPULATION (LESLIE MATRIX)');

// Leslie matrix (Leslie 1945, Biometrika 33:183 — cited, not fetched):
//
//   L[i+1][i] = survival rate sᵢ (subdiagonal)
//   L[0][j]   = fecundity fⱼ (first row)
//
// Dominant eigenvalue λ = asymptotic per-capita growth rate (finite-time r = ln λ).
// Stable age distribution = dominant right eigenvector.
// Reproductive value = dominant LEFT eigenvector.
//
// EIGENSOLVER TRAP:
//   jacobiEigen (in js/core/LinAlg.js) is SYMMETRIC-ONLY.
//   Leslie matrices are NOT symmetric. Use:
//     - Power iteration (for dominant eigenvalue + eigenvector)
//     - eigen2x2 (exact, 2×2 only)
//     - QR iteration (general, if added in Phase 9 as infra)
//   Do NOT call jacobiEigen on a Leslie matrix.
//
// Euler-Lotka equation (discrete form; Euler 1760 / Lotka 1907):
//   Σ_{x=0}^{∞} λ^{-x} · l(x) · m(x) = 1
// where l(0)=1, l(x) = Πᵢ₌₀^{x-1} sᵢ (cumulative survival),
//       m(x) = per-capita birth rate at age x.
//
// NOTE: the fecundity entries fⱼ in row 0 of the Leslie matrix are:
//   fⱼ = l(j)·m(j)·(s₀/l(1)) in pre-breeding census convention.
//   In the simplest post-breeding convention: f[j] = l(j)·m(j).
//   Convention must match test: derive char poly directly from matrix entries.

// ── 2-age example (exact): L = [[0, f], [s, 0]]
// Char poly: λ² = s·f  →  λ = √(sf)
const f_2age = 4, s_2age = 0.5;
const lambda_2age = Math.sqrt(s_2age * f_2age);  // = √2 exactly
row('2-age L=[[0,4],[0.5,0]]: λ=√(sf)', lambda_2age, `= √${s_2age*f_2age} = √2`);
row('  √2 check',                        Math.SQRT2,  '(must match)');
row('  discrepancy',                     lambda_2age - Math.SQRT2, '(must be 0)');

// ── 3-age example: L = [[0, 1, 5], [0.4, 0, 0], [0, 0.6, 0]]
// Char poly (expand det(L - λI)):
//   -λ·(λ² - 0) - 1·(-0.4λ) + 5·(0.4·0.6)
//   = -λ³ + 0.4λ + 1.2 = 0
//   → λ³ = 0.4λ + 1.2
const L3 = [[0, 1, 5], [0.4, 0, 0], [0, 0.6, 0]];
row('\n3-age L=[[0,1,5],[0.4,0,0],[0,0.6,0]]', '', '');
row('  Char poly: λ³ − 0.4λ − 1.2 = 0', '', 'dominant root by power iteration:');

// Power iteration to find dominant eigenvalue
function powerIterLeslie(L, iter=500) {
  const n = L.length;
  let v = Array(n).fill(1).map((_,i) => i===0 ? 1 : 0.5);
  let lambda_pi = 0;
  for (let k = 0; k < iter; k++) {
    const Lv = Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        Lv[i] += L[i][j] * v[j];
    const norm = Math.max(...Lv.map(Math.abs));
    lambda_pi = norm;
    v = Lv.map(x => x / norm);
  }
  return { lambda: lambda_pi, v };
}

const { lambda: lambda_3age, v: stable_age } = powerIterLeslie(L3);
row('  Dominant λ (power iter)',     lambda_3age, '');
row('  Char poly check λ³-0.4λ-1.2', lambda_3age**3 - 0.4*lambda_3age - 1.2, '(should be ≈0)');
row('  Stable age dist (normalized)',
  stable_age.map(x=>(x/stable_age.reduce((a,b)=>a+b,0)).toFixed(4)).join(', '), '');

// Verify via Euler-Lotka (post-breeding: f[j] = l(j)·m(j)):
// L first row: [0, 1, 5]  →  l(0)·m(0)=0, l(1)·m(1)=1, l(2)·m(2)=5
// l(0)=1, l(1)=0.4, l(2)=0.4×0.6=0.24
// m(1)=f[1]/l(1)=1/0.4=2.5, m(2)=f[2]/l(2)=5/0.24=20.833
// Euler-Lotka: Σλ^{-x}·l(x)·m(x) = 0 + λ^{-1}·0.4·2.5 + λ^{-2}·0.24·20.833
//            = 1/λ + 5/λ² = 1  →  λ² = λ + 5  →  λ = (1+√21)/2 ≈ 2.791  ← WRONG
// This illustrates the convention issue: for the standard Leslie encoding:
//   fⱼ (first row) = m_j directly (pre-breeding), not l(j)·m(j).
// Using char poly directly: λ³ = 0.4λ + 1.2  (most reliable).
// Euler-Lotka as char poly divided by λ³: 1 = f₁s₀/λ² + f₂s₀s₁/λ³
// (matches λ³ - f₁s₀λ - f₂s₀s₁ = 0 → λ³ = 0.4λ + 1.2 → divide by λ³)
row('\nEuler-Lotka (char poly / λ³):', '', '');
const l1 = L3[1][0];            // s₀ = 0.4
const l2 = L3[1][0] * L3[2][1]; // s₀·s₁ = 0.24
const el_check = l1 * L3[0][1] / lambda_3age**2 + l2 * L3[0][2] / lambda_3age**3;
row('  l₁·f₁/λ² + l₂·f₂/λ³ (should=1)', el_check, '');
// Actually just verify char poly:
const cp3 = lambda_3age**3 - 0.4 * lambda_3age - 1.2;
row('  Char poly at dominant λ',     cp3, '(must be ≈ 0)');

// ─ Second eigenvalue (should have |λ₂| < λ₁)
// For 3-age: char poly λ³ - 0.4λ - 1.2 has 3 roots.
// Dominant is real positive ≈1.188; others may be complex or negative.
row('  |λ₂| < λ_dominant (by Perron-Frobenius)', '', '(positive Leslie → unique dominant)');

// ── 2-age example with net reproductive rate R₀ = Σ lₓ mₓ:
// For stationary pop (λ=1): R₀ = Σ lₓ mₓ = 1 (replacement-level fertility)
// For L=[[0,4],[0.5,0]]: R₀ = l(0)·f₀ + l(1)·f₁ = 0 + 0.5·4 = 2 → λ > 1 (growing)
const R0_2age = L3[1][0] * L3[0][1] + L3[1][0] * L3[2][1] * L3[0][2];
row('\nNet reproductive rate R₀ for 3-age', R0_2age, '= Σ lₓ·fₓ (sum of Leslie first-row path products)');
row('R₀ > 1 → growing population',  R0_2age > 1 ? 'yes' : 'no', '');

// ═══════════════════════════════════════════════════════════════════════
// 8. COMPLEX.JS INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════
sec('8. COMPLEX.JS INFRASTRUCTURE');

// Complex number: z = a + bi
// Operations to implement (all algebraically exact):
//   |z| = √(a²+b²)
//   z·w = (ac−bd) + (ad+bc)i
//   z/w = z·conj(w) / |w|²
//   e^z = e^a · (cos b + i sin b)
//   arg(z) = atan2(b, a)

// Euler's identity: e^(iπ) = cos π + i sin π = -1 + 0i
const eIpi_re = Math.cos(Math.PI);  // should be -1
const eIpi_im = Math.sin(Math.PI);  // should be ≈0 (≈1.225e-16)
row('Re(e^(iπ)) = cos π',           eIpi_re, '(must be -1 exactly)');
row('Im(e^(iπ)) = sin π',           eIpi_im, '(should be ≈0; trig rounding)');
row('|e^(iπ) − (−1)| (tolerance)',  Math.abs(eIpi_re - (-1)) + Math.abs(eIpi_im), '(< 1e-15)');

// |3 + 4i| = 5 exactly (3-4-5 Pythagorean triple)
const abs_3_4i = Math.sqrt(3**2 + 4**2);
row('\n|3+4i| = √(9+16) = √25 = 5',  abs_3_4i, '(must be 5 exactly)');
row('  discrepancy from 5',           abs_3_4i - 5, '(should be 0)');

// (1+i)² = 1 + 2i + i² = 1 + 2i − 1 = 2i
const sq_re = 1**2 - 1**2;  // Re((1+i)²) = 1 - 1 = 0
const sq_im = 2*1*1;        // Im((1+i)²) = 2
row('\n(1+i)²: Re = 0',              sq_re, '(must be 0 exactly)');
row('(1+i)²: Im = 2',               sq_im, '(must be 2 exactly)');

// (3+4i)·(3−4i) = 9 + 16 = 25 (conjugate product = |z|²)
const conj_prod_re = 3*3 + 4*4;  // = 25
const conj_prod_im = 3*(-4) + 4*3;  // = -12 + 12 = 0
row('\n(3+4i)(3-4i) = 25 + 0i:');
row('  Re = 9+16',                   conj_prod_re, '(must be 25)');
row('  Im = -12+12',                 conj_prod_im, '(must be 0)');

// arg(1+i) = π/4 exactly
const arg_1_1i = Math.atan2(1, 1);
row('\narg(1+i) = π/4',              arg_1_1i, '');
row('  π/4 check',                   Math.PI/4, '(must match)');
row('  |discrepancy|',               Math.abs(arg_1_1i - Math.PI/4), '(should be 0)');

// arg(−1+0i) = π exactly (= arg(e^(iπ)))
const arg_neg1 = Math.atan2(0, -1);
row('\narg(−1) = π',                 arg_neg1, '');
row('  |arg(−1) − π|',              Math.abs(arg_neg1 - Math.PI), '(should be 0)');

// e^(iπ/2) = 0 + 1i (i itself)
const eIpi2_re = Math.cos(Math.PI/2);
const eIpi2_im = Math.sin(Math.PI/2);
row('\nRe(e^(iπ/2)) = cos(π/2)',     eIpi2_re, '(should be ≈0; machine ε)');
row('Im(e^(iπ/2)) = sin(π/2)',       eIpi2_im, '(must be 1 exactly)');

// Division: (a+bi)/(c+di) = [(ac+bd) + (bc-ad)i] / (c²+d²)
// (1+2i)/(3+4i) = [(3+8) + (6-4)i] / 25 = 11/25 + 2i/25
const div_re = (1*3 + 2*4) / (3**2 + 4**2);
const div_im = (2*3 - 1*4) / (3**2 + 4**2);
row('\n(1+2i)/(3+4i): Re = 11/25',   div_re, `= ${11/25}`);
row('(1+2i)/(3+4i): Im = 2/25',      div_im, `= ${2/25}`);
row('  Re discrepancy',              Math.abs(div_re - 11/25), '(should be 0)');

console.log('\n' + '═'.repeat(70));
console.log('anchors-phase9.mjs complete.');
console.log('═'.repeat(70));
