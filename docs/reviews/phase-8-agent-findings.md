# Phase 8 Independent Review-Agent Findings

Full 25-finding report from the independent review agent run over all Phase 8 model, test, and
core files. Severity: **HIGH** → **MED** → **LOW** → **INF** (informational, no fix required).
Disposition column records the phase in which each finding was resolved, or current status.

---

## HIGH severity (1)

| ID | Location | Finding | Disposition |
|---|---|---|---|
| F-1 | `MarkovModel.js:112–126` | `stationaryN` comment said "power iteration on Pᵀ" but the loop computes v·P (left-multiply). The 2-state helper builds an explicit Pᵀ and right-multiplies. Both converge for ergodic row-stochastic matrices, but the mismatch was misleading and would cause silent errors if adapted to asymmetric P. | **FIXED (8c)** — comment aligned to "row-vector: v ← v·P"; new test for non-symmetric P confirms π·P=π and verifies P·π ≠ π (right ≠ left eigenvector). |

---

## MED severity (14)

| ID | Location | Finding | Disposition |
|---|---|---|---|
| A-1 | `particle-in-box.test.js` | ⟨x²⟩_n tested only for n=1; P(0<x<L/3) tested only for n=1; scaling E_1(2L)/E_1(L)=0.25 and strict energy monotonicity for n=1..5 both absent. | **FIXED (8b)** — ⟨x²⟩ for n=2,3; P(L/3) for n=2,3; scaling ratio; monotonicity tests added (4 tests). Anchors carry exact formulas. |
| A-2 | `carnot.test.js` | T_c,max (T_c = T_h·(1−η)) not tested; Clausius equality Q_h/T_h = Q_c/T_c not tested; W = Q_h − Q_c first-law identity not tested. | **FIXED (8b)** — all three tests added (±1e-10). Clausius noted WEAK (self-referential anchor). |
| A-3 | `markov-chains.test.js` | LPW mixing-time upper bound not tested; p=q=1 periodic chain behavior (λ₂=−1, tMix=∞) not tested; 3-state π not verified by exact rational values. | **FIXED (8b)** — LPW bound `7.789 ≥ exact t_mix 4`; periodic chain tests; π=[1/4,1/2,1/4] by value; 3-state eigenvalues added. |
| B-1 | `competitive-exclusion.test.js` | Bistable region (α₁₂α₂₁>1) not tested; N* for bistable case never computed or verified. Jacobian eigenvalues in bistable case (unstable interior equilibrium) absent. | **FIXED (8b)** — `bistable N₁*=N₂*=40 ±1e-10`; Jacobian λ=+0.2, −1 ±1e-10; anchors carry derivation (τ=−0.8, det=−0.2, disc=1.44). |
| B-2 | `competitive-exclusion.test.js` | IC-dependent long-run trajectories not tested: for bistable case, outcome depends on initial condition; (60,40)→sp1 and (40,60)→sp2 paths never exercised with RK4. | **FIXED (8b→8c)** — long-run RK4 from two ICs; thresholds \|N₁−100\|<1e-6 and N₂<1e-6 (or vice versa) at t=300. |
| B-3 | `competitive-exclusion.test.js` | dt-halving convergence not tested; RK4 order (O(dt⁴)) not verified for the LV system; error ratio unexpectedly broad bound. | **FIXED (8b→8c)** — dt-halving test updated to assert error ratio in [12,20] (RK4 Richardson; halving reduces error by ≈16×). |
| F-2 | `CompetitiveExclusionModel.js:126` | `nullcline2()` divided by a21 with no α=0 guard; constructor allows a21=0 (rejects only a21<0). At a21=0 the result was `{slope:Infinity, intercept:Infinity}` silently propagated to the view. | **FIXED (8c)** — returns `{type:'horizontal', value:K2}` for a21=0; `nullcline1()` returns `{type:'vertical', value:K1}` for a12=0; view draws these correctly; 4 new tests. |
| F-3 | `PharmacokineticsModel.js:80–82` | Docstring promised expm1 cancellation fix (`exp(-ke·t)·(−expm1(-(ka−ke)·t))`); code used plain subtraction `(e^{-ke·t} − e^{-ka·t})`, losing ~2 digits when ka≈ke and t is small. | **FIXED (8c)** — expm1 form implemented; Taylor-series test at t=1e-6 confirms ±1e-14 rel stability. |
| F-4 | `PhasePlaneModel.js:52` | Classification used `D === 0` (strict float equality); rank-1 matrices from decimal arithmetic (e.g., [[0.1,0.3],[0.3,0.9]]: exact det=0 but float gives ≈1e-17) fell to wrong branch. | **FIXED (8c)** — `\|D\| < eps·max(1,normA²)` with eps=1e-10; test A=[[0.1,0.3],[0.3,0.9]] now classified as "Degenerate (zero eigenvalue)". |
| T-1 | `particle-in-box.test.js` | ⟨x⟩_n = L/2 (symmetry of \|ψ_n\|²) never numerically verified; relied on formula without independent numerical path. | **FIXED (8c)** — Simpson integration of x·\|ψ_n\|² for n=1,2,3; tolerance 1e-8 rel to L. |
| T-2 | `particle-in-box.test.js` | cdf(L,n) ≈ 1 (total probability = 1) never tested; completeness of integration not checked at the box boundary. | **FIXED (8c)** — `cdf(L,n)≈1 ±1e-6` for n=1,2,3. |
| T-3 | `carnot.test.js` | `copRefrigerator(Tc=0)` = 0 not tested; edge case at absolute-zero cold reservoir. | **FIXED (8c)** — test added; Tc/(Th−Tc) = 0 exact when Tc=0. |
| T-4 | `drift-diffusion.test.js` | Large-μ asymptotic limits P+→1 and meanFPT→a/μ untested; no test coverage for μ≫a/σ². | **FIXED (8c)** — test at μ=10 (a=σ=1): P+>1−1e-8; \|FPT−a/μ\|<1e-9; tolerances derived from 1−P+≈exp(−20)≈2e-9, FPT error ≈ 2(a/μ)exp(−20) ≈ **4.1e-10**. |
| T-5 | `competitive-exclusion.test.js` | r1≠r2 Jacobian untested; all existing tests used model defaults r1=r2=1, leaving asymmetric-growth-rate paths untested. | **FIXED (8c)** — r1=1, r2=2; K=100, α=0.5; eigenvalues −1±1/√3 (τ=−2, Δ=2/3, disc=4/3) ±1e-10; derivation in anchors-phase8.mjs T-5 section. |

---

## LOW severity (5)

| ID | Location | Finding | Disposition |
|---|---|---|---|
| E-1 | `CarnotModel.js` / `MarkovModel.js` / `PharmacokineticsModel.js` | Multiple constructors missing input validation: Tc<0 (absolute zero), Th≤0, NaN (Carnot); p,q outside [0,1] (Markov); ke≤0, ka≤0, Vd≤0, F outside (0,1] (Pharmacokinetics). All produced NaN/Infinity or wrong physics silently. | **FIXED (8b)** — RangeErrors added to all three models; tests for each guard: Tc<0, Th≤0, NaN, p/q bounds, ke/ka/Vd/F bounds (total 9 validation tests). |
| E-4 | `DriftDiffusionModel.js` | t0<0 (negative non-decision time) not validated; meaningless negative shift accepted without error. | **FIXED (8c)** — RangeError thrown for t0<0; test added. |
| E-5 | `ParticleInBoxModel.js` | `cdf(xMax > L)` not guarded; passing xMax=2L silently over-integrated outside the box boundary. | **FIXED (8c)** — `xMax = Math.min(Math.max(xMax,0),L)` clamp added; test passes xMax=2L. |
| N-1 | `MarkovModel.js:mixingTime` | `tMix` loop computes `\|λ₂\|**k` via `Math.pow` in a loop up to 10,000 iterations; a cumulative multiply `v *= absLambda2` would be O(k) with no large-exponent precision concern. | **DEFERRED** — performance-only; correctness unaffected; candidate for Phase 9 cleanup. |
| Q-4 / Q-5 | `DriftDiffusionModel.js` / `CompetitiveExclusionModel.js` | Two doc/sentinel issues: (a) `t > 100` safety cap in `simulate` is undocumented relative to expected FPT scale (a²/σ² can exceed 100); (b) `outcome` fallback returned string `'undefined'` instead of a typed sentinel. | (a) **DEFERRED** — low risk for defaults; Phase 9 candidate. (b) **FIXED (8c)** — changed to `'unknown'`; test asserts `notStrictEqual(outcome,'undefined')`. |

---

## INF severity — informational, no code change required (5)

| ID | Location | Finding | Disposition |
|---|---|---|---|
| A-4 | `tests/core/eigen2x2.test.js` | No dedicated test file existed for `eigen2x2`; correctness exercised only transitively through phase-plane tests. | **FIXED (8b)** — `tests/core/eigen2x2.test.js` created; 6 tests including saddle, defective, star, and cross-check vs jacobiEigen on [[2,1],[1,2]] ±1e-10. |
| A-5 | `competitive-exclusion.test.js` | Grid sweep tested only with K1=K2=100; asymmetric carrying capacities (K1≠K2) never exercised, leaving the K1/K2 invasion threshold unchecked for all four outcome classes. | **FIXED (8c close-out)** — K1=100, K2=50 grid test added; coexistence, sp1-wins, sp2-wins, bistable, parallel all asserted; RK4 confirms deterministic outcomes from two ICs each. |
| A-6 | `markov-chains.test.js` | 3-state stationary π verified only via `π·P residual ±1e-10`; the exact rational values [1/4, 1/2, 1/4] not directly asserted. | **FIXED (8b)** — `π=[1/4,1/2,1/4] by value ±1e-10` test added (3 entries); stationarity by algebraic identity also added. |
| I-1 | `carnot.test.js` | Clausius equality anchor is self-referential: both Q_h/T_h and Q_c/T_c are derived from the same `dS` computed by the model. No independent temperature-path integral is used. | **NOTED** — flagged as WEAK in anchor table (Section 2). No standalone fix; this is a structural limitation of the closed-form Carnot model. |
| I-2 | `drift-diffusion.test.js` | BGK boundary correction (0.5826·σ·√dt = −ζ(½)/√(2π)·σ·√dt) not tested. Isolating the correction requires very large N and reference values not independently verifiable here. | **NOTED** — BGK constant verified in `tools/anchors-phase8.mjs`; test dropped with comment in test file; entry added to SOURCES.md (Broadie, Glasserman & Kou 1997, cited not fetched). |

---

## Summary

| Severity | Count | Fixed 8b | Fixed 8c | Fixed 8c close-out | Deferred / Noted |
|---|---|---|---|---|---|
| HIGH | 1 | — | 1 | — | — |
| MED | 14 | 3 | 11 | — | — |
| LOW | 5 | 1 | 2 | — | 2 |
| INF | 5 | 2 | — | 1 | 2 |
| **Total** | **25** | **6** | **14** | **1** | **4** |
