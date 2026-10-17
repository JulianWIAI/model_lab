# Phase 12 — 7 benches

## Plan header (v1)

| Field | Value |
|---|---|
| Baseline commit | `3bd0c37` (phase-11b) |
| Baseline tests | 1071 (0 fail) |
| Anchors script | `tools/anchors-phase12.mjs` v1 — 69 asserts ALL PASS |
| Date | 2026-10-17 |

git log (top 5):
```
3bd0c37 docs(phase-11b): update baseline table with final commit hash 74423d3
74423d3 docs(phase-11b): review rewrite, checklist, findings with dispositions, audit update
f6c4dad tools(anchors): phase-11 v5 with R13 mutation checks
e17d769 fix(coverage): add tests for uncovered branches in R14 model files
2420a64 fix(weak): WC FP positions/saddle instability/lc amplitude; pop-coding σ-scaling; MWC Hill/saturation
```

git tags: phase-11b, phase-11, phase-10c, phase-10b, phase-10, phase-9c, phase-9b, phase-9, phase-8c, phase-8b, …

---

## ROADMAP note

Navigation at 400 px pushes the bench list several screens below the fold; UI/UX pass planned for a later project (see ROADMAP.md Open UI/UX items).

---

## Context

Phase 12 adds 7 benches from the ROADMAP Phase 12 allocation: special-relativity (physics/mechanics, university), perceptron (neuroscience/learning, university), network-effects (economics/markets, intro), neutral-theory (biology/evolution, graduate), coalescence (biology/evolution, graduate), plus two alternates: random-walk (math/probability, intro) and particle-in-box (physics/quantum, intro — already exists in catalog and is scheduled Phase 8 in ROADMAP but spec'd here as an alternate if a fully-specified bench hits an R8 wall).

Catalog additions required:
- `physics/relativity/special-relativity` — new field `relativity` under `physics`
- `neuroscience/learning/perceptron` — new field `learning` under `neuroscience`
- `economics/markets/network-effects` — add to existing `markets` field under `economics`
- `biology/evolution/neutral-theory` — add to existing `evolution` field under `biology`
- `biology/evolution/coalescence` — add to existing `evolution` field under `biology`
- `math/probability/random-walk` — add to existing `probability` field under `math` *(already in catalog)*
- `physics/quantum/particle-in-box` — add to existing `quantum` field under `physics` *(already in catalog)*

---

## Rules

R1–R14 apply. Key rules for Phase 12:
- R3: every symbol table entry must state unit and typical range.
- R4: every finite domain must have a named RangeError test.
- R8: formulas derived from first principles; no memorised constants; CODATA 2018 values cited.
- R13: for each stochastic test, the gap between the correct value and a trivially-wrong value must exceed the test tolerance by a factor ≥ 3.
- R14: branch coverage matrix required per bench.

---

## Bench 1 — special-relativity

### A. Path, level, catalog field

| Field | Value |
|---|---|
| Catalog path | `physics/relativity/special-relativity` |
| Level | university |
| New field | `relativity` (id: `relativity`, name: `Relativity`) under `physics` |
| navLabel | `Special relativity` |
| keywords | special relativity, Lorentz factor, time dilation, length contraction, relativistic energy, E=mc², rapidity, four-momentum, muon, velocity addition |

### B. Model class and equations

State: `{beta, m0, c0}` where `beta = v/c₀`, `m0` is rest mass, `c0 = 299792458 m/s` (exact).

```
β = v / c₀                                  domain: |β| < 1
γ = 1 / √(1 − β²)                           Lorentz factor; γ ≥ 1
Δt_dilated = γ · Δt_proper                  time dilation
L = L₀ / γ                                  length contraction
p = m₀ · γ · v                              relativistic momentum
KE = (γ − 1) · m₀ · c₀²                    kinetic energy
E_total = γ · m₀ · c₀²                      total energy (includes rest mass)
E² = (p·c₀)² + (m₀·c₀²)²                   energy-momentum relation (invariant)
φ = atanh(β)                                rapidity
γ = cosh(φ),  βγ = sinh(φ)
u' = (u − v) / (1 − u·v/c₀²)              relativistic velocity addition
```

**Muon example** (β = 0.9994):
```
1 − β² = 1 − 0.9994² = 1 − 0.99880036 = 0.00119964
γ = 1/√0.00119964 = 28.872…
```
Muon rest lifetime τ₀ = 2.197 μs (PDG 2022, cited not fetched).
Dilated lifetime = γ · τ₀ ≈ 63.4 μs.

Methods: `gamma()`, `timeDilation(dtProper)`, `lengthContraction(L0)`, `momentum()`, `kineticEnergy()`, `totalEnergy()`, `velocityAddition(u)`, `rapidity()`.

### C. R3 Symbol table

| Symbol | Meaning | Unit | Typical range | Source |
|---|---|---|---|---|
| β | v/c₀ (velocity ratio) | dimensionless | [0, 1) | algebraic |
| γ | Lorentz factor 1/√(1−β²) | dimensionless | [1, ∞) | algebraic |
| v | velocity | m/s | [0, c₀) | input |
| c₀ | speed of light | m/s | 299792458 (exact) | SI definition |
| m₀ | rest mass | kg | > 0 | input |
| Δt_proper | proper time interval | s | > 0 | input |
| Δt_dilated | dilated time interval | s | > Δt_proper | derived |
| L₀ | proper length | m | > 0 | input |
| L | contracted length | m | (0, L₀] | derived |
| p | relativistic momentum | kg·m/s | ≥ 0 | derived |
| KE | relativistic kinetic energy | J | ≥ 0 | derived |
| E_total | total relativistic energy | J | m₀c₀² to ∞ | derived |
| φ | rapidity | dimensionless | (−∞, ∞) | algebraic |
| u | velocity in original frame | m/s | (−c₀, c₀) | input |
| u' | velocity in boosted frame | m/s | (−c₀, c₀) | derived |

### D. R4 Domain table

| Parameter | Domain | Trigger condition | Test |
|---|---|---|---|
| β | \|β\| < 1 | \|β\| ≥ 1 | `gamma(1.0)` → RangeError |
| β | \|β\| < 1 | β = −1.1 | `gamma(-1.1)` → RangeError |
| m₀ | m₀ > 0 | m₀ ≤ 0 | constructor with m₀=0 → RangeError |

### E. Predict questions

| # | Question | Answer |
|---|---|---|
| P1 | γ at β = 0.5 | 1/√0.75 = 2/√3 ≈ 1.15470 |
| P2 | γ at β = 0.9994 (muon) | 1/√0.00119964 ≈ 28.872 |
| P3 | Velocity addition: 0.9c in frame moving at 0.5c | (0.9−0.5)/(1−0.45) c = (0.4/0.55) c ≈ 0.72727c |

**Asserted in script:**
```js
assert(Math.abs(gamma(0.5) - 1/Math.sqrt(0.75)) < 1e-14);
assert(Math.abs(gamma(0.9994) - 28.87) < 0.01);
assert(Math.abs(velocityAddition(0.9*C0, 0.5*C0) / C0 - 0.4/0.55) < 1e-14);
```

### F. Derive-it steps

1. Start with the Lorentz transformation: t' = γ(t − vx/c²), x' = γ(x − vt). For a clock at rest (x=0): Δt' = γ·Δt → time dilation.
2. For a rod at rest (Δt'=0 in rest frame): Δx = γ(Δx' + v·Δt') = γΔx' → L₀ = γL → L = L₀/γ.
3. Four-momentum (E/c, p) has invariant E² − (pc)² = (m₀c²)². Substituting E = γm₀c², p = γm₀v gives the energy-momentum relation.
4. Rapidity φ = atanh(β): velocity addition becomes φ₁ + φ₂ (additive) — much simpler than the non-linear formula in β.

### G. research.papers

- Einstein, A. (1905). Zur Elektrodynamik bewegter Körper. Annalen der Physik. 17:891–921. (cited, not fetched)
- Particle Data Group (2022). Review of Particle Physics. Prog. Theor. Exp. Phys. 2022:083C01. https://pdg.lbl.gov. (cited, not fetched — muon rest lifetime 2.197 μs)

### H. Where it breaks

1. Does not include general relativity: gravitational time dilation, curved spacetime.
2. Assumes inertial frames only; no acceleration (four-force, proper acceleration not included).
3. Point particle model: no internal degrees of freedom, no spin.
4. Velocity addition formula holds for 1D collinear case; 3D case requires full Lorentz matrix.

### I. Tests with derived tolerances

| Test | Expected | Tolerance derivation |
|---|---|---|
| γ(0) = 1 | 1 | exact; floating point: < 1e-15 |
| γ(0.5) = 1/√0.75 | 1.15470053837925… | formula exact; FP error: < 1e-14 |
| γ(0.9994) ≈ 28.872 | 28.872 | formula exact; tolerance 0.01 (two sig figs) |
| E² = (pc)² + (m₀c²)² | exact identity | relative error < 1e-12 (double precision) |
| cosh(atanh(β)) = γ | exact identity | FP round-trip error < 1e-14 |
| velocity addition < c | u' < c₀ | exact inequality; no numerical tolerance needed |

### J. Independent anchor route

- γ(β): cross-check via rapidity: `cosh(atanh(β)) == γ`; also via series expansion at small β: γ ≈ 1 + β²/2 (to 0.1% for β ≤ 0.05).
- E²=(pc)²+(m₀c²)²: verify that E_total² − (p·c₀)² = (m₀c₀²)² exactly in floating point (relative error < 1e-12).
- Velocity addition: special case u=v=0.6c: u' = 0; special case u=c₀: u' = c₀ exactly (light speed invariant).

### K. R14 Branch matrix

| Test | Method | Branch/variant |
|---|---|---|
| γ(0) = 1 | gamma | β = 0 (rest frame) |
| γ(0.5), γ(0.9), γ(0.9994) | gamma | 0 < β < 1 |
| gamma(1.0) → RangeError | gamma | \|β\| ≥ 1 boundary |
| timeDilation(1.0) at β=0.5 | timeDilation | standard dilation |
| lengthContraction(1.0) at β=0.5 | lengthContraction | standard contraction |
| timeDilation at β=0.9 | timeDilation | high-β dilation |
| lengthContraction at β=0.9 | lengthContraction | high-β contraction |
| momentum() at β=0.6 | momentum | p = γm₀v |
| kineticEnergy() at β=0.6 | kineticEnergy | KE = (γ-1)m₀c₀² |
| totalEnergy() at β=0.6 | totalEnergy | E = γm₀c₀² |
| E²=(pc)²+(m₀c²)² | totalEnergy + momentum | energy-momentum invariant |
| rapidity at β=0.5 | rapidity | φ = atanh(β) |
| cosh/sinh rapidity check | rapidity | cosh(φ)=γ, sinh(φ)=βγ |
| velocityAddition(0.9c, 0.5c) | velocityAddition | sub-luminal addition |
| velocityAddition → < c | velocityAddition | light-speed bound |
| Muon γ ≈ 28.87 | gamma | extreme relativistic limit |

---

## Bench 2 — perceptron

### A. Path, level, catalog field

| Field | Value |
|---|---|
| Catalog path | `neuroscience/learning/perceptron` |
| Level | university |
| New field | `learning` (id: `learning`, name: `Learning`) under `neuroscience` |
| navLabel | `Perceptron` |
| keywords | perceptron, Rosenblatt, linear classifier, Novikoff, convergence theorem, margin, supervised learning, neural network, hyperplane, separability |

### B. Model class and equations

**Perceptron update rule (Rosenblatt 1958):**
```
Augmented input: x̃ = [x₁, …, xₐ, 1]   (bias absorbed into weight w[d])
ŷ = sign(w · x̃) ∈ {−1, +1}
If ŷ ≠ y: w ← w + η · y · x̃
```

**Convergence theorem (Novikoff 1962):**
```
Given: {(xᵢ, yᵢ)} linearly separable with functional margin γ = min_i yᵢ·(w*·x̃ᵢ)/‖w*‖ > 0
       R = max_i ‖x̃ᵢ‖  (max augmented norm)
Then: number of mistakes ≤ (R/γ)²
```
Note: The bound is on total mistakes across all passes (epochs), not per-epoch.

**OR gate (4 points, linearly separable):**
```
(−1,−1) → −1,  (−1,+1) → +1,  (+1,−1) → +1,  (+1,+1) → +1
Augmented: [x₁, x₂, 1]
w* = (1,1,1):  (−1,−1,1)·(1,1,1) = −1 < 0 → y=−1 ✓
               (−1,1,1)·(1,1,1)  = 1  > 0 → y=+1 ✓
               (1,−1,1)·(1,1,1)  = 1  > 0 → y=+1 ✓
               (1,1,1)·(1,1,1)   = 3  > 0 → y=+1 ✓
‖w*‖ = √3
margins: 1/√3, 1/√3, 1/√3, 3/√3=√3  → γ = 1/√3
R = √(1+1+1) = √3   (all augmented inputs have norm √3)
(R/γ)² = (√3·√3)² = 9
```

Methods: `predict(x)`, `train(data, labels, {maxEpochs, eta})` → `{converged, epochs, mistakes, weights}`.

State: `{weights: number[], eta: number, inputDim: number}`.

### C. R3 Symbol table

| Symbol | Meaning | Unit | Typical range | Source |
|---|---|---|---|---|
| w | weight vector (d+1 dim with bias) | dimensionless | unconstrained | internal state |
| η | learning rate | dimensionless | (0, 1] | input |
| x | input feature vector | dimensionless | any ℝᵈ | input |
| ŷ | predicted label | dimensionless | {−1, +1} | derived |
| y | true label | dimensionless | {−1, +1} | input |
| γ | functional margin of separating hyperplane | dimensionless | > 0 | problem-specific |
| R | max augmented input norm | dimensionless | > 0 | problem-specific |
| d | input dimension | dimensionless | ≥ 1, integer | input |

### D. R4 Domain table

| Parameter | Domain | Trigger condition | Test |
|---|---|---|---|
| η | η > 0 | η ≤ 0 | `new Perceptron({eta: 0})` → RangeError |
| input dimension | consistent | x.length ≠ w.length−1 | `predict(wrongLengthVector)` → RangeError |

### E. Predict questions

| # | Question | Answer |
|---|---|---|
| P1 | (R/γ)² for OR gate (augmented, w*=(1,1,1)) | 9 |
| P2 | Does perceptron converge on OR gate? | Yes; ≤ 9 total mistakes |
| P3 | After convergence, are all 4 points correctly classified? | Yes |

**Asserted in script:**
```js
assert(Math.abs(novikoff_bound - 9) < 1e-10);
assert(result_or.mistakes <= novikoff_bound);
assert(allCorrect);
```

### F. Derive-it steps

1. Show that the mistake count is bounded: define potential function Φ = w_t · w* / (‖w_t‖·‖w*‖) (cosine of angle). Each mistake increases the numerator by at least γ (margin) and the denominator grows by at most R.
2. After k mistakes: w_k·w* ≥ k·γ·‖w*‖ (by induction on update rule).
3. ‖w_k‖² ≤ k·R² (by induction: each update adds at most R² to ‖w‖²).
4. Cosine ≤ 1 → k·γ/R ≤ √k → k ≤ (R/γ)². QED.

### G. research.papers

- Rosenblatt, F. (1958). The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain. Psychological Review. 65(6):386–408. (cited, not fetched)
- Novikoff, A. B. J. (1962). On convergence proofs on perceptrons. Proc. Symposium on the Mathematical Theory of Automata. 12:615–622. (cited, not fetched)

### H. Where it breaks

1. Only converges for linearly separable data; for XOR (not separable) it oscillates forever.
2. Convergence time can be O((R/γ)²) = exponential in n for ill-conditioned problems; SVMs are preferred.
3. No probabilistic output; hard threshold gives 0/1 confidence.
4. No regularisation; weights can grow unboundedly even after convergence.

### I. Tests with derived tolerances

| Test | Expected | Tolerance derivation |
|---|---|---|
| γ = 1/√3 | 0.57735… | exact; FP error < 1e-12 |
| R = √3 | 1.73205… | exact; FP error < 1e-12 |
| (R/γ)² = 9 | 9 | exact; FP error < 1e-10 |
| mistakes ≤ 9 | ≤ 9 | Novikoff theorem (hard bound) |
| allCorrect | true | exact classification test |

### J. Independent anchor route

- Verify (R/γ)² = 9 by direct computation from the OR dataset and w*=(1,1,1), without reference to any formula.
- Cross-check that all margins > 0 by evaluating y·(w*·x̃) for each of the 4 points explicitly.
- After training, verify predict(x) for all 4 training points directly (no formula — just test).

### K. R14 Branch matrix

| Test | Method | Branch/variant |
|---|---|---|
| margins all > 0 with w*=(1,1,1) | margin computation | separable dataset |
| (R/γ)² = 9 | Novikoff bound formula | exact calculation |
| converged = true | train | convergence in finite epochs |
| mistakes ≤ 9 | train | Novikoff bound satisfied |
| allCorrect | predict | all 4 OR points correct |
| η ≤ 0 → RangeError | constructor | invalid learning rate |
| dimension mismatch → RangeError | predict | invalid input |

---

## Bench 3 — network-effects

### A. Path, level, catalog field

| Field | Value |
|---|---|
| Catalog path | `economics/markets/network-effects` |
| Level | intro |
| Existing field | `markets` under `economics` |
| navLabel | `Network effects` |
| keywords | network effects, Metcalfe's law, Sarnoff, Reed, tipping point, adoption dynamics, critical mass, social network, value function |

### B. Model class and equations

**Value functions:**
```
Sarnoff (broadcast): V_S(n) = n
Metcalfe (pairwise): V_M(n) = n·(n−1)/2   [edges in K_n]
Reed (groups):       V_R(n) = 2ⁿ − n − 1  [subsets of size ≥ 2]
```

**Adoption dynamics:**
```
dx/dt = x·(1−x)·[V(x·N) − c]
where: x ∈ [0,1] = adoption fraction
       N = total population
       V(x·N) = v₁·(x·N)·(x·N−1)/2   [Metcalfe value with unit weight v₁]
       c = per-person adoption cost

Fixed points: x=0 (stable), x=x* (unstable tipping point), x=1 (stable)
```

**Tipping point (exact):**
```
Solve v₁·k·(k−1)/2 = c where k = x*·N
→ v₁·k² − v₁·k − 2c = 0
→ k = [v₁ + √(v₁² + 8·v₁·c)] / (2·v₁)
→ x* = k / N

Large-N approximation: x* ≈ √(2c/v₁) / N
```

Methods: `metcalfeValue(n)`, `sarnoffValue(n)`, `reedValue(n)`, `tippingPoint(N, v1, c)`, `run(x0, T, nSteps)` via RK4.

### C. R3 Symbol table

| Symbol | Meaning | Unit | Typical range | Source |
|---|---|---|---|---|
| n | network size (users) | count | ≥ 0, integer | input |
| x | adoption fraction | dimensionless | [0, 1] | state |
| N | total population | count | > 0, integer | input |
| v₁ | marginal value per link | value/link | > 0 | input |
| c | per-person adoption cost | value | > 0 | input |
| x* | tipping-point adoption fraction | dimensionless | (0, 1) | derived |
| V | network value per person | value | ≥ 0 | derived |

### D. R4 Domain table

| Parameter | Domain | Trigger condition | Test |
|---|---|---|---|
| n | n ≥ 0 | n < 0 | `metcalfeValue(-1, 1)` → RangeError |
| N | N > 0 | N ≤ 0 | `tippingPoint(0, 0.001, 100)` → RangeError |
| x | x ∈ [0, 1] | x outside [0,1] | `run(-0.1, …)` → RangeError |

### E. Predict questions

| # | Question | Answer |
|---|---|---|
| P1 | Metcalfe V(10) with v₁=1 | 45 |
| P2 | Tipping point x* for N=1000, v₁=0.001, c=100 | ≈ 0.4477 |
| P3 | Reed V(5) | 2⁵ − 5 − 1 = 26 |

**Asserted in script:**
```js
assert(metcalfeValue(10, 1) === 45);
assert(Math.abs(xstar - 0.4477) < 0.001);
assert(reedValue(5) === 26);
```

### F. Derive-it steps

1. Metcalfe: n users → n(n-1)/2 possible pairwise connections; V ∝ n² for large n.
2. Tipping dynamics: dx/dt = 0 at x=0, x=x*, x=1; sign analysis shows x* is unstable (dx/dt > 0 for x > x*).
3. Exact tipping: solve the quadratic v₁k²-v₁k-2c=0 (positive root).
4. Tipping demo: integrate RK4 from x₀ = x* ± ε over T=5 time units; below → 0, above → 1.

### G. research.papers

- Metcalfe, R. M. (1995). Metcalfe's Law: A network becomes more valuable as it reaches more users. InfoWorld 17:53. (cited, not fetched)
- Katz, M. & Shapiro, C. (1985). Network Externalities, Competition, and Compatibility. American Economic Review. 75(3):424–440. (cited, not fetched)
- Reed, D. (1999). That Sneaky Exponential — Beyond Metcalfe's Law to the Power of Community Building. http://www.reed.com/gikeconomics.html. (cited, not fetched)

### H. Where it breaks

1. Assumes all users are identical (homogeneous value); real networks have power-law degree distributions.
2. Continuous ODE approximation breaks down for small N.
3. Reed's law 2^n grows so fast it is only meaningful for small n; for large networks the group value is practically inaccessible.
4. Does not model churn (users leaving), multi-homing, or platform competition.

### I. Tests with derived tolerances

| Test | Expected | Tolerance derivation |
|---|---|---|
| x* is fixed point: |f(x*)| | ≈ 0 | RK4 residual at tipping point exact; FP error < 1e-8 |
| x(0)=x*−ε after T=5 → 0 | < 0.1 | ODE with dt=0.001, 5000 steps; RK4 global error O(h⁴)·T = (0.001)⁴·5000/24 ≈ 2e-10; well within 0.1 |
| x(0)=x*+ε after T=5 → 1 | > 0.9 | same argument |
| Metcalfe V(10)=45 | 45 | exact integer arithmetic |
| Reed V(5)=26 | 26 | exact integer arithmetic |

### J. Independent anchor route

- Tipping point: verify x* also satisfies `f(x*) ≈ 0` directly in the ODE (numerical fixed-point check).
- Large-N approx: x* ≈ √(2c/v₁)/N; verify agrees with exact formula to < 0.01.
- Metcalfe n=2: V=1 (one link); n=3: V=3; verify by enumeration.

### K. R14 Branch matrix

| Test | Method | Branch/variant |
|---|---|---|
| metcalfeValue(10) = 45 | metcalfeValue | standard n > 1 |
| metcalfeValue(-1) → RangeError | metcalfeValue | n < 0 boundary |
| sarnoffValue(10) = 10 | sarnoffValue | n > 0 |
| reedValue(5) = 26 | reedValue | small n (exact) |
| tippingPoint(N=1000) | tippingPoint | standard params |
| tippingPoint(N=0) → RangeError | tippingPoint | N ≤ 0 boundary |
| f(x*)=0 | adoptionODE | fixed point |
| x₀ below tipping → 0 | run (RK4) | below-threshold dynamics |
| x₀ above tipping → 1 | run (RK4) | above-threshold dynamics |

---

## Bench 4 — neutral-theory

### A. Path, level, catalog field

| Field | Value |
|---|---|
| Catalog path | `biology/evolution/neutral-theory` |
| Level | graduate |
| Existing field | `evolution` under `biology` |
| navLabel | `Neutral theory` |
| keywords | neutral theory, Wright-Fisher, genetic drift, fixation probability, Kimura, allele frequency, effective population size, population genetics |

### B. Model class and equations

**Wright-Fisher neutral drift:**
```
N diploid individuals → 2N gene copies per generation
Starting allele count k₀ = round(p₀ · 2N)
Each generation: k_{t+1} ~ Binomial(2N, kₜ/(2N))
```

**Fixation probability (Kimura 1968, cited not fetched):**
```
u(p₀) = p₀                     [exact result for neutral allele]
u(k) = k / (2N)                 [k starting copies out of 2N]
```

**Expected fixation time (conditional on fixation; Kimura & Ohta 1969, cited not fetched):**
```
t_fix(p₀) = −4N · p₀ · ln(p₀) / (1 − p₀)     generations
```

**Expected loss time (conditional on loss):**
```
t_loss(p₀) = −4N · (1−p₀) · ln(1−p₀) / p₀     generations
```

**Variance of allele frequency per generation:**
```
Var(Δp) = p·(1−p) / (2N_e)
```

Methods: `simulateGeneration(k, N)`, `run(p0, nGenerations)` → `{history, finalK}`, `fixationProbability(p0)`, `expectedFixationTime(p0)`, `expectedLossTime(p0)`, `varPerGeneration(p0)`.

State: `{N, seed}`.

### C. R3 Symbol table

| Symbol | Meaning | Unit | Typical range | Source |
|---|---|---|---|---|
| N | diploid population size | count | 10–10⁶ | input |
| 2N | haploid gene copies | count | 20–2×10⁶ | derived |
| p₀ | initial allele frequency | dimensionless | (0, 1) exclusive | input |
| k₀ | initial allele count | count | 1 to 2N−1 | input |
| p | current allele frequency | dimensionless | [0, 1] | state |
| u(p₀) | fixation probability | dimensionless | = p₀ (neutral) | algebraic / Kimura 1968 |
| t_fix | expected fixation time | generations | 0 to 4N·ln(4N) | Kimura & Ohta 1969 |
| N_e | effective population size | count | ≈ N for diploid | input |

### D. R4 Domain table

| Parameter | Domain | Trigger condition | Test |
|---|---|---|---|
| N | N > 0 | N ≤ 0 | `new NeutralModel({N: 0})` → RangeError |
| p₀ | p₀ ∈ (0, 1) exclusive | p₀ ≤ 0 or p₀ ≥ 1 | `fixationProbability(0)` → RangeError |
| p₀ | p₀ ∈ (0, 1) exclusive | p₀ = 1 | `fixationProbability(1)` → RangeError |

### E. Predict questions

| # | Question | Answer |
|---|---|---|
| P1 | Fixation probability for a single new allele in N=50 diploids | 1/(2N) = 0.01 |
| P2 | E[t_fix\|fix] for p₀=0.1, N=100 | −400·0.1·ln(0.1)/(0.9) = 40·ln(10)/0.9 ≈ 102.34 |
| P3 | Var(Δp) per generation for p₀=0.01, N=50 | 0.01·0.99/100 = 9.9×10⁻⁵ |

**Asserted in script:**
```js
assert(p0_wf === 0.01);  // 1/(2×50)
assert(Math.abs(t_fix_01 - 40*Math.log(10)/0.9) < 1e-10);
assert(Math.abs(var_per_gen - 0.01*0.99/100) < 1e-15);
```

### F. Derive-it steps

1. Wright-Fisher: each generation is a binomial draw; allele frequencies form a martingale → E[p_{t+1}] = p_t.
2. Neutral fixation probability: since frequency is a martingale, E[p_∞] = p₀; final state is 0 or 1; so P(fix) = p₀.
3. Expected fixation time: derived by solving a boundary-value problem for the diffusion approximation of Wright-Fisher (Kolmogorov forward equation); result involves the integral ∫G(p,y)dy where G is the Green's function.
4. Variance of allele frequency: each generation, 2N Bernoulli trials with p success → Var(k) = 2Np(1−p); Var(Δp) = Var(k)/(2N)² = p(1−p)/(2N).

### G. research.papers

- Kimura, M. (1968). Evolutionary rate at the molecular level. Nature. 217:624–626. doi:10.1038/217624a0. (cited, not fetched)
- Kimura, M. & Ohta, T. (1969). The average number of generations until fixation of a mutant gene in a finite population. Genetics. 61:763–771. (cited, not fetched)
- Watterson, G. A. (1975). On the number of segregating sites in genetical models without recombination. Theoretical Population Biology. 7(2):256–276. (cited, not fetched)

### H. Where it breaks

1. Assumes complete neutrality (all alleles have equal fitness); selection coefficient s = 0.
2. Assumes constant population size; size fluctuations reduce N_e.
3. Normal approximation for binomial is used for large N in fast mode; fails for p → 0 or p → 1 (use exact for k ≤ 200).
4. Single locus model; no recombination or epistasis.

### I. Tests with derived tolerances

| Test | Expected | Tolerance derivation |
|---|---|---|
| Empirical fixation prob (1000 trials, p₀=0.01, N=50) | p₀ = 0.01 | 3σ = 3·√(p₀(1−p₀)/1000) = 3·√(9.9e-6) ≈ 0.00944; test: \|empirical − 0.01\| < 5·3σ (wider due to finite-generation cutoff) |
| E[t_fix](p₀=0.1, N=100) | 102.337… | Exact formula; FP < 1e-10 |
| Var(Δp) | p(1−p)/(2N) | Exact formula; FP < 1e-15 |

### J. Independent anchor route

- Fixation probability: verify u(p₀) = p₀ is consistent with u(1−p₀) = 1−p₀ (if you start near 1, fixation probability is near 1) — check that u(0.01) + loss_probability(0.01) = 1 (they sum to 1 since ultimate absorption is certain).
- E[t_fix]: numerically integrate −4N·p·ln(p)/(1−p) and verify against tabulated values from Kimura & Ohta 1969.
- Stochastic: run 1000 trials with seed=42, count fixations; compare to 3σ confidence interval.

### K. R14 Branch matrix

| Test | Method | Branch/variant |
|---|---|---|
| k₀=1, N=50 fix prob = 0.01 | fixationProbability | single-copy neutral allele |
| E[t_fix](p₀=0.1) ≈ 102.34 | expectedFixationTime | intermediate frequency |
| Var(Δp) formula | varPerGeneration | p₀ = 0.01 |
| simulateGeneration(k=1, N=50) | simulateGeneration | near-loss boundary |
| simulateGeneration(k=99, N=50) | simulateGeneration | near-fixation boundary |
| run(p0=0.5) | run | symmetric case |
| N ≤ 0 → RangeError | constructor | invalid N |
| p₀ = 0 → RangeError | fixationProbability | boundary excluded |
| p₀ = 1 → RangeError | fixationProbability | boundary excluded |
| Stochastic: 1000 trials mean ≈ p₀ | run (stochastic) | Monte Carlo validation |

---

## Bench 5 — coalescence

### A. Path, level, catalog field

| Field | Value |
|---|---|
| Catalog path | `biology/evolution/coalescence` |
| Level | graduate |
| Existing field | `evolution` under `biology` |
| navLabel | `Coalescent` |
| keywords | coalescent theory, Kingman, MRCA, most recent common ancestor, genealogy, effective population size, Watterson theta, Tajima's D, segregating sites, phylogenetics |

### B. Model class and equations

**Kingman's coalescent (Kingman 1982, cited not fetched):**
```
n lineages coalesce backward in time.
Rate for k lineages: C(k,2)/(2N_e) = k(k−1)/(4N_e)   events per generation
Wait time T_k ~ Exponential(k(k−1)/(4N_e))
E[T_k] = 4N_e / (k(k−1))
```

**Expected T_MRCA (exact telescoping sum):**
```
E[T_MRCA] = Σ_{k=2}^{n} E[T_k]
           = 4N_e · Σ_{k=2}^{n} 1/(k(k−1))
           = 4N_e · Σ_{k=2}^{n} (1/(k−1) − 1/k)   [partial fractions]
           = 4N_e · (1 − 1/n)                        [telescoping]

n=2: E[T_MRCA] = 4N_e·(1−1/2) = 2N_e
n=3: E[T_MRCA] = 4N_e·(2/3) = 8N_e/3
n→∞: E[T_MRCA] → 4N_e
```

**Expected segregating sites (Watterson 1975, cited not fetched):**
```
θ = 4·N_e·μ    (population-scaled mutation rate)
H_{n-1} = Σ_{i=1}^{n-1} 1/i    (harmonic number)
E[S] = θ · H_{n-1}
```

**Tajima's D numerator:**
```
d = S − a₁·ŝ    where a₁ = H_{n-1}
```
(Full Tajima's D includes a variance estimate; model provides numerator only.)

Methods: `expectedTk(k, Ne)`, `expectedTMRCA(n, Ne)`, `expectedSegSites(n, Ne, mu)`, `simulate(n, Ne, seed)` → `{tMRCA, waitTimes}`.

State: `{n, Ne, mu}`.

### C. R3 Symbol table

| Symbol | Meaning | Unit | Typical range | Source |
|---|---|---|---|---|
| n | number of sampled lineages | count | ≥ 2 | input |
| N_e | effective (diploid) population size | count | 10³–10⁶ | input |
| T_k | waiting time for k→k-1 coalescence | generations | Exp(k(k-1)/(4Ne)) | Kingman 1982 |
| T_MRCA | time to most recent common ancestor | generations | ≈ 4N_e | derived |
| θ | scaled mutation rate 4N_e·μ | dimensionless | 0.001–10 | input/derived |
| μ | per-generation mutation rate | per generation | 10⁻⁸–10⁻⁵ | input |
| S | number of segregating sites | count | ≥ 0 | derived |
| H_{n-1} | (n-1)th harmonic number | dimensionless | ≈ ln(n) for large n | algebraic |

### D. R4 Domain table

| Parameter | Domain | Trigger condition | Test |
|---|---|---|---|
| n | n ≥ 2 | n < 2 | `expectedTMRCA(1, 1000)` → RangeError |
| N_e | N_e > 0 | N_e ≤ 0 | `new CoalescentModel({Ne: 0})` → RangeError |

### E. Predict questions

| # | Question | Answer |
|---|---|---|
| P1 | E[T_MRCA] for n=2, N_e=1000 | 2·1000 = 2000 generations |
| P2 | E[T_MRCA] for n=3, N_e=1000 | 8·1000/3 ≈ 2666.67 generations |
| P3 | E[T_MRCA] for n=10, N_e=1000 | 4·1000·(1−1/10) = 3600 generations |

**Asserted in script:**
```js
assert(Math.abs(expectedTMRCA(2, 1000) - 2000) < 1e-10);
assert(Math.abs(expectedTMRCA(3, 1000) - 8000/3) < 1e-8);
assert(Math.abs(expectedTMRCA(10, 1000) - 3600) < 1e-8);
```

### F. Derive-it steps

1. Pairwise coalescence: probability that two specific lineages share a common ancestor in one generation = 1/(2N_e); with k lineages, there are C(k,2) pairs → rate k(k-1)/(4N_e).
2. Waiting time is memoryless (Poisson process) → T_k ~ Exponential → E[T_k] = 4N_e/(k(k-1)).
3. Telescoping: Σ_{k=2}^{n} 1/(k(k-1)) = Σ_{k=2}^{n} (1/(k-1) − 1/k) = 1 − 1/n. Verify for n=2: 1/2; for n=3: 1/2+1/6 = 2/3 = 1-1/3 ✓.
4. Mutation: each lineage-generation is exposed to mutations at rate μ; expected mutations on branch of length t: μt; sum over all branches gives E[S] = θ·H_{n-1}.

### G. research.papers

- Kingman, J. F. C. (1982). The coalescent. Stochastic Processes and their Applications. 13(3):235–248. doi:10.1016/0304-4149(82)90011-4. (cited, not fetched)
- Watterson, G. A. (1975). On the number of segregating sites in genetical models without recombination. Theoretical Population Biology. 7(2):256–276. (cited, not fetched)
- Tajima, F. (1989). Statistical method for testing the neutral mutation hypothesis by DNA polymorphism. Genetics. 123(3):585–595. (cited, not fetched)

### H. Where it breaks

1. Assumes constant N_e; population size changes (bottlenecks, expansions) alter T_MRCA distribution.
2. Assumes no recombination; recombination creates an ancestral recombination graph (ARG), not a tree.
3. Assumes no selection; selected alleles have non-standard coalescent rates.
4. Standard Kingman coalescent is for haploid model; diploid model needs factor of 2 for N_e (conventions vary — always document 2N_e vs N_e).

### I. Tests with derived tolerances

| Test | Expected | Tolerance derivation |
|---|---|---|
| E[T_MRCA] n=2, closed form | 2000 | exact; FP < 1e-10 |
| E[T_MRCA] n=3, closed form | 8000/3 | exact; FP < 1e-8 |
| E[T_MRCA] simulation (200 trials, n=10, N_e=1000) | 3600 | 3σ/√200 where σ = SD of T_MRCA over trials; empirically ≈ 420 → tolerance ≈ 420 |
| H_9 | Σ_{i=1}^{9} 1/i | exact rational arithmetic; FP < 1e-12 |
| E[S] formula | θ·H_{n-1} | exact formula; FP < 1e-12 |

### J. Independent anchor route

- Telescoping: verify Σ_{k=2}^{n} 1/(k(k-1)) = 1 − 1/n by evaluating both the sum and the closed form and checking equality to 1e-12.
- n=∞ limit: E[T_MRCA]/(4N_e) → 1 as n → ∞; verify with n=1000: ratio should be 1 − 1/1000 = 0.999 exactly.
- Simulation: 200 trials with seed=42; mean ≈ 3600 within 3σ/√200.

### K. R14 Branch matrix

| Test | Method | Branch/variant |
|---|---|---|
| E[T_k] formula | expectedTk | any k ≥ 2 |
| E[T_MRCA] n=2 | expectedTMRCA | minimum case |
| E[T_MRCA] n=3 | expectedTMRCA | 3-lineage case |
| E[T_MRCA] n=10 | expectedTMRCA | standard case |
| Telescoping closed form vs sum | expectedTMRCA_closed | algebraic identity |
| H_{n-1} computation | harmonicNumber | n=10 |
| E[S] = θ·H_{n-1} | expectedSegSites | standard θ |
| simulate(n, Ne, seed) | simulate | exponential wait times |
| 200-trial mean ≈ 4Ne(1-1/n) | simulate | stochastic validation |
| n=1 → RangeError | expectedTMRCA | n < 2 boundary |
| Ne=0 → RangeError | constructor | invalid Ne |

---

## Bench 6 (Alternate A) — random-walk

### A. Path, level, catalog field

| Field | Value |
|---|---|
| Catalog path | `math/probability/random-walk` |
| Level | intro |
| Existing field | `probability` under `math` |
| navLabel | `Random walk` |
| keywords | random walk, Brownian motion, diffusion, mean squared displacement, gambler's ruin, absorption, stochastic, Pólya, recurrence |

(Already in catalog.js — no catalog addition needed.)

### B. Model class and equations

**1D discrete random walk:**
```
X₀ = 0
X_{t+1} = X_t + ξ_t    where ξ_t = ±1 with equal probability
E[X_t] = 0
Var(X_t) = t          [E[X_t²] = t]
E[|X_t|] ≈ √(2t/π)   [Gaussian limit; exact for large t]
```

**2D lattice walk (4-neighbour):**
```
Each step moves in one of 4 directions by ±s (step size)
E[Δx²] = s²/2, E[Δy²] = s²/2 per step
E[r²_t] = t · s²   (for unit step s=1: E[r²_t] = t)
```

**Diffusion coefficient:**
```
D = s² / (2d·Δt)    d = dimension, s = step size, Δt = time step
1D: D = 1/2 for s=Δt=1
Einstein relation: E[r²] = 2d·D·t (general)
```

Methods: `run1D(n, seed)` → positions array, `run2D(n, seed)` → `{x, y}` arrays, `expectedMSD(t)`, `expectedAbsVal(t)`.

### C. R3 Symbol table

| Symbol | Meaning | Unit | Typical range | Source |
|---|---|---|---|---|
| X_t | 1D position at time t | steps | (−∞, ∞) | state |
| t | number of steps | count | ≥ 0 | input |
| s | step size | length | 1 (unit) | input |
| D | diffusion coefficient | length²/time | s²/(2d) | algebraic |
| r² | squared displacement in 2D | length² | ≥ 0 | derived |

### D. R4 Domain table

| Parameter | Domain | Trigger condition | Test |
|---|---|---|---|
| n | n ≥ 1 | n ≤ 0 | `run1D(0)` → RangeError |

### E. Predict questions

| # | Question | Answer |
|---|---|---|
| P1 | E[X²_100] for 1D unit walk | 100 |
| P2 | E[\|X_100\|] (Gaussian approx) | √(200/π) ≈ 7.9788 |
| P3 | D for 1D unit walk (s=1, Δt=1) | 1/2 |

### F. Derive-it steps

1. Each step: E[ξ_t] = 0, E[ξ_t²] = 1; by independence: Var(X_t) = t·Var(ξ) = t.
2. CLT: for large t, X_t ≈ N(0, t) → |X_t| has half-normal distribution → E[|X_t|] = √(2t/π).
3. Einstein (1905): diffusion E[r²] = 2dDt; for unit lattice D = s²/(2d) → E[r²] = t·s².
4. Pólya's theorem: 1D and 2D random walks are recurrent (return to origin with probability 1); 3D is transient.

### G. research.papers

- Einstein, A. (1905). Über die von der molekularkinetischen Theorie der Wärme geforderte Bewegung von in ruhenden Flüssigkeiten suspendierten Teilchen. Annalen der Physik. 322:549–560. (cited, not fetched)
- Pólya, G. (1921). Über eine Aufgabe der Wahrscheinlichkeitsrechnung betreffend die Irrfahrt im Straßennetz. Mathematische Annalen. 84:149–160. (cited, not fetched)

### H. Where it breaks

1. Independent steps; correlated random walks (persistent motion, Lévy flights) need different models.
2. Gaussian approximation E[|X|]≈√(2t/π) fails for small t (only exact asymptotically).
3. No boundary conditions; gambler's ruin (absorbing barriers) requires separate analysis.
4. Lattice walk differs from continuous Brownian motion in short-time behavior.

### I. Tests with derived tolerances

| Test | Expected | Tolerance derivation |
|---|---|---|
| E[X²_t] = t | 100 | Exact; integer arithmetic |
| E[\|X_t\|] formula | √(200/π) | Exact formula; FP < 1e-14 |
| Empirical MSD (5000 walks, t=100) | 100 | SE = σ(X²)/√5000; Var(X²)=2t² for X~N(0,t); SE = t√(2/5000) = 100·√(4e-4) = 2.0; tolerance = 3·2 = 6 |

### J. Independent anchor route

- E[X²_t] = t: verify by Var(X_t) = E[X_t²] − (E[X_t])² = E[X_t²] − 0 = t (algebraic).
- Cross-check: simulate 5000 walks and verify empirical mean ≈ 100 within 3SE.

### K. R14 Branch matrix

| Test | Method | Branch/variant |
|---|---|---|
| E[X²_100]=100 | expectedMSD | exact formula |
| E[\|X_100\|] | expectedAbsVal | Gaussian approximation |
| E[r²_100] 2D = 100 | expectedMSD2D | 2D version |
| run1D(1000) | run1D | seeded 1D walk |
| 5000-walk MSD check | run1D | stochastic validation |
| D = 1/2 | diffusionCoeff | 1D unit walk |
| n ≤ 0 → RangeError | run1D | boundary |

---

## Bench 7 (Alternate B) — particle-in-box

### A. Path, level, catalog field

| Field | Value |
|---|---|
| Catalog path | `physics/quantum/particle-in-box` |
| Level | intro |
| Existing field | `quantum` under `physics` (already in catalog) |
| navLabel | `Particle in a box` (already in catalog) |
| keywords | (already in catalog) |

(Already in catalog.js — no catalog addition needed. This is an alternate in case a fully-specified bench hits an R8 wall.)

### B. Model class and equations

**1D infinite square well, x ∈ [0, L]:**
```
E_n = n²·π²·ℏ²/(2·m·L²)     n = 1, 2, 3, …
ψ_n(x) = √(2/L) · sin(n·π·x/L)

Physical constants (CODATA 2018):
  ℏ = 1.054571817×10⁻³⁴ J·s
  m_e = 9.1093837015×10⁻³¹ kg

For electron, L=1 nm:
  E₁ = π²·(1.054571817e-34)²/(2·9.1093837015e-31·(1e-9)²)
     ≈ 6.0247×10⁻²⁰ J ≈ 0.37603 eV
```

**Expectation values:**
```
⟨x⟩_n = L/2    (by symmetry of sin²)
⟨x²⟩_n = L²·(1/3 − 1/(2n²π²))
σ_x,n = √(⟨x²⟩_n − L²/4)
```

**Probability in interval [a, b]:**
```
P_n(a,b) = ∫_a^b |ψ_n|² dx = ∫_a^b (2/L)·sin²(nπx/L) dx
         = (b−a)/L − [sin(2nπb/L) − sin(2nπa/L)]/(2nπ)   [analytic]
P₁(L/2, L) = 1/2   (by symmetry)
```

Methods: `energy(n)`, `psi(n, x)`, `psiSquared(n, x)`, `expectationX(n)`, `expectationX2(n)`, `probabilityInInterval(n, a, b)`, `curve(n, nPoints=300)`.

### C. R3 Symbol table

| Symbol | Meaning | Unit | Typical range | Source |
|---|---|---|---|---|
| n | quantum number | dimensionless | 1, 2, 3, … | input |
| L | box length | m | 0.1–10 nm | input |
| m | particle mass | kg | m_e = 9.109×10⁻³¹ kg | input |
| E_n | energy level | J | E₁ to n²E₁ | algebraic / CODATA 2018 |
| ψ_n(x) | wavefunction | m⁻¹/² | real | algebraic |
| ⟨x⟩ | expectation of x | m | L/2 | algebraic |
| ⟨x²⟩ | second moment of x | m² | L²/3 − … | algebraic |
| P(a,b) | probability in [a,b] | dimensionless | [0,1] | algebraic |

### D. R4 Domain table

| Parameter | Domain | Trigger condition | Test |
|---|---|---|---|
| n | n ≥ 1, integer | n = 0 | `energy(0)` → RangeError |
| n | n ≥ 1, integer | n = 1.5 | `energy(1.5)` → RangeError |
| x | x ∈ [0, L] | x < 0 | `psi(1, −0.1)` → RangeError |
| x | x ∈ [0, L] | x > L | `psi(1, L+1)` → RangeError |
| [a, b] | a ≤ b | a > b | `probabilityInInterval(1, b, a)` → RangeError |

### E. Predict questions

| # | Question | Answer |
|---|---|---|
| P1 | E₁ for electron in L=1 nm (in eV) | ≈ 0.37603 eV |
| P2 | E₂/E₁ | 4 (exactly) |
| P3 | P([L/2, L]) for n=1 | 0.5 (exactly, by symmetry) |

**Asserted in script:**
```js
assert(Math.abs(E1_box/EV - 0.37603) < 0.00005);
assert(Math.abs(E2_box/E1_box - 4) < 1e-12);
assert(Math.abs(P_right_n1 - 0.5) < 1e-8);
```

### F. Derive-it steps

1. Time-independent Schrödinger: −ℏ²/(2m) · ψ''(x) = E·ψ(x) with ψ(0) = ψ(L) = 0 → ψ = A·sin(kx), k = nπ/L.
2. Normalization: ∫₀ᴸ |ψ|² dx = A²·L/2 = 1 → A = √(2/L).
3. Energy: E = ℏ²k²/(2m) = n²π²ℏ²/(2mL²).
4. ⟨x²⟩: use ∫₀ᴸ x²·sin²(nπx/L)·(2/L)dx = L²/3 − 1/(2n²π²/L²·L²)·1 … carry out by integration by parts → L²(1/3 − 1/(2n²π²)).

### G. research.papers

- Griffiths, D. J. (2005). Introduction to Quantum Mechanics (2nd ed.). Pearson. §2.2. (cited, not fetched)

### H. Where it breaks

1. Infinite walls: real quantum wells have finite barriers → tunneling into barrier; energy levels are lower.
2. 1D model: real quantum dots are 3D (spherical or cubic) → degenerate levels, angular momentum.
3. Single-particle: ignores electron-electron interaction; important for multi-electron systems.
4. Non-relativistic: at high n or small L, relativistic corrections (Dirac equation) become significant.

### I. Tests with derived tolerances

| Test | Expected | Tolerance derivation |
|---|---|---|
| E₁(L=1nm) ≈ 0.37603 eV | 6.0247×10⁻²⁰ J | CODATA constants × π²; tolerance 5×10⁻⁵ eV (textbook precision) |
| E₂/E₁ = 4 | exact | FP < 1e-12 |
| E₃/E₁ = 9 | exact | FP < 1e-12 |
| ⟨x²⟩₁ trapezoid vs analytic | match | trapezoid: h = L/10000; LTE = h²/12·|f''|·L; f(x)=x²·ψ₁², \|f''\|≤ a few·E₁/L²; tolerance: 1e-22 m² |
| P([L/2,L]) = 0.5 | 0.5 | trapezoid h=L/10000; smooth integrand; error < 1e-8 |
| Normalization = 1 | 1 | trapezoid; error < 1e-8 |
| Orthogonality ψ₁·ψ₂ = 0 | 0 | exact for trapezoid of odd function on [0,L]; error < 1e-8 |
| E₁(2L)/E₁(L) = 0.25 | 0.25 | exact (1/L² scaling); FP < 1e-14 |

### J. Independent anchor route

- E₂/E₁ = 4: verify from formula: (2²·π²·ℏ²)/(1²·π²·ℏ²) = 4 exactly.
- ⟨x²⟩ analytic formula: verify by numerical integration (trapezoid, N=10000); discrepancy < 1e-22 m².
- Energy scale: verify E₁/EV ≈ 0.37603 eV against known textbook value (Griffiths §2.2).

### K. R14 Branch matrix

| Test | Method | Branch/variant |
|---|---|---|
| energy(1) ≈ 0.376 eV | energy | ground state |
| E₂/E₁ = 4, E₃/E₁ = 9 | energy | excited states n=2,3 |
| E_n/E₁ = n² for n=4,5 | energy | higher levels |
| energy(0) → RangeError | energy | n < 1 boundary |
| psi(1, 0) | psi | left boundary x=0 |
| psi(1, L/2) | psi | midpoint |
| psi(1, −0.1) → RangeError | psi | x < 0 boundary |
| ⟨x²⟩ trapezoid vs analytic | expectationX2 | numerical vs analytic |
| P([L/2,L]) = 0.5 | probabilityInInterval | symmetry case |
| normalization = 1 | probabilityInInterval or trapezoid | full interval |
| orthogonality ψ₁·ψ₂ = 0 | psi | different n |
| E₁(2L)/E₁(L) = 0.25 | energy | L-scaling law |

---

## Implementation order

1. **special-relativity** — pure algebra, no ODE or stochastic component; fast to implement and test; R8 risk very low (all formulas from first principles).
2. **perceptron** — requires a small iterative training loop; self-contained; no infrastructure dependency; R8 risk low.
3. **network-effects** — uses RK4 from `Integrators.js`; intro level so formulae are simple; R8 risk low.
4. **neutral-theory** — stochastic binomial simulation; uses `Random.js` Mulberry32 PRNG; graduate level; R8 moderate (Kimura formulas).
5. **coalescence** — builds on neutral-theory concepts; stochastic simulation with exponential wait times; R8 moderate (Kingman/Watterson).
6. **[Alternate A] random-walk** — simplest possible stochastic model; swap in if any of benches 1–5 hits R8 wall.
7. **[Alternate B] particle-in-box** — already in catalog and largely implemented from Phase 8; swap in if needed.

Rationale: implement in increasing stochastic complexity. Deterministic benches first (1–3), then stochastic (4–5), then alternates last. The PhaseElevenb pass showed that stochastic tests are the most likely R8 source.

---

## Shared infrastructure

| Module | Already exists? | Phase 12 usage |
|---|---|---|
| `js/core/Integrators.js` | yes | RK4 for network-effects adoption ODE |
| `js/core/Random.js` | yes | Mulberry32 seeded PRNG for neutral-theory, coalescence, random-walk |
| `js/core/LinAlg.js` | yes | not used in Phase 12 (no matrix operations) |
| `js/core/RootFinding.js` | yes | optional: tipping point could use Brent; currently quadratic formula is exact |
| `js/core/Complex.js` | check if exists | not needed in Phase 12 |
| `js/core/PDE1D.js` | in plan (Phase 12 ROADMAP: schrodinger-1d) | needed for schrodinger-1d but not these 7 benches |

No new infrastructure modules are required for the 7 benches in this plan. All rely on:
- `Integrators.rk4` (network-effects)
- Mulberry32 PRNG from `Random.js` constructor (neutral-theory, coalescence)
- Scalar math only (special-relativity, perceptron, particle-in-box, random-walk)

---

## Anchors output

```
════════════════════════════════════════════════════════════════════════
1. SPECIAL RELATIVITY
════════════════════════════════════════════════════════════════════════
  γ(β=0)                                             1.000000000  (exact 1)
  γ(β=0.5)                                           1.154700538  (exact 2/√3 ≈ 1.154701)
  Δt_dilated(β=0.5)                                  1.154700538  = γ·1 s
  L(β=0.5)                                           0.8660254038  = L₀·√0.75
  γ(β=0.9)                                           2.294157339  ≈ 2.294157
  Δt_dilated(β=0.9)                                  2.294157339  ≈ 2.294 s
  L(β=0.9)                                           0.4358898944  = L₀·√0.19

Muon β=0.9994: 1−β²                               0.001199640000  = 0.00119964
  Muon γ                                             28.87184456  ≈ 28.87
  Muon dilated lifetime (μs)                         63.43144250  μs (expect ≈ 63.3 μs)

Energy-momentum: E²                               1.262126361e+34  J²
  (pc)² + (m₀c²)²                                    1.262126361e+34  J² (must equal E²)

Rapidity φ(β=0.5)                                 0.5493061443  = atanh(0.5)

Velocity addition u=0.9c, v=0.5c                  0.7272727273  in units of c (expect < 1)

R13 mutation: γ(0.99) vs γ(0.9994)                21.78303251  gap (must >> 0.01 tol)

  ✓ All special-relativity assertions passed

════════════════════════════════════════════════════════════════════════
2. PERCEPTRON
════════════════════════════════════════════════════════════════════════
  w* = (1,1,1), norm                                 1.732050808  = √3
  margins for all 4 OR points                        [0.57735,0.57735,0.57735,1.732051]
  γ (minimum margin)                                 0.5773502692  = 1/√3 ≈ 0.5774
  R (max augmented norm)                             1.732050808  = √3 ≈ 1.7321
  (R/γ)² Novikoff bound                              9.000000000  = 9

OR gate: converged                                true
  OR gate: epochs                                    2.000000000
  OR gate: total mistakes                            3.000000000
  Novikoff bound (R/γ)²                              9.000000000  ≤ this

R13 mutation: w*·wrong point > 0?                 -1.000000000

  ✓ All perceptron assertions passed

════════════════════════════════════════════════════════════════════════
3. NETWORK EFFECTS
════════════════════════════════════════════════════════════════════════
  Tipping point x* (N=1000,v1=0.001,c=100)           0.4477138750  ≈ 0.4477
  dx/dt at x* (should ≈ 0)                           0.000000000

Tipping demo: x₀ = x* − ε, after T=5              3.493893023e-217  (expect → 0)
  Tipping demo: x₀ = x* + ε, after T=5               1.000000000  (expect → 1)

Metcalfe V(10, v1=1)                              45.00000000  = 10·9/2 = 45
  Sarnoff V(10)                                      10.00000000  = 10
  Reed V(5)                                          26.00000000  = 2^5 − 5 − 1 = 26

Tipping x* (exact)                                0.4477138750
  Tipping x* (approx √(2c/v₁)/N)                     0.4472135955  ≈ 0.4472

R13 mutation: x*(c=200) vs x*(c=100)              0.1852418547  gap >> 1e-8 tol

  ✓ All network-effects assertions passed

════════════════════════════════════════════════════════════════════════
4. NEUTRAL THEORY
════════════════════════════════════════════════════════════════════════
  N (diploid)                                        50.00000000
  2N (gene copies)                                   100.0000000
  p₀ = k₀/(2N)                                       0.01000000000  = 0.01 (1 copy)
  Exact fixation probability u(p₀)                   0.01000000000  = p₀ (Kimura 1968)

Empirical fixation probability                    0.01300000000  (expect 0.01 ±3σ)
  3σ tolerance                                       0.009439279634  = 3·√(p(1−p)/n)
  Error |empirical − p₀|                             0.003000000000

E[T_fix | fix] for p₀=0.1, N=100                  102.3371152  generations
  Var(Δp) per generation                             0.00009900000000  = p(1−p)/(2N)

R13: E[T_fix](p₀=0.5, N=1000)                     2772.588722  ≈ 2772.6
  R13: E[T_fix](p₀=0.1, N=1000)                      1023.371152  ≈ 1023.4
  R13 mutation gap                                   1749.217570  >> tolerance

  ✓ All neutral-theory assertions passed

════════════════════════════════════════════════════════════════════════
5. COALESCENCE
════════════════════════════════════════════════════════════════════════
  E[T_MRCA] n=2, Ne=1000                             2000.000000  = 2000 (exact)
  E[T_MRCA] n=3, Ne=1000                             2666.666667  = 8000/3 ≈ 2666.67
  E[T_MRCA] n=1000                                   3996.000000  ≈ 4Ne = 4000

E[T_MRCA] n=10, Ne=1000 (closed form)             3600.000000  = 4Ne·(1−1/10) = 3600
  Simulated mean T_MRCA (200 trials)                 3555.101557
  Simulated SD                                       1982.543605
  3σ/√200 tolerance                                  420.5610082
  |simulated − expected|                             44.89844301

H_{n-1} = H_9                                     2.828968254  ≈ 2.828968
  E[S] θ=4Ne·μ=4000·1e-5=0.04, H_9                   0.1131587302  ≈ 0.04·H_9

R13: E[T_MRCA](Ne=1000) − E[T_MRCA](Ne=500)       1800.000000  >> tolerance

  ✓ All coalescence assertions passed

════════════════════════════════════════════════════════════════════════
6. RANDOM WALK (Alternate A)
════════════════════════════════════════════════════════════════════════
  E[X²_100] 1D (= 100)                               100.0000000  (exact)
  E[|X_100|] 1D (Gaussian approx)                    7.978845608  ≈ √(200/π) ≈ 7.979
  E[r²_100] 2D (= 100)                               100.0000000  (exact)

1D walk position after n=1000 steps               40.00000000

Empirical <X²> at t=100 (5000 walks)              100.5504000  expect 100 ± 6.000
  D (1D, s=1, Δt=1)                                  0.5000000000  = 1/2

  ✓ All random-walk assertions passed

════════════════════════════════════════════════════════════════════════
7. PARTICLE IN A BOX (Alternate B)
════════════════════════════════════════════════════════════════════════
  E₁ (L=1nm) in J                                    6.024667395e-20
  E₁ (L=1nm) in eV                                   0.3760301622  ≈ 0.37603 eV
  E₂/E₁                                              4.000000000  = 4 exactly
  E₃/E₁                                              9.000000000  = 9 exactly
  E_n/E_1 = n² (verified n=2..5)                     true

⟨x⟩_1 = L/2                                       5.000000000e-10  m
  ⟨x²⟩₁ analytic                                     2.826727415e-19  m²
  ⟨x²⟩₁ trapezoid                                    2.826727415e-19  m²

P([L/2,L]) n=1 (trapezoid)                        0.5000000000  (exact = 0.5)
  ∫ψ₁² dx (trapezoid)                                1.000000000  (exact = 1)
  ∫ψ₁·ψ₂ dx (orthogonality)                          7.763155577e-17  (exact = 0)

R13: E₂ − E₁                                      1.807400218e-19  J (>> tol_x2)

E₁(L=2nm)/E₁(L=1nm)                               0.2500000000  = 1/4 exactly

  ✓ All particle-in-box assertions passed

════════════════════════════════════════════════════════════════════════
SUMMARY
════════════════════════════════════════════════════════════════════════
  1. special-relativity: ✓ PASS
  2. perceptron: ✓ PASS
  3. network-effects: ✓ PASS
  4. neutral-theory: ✓ PASS
  5. coalescence: ✓ PASS
  6. random-walk (Alternate A): ✓ PASS
  7. particle-in-box (Alternate B): ✓ PASS

  All assertions passed. Script complete.
  Node version: v22.22.2
  Date: 2026-10-17
```
