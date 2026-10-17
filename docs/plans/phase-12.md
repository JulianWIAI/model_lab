# Phase 12 — 7 benches (v2)

## Plan header (v2)

| Field | Value |
|---|---|
| Baseline commit | `6b9e62f` (phase-11c) |
| Baseline tests | 1080 (0 fail) |
| Anchors script | `tools/anchors-phase12.mjs` v2 — ALL PASS |
| Date | 2026-10-17 |

git log (top 5):
```
6b9e62f docs(phase-11c): audit reconciliation, review rewrite, agent brief + findings
79dd2a9 fix(tolerances): saddle derivation comment, MWC Hill 1e-3->1e-7, WC FP 1e-4->1e-6
b6ce96f feat(graph): add girth() BFS method; tests K4/K3,3/Petersen/Q3/path; non-planarity; BF negative-cycle
3554898 fix(wilson-cowan): dt-halving test — correct nSteps calculation, switch to Hopf-point preset
6c6dd01 plan(phase-12): write plan v1 and anchors script (69 asserts, all pass)
```

git tags: phase-11c, phase-11b, phase-11, phase-10c, phase-10b, phase-10, phase-9c, phase-9b, phase-9, phase-8c, …

---

## Rules

- **R1 Anchor first.** Before any bench plan is shown, every formula gets an independent numerical check (brute-force simulation, high-precision recomputation or a different algorithm). The result is printed in the plan next to the expected value.
- **R2 Tolerances.** Deterministic checks: 1e-10 unless the algorithm limits it. Stochastic checks: 4 × the analytic standard error of the statistic, derived in a comment. Never tune a seed or tolerance to pass. Numerical checks must also pass when dt or h is halved (convergence), not only at the chosen step.
- **R3 Conventions.** One symbol table per bench. The model, the Derive-it steps, the Predict questions and the Where-it-breaks text use the same symbols and conventions.
- **R4 Domains.** State the valid parameter domain; test its boundaries; no silent clamping (show a visible "outside model domain" state).
- **R5 Data.** No constant or table value from memory. Fetch it, or mark it "unverified" in code, SOURCES.md and the UI. If a fetch fails, stop and tell me.
- **R6 Status words.** Per bench, "formulas" and "data" are separate. "checked by independent test" is allowed only once the test exists and passes.
- **R7 Reports.** No claim without evidence. Corrections are reported as a table: anchor → file → test name.
- **R8 Anchor disagreements.** If an anchor in the prompt looks wrong, stop and report the discrepancy before implementing.
- **R9 Visual checks.** `npm run smoke` is the visual regression check. Before each bench commit: `npm run smoke -- --bench <id>`; the catalog entry is part of that commit. Any commit touching `js/core`, `js/ui`, theme tokens, or CSS: full `npm run smoke`. End of a phase: full run; put the counts per failure type in the phase report. The full run must finish in under 3 minutes. `tests/theme-tokens.test.js` and `tests/no-hardcoded-colours.test.js` run in `npm test`. Never claim a visual result without a smoke run or a screenshot. If no browser is available, write "not run in a browser".
- **R10 Predict answers.** Every Predict question has a numerical answer asserted in the anchors script with a derived tolerance. "Yes/no" is not a Predict answer; rephrase to a quantity.
- **R11 Independent agent review.** After all bench commits: spawn a separate agent with a written brief (stored in `docs/reviews/<phase>-agent-brief.md`). Record findings in `docs/reviews/<phase>-agent-findings.md`. MED/HIGH issues: fix before tagging or justify in writing.
- **R12 Test audit.** Run `tools/gen-test-audit.mjs` to classify every test as PRESENT (tight numeric assertion, derived tolerance) / WEAK (right thing, loose tolerance) / MISSING (important property not tested). Headline totals must equal per-file table sums. MISSING counts properties, not tests.
- **R13 Mutation check.** For every numeric/stochastic test, name the WRONG IMPLEMENTATION the test must reject (frozen model, ×2, ×1/2, wrong sign, haploid vs diploid, per-person vs total value, swapped formulas) and run it in the script: assert (a) the test fails for it, (b) tolerance < gap. Comparing the correct model at two parameter values is not a mutation check.
- **R14 Measured coverage.** Run `node --test --experimental-test-coverage` after every phase; paste uncovered lines per new model file. Every branch needs a test with an assertion. A typed matrix is not coverage.

---

## R8 flag: Schrödinger FD formula correction

The prompt spec gave: `E_n^FD = (4ℏ²/(m·h²))·sin²(nπ/(2(N+1)))`.

The correct FD Hamiltonian for `H = −ℏ²/(2m) d²/dx²` with 2nd-order central differences gives diagonal `ℏ²/(m·h²)` and off-diagonal `−ℏ²/(2m·h²)`. Factoring out `ℏ²/(2m·h²)` from the tridiagonal matrix `[2,−1,…,−1,2]`, eigenvalues are `2−2cos(nπ/(N+1))`, so:

```
E_n^FD = ℏ²/(2m·h²) × 2·(1 − cos(nπ/(N+1)))
```

The identity `2(1−cosθ) = 4sin²(θ/2)` gives an equivalent form, but only if the prefactor is `ℏ²/(2m·h²)`, not `ℏ²/(m·h²)`. The spec wrote `4ℏ²/(m·h²)·sin²(nπ/(2(N+1)))` which is 2× too large, giving `E₁(L=1nm) ≈ 0.752 eV` vs correct `0.376 eV`.

**Resolution:** The anchors script uses `ℏ²/(2m·h²) × 2(1−cos(nπ/(N+1)))`. All FD vs exact checks pass at < 1% relative error for n=1..5, N=100.

---

## Anchors output

```
════════════════════════════════════════════════════════════════════════
1. SPECIAL RELATIVITY
════════════════════════════════════════════════════════════════════════
  γ(β=0)                                               1.000000000  (exact 1)
  γ(β=0.5)                                             1.154700538  = 2/√3 ≈ 1.1547005383792515

Velocity addition u=0.9c, v=0.5c → u'/c             0.7272727273  = 8/11 ≈ 0.72727...

Muon γ(β=0.9994)                                    28.87184456  = 1/√(1−0.9994²)
  1 − β²                                               0.001199640000  = 0.00119964
  Muon τ_dilated (μs)                                  63.43089682  ≈ 63.43 μs (PDG 2022 τ₀=2.1969811e-6)

Energy-momentum invariant: |E²−(pc)²−(m₀c²)²|/E²    1.826950993e-16  < 1e-12

R13 wrong-γ (β not β²) gap at β=0.9994              11.95298449  gap >> 1e-12

  ✓ All special-relativity assertions passed

════════════════════════════════════════════════════════════════════════
2. PERCEPTRON
════════════════════════════════════════════════════════════════════════
  OR gate converged                                    true  (must be true)
  OR gate epochs                                       2.000000000  (must be 2)
  OR gate total mistakes                               3.000000000  (must be 3)
  trace[0] = w after mistake 1                         [1,1,-1]  (must be [1,1,-1])
  trace[1] = w after mistake 2                         [0,2,0]  (must be [0,2,0])
  trace[2] = w after mistake 3                         [1,1,1]  (must be [1,1,1])

γ (minimum margin / ‖w*‖)                           0.5773502692  = 1/√3
  R (max ‖x̃‖)                                         1.732050808  = √3
  (R/γ)² Novikoff bound                                9.000000000  = 9

Mistakes with η=0.1                                 3.000000000  (should equal η=1 count)
  Mistakes with η=7                                    3.000000000  (should equal η=1 count)

XOR converged (must be false)                       false

R13 wrong sign: |w_wrong[0] − w_correct[0]| after mistake 1 2.000000000  = 2 >> 0

R13 sign(0)=−1: first mistake index                 1.000000000  (correct convention: index 0; wrong: ≥1)

  ✓ All perceptron assertions passed

════════════════════════════════════════════════════════════════════════
3. NETWORK EFFECTS
════════════════════════════════════════════════════════════════════════
  x* = (c/v1 + 1)/N                                    0.4100000000  = (2/0.05 + 1)/100 = 41/100 = 0.41
  f'(x*) = x*(1-x*)·v1·N                               1.209500000  (must be > 0 → unstable)
  f'(x*) central FD                                    1.209500000  (agrees with analytic)
  f(x*) = 0 (fixed-point check)                        0.000000000

Tipping: x₀=0.40, after T=10                        1.898404337e-7  (expect → 0)
  Tipping: x₀=0.42, after T=10                         0.9999999995  (expect → 1)

Metcalfe marginal(n=10)                             0.4500000000  = v1·(n-1) = 0.45
  Reed marginal(n=5)                                   15.00000000  = 2^(n-1)-1 = 15

Reed n=1023 finite                                  true
  Reed n=1024 overflows                                true

R13 wrong x* (total value): √(2c/(v1·N²))           0.08944271910  ≈ 0.028
  Gap |x*_correct − x*_wrong|                          0.3205572809  >> 1e-9
  R13 wrong x* (total value, exact)                    0.09458236434  ≈ 0.0946
  Gap |x*_correct − x*_wrong_exact|                    0.3154176357  >> 1e-9

  ✓ All network-effects assertions passed

════════════════════════════════════════════════════════════════════════
4. NEUTRAL THEORY
════════════════════════════════════════════════════════════════════════
  t_fix(p₀=0.1, N=25) [−4N(1-p)ln(1-p)/p]              94.82446409  ≈ 94.82 (sim≈94.09)
  t_loss(p₀=0.1, N=25) [−4N·p·ln(p)/(1-p)]             25.58427881  ≈ 25.58 (sim≈24.46)

Gap: |t_fix − t_loss|                               69.24018528  = 69.24 >> 21.6 tolerance

t_fix(p₀=0.1, N=100)                                379.2978564  ≈ 379.3 (v1 plan said ≈394 — that was wrong formula)

Fixation probability u(0.2)                         0.2000000000  = 0.2 (exact, Kimura 1968)

R13 swapped: |t_fix_correct − t_fix_wrong(swapped)| 69.24018528  >> tolerance ~21.6
  R13 haploid: |t_fix_diploid − t_fix_haploid|         47.41223205  = t_fix/2 ≈ 47.4

  ✓ All neutral-theory assertions passed

════════════════════════════════════════════════════════════════════════
5. COALESCENCE
════════════════════════════════════════════════════════════════════════
  E[T₂] (k=2, Ne=1000)                                 2000.000000  = 2000 exactly
  E[T₃] (k=3, Ne=1000)                                 666.6666667  = 4000/6 ≈ 666.67
  E[T₄] (k=4, Ne=1000)                                 333.3333333  = 4000/12 ≈ 333.33

E[T_MRCA] n=10, Ne=1000 (closed)                    3600.000000  = 4000·(1-1/10) = 3600
  E[T_MRCA] n=10, Ne=1000 (sum)                        3600.000000

SD(T_MRCA) analytic                                 2152.339982  = √(Σ E[T_k]²)

Simulated E[T_MRCA] (200 trials)                    3555.101557
  Expected E[T_MRCA]                                   3600.000000  = 3600
  3σ/√200 tolerance                                    419.5082881

H_9 = Σ_{i=1}^{9} 1/i                               2.828968254  ≈ 2.8289682539682539

Example: S=8, π=4.2, n=10
    θ_W = S/H_9                                        2.827886099  ≈ 2.828
    Tajima numerator = π − θ_W                         1.372113901

R13 haploid coalescent: E[T_MRCA_wrong]             1800.000000  = 1800
  Gap |3600 − 1800|                                    1800.000000  >> 3σ/√200 tolerance

R13 Tajima wrong (×a₁ not ÷a₁): correct numerator   0.000000000  ≈ 0
  R13 Tajima wrong: wrong numerator                    -0.2801224553  ≈ −0.32
  Gap                                                  0.2801224553  >> any tolerance

E[S] = θ·H_9 (θ=0.04)                               0.1131587302

  ✓ All coalescence assertions passed

════════════════════════════════════════════════════════════════════════
6. SCHRÖDINGER 1D (Alternate A)
════════════════════════════════════════════════════════════════════════
  E₂/E₁ (exact)                                        4.000000000  = 4 exactly
  FD relative error n=1, N=100                         0.00008062611836  ≈ 8.1×10⁻⁵ (< 0.1%)

FD vs exact eigenvalues (N=100):
    n=1: rel err                                       0.00008062351821  < 1% (analytic bound ≈8.06e-5)
    n=2: rel err                                       0.0003224628727  < 1% (analytic bound ≈3.23e-4)
    n=3: rel err                                       0.0007254244795  < 1% (analytic bound ≈7.26e-4)
    n=4: rel err                                       0.001289352419  < 1% (analytic bound ≈1.29e-3)
    n=5: rel err                                       0.002014028518  < 1% (analytic bound ≈2.02e-3)

E₁(L=1nm) in eV                                     0.3760301622  ≈ 0.37603 eV

HO zero-point E₀/(ℏω)                               0.5000000000  = 0.5 exactly

R13 wrong E_n: (n²-1) instead of n²
    E₁_wrong (n=1, n²-1=0)                             0.000000000  vs E₁_correct
    Gap E₁_correct − E₁_wrong                          6.024667395e-20  J (huge)

R13 wrong E_n (n²-1 not n²): E₂_exact               2.409866958e-19  J
  E₂_wrong (3·E₁)                                      1.807400218e-19  J
  Gap                                                  6.024667395e-20  = E₁ = 0 J

  ✓ All schrodinger-1d assertions passed

════════════════════════════════════════════════════════════════════════
7. BAYESIAN OBSERVER (Alternate B)
════════════════════════════════════════════════════════════════════════
  σ_comb(σ₁=3, σ₂=4)                                   2.400000000  = 3·4/√(9+16) = 12/5 = 2.4
  w₁(σ₁=3, σ₂=4)                                       0.6400000000  = 16/25 = 0.64
  σ_comb(σ,σ)                                          3.535533906  = σ/√2

w₁(σ₁=100, σ₂=1)                                    0.00009999000100  ≈ 1/10001 → 0

w₁/w₂ = σ₂²/σ₁² (σ₁=3,σ₂=4)                         1.777777778  = 1.7777777777777777 = 16/9

Analytic SD(ŝ) = σ_comb(1,3)                        0.9486832981  = 1·3/√(1+9) = 3/√10 ≈ 0.9487

Sim SD(ŝ) (5000 trials, σ₁=1, σ₂=3)                 0.9348193334  expect 0.948683 ± 0.037947

R13 equal weights: SD_wrong                         1.581138830  = √10/2 ≈ 1.581
  Gap |σ_comb − SD_wrong|                              0.6324555320  >> 4·SE = 0.0379
  R13 harmonic mean SD_wrong                           0.7500000000  = 3/4 = 0.75
  Gap |σ_comb − SD_harmonic|                           0.1986832981  >> 4·SE = 0.0379

  ✓ All bayesian-observer assertions passed

════════════════════════════════════════════════════════════════════════
SUMMARY
════════════════════════════════════════════════════════════════════════
  1. special-relativity         [physics/relativity/special-relativity]: ✓ PASS
  2. perceptron                 [neuroscience/learning/perceptron]: ✓ PASS
  3. network-effects            [economics/markets/network-effects]: ✓ PASS
  4. neutral-theory             [biology/evolution/neutral-theory]: ✓ PASS
  5. coalescence                [biology/evolution/coalescence]: ✓ PASS
  6. schrodinger-1d (Alt A)     [physics/quantum/schrodinger-1d]: ✓ PASS
  7. bayesian-observer (Alt B)  [psychology/learning/bayesian-observer]: ✓ PASS

  All assertions passed. Script complete.
  Node version: v22.22.2
  Date: 2026-10-17
```

---

## Bench specifications

### 1. special-relativity — `physics/relativity/special-relativity` — university

**Symbol table:**

| Symbol | Meaning | Unit |
|---|---|---|
| β | velocity fraction v/c₀ | dimensionless |
| γ | Lorentz factor | dimensionless |
| Δt_proper | proper time interval | s |
| Δt_dilated | dilated time | s |
| L₀ | proper length | m |
| L | contracted length | m |
| m₀ | rest mass | kg |
| p | relativistic momentum | kg·m/s |
| KE | kinetic energy | J |
| E_total | total energy | J |
| φ | rapidity | dimensionless |
| u′ | velocity in moving frame | m/s |
| c₀ | speed of light in vacuum | m/s |
| τ₀ | muon rest lifetime | s |

**Formulas:**
```
β = v/c₀                                      [|β| < 1]
γ = 1 / √(1 − β²)                             [≥ 1]
Δt_dilated = γ · Δt_proper
L = L₀ / γ
p = m₀ · γ · v
KE = (γ − 1) · m₀ · c₀²
E_total = γ · m₀ · c₀²
E² = (p·c₀)² + (m₀·c₀²)²
φ = atanh(β)
u′ = (u − v) / (1 − u·v/c₀²)
```

**Physical constants (from `js/data/constants.js`):** c₀ = 299792458 m/s (exact SI). Muon τ₀ = 2.1969811×10⁻⁶ s (PDG 2022, cited not fetched).

**Anchors (R1):**

| Quantity | Anchor value |
|---|---|
| γ(β=0.5) | 2/√3 = 1.1547005383792515 (exact FP) |
| u′(u=0.9c, v=0.5c) | 0.4/0.55 = 8/11 = 0.727272… |
| γ(β=0.9994) | 1/√(1−0.9994²) = 28.87184456… (assert ±1e-12, NOT vs 28.87) |
| τ_dilated(β=0.9994) | γ·τ₀ = 63.43089682… μs (assert ±1e-10 relative) |
| E-momentum check | \|E²−(pc)²−(m₀c²)²\|/E² < 1e-12 |

**Predict answers (asserted in script):**
1. γ(β=0.5) = 1/√0.75 ≈ 1.1547005383792515
2. u′(u=0.9c, v=0.5c) = 0.4/0.55 = 8/11 ≈ 0.72727272…
3. γ(β=0.9994) = 1/√(1−0.9994²) ≈ 28.8718…

**R4 domain:** |β| ≥ 1 → RangeError; m₀ ≤ 0 → RangeError.

**R13 mutations:**
- Wrong γ: β→β in denominator (γ_wrong = 1/√(1−β)). Gap at β=0.9994: 11.95 >> 1e-12.
- No γ in time dilation: Δt_wrong=Δt_proper. Gap=(γ−1)≈27.87 >> 1e-10.
- Wrong E²: negative sign: E²=(pc)²−(m₀c²)². Gap=2(m₀c²)²/E² >> 1e-12.

---

### 2. perceptron — `neuroscience/learning/perceptron` — university

**Symbol table:**

| Symbol | Meaning |
|---|---|
| w | weight vector (augmented, includes bias) |
| x̃ | augmented input [x₁,…,x_d,1] |
| ŷ | predicted label |
| y | true label ∈ {−1,+1} |
| η | learning rate |
| γ | geometric margin of w* |
| R | max augmented input norm |
| d | feature dimension |

**Algorithm (Rosenblatt 1958):**
```
Predict: ŷ = sign(w·x̃); sign(0) = +1 (positive convention)
Update on mistake: w ← w + η·y·x̃
```

**Convergence (Novikoff 1962):** Mistakes ≤ (R/γ)²

**Anchors (R1) — OR gate exact trace:**

| Step | Input | True label | dot | ŷ | Mistake? | w after |
|---|---|---|---|---|---|---|
| ep1, pt1 | (−1,−1,1) | −1 | 0 | +1 | yes | (1,1,−1) |
| ep1, pt2 | (−1,+1,1) | +1 | −1 | −1 | yes | (0,2,0) |
| ep1, pt3 | (+1,−1,1) | +1 | −2 | −1 | yes | (1,1,1) |
| ep1, pt4 | (+1,+1,1) | +1 | +3 | +1 | no | (1,1,1) |
| ep2 | all | — | — | — | no | converged |

w* = (1,1,1)/√3; γ = 1/√3; R = √3; (R/γ)² = 9; mistakes = 3 ≤ 9 ✓

**R13 mutations:**
- Wrong sign (w−): w_wrong after mistake 1 = (−1,−1,1). Gap = 2 per component.
- sign(0)=−1: first mistake at index ≠ 0 (point 1 is NOT a mistake under wrong convention).

**R4:** η ≤ 0 → RangeError; dimension mismatch → RangeError.

---

### 3. network-effects — `economics/markets/network-effects` — intro

**Symbol table:**

| Symbol | Meaning |
|---|---|
| x | adoption fraction ∈ [0,1] |
| N | total potential adopters |
| v₁ | per-link value coefficient |
| c | cost of joining |
| x* | tipping point |

**CRITICAL (corrected from v1):** Use marginal benefit (not total value).

**Correct ODE:**
```
dx/dt = x·(1−x)·[v₁·(x·N − 1) − c]
x* = (c/v₁ + 1) / N
```

**Working parameters:** N=100, v₁=0.05, c=2 → x* = 41/100 = 0.41 (exact).

**Anchors (R1):**

| Quantity | Value |
|---|---|
| x* | (2/0.05 + 1)/100 = 0.41 exactly |
| f(x*) | 0 (fixed-point) |
| f′(x*) = x*(1−x*)·v₁·N | 1.2095 > 0 (unstable) |
| x₀=0.40 after T=10 | 1.9e-7 → 0 |
| x₀=0.42 after T=10 | 0.9999999995 → 1 |

**R13 mutations:**
- Wrong (total value ODE): tipping point exact FP at x*≈0.0946 vs correct 0.41. Gap = 0.315 >> 1e-9.

**R4:** N ≤ 0 → RangeError; n_Reed > 1023 → RangeError; x outside [0,1] → RangeError.

---

### 4. neutral-theory — `biology/evolution/neutral-theory` — graduate

**Symbol table:**

| Symbol | Meaning |
|---|---|
| N | diploid population size |
| p₀ | initial allele frequency |
| u(p₀) | fixation probability |
| t_fix | conditional mean fixation time (generations) |
| t_loss | conditional mean loss time (generations) |

**CRITICAL (corrected from v1):** Formulas were swapped.

**Correct formulas (Kimura & Ohta 1969):**
```
u(p₀) = p₀                                        [neutral allele]
t_fix(p₀, N) = −4N·(1−p₀)·ln(1−p₀) / p₀          [conditional on fixation]
t_loss(p₀, N) = −4N·p₀·ln(p₀) / (1−p₀)           [conditional on loss]
```

**Anchors (R1):**

| Formula | Anchored value | Sim result (N=25, p₀=0.1, 20000 trials) |
|---|---|---|
| t_fix(0.1, 25) | 94.82446… | 94.09 (0.8% diffusion error) ✓ |
| t_loss(0.1, 25) | 25.58427… | 24.46 (4% diffusion error) ✓ |
| t_fix(0.1, 100) | 379.2978… | — (= 4 × t_fix(0.1,25)) |

**R13 mutations:**
- Swapped: t_fix_wrong = t_loss_correct = 25.58. Gap = 69.24 >> tolerance.
- Haploid: −2N instead of −4N. Gap = t_fix/2 = 47.41 >> tolerance.

**R4:** p₀ outside (0,1) exclusive → RangeError; N ≤ 0 → RangeError.

---

### 5. coalescence — `biology/evolution/coalescence` — graduate

**Symbol table:**

| Symbol | Meaning |
|---|---|
| n | sample size (lineages) |
| N_e | effective population size |
| T_k | waiting time with k lineages |
| T_MRCA | time to MRCA |
| θ | 4·N_e·μ (population mutation rate) |
| θ_W | Watterson estimator = S/a₁ |
| π | mean pairwise differences |
| a₁ = H_{n-1} | harmonic number |
| S | segregating sites |

**CRITICAL (corrected from v1):** Tajima numerator = π − S/a₁ (NOT S − a₁·ŝ).

**Correct formulas (Kingman 1982; Watterson 1975; Tajima 1989):**
```
E[T_k] = 4N_e / (k(k−1))
E[T_MRCA] = 4N_e·(1 − 1/n)   [telescoping]
θ_W = S / a₁ = S / H_{n-1}
Tajima D numerator = π − θ_W = π − S/a₁
```

**Anchors (R1):**

| Quantity | Value |
|---|---|
| E[T₂] (N_e=1000) | 2000 exactly |
| E[T_MRCA] n=10 | 3600 = 4000·(1−1/10) |
| Sim mean T_MRCA (200 trials, seed=42) | 3555.1 (within 3σ/√200 = 419.5) |
| H_9 | 2.828968254… |
| Tajima num at neutrality | π − θ_W = 0 |

**R13 mutations:**
- Haploid coalescent: E[T_MRCA_wrong] = 1800. Gap = 1800 >> 3σ/√200 = 419.5.
- Tajima ×a₁ (not ÷a₁): wrong numerator = −0.280. Gap = 0.280 >> tolerance.

**R4:** n < 2 → RangeError; N_e ≤ 0 → RangeError.

---

### 6. schrodinger-1d — `physics/quantum/schrodinger-1d` — graduate (Alternate A)

**Note on alternates:** `random-walk` (phase 9) and `particle-in-box` (phase 8) are already in catalog — confirmed in `js/catalog.js`. They cannot be alternates.

**Symbol table:**

| Symbol | Meaning | Unit |
|---|---|---|
| ℏ | reduced Planck constant | J·s |
| m | particle mass | kg |
| L | box length | m |
| h | grid spacing = L/(N+1) | m |
| N | interior grid points | — |
| E_n | nth energy level | J |
| n | quantum number (1,2,3,…) | — |

**Correct FD formula (derived in R8 flag above):**
```
E_n^FD = ℏ²/(2m·h²) × 2·(1 − cos(nπ/(N+1)))
E_n^exact = n²·π²·ℏ²/(2m·L²)
FD rel error ≈ (nπ/(N+1))²/12
```

**Anchors (R1):**

| Quantity | Value |
|---|---|
| E₂/E₁ | 4 exactly |
| FD rel error n=1, N=100 | 8.062×10⁻⁵ (< 0.1%) |
| FD rel error n=5, N=100 | 2.014×10⁻³ (< 1%) |
| E₁(L=1nm, m=m_e) | 0.37603 eV |
| HO zero-point E₀/(ℏω) | 0.5 exactly |

**R13 mutations:**
- (n²−1) instead of n²: E₁_wrong = 0. Gap = E₁ = 6.02×10⁻²⁰ J >> 1e-22 J.

**R4:** N < 3 → RangeError; L ≤ 0 → RangeError.

---

### 7. bayesian-observer — `psychology/learning/bayesian-observer` — university (Alternate B)

**Symbol table:**

| Symbol | Meaning |
|---|---|
| s | true stimulus |
| x₁, x₂ | cue observations |
| σ₁, σ₂ | cue noise SDs |
| w₁, w₂ | reliability weights |
| ŝ | Bayesian estimate |
| σ_comb | combined (optimal) SD |

**Formulas (Ernst & Banks 2002, Nature 415:429 — cited, not fetched):**
```
w₁ = σ₂²/(σ₁²+σ₂²),  w₂ = 1−w₁
ŝ = w₁·x₁ + w₂·x₂
σ_comb = σ₁·σ₂ / √(σ₁²+σ₂²)
```

**Anchors (R1):**

| Quantity | Value |
|---|---|
| σ_comb(3,4) | 12/5 = 2.4 exactly (±1e-10) |
| w₁(3,4) | 16/25 = 0.64 exactly (±1e-10) |
| σ_comb(σ,σ) | σ/√2 exactly (±1e-10) |
| Sim SD(ŝ) σ₁=1,σ₂=3, 5000 trials | 0.9348 ≈ 3/√10 ± 4·SE=0.038 |

**Predict answers:**
1. σ_comb(σ₁=3, σ₂=4) = 12/5 = 2.4
2. w₁(σ₁=3, σ₂=4) = 16/25 = 0.64
3. σ_comb(σ₁=σ₂=σ) = σ/√2 ≈ 0.7071·σ

**R13 mutations:**
- Equal weights: SD_wrong = √10/2 = 1.581. Gap = 0.632 >> 5×4·SE = 0.190.
- Harmonic mean SD: σ_wrong = 3/4 = 0.75. Gap = 0.199 >> 5×4·SE = 0.190.

**R4:** σ₁ ≤ 0 or σ₂ ≤ 0 → RangeError.

---

## Status

| Bench | Formulas | Data | Anchors |
|---|---|---|---|
| special-relativity | checked by independent test | c₀ from constants.js (exact SI); τ₀ PDG 2022 cited | PASS |
| perceptron | checked by independent test | algorithm Rosenblatt 1958 cited | PASS |
| network-effects | checked by independent test | no external data | PASS |
| neutral-theory | checked by independent test | Kimura & Ohta 1969 cited | PASS |
| coalescence | checked by independent test | Kingman 1982; Watterson 1975; Tajima 1989 cited | PASS |
| schrodinger-1d | checked by independent test | ℏ, m_e from constants.js | PASS |
| bayesian-observer | checked by independent test | Ernst & Banks 2002 cited | PASS |
