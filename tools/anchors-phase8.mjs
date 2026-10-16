/**
 * anchors-phase8.mjs — independent numerical anchors for Phase 8 tests.
 *
 * RULES: no model code imported; every value derived from scratch.
 * Run:  node tools/anchors-phase8.mjs
 */

const fmt = (v, d=8) => typeof v === 'number' ? v.toPrecision(d) : String(v);
const sec = (label) => { console.log(`\n${'═'.repeat(70)}`); console.log(label); console.log('═'.repeat(70)); };
const row = (label, value, note='') => console.log(`  ${label.padEnd(48)} ${fmt(value)}  ${note}`);

// ═══════════════════════════════════════════════════════════════════════
// 1. PARTICLE-IN-BOX
// ═══════════════════════════════════════════════════════════════════════
sec('1. PARTICLE-IN-BOX');

// Exact SI 2019 / CODATA 2022 constants
const h     = 6.62607015e-34;    // J·s  exact SI 2019
const c_si  = 299792458;         // m/s  exact SI 1983
const hbar  = h / (2*Math.PI);   // J·s  derived (exact)
const me    = 9.1093837139e-31;  // kg   CODATA 2022 — fetched 2026-10-16 from physics.nist.gov/cuu/Constants/Table/allascii.txt; u=0.0000000028e-31
const eV    = 1.602176634e-19;   // J    exact SI 2019
const L1nm  = 1e-9;              // m    1 nm

row('h (exact SI 2019)',          h,     'J·s');
row('c (exact SI 1983)',          c_si,  'm/s');
row('hbar = h/(2π)',              hbar,  'J·s');
row('eV (exact SI 2019)',         eV,    'J');
row('me (CODATA 2022, fetched)',    me,  'kg');

// E_n = n²π²ℏ²/(2m_e L²)
const E1 = Math.PI**2 * hbar**2 / (2 * me * L1nm**2);
const E1_eV = E1 / eV;
row('\nE_1 at L=1nm (J)',         E1,        'J');
row('E_1 at L=1nm (eV)',          E1_eV,     'eV  (expect 0.376030)');
row('E_2/E_1',                    4,         '(integer, exact)');
row('E_3/E_1',                    9,         '(integer, exact)');
row('E_2 − E_1 (J)',              3*E1,      'J');
row('E_2 − E_1 (eV)',             3*E1/eV,   'eV  (= 3·E₁)');

// Photon 2→1: λ = hc / (E2 − E1)
const hc_eVnm = h * c_si / eV * 1e9; // eV·nm
const photon_nm = hc_eVnm / (3 * E1_eV);
row('\nhc in eV·nm',              hc_eVnm,   'eV·nm  (expect 1239.842)');
row('photon λ(2→1) at L=1nm',    photon_nm,  'nm  (expect ≈1099)');

// Wavefunction normalization and orthogonality (Simpson 10000)
function psi(n, x, L) { return Math.sqrt(2/L) * Math.sin(n * Math.PI * x / L); }
function simpson01(f, N=10000) {
  let s = 0; const h = 1/N;
  for (let i = 0; i <= N; i++) {
    const w = (i===0||i===N) ? 1 : (i%2===0 ? 2 : 4);
    s += w * f(i/N);
  }
  return s * h/3;
}
const norm1 = simpson01(t => psi(1,t*L1nm,L1nm)**2 * L1nm);
const norm2 = simpson01(t => psi(2,t*L1nm,L1nm)**2 * L1nm);
const ortho = simpson01(t => psi(1,t*L1nm,L1nm)*psi(2,t*L1nm,L1nm)*L1nm);
row('\n∫ψ₁² dx (Simpson N=10000)',   norm1,  '(exact=1)');
row('∫ψ₂² dx (Simpson N=10000)',   norm2,  '(exact=1)');
row('∫ψ₁·ψ₂ dx (orthogonality)',    ortho,  '(exact=0)');

// P(0<x<L/3) for n=1 = 1/3 - sin(2π/3)/(2π)
const P_third_n1 = 1/3 - Math.sin(2*Math.PI/3)/(2*Math.PI);
row('\nP(0<x<L/3) n=1 (exact formula)', P_third_n1, '≈ 0.195501');
const P_third_num = simpson01(t => psi(1,t*L1nm/3,L1nm)**2 * (L1nm/3));
row('P(0<x<L/3) n=1 (Simpson check)', P_third_num, '≈ 0.195501');

// <x²>_n = L²(1/3 - 1/(2n²π²))
const x2_1   = L1nm**2 * (1/3 - 1/(2*1**2*Math.PI**2));
const x2_2   = L1nm**2 * (1/3 - 1/(2*2**2*Math.PI**2));
const x2_100 = L1nm**2 * (1/3 - 1/(2*100**2*Math.PI**2));
row('\n<x²>_1 = L²(1/3 - 1/(2π²))',  x2_1,   'm²');
row('<x²>_2 = L²(1/3 - 1/(8π²))',    x2_2,   'm²');
row('<x²>_100 / L²',                  x2_100/L1nm**2, '(→1/3 as n→∞)');
row('σ_x,1 = √(<x²>₁ - L²/4)',        Math.sqrt(x2_1 - (L1nm/2)**2), 'm');

// E_1(2L) / E_1(L) = 1/4
const E1_2L = Math.PI**2 * hbar**2 / (2 * me * (2*L1nm)**2);
row('\nE_1(2L) / E_1(L)',             E1_2L/E1, '(exact = 1/4)');

// ═══════════════════════════════════════════════════════════════════════
// 2. CARNOT
// ═══════════════════════════════════════════════════════════════════════
sec('2. CARNOT');

// η = 1 - T_c/T_h
const Th_K = 500, Tc_K = 300;
const eta_main = 1 - Tc_K/Th_K;
row('η(T_h=500K, T_c=300K)',          eta_main,    '= 0.40 exact');
row('η(T_h=500K, T_c=0K)',            1.0,         '= 1.0 exact');
row('dη/dT_c = -1/T_h at T_h=500',   -1/Th_K,     '= -0.002');

// Predict Q1: η=0.33, T_h=600°C=873.15K → T_c_max
const Th_Q1 = 600 + 273.15;  // 873.15 K
const eta_Q1 = 0.33;
const Tc_max = Th_Q1 * (1 - eta_Q1);
row('\nPredict Q1: T_h=873.15K, η=0.33', Tc_max, 'K  (expect 585.0)');

// COP
const COP_hp = Th_K / (Th_K - Tc_K);
const COP_ref = Tc_K / (Th_K - Tc_K);
row('\nCOP_hp(T_h=500,T_c=300)',       COP_hp,      '= 500/200 = 2.5');
row('COP_ref(T_h=500,T_c=300)',        COP_ref,     '= 300/200 = 1.5');
row('COP_hp - COP_ref',                COP_hp - COP_ref, '= 1 (exact)');
row('η × COP_hp (same T)',             eta_main * COP_hp, '= 1 (exact)');
row('COP_hp(T_c=0)',                   Th_K/Th_K,   '= 1 (exact)');

// T-S diagram: W = Q_h - Q_c = Q_h·η = (T_h - T_c)·ΔS
// Rectangle area via shoelace = W
const dS = 1.0;  // unit entropy change
const W_rectangle = (Th_K - Tc_K) * dS;
const Q_h = Th_K * dS;
const Q_c = Tc_K * dS;
row('\nT-S rectangle: W=(T_h-T_c)·ΔS at ΔS=1', W_rectangle, 'J (= Q_h·η)');
row('Q_h = T_h·ΔS',                    Q_h,        'J');
row('η = W/Q_h',                       W_rectangle/Q_h, '= 0.4 ✓');

// Predict Q3: T_c → 2T_c; η' = 1 - 2T_c/T_h = 2η - 1 (requires T_c < T_h/2)
const eta2 = 1 - 2*Tc_K/Th_K;
row('\nPredict Q3: η → η\' = 2η-1 = 1-2T_c/T_h', eta2, '(η=0.4 → η\'=-0.2 shows condition fails at T_c=300K)');
const Tc_half = Th_K/2;
row('T_c < T_h/2 required',            Tc_half,    'K (= T_h/2)');
const eta_valid = 1 - 2*200/Th_K;  // T_c=200 < 250=T_h/2
row('η\' at T_c=200K (valid, T_c<250)', eta_valid,  '= 2η(200)-1');

// ═══════════════════════════════════════════════════════════════════════
// 3. MARKOV CHAINS
// ═══════════════════════════════════════════════════════════════════════
sec('3. MARKOV CHAINS');

// 2-state: P = [[1-p, p],[q, 1-q]]
// Stationary: π₀=q/(p+q), π₁=p/(p+q). Power iteration on Pᵀ.
const p_mc = 0.3, q_mc = 0.4;
const pi0 = q_mc/(p_mc+q_mc);
const pi1 = p_mc/(p_mc+q_mc);
const lam2 = 1 - p_mc - q_mc;  // 0.3
const gap  = p_mc + q_mc;      // 0.7
row('π₀ = q/(p+q)',                    pi0,    '= 4/7 ≈ 0.571429');
row('π₁ = p/(p+q)',                    pi1,    '= 3/7 ≈ 0.428571');
row('λ₂ = 1-p-q (closed form)',        lam2,   '= 0.3');
row('spectral gap = p+q',              gap,    '= 0.7');
row('gap = 1-|λ₂|',                    1-Math.abs(lam2), '= 0.7');

// Verify π·P = π via Pᵀ power iteration
const P2 = [[1-p_mc, p_mc],[q_mc, 1-q_mc]];
const piP0 = pi0*P2[0][0] + pi1*P2[1][0];
const piP1 = pi0*P2[0][1] + pi1*P2[1][1];
row('\n(π·P)[0] = π₀ check',           piP0,   '= 4/7');
row('(π·P)[1] = π₁ check',             piP1,   '= 3/7');

// Detailed balance: π₀·p = π₁·q (only holds for reversible chains)
row('π₀·p',                            pi0*p_mc,  '= pq/(p+q)');
row('π₁·q',                            pi1*q_mc,  '= pq/(p+q) ✓');

// EXACT TV distance: d(k) = |λ₂|^k · max(π₀, π₁)
// (not the LPW bound — this is the exact formula for 2-state chains)
const pi_max = Math.max(pi0, pi1);
console.log('\n  Exact TV distance d(k) = |λ₂|^k · max(π₀,π₁):');
for (let k=1; k<=6; k++) {
  const d = Math.abs(lam2)**k * pi_max;
  console.log(`    k=${k}: d=${d.toFixed(8)}${d <= 0.01 ? '  ← t_mix(0.01)=' + k : ''}`);
}
// Exact t_mix(0.01) = 4
row('\nExact t_mix(ε=0.01) = 4',       4, '(first k with d(k)≤0.01)');

// LPW upper bound (stated bound only, not used as test tolerance):
const t_mix_LPW = (1/gap) * Math.log(1/(0.01 * Math.min(pi0,pi1)));
row('LPW upper bound (not exact)',     t_mix_LPW, '≈ 7.789 (stated upper bound)');

// p+q > 1 case: λ₂ < 0 (periodic chain)
const p2=0.6, q2=0.6; // p+q=1.2 > 1
const lam2_periodic = 1-p2-q2; // = -0.2
row('\np=q=0.6: λ₂ = 1-p-q',          lam2_periodic, '= -0.2 < 0 (periodic)');
row('gap = 1-|λ₂|',                    1-Math.abs(lam2_periodic), '= 0.8');

// Boundary: p=q=0 → λ₂=1, no unique stationary distribution
row('p=q=0: λ₂',                      1-0-0,  '= 1 (absorbing: no unique π)');
// Boundary: p=q=1 → λ₂=-1, periodic
row('p=q=1: λ₂',                      1-1-1,  '= -1 (periodic)');

// 3-state preset: P = [[0.5,0.5,0],[0.25,0.5,0.25],[0,0.5,0.5]]
// π = (1/4, 1/2, 1/4), eigenvalues 1, 0.5, 0
const P3 = [[0.5,0.5,0],[0.25,0.5,0.25],[0,0.5,0.5]];
const pi3 = [0.25, 0.5, 0.25];
const check3 = [0,1,2].map(j => pi3.reduce((s,pi,i) => s+pi*P3[i][j], 0));
row('\n3-state π·P[0]',                check3[0], '= 0.25 ✓');
row('3-state π·P[1]',                  check3[1], '= 0.50 ✓');
row('3-state π·P[2]',                  check3[2], '= 0.25 ✓');

// Eigenvalues of P3: solve det(P3 - λI) = 0
// (0.5-λ)[(0.5-λ)² - 0.125] - 0.5[0.25(0.5-λ)] = (0.5-λ)[(0.5-λ)²-0.25] = 0
// → λ=0.5 or (0.5-λ)²=0.25 → λ=0 or λ=1
row('3-state eigenvalues',             '1, 0.5, 0', '(closed form)');
row('3-state mixing rate = 0.5^k',     0.5**5, 'after 5 steps (= 1/32)');

// ═══════════════════════════════════════════════════════════════════════
// 4. DRIFT-DIFFUSION
// ═══════════════════════════════════════════════════════════════════════
sec('4. DRIFT-DIFFUSION (Wiener with drift, boundaries ±a)');

// Backward equation: (σ²/2)u'' + μu' = 0 for P; (σ²/2)T'' + μT' = -1 for E[T]
// P(upper|start=0) = 1/(1+exp(-2μa/σ²))
// E[T|start=0] = (a/μ)tanh(μa/σ²)
const mu_dd=1, a_dd=1, sig_dd=1, t0_dd=0.3;
const P_up = 1/(1+Math.exp(-2*mu_dd*a_dd/sig_dd**2));
const E_T  = (a_dd/mu_dd)*Math.tanh(mu_dd*a_dd/sig_dd**2) + t0_dd;
row('P(upper) μ=1,a=1,σ=1',           P_up,  '≈ 0.88080');
row('E[T] μ=1,a=1,σ=1,t₀=0.3',       E_T,   '≈ 1.06159');
row('P(upper) μ=0 (exact)',            0.5,   '= 0.5 (L\'Hôpital: exp(0)=1)');

// μ=0 limit: E[T] = a²/σ² (Wald-type result for symmetric BM)
const E_T_mu0 = a_dd**2 / sig_dd**2;
row('E[T] μ=0, a=1, σ=1',             E_T_mu0, '= a²/σ² = 1');
// Continuity: lim μ→0 of (a/μ)tanh(μa/σ²) = a·(a/σ²) = a²/σ²
const mu_tiny = 1e-8;
const E_T_tiny = (a_dd/mu_tiny)*Math.tanh(mu_tiny*a_dd/sig_dd**2);
row('Continuity (μ=1e-8 →μ=0)',        E_T_tiny, '≈ 1 (= a²/σ²)');

// 3σ tolerance for simulated P with N=5000 trials
const sigma_Phat = Math.sqrt(P_up*(1-P_up)/5000);
row('\n3σ tol for P̂ (N=5000)',         3*sigma_Phat, '≈ 0.0138');

// Broadie-Glasserman-Kou boundary correction (dt-bias):
// Effective boundary shift ≈ BGK·σ·√dt where BGK = -ζ(1/2)/√(2π)
// ζ(1/2) = -1.46035450880... (Riemann zeta at s=1/2; CITED, NOT INDEPENDENTLY COMPUTED HERE)
// -ζ(1/2)/√(2π) = 1.46035450880.../√(2π) ≈ 0.58264... → 0.5826 to 4 sig figs
// Independent verification: literature value BGK=0.5826 (Broadie, Glasserman, Kou 1997)
// Status: CITED, not independently computed (ζ(1/2) requires convergent series; not implemented here)
const zeta_half_neg = 1.4603545088095868;   // -ζ(1/2), from Broadie et al.
const BGK = zeta_half_neg / Math.sqrt(2 * Math.PI);
const dt_dd = 0.001;
const shift = BGK * sig_dd * Math.sqrt(dt_dd);
row('\n-ζ(1/2) (cited, not computed)',      zeta_half_neg, '≈ 1.46035');
row('BGK = -ζ(1/2)/√(2π)',                  BGK,           '≈ 0.58264 (cited)');
row('BGK boundary shift (σ=1, dt=0.001)', shift, '≈ 0.01842 (≈+0.004 in P, +0.02s in RT)');

// ═══════════════════════════════════════════════════════════════════════
// 5. PHASE-PLANE
// ═══════════════════════════════════════════════════════════════════════
sec('5. PHASE-PLANE (2D, LinAlg.eigen2x2 required)');

// Classification: τ = trace, Δ = determinant
// Δ<0: saddle; Δ=0: degenerate; τ=0,Δ>0: center; etc.
// Star vs improper node: τ²=4Δ (repeated eigenvalue boundary)
function eigen2x2(A) {
  const tau = A[0][0]+A[1][1], det = A[0][0]*A[1][1]-A[0][1]*A[1][0];
  const disc = tau**2 - 4*det;
  if (disc >= 0) {
    return { real: [(tau+Math.sqrt(disc))/2, (tau-Math.sqrt(disc))/2], imag: [0,0] };
  } else {
    return { real: [tau/2, tau/2], imag: [Math.sqrt(-disc)/2, -Math.sqrt(-disc)/2] };
  }
}

const cases = [
  { A:[[-1,0],[0,-2]], label:'stable node [[-1,0],[0,-2]]', expected:'τ=-3,Δ=2' },
  { A:[[0,-1],[1,0]],  label:'center [[0,-1],[1,0]]',       expected:'τ=0,Δ=1' },
  { A:[[-1,-1],[1,-1]],label:'stable spiral [[-1,-1],[1,-1]]',expected:'τ=-2,Δ=2,disc=-4' },
  { A:[[1,0],[0,-1]],  label:'saddle [[1,0],[0,-1]]',       expected:'Δ=-1' },
  { A:[[1,0],[0,2]],   label:'unstable node [[1,0],[0,2]]', expected:'τ=3,Δ=2' },
  { A:[[2,0],[0,2]],   label:'star/improper node [[2,0],[0,2]]', expected:'τ²=4Δ=16' },
];
for (const { A, label, expected } of cases) {
  const tau = A[0][0]+A[1][1], det = A[0][0]*A[1][1]-A[0][1]*A[1][0];
  const { real, imag } = eigen2x2(A);
  console.log(`  ${label}`);
  console.log(`    τ=${tau} Δ=${det} τ²-4Δ=${tau**2-4*det}  λ=${real[0].toFixed(4)}+${imag[0].toFixed(4)}i, ${real[1].toFixed(4)}+${imag[1].toFixed(4)}i  [${expected}]`);
}

// RK4 verification: A=[[-1,-1],[1,-1]], x0=(1,0)
// Exact: x(t) = e^{-t}(cos t, sin t), |x(2π)| = e^{-2π}
function rk4Step(f, x, t, dt) {
  const k1 = f(x,t), k2 = f(x.map((v,i)=>v+dt/2*k1[i]), t+dt/2);
  const k3 = f(x.map((v,i)=>v+dt/2*k2[i]), t+dt/2);
  const k4 = f(x.map((v,i)=>v+dt*k3[i]),   t+dt);
  return x.map((v,i) => v + dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));
}
const A_sp = [[-1,-1],[1,-1]];
const fSp = (x) => [A_sp[0][0]*x[0]+A_sp[0][1]*x[1], A_sp[1][0]*x[0]+A_sp[1][1]*x[1]];
let x_sp = [1, 0]; const dt_sp = 2*Math.PI/10000;
for (let i=0; i<10000; i++) x_sp = rk4Step(fSp, x_sp, i*dt_sp, dt_sp);
const norm_sp = Math.hypot(...x_sp);
const exact_sp = Math.exp(-2*Math.PI);
row('\nA=[[-1,-1],[1,-1]] |x(2π)| RK4',  norm_sp, '(expect e^{-2π})');
row('e^{-2π} (exact)',                    exact_sp, '= 0.00186744');
row('RK4 vs exact error',                 Math.abs(norm_sp - exact_sp), '< 1e-8');

// A=[[0,-1],[1,0]], pure rotation |x(2π)| = 1
const A_cen = [[0,-1],[1,0]];
const fCen = (x) => [A_cen[0][0]*x[0]+A_cen[0][1]*x[1], A_cen[1][0]*x[0]+A_cen[1][1]*x[1]];
let x_cen = [1, 0];
for (let i=0; i<10000; i++) x_cen = rk4Step(fCen, x_cen, i*dt_sp, dt_sp);
row('A=[[0,-1],[1,0]] |x(2π)| RK4',      Math.hypot(...x_cen), '(expect 1)');

// Nonlinear: ṙ = μr³, r(t) = r₀/√(1-2μr₀²t); μ=-1, r₀=1, r(1)=1/√3
const r1_nonlin = 1/Math.sqrt(1 - 2*(-1)*1**2*1);
row('\nNonlinear r(1): r₀/√(1-2μr₀²t)',  r1_nonlin, '= 1/√3 ≈ 0.577350');

// ═══════════════════════════════════════════════════════════════════════
// 6. COMPETITIVE EXCLUSION
// ═══════════════════════════════════════════════════════════════════════
sec('6. COMPETITIVE EXCLUSION (Lotka-Volterra 2-species)');

// Coexistence equilibrium: N*ᵢ > 0 AND α₁₂α₂₁ < 1
const K1=100, K2=100, a12=0.5, a21=0.5;
const den = 1 - a12*a21;
const N1s = (K1-a12*K2)/den, N2s = (K2-a21*K1)/den;
row('Coexist (K=100, α₁₂=α₂₁=0.5) N₁*', N1s, '= 200/3 ≈ 66.667');
row('Coexist N₂*',                         N2s, '= 200/3 ≈ 66.667');

// Counterexample: product < 1 but N*<0 → species 1 wins
const a12b=0.5, a21b=1.5;
const denB = 1 - a12b*a21b; // = 1-0.75 = 0.25 > 0
const N2sB = (K2 - a21b*K1)/denB;
row('\nCounterexample K=100, α₁₂=0.5, α₂₁=1.5:', denB, '= 1-α₁₂α₂₁ = 0.25 > 0');
row('N₂* (negative → sp1 wins)',            N2sB, '= -200  ← coexistence fails');

// Interior equilibrium stable iff N*>0 AND 1-α₁₂α₂₁ > 0 (both required)
// Weaker than mutual invasibility: each species invades when rare
// Species 1 invades: r₁ > α₁₂·r₂·K₂/K₁ → K₁ > α₁₂·K₂ → 100 > 50 ✓
// Species 2 invades: K₂ > α₂₁·K₁ → 100 > 150 ✗ → sp2 cannot invade, sp1 wins
row('\nSp1 invades when rare? K₁>α₁₂K₂',   100>a12b*100 ? 'yes' : 'no', '(100>50 ✓)');
row('Sp2 invades when rare? K₂>α₂₁K₁',    100>a21b*100 ? 'yes' : 'no', '(100>150 ✗ → sp1 wins)');

// Coexist Jacobian eigenvalues: at (N1s, N2s), r₁=r₂=1
// J₁₁ = -r₁N₁*/K₁ = -66.67/100 = -2/3; J₁₂ = -r₁α₁₂N₁*/K₁ = -1/3
// J₂₁ = -r₂α₂₁N₂*/K₂ = -1/3; J₂₂ = -r₂N₂*/K₂ = -2/3
const J11=-N1s/K1, J12=-a12*N1s/K1, J21=-a21*N2s/K2, J22=-N2s/K2;
const tau_J = J11+J22, det_J = J11*J22-J12*J21;
const disc_J = tau_J**2-4*det_J;
row('\nCoexist Jacobian τ',                 tau_J, '= -4/3');
row('Coexist Jacobian Δ',                  det_J, '= 4/9 - 1/9 = 1/3');
row('Eigenvalues λ₁,λ₂',                  (tau_J+Math.sqrt(disc_J))/2, 'and');
row('                  λ₂',               (tau_J-Math.sqrt(disc_J))/2, '(both negative → stable)');
// Actually: τ²-4Δ = (4/3)²-4/3 = 16/9-12/9 = 4/9 > 0 → real eigenvalues
// λ = (-4/3 ± 2/3)/2: λ₁ = (-4/3+2/3)/2 = -1/3, λ₂ = (-4/3-2/3)/2 = -1
row('Eigenvalue -1/3 (user: -1/3)',        (tau_J+Math.sqrt(disc_J>0?disc_J:0))/2, '');
row('Eigenvalue -1   (user: -1)',          (tau_J-Math.sqrt(disc_J>0?disc_J:0))/2, '');

// α₁₂=α₂₁=1 parallel nullclines: N₁/N₂ conserved when r₁=r₂
// From (N₁,N₂)=(10,20): ratio=1/2, approaches (K/3, 2K/3)=(33.33, 66.67)
const N1_par = 100 * (10/30), N2_par = 100 * (20/30);
row('\nα=1 parallel nullclines from (10,20)', N1_par, 'N₁ → K×(N₁₀/S)');
row('N₂ →',                                  N2_par, 'K×(N₂₀/S)');

// Add species-2-wins outcome: α₂₁ < 1 AND α₁₂ > 1 → sp2 wins
const a12c=1.5, a21c=0.5, N1sC=(K1-a12c*K2)/(1-a12c*a21c), N2sC=(K2-a21c*K1)/(1-a12c*a21c);
row('\nSp2 wins (α₁₂=1.5,α₂₁=0.5) N₁*',  N1sC, '= -200 (N₁<0 → sp2 wins)');

// ═══════════════════════════════════════════════════════════════════════
// 7. PHARMACOKINETICS
// ═══════════════════════════════════════════════════════════════════════
sec('7. PHARMACOKINETICS (1-compartment IV + oral Bateman)');

// IV: C(t) = C₀·e^{-ke·t}; AUC = C₀/ke; t½ = ln2/ke
// Parameters match model defaults: D=100 mg, Vd=10 L, ke=0.1 /h → C₀=D/Vd=10 mg/L
const ke=0.1, D_pk=100, Vd=10;
const C0_pk = D_pk / Vd;   // = 10 mg/L  (NOT 100 — Vd=10 divides D)
const t_half_pk = Math.LN2 / ke;
const AUC_IV = C0_pk / ke;
row('IV t½ = ln2/ke',                     t_half_pk, 'h  (= 6.9315)');
row('IV AUC = C₀/ke',                     AUC_IV,    'mg·h/L  (= 100 at C₀=10, ke=0.1)');
row('IV C(5h)',                            C0_pk*Math.exp(-ke*5), 'mg/L  (≈ 6.0653)');

// Oral Bateman: C(t) = (ka·F·D)/(Vd·(ka-ke))·(e^{-ke·t} - e^{-ka·t})
// t_max = ln(ka/ke)/(ka-ke)
const ka=1.0, F=1, D=100;
const t_max = Math.log(ka/ke)/(ka-ke);
row('\nOral t_max = ln(ka/ke)/(ka-ke)',    t_max, 'h  (≈ 2.5584)');
const A_bat = ka*F*D/(Vd*(ka-ke));
const C_max = A_bat*(Math.exp(-ke*t_max)-Math.exp(-ka*t_max));
row('C_max (oral)',                        C_max,     'mg/L');

// ka = ke limit (L\'Hôpital): C → F·D·ke·t·e^{-ke·t}/Vd; t_max = 1/ke
const C_eq_lim = F*D*ke*t_half_pk*Math.exp(-ke*t_half_pk)/Vd; // at t=t_half
row('\nLimit ka→ke: C → F·D·k·t·e^{-kt}/Vd (at t=ln2/k)', C_eq_lim, 'mg/L');
row('Limit t_max = 1/ke',                 1/ke,      'h');
// Check with ka = ke(1+ε): C → limit
const ka_eps = ke*(1+1e-9);
const A_eps = ka_eps*F*D/(Vd*(ka_eps-ke));
const C_eps = A_eps*(Math.exp(-ke*t_max)-Math.exp(-ka_eps*t_max));
row('C_max at ka=ke(1+1e-9) vs limit',    Math.abs(C_eps - C_max), '< 0.01 (continuity)');

// Flip-flop symmetry: ke·C(t;ka,ke) = ka·C(t;ke,ka)
const t_test = 3;
const C1 = ke * A_bat * (Math.exp(-ke*t_test) - Math.exp(-ka*t_test));
const A_ff = ke*F*D/(Vd*(ke-ka));
const C2 = ka * A_ff * (Math.exp(-ka*t_test) - Math.exp(-ke*t_test));
row('\nFlip-flop: ke·C(t;ka,ke)',          C1, 'mg/L');
row('           ka·C(t;ke,ka)',            C2, 'mg/L (should match)');
row('Flip-flop residual',                  Math.abs(C1-C2), '≈ 0');

// IV C0 = D/Vd
row('\nIV C₀ = D/Vd',                     D/Vd, 'mg/L (= 10 at D=100, Vd=10)');

// AUC_oral/AUC_IV = F
const AUC_oral_exact = F*D/(Vd*ke);
row('AUC_oral = F·D/(Vd·ke)',             AUC_oral_exact, 'mg·h/L');
row('AUC_oral / AUC_IV = F',             AUC_oral_exact/AUC_IV, '= 1 (at F=1)');

// Multi-dose accumulation: R = 1/(1-e^{-ke·τ})
// t½=24h, τ=12h: R = 1/(1-e^{-ln2/24 × 12}) = 1/(1-2^{-0.5}) = 2+√2
const ke_md = Math.LN2/24, tau_md = 12;
const R_md = 1/(1-Math.exp(-ke_md*tau_md));
row('\nMulti-dose R (t½=24h, τ=12h)',     R_md, '= 2+√2 ≈ 3.4142');
row('2+√2',                              2+Math.SQRT2, '= 3.4142');

// dC/dt ≈ 0 at t_max (central difference test tolerance 1e-7)
const h_cd = 1e-4;
const C_plus  = A_bat*(Math.exp(-ke*(t_max+h_cd))-Math.exp(-ka*(t_max+h_cd)));
const C_minus = A_bat*(Math.exp(-ke*(t_max-h_cd))-Math.exp(-ka*(t_max-h_cd)));
row('\ndC/dt at t_max (central diff h=1e-4)', (C_plus-C_minus)/(2*h_cd), '≈ 0 (tol 1e-7)');

// ═══════════════════════════════════════════════════════════════════════
// T-5: Competitive exclusion Jacobian eigenvalues for r1≠r2
// ═══════════════════════════════════════════════════════════════════════
sec('T-5: COMPETITIVE EXCLUSION JACOBIAN (r1=1, r2=2)');

// Parameters: K1=K2=100, a12=0.5, a21=0.5, r1=1, r2=2
const K1_t5 = 100, K2_t5 = 100, a12_t5 = 0.5, a21_t5 = 0.5, r1_t5 = 1, r2_t5 = 2;
const den_t5 = 1 - a12_t5 * a21_t5;          // = 0.75
const N1s_t5 = (K1_t5 - a12_t5*K2_t5)/den_t5; // = 200/3
const N2s_t5 = (K2_t5 - a21_t5*K1_t5)/den_t5; // = 200/3
row('N1* (K=100, a12=a21=0.5)', N1s_t5, '= 200/3 ≈ 66.667');
row('N2*', N2s_t5, '= 200/3 ≈ 66.667');

// Jacobian: J[i][j] with ri
const J11 = -r1_t5 * N1s_t5 / K1_t5;          // -2/3
const J12 = -r1_t5 * a12_t5 * N1s_t5 / K1_t5; // -1/3
const J21 = -r2_t5 * a21_t5 * N2s_t5 / K2_t5; // -2/3
const J22 = -r2_t5 * N2s_t5 / K2_t5;          // -4/3
row('J11 = -r1·N1*/K1', J11, '= -2/3');
row('J12 = -r1·a12·N1*/K1', J12, '= -1/3');
row('J21 = -r2·a21·N2*/K2', J21, '= -2/3');
row('J22 = -r2·N2*/K2', J22, '= -4/3');

const tau_t5  = J11 + J22;                       // -2
const det_t5  = J11*J22 - J12*J21;               // 8/9 - 2/9 = 2/3
const disc_t5 = tau_t5**2 - 4*det_t5;            // 4 - 8/3 = 4/3
const lam1_t5 = (tau_t5 + Math.sqrt(disc_t5))/2; // -1 + 1/√3
const lam2_t5 = (tau_t5 - Math.sqrt(disc_t5))/2; // -1 - 1/√3
row('\nτ = J11+J22', tau_t5, '= -2 (exact)');
row('Δ = det(J)', det_t5, '= 2/3 (exact)');
row('disc = τ²-4Δ', disc_t5, '= 4/3 (exact)');
row('λ1 = -1 + 1/√3', lam1_t5, `= ${-1+1/Math.sqrt(3)} ≈ -0.4226`);
row('λ2 = -1 - 1/√3', lam2_t5, `= ${-1-1/Math.sqrt(3)} ≈ -1.5774`);
row('Both eigenvalues < 0?', lam1_t5 < 0 && lam2_t5 < 0, '→ stable coexistence');

// ═══════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(70));
console.log('ANCHOR SUMMARY');
console.log('═'.repeat(70));
console.log('  1. particle-in-box    : E1=0.376030eV, photon=1099nm, P(L/3)=0.195501, <x²>, norm');
console.log('  2. carnot             : η=0.4, Tc_max=585K, COP_hp-COP_ref=1, COP_hp(Tc=0)=1');
console.log('  3. markov-chains      : π=4/7,3/7, λ₂=0.3, d(k)=|λ₂|^k·max(π), t_mix=4, 3-state');
console.log('  4. drift-diffusion    : P=0.88080, E[T]=1.06159, E[T](μ=0)=a²/σ², BGK=0.5826');
console.log('  5. phase-plane        : eigen2x2, |x(2π)|=e^{-2π}, center=1, r(1)=1/√3');
console.log('  6. competitive-excl   : N*=66.67, counterexample N2*=-200, α=1→(33.3,66.7)');
console.log('  7. pharmacokinetics   : t_max=2.56h, R=2+√2, flip-flop, ka=ke limit');
