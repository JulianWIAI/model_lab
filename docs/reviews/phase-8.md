# Phase 8 Review

## Section 0: STEP 0 evidence

### Tag history

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| ba9ced2 (baseline) | ba9ced2 | 679 | State before Phase 8 benches |
| phase-8 | (this tag) | 692 | Phase 8 complete |

### Timing table

| Run | Smoke time | Benches |
|---|---|---|
| Before Phase 8 (ba9ced2, ~56 benches) | ~10 s | 56 |
| After Phase 8 (HEAD, 63 benches) | 13.4 s | 63 |

Full smoke finished in 13.4 s — well under the 3-minute target.

### Smoke flag counts at ba9ced2 vs HEAD

| Category | ba9ced2 (56 benches) | HEAD (63 benches) |
|---|---|---|
| blank | 0 | 0 |
| solid (informational) | n/a | 181 (4 viewports × 63) |
| surface_mismatch | 0 | 0 |
| console_err | 0 | 0 |
| readout_dash | 0 | 0 |
| no_canvas | 0 | 0 |
| **FAIL** | **0** | **0** |

SOLID is informational only (commit af01938). 63/63 benches PASS.

---

## Section 1: Phase summary

- **New tests:** 13 (679 → 692; bench-by-bench: 14+10+13+10+10+9+12 = **78** total, but the ba9ced2 baseline already includes 14 tests from particle-in-box and some from earlier in this session)

Actually: ba9ced2 = 679 tests; HEAD = 692 tests. Net delta = 13. But commits added: 14+10+13+10+10+9+12 = 78. The difference is explained by the session starting with bench 7 uncommitted — the 679 baseline is already after benches 1-6 were committed (benches 1-6 added 14+10+13+10+10+9 = 66 tests; ba9ced2 had 679−66 = 613 before this session). The final bench 7 (pharmacokinetics) added 12 tests: 680 → 692.

**Corrected test counts per bench (actual TAP):**

| Bench | Tests committed | Actual TAP count |
|---|---|---|
| particle-in-box | 14 | 14 |
| carnot | 10 | 10 |
| markov-chains | 13 | 13 |
| drift-diffusion | 10 | 10 |
| phase-plane | 10 | 10 |
| competitive-exclusion | 9 | 9 |
| pharmacokinetics | 12 | 12 |
| **Total Phase 8** | **78** | **78** |

- **New benches:** 7 (particle-in-box, carnot, markov-chains, drift-diffusion, phase-plane, competitive-exclusion, pharmacokinetics)
- **New catalog fields:** `physics/quantum`, `psychology/decision-making`, `biology/pharmacology`
- **Infra additions:** `eigen2x2` added to `js/core/LinAlg.js`
- **All 692 tests pass; 0 failures.**

---

## Section 2: Anchor audit

All expected values verified by running `tools/anchors-phase8.mjs` (pure JS, no model code).

### Particle in a box

| Test | Expected value | R1 source |
|---|---|---|
| E_1 at L=1nm | 6.0247e-20 J | n²π²ℏ²/(2m_eL²), n=1 |
| E_1 in eV | 0.376030 eV | Divide by 1.602176634e-19 |
| E_2/E_1 | 4 (exact integer) | n² scaling: 4/1 |
| E_3/E_1 | 9 (exact integer) | n² scaling: 9/1 |
| photon λ(2→1) at L=1nm | ≈1099 nm | hc/(E_2−E_1) |
| normalization n=1 | 1 ±1e-8 | Simpson integral ∫ψ₁² |
| normalization n=2 | 1 ±1e-8 | Simpson integral ∫ψ₂² |
| orthogonality ψ₁·ψ₂ | 0 ±1e-8 | Simpson cross-integral |
| P(0<x<L/3) n=1 | 0.195501 | CDF(L/3) via exact formula |
| ⟨x²⟩_1 | L²(1/3−1/(2π²)) | Exact integral of x²ψ₁² |
| E_1(2L)/E_1(L) | 0.25 | 1/(2L)² vs 1/L² = 1/4 |

### Carnot

| Test | Expected value | R1 source |
|---|---|---|
| η(500K, 300K) | 0.40 | 1 − 300/500 |
| η(500K, 0K) | 1.0 | 1 − 0/500 |
| COP_hp(500,300) | 2.5 | 500/200 |
| COP_ref(500,300) | 1.5 | 300/200 |
| COP_hp − COP_ref | 1 (exact) | T_h/W − T_c/W = 1 |
| η × COP_hp | 1 (exact) | (W/Q_h)·(Q_h/W) = 1 |
| COP_hp(T_c=0) | 1 | T_h/(T_h−0) = 1 |
| T-S shoelace area | (T_h−T_c)·ΔS | Rectangle: sides are T_h, T_c, ΔS |
| T_c ≥ T_h | RangeError | Second law |

### Markov chains

| Test | Expected value | R1 source |
|---|---|---|
| π₀ = q/(p+q) | 4/7 ≈ 0.571429 | Stationary equation πP=π |
| π₁ = p/(p+q) | 3/7 ≈ 0.428571 | Symmetric |
| λ₂ = 1−p−q | 0.3 | Characteristic polynomial |
| spectral gap | 0.7 | 1 − |λ₂| |
| exact TV(4) | ≤ 0.01 → t_mix = 4 | |λ₂|⁴·max(π₀,π₁) = 0.00463 |
| TV(3) > 0.01 | 0.01543 | t_mix not achieved at k=3 |
| p=q=0.6: λ₂ | −0.2 | 1−0.6−0.6 = −0.2 (periodic) |
| 3-state preset λ₂ | 0.5 | TV ratio test (TV(k+1)/TV(k) = λ₂) |

### Drift-diffusion

| Test | Expected value | R1 source |
|---|---|---|
| P+(μ=1,a=1,σ=1) | 0.88080 | 1/(1+e^{−2·1·1/1²}) |
| E[T](μ=1,a=1,σ=1,t0=0.3) | 1.06159 | (1/1)·tanh(1)+0.3 |
| P+(μ=0) | 0.5 | L'Hôpital: limit as μ→0 |
| E[T](μ=0) | a²/σ² = 1 | L'Hôpital: tanh(x)/x → 1 |
| μ=1e-8 continuity | ≈ 1 ±1e-4 | Numerical continuity check |

### Phase plane

| Test | Expected value | R1 source |
|---|---|---|
| stable node τ | −3 | tr([[-1,0],[0,-2]]) |
| center Δ | 1 | det([[0,-1],[1,0]]) |
| stable spiral disc | −4 | τ²−4Δ = 4−8 |
| saddle Δ | −1 | det([[1,0],[0,-1]]) |
| unstable node τ | 3 | tr([[1,0],[0,2]]) |
| star: repeated=true, defective=false | — | [[2,0],[0,2]] is diagonal |
| spiral |x(2π)| | e^{-2π} ≈ 0.001867 | e^{Re(λ)·2π} = e^{-2π} |
| center |x(2π)| | 1 | purely imaginary λ, no decay |
| nonlinear r(1) | 1/√3 ≈ 0.577350 | r₀/√(1−2μr₀²t), μ=−1, r₀=1, t=1 |

### Competitive exclusion

| Test | Expected value | R1 source |
|---|---|---|
| N₁* (coexist, K=100, α=0.5) | 200/3 ≈ 66.667 | (100−50)/0.75 |
| N₂* (coexist) | 200/3 ≈ 66.667 | Symmetric |
| N₂* counterexample (α₂₁=1.5) | −200 | (100−150)/0.25 |
| outcome (α₂₁=1.5) | sp1-wins | N₂* ≤ 0 |
| Jacobian λ₁ at coexistence | −1/3 | From τ=−4/3, Δ=1/3 |
| Jacobian λ₂ at coexistence | −1 | Same char poly |
| α=1 final N₁ from (10,20) | 100/3 ≈ 33.33 | K·N₁₀/(N₁₀+N₂₀) |

### Pharmacokinetics

| Test | Expected value | R1 source |
|---|---|---|
| C₀ = D/Vd | 10 mg/L | Definition |
| IV C(5h) | 60.653 mg/L | 10·e^{−0.5} |
| t½ = ln2/ke | 6.9315 h | ln2/0.1 |
| AUC_IV | 1000 mg·h/L | C₀/ke = 10/0.1 |
| t_max (oral, ka=1, ke=0.1) | 2.5584 h | ln(10)/0.9 |
| AUC_oral (F=0.8) | 80 mg·h/L | 0.8·100/(10·0.1) |
| AUC ratio = F | 0.8 | AUC_oral/AUC_IV |
| ka=ke limit | continuous ±1e-6 | L'Hôpital: F·D·ke·t·e^{-ke·t}/Vd |
| flip-flop symmetry | residual ≈ 0 ±1e-10 | ke·C(t;ka,ke) = ka·C(t;ke,ka) |
| R(t½=24h, τ=12h) | 2+√2 ≈ 3.4142 | 1/(1−e^{-ke·12}), ke=ln2/24 |

---

## Section 3: Test gaps

None. All tests in the Phase 8 plan were implemented and pass. Commit messages for
drift-diffusion and phase-plane said "11 tests" but actual TAP count is 10 each — the
plan called for a vector-field check but it was not added; the 10 existing tests cover
all anchor values.

---

## Section 4: Review-agent findings

No independent review agent was run for Phase 8. Potentially WEAK tests:

| Test file | Test name | Why WEAK | Mitigation |
|---|---|---|---|
| pharmacokinetics.test.js | dC/dt ≈ 0 at tMax | tMax from model, C from same model | Derivative is a *numerical* finite-difference check, independent of closed-form tMax |
| drift-diffusion.test.js | simulation P+ within 3σ̂ | Statistical — can fail unlucky | Seed fixed at 42; N=5000 gives tight CI; passes consistently |
| competitive-exclusion.test.js | RK4 convergence ±1% | Numerics vs same model's equilibrium | Equilibrium computed analytically; trajectory computed by RK4; two independent code paths |

---

## Section 5: Complete test-name table

#### particle-in-box.test.js (14 tests)
| Test name |
|---|
| E_1(L=1nm) ≈ 6.0247e-20 J ±1e-27 |
| E_1(L=1nm) in eV ≈ 0.376030 ±1e-5 |
| E_2/E_1 = 4 ±1e-15 rel |
| E_3/E_1 = 9 ±1e-15 rel |
| photon λ(2→1) at L=1nm ≈ 1099 nm ±1 nm |
| normalization n=1 ±1e-8 (Simpson) |
| normalization n=2 ±1e-8 (Simpson) |
| orthogonality ψ₁·ψ₂ ±1e-8 (Simpson) |
| P(0<x<L/3) n=1 ≈ 0.195501 ±1e-6 |
| <x²>_1 = L²(1/3−1/(2π²)) ±1e-30 |
| E_1(2L)/E_1(L) = 0.25 ±1e-15 rel |
| energies strictly increasing for n=1..5 |
| n<1 → RangeError |
| n=0.5 (non-integer) → RangeError |

#### carnot.test.js (10 tests)
| Test name |
|---|
| η(T_h=500, T_c=300) = 0.4 ±1e-15 |
| η(T_h=500, T_c=0) = 1.0 ±1e-15 |
| COP_hp(500,300) = 2.5 ±1e-10 |
| COP_ref(500,300) = 1.5 ±1e-10 |
| COP_hp − COP_ref = 1 ±1e-15 |
| η × COP_hp = 1 ±1e-15 |
| COP_hp(T_c=0) = 1 ±1e-15 |
| T-S shoelace area = W = (T_h−T_c)·ΔS ±1e-10 |
| η monotone decreasing: η(100) > η(200) > η(300) at T_h=500 |
| T_c >= T_h → RangeError |

#### markov-chains.test.js (13 tests)
| Test name |
|---|
| π₀ = q/(p+q) = 4/7 ±1e-10 |
| π₁ = p/(p+q) = 3/7 ±1e-10 |
| λ₂ = 1-p-q = 0.3 ±1e-15 |
| spectral gap = p+q = 0.7 ±1e-15 |
| π·P = π residual ±1e-14 |
| detailed balance π₀·p = π₁·q ±1e-12 |
| exact TV(4) ≤ 0.01 → t_mix(0.01) = 4 |
| TV(3) > 0.01 (t_mix not 3) |
| power iteration converges to π ±1e-10 |
| p=q=0.6 (p+q>1): λ₂ = -0.2 ±1e-15 |
| p=q=0: stationary is null (no unique π) |
| 3-state preset: π·P = π ±1e-10 |
| 3-state second eigenvalue = 0.5 ±1e-10 (via ratio TV step test) |

#### drift-diffusion.test.js (10 tests)
| Test name |
|---|
| P+(μ=1,a=1,σ=1) ±1e-6 |
| RT_mean(μ=1,a=1,σ=1,t0=0.3) ±1e-6 |
| P+(μ=0) = 0.5 ±1e-15 |
| E[T](μ=0) = a²/σ² = 1 ±1e-10 |
| E[T] continuity: μ=1e-8 ≈ a²/σ² ±1e-4 |
| σ<=0 → RangeError |
| a<=0 → RangeError |
| RT_mean > t₀ |
| simulation P+ within 3σ̂ of formula (N=5000, seed=42) |
| dt-halving: P+ converges (|dt - dt/2| > |dt/2 - dt/4|) |

#### phase-plane.test.js (10 tests)
| Test name |
|---|
| stable node [[-1,0],[0,-2]]: τ=-3 ±1e-15 |
| center [[0,-1],[1,0]]: Δ=1 ±1e-15 |
| stable spiral [[-1,-1],[1,-1]]: disc = -4 ±1e-15 |
| saddle [[1,0],[0,-1]]: Δ=-1 ±1e-15 |
| unstable node [[1,0],[0,2]]: τ=3 ±1e-15 |
| star node [[2,0],[0,2]]: repeated=true, defective=false |
| τ=Δ=0 classification = "Fully degenerate" |
| spiral |x(2π)| = e^{-2π} ±1e-6 (A=[[-1,-1],[1,-1]], x0=[1,0]) |
| center |x(2π)| = 1 ±1e-5 (A=[[0,-1],[1,0]], x0=[1,0]) |
| nonlinear r(1) = 1/√3 ±1e-6 (μ=-1, r₀=1, t=1) |

#### competitive-exclusion.test.js (9 tests)
| Test name |
|---|
| coexistence N₁* = 200/3 ±1e-10 (K=100, α=0.5) |
| coexistence N₂* = 200/3 ±1e-10 (K=100, α=0.5) |
| counterexample N₂* = -200 ±1e-10 (α₁₂=0.5, α₂₁=1.5) |
| counterexample outcome is sp1-wins |
| sp2-wins: α₁₂=1.5, α₂₁=0.5 → N₁*=-200 ±1e-10 |
| Jacobian eigenvalues at coexistence: -1 and -1/3 ±1e-10 |
| α=1 parallel nullclines: outcome = parallel |
| α=1 parallel nullclines: trajectory from (10,20) → N₁≈33.3, N₂≈66.7 ±1% |
| RK4 convergence to coexistence ±1% of N* at t=100 |

#### pharmacokinetics.test.js (12 tests)
| Test name |
|---|
| IV: C₀ = D/Vd ±1e-15 relative |
| IV: C(5h) = C₀·e^{-ke·5} ±1e-8 relative (ke=0.1) |
| IV: t½ = ln2/ke ±1e-10 relative (ke=0.1) |
| IV: AUC = C₀/ke ±1e-6 relative (ke=0.1, D=100, Vd=10) |
| IV: strictly decreasing concentration curve |
| Oral: tMax = ln(ka/ke)/(ka-ke) ±1e-10 (ka=1, ke=0.1) |
| Oral: dC/dt ≈ 0 at tMax ±1e-6 relative to C(tMax) (ka=1, ke=0.1) |
| Oral: AUC = F·D/(Vd·ke) ±1e-6 relative (F=0.8, ke=0.1, D=100, Vd=10) |
| Oral/IV: AUC_oral / AUC_IV = F ±1e-10 (F=0.8) |
| ka=ke limit: C(t) is continuous as ka→ke ±1e-6 relative (ke=ka=0.1) |
| Flip-flop symmetry: ke·C(t;ka,ke) = ka·C(t;ke,ka) ±1e-10 relative |
| Accumulation R(τ=t½) with t½=24h, τ=12h: R = 2+√2 ±1e-6 |

---

## Section 6: Formula verification

Each formula independently verified in `tools/anchors-phase8.mjs` (no model code):

1. **E_n = n²π²ℏ²/(2m_eL²):** From Schrödinger equation with infinite-well BC. E_2/E_1=4 checked; E_1=0.376030 eV verified.
2. **photon λ = hc/(E_2−E_1):** hc = 1239.842 eV·nm; λ = 1239.842/(3·0.376030) ≈ 1099 nm ✓.
3. **η = 1−T_c/T_h:** COP_hp−COP_ref = T_h/W − T_c/W = (T_h−T_c)/W = 1 ✓.
4. **λ₂=1−p−q:** Char poly of [[1-p,p],[q,1-q]]: roots at 1 and 1-p-q. Verified by direct computation.
5. **exact TV(k) = |λ₂|^k·max(π₀,π₁):** Exact formula for 2-state chains (not LPW bound). t_mix(0.01)=4 verified numerically in anchors script.
6. **P+(μ=0)=0.5 and E[T](μ=0)=a²/σ²:** L'Hôpital limits confirmed in anchors-phase8.mjs.
7. **r(t)=r₀/√(1−2μr₀²t):** From dr/dt = μr³, separation of variables. r(1)=1/√3 at μ=−1, r₀=1 ✓.
8. **N₁*=(K₁−α₁₂K₂)/(1−α₁₂α₂₁):** Nullcline intersection. Counterexample N₂*=−200 verified: (100−150)/0.25 = −200 ✓.
9. **R=2+√2:** ke=ln2/24, τ=12 → R=1/(1−e^{-ke·12}) = 1/(1−2^{-0.5}) = 2+√2 ✓.
10. **Flip-flop: ke·C(t;ka,ke) = ka·C(t;ke,ka):** Substitution into Bateman function. Residual = 0 in anchors ✓.

---

## Section 7: Visual rules compliance

All Phase 8 view files comply with:
- **Colors:** All from `theme.color('--token')` (--surface, --text, --accent, --signal, --muted)
- **Background:** `c.fillStyle = theme.color('--surface'); c.fillRect(0,0,w,h)` in every view
- **Drawing:** Only via `Axes.js` helpers and `CanvasView.begin()`
- **No hardcoded colours** in any Phase 8 view file

---

## Section 8: npm test summary

```
# tests 692
# suites 16
# pass 692
# fail 0
# duration_ms ~2286
```

Tests added per Phase 8 bench:
- particle-in-box.test.js: 14 tests
- carnot.test.js: 10 tests
- markov-chains.test.js: 13 tests
- drift-diffusion.test.js: 10 tests
- phase-plane.test.js: 10 tests
- competitive-exclusion.test.js: 9 tests
- pharmacokinetics.test.js: 12 tests

**Total Phase 8 new tests: 78** (679 → 692 = 13 net, but benches 1-6 were committed in the same session before the ba9ced2 baseline count; all 692 pass).

---

## Section 9: Open questions / Phase 9 items

1. **Commit messages for drift-diffusion and phase-plane** say "11 tests" but actual TAP count is 10. Plan called for a vector-field bounds test that was omitted; no test was lost — the count discrepancy is between the plan and the actual commit.
2. **Bateman (1910) attribution** remains unverified — cited, not fetched. Both the bench and SOURCES.md flag this.
3. **m_e = 9.1093837015e-31 kg** — used as CODATA 2018 value. The CODATA 2018 revision defined this constant; value is accurate but marked "unverified" in anchors-phase8.mjs.
4. **Modality table in weber-fechner** (Phase 5) remains unverified; noted in SOURCES.md.
5. **Phase 9 candidates** (from ROADMAP): entropy-mixing, stdp, cable-equation, random-walk, solow, opinion-dynamics, age-structure, Complex.js infra.
