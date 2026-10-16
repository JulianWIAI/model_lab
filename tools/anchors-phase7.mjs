/**
 * anchors-phase7.mjs — compute ALL Phase 7 numerical anchors from pure JS math.
 * Run: node tools/anchors-phase7.mjs
 * R1: No model code imported; all values derived from first principles here.
 */

// ─── Utility ──────────────────────────────────────────────────────────────────
function section(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(' ' + title);
  console.log('═'.repeat(60));
}
function row(label, value, note = '') {
  const v = typeof value === 'number' ? value : value;
  console.log(`  ${label.padEnd(45)} ${String(v)}${note ? '  // ' + note : ''}`);
}

// ─── LinAlg ───────────────────────────────────────────────────────────────────
section('LinAlg');

// [[2,1],[1,2]] eigenvalues: char poly (2-λ)²-1=0 → λ²-4λ+3=0 → (λ-3)(λ-1)=0
const linalg_lambda1 = 3;
const linalg_lambda2 = 1;
row('λ₁ (dominant)', linalg_lambda1, 'char poly: (2-λ)²-1=0');
row('λ₂', linalg_lambda2);

// Eigenvectors: [1,1]/√2 and [1,-1]/√2
const SQRT2 = Math.sqrt(2);
const ev1 = [1/SQRT2, 1/SQRT2];
const ev2 = [1/SQRT2, -1/SQRT2];
// Verify Av=λv for A=[[2,1],[1,2]]
// A*ev1 = [2/√2+1/√2, 1/√2+2/√2] = [3/√2, 3/√2] = 3*ev1 ✓
// A*ev2 = [2/√2-1/√2, 1/√2-2/√2] = [1/√2, -1/√2] = 1*ev2 ✓
row('ev1 = [1,1]/√2', `[${ev1[0].toFixed(10)}, ${ev1[1].toFixed(10)}]`, 'Av=3v ✓');
row('ev2 = [1,-1]/√2', `[${ev2[0].toFixed(10)}, ${ev2[1].toFixed(10)}]`, 'Av=1v ✓');

// Power iteration from v0=[1,0]:
// After n iterations, angle θ from dominant eigvec satisfies tanθ_n = (1/3)^n
// Check: v0=[1,0] = (1/√2)*ev1 + (1/√2)*ev2
// After n power iters: ratio of ev2 component to ev1 component = (λ2/λ1)^n = (1/3)^n
// tanθ_n = (1/3)^n
for (const n of [5, 10, 15, 30]) {
  const tanTheta = Math.pow(1/3, n);
  const rayleigh = 3 - 2 / (Math.pow(9, n) + 1);
  row(`tanθ at n=${n}`, tanTheta);
  row(`Rayleigh λ at n=${n}`, rayleigh, '3 - 2/(9^n+1)');
}

// (1/3)^30 exactly
const oneThirdPow30 = Math.pow(1/3, 30);
row('(1/3)^30', oneThirdPow30);

// 3×3 tridiagonal T with 2 on diagonal, -1 off: eigenvalues λ_k = 2-2cos(kπ/4) for k=1,2,3
const lam3x3_1 = 2 - 2*Math.cos(Math.PI/4);   // 2-√2
const lam3x3_2 = 2 - 2*Math.cos(2*Math.PI/4); // 2
const lam3x3_3 = 2 - 2*Math.cos(3*Math.PI/4); // 2+√2
const trace3x3 = lam3x3_1 + lam3x3_2 + lam3x3_3;
const det3x3   = lam3x3_1 * lam3x3_2 * lam3x3_3;
row('3×3 tridiag λ₁ = 2-√2', lam3x3_1);
row('3×3 tridiag λ₂ = 2', lam3x3_2);
row('3×3 tridiag λ₃ = 2+√2', lam3x3_3);
row('3×3 tridiag trace = 6', trace3x3);
row('3×3 tridiag det = 4', det3x3);

// ceil(ln(1e-4)/ln(0.9)) for eigenvectors bench Q2
// Need tanθ_n < 1e-4 when ratio is (λ2/λ1)^n = (9/10)^n (for a different matrix)
const eigBenchIters = Math.ceil(Math.log(1e-4) / Math.log(0.9));
row('ceil(ln(1e-4)/ln(0.9))', eigBenchIters, 'iterations for convergence');

// ─── Wave Interference ────────────────────────────────────────────────────────
section('Wave Interference');

// Δy = λL/d at λ=500nm, L=1m, d=1mm
const lambda_wi = 500e-9;
const L_wi = 1.0;
const d_wi = 1e-3;
const deltaY_wi = lambda_wi * L_wi / d_wi;
row('Δy at λ=500nm,L=1m,d=1mm (m)', deltaY_wi, '= 5e-4 m');

// y_dark(0) = Δy/2
const yDark0 = deltaY_wi / 2;
row('y_dark(0) = Δy/2 (m)', yDark0, '= 2.5e-4 m');

// I at dark fringe = cos²(π/2) = 0
const I_dark = Math.cos(Math.PI/2) ** 2;
row('I at dark fringe y=yDark(0)', I_dark, 'cos²(π/2)=0');

// Δy ∝ λ: ratio 700nm/400nm
const ratio_red_violet = 700 / 400;
row('Δy_red/Δy_violet', ratio_red_violet, '700/400=1.75');

// ─── Standing Waves ───────────────────────────────────────────────────────────
section('Standing Waves');

const L_sw = 1.0;
const v_sw = 343;
const f1_sw = v_sw / (2 * L_sw);
row('f₁ string L=1m, v=343 m/s (Hz)', f1_sw, '= 171.5 Hz');
row('f₂/f₁', 2, 'exactly');
row('f₃/f₁ closed pipe (odd harmonics)', 3, 'odd only');
// f_n = n*v/(2L)
for (const n of [1, 2, 3, 4, 5]) {
  const fn = n * v_sw / (2 * L_sw);
  row(`f_${n} open pipe (Hz)`, fn);
}
// Closed pipe f_m = m*v/(4L) for m=1,3,5
for (const m of [1, 3, 5]) {
  const fm = m * v_sw / (4 * L_sw);
  row(`f_${m} closed pipe (Hz)`, fm);
}

// ─── Synapse Kinetics ─────────────────────────────────────────────────────────
section('Synapse Kinetics');

// h(t) = A*(t/tau)*exp(-t/tau)
// Peak at t=tau: h(tau) = A*exp(-1)
const hPeak = Math.exp(-1);
row('h(τ)/A = e^{-1}', hPeak);

// h(2τ)/h(τ) = 2/e
const h2tau_over_htau = 2 * Math.exp(-2) / Math.exp(-1);  // = 2/e
row('h(2τ)/h(τ) = 2/e', h2tau_over_htau);
row('2/e (exact)', 2/Math.E);

// halfDecayTime: solve x*exp(-x) = exp(-2), x > 1, so t = x*tau
// Brent's method on f(x) = x*exp(-x) - exp(-2)
function brent(f, a, b, tol = 1e-12) {
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) throw new Error('brent: no bracket');
  if (Math.abs(fa) < Math.abs(fb)) { [a,b]=[b,a]; [fa,fb]=[fb,fa]; }
  let c = a, fc = fa, d = b-a, e = d, mflag = true;
  for (let i = 0; i < 300; i++) {
    if (Math.abs(fb) < tol || Math.abs(b-a) < tol) break;
    let s;
    if (fa !== fc && fb !== fc) {
      s = a*fb*fc/((fa-fb)*(fa-fc)) + b*fa*fc/((fb-fa)*(fb-fc)) + c*fa*fb/((fc-fa)*(fc-fb));
    } else {
      s = b - fb*(b-a)/(fb-fa);
    }
    const mid = (a+b)/2;
    const cond1 = s < (3*a+b)/4 || s > b;
    const cond2 = mflag && Math.abs(s-b) >= Math.abs(b-c)/2;
    const cond3 = !mflag && Math.abs(s-b) >= Math.abs(c-d)/2;
    const cond4 = mflag && Math.abs(b-c) < tol;
    const cond5 = !mflag && Math.abs(c-d) < tol;
    if (cond1||cond2||cond3||cond4||cond5) { s=mid; mflag=true; } else mflag=false;
    const fs = f(s); d=c; c=b; fc=fb;
    if (fa*fs < 0) { b=s; fb=fs; } else { a=s; fa=fs; }
    if (Math.abs(fa) < Math.abs(fb)) { [a,b]=[b,a]; [fa,fb]=[fb,fa]; }
  }
  return b;
}
// x*exp(-x) = exp(-2), x in [2, 10]
const targetHalf = Math.exp(-2);
const xHalf = brent(x => x * Math.exp(-x) - targetHalf, 2, 10);
row('halfDecayTime / τ (x*e^{-x}=e^{-2})', xHalf, '≈ 3.1462');
row('verify: x*exp(-x)', xHalf * Math.exp(-xHalf), `should equal exp(-2) = ${targetHalf}`);

// ∫₀^∞ h(t) dt = A*tau
row('∫₀^∞ h dt = A*τ', 'A*tau', 'by substitution u=t/τ, Γ(2)=1');

// ─── Nash Equilibria ──────────────────────────────────────────────────────────
section('Nash Equilibria');

// Matching Pennies: A=[[1,-1],[-1,1]], B=[[-1,1],[1,-1]]
// Mixed NE: p*=q*=0.5 by symmetry; value = 0
row('Matching Pennies p*', 0.5);
row('Matching Pennies q*', 0.5);
row('Matching Pennies value at NE', 0);

// Battle of Sexes: A=[[2,0],[0,1]], B=[[1,0],[0,2]]
// Row indiff: q*2+(1-q)*0 = q*0+(1-q)*1 → 2q = 1-q → 3q=1 → q=1/3
// Col indiff: p*1+(1-p)*0 = p*0+(1-p)*2 → p = 2(1-p) → 3p=2 → p=2/3
const q_star_BoS = 1/3;
const p_star_BoS = 2/3;
// Row value at mixed NE: row plays row1 with prob p, row2 with prob 1-p
// Row1 payoff = q*2 + (1-q)*0 = 2q = 2/3
// Row2 payoff = q*0 + (1-q)*1 = 1-q = 2/3
const rowVal_BoS = p_star_BoS * (q_star_BoS * 2 + (1-q_star_BoS) * 0)
                + (1-p_star_BoS) * (q_star_BoS * 0 + (1-q_star_BoS) * 1);
row('BoS q* = 1/3', q_star_BoS);
row('BoS p* = 2/3', p_star_BoS);
row('BoS Row value at mixed NE', rowVal_BoS, '= 2/3');
row('BoS Col value at mixed NE', 2/3, 'by symmetry');

// General formulas: A=[[a,b],[c,d]], B=[[e,f],[g,h]]
// q* = (d-b)/(a-b-c+d), p* = (h-g)/(e-f-g+h)
// Verify BoS: A=[[2,0],[0,1]]: q* = (1-0)/(2-0-0+1) = 1/3 ✓
// B=[[1,0],[0,2]]: p* = (2-0)/(1-0-0+2) = 2/3 ✓
const q_formula_BoS = (1-0) / (2-0-0+1);
const p_formula_BoS = (2-0) / (1-0-0+2);
row('q* formula check (BoS)', q_formula_BoS, 'should be 1/3');
row('p* formula check (BoS)', p_formula_BoS, 'should be 2/3');

// Row value formula = (a*d - b*c) / (a - b - c + d) for Matching Pennies:
// A=[[1,-1],[-1,1]]: (1*1 - (-1)*(-1)) / (1-(-1)-(-1)+1) = (1-1)/(1+1+1+1) = 0/4 = 0 ✓
const rowVal_MP_formula = (1*1 - (-1)*(-1)) / (1 - (-1) - (-1) + 1);
row('Matching Pennies value formula', rowVal_MP_formula, '= 0 ✓');

// ─── Prisoner's Dilemma ───────────────────────────────────────────────────────
section("Prisoner's Dilemma");

const T=5, R=3, P=1, S=0;
const isPD = T>R && R>P && P>S && (2*R > T+S);
row('isPD with T=5,R=3,P=1,S=0', isPD, 'T>R>P>S and 2R>T+S: 6>5');
row('2R>T+S check: 2*3 vs 5+0', 2*R > T+S, '6>5');

const deltaStar = (T-R)/(T-P);
row('δ* = (T-R)/(T-P)', deltaStar, '= 0.5');

const dDeltaStarDT = (R-P) / Math.pow(T-P, 2);
row('dδ*/dT = (R-P)/(T-P)²', dDeltaStarDT, '= 2/16 = 0.125');

const delta06 = 0.6;
const pvCoop = R / (1 - delta06);
const pvDefect = T + delta06 * P / (1 - delta06);
row('PV cooperate (δ=0.6)', pvCoop, '= 7.5');
row('PV defect (δ=0.6)', pvDefect, '= 6.5');
row('coop > defect at δ=0.6', pvCoop > pvDefect);

// Numerical sum N=2000
const N_pd = 2000;
let pvNum = 0;
for (let t = 0; t < N_pd; t++) pvNum += R * Math.pow(delta06, t);
row('pvNumerical(0.6, N=2000)', pvNum, `cf closed form ${pvCoop}`);
row('diff |pvNum - pvCoop|', Math.abs(pvNum - pvCoop));

// TFT threshold = max((T-R)/(T-P), (T-R)/(R-S))
const tftThreshold = Math.max((T-R)/(T-P), (T-R)/(R-S));
row('TFT threshold = max(0.5, 2/3)', tftThreshold, '= 2/3');

// δ* independent of S: change S to -1
const deltaStarS_neg1 = (T-R)/(T-P); // does not depend on S
row('δ* with S=-1 (same as S=0?)', deltaStarS_neg1 === deltaStar, 'independent of S');

// ─── Bayes ────────────────────────────────────────────────────────────────────
section('Bayes');

// Posterior mean α=β=1, k=7, n=10: (1+7)/(2+10) = 8/12 = 2/3
const postMean = (1+7)/(2+10);
row('posteriorMean α=β=1, k=7, n=10', postMean, '= 2/3');

// Γ(1/2) = √π
// Using Lanczos approx g=7, n=9 (Spouge/Lanczos)
// We compute via known identity: Γ(1/2) = √π
const sqrtPi = Math.sqrt(Math.PI);
row('Γ(1/2) = √π', sqrtPi);

// B(2,3) = Γ(2)Γ(3)/Γ(5) = 1!*2!/4! = 1*2/24 = 1/12
const B23 = 1 * 2 / 24; // Γ(2)=1!=1, Γ(3)=2!=2, Γ(5)=4!=24
row('B(2,3) = 1/12', B23);

// Beta(2,2) CDF at x=0.5: I_{0.5}(2,2) = 3*(0.5)²-2*(0.5)³ = 3/4-1/4 = 0.5
const betaCDF_22_05 = 3*0.5**2 - 2*0.5**3;
row('Beta(2,2) CDF at x=0.5', betaCDF_22_05, '= 0.5');

// Beta(1,1) 95% CI = [0.025, 0.975] (uniform)
row('Beta(1,1) 95% CI lower', 0.025);
row('Beta(1,1) 95% CI upper', 0.975);

// I_x(2,3) at x=0.3 via binomial tail formula
// I_x(a,b) = Σ_{j=a}^{a+b-1} C(a+b-1,j) x^j (1-x)^{a+b-1-j}
// a=2, b=3, a+b-1=4, x=0.3
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) { r *= (n - i); r /= (i + 1); }
  return r;
}
let I23_03 = 0;
for (let j = 2; j <= 4; j++) {
  I23_03 += comb(4, j) * Math.pow(0.3, j) * Math.pow(0.7, 4-j);
}
row('I_{0.3}(2,3) via binomial tail', I23_03, '= 0.3483');

// Beta(a,a) median = 1/2 by symmetry
row('Beta(a,a) median = 0.5', 0.5, 'by symmetry');

// ─── Information Theory ───────────────────────────────────────────────────────
section('Information Theory (bits = log₂)');

const log2 = x => Math.log(x) / Math.log(2);

// H([0.5,0.5]) = 1 bit
const H_fair = -0.5*log2(0.5) - 0.5*log2(0.5);
row('H([0.5,0.5]) = 1 bit', H_fair);

// H([0.25,0.25,0.25,0.25]) = 2 bits
const H_uniform4 = -4*(0.25*log2(0.25));
row('H([¼,¼,¼,¼]) = 2 bits', H_uniform4);

// KL(P‖Q) where P=(1/2,1/2), Q=(1/4,3/4)
const KL_PQ = 0.5*log2(0.5/0.25) + 0.5*log2(0.5/0.75);
row('KL(P‖Q) P=(½,½) Q=(¼,¾) bits', KL_PQ, '= 1-(1/2)log₂3');
// Exact: 1 - (1/2)*log₂(3)
const KL_PQ_exact = 1 - 0.5*log2(3);
row('KL_PQ exact formula: 1-(½)log₂3', KL_PQ_exact);
row('Difference', Math.abs(KL_PQ - KL_PQ_exact));

// KL(Q‖P) where Q=(1/4,3/4), P=(1/2,1/2)
const KL_QP = 0.25*log2(0.25/0.5) + 0.75*log2(0.75/0.5);
row('KL(Q‖P) Q=(¼,¾) P=(½,½) bits', KL_QP, '≈ 0.188722');
// Exact: (3/4)*log₂3 - 1
const KL_QP_exact = (3/4)*log2(3) - 1;
row('KL_QP exact formula: (¾)log₂3-1', KL_QP_exact);

// Shannon-Hartley: C/B = log₂(1+SNR) at SNR=63
const SH_SNR63 = log2(1+63);
row('C/B at SNR=63 = log₂(64) bits/Hz', SH_SNR63, '= 6 exactly');

// H₂(p)=0.5: find p by brent
// binaryEntropy(p) = -p*log₂p - (1-p)*log₂(1-p)
function binaryH(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p*log2(p) - (1-p)*log2(1-p);
}
// binaryH(p) = 0.5: solve for p in (0, 0.5)
const p_halfBit = brent(p => binaryH(p) - 0.5, 0.001, 0.499);
row('p s.t. H₂(p)=0.5 bit', p_halfBit, '≈ 0.1102');
row('verify H₂(p_halfBit)', binaryH(p_halfBit));

// log₂(3) reference
row('log₂(3)', log2(3));

section('Summary: Key anchors for tests');
console.log('  LinAlg λ₁=3, λ₂=1');
console.log(`  3×3 tridiag: λ=[${lam3x3_1.toFixed(6)}, ${lam3x3_2.toFixed(6)}, ${lam3x3_3.toFixed(6)}], trace=6, det=4`);
console.log(`  (1/3)^30 = ${oneThirdPow30.toExponential(4)}`);
console.log(`  eigvec bench Q2: ceil(ln(1e-4)/ln(0.9)) = ${eigBenchIters}`);
console.log(`  waveInt Δy = ${deltaY_wi} m`);
console.log(`  standWave f₁ = ${f1_sw} Hz`);
console.log(`  synapse halfDecay = ${xHalf.toFixed(7)}τ`);
console.log(`  nash BoS p*=2/3, q*=1/3, value=2/3`);
console.log(`  PD δ*=0.5, pvCoop(0.6)=7.5, pvDefect(0.6)=6.5, TFT=2/3`);
console.log(`  Bayes postMean=2/3, Γ(½)=√π=${sqrtPi.toFixed(10)}, B(2,3)=1/12`);
console.log(`  IT KL(P‖Q)=${KL_PQ.toFixed(8)}, KL(Q‖P)=${KL_QP.toFixed(8)}, SH(63)=6`);
