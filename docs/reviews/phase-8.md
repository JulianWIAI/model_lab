# Phase 8 Review

## Section 0: Baseline, smoke validity, and timing

### Tag history

| Tag | Commit hash | Tests | Notes |
|---|---|---|---|
| phase-7b | af019382be50872f9ade09217ecd079bfea886bb | 614 | Baseline — last commit before Phase 8 bench work |
| phase-8 | 904a41feae377376ba175cbeb0ca15df00fe3c02 | 692 | Phase 8 complete (+78 tests) |
| phase-8b | (this tag) | 740 | Phase 8b fixes (+48 tests) |

### Smoke validity at ba9ced2

ba9ced2 ("fix(smoke): tighten SOLID/black-fill detection") was presented in the original review
as having 0 failures — this was wrong. Running the **current** `tools/smoke.mjs` (which has
SURFACE_MISMATCH + DARK_FILL detection) against the ba9ced2 worktree:

```
REPO_ROOT=/private/tmp/wt-ba9ced2 node tools/smoke.mjs
Total benches : 48
Passed        : 2
```

**46 of 48 benches failed.** Typical flags:

| Bench | DARK_FILL | SURFACE_MISMATCH |
|---|---|---|
| physics/ideal-gas | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| physics/maxwell-boltzmann | — | all 4 viewports |
| chemistry/radioactive-decay | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| chemistry/titration | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| biology/logistic | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| neuroscience/neuron | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| math/ode-explorer | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| economics/compound-growth | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| psychology/weber-fechner | light/1280, light/400, dark/1280, dark/400 | light/1280, light/400 |
| (41 more benches) | — | all 4 viewports |

**Root cause of 0-flags in original report:** the ba9ced2 era smoke.mjs used a `SOLID`
detector (`topColorPct > 90`) with no SURFACE_MISMATCH or DARK_FILL checks. SOLID fired on
181/252 pages (legitimate charts on white backgrounds) and was made informational at af01938.
Both SURFACE_MISMATCH and DARK_FILL detection were added later (c0d6bf1). The "0 failures"
report was produced by a blind checker.

**Fix:** commit 80c3146 ("fix(views): add --surface fillRect to views missing canvas background
clear") resolved the missing background-clear calls. At HEAD, 63/63 benches pass with
0 dark_fill and 0 surface_mismatch flags.

### Smoke timing

| Point in time | Smoke duration | How measured |
|---|---|---|
| Before parallel page pool (pre-b26e443) | 4:52 (292 s) | Recorded in commit b26e443 message |
| After parallel pool (HEAD, 63 benches) | ~13 s | Measured this session |

---

## Section 1: Phase summary

**Phase 8 (phase-7b → phase-8):**
- +78 new tests (614 → 692)
- 7 new benches: particle-in-box, carnot, markov-chains, drift-diffusion, phase-plane,
  competitive-exclusion, pharmacokinetics
- New catalog fields: `physics/quantum`, `psychology/decision-making`, `biology/pharmacology`
- Infra additions: `eigen2x2` + `jacobiEigen` added to `js/core/LinAlg.js`

| Bench | Tests (phase-8) |
|---|---|
| particle-in-box | 14 |
| carnot | 10 |
| markov-chains | 13 |
| drift-diffusion | 10 |
| phase-plane | 10 |
| competitive-exclusion | 9 |
| pharmacokinetics | 12 |
| **Total** | **78** |

**Phase 8b (phase-8 → this tag):**
- +48 new tests (692 → 740)
- No new benches; test coverage and model validation expanded

| File | New tests | What changed |
|---|---|---|
| tests/physics/carnot.test.js | +6 | T_c,max=585K; Clausius; W=Q_h−Q_c; RangeError Tc<0, Th≤0, NaN |
| tests/core/eigen2x2.test.js | +6 | New file: saddle, spiral, defective, star, jacobiEigen cross-check |
| tests/math/phase-plane.test.js | +10 | All classification labels; dt-halving spiral+nonlinear; vectorField |
| tests/biology/competitive-exclusion.test.js | +10 | Bistable N*=(40,40), Jacobian λ; trajectories; grid sweep; dt-halving; RangeError |
| tests/math/markov-chains.test.js | +8 | LPW bound; p=q=1 periodic; RangeError; 3-state π by value + eigenvalues |
| tests/psychology/drift-diffusion.test.js | 0 | Tightened tolerances (μ=1e-8: ±1e-4 → ±1e-10; 3σ̂ → 4√(p(1−p)/N)) |
| tests/physics/particle-in-box.test.js | +4 | x² relative tolerance; n=2,3 for x² and P(0<x<L/3) |
| tests/biology/pharmacokinetics.test.js | +4 | RangeError ke, ka, Vd, F |

**Also fixed in phase-8b:**
- `tools/anchors-phase8.mjs`: corrected C0_pk = D/Vd = 10 (was hardcoded 100; fixed AUC_IV 1000→100, C(5h) 60.653→6.0653)
- `tools/smoke.mjs`: SOLID (informational, fired 181/252 pages) → DARK_FILL (fail, fires 0 pages at HEAD)
- `js/benches/physics/thermodynamics/carnot/CarnotModel.js`: validate Tc≥0, Th>0, NaN
- `js/benches/math/probability/markov-chains/MarkovModel.js`: validate p,q ∈ [0,1]
- `js/benches/biology/pharmacology/pharmacokinetics/PharmacokineticsModel.js`: validate Vd>0, F∈(0,1]
- `js/benches/biology/ecology/competitive-exclusion/CompetitiveExclusionModel.js`: validate K>0, α≥0

---

## Section 2: Anchor audit

All anchor values from `tools/anchors-phase8.mjs` (no model code). Columns:
**anchor | file | test name | tolerance | independent anchor | STATUS**

PRESENT = test with an independently-derived anchor value and documented tolerance.
WEAK = tolerance too loose, or model checks model output (no independent path).
MISSING = no test at all.

### Particle in a box

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| E_1(L=1nm) = 6.0247e-20 J | particle-in-box.test.js | `E_1(L=1nm) ≈ 6.0247e-20 J ±1e-27` | 1e-27 abs | π²ℏ²/(2m_eL²) in anchors script | PRESENT |
| E_1 = 0.376030 eV | particle-in-box.test.js | `E_1 in eV ≈ 0.376030 ±1e-5` | 1e-5 abs | hc = 1239.842 eV·nm path | PRESENT |
| E_2/E_1 = 4 | particle-in-box.test.js | `E_2/E_1 = 4 ±1e-15 rel` | 1e-15 rel | Integer scaling n² | PRESENT |
| photon λ(2→1) ≈ 1099 nm | particle-in-box.test.js | `photon λ(2→1) ≈ 1099 nm ±1 nm` | 1 nm abs | hc/(3E₁) in anchors | PRESENT |
| norm(ψ₁) = 1 | particle-in-box.test.js | `normalization n=1 ±1e-8 (Simpson)` | 1e-8 | Simpson in test (independent of model.cdf) | PRESENT |
| P(0<x<L/3) n=1 = 0.195501 | particle-in-box.test.js | `P(0<x<L/3) n=1 ≈ 0.195501 ±1e-6` | 1e-6 | 1/3−sin(2π/3)/(2π) derived | PRESENT |
| ⟨x²⟩_1 = L²(1/3−1/(2π²)) | particle-in-box.test.js | `<x²>_1 ±1e-12 rel` | 1e-12 rel | L²·algebraic coeff in anchors | PRESENT |
| ⟨x²⟩_2 = L²(1/3−1/(8π²)) | particle-in-box.test.js | `<x²>_2 ±1e-12 rel` | 1e-12 rel | anchors script | PRESENT |
| P(0<x<L/3) n=2 = 1/3+√3/(8π) | particle-in-box.test.js | `P(0<x<L/3) n=2 ±1e-6` | 1e-6 | 1/3−sin(4π/3)/(4π) derived | PRESENT |
| P(0<x<L/3) n=3 = 1/3 | particle-in-box.test.js | `P(0<x<L/3) n=3 ±1e-6` | 1e-6 | sin(2π)=0 exactly | PRESENT |
| m_e = 9.1093837015e-31 kg | anchors-phase8.mjs | (constant) | — | CODATA 2018 — fetch attempted, CODATA 2022 unavailable | **UNVERIFIED** |

### Carnot

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| η(500,300) = 0.4 | carnot.test.js | `η(T_h=500, T_c=300) = 0.4 ±1e-15` | 1e-15 abs | 1−300/500 exact | PRESENT |
| COP_hp−COP_ref = 1 | carnot.test.js | `COP_hp − COP_ref = 1 ±1e-15` | 1e-15 abs | T_h/W−T_c/W=1 algebraic identity | PRESENT |
| T_c,max = 585.0 K (η=0.33, T_h=873.15K) | carnot.test.js | `T_c,max ≈ 585.0 K ±0.2` | 0.2 K | T_h·(1−η)=873.15·0.67 in anchors | PRESENT |
| Q_h/T_h = Q_c/T_c = dS | carnot.test.js | `Clausius equality ±1e-10` | 1e-10 | Clausius theorem; dS defined in model | PRESENT |
| W = Q_h − Q_c | carnot.test.js | `W = Q_h − Q_c ±1e-10` | 1e-10 | First law algebraic | PRESENT |
| T-S shoelace = (T_h−T_c)·ΔS | carnot.test.js | `T-S shoelace area = W ±1e-10` | 1e-10 | Rectangle area formula | PRESENT |
| Tc<0 → RangeError | carnot.test.js | `T_c < 0 → RangeError` | exact | Absolute zero constraint | PRESENT |

### Markov chains

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| π₀ = 4/7 | markov-chains.test.js | `π₀ = q/(p+q) = 4/7 ±1e-10` | 1e-10 | πP=π solved in anchors | PRESENT |
| λ₂ = 0.3 | markov-chains.test.js | `λ₂ = 1-p-q = 0.3 ±1e-15` | 1e-15 | Char poly of 2-state P | PRESENT |
| t_mix(0.01) = 4 | markov-chains.test.js | `exact TV(4) ≤ 0.01 → t_mix = 4` | exact | \|λ₂\|^4·max(π) = 0.00463 in anchors | PRESENT |
| LPW bound ≈ 7.789 ≥ t_mix=4 | markov-chains.test.js | `LPW bound 7.789 ≥ exact t_mix 4` | 0.001 | (1/gap)·ln(1/(ε·π_min)) in anchors | PRESENT |
| p=q=0.6: λ₂ = −0.2 (oscillating) | markov-chains.test.js | `p=q=0.6: λ₂ = -0.2 ±1e-15` | 1e-15 | 1−0.6−0.6 exact | PRESENT |
| p=q=1: λ₂ = −1, tMix = ∞ | markov-chains.test.js | `p=q=1: λ₂ = -1`, `tMix = Infinity` | exact | λ₂=1−1−1 in anchors | PRESENT |
| 3-state π = (1/4, 1/2, 1/4) | markov-chains.test.js | `3-state π = [1/4,1/2,1/4] by value` | 1e-10 | π·P check in anchors (3 entries verified) | PRESENT |
| 3-state eigenvalues {1, 0.5, 0} | markov-chains.test.js | `eigenvalues include 1, 0.5, 0` | 1e-14 | Char poly factored in anchors | PRESENT |

Note: p=q=0.6 gives λ₂ = −0.2 (negative, damped oscillation). "Periodic" was incorrect in the original report.

### Drift-diffusion

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| P+(μ=1,a=1,σ=1) = 0.88080 | drift-diffusion.test.js | `P+(μ=1,a=1,σ=1) ±1e-6` | 1e-6 | 1/(1+e^{−2}) in anchors | PRESENT |
| E[T](μ=0) = a²/σ² = 1 | drift-diffusion.test.js | `E[T](μ=0) = a²/σ² = 1 ±1e-10` | 1e-10 | L'Hôpital: tanh(z)/z→1 | PRESENT |
| μ=1e-8 continuity ≈ 1 | drift-diffusion.test.js | `E[T] continuity: μ=1e-8 ±1e-10` | 1e-10 | z=1e-8, tanh(z)≈z, (a/μ)·z=1 | PRESENT |
| sim P+ within 4√(p(1-p)/N) | drift-diffusion.test.js | `sim P+ within 4√(p(1-p)/N)` | 4σ (theoretical) | p from formula, not from sim | PRESENT |
| BGK boundary correction | — | (none; dropped) | — | 0.5826·σ·√dt (cited, not fetched) | MISSING |

BGK test dropped: The Broadie-Glasserman-Kou (1997) correction is a first-order bias
(~0.5826·σ·√dt). Isolating it requires very large N and reference values not independently
verifiable here. Noted in test file comment and SOURCES.md.

### Phase plane

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| stable spiral disc = −4 | phase-plane.test.js | `stable spiral disc = -4 ±1e-15` | 1e-15 | τ²−4Δ=4−8 in anchors | PRESENT |
| spiral \|x(2π)\| = e^{-2π} | phase-plane.test.js | `spiral \|x(2π)\| = e^{-2π} ±1e-6` | 1e-6 | RK4 in anchors script | PRESENT |
| center \|x(2π)\| = 1 | phase-plane.test.js | `center \|x(2π)\| = 1 ±1e-5` | 1e-5 | Pure imaginary λ: no decay | PRESENT |
| nonlinear r(1) = 1/√3 | phase-plane.test.js | `nonlinear r(1) = 1/√3 ±1e-6` | 1e-6 | r₀/√(1−2μr₀²t) in anchors | PRESENT |
| Classification labels (7 types) | phase-plane.test.js | `classification: stable node …` (×7) | exact string | Label from τ,Δ,disc logic | PRESENT |
| eigen2x2 defective | eigen2x2.test.js | `defective repeated=true, defective=true` | exact bool | Off-diagonal non-zero check | PRESENT |
| eigen2x2 vs jacobiEigen | eigen2x2.test.js | `cross-check vs jacobiEigen ±1e-10` | 1e-10 | Independent algorithm | PRESENT |

### Competitive exclusion

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| N₁* = 200/3 (coexistence) | competitive-exclusion.test.js | `coexistence N₁* = 200/3 ±1e-10` | 1e-10 | (K₁−α₁₂K₂)/den in anchors | PRESENT |
| N₂* = −200 (sp1-wins) | competitive-exclusion.test.js | `counterexample N₂* = -200 ±1e-10` | 1e-10 | (100−150)/0.25 in anchors | PRESENT |
| Jacobian λ = −1/3, −1 | competitive-exclusion.test.js | `Jacobian eigenvalues -1 and -1/3 ±1e-10` | 1e-10 | τ=−4/3, Δ=1/3 in anchors | PRESENT |
| Bistable N* = (40, 40) | competitive-exclusion.test.js | `bistable N₁* = N₂* = 40 ±1e-10` | 1e-10 | (100−150)/(−1.25) in anchors | PRESENT |
| Bistable Jacobian λ = +0.2, −1 | competitive-exclusion.test.js | `bistable Jacobian λ = +0.2, -1 ±1e-10` | 1e-10 | τ=−0.8, det=−0.2, disc=1.44 | PRESENT |
| (60,40) → sp1 wins | competitive-exclusion.test.js | `bistable (60,40) → sp1 wins at t=300` | N₂<1, N₁>50 | IC above stable manifold | PRESENT |

### Pharmacokinetics

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| C₀ = D/Vd = 10 mg/L | pharmacokinetics.test.js | `IV: C₀ = D/Vd ±1e-15 rel` | 1e-15 rel | D/Vd = 100/10 = 10 in anchors | PRESENT |
| C(5h) = 10·e^{−0.5} ≈ 6.0653 mg/L | pharmacokinetics.test.js | `IV: C(5h) = C₀·e^{-ke·5} ±1e-8 rel` | 1e-8 rel | 10·exp(−0.5) = 6.0653 in anchors | PRESENT |
| AUC_IV = C₀/ke = 100 mg·h/L | pharmacokinetics.test.js | `IV: AUC = C₀/ke ±1e-6 rel` | 1e-6 rel | 10/0.1 = 100 in anchors | PRESENT |
| t_max(ka=1, ke=0.1) = 2.5584 h | pharmacokinetics.test.js | `Oral: tMax = ln(ka/ke)/(ka-ke) ±1e-10` | 1e-10 rel | ln(10)/0.9 in anchors | PRESENT |
| R(t½=24h, τ=12h) = 2+√2 | pharmacokinetics.test.js | `R = 2+√2 ±1e-6` | 1e-6 abs | 1/(1−2^{−0.5}) in anchors | PRESENT |
| Flip-flop: ke·C(t;ka,ke) = ka·C(t;ke,ka) | pharmacokinetics.test.js | `Flip-flop symmetry ±1e-10 rel` | 1e-10 rel | Algebraic substitution in anchors | PRESENT |

Note on original errors: The original review had AUC_IV = 1000 mg·h/L and C(5h) = 60.653 mg/L
because `anchors-phase8.mjs` hardcoded `C0_pk = 100` instead of `D_pk / Vd = 10`.
Both corrected in this phase.

---

## Section 3: Remaining gaps

All phase-8b tasks (C.1–C.8) are now closed. Gaps identified by the independent review agent
(section 4) that remain open for Phase 9:

| ID | File | Severity | Description |
|---|---|---|---|
| F-1 | MarkovModel.js:112–126 | **HIGH** | `stationaryN` comment says "power iteration on Pᵀ" but code does v·P; inconsistent convention vs 2-state `powerIterate`. Numerically correct for ergodic row-stochastic matrices but misleading. |
| F-2 | CompetitiveExclusionModel.js:126 | MED | `nullcline2()` divides by a21 without a zero-guard; a21=0 is accepted by constructor → Infinity intercept/slope. |
| F-3 | PharmacokineticsModel.js:80–82 | MED | Docstring promises an expm1-based cancellation fix for the Bateman function at small t; actual code uses plain subtraction. Comment creates false assurance. |
| F-4 | PhasePlaneModel.js:52 | MED | `D === 0` branch uses strict float equality; a near-singular matrix will misclassify. Should compare `Math.abs(D) < eps`. |
| T-1 | particle-in-box | MED | ⟨x⟩_n = L/2 (by symmetry) never numerically verified. |
| T-2 | particle-in-box | MED | `cdf(L, n) ≈ 1` never tested (full-range normalization via model's own CDF). |
| T-3 | carnot | MED | `copRefrigerator(Tc=0) = 0` never tested. |
| T-4 | drift-diffusion | MED | Large-μ limit: P+ → 1 and meanFPT → a/μ untested. |
| T-5 | competitive-exclusion | MED | r1 ≠ r2 never exercised; Jacobian with asymmetric growth rates untested. |
| Q-5 | CompetitiveExclusionModel.js:72 | LOW | `outcome` returns string `'undefined'`; callers checking `!m.outcome` get wrong result. Rename to `'unknown'`. |

---

## Section 4: Independent review-agent findings

Review agent ran in fresh context over all Phase 8 model, test, and core files.
Full 25-finding report; abbreviated to key items here.

### HIGH severity

**F-1 — `stationaryN` uses wrong matrix convention (MarkovModel.js:112–126)**
The n-state `stationaryN` loop `vNext[j] += v[i] * P[i][j]` computes v·P (left multiply),
while the docstring says "power iteration on Pᵀ". The 2-state `powerIterate` builds an
explicit PT and multiplies PT·v (right multiply). The two methods use opposite conventions;
both converge to the left stationary distribution of P, so output is correct for ergodic
row-stochastic matrices, but a column-stochastic P would silently produce a wrong result.
**Recommendation:** align comment with actual operation and document the convention.

### MED severity

**F-2 — `nullcline2` undefined at a21=0** (CompetitiveExclusionModel.js:126)
Constructor allows a21=0 (only rejects a21<0). `nullcline2()` returns `{ intercept: K2/a21, slope: -1/a21 }` = `{Infinity, -Infinity}` silently.

**F-3 — expm1 not implemented in general case** (PharmacokineticsModel.js:80–82)
The class docstring explicitly documents an expm1-based catastrophic-cancellation fix for
`(e^{-ke·t} − e^{-ka·t})` at small t; the actual code uses plain subtraction. The expm1 path
exists only for the ka≈ke limit (line 75). The comment creates a false assurance.

**F-4 — `D === 0` uses exact float equality** (PhasePlaneModel.js:52)
The degenerate-zero-eigenvalue branch compares `det === 0` without tolerance. A near-singular
matrix will fall through to the spiral/node branches and be misclassified.

**T-3 — `COP_ref(Tc=0)` not tested** (carnot.test.js)
The test `COP_hp(Tc=0) = 1` exists, but `COP_ref(Tc=0) = Tc/(Th-Tc) = 0` is not asserted.

**T-4 — Large-μ limit untested** (drift-diffusion.test.js)
For large μ/σ², P+ → 1 and meanFPT → a/μ. Neither limit is tested.

**T-5 — r1 ≠ r2 untested** (competitive-exclusion.test.js)
Every test uses default r1=r2=1. The Jacobian formula uses r1 and r2 explicitly; a regression
swapping r1/r2 in the Jacobian rows would go undetected.

### LOW severity

- **E-4:** `t0 < 0` not validated in DriftDiffusionModel constructor.
- **E-5:** `cdf(xMax > L)` not guarded in ParticleInBoxModel.
- **N-1:** `tMix` loop calls `|λ₂|**k` up to 10,000 times; cumulative multiply would be faster.
- **Q-4:** `t > 100` safety cap in `simulate` is undocumented relative to expected FPT scale.
- **Q-5:** `outcome` returns string `'undefined'` (misleading sentinel).

---

## Section 5: Test-name tables

### particle-in-box.test.js (18 tests)

| Test name |
|---|
| E_1(L=1nm) ≈ 6.0247e-20 J ±1e-27 |
| E_1 in eV ≈ 0.376030 ±1e-5 eV |
| E_2/E_1 = 4 ±1e-15 rel |
| E_3/E_1 = 9 ±1e-15 rel |
| photon λ(2→1) at L=1nm ≈ 1099 nm ±1 nm |
| normalization n=1 ±1e-8 (Simpson) |
| normalization n=2 ±1e-8 (Simpson) |
| orthogonality ψ₁·ψ₂ ±1e-8 (Simpson) |
| P(0<x<L/3) n=1 ≈ 0.195501 ±1e-6 |
| \<x²\>_1 = L²(1/3−1/(2π²)) ±1e-12 rel |
| \<x²\>_2 = L²(1/3−1/(8π²)) ±1e-12 rel |
| \<x²\>_3 = L²(1/3−1/(18π²)) ±1e-12 rel |
| P(0<x<L/3) n=2 = 1/3 + √3/(8π) ±1e-6 |
| P(0<x<L/3) n=3 = 1/3 exactly ±1e-6 |
| E_1(2L)/E_1(L) = 0.25 ±1e-15 rel |
| energies strictly increasing for n=1..5 |
| n<1 → RangeError |
| n=0.5 (non-integer) → RangeError |

### carnot.test.js (16 tests)

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
| T_c,max for η=0.33, T_h=873.15 K: T_c = T_h·(1−η) ≈ 585.0 K ±0.2 |
| Clausius equality: Q_h/T_h = Q_c/T_c = dS ±1e-10 |
| W = Q_h − Q_c ±1e-10 |
| T_c < 0 → RangeError (absolute zero) |
| T_h ≤ 0 → RangeError |
| NaN inputs → RangeError |

### tests/core/eigen2x2.test.js (6 tests)

| Test name |
|---|
| saddle [[1,0],[0,-1]]: real eigenvalues 1 and -1 ±1e-15 |
| saddle [[1,0],[0,-1]]: disc = 4 ±1e-15 |
| stable spiral [[-1,-1],[1,-1]]: real parts = -1, imag parts = ±1 ±1e-12 |
| defective [[-1,1],[0,-1]]: repeated=true, defective=true |
| star node [[2,0],[0,2]]: repeated=true, defective=false |
| eigen2x2 vs jacobiEigen on [[2,1],[1,2]]: eigenvalues match ±1e-10 |

### markov-chains.test.js (21 tests)

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
| LPW upper bound 7.789 ≥ exact t_mix 4 (p=0.3, q=0.4, ε=0.01) |
| p=q=1: λ₂ = -1 ±1e-15 (periodic chain) |
| p=q=1: tMix(0.01) = Infinity (never mixes) |
| p outside [0,1] → RangeError |
| q outside [0,1] → RangeError |
| 3-state preset: π = [1/4, 1/2, 1/4] by value ±1e-10 |
| 3-state preset: π·P = π ±1e-14 (stationarity by algebraic identity) |
| 3-state preset: eigenvalues include 1, 0.5, 0 (verified via det(P−λI)=0) |

### drift-diffusion.test.js (10 tests)

| Test name |
|---|
| P+(μ=1,a=1,σ=1) ±1e-6 |
| RT_mean(μ=1,a=1,σ=1,t0=0.3) ±1e-6 |
| P+(μ=0) = 0.5 ±1e-15 |
| E[T](μ=0) = a²/σ² = 1 ±1e-10 |
| E[T] continuity: μ=1e-8 ≈ a²/σ² ±1e-10 |
| σ<=0 → RangeError |
| a<=0 → RangeError |
| RT_mean > t₀ |
| simulation P+ within 4√(p(1-p)/N) of formula (N=5000, seed=42) |
| dt-halving: P+ converges (|dt - dt/2| > |dt/2 - dt/4|) |

### phase-plane.test.js (20 tests)

| Test name |
|---|
| stable node [[-1,0],[0,-2]]: τ=-3 ±1e-15 |
| center [[0,-1],[1,0]]: Δ=1 ±1e-15 |
| stable spiral [[-1,-1],[1,-1]]: disc = -4 ±1e-15 |
| saddle [[1,0],[0,-1]]: Δ=-1 ±1e-15 |
| unstable node [[1,0],[0,2]]: τ=3 ±1e-15 |
| star node [[2,0],[0,2]]: repeated=true, defective=false |
| τ=Δ=0 classification = "Fully degenerate" |
| spiral \|x(2π)\| = e^{-2π} ±1e-6 (A=[[-1,-1],[1,-1]], x0=[1,0]) |
| center \|x(2π)\| = 1 ±1e-5 (A=[[0,-1],[1,0]], x0=[1,0]) |
| nonlinear r(1) = 1/√3 ±1e-6 (μ=-1, r₀=1, t=1) |
| classification: stable node for [[-1,0],[0,-2]] |
| classification: unstable node for [[1,0],[0,2]] |
| classification: stable spiral for [[-1,-1],[1,-1]] |
| classification: unstable spiral for [[1,-1],[1,1]] |
| classification: center for [[0,-1],[1,0]] |
| classification: saddle for [[1,0],[0,-1]] |
| classification: stable star node for [[-2,0],[0,-2]] |
| spiral dt-halving: \|x(2π)\| converges as dt halves |
| nonlinear r(1) dt-halving: convergence to 1/√3 |
| vectorField: every point satisfies dx=A*x (μ=0) |

### competitive-exclusion.test.js (19 tests)

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
| bistable N₁* = N₂* = 40 ±1e-10 (K=100, α=1.5) |
| bistable outcome = "bistable" (α12=α21=1.5) |
| bistable Jacobian eigenvalues = +0.2 and -1 ±1e-10 |
| bistable (60,40) → sp1 wins at t=300 (N₂<1, N₁>50) |
| bistable (40,60) → sp2 wins at t=300 (N₁<1, N₂>50) |
| grid sweep: formula outcome matches RK4 for 3 deterministic cases |
| coexistence dt-halving: \|N₁(10) − N₁_fine\| decreases as dt halves |
| K1 ≤ 0 → RangeError |
| K2 ≤ 0 → RangeError |
| α < 0 → RangeError |

### pharmacokinetics.test.js (16 tests)

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
| ke ≤ 0 → RangeError |
| ka ≤ 0 → RangeError |
| Vd ≤ 0 → RangeError |
| F outside (0,1] → RangeError |

---

## Section 6: Formula verification

Each formula verified in `tools/anchors-phase8.mjs` (no model code). Run: `node tools/anchors-phase8.mjs`.

1. **E_n = n²π²ℏ²/(2m_eL²):** Schrödinger equation with infinite-well BC. E_1=0.376030 eV ✓. m_e = CODATA 2018 (unverified; CODATA 2022 fetch unavailable).
2. **photon λ = hc/(E_2−E_1):** hc = 1239.842 eV·nm; λ = 1239.842/(3·0.376030) ≈ 1099 nm ✓.
3. **η = 1−T_c/T_h:** COP_hp−COP_ref = T_h/W − T_c/W = 1 algebraically ✓. COP_ref(Tc=0) = 0 (see gap T-3).
4. **λ₂=1−p−q:** Char poly of [[1-p,p],[q,1-q]]. t_mix(0.01)=4 via exact TV formula ✓. LPW bound = tRel·ln(1/(ε·π_min)) = (1/0.7)·ln(233.33) ≈ 7.789 ✓.
5. **p=q=0.6: λ₂=−0.2 (oscillating).** Negative λ₂ means alternating-sign TV decay; not fully periodic (that requires |λ₂|=1).
6. **P+(μ=0)=0.5 and E[T]=a²/σ²:** L'Hôpital limits ✓. Continuity at μ=1e-8: residual = z²/3 ≈ 3e-17 ✓.
7. **r(t)=r₀/√(1−2μr₀²t):** Separation of variables on ṙ=μr³. r(1)=1/√3 at μ=−1, r₀=1 ✓.
8. **N* = (K₁−α₁₂K₂)/(1−α₁₂α₂₁):** Nullcline intersection. Bistable: K=100, α=1.5 → N*=40 ✓. λ_J = +0.2 and −1 ✓.
9. **C₀ = D/Vd = 100/10 = 10 mg/L** (fixed from 100). AUC_IV = 100 mg·h/L ✓. C(5h) = 6.0653 mg/L ✓.
10. **R = 1/(1−e^{-ke·τ}):** ke=ln2/24, τ=12 → R = 2+√2 ✓. Flip-flop: ke·C(t;ka,ke) = ka·C(t;ke,ka) algebraically ✓.

---

## Section 7: Visual rules compliance

All Phase 8 view files pass no-hardcoded-colours test (theme-tokens test suite, 3/3 subtests).
Verified at HEAD by `npm test` and `npm run smoke`:

- **Colors:** All from `theme.color('--token')` (--surface, --text, --accent, --signal, --muted)
- **Background:** `c.fillStyle = theme.color('--surface'); c.fillRect(0,0,w,h)` in every Phase 8 view
- **Smoke 63/63:** dark_fill=0, surface_mismatch=0, blank=0, console_err=0

---

## Section 8: npm test summary

Phase 8b final state:

```
# tests 740
# suites 16
# pass 740
# fail 0
# duration_ms ~1618
```

Test counts per file (phase-8b state):

| File | Tests |
|---|---|
| particle-in-box.test.js | 18 |
| carnot.test.js | 16 |
| eigen2x2.test.js (new) | 6 |
| markov-chains.test.js | 21 |
| drift-diffusion.test.js | 10 |
| phase-plane.test.js | 20 |
| competitive-exclusion.test.js | 19 |
| pharmacokinetics.test.js | 16 |
| **Phase 8b subtotal** | **126** (78 from phase-8 + 48 from phase-8b) |

---

## Section 9: Open questions and Phase 9 items

1. **m_e CODATA 2022:** CODATA 2022 data is available but the NIST CGI endpoint returned HTML
   rather than parseable ASCII during this session. Value 9.1093837015e-31 kg is from CODATA 2018
   and is likely unchanged (≤ 0.1 ppb revision), but marked **unverified** in anchors-phase8.mjs.

2. **Bateman (1910) attribution:** The Bateman function is cited in PharmacokineticsModel.js
   but not fetched. The formula itself is standard; the attribution is an academic note.

3. **stationaryN convention (F-1):** The most impactful open item: the comment/code mismatch
   means a caller passing a column-stochastic P would get silently wrong results. Low risk in
   practice (all internal callers use row-stochastic matrices), but misleading.

4. **PhasePlaneModel D===0 (F-4):** Near-singular matrices will misclassify. This is a latent
   bug for near-degenerate matrices passed from the UI (slider at near-zero determinant).

5. **Phase 9 candidates** (from ROADMAP): entropy-mixing, stdp, cable-equation, random-walk,
   solow, opinion-dynamics, age-structure, Complex.js infrastructure.
