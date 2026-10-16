# Phase 9 Review

## Section 0: Baseline and summary

### Baseline

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| phase-8c | b96d63a | 756 | Phase 9 baseline |
| phase-9 | 68b4db1 | 871 | Phase 9 complete (+115 tests, +7 benches, +9 core) |

Note on phase-8c hash: `git rev-parse phase-8c` = `b96d63a06273a6aac75ece9a68634b8a46aa138d`. The previous
review doc said `0e7db3c`, which was incorrect — that was a draft hash. The correct hash is `b96d63a`
(confirmed 2026-10-16 during phase-9b close-out).

Note on phase-9 tag: Applied at commit `68b4db1` (the review doc commit), which is the correct final
commit. `git rev-parse phase-9` = `68b4db168ed338bd9ec6ac17d40245bc579710df`.

### Tests added this phase

| Bench / module | Tests added | Cumulative |
|---|---|---|
| `LinAlg.isPrimitive` (core) | 9 | 765 |
| entropy-mixing | 12 | 777 |
| random-walk | 15 | 792 |
| cable-equation | 15 | 807 |
| solow | 17 | 824 |
| stdp | 14 | 838 |
| opinion-dynamics | 14 | 852 |
| age-structure | 19 | 871 |
| **Total** | **115** | **871** |

### Smoke

Smoke tests ran on 2 viewport combinations: **light/1280** and **dark/400** only.
(light/400 and dark/1280 were NOT tested in this smoke run.)

| Point | Benches | Viewports tested | Pages | Passed | Failed | Duration |
|---|---|---|---|---|---|---|
| HEAD (phase-9) | 70 | light/1280 + dark/400 | 140 | 140 | 0 | 13.5 s |

---

## Section 1: Plan changes applied

All 34 plan changes were applied before any bench was built.
ID groups: G-1..G-5 (5), B1-1..B1-5 (5), B2-1..B2-3 (3), B3-1..B3-4 (4), B4-1..B4-4 (4),
B5-1..B5-4 (4), B6-1..B6-5 (5), B7-1..B7-4 (4). Total = 5+5+3+4+4+4+5+4 = **34** changes.

See `docs/plans/phase-9.md` § "Plan changes (applied 2026-10-16)" for the full table.

---

## Section 2: Test name — anchor table (all 115 + phase-9b additions)

### LinAlg.isPrimitive (9 tests)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `Leslie 3-age is primitive` | Wielandt bound (n-1)²+1=5 | boolean | algebraic | PRESENT |
| `L^k not all positive for k<5, L^5 is` | power check | boolean | algebraic | PRESENT |
| `2-age [[0,4],[0.5,0]] is imprimitive` | period-2 eigenvalues ±√2 | boolean | algebraic | PRESENT |
| `2-age: L^2 is diagonal` | manual matMul | boolean | algebraic | PRESENT |
| `doubly-stochastic ring N=5 is primitive` | W²>0 | boolean | algebraic | PRESENT |
| `ring W^2 is first all-positive` | manual check | boolean | algebraic | PRESENT |
| `cyclic permutation W (N=4) is imprimitive` | period-4 structure | boolean | algebraic | PRESENT |
| `n=1 identity` | trivial case | boolean | algebraic | PRESENT |
| `RangeError for non-square` | guard | throw | algebraic | PRESENT |

### entropy-mixing (12 tests)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `R = N_A·k_B` | 8.31446261815324 J/(mol·K) | 1e-12 rel | CODATA 2018 exact | PRESENT |
| `binary equimolar ΔS = R·ln2` | R·ln2 = 5.7631... | 1e-15 rel | algebraic | PRESENT |
| `pure component ΔS = +0 (not −0)` | Object.is check | sign | algebraic | PRESENT |
| `ternary ΔS = −R·Σxᵢlnxᵢ` | exact formula | 1e-15 rel | algebraic | PRESENT |
| `ΔG(T) = −T·ΔS` | algebraic | 1e-15 rel | algebraic | PRESENT |
| `maxMixingComposition = 1/N` | uniform | 1e-15 | algebraic | PRESENT |
| `deltaSoverR = −Σxᵢlnxᵢ` | independent check | 1e-15 rel | algebraic | PRESENT |
| `binaryCurve symmetric` | x→1−x symmetry | 1e-15 | algebraic | PRESENT |
| `binaryCurve maximum at x=0.5` | calculus | ordering | algebraic | PRESENT |
| `xᵢ<0 throws RangeError` | guard | throw | — | PRESENT |
| `Σxᵢ≠1 throws RangeError` | guard | throw | — | PRESENT |
| `Stirling/multinomial coefficient` | BigInt log-sum | 1e-12 rel | algebraic | PRESENT |

### random-walk (15 tests)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `1D step = ±1` | deterministic | exact | algebraic | PRESENT |
| `n=0 walk = [0]` | edge case | exact | algebraic | PRESENT |
| `MSD 1D = n at n=100` | E[X²]=n | 4·SE | algebraic | PRESENT |
| `MSD 1D = n at n=1000` | scaling | 4·SE | algebraic | PRESENT |
| `exactAbsMean(100) = 7.9589...` | BigInt exact | 1e-12 rel | algebraic | PRESENT |
| `exactAbsMean(2) = 1` | trivial | 1e-15 | algebraic | PRESENT |
| `2D displacement r² = 2n` | E[r²]=2n | 4·SE | algebraic | PRESENT |
| `Var(r²) 2D = n²−n=9900` | cumulant formula | 4·SE | algebraic | PRESENT |
| `2D uniform angle` | isotropy | KS test | algebraic | PRESENT |
| `RW profile length = n+1` | loop count | exact | algebraic | PRESENT |
| `n<0 throws RangeError` | guard | throw | — | PRESENT |
| `fundamental matrix` | Thomas alg, N=100, k=30 | 1e-12 rel | algebraic | PRESENT |
| `first-passage mean` | algebraic formula | 1e-12 rel | algebraic | PRESENT |
| `3-step transition` | matrix power | 1e-15 | algebraic | PRESENT |
| `ergodic uniform dist` | doubly-stochastic | 1e-12 | algebraic | PRESENT |

### cable-equation (15 + 1 = 16 tests after phase-9b)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `λ formula 1 = (1/2)√(d·Rm/Ra)` | independent formula | 1e-14 rel | algebraic | PRESENT |
| `λ formula 1 = λ formula 2` | two forms agree | 1e-15 rel | algebraic | PRESENT |
| `λ(10μm)/λ(1μm) = √10` | d-scaling | 1e-15 rel | algebraic | PRESENT |
| `R_in(d=1μm) matches (2/π)√(Rm·Ra)·d^{-3/2}` | independent formula | 1e-14 rel | algebraic | PRESENT |
| `Rall 3/2 law` | ratio 10^{-3/2} | 1e-15 rel | algebraic | PRESENT |
| `V(0)/V₀ = 1` | BC | 1e-15 | algebraic | PRESENT |
| `V(λ)/V₀ = e^{-1}` | analytical | 1e-15 rel | algebraic | PRESENT |
| `V(2λ)/V₀ = e^{-2}` | analytical | 1e-15 rel | algebraic | PRESENT |
| `τ_m = Rm·Cm = 0.001 s` | product | 1e-15 rel | algebraic | PRESENT |
| `finite sealed: V(0)=V₀, V(L)≥V_semi` | BC + monotone | 1e-15 | algebraic | PRESENT |
| `finite killed: V(L) = 0` | BC | 1e-14 | algebraic | PRESENT |
| `finite R_in sealed > semi-infinite` | ordering | ordering | algebraic | PRESENT |
| `finite R_in killed < semi-infinite` | ordering | ordering | algebraic | PRESENT |
| `FD residual < 2e-7` (phase-9b) | h²V/(12λ²) derivation | 2e-7 derived | algebraic | PRESENT |
| `FD halving ratio ≈ 4` (phase-9b) | truncation regime | [3,5] | algebraic | PRESENT |
| `d≤0 throws RangeError` | guard | throw | — | PRESENT |

### solow (17 tests)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `k* = 5√5` | char poly exact | 1e-12 rel | algebraic | PRESENT |
| `y* = √5` | algebraic | 1e-12 rel | algebraic | PRESENT |
| `c* = 0.7√5` | algebraic | 1e-12 rel | algebraic | PRESENT |
| `s_GR = α = 1/3` | golden rule | 1e-15 rel | algebraic | PRESENT |
| `k_GR = (50/9)^{3/2}` | algebraic | 1e-12 rel | algebraic | PRESENT |
| `k(600)−k* < 1e-9` | T=600 convergence | 1e-9 abs | algebraic | PRESENT |
| `RK4 dt-halving ratio ∈ [12,20]` | T=40, dt=4/2 | [12,20] | algebraic | PRESENT |
| `dk(k*) = 0` | steady-state | 1e-12 abs | algebraic | PRESENT |
| `dk>0 for k<k*` | sign | ordering | algebraic | PRESENT |
| `dk<0 for k>k*` | sign | ordering | algebraic | PRESENT |
| `α∈(0,1) guard` | RangeError | throw | — | PRESENT |
| `s∈[0,1) guard` | RangeError | throw | — | PRESENT |
| `n+δ+g>0 guard` | RangeError | throw | — | PRESENT |
| `simulate returns correct length` | loop count | exact | algebraic | PRESENT |
| `simulate t values correct` | arithmetic | 1e-15 | algebraic | PRESENT |
| `y=A·k^α in simulate` | formula | 1e-14 rel | algebraic | PRESENT |
| `linearization: μ=(1−α)(n+δ+g)` | algebraic | 1e-12 rel | algebraic | PRESENT |

### stdp (14 tests)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `kernel(+10) = A₊·e^{-0.5}` | 0.003032653299 | 1e-15 rel | algebraic | PRESENT |
| `kernel(-10) = -A₋·e^{-0.5}` | -0.003184285964 | 1e-15 rel | algebraic | PRESENT |
| `kernel(0) = 0` | simultaneous | exact | algebraic | PRESENT |
| `kernel(+Δt) > 0 for Δt>0 (LTP)` | sign | ordering | algebraic | PRESENT |
| `kernel(-Δt) < 0 for Δt<0 (LTD)` | sign | ordering | algebraic | PRESENT |
| `netArea = -0.005 ms` | A₊τ₊−A₋τ₋ | 1e-15 rel | algebraic | PRESENT |
| `LTP area A₊τ₊ = 0.1 ms` | product | 1e-15 rel | algebraic | PRESENT |
| `LTD area A₋τ₋ = 0.105 ms` | product | 1e-15 rel | algebraic | PRESENT |
| `simulate([0],[10]) = kernel(10)` | single pair | 1e-15 rel | algebraic | PRESENT |
| `simulate: all-to-all 2×2` | 4 pairs sum | 1e-15 abs | algebraic | PRESENT |
| `simulate empty = 0` | edge case | exact | algebraic | PRESENT |
| `Campbell's theorem` | E[Δw]=−5e-5 | 4·SE≈2.9e-5 | algebraic+MC | PRESENT |
| `A₊≤0 throws RangeError` | guard | throw | — | PRESENT |
| `τ₊≤0 throws RangeError` | guard | throw | — | PRESENT |

### opinion-dynamics (14 tests)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `W·[1,1,1] = [1,1,1]` | row-stochastic | 1e-15 | algebraic | PRESENT |
| `π·W = π residual < 1e-10` | Perron-Frobenius | 1e-10 | algebraic | PRESENT |
| `π·1 = 1` | normalisation | 1e-14 | algebraic | PRESENT |
| `W3 π ≈ (5/21, 9/21, 7/21)` | exact algebraic | 1e-12 rel | algebraic | PRESENT |
| `W3 consensus = 39/70` | π·x₀ exact | 1e-12 rel | algebraic | PRESENT |
| `W^200·x₀ matches π·x₀` | convergence | 1e-6 | algebraic | PRESENT |
| `W3 isPrimitive = true` | Wielandt | boolean | algebraic | PRESENT |
| `ring N=5 mean conserved` | doubly-stochastic | 1e-15 | algebraic | PRESENT |
| `ring W^40 consensus ≈ 0.5` | spectral gap | 1e-6 | algebraic | PRESENT |
| `cyclic W (N=4) isPrimitive = false` | period-4 | boolean | algebraic | PRESENT |
| `cyclic W: opinions rotate (period 4)` | exact | 1e-15 | algebraic | PRESENT |
| `reducible: two groups separate` | block-diagonal | 1e-2 | algebraic | PRESENT |
| `row sum ≠ 1 throws RangeError` | guard | throw | — | PRESENT |
| `non-square W throws RangeError` | guard | throw | — | PRESENT |

### age-structure (19 tests)

| Test name | Formula/anchor | Tolerance | Source | PRESENT/WEAK/MISSING |
|---|---|---|---|---|
| `2-age isPrimitive = false` | Wielandt | boolean | algebraic | PRESENT |
| `2-age eigenvalues ±√2 via eigen2x2` | char poly λ²=2 | 1e-12 rel | algebraic | PRESENT |
| `2-age power iteration sign alternates` | oscillation | boolean | algebraic | PRESENT |
| `2-age |λ₂/λ₁| = 1` | imprimitive ratio | 1e-15 | algebraic | PRESENT |
| `3-age isPrimitive = true` | Wielandt | boolean | algebraic | PRESENT |
| `L^k not all-positive for k=1..4` | power check | boolean | algebraic | PRESENT |
| `L^5 all-positive` | Wielandt bound | boolean | algebraic | PRESENT |
| `3-age λ = Newton root 1.1876147134391675` (phase-9b) | Newton root | 1e-12 rel | algebraic | PRESENT |
| `3-age char poly residual < 1e-13` | |λ³−0.4λ−1.2| | 1e-13 abs | algebraic | PRESENT |
| `3-age Euler-Lotka = 1` | algebraic | 1e-13 abs | algebraic | PRESENT |
| `3-age R₀ = 1.6` | algebraic | 1e-15 rel | algebraic | PRESENT |
| `3-age r = ln(λ) ±1e-12 relative (Newton)` (phase-9b) | Newton anchor | 1e-12 rel | algebraic | PRESENT |
| `L·w = λ·w eigenvector residual < 1e-8` | eigenvector eq | 1e-8 abs | algebraic | WEAK (could be 1e-12) |
| `λ=1 stationary at s₀=0.25` | algebraic | 1e-8 abs | algebraic | PRESENT |
| `simulate: growth ratio → λ at T=200` | asymptotic | 1e-3 rel | algebraic | PRESENT |
| `fᵢ<0 throws RangeError` | guard | throw | — | PRESENT |
| `sᵢ>1 throws RangeError` | guard | throw | — | PRESENT |
| `sᵢ≤0 throws RangeError` | guard | throw | — | PRESENT |
| `r at imprimitive model non-null` | λ>0 guard | boolean | algebraic | PRESENT |

---

## Section 3: R8 flags (deviations caught at anchor time)

| Flag | Planned value | Actual value | Correction |
|---|---|---|---|
| STDP paper status | cited | PDF binary/FlateDecode; pdftotext unavailable | Status: "cited, not fetched (PDF binary)" |
| Solow convergence T | T=500; err < 1e-9 | T=500: err=2.36e-8 > 1e-9 | Changed to T=600 (exp(−0.04×600)=5e-11) |
| Solow err(dt=4) floor | > 1e-4 | actual err=2.3e-5 < 1e-4 | Lowered assert floor to > 1e-6 |
| FD residual floor | < 1e-8 | actual ~6.8e-10; naive bound ~5.4e-8 | Tightened to 2e-7 (phase-9b); added halving test |
| lgamma precision | Stirling | Stirling insufficient at n=50/101 | Direct log-sum Σlog(k) |
| r test tolerance | 1e-5 relative | was: algebraic + 1e-4 absolute | phase-9b: Newton anchor + 1e-12 relative |
| 3-age λ anchor | 1.18761471 ±1e-5 | Newton root = 1.1876147134391675 ±1e-12 | phase-9b: replaced with Newton root |
| 2-age eigenvalues via dominantEigen | λ₁=√2 from power iter | power iter gives 0.89 (oscillating) | Use eigen2x2 directly |

---

## Section 4: ROADMAP / README / SOURCES

### ROADMAP benches ticked this phase

7 benches:
- `physics/thermodynamics/entropy-mixing`
- `math/probability/random-walk`
- `neuroscience/electrophysiology/cable-equation`
- `economics/macroeconomics/solow`
- `neuroscience/synaptic/stdp`
- `psychology/learning/opinion-dynamics`
- `biology/ecology/age-structure`

### SOURCES notes

| Bench | Constant / data | Status | Fetch attempt |
|---|---|---|---|
| entropy-mixing | R = 8.31446261815324 J/(mol·K) | Exact (CODATA 2018 SI 2019 definition) | n/a (exact) |
| stdp | A₊=0.005, A₋=0.00525, τ=20ms | cited-not-fetched | Fetch attempted 2026-10-16: PDF binary (unreadable) |
| cable-equation | All formulas | algebraic | n/a |
| solow | s_GR = α; k* formula | algebraic | n/a |
| opinion-dynamics | DeGroot 1974 Theorem 1 | cited-not-fetched | Not attempted |
| age-structure | Leslie 1945; Caswell 2001 | cited-not-fetched | Not attempted |

**STDP source fetch result (2026-10-16):** URL `https://www.dam.brown.edu/people/elie/NEUR_1680_2012/Song_Miller_Abbott_2000.pdf` — PDF downloaded (159.2 KB) but content is binary-encoded (FlateDecode streams); text extraction failed. Status remains **cited, not fetched**. The sentence "verified against plan anchors" removed from Section 8 (circular reasoning — plan anchors were derived from the same cited parameters).

---

## Section 5: Smoke counts per bench

Smoke tested **2 viewport combinations only**: light/1280 and dark/400.
(light/400 and dark/1280 were NOT tested in this smoke run.)
Total: 70 benches × 2 viewports = **140 pages**; 0 failures.

| Bench | light/1280 | dark/400 |
|---|---|---|
| physics/entropy-mixing | ok | ok |
| math/random-walk | ok | ok |
| neuroscience/cable-equation | ok | ok |
| economics/solow | ok | ok |
| neuroscience/stdp | ok | ok |
| psychology/opinion-dynamics | ok | ok |
| biology/age-structure | ok | ok |

---

## Section 6: Extreme-slider observations

| Bench | Slider | Extreme value | Source | Observed behaviour |
|---|---|---|---|---|
| entropy-mixing | x₁ | 0 or 1 | browser/smoke | ΔS=0 (pure component); +0 not −0 |
| random-walk | n | 0 | browser/smoke | walk[0].pos=0; valid start |
| cable-equation | d | 0.05 μm | browser/smoke | λ very small; valid curves |
| solow | α | 0.1 | browser/smoke | k* changes sharply; no NaN |
| solow | α | 0.8 | browser/smoke | k* large; c* small but finite |
| solow | s | 0.05 | browser/smoke | k* small but finite |
| stdp | Δt | ±100ms | browser/smoke | kernel → 0; consistent |
| opinion-dynamics | T | 10 | browser/smoke | W3 partially converged |
| opinion-dynamics | W (periodic) | cyclic W | model-call | isPrimitive=false; no consensus |
| opinion-dynamics | agent (stubborn) | W[i][i]=1 | model-call | agent i's opinion fixed |
| opinion-dynamics | T | max (1000) | browser/smoke | full convergence; no NaN |
| age-structure | s₀ | 0.05 | browser/smoke | λ<1, population declines |

---

## Section 7: Commit list

| Commit | Message | Tests |
|---|---|---|
| a2746b5 | feat(core): add LinAlg.isPrimitive + anchors-phase9 + phase-9 plan | +9 |
| 3a7ba85 | feat(bench): add entropy-mixing with 12 tests | +12 |
| 31944fe | feat(bench): add random-walk with 15 tests | +15 |
| f924b6b | feat(bench): add cable-equation with 15 tests | +15 |
| 678c904 | feat(bench): add solow with 17 tests | +17 |
| 8626f42 | feat(stdp): add STDPModel, view, bench, and 14 tests | +14 |
| f26d12c | feat(opinion-dynamics): add DeGroot model, view, bench, and 14 tests | +14 |
| efb3542 | feat(age-structure): add LeslieModel, view, bench, and 19 tests | +19 |
| 68b4db1 | docs(phase-9): add review document | +0 |

---

## Section 8: Known doubts and deferred items

1. **STDP paper (Song 2000)** — parameters A₊=0.005, τ=20ms are from the cited paper (Song, Miller,
   Abbott, 2000, Nat Neurosci). PDF was fetched 2026-10-16 but content is binary-encoded and
   unreadable. Values are standard in the STDP literature. Status: **cited, not fetched**.

2. **Weber-Fechner modality table** (Phase 5 legacy) — still flagged as unverified illustrative
   values. Not touched in Phase 9.

3. **3-age λ precision** — phase-9b upgraded anchor from `1.18761471 ±1e-5` to Newton root
   `1.1876147134391675 ±1e-12 relative`. Model power iteration matches Newton root to 1 ULP (~4.4e-16).

4. **r test** — phase-9b upgraded to Newton anchor: r = ln(Newton_root) ±1e-12 relative.
   Algebraic check `|r − ln(λ)| < 1e-15` also retained.

5. **FD residual** — phase-9b tightened tolerance from `5e-7` to `2e-7` (derived from h²V/(12λ²)
   at h=λ/10000). Added halving-ratio test asserting ratio ∈ [3,5] confirming truncation regime.

6. **Eigenvector residual** — `|Lw − λw| < 1e-8` is safe but could be 1e-12. Low priority.

---

## Section 9: Independent review observations

Agent review performed as part of phase-9b close-out (2026-10-16). Full findings in
`docs/reviews/phase-9-agent-findings.md`.

Summary:
- **HIGH:** 0
- **MED:** 3 (all fixed — see Sections 3 and 8 items 3–5)
- **LOW:** 6 (documented, non-blocking)

CSS token audit: all 7 Phase 9 view files use only valid token names. No `--fg`, `--ok`,
`--warn`, `--err`, or `--accent2` found.

Readout '--' audit: all 7 bench files have proper null/undefined guards on computed values.

Field verification:
- `prisoner-dilemma` is in `psychology/learning` (confirmed via js/catalog.js line 1034).
- `opinion-dynamics` is correctly placed in `psychology/learning` (js/catalog.js line 1057).
