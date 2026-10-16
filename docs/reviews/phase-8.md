# Phase 8 Review

## Section 0: Baseline, smoke validity, and timing

### Tag history

| Tag | Commit hash | Tests | Notes |
|---|---|---|---|
| phase-7b | af019382be50872f9ade09217ecd079bfea886bb | 614 | Baseline — last commit before Phase 8 bench work (see note 1) |
| phase-8 | 904a41feae377376ba175cbeb0ca15df00fe3c02 | 692 | Phase 8 complete (+78 tests) |
| phase-8b | 7820d47cd4e181f1593104e1b74dcd4fcbc420f6 | 740 | Phase 8b fixes (+48 tests) |
| phase-8c | 4afcb930c50dfbbcb31d6ea866e67aeacf6fd56f (retagged to close-out HEAD) | 756 | Phase 8c close-out: m_e CODATA 2022; invasion criterion; K1≠K2 grid test; spiral closed form; dt-halving [12,20]; T-4 fix (+16 tests) |

**Note 1 — phase-7b = af01938:** `af01938` is "fix(smoke): SOLID flag is informational only — remove from fail condition". This is not a Phase 7 feature commit; it is the last commit before Phase 8 bench work started. The tag marks the test-count baseline (614 tests) that Phase 8 was measured against.

**Note 2 — commit 80c3146:** `80c3146` ("fix(views): add --surface fillRect to views missing canvas background clear") was committed between `f1906c9` (docs: write Phase 7 plan) and `af01938` (smoke fix). It belongs to the Phase 7b era (smoke/views remediation) and is an ancestor of all four Phase 8 tags. It is not a Phase 8 commit.

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

**Phase 8c (phase-8b → phase-8c close-out):**
- +16 new tests (740 → 756)
- Fixed: m_e CODATA 2022; expm1 in PharmacokineticsModel; D===0 tolerance in PhasePlaneModel;
  stationaryN comment + convention test; outcome 'undefined'→'unknown'; t0<0 RangeError in DDM;
  cdf(xMax>L) clamped in ParticleInBoxModel; α=0 nullclines fixed in model + view;
  invasion-criterion outcome logic; K1≠K2 grid test; spiral closed-form anchor; dt-halving [12,20]

| File | New tests | What changed |
|---|---|---|
| tests/physics/particle-in-box.test.js | +3 | T-1 ⟨x⟩=L/2 (Simpson); T-2 cdf(L)≈1; E-5 cdf guard |
| tests/physics/carnot.test.js | +1 | T-3 COP_ref(Tc=0)=0 |
| tests/biology/competitive-exclusion.test.js | +7 | T-5 Jacobian r1≠r2; Q-5 outcome 'unknown'; α=0 nullclines (×4); K1≠K2 grid test (K1=100, K2=50) covering all 5 outcome classes with RK4 |
| tests/biology/pharmacokinetics.test.js | +1 | F-3 expm1 small-t vs Taylor series |
| tests/math/markov-chains.test.js | +1 | F-1 stationaryN row-vector convention (non-symmetric P) |
| tests/math/phase-plane.test.js | +1 | F-4 decimal determinant classifies correctly |
| tests/psychology/drift-diffusion.test.js | +2 | E-4 t0<0 RangeError; T-4 large-μ asymptotic limits |

**Also changed in phase-8c:**
- `js/benches/physics/quantum/particle-in-box/ParticleInBoxModel.js`: ME = CODATA 2022; cdf clamp
- `js/benches/math/dynamics/phase-plane/PhasePlaneModel.js`: classification eps-tolerance for D
- `js/benches/math/probability/markov-chains/MarkovModel.js`: stationaryN comment aligned
- `js/benches/biology/ecology/competitive-exclusion/CompetitiveExclusionModel.js`: outcome logic
  fixed (invasion criterion replaces N* sign check); nullcline2() returns horizontal type; α=0 legal
- `js/benches/biology/ecology/competitive-exclusion/CompetitiveExclusionView.js`: draw α=0 nullclines
- `js/benches/biology/pharmacology/pharmacokinetics/PharmacokineticsModel.js`: expm1 implemented
- `js/benches/psychology/decision-making/drift-diffusion/DriftDiffusionModel.js`: t0<0 validated
- `tools/anchors-phase8.mjs`: ME = CODATA 2022; BGK=−ζ(1/2)/√(2π) explained; T-5 derivation
- `docs/SOURCES.md`: m_e updated to CODATA 2022 (verified); 1.36 ppb delta documented

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
| T-1: ⟨x⟩ = L/2 | particle-in-box.test.js | `<x>_n = L/2 ±1e-8 for n=1,2,3 (Simpson N=10000)` | 1e-8 rel to L | Simpson integration of x·\|ψ_n\|²; symmetry exact | PRESENT |
| T-2: cdf(L)=1 | particle-in-box.test.js | `cdf(L,n)≈1 ±1e-6 for n=1,2,3 (total probability = 1)` | 1e-6 | Full-range integral = total probability | PRESENT |
| E-5: cdf(xMax>L) clamped | particle-in-box.test.js | `cdf(xMax>L) clamped to cdf(L)≈1 ±1e-6 (E-5 guard)` | 1e-6 | Passes xMax=2L; model clamps to L before integrating | PRESENT |
| m_e = 9.1093837139e-31 kg | ParticleInBoxModel.js | (constant; used in all E_n tests) | — | CODATA 2022 fetched 2026-10-16 from physics.nist.gov; Δ=+1.36 ppb vs 2018 | **VERIFIED** |

### Carnot

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| η(500,300) = 0.4 | carnot.test.js | `η(T_h=500, T_c=300) = 0.4 ±1e-15` | 1e-15 abs | 1−300/500 exact | PRESENT |
| COP_hp−COP_ref = 1 | carnot.test.js | `COP_hp − COP_ref = 1 ±1e-15` | 1e-15 abs | T_h/W−T_c/W=1 algebraic identity | PRESENT |
| T_c,max = 585.0105 K (η=0.33, T_h=873.15K) | carnot.test.js | `T_c = T_h·(1−η) = 585.0105 K ±1e-10` | 1e-10 | T_h·(1−η) closed form | PRESENT |
| Q_h/T_h = Q_c/T_c = dS | carnot.test.js | `Clausius equality ±1e-10` | 1e-10 | Both sides derived from same model dS; Q_h=Th·dS, Q_c=Tc·dS | **WEAK** (self-referential) |
| COP_ref(Tc=0) = 0 | carnot.test.js | `COP_ref(T_c=0) = 0 ±1e-15 (T-3)` | 1e-15 | Tc/(Th-Tc)=0 exact when Tc=0 | PRESENT |
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
| F-1: stationaryN row-vector convention | markov-chains.test.js | `stationaryN row-vector convention: π·P=π ±1e-10 for non-symmetric P` | 1e-10 | Non-symmetric P; also asserts P·π≠π (right≠left eigenvector) | PRESENT |

Note: p=q=0.6 gives λ₂ = −0.2 (negative, damped oscillation). "Periodic" was incorrect in the original report.

### Drift-diffusion

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| P+(μ=1,a=1,σ=1) = 0.88080 | drift-diffusion.test.js | `P+(μ=1,a=1,σ=1) ±1e-6` | 1e-6 | 1/(1+e^{−2}) in anchors | PRESENT |
| E[T](μ=0) = a²/σ² = 1 | drift-diffusion.test.js | `E[T](μ=0) = a²/σ² = 1 ±1e-10` | 1e-10 | L'Hôpital: tanh(z)/z→1 | PRESENT |
| μ=1e-8 continuity ≈ 1 | drift-diffusion.test.js | `E[T] continuity: μ=1e-8 ±1e-10` | 1e-10 | z=1e-8, tanh(z)≈z, (a/μ)·z=1 | PRESENT |
| sim P+ within 4√(p(1-p)/N) | drift-diffusion.test.js | `sim P+ within 4√(p(1-p)/N)` | 4σ (theoretical) | p from formula, not from sim | PRESENT |
| E-4: t0 < 0 → RangeError | drift-diffusion.test.js | `t0 < 0 → RangeError` | exact | Absolute non-negativity of non-decision time | PRESENT |
| T-4: large-μ limits | drift-diffusion.test.js | `large-μ: P+ → 1 and meanFPT → a/μ at μ=10 (a=σ=1)` | P+>1−1e-8; \|FPT−a/μ\|<1e-9 | Asymptotic: 1−P+≈exp(−20)≈2e-9; error in FPT≈2(a/μ)exp(−20)=2×0.1×2.06e-9≈**4.1e-10** | PRESENT |
| BGK boundary correction | — | (none; dropped) | — | 0.5826·σ·√dt (cited, not fetched) | MISSING |

BGK test dropped: The Broadie-Glasserman-Kou (1997) correction is a first-order bias
(~0.5826·σ·√dt). Isolating it requires very large N and reference values not independently
verifiable here. Noted in test file comment and SOURCES.md.

### Phase plane

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| stable spiral disc = −4 | phase-plane.test.js | `stable spiral disc = -4 ±1e-15` | 1e-15 | τ²−4Δ=4−8 in anchors | PRESENT |
| spiral \|x(2π)\| = e^{-2π} | phase-plane.test.js | `spiral \|x(2π)\| = e^{-2π} ±1e-6` | 1e-6 | Closed form: A=[[-1,-1],[1,-1]] → λ=−1±i → \|x(t)\|=e^{-t} → \|x(2π)\|=e^{-2π} exactly (shown in anchors-phase8.mjs) | PRESENT |
| center \|x(2π)\| = 1 | phase-plane.test.js | `center \|x(2π)\| = 1 ±1e-5` | 1e-5 | Pure imaginary λ: no decay | PRESENT |
| nonlinear r(1) = 1/√3 | phase-plane.test.js | `nonlinear r(1) = 1/√3 ±1e-6` | 1e-6 | r₀/√(1−2μr₀²t) in anchors | PRESENT |
| Classification labels (7 types) | phase-plane.test.js | `classification: stable node …` (×7) | exact string | Label from τ,Δ,disc logic | PRESENT |
| eigen2x2 defective | eigen2x2.test.js | `defective repeated=true, defective=true` | exact bool | Off-diagonal non-zero check | PRESENT |
| eigen2x2 vs jacobiEigen | eigen2x2.test.js | `cross-check vs jacobiEigen ±1e-10` | 1e-10 | Independent algorithm | PRESENT |
| F-4: D≈0 decimal arithmetic | phase-plane.test.js | `classification: D≈0 from decimal arithmetic → Degenerate (zero eigenvalue)` | exact string | A=[[0.1,0.3],[0.3,0.9]]: 0.1×0.9−0.09≈1e-17; eps=1e-10×normA²≈1e-12 catches it | PRESENT |
| spiral dt-halving: ratio in [12,20] | phase-plane.test.js | `spiral dt-halving: error ratio in [12,20] (RK4 Richardson)` | ratio ∈ [12,20] | RK4 is O(dt⁴): halving dt reduces error ≈16×; [12,20] allows slight anharmonicity | PRESENT |
| nonlinear dt-halving: ratio in [12,20] | phase-plane.test.js | `nonlinear r(1) dt-halving: error ratio in [12,20] (RK4 Richardson)` | ratio ∈ [12,20] | Same RK4 Richardson argument applied to nonlinear radial system | PRESENT |

### Competitive exclusion

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| N₁* = 200/3 (coexistence) | competitive-exclusion.test.js | `coexistence N₁* = 200/3 ±1e-10` | 1e-10 | (K₁−α₁₂K₂)/den in anchors | PRESENT |
| N₂* = −200 (sp1-wins) | competitive-exclusion.test.js | `counterexample N₂* = -200 ±1e-10` | 1e-10 | (100−150)/0.25 in anchors | PRESENT |
| Jacobian λ = −1/3, −1 | competitive-exclusion.test.js | `Jacobian eigenvalues -1 and -1/3 ±1e-10` | 1e-10 | τ=−4/3, Δ=1/3 in anchors | PRESENT |
| Bistable N* = (40, 40) | competitive-exclusion.test.js | `bistable N₁* = N₂* = 40 ±1e-10` | 1e-10 | (100−150)/(−1.25) in anchors | PRESENT |
| Bistable Jacobian λ = +0.2, −1 | competitive-exclusion.test.js | `bistable Jacobian λ = +0.2, -1 ±1e-10` | 1e-10 | τ=−0.8, det=−0.2, disc=1.44 | PRESENT |
| (60,40) → sp1 wins | competitive-exclusion.test.js | `bistable (60,40) → sp1 wins at t=300: \|N₁−100\|<1e-6 and N₂<1e-6` | \|N₁−100\|<1e-6, N₂<1e-6 | IC above stable manifold; N₂ decays at rate r₂(1−α₂₁)=−0.5 | PRESENT |
| T-5: r1≠r2 Jacobian eigenvalues | competitive-exclusion.test.js | `r1≠r2: Jacobian eigenvalues = -1±1/√3 ±1e-10 (r1=1, r2=2, K=100, α=0.5)` | 1e-10 | τ=−2, Δ=2/3, disc=4/3 in anchors-phase8.mjs T-5 section | PRESENT |
| Q-5: outcome 'unknown' not 'undefined' | competitive-exclusion.test.js | `outcome string is "unknown" not "undefined" for unreachable path` | exact string | Code changed: fallback returns 'unknown' | PRESENT |
| α=0 edge: nullcline2 horizontal | competitive-exclusion.test.js | `α21=0: nullcline2 is horizontal at K2 (no Infinity)` | exact type+value | nc2.type==='horizontal', nc2.value===K2 | PRESENT |
| α=0 edge: nullcline1 vertical | competitive-exclusion.test.js | `α12=0: nullcline1 is vertical at K1 (no Infinity)` | exact type+value | nc1.type==='vertical', nc1.value===K1 | PRESENT |
| α=0 coexistence equilibrium | competitive-exclusion.test.js | `α12=α21=0: outcome coexistence, N1*=K1, N2*=K2 (independent species)` | 1e-10 | den=1; N1*=(K1−0)/1=K1 exactly | PRESENT |
| α21=0 trajectory convergence | competitive-exclusion.test.js | `α21=0: trajectory → N2 converges to K2, independent of N1 ±1%` | <1% of K2 | sp2 uncoupled: logistic growth to K2 | PRESENT |
| K1≠K2 outcomes grid (K1=100, K2=50) | competitive-exclusion.test.js | `K1≠K2 outcomes (K1=100, K2=50): all five cases + RK4 verification` | exact string + RK4 thresholds | K1/K2=2: invasion thresholds a12<2, a21<0.5; 5 cases tested; RK4 from 2 ICs for coexist/sp1/sp2 | PRESENT |
| coexistence dt-halving: ratio in [12,20] | competitive-exclusion.test.js | `coexistence dt-halving: error ratio in [12,20] (RK4 Richardson)` | ratio ∈ [12,20] | RK4 O(dt⁴) → halving reduces error ≈16×; [12,20] accepted | PRESENT |

### Pharmacokinetics

| Anchor | Test file | Test name | Tolerance | Independent anchor | Status |
|---|---|---|---|---|---|
| C₀ = D/Vd = 10 mg/L | pharmacokinetics.test.js | `IV: C₀ = D/Vd ±1e-15 rel` | 1e-15 rel | D/Vd = 100/10 = 10 in anchors | PRESENT |
| C(5h) = 10·e^{−0.5} ≈ 6.0653 mg/L | pharmacokinetics.test.js | `IV: C(5h) = C₀·e^{-ke·5} ±1e-8 rel` | 1e-8 rel | 10·exp(−0.5) = 6.0653 in anchors | PRESENT |
| AUC_IV = C₀/ke = 100 mg·h/L | pharmacokinetics.test.js | `IV: AUC = C₀/ke ±1e-6 rel` | 1e-6 rel | 10/0.1 = 100 in anchors | PRESENT |
| t_max(ka=1, ke=0.1) = 2.5584 h | pharmacokinetics.test.js | `Oral: tMax = ln(ka/ke)/(ka-ke) ±1e-10` | 1e-10 rel | ln(10)/0.9 in anchors | PRESENT |
| R(t½=24h, τ=12h) = 2+√2 | pharmacokinetics.test.js | `R = 2+√2 ±1e-6` | 1e-6 abs | 1/(1−2^{−0.5}) in anchors | PRESENT |
| Flip-flop: ke·C(t;ka,ke) = ka·C(t;ke,ka) | pharmacokinetics.test.js | `Flip-flop symmetry ±1e-10 rel` | 1e-10 rel | Algebraic substitution in anchors | PRESENT |

| F-3: expm1 small-t stability | pharmacokinetics.test.js | `Oral C(t=1e-6) vs Taylor series ±1e-14 relative (expm1 stability)` | 1e-14 rel | Series A·(diff·t−(ka²−ke²)t²/2+…) independent of expm1; confirms cancellation fix | PRESENT |

Note on original errors: The original review had AUC_IV = 1000 mg·h/L and C(5h) = 60.653 mg/L
because `anchors-phase8.mjs` hardcoded `C0_pk = 100` instead of `D_pk / Vd = 10`.
Both corrected in this phase.

---

## Section 3: Remaining gaps

All phase-8b tasks (C.1–C.8) are now closed. All gaps identified by the independent review
agent (section 4) and listed here have been resolved in Phase 8c:

| ID | File | Severity | Description | **Disposition** |
|---|---|---|---|---|
| F-1 | MarkovModel.js:112–126 | **HIGH** | `stationaryN` comment said "power iteration on Pᵀ" but code does v·P. | **RESOLVED (8c)**: comment aligned to "row-vector left-multiplication: v ← v·P"; new test verifies left-eigenvector output for non-symmetric P and confirms right eigenvector ≠ left eigenvector. |
| F-2 | CompetitiveExclusionModel.js:126 | MED | `nullcline2()` divided by a21 → Infinity when a21=0. | **RESOLVED (8c)**: `nullcline2()` now returns `{type:'horizontal', value:K2}` when a21=0; `nullcline1()` returns `{type:'vertical', value:K1}` when a12=0; view updated; 4 new tests. |
| F-3 | PharmacokineticsModel.js:80–82 | MED | Docstring promised expm1 cancellation fix; code used plain subtraction. | **RESOLVED (8c)**: expm1 form implemented: `exp(-ke·t)·(−expm1(-(ka−ke)·t))`; new test at t=1e-6 vs Taylor series ±1e-14 rel confirms stability. |
| F-4 | PhasePlaneModel.js:52 | MED | `D === 0` used strict float equality; near-singular matrices misclassified. | **RESOLVED (8c)**: replaced with `\|D\| < eps·max(1, normA²)` where eps=1e-10; new test: A=[[0.1,0.3],[0.3,0.9]] correctly classified as "Degenerate (zero eigenvalue)". |
| T-1 | particle-in-box | MED | ⟨x⟩_n = L/2 never numerically verified. | **RESOLVED (8c)**: Simpson integration of x·\|ψ_n\|² for n=1,2,3; tolerance 1e-8 rel to L. |
| T-2 | particle-in-box | MED | `cdf(L, n) ≈ 1` never tested. | **RESOLVED (8c)**: `cdf(L,n)≈1 ±1e-6` for n=1,2,3. |
| T-3 | carnot | MED | `copRefrigerator(Tc=0) = 0` never tested. | **RESOLVED (8c)**: test added; Tc/(Th−Tc)=0 exact when Tc=0. |
| T-4 | drift-diffusion | MED | Large-μ limits P+→1, meanFPT→a/μ untested. | **RESOLVED (8c)**: test at μ=10; P+>1−1e-8, \|FPT−a/μ\|<1e-9 (derived from exp(−20) asymptotic). |
| T-5 | competitive-exclusion | MED | r1≠r2 Jacobian untested. | **RESOLVED (8c)**: r1=1, r2=2; K=100, α=0.5; eigenvalues −1±1/√3 ±1e-10; derivation in anchors-phase8.mjs. |
| Q-5 | CompetitiveExclusionModel.js:72 | LOW | `outcome` returned string `'undefined'`. | **RESOLVED (8c)**: changed to `'unknown'`; test asserts `notStrictEqual(outcome,'undefined')`. |
| E-4 | DriftDiffusionModel.js | LOW | `t0 < 0` not validated. | **RESOLVED (8c)**: RangeError thrown when t0<0; test added. |
| E-5 | ParticleInBoxModel.js | LOW | `cdf(xMax > L)` not guarded. | **RESOLVED (8c)**: `xMax = Math.min(Math.max(xMax, 0), L)` before integration; test passes xMax=2L. |

---

## Section 4: Independent review-agent findings

Review agent ran in fresh context over all Phase 8 model, test, and core files.
Full 25-finding report; each finding tagged with Phase 8c disposition.

### HIGH severity

**F-1 — `stationaryN` uses wrong matrix convention (MarkovModel.js:112–126)**
The n-state `stationaryN` loop `vNext[j] += v[i] * P[i][j]` computes v·P (left multiply),
while the docstring said "power iteration on Pᵀ". The 2-state `powerIterate` builds an
explicit PT and multiplies PT·v (right multiply). Both converge correctly for ergodic
row-stochastic matrices, but convention mismatch was misleading.
**Disposition: FIXED (8c)** — comment aligned; non-symmetric P test confirms left-eigenvector output and verifies right≠left.

### MED severity

**F-2 — `nullcline2` undefined at a21=0** (CompetitiveExclusionModel.js:126)
Constructor allows a21=0 (only rejects a21<0). `nullcline2()` returned `{Infinity, -Infinity}` silently.
**Disposition: FIXED (8c)** — α=0 returns typed sentinel (`{type:'horizontal',value:K2}` / `{type:'vertical',value:K1}`); view updated to draw these; 4 new tests.

**F-3 — expm1 not implemented in general case** (PharmacokineticsModel.js:80–82)
Docstring documented the expm1 cancellation fix; code used plain subtraction.
**Disposition: FIXED (8c)** — expm1 form: `exp(-ke·t)·(−expm1(-(ka−ke)·t))`; small-t Taylor test ±1e-14 rel.

**F-4 — `D === 0` uses exact float equality** (PhasePlaneModel.js:52)
Near-singular matrices fall through to wrong branch.
**Disposition: FIXED (8c)** — `|D| < eps·max(1,normA²)` with eps=1e-10; decimal-det test added.

**T-3 — `COP_ref(Tc=0)` not tested** (carnot.test.js)
**Disposition: FIXED (8c)** — test `COP_ref(T_c=0) = 0 ±1e-15 (T-3)` added.

**T-4 — Large-μ limit untested** (drift-diffusion.test.js)
**Disposition: FIXED (8c)** — P+>1−1e-8 and |meanFPT−a/μ|<1e-9 at μ=10; tolerances derived: 1−P+≈exp(−20)≈2e-9; FPT error ≈ 2(a/μ)exp(−20) = 2×0.1×2.06e-9 ≈ **4.1e-10** (test bound 1e-9 is conservative).

**T-5 — r1 ≠ r2 untested** (competitive-exclusion.test.js)
**Disposition: FIXED (8c)** — r1=1, r2=2; eigenvalues −1±1/√3; anchors derivation in anchors-phase8.mjs T-5 section.

### LOW severity

- **E-4:** `t0 < 0` not validated in DriftDiffusionModel constructor. **FIXED (8c)** — RangeError added.
- **E-5:** `cdf(xMax > L)` not guarded in ParticleInBoxModel. **FIXED (8c)** — clamp added; test passes xMax=2L.
- **N-1:** `tMix` loop calls `|λ₂|**k` up to 10,000 times; cumulative multiply would be faster. **DEFERRED** — performance-only; correctness unaffected; candidate for Phase 9 cleanup.
- **Q-4:** `t > 100` safety cap in `simulate` is undocumented relative to expected FPT scale. **DEFERRED** — low risk; no test added; Phase 9 candidate.
- **Q-5:** `outcome` returns string `'undefined'` (misleading sentinel). **FIXED (8c)** — changed to `'unknown'`.

---

## Section 5: Test-name tables

### particle-in-box.test.js (21 tests)

| Test name | Phase |
|---|---|
| E_1(L=1nm) ≈ 6.0247e-20 J ±1e-27 | 8 |
| E_1 in eV ≈ 0.376030 ±1e-5 eV | 8 |
| E_2/E_1 = 4 ±1e-15 rel | 8 |
| E_3/E_1 = 9 ±1e-15 rel | 8 |
| photon λ(2→1) at L=1nm ≈ 1099 nm ±1 nm | 8 |
| normalization n=1 ±1e-8 (Simpson) | 8 |
| normalization n=2 ±1e-8 (Simpson) | 8 |
| orthogonality ψ₁·ψ₂ ±1e-8 (Simpson) | 8 |
| P(0<x<L/3) n=1 ≈ 0.195501 ±1e-6 | 8 |
| \<x²\>_1 = L²(1/3−1/(2π²)) ±1e-12 rel | 8b |
| \<x²\>_2 = L²(1/3−1/(8π²)) ±1e-12 rel | 8b |
| \<x²\>_3 = L²(1/3−1/(18π²)) ±1e-12 rel | 8b |
| P(0<x<L/3) n=2 = 1/3 + √3/(8π) ±1e-6 | 8b |
| P(0<x<L/3) n=3 = 1/3 exactly ±1e-6 | 8b |
| E_1(2L)/E_1(L) = 0.25 ±1e-15 rel | 8b |
| energies strictly increasing for n=1..5 | 8b |
| n<1 → RangeError | 8 |
| n=0.5 (non-integer) → RangeError | 8 |
| \<x\>_n = L/2 ±1e-8 for n=1,2,3 (Simpson N=10000) | **8c** |
| cdf(L,n)≈1 ±1e-6 for n=1,2,3 (total probability = 1) | **8c** |
| cdf(xMax>L) clamped to cdf(L)≈1 ±1e-6 (E-5 guard) | **8c** |

### carnot.test.js (17 tests)

| Test name | Phase |
|---|---|
| η(T_h=500, T_c=300) = 0.4 ±1e-15 | 8 |
| η(T_h=500, T_c=0) = 1.0 ±1e-15 | 8 |
| COP_hp(500,300) = 2.5 ±1e-10 | 8 |
| COP_ref(500,300) = 1.5 ±1e-10 | 8 |
| COP_hp − COP_ref = 1 ±1e-15 | 8 |
| η × COP_hp = 1 ±1e-15 | 8 |
| COP_hp(T_c=0) = 1 ±1e-15 | 8 |
| T-S shoelace area = W = (T_h−T_c)·ΔS ±1e-10 | 8 |
| η monotone decreasing: η(100) > η(200) > η(300) at T_h=500 | 8 |
| T_c >= T_h → RangeError | 8 |
| T_c,max for η=0.33, T_h=873.15 K: T_c = T_h·(1−η) = 585.0105 K ±1e-10 | 8b |
| Clausius equality: Q_h/T_h = Q_c/T_c = dS ±1e-10 | 8b |
| W = Q_h − Q_c ±1e-10 | 8b |
| T_c < 0 → RangeError (absolute zero) | 8b |
| T_h ≤ 0 → RangeError | 8b |
| NaN inputs → RangeError | 8b |
| COP_ref(T_c=0) = 0 ±1e-15 (T-3) | **8c** |

### tests/core/eigen2x2.test.js (6 tests)

| Test name |
|---|
| saddle [[1,0],[0,-1]]: real eigenvalues 1 and -1 ±1e-15 |
| saddle [[1,0],[0,-1]]: disc = 4 ±1e-15 |
| stable spiral [[-1,-1],[1,-1]]: real parts = -1, imag parts = ±1 ±1e-12 |
| defective [[-1,1],[0,-1]]: repeated=true, defective=true |
| star node [[2,0],[0,2]]: repeated=true, defective=false |
| eigen2x2 vs jacobiEigen on [[2,1],[1,2]]: eigenvalues match ±1e-10 |

### markov-chains.test.js (22 tests)

| Test name | Phase |
|---|---|
| π₀ = q/(p+q) = 4/7 ±1e-10 | 8 |
| π₁ = p/(p+q) = 3/7 ±1e-10 | 8 |
| λ₂ = 1-p-q = 0.3 ±1e-15 | 8 |
| spectral gap = p+q = 0.7 ±1e-15 | 8 |
| π·P = π residual ±1e-14 | 8 |
| detailed balance π₀·p = π₁·q ±1e-12 | 8 |
| exact TV(4) ≤ 0.01 → t_mix(0.01) = 4 | 8 |
| TV(3) > 0.01 (t_mix not 3) | 8 |
| power iteration converges to π ±1e-10 | 8 |
| p=q=0.6 (p+q>1): λ₂ = -0.2 ±1e-15 | 8 |
| p=q=0: stationary is null (no unique π) | 8 |
| 3-state preset: π·P = π ±1e-10 | 8 |
| 3-state second eigenvalue = 0.5 ±1e-10 (via ratio TV step test) | 8 |
| LPW upper bound 7.789 ≥ exact t_mix 4 (p=0.3, q=0.4, ε=0.01) | 8b |
| p=q=1: λ₂ = -1 ±1e-15 (periodic chain) | 8b |
| p=q=1: tMix(0.01) = Infinity (never mixes) | 8b |
| p outside [0,1] → RangeError | 8b |
| q outside [0,1] → RangeError | 8b |
| 3-state preset: π = [1/4, 1/2, 1/4] by value ±1e-10 | 8b |
| 3-state preset: π·P = π ±1e-14 (stationarity by algebraic identity) | 8b |
| 3-state preset: eigenvalues include 1, 0.5, 0 (verified via det(P−λI)=0) | 8b |
| stationaryN row-vector convention: π·P=π ±1e-10 for non-symmetric P | **8c** |

### drift-diffusion.test.js (12 tests)

| Test name | Phase |
|---|---|
| P+(μ=1,a=1,σ=1) ±1e-6 | 8 |
| RT_mean(μ=1,a=1,σ=1,t0=0.3) ±1e-6 | 8 |
| P+(μ=0) = 0.5 ±1e-15 | 8 |
| E[T](μ=0) = a²/σ² = 1 ±1e-10 | 8 |
| E[T] continuity: μ=1e-8 ≈ a²/σ² ±1e-10 | 8 |
| σ<=0 → RangeError | 8 |
| a<=0 → RangeError | 8 |
| RT_mean > t₀ | 8 |
| simulation P+ within 4√(p(1-p)/N) of formula (N=5000, seed=42) | 8 |
| dt-halving: P+ converges (\|dt - dt/2\| > \|dt/2 - dt/4\|) | 8 |
| t0 < 0 → RangeError | **8c** |
| large-μ: P+ → 1 and meanFPT → a/μ at μ=10 (a=σ=1) | **8c** |

### phase-plane.test.js (21 tests)

| Test name | Phase |
|---|---|
| stable node [[-1,0],[0,-2]]: τ=-3 ±1e-15 | 8 |
| center [[0,-1],[1,0]]: Δ=1 ±1e-15 | 8 |
| stable spiral [[-1,-1],[1,-1]]: disc = -4 ±1e-15 | 8 |
| saddle [[1,0],[0,-1]]: Δ=-1 ±1e-15 | 8 |
| unstable node [[1,0],[0,2]]: τ=3 ±1e-15 | 8 |
| star node [[2,0],[0,2]]: repeated=true, defective=false | 8 |
| τ=Δ=0 classification = "Fully degenerate" | 8 |
| spiral \|x(2π)\| = e^{-2π} ±1e-6 (A=[[-1,-1],[1,-1]], x0=[1,0]) | 8b |
| center \|x(2π)\| = 1 ±1e-5 (A=[[0,-1],[1,0]], x0=[1,0]) | 8b |
| nonlinear r(1) = 1/√3 ±1e-6 (μ=-1, r₀=1, t=1) | 8b |
| classification: stable node for [[-1,0],[0,-2]] | 8b |
| classification: unstable node for [[1,0],[0,2]] | 8b |
| classification: stable spiral for [[-1,-1],[1,-1]] | 8b |
| classification: unstable spiral for [[1,-1],[1,1]] | 8b |
| classification: center for [[0,-1],[1,0]] | 8b |
| classification: saddle for [[1,0],[0,-1]] | 8b |
| classification: stable star node for [[-2,0],[0,-2]] | 8b |
| classification: D≈0 from decimal arithmetic → Degenerate (zero eigenvalue) | **8c** |
| spiral dt-halving: error ratio in [12,20] (RK4 Richardson) | 8b |
| nonlinear r(1) dt-halving: error ratio in [12,20] (RK4 Richardson) | 8b |
| vectorField: every point satisfies dx=A*x (μ=0) | 8b |

### competitive-exclusion.test.js (26 tests)

| Test name | Phase |
|---|---|
| coexistence N₁* = 200/3 ±1e-10 (K=100, α=0.5) | 8 |
| coexistence N₂* = 200/3 ±1e-10 (K=100, α=0.5) | 8 |
| counterexample N₂* = -200 ±1e-10 (α₁₂=0.5, α₂₁=1.5) | 8 |
| counterexample outcome is sp1-wins | 8 |
| sp2-wins: α₁₂=1.5, α₂₁=0.5 → N₁*=-200 ±1e-10 | 8 |
| Jacobian eigenvalues at coexistence: -1 and -1/3 ±1e-10 | 8 |
| α=1 parallel nullclines: outcome = parallel | 8 |
| α=1 parallel nullclines: trajectory from (10,20) → N₁≈33.3, N₂≈66.7 ±1% | 8 |
| RK4 convergence to coexistence ±1% of N* at t=100 | 8 |
| bistable N₁* = N₂* = 40 ±1e-10 (K=100, α=1.5) | 8b |
| bistable outcome = "bistable" (α12=α21=1.5) | 8b |
| bistable Jacobian eigenvalues = +0.2 and -1 ±1e-10 | 8b |
| bistable (60,40) → sp1 wins at t=300: \|N₁−100\|<1e-6 and N₂<1e-6 | 8b→**8c** |
| bistable (40,60) → sp2 wins at t=300: \|N₂−100\|<1e-6 and N₁<1e-6 | 8b→**8c** |
| grid sweep: formula outcome matches RK4 for all deterministic α pairs | 8b→**8c** |
| coexistence dt-halving: error ratio in [12,20] (RK4 Richardson) | 8b |
| K1 ≤ 0 → RangeError | 8b |
| K2 ≤ 0 → RangeError | 8b |
| α < 0 → RangeError | 8b |
| r1≠r2: Jacobian eigenvalues = -1±1/√3 ±1e-10 (r1=1, r2=2, K=100, α=0.5) | **8c** |
| outcome string is "unknown" not "undefined" for unreachable path | **8c** |
| α21=0: nullcline2 is horizontal at K2 (no Infinity) | **8c** |
| α12=0: nullcline1 is vertical at K1 (no Infinity) | **8c** |
| α12=α21=0: outcome coexistence, N1*=K1, N2*=K2 (independent species) | **8c** |
| α21=0: trajectory → N2 converges to K2, independent of N1 ±1% | **8c** |
| K1≠K2 outcomes (K1=100, K2=50): all five cases + RK4 verification | **8c** |

### pharmacokinetics.test.js (17 tests)

| Test name | Phase |
|---|---|
| IV: C₀ = D/Vd ±1e-15 relative | 8 |
| IV: C(5h) = C₀·e^{-ke·5} ±1e-8 relative (ke=0.1) | 8 |
| IV: t½ = ln2/ke ±1e-10 relative (ke=0.1) | 8 |
| IV: AUC = C₀/ke ±1e-6 relative (ke=0.1, D=100, Vd=10) | 8 |
| IV: strictly decreasing concentration curve | 8 |
| Oral: tMax = ln(ka/ke)/(ka-ke) ±1e-10 (ka=1, ke=0.1) | 8 |
| Oral: dC/dt ≈ 0 at tMax ±1e-6 relative to C(tMax) (ka=1, ke=0.1) | 8 |
| Oral: AUC = F·D/(Vd·ke) ±1e-6 relative (F=0.8, ke=0.1, D=100, Vd=10) | 8 |
| Oral/IV: AUC_oral / AUC_IV = F ±1e-10 (F=0.8) | 8 |
| ka=ke limit: C(t) is continuous as ka→ke ±1e-6 relative (ke=ka=0.1) | 8 |
| Flip-flop symmetry: ke·C(t;ka,ke) = ka·C(t;ke,ka) ±1e-10 relative | 8 |
| Accumulation R(τ=t½) with t½=24h, τ=12h: R = 2+√2 ±1e-6 | 8 |
| ke ≤ 0 → RangeError | 8b |
| ka ≤ 0 → RangeError | 8b |
| Vd ≤ 0 → RangeError | 8b |
| F outside (0,1] → RangeError | 8b |
| Oral C(t=1e-6) vs Taylor series ±1e-14 relative (expm1 stability) | **8c** |

---

## Section 6: Formula verification

Each formula verified in `tools/anchors-phase8.mjs` (no model code). Run: `node tools/anchors-phase8.mjs`.

1. **E_n = n²π²ℏ²/(2m_eL²):** Schrödinger equation with infinite-well BC. E_1=0.376030 eV ✓. m_e = 9.1093837139e-31 kg (CODATA 2022, **fetched 2026-10-16 from physics.nist.gov**; Δ=+1.36 ppb vs CODATA 2018). ⟨x⟩_n = L/2 verified by Simpson; cdf(L,n)=1 verified; cdf(xMax>L) guard added (Phase 8c).
2. **photon λ = hc/(E_2−E_1):** hc = 1239.842 eV·nm; λ = 1239.842/(3·0.376030) ≈ 1099 nm ✓.
3. **η = 1−T_c/T_h:** COP_hp−COP_ref = T_h/W − T_c/W = 1 algebraically ✓. COP_ref(Tc=0) = Tc/(Th−Tc) = 0 verified (Phase 8c T-3). T_c,max tolerance tightened to ±1e-10.
4. **λ₂=1−p−q:** Char poly of [[1-p,p],[q,1-q]]. t_mix(0.01)=4 via exact TV formula ✓. LPW bound = tRel·ln(1/(ε·π_min)) = (1/0.7)·ln(233.33) ≈ 7.789 ✓.
5. **p=q=0.6: λ₂=−0.2 (oscillating).** Negative λ₂ means alternating-sign TV decay; not fully periodic (that requires |λ₂|=1).
6. **P+(μ=0)=0.5 and E[T]=a²/σ²:** L'Hôpital limits ✓. Continuity at μ=1e-8: residual = z²/3 ≈ 3e-17 ✓.
7. **r(t)=r₀/√(1−2μr₀²t):** Separation of variables on ṙ=μr³. r(1)=1/√3 at μ=−1, r₀=1 ✓.
8. **N* = (K₁−α₁₂K₂)/(1−α₁₂α₂₁):** Nullcline intersection. Bistable: K=100, α=1.5 → N*=40 ✓. λ_J = +0.2 and −1 ✓.
9. **C₀ = D/Vd = 100/10 = 10 mg/L** (fixed from 100). AUC_IV = 100 mg·h/L ✓. C(5h) = 6.0653 mg/L ✓.
10. **R = 1/(1−e^{-ke·τ}):** ke=ln2/24, τ=12 → R = 2+√2 ✓. Flip-flop: ke·C(t;ka,ke) = ka·C(t;ke,ka) algebraically ✓. Bateman function now uses expm1 form `exp(-ke·t)·(−expm1(-(ka−ke)·t))` for numerical stability at small t (Phase 8c F-3); small-t Taylor test ±1e-14 rel added.

---

## Section 7: Visual rules compliance

All Phase 8 view files pass no-hardcoded-colours test (theme-tokens test suite, 3/3 subtests).
Verified at HEAD by `npm test` and `npm run smoke`:

- **Colors:** All from `theme.color('--token')` (--surface, --text, --accent, --signal, --muted)
- **Background:** `c.fillStyle = theme.color('--surface'); c.fillRect(0,0,w,h)` in every Phase 8 view
- **Smoke 63/63:** dark_fill=0, surface_mismatch=0, blank=0, console_err=0

### Smoke re-run after Phase 8c close-out

Run date: **2026-10-16 18:19**. Command: `node tools/smoke.mjs`.

| Viewport | Benches | Pass | dark_fill | surface_mismatch | blank | console_err |
|---|---|---|---|---|---|---|
| light/400 | 63 | 63 | 0 | 0 | 0 | 0 |
| light/1280 | 63 | 63 | 0 | 0 | 0 | 0 |
| dark/400 | 63 | 63 | 0 | 0 | 0 | 0 |
| dark/1280 | 63 | 63 | 0 | 0 | 0 | 0 |
| **Total** | **252** | **252** | **0** | **0** | **0** | **0** |

`.claude/settings.local.json` is in `.gitignore` (committed at `07fd85a`: "chore: ignore .claude/settings.local.json"). It does not appear in `git status` tracked files.

### Extreme-slider table (Phase 8 benches)

What each bench renders at boundary/extreme parameter values:

| Bench | Extreme value | What the view shows |
|---|---|---|
| competitive-exclusion | α=0 (both species) | Two independent logistic curves; nullclines drawn as vertical (sp1) and horizontal (sp2) lines at K1, K2; no interior equilibrium point |
| competitive-exclusion | α₁₂α₂₁=1 (parallel) | Nullclines parallel; "parallel (neutral manifold)" label; trajectory drifts along nullcline |
| markov-chains | p=q=1 | Chain toggles between states; tMix=∞ shown; TV decay alternates sign (oscillating) |
| markov-chains | p=q=0 | Absorbing states; no transitions; no unique stationary distribution (null shown) |
| carnot | Tc=0 K | η=1, W=Q_h, COP_ref=0; T-S rectangle has bottom edge at 0 K; view is not degenerate (rectangle flattened to axis) |
| carnot | Tc→Th (η→0) | Very thin T-S rectangle; η≈0, W≈0; COP_hp→∞; readout shows near-zero efficiency |
| pharmacokinetics | ka=ke | Bateman limit: C(t) = A·ke·t·exp(-ke·t) (no absorption peak divergence); tMax→∞; curve has a smooth peak |
| particle-in-box | n=1..10 (max) | Wavefunction has n-1 nodes; energy ∝n²; probability density concentrated between nodes |
| drift-diffusion | μ=0 | Symmetric curves P+=0.5; E[T]=a²/σ²; random-walk regime visible in simulation |
| drift-diffusion | σ→0 (small σ) | Deterministic limit: P+→1 if μ>0; FPT→a/μ; simulation gives near-identical trials |

---

## Section 8: npm test summary

Phase 8c close-out final state:

```
# tests 756
# suites 16
# pass 756
# fail 0
# duration_ms ~1600
```

Test counts per file (phase-8c close-out state):

| File | 8 | 8b | 8c | Total |
|---|---|---|---|---|
| particle-in-box.test.js | 14 | 4 | 3 | **21** |
| carnot.test.js | 10 | 6 | 1 | **17** |
| eigen2x2.test.js | — | 6 | — | **6** |
| markov-chains.test.js | 13 | 8 | 1 | **22** |
| drift-diffusion.test.js | 10 | 0 | 2 | **12** |
| phase-plane.test.js | 10 | 10 | 1 | **21** |
| competitive-exclusion.test.js | 9 | 10 | 7 | **26** |
| pharmacokinetics.test.js | 12 | 4 | 1 | **17** |
| **Phase 8 all files subtotal** | **78** | **48** | **16** | **142** |

(78+48+16 = 142 new Phase 8 tests on top of 614 from phase-7b = 756 total)

**Count reconciliation (git diff adds vs. net new):**
- Phase-8b: `git diff` grep shows +51 `test(` lines, but 3 tests were renamed (x²_1, E[T] continuity, sim P+), so net new = 51−3 = **48**.
- Phase-8c: `git diff` grep shows +20 `test(` lines, but 5 were renames (bistable (60,40), bistable (40,60), grid-sweep, dt-halving, T_c,max), so net new = 20−5 = **15**; plus K1≠K2 added in close-out = **16** total.
- Phase-8 phase-plane split: 10 tests were in the original phase-8 commit (7 eigen2x2 + 3 orbit/classification stubs), 10 added in phase-8b (remaining labels, dt-halving, vectorField). The earlier count of 7/13 was based on a diff that included the eigen2x2 file created alongside phase-plane; correct per-file split is 10/10.

---

## Section 9: Open questions and Phase 9 items

1. **m_e CODATA 2022:** ~~RESOLVED in Phase 8c.~~ Value updated from 9.1093837015e-31 (CODATA 2018) to
   9.1093837139e-31 kg (CODATA 2022), fetched 2026-10-16 from physics.nist.gov.
   Difference: +1.36 ppb (the earlier draft claim of "≤ 0.1 ppb" was wrong — see SOURCES.md).

2. **Bateman (1910) attribution:** The Bateman function is cited in PharmacokineticsModel.js
   but not fetched. The formula itself is standard; the attribution is an academic note.
   expm1 fix now implemented and tested (Phase 8c F-3).

3. ~~**stationaryN convention (F-1):**~~ **RESOLVED (8c)** — comment aligned; test for
   non-symmetric P confirms left-eigenvector output (π·P=π) and verifies P·π≠π.

4. ~~**PhasePlaneModel D===0 (F-4):**~~ **RESOLVED (8c)** — replaced with eps-tolerance
   comparison; decimal-det test added (A=[[0.1,0.3],[0.3,0.9]] correctly classified).

5. **BGK boundary correction status:** "cited, not fetched" in three places that must agree:
   - `tools/anchors-phase8.mjs` line ~236: `'≈ 0.58264 (cited)'` ← **cited**
   - `tests/psychology/drift-diffusion.test.js` comment: "BGK correction dropped: ..." ← **cited, not fetched**
   - `docs/SOURCES.md` Drift-diffusion section: entry added in Phase 8c close-out ← **cited, not fetched**
   All three now agree on "cited, not fetched".

6. **ROADMAP / README / SOURCES update status:**
   - `docs/ROADMAP.md`: updated at `phase-8` commit (904a41f) — all 7 Phase 8 benches ✓. Not re-updated for phase-8b or phase-8c (no new benches in those phases).
   - `README.md`: updated at `phase-8` commit — all 7 Phase 8 bench rows added. Not re-updated for phase-8b or phase-8c.
   - `docs/SOURCES.md`: updated at `phase-8` commit (physics constants, biology, etc.) and again at `phase-8c` (m_e CODATA 2022 delta documented; BGK entry added in close-out).

7. **`.claude/settings.local.json` gitignore status:** File is in `.gitignore` (entry committed at `07fd85a`: "chore: ignore .claude/settings.local.json"). The file is machine-specific permission state and should not be committed.

8. **Phase 9 candidates** (from ROADMAP): entropy-mixing, stdp, cable-equation, random-walk,
   solow, opinion-dynamics, age-structure, Complex.js infrastructure.
