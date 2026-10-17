# Phase 11 — 7 benches

## Context

Phase 10b is complete (979 tests pass). Phase 11 adds 7 benches across Physics, Neuroscience,
Psychology, Math, and Economics. It also requires one infrastructure commit (Graph.js) before
the graph-theory bench.

One commit per bench (plus one for Graph.js). `npm test` green before every commit. No push.

---

## Shared infrastructure changes

### New catalog fields (add to `js/catalog.js`)

| Subject | Field id | Label | Benches |
|---|---|---|---|
| Physics | `statistical-mechanics` | Statistical Mechanics | ising |
| Math | `graph-theory` | Graph Theory | graph-theory |
| Economics | `network-economics` | Network Economics | inequality |

Existing fields receiving new benches:

| Subject | Existing field id | New bench ids |
|---|---|---|
| Neuroscience | `networks` | population-coding, wilson-cowan |
| Psychology | `learning` | bayesian-observer |
| Economics | `markets` | elasticity |

---

## Bench 1 — `bench(physics/statistical-mechanics/ising)`

**Path:** `js/benches/physics/statistical-mechanics/ising/`
**Level:** university

### IsingModel.js

2D square lattice, periodic boundary conditions, Metropolis algorithm.

```
Hamiltonian:  H = −J Σ_{⟨ij⟩} s_i s_j          [sum over nearest-neighbour pairs]
s_i ∈ {−1, +1};  N = L×L sites

ΔE for flip at site i:
  ΔE = 2·J·s_i · (s_{up} + s_{down} + s_{left} + s_{right})

Metropolis acceptance:
  accept if ΔE ≤ 0; else accept with p = exp(−ΔE / (k_B·T))

Onsager critical temperature (exact):
  sinh(2·K_c) = 1  where K_c = J / (k_B·T_c)
  → K_c = ln(1+√2) / 2
  → T_c = 2J / [k_B·ln(1+√2)]  ≈ 2.269 J/k_B

Ground state (all spins aligned):
  E / N = −2J  (2N unique bonds, each contributing −J)
  m     = ±1   (all up or all down)

Internal energy per site at T_c (Onsager 1944):
  u_c = −J·√2  (exact; cited, not independently tested here)
```

State: `L` (lattice side), `J`, `kB`, `T`, `seed`.  Internal: `spins` Int8Array (L×L, ±1).
Constructor options: `init: 'random' | 'ordered'` (`'ordered'` = all +1, for ground-state tests).

Methods:
- `energy()` → total H (sums over all bonds, periodic BC)
- `magnetisation()` → (1/N)·Σs_i
- `sweep(n = 1)` → n Metropolis sweeps (random sequential); returns `this`
- `reset(init, seed)` → reinitialise spins
- `get Tc()` → `2 * J / (kB * Math.log(1 + Math.sqrt(2)))`
- `get Kc()` → `Math.log(1 + Math.sqrt(2)) / 2`
- `deltaE(row, col)` → ΔE for hypothetical flip at (row, col)

### Tests (`tests/physics/ising.test.js`)

**Algebraic anchors (no simulation):**

- `sinh(2 * m.Kc) = 1 ±1e-14` — Onsager critical condition; pure algebra
- `m.Kc = Math.log(1 + Math.sqrt(2)) / 2 ±1e-14` — definition check
- `m.Tc ≈ 2.269 (setting J=kB=1) ±0.001` — sanity check of formula

**Ground state (ordered init, no sweeps):**

- L=4 ordered: `energy() = −32J ±1e-14`
  (N=16 sites; unique bonds=2N=32; all s_i s_j=1; E=−32J; E/N=−2J)
- L=4 ordered: `Math.abs(magnetisation()) = 1 ±1e-14`

**ΔE formula:**

- L=4 ordered (all +1), site (0,0): `deltaE(0,0) = 2·J·(+1)·4 = 8J ±1e-14`
  (all 4 NN are +1; flip cost = 2J×s_i×4 = 8J)
- L=4 ordered, flip (0,0) to −1 manually; check `energy()` changes by +8J ±1e-14

**Seeded Monte Carlo (deterministic with seed=42):**

- `T = 0.5·Tc`, L=16, init='ordered', 200 sweeps, seed=42:
  `Math.abs(magnetisation()) > 0.90`  (ordered phase, cold start)
- `T = 3·Tc`, L=16, init='random', 500 sweeps, seed=42:
  `Math.abs(magnetisation()) < 0.15`  (disordered phase)

Analytic reason for tolerances: at T=0.5Tc Metropolis convergence is fast from ordered start;
at T=3Tc spontaneous magnetisation is exponentially suppressed.

**Source status:** sinh(2Kc)=1, Kc, Tc — algebraically exact. u_c=−√2·J — cited (Onsager 1944),
not tested here (requires large-L MC or exact formula implementation).

### View

Main panel: L×L grid of coloured cells (+1=white, −1=black); temperature slider (0 to 4·J/kB);
real-time E/N and |M| readouts updated after each display frame.
Side panel: running trace of |M| vs. sweep count; vertical dashed line at T_c.
Controls: run/pause, step (one sweep), reset-random, reset-ordered.

### Predict questions
1. Start from a random configuration at T = 0. What will happen after many sweeps?
2. Is the transition at T_c sharp or gradual for a finite lattice? How does it change with L?
3. If you flip the sign of all spins at once, does the energy change?

### Derive-it steps
1. Hamiltonian penalises anti-aligned NN pairs: each aligned pair contributes −J, anti-aligned +J
2. Metropolis: detailed balance P(A→B)/P(B→A) = exp(−βΔE) → equilibrium distribution is Boltzmann
3. At T→0: only ΔE < 0 moves accepted → system orders. At T→∞: all moves accepted → random
4. Onsager condition: transfer matrix eigenvalue degeneracy → sinh(2K_c)=1 → K_c=ln(1+√2)/2

### research.papers
- Ising, E. (1925). Beitrag zur Theorie des Ferromagnetismus. *Zeitschrift für Physik*, 31, 253–258. (1D model — no spontaneous magnetisation)
- Onsager, L. (1944). Crystal statistics I: A two-dimensional model with an order-disorder transition. *Physical Review*, 65, 117–149. (exact T_c; u_c=−√2·J)

### Where it breaks
- Metropolis is slow near T_c (critical slowing down); Wolff cluster algorithm needed for
  accurate near-critical statistics (in ising-scaling, Phase 13).
- Finite-size effects: the transition is rounded for finite L; true criticality requires L→∞.
- Only nearest-neighbour ferromagnetic interactions; long-range or frustrated models not modelled.
- No external field; the spontaneous symmetry-breaking direction is random.

---

## Bench 2 — `bench(neuroscience/networks/population-coding)`

**Path:** `js/benches/neuroscience/networks/population-coding/`
**Level:** graduate

### PopulationCodingModel.js

N neurons with Gaussian tuning curves; Poisson Fisher information; Cramér-Rao bound.

```
Tuning curve (neuron i, preferred direction θ_i):
  f_i(θ) = r_max · exp(−(θ − θ_i)² / (2σ²))        [Gaussian, linear variable θ]

Preferred directions equally spaced over [−π, π):
  θ_i = −π + (2π/N)·i   for i = 0, …, N−1

Poisson Fisher information:
  I(θ) = T · Σ_i  [f_i'(θ)]² / f_i(θ)
  f_i'(θ) = −(θ − θ_i)/σ² · f_i(θ)
  → [f_i'(θ)]²/f_i(θ) = f_i(θ) · (θ − θ_i)² / σ⁴

Cramér-Rao bound:
  Var(θ̂) ≥ 1 / I(θ)
  σ_CRB(θ) = 1 / √I(θ)

Population vector decoder:
  θ̂_pop = atan2(Σ r_i sin θ_i, Σ r_i cos θ_i)     [circular]
  r_i ~ Poisson(T·f_i(θ))                            [spike count, seeded]

MLE (for comparison): argmax_θ Σ r_i ln f_i(θ) − T·f_i(θ)  [Poisson log-likelihood]
  solved via Brent root-finding on the score equation
```

State: `N`, `rMax` (r_max), `sigma` (σ, tuning width), `T` (trial duration), `seed`.
Methods: `tuning(i, theta)`, `fisherInfo(theta)`, `sigmaCRB(theta)`,
`drawSpikes(theta)` → `[r_0, …, r_{N−1}]` (Poisson, seeded),
`popVectorEstimate(spikes)`, `mlEstimate(spikes)`,
`tuningCurves(nPoints=200)` → `[{theta, fi: [f_0,…,f_{N-1}]}]`.

### Tests (`tests/neuroscience/population-coding.test.js`)

**Fisher information — deterministic:**

- `I(θ) = T·Σ f_i(θ)·(θ−θ_i)²/σ⁴` for θ=0, N=8, σ=0.5, r_max=50, T=0.1:
  computed two ways (direct sum vs. formula) agree ±1e-10
- Single neuron at its preferred direction: `[f_i'(θ_i)]²/f_i(θ_i) = 0 ±1e-14`
  (f_i'(θ_i) = 0 since it's the peak)
- `I(θ)` scales with N: N=8 gives `I(θ)` and N=16 (same σ, r_max, T, equal spacing) gives
  `I_16 ≈ 2·I_8 ±0.05·I_8` (approximate for finite N — near-equal for smooth tuning)
- `I(θ)` scales as 1/σ²: `I(θ; σ=0.5) / I(θ; σ=1.0) ≈ 4 ±0.05·4`
  (exact for dense population; approximate for finite N=8)

**σ_CRB formula:**

- `sigmaCRB(theta) === 1 / Math.sqrt(fisherInfo(theta)) ±1e-14`

**Population vector (seeded simulation):**

- seed=42, N=16, θ_true=0, 500 trials: mean estimate ≈ 0 ±0.05; SD ≈ σ_CRB(0) ±0.05
  (tolerance derived: SE of mean = σ_CRB/√500; 4×SE; tolerance for SD = σ_CRB/√1000·4)

**Source status:** Fisher info formula — algebraically exact from Poisson likelihood.
CRB — algebraic (Cramér-Rao theorem). Population vector bias — cited (Seung & Sompolinsky 1993),
not independently derived.

### View

Left (55%): population tuning curves as overlapping Gaussian humps; highlight curve for
current θ with vertical line; bar chart of spike counts per neuron for a single trial.
Right (45%): polar plot of preferred directions (dots) and current stimulus (radial line);
population vector estimate (arrow); σ_CRB annulus showing uncertainty.

### Predict questions
1. Doubling the number of neurons (same spacing density): does σ_CRB halve, quarter, or stay the same?
2. If all neurons have very broad tuning (large σ), is the population more or less precise?
3. A neuron at its preferred direction fires maximally. Does it contribute information about θ?

### Derive-it steps
1. Poisson log-likelihood: L(θ) = Σ_i [r_i·ln(T·f_i(θ)) − T·f_i(θ)]
2. Score: ∂L/∂θ = T·Σ_i (r_i/f_i − 1)·f_i'. Fisher info I(θ) = E[–∂²L/∂θ²] = T·Σ_i [f_i'(θ)]²/f_i(θ)
3. At the peak of f_i (θ=θ_i): f_i'(θ_i) = 0; neuron contributes zero Fisher information
4. CRB: any unbiased estimator θ̂ satisfies Var(θ̂) ≥ 1/I(θ)

### research.papers
- Seung, H.S. & Sompolinsky, H. (1993). Simple models for reading neuronal population codes. *PNAS*, 90(22), 10749–10753. (Fisher info for population coding)
- Pouget, A., Dayan, P. & Zemel, R. (2000). Information processing with population codes. *Nature Reviews Neuroscience*, 1(2), 125–132. (review; no DOI for version used)

### Where it breaks
- Assumes Gaussian tuning and Poisson noise; real neurons have non-Gaussian, non-stationary noise.
- Population vector decoder is efficient only when tuning is broad and symmetric; biased for
  narrow tuning or when stimulus is near the tuning-range boundary.
- Fisher information gives a lower bound; whether MLE achieves it depends on N and σ.
- Circular (angular) variables require a von Mises tuning model for exact results; Gaussian
  tuning is an approximation.

---

## Bench 3 — `bench(neuroscience/networks/wilson-cowan)`

**Path:** `js/benches/neuroscience/networks/wilson-cowan/`
**Level:** graduate

### WilsonCowanModel.js

Two coupled populations (excitatory E and inhibitory I); sigmoid nonlinearity; RK4 integration.

```
τ_E dE/dt = −E + (1 − r_E·E)·S(w_EE·E − w_EI·I + P_E)
τ_I dI/dt = −I + (1 − r_I·I)·S(w_EI·E − w_II·I + P_I)

S(x) = 1 / (1 + exp(−κ·(x − θ_s)))          [sigmoid; κ=1 default]

r_E, r_I = refractory correction (set to 0 for non-refractory variant)

Nullclines (r_E = r_I = 0):
  E-nullcline: E = S(w_EE·E − w_EI·I + P_E)       → implicit curve
  I-nullcline: I = S(w_EI·E − w_II·I + P_I)       → implicit curve

Jacobian at (E*, I*) (r_E = r_I = 0, κ absorbed into SE', SI'):
  J = [ (−1 + w_EE·SE') / τ_E ,  (−w_EI·SE') / τ_E ]
      [ (w_IE·SI')       / τ_I ,  (−1 − w_II·SI') / τ_I ]

  where SE' = S'(w_EE·E*−w_EI·I*+P_E), etc.

Stability conditions:
  Stable node/spiral:   tr(J) < 0 AND det(J) > 0 AND tr(J)² ≥ 4·det(J) / <  for node/spiral
  Hopf bifurcation:     tr(J) = 0, det(J) > 0  → limit cycle
  Saddle:               det(J) < 0
```

State: `wEE`, `wEI`, `wIE`, `wII`, `tauE`, `tauI`, `PE`, `PI`, `rE`, `rI`, `kappa`, `thetaS`.
Methods:
- `dEdt(E, I)`, `dIdt(E, I)` → right-hand sides
- `sigmoid(x)` → S(x); `sigmoidPrime(x)` → S'(x)
- `fixedPoint(E0, I0)` → Newton iteration from initial guess; returns `{E, I}` or null
- `jacobian(E, I)` → `[[a,b],[c,d]]`
- `stability(E, I)` → `{tr, det, discriminant, type}` (`'stable-node'|'stable-spiral'|'unstable-spiral'|'saddle'|'hopf'`)
- `run(E0, I0, tMax, dt=0.01)` → `[{t, E, I}]`  (RK4)
- `nullclineE(nPoints=200)` → `[{E, I}]` (E-nullcline by sweeping E, solving for I numerically)
- `nullclineI(nPoints=200)` → `[{E, I}]` (I-nullcline)

### Tests (`tests/neuroscience/wilson-cowan.test.js`)

**Sigmoid properties:**

- `S(0) = 0.5 ±1e-14` (κ=1, θ_s=0)
- `S(x) ∈ (0,1)` strictly for x ∈ {−10, −1, 0, 1, 10} ±1e-15
- `S'(x) = S(x)·(1−S(x)) ±1e-14` (derivative identity for logistic sigmoid, κ=1)

**Fixed point verification:**

Standard parameters: wEE=12, wEI=4, wIE=13, wII=11, τ_E=τ_I=1, P_E=−2, P_I=−3.5, κ=1, θ_s=4,
r_E=r_I=0.

- `fixedPoint()` returns (E*, I*) such that `|dEdt(E*, I*)| < 1e-10` and `|dIdt(E*, I*)| < 1e-10`
- Jacobian at (E*, I*): tr(J) and det(J) match closed-form computation from J entries ±1e-12
  (computed two ways: explicit 2×2 formula vs. `stability()` output)
- `stability()` at a stable FP: `tr < 0 AND det > 0` (at least one FP should be stable)

**RK4 trajectory:**

- Starting near stable FP (perturb by ±0.01), run to tMax=50, dt=0.01:
  `|E(50) − E*| < 0.01 AND |I(50) − I*| < 0.01`
- Starting far from FP (E=0.1, I=0.1), stable params: trajectory converges, |E(100)−E*| < 0.05

**Nullcline consistency:**

- E-nullcline at point E*: `|I_nullcline_E(E*) − I*| < 1e-4`
  (compute I from E-nullcline equation at E=E*; should give I*)
- I-nullcline at point I*: `|E_nullcline_I(I*) − E*| < 1e-4`

**Source status:** All test anchors algebraic from model equations; no empirical constants.
Hopf bifurcation existence for specific parameter choice — cited (Wilson & Cowan 1972),
not independently verified here (would require parameter sweep test with wide tolerance).

### View

Phase plane (main, 65%): E–I axes; E-nullcline (red) and I-nullcline (blue); fixed points
as dots (stability coded: filled=stable, open=unstable); trajectory from draggable initial
condition; limit cycle if it exists.
Side panel (35%): time series E(t) and I(t); parameter sliders (P_E, P_I, w_EE).

### Predict questions
1. If you increase w_EE (excitatory self-coupling), what happens to the nullclines?
2. At a Hopf bifurcation, what is the sign of tr(J)?
3. What does the intersection of the two nullclines represent?

### Derive-it steps
1. Each population: τ·du/dt = −u + (1−r·u)·S(input) — decay + sigmoid of total input
2. Fixed point: both dE/dt=dI/dt=0; find nullcline intersections graphically or via Newton
3. Linearise: Jacobian J has tr(J) = sum of eigenvalues, det(J) = product
4. Stability: tr < 0, det > 0 → stable; Hopf: tr = 0, det > 0 → eigenvalues cross imaginary axis → limit cycle

### research.papers
- Wilson, H.R. & Cowan, J.D. (1972). Excitatory and inhibitory interactions in localized populations of model neurons. *Biophysical Journal*, 12(1), 1–24. https://doi.org/10.1016/S0006-3495(72)86068-5

### Where it breaks
- Only two population variables; real cortex has spatial extent and many cell types.
- Sigmoid nonlinearity is a mean-field approximation; single-neuron noise is ignored.
- Refractory terms r_E, r_I constrain maximum activity but do not model spike timing.
- Parameter space is large; most parameter settings do not produce interesting dynamics.

---

## Bench 4 — `bench(psychology/learning/bayesian-observer)`

**Path:** `js/benches/psychology/learning/bayesian-observer/`
**Level:** university

### BayesianObserverModel.js

Optimal multisensory integration (two Gaussian cues); maximum likelihood estimation.

```
Model:
  Cue 1: x₁ ~ N(s, σ₁²)   (noisy observation of true stimulus s)
  Cue 2: x₂ ~ N(s, σ₂²)

Optimal (MLE = MAP with flat prior) estimate:
  ŝ = w₁·x₁ + w₂·x₂
  where w_i = (1/σ_i²) / (1/σ₁² + 1/σ₂²)   [weight ∝ reliability 1/σ²]

Combined precision:
  1/σ_comb² = 1/σ₁² + 1/σ₂²
  σ_comb = 1/√(1/σ₁² + 1/σ₂²)

Special case σ₁=σ₂=σ:
  σ_comb = σ/√2   (exact);   w₁ = w₂ = 0.5

Conflict detection (full model, optional):
  P(C=1 | x₁,x₂) ∝ Gaussian(x₁−x₂; 0, σ₁²+σ₂²)  [single common cause]
  P(C=2 | x₁,x₂) ∝ Gaussian(x₁; 0, σ₁²)·Gaussian(x₂; 0, σ₂²)  [two causes]
  (causal inference; optional, for "where it breaks" demo)
```

State: `sigma1`, `sigma2`, `seed`.
Methods:
- `w1()`, `w2()` → optimal weights
- `sigmaComb()` → combined noise SD
- `estimate(x1, x2)` → ŝ (weighted mean)
- `drawObservations(sTrue, nTrials)` → `[{x1, x2}]` (seeded Gaussian draws via `Random`)
- `msePredicted()` → σ_comb² (theoretical MSE)
- `meanError(trials)` → mean signed error ŝ−s
- `sdError(trials)` → SD of ŝ−s (should approximate σ_comb)

### Tests (`tests/psychology/bayesian-observer.test.js`)

**Algebraic (deterministic):**

- `sigmaComb(1, 2)` = 1/√(1+1/4) = 2/√5 ±1e-14
- `sigmaComb(1, 1)` = 1/√2 ±1e-14
- `w1() + w2()` = 1 ±1e-14  (partition of unity)
- `w1() / w2()` = σ₂²/σ₁² ±1e-14  (reliability ratio)
- `estimate(x1=0, x2=0)` = 0 ±1e-14  (zero observations → zero estimate)
- `estimate(x1=1, x2=1)` = 1 ±1e-14  (equal observations → identical to each)
- `estimate(x1=1, x2=3)` = w1·1 + w2·3 ±1e-14  (weighted by reliability)

**Simulation (seeded):**

Parameters: σ₁=1, σ₂=2, s_true=5, N=2000 trials, seed=42.
Expected: ŝ ~ N(5, σ_comb²) with σ_comb = 2/√5 ≈ 0.894.

- `meanError(trials)` ≈ 0 ±0.08  [4×SE: σ_comb/√2000 ≈ 0.020, 4×0.020 = 0.080]
- `sdError(trials)` ≈ σ_comb ±0.057  [4×SE: σ_comb/√4000 ≈ 0.014, 4×0.014 = 0.056]

Tolerance derivation: SE of sample mean = σ_comb/√N; SE of sample SD ≈ σ_comb/√(2N).
Four-sigma tolerances applied throughout.

**Sub-optimal comparison:**

- Equal-weight estimate (w₁=w₂=0.5) vs. optimal: MSE_equal > MSE_optimal when σ₁≠σ₂.
  Verify: `varianceEqual > varianceComb` (σ₁=1, σ₂=3, theoretical) ±1e-14

**Source status:** σ_comb formula — algebraically exact (inverse-variance weighting).
Simulation tolerances derived from CLT, seed=42.

### View

Left (55%): overlapping Gaussian likelihood curves for cue 1 (red, narrow/wide) and cue 2
(blue); product (optimal posterior) in purple; vertical lines at x₁, x₂, ŝ.
Right (45%): scatter plot of N=200 seeded trials (x₁ vs. x₂); colour-coded by ŝ; inset shows
histogram of ŝ errors with N(0, σ_comb²) overlay.
Sliders: σ₁, σ₂, s_true; toggle to show sub-optimal equal-weight estimator.

### Predict questions
1. If σ₁=1 and σ₂=10, which cue dominates the combined estimate?
2. When two senses give conflicting readings (x₁≠x₂), does the combined estimate always
   fall between them?
3. Adding a second noisy cue always helps. How much does it help when σ₂=σ₁?

### Derive-it steps
1. Joint likelihood: L(s) = N(x₁; s, σ₁²)·N(x₂; s, σ₂²)
2. Maximise over s: d/ds ln L = (x₁−s)/σ₁² + (x₂−s)/σ₂² = 0
3. Solve: s = (x₁/σ₁² + x₂/σ₂²) / (1/σ₁² + 1/σ₂²)
4. Variance: Var(ŝ) = Var(w₁x₁+w₂x₂) = w₁²σ₁²+w₂²σ₂² = 1/(1/σ₁²+1/σ₂²) = σ_comb²

### research.papers
- Ernst, M.O. & Banks, M.S. (2002). Humans integrate visual and haptic information in a statistically optimal fashion. *Nature*, 415, 429–433. https://doi.org/10.1038/415429a

### Where it breaks
- Assumes Gaussian noise and flat prior; non-Gaussian signals (e.g., skewed prior) require
  a full Bayesian model.
- People do not always weight ∝ 1/σ²; prior miscalibration causes systematic bias.
- When the two cues conflict strongly, people often ignore one cue or detect the conflict
  explicitly (causal-inference model; not implemented here).
- Model assumes independent noise; correlated noise (e.g., shared neural substrate) reduces
  the benefit of combining.

---

## `[infra]` Graph.js

**File:** `js/core/Graph.js`
**Pre-bench:** before graph-theory bench

### API

```javascript
class Graph {
  constructor({ directed = false } = {})
  addNode(id)                     // add node; idempotent
  addEdge(u, v, weight = 1)       // add edge (undirected: also v→u)
  degree(v)                       // number of edges from v
  degrees()                       // Map<id, degree>
  adjacencyList()                 // Map<id, [{to, weight}]>
  dijkstra(source)                // Map<id, dist>; Infinity if unreachable
  bfs(source)                     // Map<id, distance> (hop count)
  dfs(source)                     // Map<id, discovery time> (integer)
  isConnected()                   // bool (undirected)
  get nodeCount()                 // |V|
  get edgeCount()                 // |E|
}

// Standalone helpers (no class):
export function eulerCharacteristic(V, E, F) { return V - E + F; }
export function handshakingLemma(graph)      { /* 2|E| = Σ deg(v) */ }
```

### Tests (`tests/math/graph.test.js`)

- Dijkstra on 5-node graph A–E:
  edges A→B:1, A→C:4, B→C:2, B→D:5, C→D:1;
  `dijkstra('A')`: B=1, C=3 (A→B→C), D=4 (A→B→C→D), E=Infinity ±1e-10
- `handshakingLemma(g)`: 2·|E| = Σdeg(v) for the same graph ±0 (exact integer)
- K4 planar faces: eulerCharacteristic(4, 6, 4) = 2 ±0 (Euler formula for tetrahedron)
- Cube: eulerCharacteristic(8, 12, 6) = 2 ±0
- `isConnected()` = true for connected graph, false after removing all edges
- Disconnected: `dijkstra('A').get('E')` = Infinity

---

## Bench 5 — `bench(math/graph-theory/graph-theory)` ← requires Graph.js

**Path:** `js/benches/math/graph-theory/graph-theory/`
**Kind:** explorer
**Level:** university

### GraphTheoryBench.js

Interactive graph explorer: build custom graphs, run algorithms, verify Euler's formula.

The bench uses `Graph` from `js/core/Graph.js`.  It wraps no additional model logic — all
computation is done via Graph methods.

Built-in named graphs (presets): path, cycle, K4 (complete on 4), cube (Q3), Petersen,
binary tree (depth 3).

### Tests (`tests/math/graph-theory.test.js`)

- **Euler characteristic:** K4: V−E+F=4−6+4=2 ±0; cube: V−E+F=8−12+6=2 ±0
  (F computed as E−V+2 for connected planar graph; the bench records F for each preset)
- **Handshaking:** `2*graph.edgeCount === [...graph.degrees().values()].reduce((a,b)=>a+b,0)` ±0
  for K4, path(5), cycle(6)
- **Dijkstra on 5-node example** (same as Graph.js test above): A→D = 4 ±1e-10
- **Tree property:** for binary-tree preset (V=15, E=14): E = V−1 ±0; F=1 (outerplanar, one face)
- **Non-planar Petersen graph:** V−E = 10−15 = −5; since it is not planar, Euler's formula
  does not apply — test that `eulerCharacteristic(10, 15, F)` would require F=7 for a non-planar embedding
  (bench records this as a "where it breaks" demonstration)

**Source status:** V−E+F=2 — cited (Euler 1736); algebraic. Dijkstra — algebraic.

### View

Canvas: drag-to-place nodes; click-to-add edges; edge weight input; delete mode.
Algorithm panel: run Dijkstra (highlight shortest path tree in colour); BFS/DFS (animate
discovery order); show degrees as node labels.
Formula panel: live V, E, F readout; F computed from E−V+2 (for connected planar graphs);
Euler formula checker; Handshaking equality checker.
Presets: buttons to load named graphs.

### Predict questions
1. A graph has 6 nodes and 9 edges. If it is connected and planar, how many faces must it have?
2. In any undirected graph, what is the sum of all vertex degrees?
3. Does Dijkstra give the correct shortest path for a graph with a negative-weight edge?

### Derive-it steps
1. Euler 1736: for any connected planar graph, V−E+F=2 (vertices, edges, faces including outer)
2. Handshaking: each edge contributes 1 to each of its two endpoints → total degree = 2|E|
3. Dijkstra: greedy extraction from priority queue; correctness relies on non-negative weights

### research.papers
- Euler, L. (1736). Solutio problematis ad geometriam situs pertinentis. *Commentarii Academiae Petropolitanae*, 8, 128–140. (Seven Bridges of Königsberg; basis of graph theory)
- Dijkstra, E.W. (1959). A note on two problems in connexion with graphs. *Numerische Mathematik*, 1, 269–271. (shortest path algorithm)

### Where it breaks
- V−E+F=2 holds only for connected planar graphs (disconnected: V−E+F = C+1 where C = components).
- Dijkstra fails for negative edge weights (use Bellman-Ford instead).
- No weighted planarity testing; checking if a given graph is planar requires Kuratowski's
  theorem or a linear-time algorithm (neither implemented here).
- All graphs are undirected; directed graphs need separate algorithms for strong connectivity.

---

## Bench 6 — `bench(economics/markets/elasticity)`

**Path:** `js/benches/economics/markets/elasticity/`
**Level:** intro

### ElasticityModel.js

Price elasticity of demand; unit elastic locus; Lerner index.

```
Linear demand:   Q_d(P) = a − b·P         (a, b > 0)
  Point elasticity: ε_d(P) = (dQ_d/dP)·(P/Q_d) = −b·P/(a − b·P)

Constant-elasticity demand:
  Q_d(P) = A·P^ε_d                          (ε_d < 0)
  Revenue: R(P) = P·Q_d = A·P^(1+ε_d)
  dR/dP = A·(1+ε_d)·P^{ε_d} = 0 when ε_d = −1  [unit elastic]

Revenue rule (linear demand):
  R(P) = P·Q_d(P); dR/dP = Q_d + P·(dQ_d/dP) = Q_d·(1 + 1/ε_d)
  dR/dP = 0  ↔  ε_d = −1  (revenue is maximised at the unit-elastic price)

Unit-elastic price (linear):
  ε_d(P*) = −1  →  −b·P*/(a − b·P*) = −1  →  P* = a/(2b);  Q* = a/2

Lerner index (market power):
  L = (P − MC) / P = −1/ε_d     [monopoly profit-maximisation condition]

Income elasticity of demand:
  ε_I = (∂Q/∂I)·(I/Q)
  Normal good: ε_I > 0; Inferior: ε_I < 0; Luxury: ε_I > 1
```

State: `a`, `b` (linear demand params), `MC` (marginal cost), `I_income` (optional).
Methods:
- `demand(P)` → Q_d(P)
- `priceElasticity(P)` → ε_d(P)
- `revenue(P)` → R(P) = P·Q_d(P)
- `marginalRevenue(P)` → dR/dP (computed analytically)
- `unitElasticPrice()` → P* = a/(2b)
- `lernerIndex(P)` → (P−MC)/P
- `lernerFromElasticity(P)` → −1/ε_d(P) (independent cross-check)
- `demandCurve(nPoints=300)` → `[{P, Q, epsilon, R}]`

### Tests (`tests/economics/elasticity.test.js`)

- `priceElasticity(P)` = −b·P/(a−b·P) ±1e-10 for a=100, b=1, P=30
- `unitElasticPrice()` = a/(2b) ±1e-14 (exact algebraic)
- At `P = unitElasticPrice()`: `priceElasticity(P) = −1 ±1e-10`
- At `P = unitElasticPrice()`: `marginalRevenue(P) ≈ 0 ±1e-8`
  (MR = 0 at unit-elastic price; numerical deriv tolerance)
- Revenue is maximised at unit-elastic price: `revenue(P*) ≥ revenue(P*·0.9)` and
  `revenue(P*) ≥ revenue(P*·1.1)` ±1e-10
- Lerner index: `lernerIndex(P)` = `lernerFromElasticity(P) ±1e-10` (two routes agree)
- Elastic regime (|ε_d|>1): cutting P raises revenue; verify `revenue(P₁) > revenue(P₂)`
  for P₁ < P₂ both in elastic range ±1e-10
- Inelastic regime (|ε_d|<1): cutting P lowers revenue; verify `revenue(P₁) < revenue(P₂)`
  for P₁ < P₂ both in inelastic range ±1e-10

**Source status:** all formulas algebraically exact from demand function definition.

### View

Left (60%): P–Q demand curve; shaded rectangle = revenue P·Q; vertical dashed at unit-elastic
price P*; colour-coded elastic (green) / inelastic (red) regions above/below P*.
Right (40%): R(P) revenue curve; ε_d(P) elasticity curve; horizontal ε_d=−1 line; vertical
Lerner index bar at current P.

### Predict questions
1. A 10% price cut causes a 15% quantity increase. Is demand elastic or inelastic here?
2. A profit-maximising monopolist sets MR = MC. What does this imply about |ε_d|?
3. For a constant-elasticity demand Q=100·P^(−2): does revenue increase or decrease with P?

### Derive-it steps
1. Elasticity: ε_d = (dQ/dP)·(P/Q) — percentage change in Q per 1% change in P
2. Revenue: R = P·Q; dR/dP = Q + P·(dQ/dP) = Q·(1 + 1/ε_d)
3. Max revenue: dR/dP = 0 → ε_d = −1 (unit elastic)
4. Lerner: monopolist sets MR=MC → MR = P(1+1/ε_d) = MC → L = (P−MC)/P = −1/ε_d

### research.papers
- Marshall, A. (1890). *Principles of Economics*. Macmillan. (concept of elasticity of demand)
- Lerner, A.P. (1934). The concept of monopoly and the measurement of monopoly power. *Review of Economic Studies*, 1(3), 157–175. (Lerner index)

### Where it breaks
- Linear demand is a local approximation; constant-elasticity demand is a global model but
  requires ε_d < −1 for finite total expenditure.
- Point elasticity varies along a linear demand curve; a single "elasticity number" only makes
  sense for constant-elasticity or locally.
- The Lerner index assumes a profit-maximising monopolist; oligopolies require game-theoretic
  treatment.
- Income elasticity classification (normal/inferior/luxury) is a local, ceteris-paribus result;
  real demand depends on substitutes, complements, and credit.

---

## Bench 7 — `bench(economics/network-economics/inequality)`

**Path:** `js/benches/economics/network-economics/inequality/`
**Level:** intro

### InequalityModel.js

Lorenz curve and Gini coefficient for Pareto, Uniform, and Exponential distributions.

```
Pareto distribution (F(x) = 1−(x_m/x)^α, x ≥ x_m, α > 1):
  Lorenz curve:  L(p) = 1 − (1−p)^{(α−1)/α}
  Gini:          G = 1/(2α−1)                             [exact algebraic]

Uniform distribution [0, b]:
  Lorenz curve:  L(p) = p²
  Gini:          G = 1/3                                  [exact algebraic]

Exponential distribution (λ):
  Lorenz curve:  L(p) = p + (1−p)·ln(1−p)                [exact analytic]
  Gini:          G = 1/2                                  [exact algebraic]

Gini from Lorenz curve:
  G = 1 − 2·∫₀¹ L(p) dp

Top income share: fraction of total income held by top (1−q) fraction:
  topShare(q) = 1 − L(q)

Lorenz properties (for any distribution):
  L(0) = 0;  L(1) = 1;  L(p) ≤ p  (curve below diagonal);  L'(p) ≥ 0 (non-decreasing)
```

State: `dist` (`'pareto'|'uniform'|'exponential'`), `alpha` (Pareto shape, default 2),
`b` (Uniform upper limit, default 1), `lambda` (Exponential rate, default 1).
Methods:
- `lorenz(p)` → L(p) (closed form)
- `gini()` → G (closed form)
- `giniNumerical(nPoints=1000)` → trapezoid integral of 1−2∫L(p)dp (independent check)
- `topShare(q)` → 1−L(q)
- `lorenzCurve(nPoints=200)` → `[{p, Lp}]`

### Tests (`tests/economics/inequality.test.js`)

**Algebraic Gini anchors:**

- `gini('pareto', α=2)` = 1/(2·2−1) = 1/3 ±1e-14
- `gini('pareto', α=3)` = 1/(2·3−1) = 0.2 ±1e-14
- `gini('pareto', α=1.5)` = 1/(2·1.5−1) = 1/2 ±1e-14
- `gini('uniform')` = 1/3 ±1e-14
- `gini('exponential')` = 0.5 ±1e-14

**Lorenz curve properties:**

- `lorenz(0) = 0 ±1e-14`;  `lorenz(1) = 1 ±1e-14`  (all three distributions)
- `lorenz(p) ≤ p` for p ∈ {0.2, 0.5, 0.8}  (all three distributions)  ±1e-14
- Concavity: `lorenz(0.5) ≤ (lorenz(0.25) + lorenz(0.75))/2 + 1e-12`  (all three) ±1e-12

**Top income share (Pareto α=2):**

- `topShare(0.8)` = 1 − L(0.8) = (1−0.8)^{(α−1)/α} = (0.2)^{1/2} = 1/√5 ±1e-14
  (exact algebra: 1−L(p) = (1−p)^{(α−1)/α})

**Numerical cross-check:**

- `giniNumerical('pareto', α=2, nPoints=2000)` ≈ `gini('pareto', α=2)` ±0.001
  (trapezoid on 2000 points; trapezoidal error O(1/nPoints²) ≈ 2.5e-7 for smooth L)

**Source status:** all formulas algebraically exact; no empirical constants.

### View

Left (60%): Lorenz curve plot; diagonal equality line; shaded area between curve and diagonal
(= G/2); curve for each preset overlaid.
Right (40%): Gini coefficient bar chart comparing Pareto (α=1.5 to α=5), Uniform, Exponential;
top-X% income share readout (X slider: 5% to 50%).

### Predict questions
1. For Pareto α=2, what fraction of income does the top 20% earn?  (Use 1−L(0.8).)
2. As α→∞ for Pareto, does inequality increase or decrease?
3. If G=0, what does the Lorenz curve look like? What income distribution has G=0?

### Derive-it steps
1. Lorenz curve: L(p) = (∫_{0}^{F^{-1}(p)} x·f(x)dx) / μ  where μ = mean
2. Pareto: ∫_{x_m}^{x_m·(1−p)^{−1/α}} x·f(x)dx / μ; integrate to get L(p) = 1−(1−p)^{(α−1)/α}
3. Uniform [0,b]: ∫_0^{bp} x·(1/b)dx / (b/2) = p²
4. Gini = 1−2∫₀¹ L(p)dp; for Pareto: G = 1−2·[1/(α−1)/(2α−1)·α] = 1/(2α−1)  (algebra)

### research.papers
- Lorenz, M.O. (1905). Methods of measuring the concentration of wealth. *Publications of the American Statistical Association*, 9(70), 209–219. (Lorenz curve)
- Gini, C. (1912). *Variabilità e mutabilità*. Tipografia di Paolo Cuppini. (Gini coefficient)
- Pareto, V. (1896). *Cours d'économie politique*. Université de Lausanne. (Pareto distribution)

### Where it breaks
- Gini coefficient ignores the shape of inequality within deciles (two distributions can share
  the same Gini but have very different Lorenz curves that cross).
- Pareto tail index α is estimated from data with high uncertainty; α ≤ 1 has no finite mean.
- Top-income data are under-reported in household surveys; actual inequality is higher.
- Negative incomes (debt) violate the Lorenz curve assumption that all incomes are non-negative.

---

## Implementation order

1. `[infra] Graph.js` — new file `js/core/Graph.js` with unit tests in `tests/math/graph.test.js`
2. `ising` — L=32 default; seeded MC tests use L=16 for speed
3. `population-coding` — Gaussian tuning + Poisson Fisher info
4. `wilson-cowan` — RK4 + Newton fixed-point solver
5. `bayesian-observer` — Gaussian MLE; uses existing `Random` from `js/core/Random.js`
6. `graph-theory` — explorer bench using Graph.js
7. `elasticity` — closed-form; reuse `supply-demand` bench shape for view
8. `inequality` — closed-form; Lorenz curve + Gini

One commit per item. `npm test` before every commit.

---

## After all eight commits

- Update `docs/ROADMAP.md` (7 ticked bench entries + Graph.js infra note)
- Update `README.md` (7 new simulation rows)
- Update `js/catalog.js` (3 new fields, 7 bench entries)
- `npm test` — target ≥ 979 + ~50 new tests, 0 fail
- Create `docs/reviews/phase-11.md`

---

## Key reuse

| Need | File |
|---|---|
| RK4 integration (WC, population coding) | `js/core/Integrators.js` |
| Root-finding (WC fixed point, elasticity unit elastic) | `js/core/RootFinding.js` |
| Seeded RNG (ising, pop-coding, BayesObs) | `js/core/Random.js` — `new Random(seed)`, `.next()`, `.gaussian()` |
| LinAlg (WC Jacobian eigenvalues) | `js/core/LinAlg.js` — `eigenvalues2x2()` |
| Two-panel view | `js/benches/biology/ecology/logistic/LogisticView.js` |
| Supply-demand bench layout (elasticity) | `js/benches/economics/markets/supply-demand/SupplyDemandView.js` |
| Graph infrastructure (graph-theory) | `js/core/Graph.js` (new — commit 1 of this phase) |

---

## Estimated tests per bench

| Bench | Est. new tests | Running total |
|---|---|---|
| [infra] Graph.js | +6 | 985 |
| ising | +8 | 993 |
| population-coding | +8 | 1001 |
| wilson-cowan | +9 | 1010 |
| bayesian-observer | +9 | 1019 |
| graph-theory | +5 | 1024 |
| elasticity | +8 | 1032 |
| inequality | +10 | 1042 |
| **Total** | **+63** | **1042** |
