/**
 * anchors-phase8.mjs — independent numerical anchors for Phase 8 tests.
 *
 * RULES: no model code imported; every value derived from scratch.
 * Run:  node tools/anchors-phase8.mjs
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v, d=6) => typeof v === 'number' ? v.toPrecision(d) : v;
const sec = (label) => { console.log(`\n${'═'.repeat(60)}`); console.log(label); console.log('═'.repeat(60)); };
const row = (label, value, unit='') => console.log(`  ${label.padEnd(42)} ${fmt(value)}  ${unit}`);

// ═══════════════════════════════════════════════════════════════════
// 1. PARTICLE-IN-BOX
// ═══════════════════════════════════════════════════════════════════
sec('1. PARTICLE-IN-BOX');

const hbar  = 1.054571817e-34;   // J·s  (CODATA 2018)
const me    = 9.1093837015e-31;  // kg   (CODATA 2018)
const eV    = 1.602176634e-19;   // J    (exact, SI 2019)
const L_nm  = 1e-9;              // 1 nm in m

// E_n = n²π²ℏ²/(2mL²)
const E1 = (Math.PI**2 * hbar**2) / (2 * me * L_nm**2);
row('E_1 at L=1nm (J)',          E1,         'J');
row('E_1 at L=1nm (eV)',         E1/eV,      'eV');
row('E_2 (J)',                   4*E1,       'J');
row('E_3 (J)',                   9*E1,       'J');
row('E_2/E_1',                   4,          '(exact)');
row('E_3/E_1',                   9,          '(exact)');
row('E_2 - E_1 (J)',             3*E1,       'J');
row('E_2 - E_1 (eV)',            3*E1/eV,    'eV');

// Wavefunction: ψ_n(x) = √(2/L)·sin(nπx/L)
// Normalization: ∫₀ᴸ ψ_n² dx = 1 (exact)
// Check numerically
function psi(n, x, L) { return Math.sqrt(2/L) * Math.sin(n * Math.PI * x / L); }
function integrate01(f, N=10000) {
  // Simpson's rule
  let s = 0;
  const h = 1/N;
  for (let i = 0; i <= N; i++) {
    const w = (i===0||i===N) ? 1 : (i%2===0 ? 2 : 4);
    s += w * f(i/N);
  }
  return s * h/3;
}

const norm1 = integrate01(t => psi(1,t*L_nm,L_nm)**2 * L_nm, 100000);
const norm2 = integrate01(t => psi(2,t*L_nm,L_nm)**2 * L_nm, 100000);
row('∫ψ₁² dx (numerical)',       norm1,      '(exact=1)');
row('∫ψ₂² dx (numerical)',       norm2,      '(exact=1)');

const ortho = integrate01(t => psi(1,t*L_nm,L_nm)*psi(2,t*L_nm,L_nm)*L_nm, 100000);
row('∫ψ₁·ψ₂ dx (numerical)',     ortho,      '(exact=0)');

// <x>_n = L/2 by symmetry
row('<x>_1 = L/2 (exact)',        L_nm/2,     'm');
// <x²>_n = L²(1/3 - 1/(2n²π²))
const x2_1 = L_nm**2 * (1/3 - 1/(2*1**2*Math.PI**2));
const x2_2 = L_nm**2 * (1/3 - 1/(2*2**2*Math.PI**2));
row('<x²>_1 (exact)',             x2_1,       'm²');
row('<x²>_2 (exact)',             x2_2,       'm²');
// σx_n = √(<x²>_n - L²/4)
const sigma_1 = Math.sqrt(x2_1 - (L_nm/2)**2);
const sigma_2 = Math.sqrt(x2_2 - (L_nm/2)**2);
row('σ_x,1 = √(<x²>-<x>²)',      sigma_1,    'm');
row('σ_x,2',                     sigma_2,    'm');

// ═══════════════════════════════════════════════════════════════════
// 2. CARNOT
// ═══════════════════════════════════════════════════════════════════
sec('2. CARNOT');

// η = 1 - T_c/T_h
const eta_500_300 = 1 - 300/500;
const eta_500_0   = 1 - 0/500;
const deta_dTc    = -1/500;
row('η(T_h=500K, T_c=300K)',      eta_500_300,  '= 0.40 exact');
row('η(T_h=500K, T_c=0K)',        eta_500_0,    '= 1.0 exact');
row('dη/dT_c = -1/T_h',          deta_dTc,     'at T_h=500');

// COP_hp = T_h/(T_h-T_c)  (heat pump)
const COP_hp = 300/(300-273);
const COP_ref = 273/(300-273);
row('COP_hp T_h=300 T_c=273',    COP_hp,       '= 300/27');
row('COP_ref T_h=300 T_c=273',   COP_ref,      '= 273/27');
row('η*COP_hp check (=1)',        eta_500_300 * (1/(1-eta_500_300)),  '(use same η)');

// Verify η * COP_hp = 1 at same temperatures
// η = 1-Tc/Th, COP_hp = Th/(Th-Tc) = 1/η → product = 1
const Th=500, Tc=300;
const eta = 1-Tc/Th;
const cop_hp_same = Th/(Th-Tc);
row('η(500,300) * COP_hp(500,300)', eta*cop_hp_same, '(exact=1)');

// Second-law limit: no device can exceed η=1 (T_c>0) or COP>T_h/(T_h-T_c)
row('η < 1 for T_c > 0',          1 - 1e-9/500,  '(→1 as T_c→0)');

// ═══════════════════════════════════════════════════════════════════
// 3. MARKOV CHAINS
// ═══════════════════════════════════════════════════════════════════
sec('3. MARKOV CHAINS (2-state)');

// P = [[1-p, p],[q, 1-q]]
// Stationary: π₀ = q/(p+q), π₁ = p/(p+q)
// Eigenvalues: λ₁=1, λ₂=1-p-q  (closed form, NOT jacobiEigen)
const p_mc = 0.3, q_mc = 0.4;
const pi0 = q_mc/(p_mc+q_mc);  // 4/7
const pi1 = p_mc/(p_mc+q_mc);  // 3/7
const lam2 = 1 - p_mc - q_mc;
const gap  = p_mc + q_mc;
row('π₀ = q/(p+q)',              pi0,          '= 4/7');
row('π₁ = p/(p+q)',              pi1,          '= 3/7');
row('λ₁',                       1,            '(exact)');
row('λ₂ = 1-p-q',               lam2,         '= 0.3');
row('spectral gap = p+q',        gap,          '= 0.7');
row('t_rel = 1/gap',             1/gap,        '≈ 1.4286');

// Verify detailed balance: π₀·p = π₁·q
const db1 = pi0 * p_mc;  // pq/(p+q)
const db2 = pi1 * q_mc;  // pq/(p+q)
row('π₀·p (detailed balance)',   db1,          'should equal π₁·q');
row('π₁·q (detailed balance)',   db2,          'same as above');

// Mixing time bound: t_mix(ε) ≤ t_rel · ln(1/(ε·π_min))
const eps = 0.01;
const pi_min = Math.min(pi0, pi1);
const t_mix_bound = (1/gap) * Math.log(1/(eps*pi_min));
row('π_min',                     pi_min,       '= 3/7');
row('t_mix ε=0.01 bound',        t_mix_bound,  '≈ 7.79');

// Verify stationary: π·P = π  (direct check)
const P = [[1-p_mc, p_mc],[q_mc, 1-q_mc]];
const pi_P_0 = pi0*P[0][0] + pi1*P[1][0];
const pi_P_1 = pi0*P[0][1] + pi1*P[1][1];
row('(π·P)[0] = π₀ check',       pi_P_0,       'should be π₀='+pi0.toFixed(6));
row('(π·P)[1] = π₁ check',       pi_P_1,       'should be π₁='+pi1.toFixed(6));

// Power iteration: π via direct iteration (for larger chains)
// After k steps from uniform: |π^(k) - π|_TV ≤ λ₂^k / (2·π_min)
const kSteps = 10;
const tv_after10 = Math.abs(lam2)**kSteps / (2*pi_min);
row('TV bound after 10 steps',   tv_after10,   '= |λ₂|^10/(2π_min)');

// ═══════════════════════════════════════════════════════════════════
// 4. DRIFT-DIFFUSION MODEL
// ═══════════════════════════════════════════════════════════════════
sec('4. DRIFT-DIFFUSION');

// Boundaries ±a, start 0, drift μ, noise σ
// P(upper) = 1/(1 + exp(-2μa/σ²))
const mu_dd = 1, a_dd = 1, sigma_dd = 1;
const P_upper = 1/(1 + Math.exp(-2*mu_dd*a_dd/sigma_dd**2));
row('P(upper) μ=1,a=1,σ=1',      P_upper,      '≈ 0.8808');

// Mean RT = (a/μ)·tanh(μa/σ²) + t₀
const t0_dd = 0.3;
const RT_mean = (a_dd/mu_dd)*Math.tanh(mu_dd*a_dd/sigma_dd**2) + t0_dd;
row('RT_mean μ=1,a=1,σ=1,t₀=0.3', RT_mean,    '≈ 1.0616 s');
row('tanh(1)',                    Math.tanh(1), '= 0.7616');

// μ=0: P = 0.5 exactly
const P_zero = 1/(1 + Math.exp(0));
row('P(upper) μ=0 (exact)',       P_zero,       '= 0.5');

// N=5000 simulation tolerance: 3σ of binomial
const P_hat = P_upper;
const N_sim = 5000;
const sigma_P = Math.sqrt(P_hat*(1-P_hat)/N_sim);
const tol_3sigma = 3*sigma_P;
row('σ(P̂) N=5000',               sigma_P,      '= √(P(1-P)/N)');
row('3σ tolerance',               tol_3sigma,   '≈ 0.0138');

// ═══════════════════════════════════════════════════════════════════
// 5. PHASE-PLANE ANALYSIS
// ═══════════════════════════════════════════════════════════════════
sec('5. PHASE-PLANE (2D LINEAR)');

// Classification by trace τ and determinant Δ
// Eigenvalues: λ = (τ ± √(τ²-4Δ))/2
function classify(tau, delta) {
  if (Math.abs(delta) < 1e-12) return 'degenerate (zero det)';
  if (delta < 0) return 'saddle';
  const disc = tau**2 - 4*delta;
  if (Math.abs(tau) < 1e-12) return 'center';
  if (tau < 0 && disc >= 0) return 'stable node';
  if (tau > 0 && disc >= 0) return 'unstable node';
  if (tau < 0 && disc < 0) return 'stable spiral';
  if (tau > 0 && disc < 0) return 'unstable spiral';
  return 'unknown';
}

// Example cases with exact eigenvalues
const cases = [
  { A: [[-1,0],[0,-2]], label:'stable node [[-1,0],[0,-2]]' },
  { A: [[0,-1],[1,0]],  label:'center [[0,-1],[1,0]]' },
  { A: [[-1,-1],[1,-1]],label:'stable spiral [[-1,-1],[1,-1]]' },
  { A: [[1,0],[0,2]],   label:'unstable node [[1,0],[0,2]]' },
  { A: [[1,0],[0,-1]],  label:'saddle [[1,0],[0,-1]]' },
];
for (const { A, label } of cases) {
  const tau = A[0][0] + A[1][1];
  const det = A[0][0]*A[1][1] - A[0][1]*A[1][0];
  const disc = tau**2 - 4*det;
  const eig1 = (tau + Math.sqrt(Math.abs(disc) + (disc<0?0:0))) / 2;  // only for real case
  console.log(`  ${label}`);
  console.log(`    τ=${tau} Δ=${det} → ${classify(tau,det)}`);
  if (disc >= 0) {
    console.log(`    λ₁=${(tau+Math.sqrt(disc))/2} λ₂=${(tau-Math.sqrt(disc))/2}`);
  } else {
    console.log(`    λ = ${tau/2} ± ${Math.sqrt(-disc)/2}i`);
  }
}

// Stable spiral: A=[[-1,-1],[1,-1]]: τ=-2, Δ=2, τ²=4<8=4Δ
const A_spiral = [[-1,-1],[1,-1]];
const tau_s = -2, det_s = 2;
row('stable spiral τ²-4Δ',       tau_s**2-4*det_s, '= -4 < 0 ✓');
row('stable spiral Re(λ)',        tau_s/2,          '= -1');
row('stable spiral Im(lambda)',    Math.sqrt(-(tau_s**2-4*det_s))/2, '= 1');

// ═══════════════════════════════════════════════════════════════════
// 6. COMPETITIVE EXCLUSION (Lotka-Volterra)
// ═══════════════════════════════════════════════════════════════════
sec('6. COMPETITIVE EXCLUSION (2-species LV)');

// dN₁/dt = r₁N₁(1 - N₁/K₁ - α₁₂·N₂/K₁)
// Coexistence: N₁* = (K₁-α₁₂K₂)/(1-α₁₂α₂₁), N₂* = (K₂-α₂₁K₁)/(1-α₁₂α₂₁)
// Example 1: coexistence
const K1a=100, K2a=100, a12a=0.5, a21a=0.5;
const den_a = 1 - a12a*a21a;
const N1_star_a = (K1a - a12a*K2a)/den_a;
const N2_star_a = (K2a - a21a*K1a)/den_a;
console.log(`  Coexistence example: K₁=K₂=100, α₁₂=α₂₁=0.5`);
console.log(`    1-α₁₂α₂₁ = ${den_a}`);
row('    N₁*', N1_star_a,  '= (100-50)/0.75 = 66.67');
row('    N₂*', N2_star_a,  '= 66.67');
// Check: α₁₂ < K₁/K₂ AND α₂₁ < K₂/K₁
console.log(`    α₁₂=${a12a} < K₁/K₂=${K1a/K2a}: ${a12a < K1a/K2a}`);
console.log(`    α₂₁=${a21a} < K₂/K₁=${K2a/K1a}: ${a21a < K2a/K1a}`);

// Example 2: species 1 wins
const K1b=150, K2b=100, a12b=0.5, a21b=1.5;
console.log(`\n  Exclusion example: K₁=150, K₂=100, α₁₂=0.5, α₂₁=1.5`);
console.log(`    α₁₂ < K₁/K₂ = ${K1b/K2b}: ${a12b < K1b/K2b}`);
console.log(`    α₂₁ < K₂/K₁ = ${K2b/K1b}: ${a21b < K2b/K1b} → species 1 wins`);

// Bistability
const K1c=100, K2c=100, a12c=1.5, a21c=1.5;
console.log(`\n  Bistability example: K₁=K₂=100, α₁₂=α₂₁=1.5`);
console.log(`    α₁₂=${a12c} > K₁/K₂=${K1c/K2c}: ${a12c > K1c/K2c} → bistability`);
console.log(`    α₂₁=${a21c} > K₂/K₁=${K2c/K1c}: ${a21c > K2c/K1c}`);

// Coexistence equilibrium stability condition: det(Jacobian) > 0, trace < 0
// At coexistence: J = [[-r₁N₁*/K₁, -r₁N₁*α₁₂/K₁],[-r₂N₂*α₂₁/K₂, -r₂N₂*/K₂]]
// tr(J) = -r₁N₁*/K₁ - r₂N₂*/K₂ < 0 always (r,N,K > 0)
// det(J) = (r₁r₂N₁*N₂*)/(K₁K₂) · (1 - α₁₂α₂₁)  > 0 iff α₁₂α₂₁ < 1 (same as coexistence)
row('    coexistence det(J) > 0 iff', 1-a12a*a21a, '> 0 for example 1');

// ═══════════════════════════════════════════════════════════════════
// 7. PHARMACOKINETICS (1-compartment IV + oral Bateman)
// ═══════════════════════════════════════════════════════════════════
sec('7. PHARMACOKINETICS');

// IV: C(t) = C₀·e^{-ke·t}
const ke=0.1, C0=100, t_pk=5;
const C_5h = C0 * Math.exp(-ke*t_pk);
const t_half = Math.log(2)/ke;
const AUC = C0/ke;
row('C(t=5h) C₀=100, ke=0.1/h',  C_5h,         '≈ 60.653 mg/L');
row('t½ = ln2/ke',               t_half,       '= 6.931 h');
row('AUC = C₀/ke',               AUC,          '= 1000 mg·h/L');

// Oral Bateman: C(t) = (ka·F·D)/(Vd·(ka-ke))·(e^{-ke·t} - e^{-ka·t})
// t_max = ln(ka/ke)/(ka-ke)
const ka=1.0, F_bio=1, D=100, Vd=10;
const t_max = Math.log(ka/ke)/(ka-ke);
row('t_max = ln(ka/ke)/(ka-ke)', t_max,        '≈ 2.559 h');

// Check: at ka=1/h, ke=0.1/h
// C_max = bateman(t_max)
const A_bat = (ka*F_bio*D)/(Vd*(ka-ke));
const C_max = A_bat * (Math.exp(-ke*t_max) - Math.exp(-ka*t_max));
row('C_max (oral)',               C_max,        'mg/L');
row('A_bat = ka·F·D/(Vd·(ka-ke))', A_bat,      'mg/L');

// Verify t_max from derivative = 0:
// dC/dt = A(−ke·e^{−ke·t} + ka·e^{−ka·t}) = 0
// → ka·e^{−ka·t} = ke·e^{−ke·t}
// → e^{−(ka−ke)t} = ke/ka
// → t = ln(ka/ke)/(ka−ke)  ✓
row('  verification: A·(-ke·e^{-ke·t_max}+ka·e^{-ka·t_max})',
    A_bat*(-ke*Math.exp(-ke*t_max)+ka*Math.exp(-ka*t_max)),
    '≈ 0 (derivative=0)');

// AUC oral = same as IV for F=1: AUC = F·D/Vd/ke
const AUC_oral = F_bio*D/Vd/ke;
row('AUC oral = F·D/(Vd·ke)',     AUC_oral,     'mg·h/L');

// Two-compartment bi-exponential: mentioned but not tested deeply
console.log('\n  Two-compartment: C(t) = A·e^{-αt} + B·e^{-βt}, α>β>0');
console.log('  (no anchor test; model structure verified visually)');

// ═══════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log('ANCHOR SUMMARY (count by bench)');
console.log('═'.repeat(60));
console.log('  1. particle-in-box  : E_1, E_2/E_1=4, E_3/E_1=9, ∫ψ²=1, ∫ψ₁ψ₂=0, <x>=L/2, <x²>');
console.log('  2. carnot           : η=0.4, η=1 (T_c=0), dη/dT_c=-1/T_h, COP, η·COP=1');
console.log('  3. markov-chains    : π₀=4/7, π₁=3/7, λ₂=0.3, gap=0.7, t_mix≤7.79, detailed balance');
console.log('  4. drift-diffusion  : P_upper≈0.8808, RT≈1.0616, P(μ=0)=0.5, 3σ=0.0138');
console.log('  5. phase-plane      : classify stable/unstable/spiral/saddle/center by τ,Δ');
console.log('  6. competitive-excl : N*=66.67, exclusion conditions, bistability');
console.log('  7. pharmacokinetics : C(5h)≈60.65, t½=6.93h, AUC=1000, t_max≈2.56h');
