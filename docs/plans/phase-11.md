# Phase 11 — 7 benches

## Context

Phase 10b/c is complete (982 tests pass). Phase 11 adds 7 benches across Physics, Neuroscience,
Math, Economics, Chemistry, and Biology. It also requires one infrastructure commit (Graph.js)
before the graph-theory bench.

Anchors verified: `tools/anchors-phase11.mjs` — all asserts pass.

One commit per bench (plus one for Graph.js). `npm test` green before every commit. No push.

---

## Shared infrastructure changes

### New catalog fields (add to `js/catalog.js`)

| Subject | Field id | Label | Benches |
|---|---|---|---|
| Physics | `statistical-mechanics` | Statistical Mechanics | ising |
| Math | `graph-theory` | Graph Theory | graph-theory |
| Economics | `network-economics` | Network Economics | inequality |
| Chemistry | `surface` | Surface Chemistry | langmuir |

Existing fields receiving new benches:

| Subject | Existing field id | New bench ids |
|---|---|---|
| Neuroscience | `networks` | population-coding, wilson-cowan |
| Biology | `ecology` | competitive-exclusion |

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
  → T_c = 2J / [k_B·ln(1+√2)]  = 2.2691853142130221  (J = k_B = 1)

Ground state (all spins aligned, ordered init):
  E / N = −2J  (2N unique bonds, each contributing −J)
  m     = ±1   (all up or all down)

Yang magnetisation (below T_c):
  m(T) = (1 − sinh(2K)^{−4})^{1/8}   [K = J/(k_B·T); T < T_c]
  At T = T_c/2:  K = ln(1+√2),  sinh(2K) = 2√2 (exact)
  → m(T_c/2) = (1 − 1/64)^{1/8} = (63/64)^{1/8} = 0.9980333916921637  ±1e-14

Internal energy per site at T_c (Onsager 1944):
  u_c = −J·√2  (exact; cited, not tested here)
```

State: `L` (lattice side, ≥3), `J` (>0), `kB` (>0), `T` (>0), `seed`.
Internal: `spins` Int8Array (L×L, ±1).
Constructor option: `init: 'random' | 'ordered'` (`'ordered'` = all +1).

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
- `m.Tc = 2.2691853142130221 ±1e-14`

**Ground state (ordered init, no sweeps):**

- L=4 ordered: `energy() = −32J ±1e-14`
  (N=16 sites; 2N=32 unique bonds; all s_i s_j=1; E=−32J; E/N=−2J)
- L=4 ordered: `Math.abs(magnetisation()) = 1 ±1e-14`

**ΔE formula:**

- L=4 ordered (all +1), site (0,0): `deltaE(0,0) = 8J ±1e-14`
  (all 4 NN are +1; flip cost = 2J×s_i×4 = 8J)

**Yang formula (algebraic, no simulation):**

- At T = T_c/2 (K = ln(1+√2)): `Math.sinh(2K) = 2√2 ±1e-14` (exact; verified in anchors script)
- `(63/64)^{1/8} = 0.9980333916921637 ±1e-14` (Yang magnetisation at T=Tc/2)

**Seeded Monte Carlo (deterministic with seed=42, ordered start):**

- `T = 0.5·Tc`, L=16, init='ordered', 200 sweeps, seed=42:
  `Math.abs(magnetisation()) > 0.90`  (ordered phase, cold start from ordered)
- `T = 3·Tc`, L=16, init='random', 500 sweeps, seed=42:
  `Math.abs(magnetisation()) < 0.15`  (disordered phase)

Note on Predict 1: starting from *ordered* at T < T_c, the system stays ordered. Starting
from *random* at low T, Metropolis can get stuck in striped metastable states (~23% of starts
for L=16 at T=0.5·T_c, 400 sweeps). Tests use ordered init to avoid this ambiguity.

**Source status:** sinh(2Kc)=1, Kc, Tc, Yang formula — algebraically exact (verified in
anchors script). u_c=−√2·J — cited (Onsager 1944), not tested here.

### View

Main panel: L×L grid of coloured cells (+1=white, −1=black); temperature slider (0 to 4·J/kB);
real-time E/N and |M| readouts updated after each display frame.
Side panel: running trace of |M| vs. sweep count; vertical dashed line at T_c.
Controls: run/pause, step (one sweep), reset-random, reset-ordered.

### Predict questions
1. Starting from a fully ordered configuration at T < T_c, what happens after many sweeps?
2. Is the transition at T_c sharp or gradual for a finite lattice? How does it change with L?
3. If you flip the sign of all spins at once, does the energy change?

### Derive-it steps
1. Hamiltonian penalises anti-aligned NN pairs: each aligned pair → −J, anti-aligned → +J
2. Metropolis: detailed balance P(A→B)/P(B→A) = exp(−βΔE) → equilibrium is Boltzmann
3. At T→0: only ΔE < 0 moves accepted → system orders. At T→∞: all moves accepted → random
4. Onsager condition: transfer matrix eigenvalue degeneracy → sinh(2K_c)=1 → K_c=ln(1+√2)/2

### research.papers
- Ising, E. (1925). Beitrag zur Theorie des Ferromagnetismus. *Zeitschrift für Physik*, 31, 253–258.
- Onsager, L. (1944). Crystal statistics I. *Physical Review*, 65, 117–149. (exact T_c; u_c=−√2·J)
- Yang, C.N. (1952). The spontaneous magnetization of a two-dimensional Ising model. *Physical Review*, 85, 808–816. (exact magnetisation formula m=(1−sinh(2K)⁻⁴)^{1/8})

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

Poisson Fisher information (trial duration T):
  I(θ) = T · Σ_i  [f_i'(θ)]² / f_i(θ)
  f_i'(θ) = −(θ − θ_i)/σ² · f_i(θ)
  → [f_i'(θ)]²/f_i(θ) = f_i(θ) · (θ − θ_i)² / σ⁴

σ-scaling (continuous-population limit):
  I(θ) ≈ T·r_max·N / (√(2π)·σ)   [scales as 1/σ, NOT 1/σ²]
  Finite N=8 numerical check: I(σ=0.5)/I(σ=1.0) ≈ 2.034 ±0.1  (continuous limit = 2.000)

Score equation (log-likelihood derivative):
  ∂L/∂θ = T · Σ_i (r_i/f_i(θ) − 1) · f_i'(θ)     [T = trial duration]

Cramér-Rao bound:
  Var(θ̂) ≥ 1 / I(θ);   σ_CRB(θ) = 1 / √I(θ)

Population vector decoder:
  θ̂_pop = atan2(Σ r_i sin θ_i, Σ r_i cos θ_i)     [circular mean]
  r_i ~ Poisson(T·f_i(θ))                            [spike count, seeded]

MLE: θ̂_MLE = argmax_θ Σ_i [r_i·ln f_i(θ) − T·f_i(θ)]
  Method: grid search over [−π, π) then refine with RootFinding.brent on score = 0
  (Score is not monotone in general → single Brent root is not sufficient)
```

State: `N`, `rMax` (r_max), `sigma` (σ), `T` (trial duration), `seed`.
Methods: `tuning(i, theta)`, `fisherInfo(theta)`, `sigmaCRB(theta)`,
`drawSpikes(theta)` → `[r_0, …, r_{N−1}]` (Poisson, seeded via `Random.normalSeeded()`),
`popVectorEstimate(spikes)`, `mlEstimate(spikes)`,
`tuningCurves(nPoints=200)` → `[{theta, fi: [f_0,…,f_{N-1}]}]`.

### Tests (`tests/neuroscience/population-coding.test.js`)

**Fisher information — deterministic:**

- `I(θ) = T·Σ f_i(θ)·(θ−θ_i)²/σ⁴` for θ=0, N=8, σ=0.5, r_max=50, T=0.1:
  computed two ways (direct sum vs. `fisherInfo()`) agree ±1e-10
- Single neuron at its preferred direction: `[f_i'(θ_i)]²/f_i(θ_i) = 0 ±1e-14`
  (f_i'(θ_i) = 0 since it's the peak)
- σ-scaling (N=8, θ=0, r_max=50, T=0.1):
  `I(σ=0.5) / I(σ=1.0) ≈ 2.034 ±0.1`  (1/σ scaling; continuous limit = 2.000)
- N-scaling (σ=1.0, θ=0, r_max=50, T=0.1):
  `I(N=16) / I(N=8) ≈ 2.011 ±0.1`  (linear in N; both N=8 and N=16 computed)

**σ_CRB formula:**

- `sigmaCRB(theta) === 1 / Math.sqrt(fisherInfo(theta)) ±1e-14`

**Population vector (seeded simulation):**

- seed=42, N=16, θ_true=0, 500 trials: mean estimate ≈ 0 ±0.05; SD ≈ σ_CRB(0) ±0.1
  (tolerance derived: SE of mean = σ_CRB/√500; 4×SE)

**Source status:** Fisher info formula — algebraically exact from Poisson likelihood.
CRB — algebraic (Cramér-Rao theorem). σ-scaling 1/σ — verified numerically in anchors script.

### View

Left (55%): population tuning curves as overlapping Gaussian humps; vertical line for current θ;
bar chart of spike counts per neuron for a single trial.
Right (45%): polar plot of preferred directions; population vector estimate (arrow);
σ_CRB annulus showing uncertainty.

### Predict questions
1. Doubling neuron density (same total σ) — does σ_CRB halve, quarter, or change by √2?
2. If all neurons have very broad tuning (large σ), is the population more or less precise?
3. A neuron at its preferred direction fires maximally. Does it contribute Fisher information?

### Derive-it steps
1. Poisson log-likelihood: L(θ) = Σ_i [r_i·ln(T·f_i(θ)) − T·f_i(θ)]
2. Score: ∂L/∂θ = T·Σ_i (r_i/f_i − 1)·f_i'(θ). Fisher info I(θ) = E[−∂²L/∂θ²] = T·Σ_i [f_i'(θ)]²/f_i(θ)
3. At the peak of f_i (θ=θ_i): f_i'(θ_i) = 0; neuron contributes zero Fisher information
4. CRB: any unbiased estimator θ̂ satisfies Var(θ̂) ≥ 1/I(θ)

### research.papers
- Seung, H.S. & Sompolinsky, H. (1993). Simple models for reading neuronal population codes. *PNAS*, 90(22), 10749–10753.
- Pouget, A., Dayan, P. & Zemel, R. (2000). Information processing with population codes. *Nature Reviews Neuroscience*, 1(2), 125–132.

### Where it breaks
- Assumes Gaussian tuning and Poisson noise; real neurons have non-stationary, correlated noise.
- Population vector decoder is biased for narrow tuning; MLE achieves CRB only asymptotically.
- Circular (angular) variables require a von Mises tuning model for exact results; Gaussian
  tuning is a linearised approximation.

---

## Bench 3 — `bench(neuroscience/networks/wilson-cowan)`

**Path:** `js/benches/neuroscience/networks/wilson-cowan/`
**Level:** graduate

### WilsonCowanModel.js

Two coupled populations (excitatory E and inhibitory I); sigmoid nonlinearity; RK4 integration.

```
τ_E dE/dt = −E + (1 − r_E·E)·S(w_EE·E − w_EI·I + P_E)
τ_I dI/dt = −I + (1 − r_I·I)·S(w_IE·E − w_II·I + P_I)   [w_IE, not w_EI]

S(x) = 1 / (1 + exp(−κ·(x − θ_s)))          [sigmoid]

Nullclines (r_E = r_I = 0):
  E-nullcline: E = S(w_EE·E − w_EI·I + P_E)       → implicit curve
  I-nullcline: I = S(w_IE·E − w_II·I + P_I)       → implicit curve

Model Jacobian at (E*, I*) (r_E = r_I = 0, τ=1):
  J = [ −1 + w_EE·SE',  −w_EI·SE' ]
      [    w_IE·SI',   −1 − w_II·SI' ]
  where SE' = S'(w_EE·E*−w_EI·I*+P_E), SI' = S'(w_IE·E*−w_II·I*+P_I)

Stability:
  Stable node/spiral:   tr(J) < 0 AND det(J) > 0
  Hopf bifurcation:     tr(J) = 0, det(J) > 0   → limit cycle born
  Saddle:               det(J) < 0

Default parameters: wEE=12, wEI=4, wIE=13, wII=11, τ=1, P_E=−2, P_I=−3.5, κ=1, θ_s=4
  → 3 fixed points (verified in anchors script):
    FP1: (E,I) ≈ (0.002543, 0.000568) — stable node [tr=−1.976, det=0.976]
    FP2: (E,I) ≈ (0.577926, 0.155212) — saddle      [tr=−0.515, det=−3.043]
    FP3: (E,I) ≈ (0.978463, 0.481337) — stable node [tr=−4.493, det=3.072]

Hopf preset (wEE=16, wEI=12, wIE=15, wII=3, P_E=−2, P_I=−9, κ=1, θ_s=4):
  tr(J) ≈ 0 at one FP → limit cycle; parameter sweep can locate exact Hopf boundary.
  [Source: Wilson & Cowan 1972 §IV; specific parameter values chosen to give limit cycle
   behaviour; verification by tr(J) sign change as P_E is swept]
```

State: `wEE`, `wEI`, `wIE`, `wII`, `tauE`, `tauI`, `PE`, `PI`, `rE`, `rI`, `kappa`, `thetaS`.
Methods:
- `dEdt(E, I)`, `dIdt(E, I)` → right-hand sides
- `sigmoid(x)` → S(x); `sigmoidPrime(x)` → S'(x) = κ·S(x)·(1−S(x))
- `fixedPoints()` → array of `{E, I}` found by scanning nullcline + Newton refinement
- `jacobian(E, I)` → `[[a,b],[c,d]]` (model Jacobian with τ and r)
- `stability(E, I)` → `{tr, det, discriminant, type}`
- `run(E0, I0, tMax, dt=0.01)` → `[{t, E, I}]`  (RK4)
- `nullclineE(nPoints=200)` → `[{E, I}]`
- `nullclineI(nPoints=200)` → `[{E, I}]`

### Tests (`tests/neuroscience/wilson-cowan.test.js`)

**Sigmoid properties:**

- `S(0) = 0.5 ±1e-14` (κ=1, θ_s=0)
- `S'(x) = S(x)·(1−S(x)) ±1e-14` (logistic derivative identity, κ=1)

**Fixed point verification (default params):**

- `fixedPoints()` returns (E*, I*) with `|dEdt(E*, I*)| < 1e-10` and `|dIdt(E*, I*)| < 1e-10`
  for each FP
- FP1 ≈ (0.002543, 0.000568): `stability()` type = `'stable-node'`
- FP2 ≈ (0.577926, 0.155212): `stability()` type = `'saddle'`
- FP3 ≈ (0.978463, 0.481337): `stability()` type = `'stable-node'`
- Jacobian at each FP: `tr` and `det` match manual 2×2 formula ±1e-12

**RK4 trajectory:**

- Starting near FP1 (perturb by ±0.01), run to tMax=50:
  `|E(50) − E1*| < 0.01 AND |I(50) − I1*| < 0.01`
- Starting near FP3 (perturb by ±0.01), run to tMax=50:
  `|E(50) − E3*| < 0.01 AND |I(50) − I3*| < 0.01`

**Nullcline consistency:**

- E-nullcline at E*: interpolate to get I; `|I_computed − I*| < 1e-3` for each FP

**Source status:** All anchors algebraic from model equations. FP locations verified in
anchors script. Hopf bifurcation existence — cited (Wilson & Cowan 1972), Hopf preset
chosen so tr(J) ≈ 0; exact Hopf point found by sweep, not tested algebraically here.

### View

Phase plane (main, 65%): E–I axes; E-nullcline (red) and I-nullcline (blue); fixed points as
dots (stability coded: filled=stable, open=saddle/unstable); trajectory from draggable IC.
Side panel (35%): time series E(t) and I(t); parameter sliders (P_E, P_I, w_EE).
Preset toggle: "3 FPs" (default) vs. "Hopf/limit cycle" (second parameter set).

### Predict questions
1. If you increase w_EE (excitatory self-coupling), what happens to the E-nullcline?
2. At a Hopf bifurcation, what is the sign of tr(J)?
3. What does the intersection of the two nullclines represent?

### Derive-it steps
1. Each population: τ·du/dt = −u + (1−r·u)·S(input) — decay + sigmoid of total input
2. Fixed point: both derivatives = 0; graphically = nullcline intersections
3. Linearise: Jacobian J has tr(J) = sum of eigenvalues, det(J) = product
4. Stability: tr < 0, det > 0 → stable; tr = 0, det > 0 → Hopf → limit cycle

### research.papers
- Wilson, H.R. & Cowan, J.D. (1972). Excitatory and inhibitory interactions in localized populations of model neurons. *Biophysical Journal*, 12(1), 1–24. https://doi.org/10.1016/S0006-3495(72)86068-5

### Where it breaks
- Only two population variables; real cortex has spatial extent and many cell types.
- Sigmoid nonlinearity is a mean-field approximation; single-neuron noise is ignored.
- Refractory terms r_E, r_I constrain maximum activity but do not model spike timing.

---

## `[infra]` Graph.js

**File:** `js/core/Graph.js`
**Pre-bench:** before graph-theory bench

### API

```javascript
class Graph {
  constructor({ directed = false } = {})
  addNode(id)                      // add node; idempotent
  addEdge(u, v, weight = 1)        // undirected: also adds v→u; throws RangeError if weight < 0
  degree(v)                        // count of edges from v (self-loop counts 2)
  degrees()                        // Map<id, degree>
  adjacencyList()                  // Map<id, [{to, weight}]>
  dijkstra(source)                 // Map<id, dist>; RangeError if any weight < 0
  bellmanFord(source)              // Map<id, dist>; handles negative weights; null if negative cycle
  bfs(source)                      // Map<id, distance> (hop count)
  dfs(source)                      // Map<id, discovery time> (integer)
  isConnected()                    // bool (undirected)
  components()                     // number of connected components C
  get nodeCount()                  // |V|
  get edgeCount()                  // |E|
}

export function eulerCharacteristic(V, E, F) { return V - E + F; }
export function handshakingLemma(graph)       // returns { lhs: 2|E|, rhs: Σdeg(v), equal: bool }
```

Note: `V − E + F = 2` for connected planar graphs; `V − E + F = 1 + C` for C components.
Self-loops add 2 to degree (consistent with handshaking: each edge endpoint contributes 1).
Multi-edges are allowed.

### Tests (`tests/math/graph.test.js`)

- Dijkstra on 5-node graph A–E:
  edges A→B:1, A→C:4, B→C:2, B→D:5, C→D:1;
  `dijkstra('A')`: B=1, C=3, D=4, E=Infinity ±1e-10
- Dijkstra throws RangeError on negative weight edge ±0
- `handshakingLemma(g)`: 2·|E| = Σdeg(v) for K4, path(5), cycle(6)
- K4 Euler: `eulerCharacteristic(4, 6, 4) = 2`
- Cube Euler: `eulerCharacteristic(8, 12, 6) = 2`
- K5 non-planar: E=10 > 3V−6=9 → Euler bound violated
- `isConnected()` = true for connected graph, false after removing all edges
- `components()` = 2 for two disjoint triangles (V=6, E=6, C=2; V−E+F=1+C=3)
- `bellmanFord('A')` on graph with negative edge ≠ negative cycle: gives correct distances

---

## Bench 4 — `bench(math/graph-theory/graph-theory)` ← requires Graph.js

**Path:** `js/benches/math/graph-theory/graph-theory/`
**Kind:** explorer
**Level:** university

### GraphTheoryBench.js

Interactive graph explorer. All computation via `Graph` from `js/core/Graph.js`.

Built-in presets: path(5), cycle(6), K4, cube (Q3), Petersen, binary tree (depth 3).

### Tests (`tests/math/graph-theory.test.js`)

- **Euler characteristic:** K4: V−E+F=4−6+4=2; cube: V−E+F=8−12+6=2  (F = E−V+2 for connected planar)
- **Disconnected:** two triangles: V=6, E=6, C=2; V−E+F = 1+C = 3 ±0
- **Handshaking:** 2×edgeCount === Σdeg for K4, path(5), cycle(6)
- **Dijkstra:** A→D=4 on 5-node example ±1e-10
- **Negative weight:** Dijkstra throws RangeError; Bellman-Ford on same graph correct ±1e-10
- **Non-planar K5:** E=10 > 3V−6=9 → noted as non-planar; eulerCharacteristic would require F=7
- **Tree:** binary tree V=15, E=14: E = V−1 ±0

**Source status:** V−E+F=2 — cited (Euler 1736). Dijkstra — algebraic.

### View

Canvas: drag-to-place nodes; click-to-add edges with weight; delete mode.
Algorithm panel: run Dijkstra (highlight shortest path tree); BFS/DFS animation; degree labels.
Formula panel: live V, E, F readout; Euler formula checker; Handshaking checker.
Presets: buttons to load named graphs.

### Predict questions
1. A connected planar graph has 6 nodes and 9 edges. How many faces must it have?
2. In any undirected graph, what is the sum of all vertex degrees?
3. Does Dijkstra give the correct shortest path for a graph with a negative-weight edge?

### Derive-it steps
1. Euler 1736: for any connected planar graph, V−E+F=2
2. Handshaking: each edge contributes 1 to each of its two endpoints → total degree = 2|E|
3. Dijkstra: greedy extraction from priority queue; correctness requires non-negative weights

### research.papers
- Euler, L. (1736). Solutio problematis ad geometriam situs pertinentis. *Commentarii Academiae Petropolitanae*, 8, 128–140.
- Dijkstra, E.W. (1959). A note on two problems in connexion with graphs. *Numerische Mathematik*, 1, 269–271.

### Where it breaks
- V−E+F=2 holds only for connected planar graphs (disconnected: V−E+F = 1+C).
- Dijkstra fails for negative edge weights (use Bellman-Ford instead).
- Planarity testing (Kuratowski/Boyer-Myrvold) is not implemented here.
- Girth bound: if graph has no triangles (girth ≥ 4), tighter bound E ≤ 2V−4 applies.

---

## Bench 5 — `bench(economics/network-economics/inequality)`

**Path:** `js/benches/economics/network-economics/inequality/`
**Level:** intro

### InequalityModel.js

Lorenz curve and Gini coefficient for Pareto, Uniform, and Exponential distributions.

```
Pareto (F(x) = 1−(x_m/x)^α, x ≥ x_m, α > 1):
  Lorenz curve:  L(p) = 1 − (1−p)^{(α−1)/α}
  Gini:          G = 1/(2α−1)                             [exact]
  ∫₀¹ L(p) dp = (α−1)/(2α−1)                             [exact]

Uniform [0, b]:
  L(p) = p²;    G = 1/3

Exponential (λ):
  L(p) = p + (1−p)·ln(1−p)                               [lim_{p→1} = 1; guard required]
  G = 1/2
  Implementation: if (p >= 1) return 1;  [prevents NaN = 0·ln(0)]

Gini from Lorenz:  G = 1 − 2·∫₀¹ L(p) dp

Top income share (Pareto α):
  topShare(q) = 1 − L(q) = (1−q)^{(α−1)/α}
  At q=0.8, α=2:  topShare(0.8) = (0.2)^{1/2} = 1/√5 ≈ 0.4472 (exact)

Lorenz convexity (holds for any non-degenerate distribution):
  L(λp₁ + (1−λ)p₂) ≤ λL(p₁) + (1−λ)L(p₂)              [Lorenz curve is convex]
```

State: `dist` (`'pareto'|'uniform'|'exponential'`), `alpha` (Pareto, >1),
`b` (Uniform upper limit, >0), `lambda` (Exponential rate, >0).
Methods: `lorenz(p)`, `gini()`, `giniNumerical(nPoints=2000)`, `topShare(q)`,
`lorenzCurve(nPoints=200)`.

### Tests (`tests/economics/inequality.test.js`)

**Algebraic Gini anchors:**

- `gini('pareto', α=2)` = 1/3 ±1e-14
- `gini('pareto', α=3)` = 0.2 ±1e-14
- `gini('pareto', α=1.5)` = 0.5 ±1e-14
- `gini('uniform')` = 1/3 ±1e-14
- `gini('exponential')` = 0.5 ±1e-14

**Lorenz curve properties:**

- `lorenz(0) = 0 ±1e-14` and `lorenz(1) = 1 ±1e-14` (all three distributions)
- `lorenz(p) ≤ p` for p ∈ {0.2, 0.5, 0.8}
- **Convexity** (not concavity): `lorenz(0.5) ≤ (lorenz(0.25) + lorenz(0.75))/2 + 1e-12`
- Exponential at p=1: `lorenz(1) === 1` (not NaN; guard required)

**Top income share (Pareto α=2):**

- `topShare(0.8)` = (0.2)^{1/2} = 1/√5 ±1e-14

**Numerical cross-check:**

- `giniNumerical('pareto', α=2, nPoints=2000)` ≈ 1/3 ±0.002
  (Trapezoid error is O(n^{−1.5}) for Pareto α=2 due to √singularity of L'' at p=1;
  err(n=100) ≈ 2×10⁻⁴, err(n=2000) ≈ 3×10⁻⁶; tolerance 0.002 is conservative)

**Source status:** all formulas algebraically exact; NaN guard verified in anchors script.

### View

Left (60%): Lorenz curve; diagonal equality line; shaded area (= G/2); overlaid curves.
Right (40%): Gini bar chart for Pareto (α=1.5 to α=5), Uniform, Exponential;
top-X% income share readout (X slider: 5% to 50%).

### Predict questions
1. For Pareto α=2, what fraction of income does the top 20% earn?
2. As α→∞ for Pareto, does inequality increase or decrease?
3. If G=0, what does the Lorenz curve look like?

### Derive-it steps
1. Lorenz curve: L(p) = ∫₀^{F⁻¹(p)} x·f(x)dx / μ
2. Pareto integral → L(p) = 1−(1−p)^{(α−1)/α}
3. Uniform [0,b]: L(p) = p²
4. Gini = 1−2∫₀¹ L(p)dp; for Pareto G = 1−2·(α−1)/(2α−1) = 1/(2α−1)

### research.papers
- Lorenz, M.O. (1905). Methods of measuring the concentration of wealth. *Publications of the American Statistical Association*, 9(70), 209–219.
- Gini, C. (1912). *Variabilità e mutabilità*. Tipografia di Paolo Cuppini.

### Where it breaks
- Gini ignores within-decile shape (two distributions can share Gini but have crossing Lorenz curves).
- Pareto α ≤ 1 has no finite mean; α ≤ 2 has no finite variance.
- Negative incomes violate the Lorenz curve non-negativity assumption.

---

## Bench 6 — `bench(chemistry/surface/langmuir)` ← NEW (replaces elasticity)

**Path:** `js/benches/chemistry/surface/langmuir/`
**Level:** university

**Candidates considered (from ROADMAP):**
1. `langmuir` — θ=Kp/(1+Kp); exact algebra; no data fetch; university level ← **chosen**
2. `van-deemter` — H=A+B/u+Cu; u_opt=√(B/C); clean optimisation; university level
3. `phase-diagram` — Clausius-Clapeyron dP/dT=ΔH_vap/(TΔV); requires NIST data fetch

Chosen: **langmuir** — cleanest algebraic anchors; no empirical constants to fetch; natural
connection to Hill binding bench already in repo (Hill n=1 is Langmuir).

### LangmuirModel.js

```
Langmuir adsorption isotherm:
  θ(p) = K·p / (1 + K·p)          [fractional coverage; p = pressure or concentration]
  θ ∈ [0, 1);  θ → 1 as Kp → ∞   [monolayer saturation]

Linearised form (Langmuir plot):
  p / θ = 1/K + p                  [plot p/θ vs p: slope=1, y-intercept=1/K]

Half-coverage pressure:
  p_{1/2} = 1 / K                  [θ(p_{1/2}) = 1/2 exactly]

Connection to Hill binding (n=1 special case):
  Hill: θ_H(c) = c^n / (K_d^n + c^n); at n=1, K_d=1/K → θ_H = K·c/(1+K·c) = θ(c)

Thermodynamic equilibrium constant:
  K = k_ads / k_des = exp(−ΔG_ads / (R·T))  [for competitive Langmuir]
  → ln(K) vs 1/T is linear (van't Hoff plot); slope = −ΔH_ads/R
```

State: `K` (>0, equilibrium constant), `pMin`, `pMax`.
Methods:
- `coverage(p)` → θ(p)
- `halfCoverageP()` → 1/K
- `langmuirPlot(nPoints=200)` → `[{p, pOverTheta}]`
- `isothermCurve(nPoints=200)` → `[{p, theta}]`
- `vantHoffPoint(T, deltaH_ads, R=8.31446)` → K at given T
- `coverageAt(Kp)` → Kp/(1+Kp)  (for dimensionless tests)

### Tests (`tests/chemistry/langmuir.test.js`)

**Algebraic coverage:**

- `coverage(0) = 0 ±1e-14` (empty surface)
- `coverageAt(1) = 0.5 ±1e-14` (half-coverage at Kp=1)
- `coverageAt(9) = 0.9 ±1e-14` (90% coverage at Kp=9; exact: 9/10)
- `coverage(halfCoverageP()) = 0.5 ±1e-14` (definition of p_{1/2})
- `coverageAt(1e6) ≈ 1 ±1e-5` (saturation limit)

**Linearised form:**

- `p/θ = 1/K + p ±1e-10` for p ∈ {0.5, 1.0, 3.0, K=2.5}

**Convexity of isotherm:**

- `coverage(p)` is concave (d²θ/dp² < 0 everywhere):
  mid-point test: `coverage(0.5*(p1+p2)) ≥ 0.5*(coverage(p1)+coverage(p2)) ±1e-10`
  for (p1, p2) ∈ {(0,1), (1,3)}

**Hill connection:**

- `Hill(c, n=1, Kd=1/K)` === `coverage(c)` ±1e-12

**Source status:** θ=Kp/(1+Kp) — algebraically exact; no empirical constants.

### View

Left (60%): θ(p) isotherm curve; dashed at θ=0.5 and p=1/K; label "p_{1/2}".
Right (40%): Langmuir linearisation (p/θ vs p); slope=1 line with y-intercept=1/K.
Slider: K (shows how curve steepens/flattens).
Overlay: Hill n=1 curve (should coincide with Langmuir).

### Predict questions
1. At what pressure does a Langmuir adsorbent reach 90% coverage? (Answer: Kp=9 → p=9/K)
2. If K doubles (stronger adsorption), how does p_{1/2} change?
3. At very high pressure, can coverage exceed 1? Why not?

### Derive-it steps
1. Two processes: adsorption (rate k_ads·p·(1−θ)) and desorption (rate k_des·θ); equilibrium: equal rates
2. k_ads·p·(1−θ) = k_des·θ → K·p·(1−θ) = θ → θ = K·p/(1+K·p)
3. p/θ = 1/K + p (rearrange) → linear Langmuir plot
4. At Kp=1: θ=1/2 exactly; for large Kp: θ→1 (monolayer saturation)

### research.papers
- Langmuir, I. (1918). The adsorption of gases on plane surfaces of glass, mica and platinum. *Journal of the American Chemical Society*, 40(9), 1361–1403. https://doi.org/10.1021/ja02242a004

### Where it breaks
- Monolayer only; BET (Brunauer, Emmett, Teller) extends to multilayer adsorption.
- Assumes uniform surface (all sites identical and independent); heterogeneous surfaces
  give Freundlich or Temkin isotherms.
- Assumes equilibrium; kinetic effects (activated adsorption, diffusion) not modelled.
- Hill binding (n=1) and Langmuir are mathematically identical but physically distinct:
  Hill describes cooperative receptor binding, Langmuir describes surface adsorption.

---

## Bench 7 — `bench(biology/ecology/competitive-exclusion)` ← NEW (replaces bayesian-observer)

**Path:** `js/benches/biology/ecology/competitive-exclusion/`
**Level:** university

**Candidates considered (from ROADMAP):**
1. `competitive-exclusion` — Lotka-Volterra competition; coexistence algebra; pure algebraic anchor ← **chosen**
2. `pharmacokinetics` — 1-compartment IV, Bateman oral; clean algebra; university level
3. `age-structure` — Leslie matrix dominant eigenvalue; requires LinAlg (already available)

Chosen: **competitive-exclusion** — pure algebra (no external data, no eigenvalue solver),
extends existing ecology benches (predator-prey, logistic already in repo).

### CompetitiveExclusionModel.js

Two-species Lotka-Volterra competition.

```
dN₁/dt = r₁·N₁·(K₁ − N₁ − α₁₂·N₂) / K₁
dN₂/dt = r₂·N₂·(K₂ − N₂ − α₂₁·N₁) / K₂

Equilibria:
  (0, 0):  trivial (unstable)
  (K₁, 0): species-2-free carrying capacity
  (0, K₂): species-1-free carrying capacity
  (N₁*, N₂*): coexistence equilibrium
    N₁* = (K₁ − α₁₂·K₂) / (1 − α₁₂·α₂₁)
    N₂* = (K₂ − α₂₁·K₁) / (1 − α₁₂·α₂₁)

Coexistence iff N₁* > 0 AND N₂* > 0, equivalently:
  α₁₂ < K₁/K₂  AND  α₂₁ < K₂/K₁

Gause's competitive exclusion principle:
  If α₁₂ > K₁/K₂ (species 2 dominant): system → (0, K₂)   [species 1 excluded]
  If α₂₁ > K₂/K₁ (species 1 dominant): system → (K₁, 0)   [species 2 excluded]
  If both α₁₂ > K₁/K₂ AND α₂₁ > K₂/K₁: unstable coexistence (priority effect)

Anchor (verified in anchors script):
  K₁=K₂=100, α₁₂=α₂₁=0.5: coexistence; N₁*=N₂*=200/3≈66.667
  K₁=K₂=100, α₁₂=1.5, α₂₁=0.4: α₁₂=1.5>1=K₁/K₂ → species 1 excluded; N₁*=−125<0
  RK4 with [N₁(0)=80, N₂(0)=20] → N₁(100)≈N₂(100)≈200/3 ±1  (coexistence case)
```

State: `r1`, `r2`, `K1`, `K2`, `alpha12`, `alpha21`.
Methods:
- `coexistenceEquil()` → `{N1, N2}` (may be negative for exclusion)
- `coexistenceType()` → `'coexistence'|'exclude1'|'exclude2'|'priority'`
- `isCoexistence()` → bool
- `run(N1_0, N2_0, tMax, dt=0.1)` → `[{t, N1, N2}]` (RK4)
- `nullcline1(nPoints=200)` → `[{N1, N2}]`  (N₂ as function of N₁ from dN₁/dt=0)
- `nullcline2(nPoints=200)` → `[{N1, N2}]`

### Tests (`tests/biology/competitive-exclusion.test.js`)

**Coexistence equilibrium (algebraic):**

- `coexistenceEquil(K1=100, K2=100, α12=0.5, α21=0.5)`:
  N1*=200/3 ±1e-10; N2*=200/3 ±1e-10
- `isCoexistence()` = true when both α < 1

**Exclusion (algebraic):**

- α12=1.5 > K1/K2=1: `N1* = −125 ±1e-10` (negative → excluded)
- `coexistenceType()` = `'exclude1'` when α12 > K1/K2 AND α21 < K2/K1
- `coexistenceType()` = `'exclude2'` when α21 > K2/K1 AND α12 < K1/K2

**RK4 convergence:**

- r1=r2=0.5, K1=K2=100, α12=α21=0.5, N1(0)=80, N2(0)=20, tMax=100:
  `N1(100) ≈ 200/3 ±1.0` and `N2(100) ≈ 200/3 ±1.0`

**Boundary (nullcline) check:**

- At N1=0: dN1/dt=0 trivially; nullcline1 at N1=0 → N2 = K1/α12
  `nullcline1(N1=0) ≈ K1/α12 ±1e-10` for α12=0.5: N2=200

**Source status:** all equilibria algebraically exact; RK4 tolerance from separation-of-scales
argument (r=0.5, 100 time units well past transient); anchors verified in script.

### View

Phase plane (main, 65%): N₁–N₂ axes; nullcline 1 (red, linear); nullcline 2 (blue, linear);
equilibria as dots; trajectory from draggable initial condition; arrows for flow direction.
Side panel (35%): N₁(t) and N₂(t) time series.
Sliders: α₁₂, α₂₁ (live nullcline update).
Preset buttons: "Coexistence", "Exclusion 1", "Exclusion 2", "Priority effect".

### Predict questions
1. If α₁₂=α₂₁=0.5 and K₁=K₂=100, what is the coexistence equilibrium?
2. Which species wins when α₁₂=2 and α₂₁=0.5 (K₁=K₂=100)?
3. What condition on α₁₂ and α₂₁ must hold for stable coexistence?

### Derive-it steps
1. Competitive exclusion: each species grows logistically but is also suppressed by the other
2. Isocline for species 1: N₁ + α₁₂·N₂ = K₁ (straight line in N₁–N₂ plane)
3. Coexistence stable iff each species limits itself more than the other: α₁₂ < K₁/K₂ AND α₂₁ < K₂/K₁
4. If species 2 is dominant (α₁₂ > K₁/K₂): species-1 isocline lies entirely below species-2 isocline → species 1 excluded

### research.papers
- Gause, G.F. (1934). *The Struggle for Existence*. Williams & Wilkins. (competitive exclusion principle)
- Lotka, A.J. (1925). *Elements of Physical Biology*. Williams & Wilkins. (Lotka-Volterra equations)

### Where it breaks
- Linear (Lotka-Volterra) competition only; nonlinear competition can allow coexistence even
  when α > K₁/K₂.
- No environmental stochasticity; real communities show coexistence via storage effect (Chesson 2000).
- Only 2 species; the competitive exclusion principle does not generalise simply to n > 2.
- Assumes closed system with no immigration, mutation, or evolution.

---

## Implementation order

1. `[infra] Graph.js` — `js/core/Graph.js` + `tests/math/graph.test.js`
2. `ising` — L=32 default; seeded MC tests use L=16 for speed
3. `population-coding` — Gaussian tuning + Poisson Fisher info
4. `wilson-cowan` — RK4 + Newton fixed-point solver (multiple starts)
5. `graph-theory` — explorer bench using Graph.js
6. `inequality` — closed-form Lorenz + Gini (with NaN guard for Exponential)
7. `langmuir` — closed-form adsorption isotherm
8. `competitive-exclusion` — Lotka-Volterra competition + RK4

One commit per item. `npm test` before every commit.

---

## After all eight commits

- Update `docs/ROADMAP.md` (7 ticked bench entries + Graph.js infra note)
- Update `README.md` (7 new simulation rows)
- Update `js/catalog.js` (4 new fields, 7 bench entries)
- `npm test` — target ≥ 982 + ~55 new tests, 0 fail
- Create `docs/reviews/phase-11.md`

---

## Key reuse

| Need | File |
|---|---|
| RK4 integration (WC, competitive-exclusion) | `js/core/Integrators.js` — `Integrators.rk4` |
| Root-finding (WC fixed point, population-coding MLE refine) | `js/core/RootFinding.js` — `RootFinding.brent` |
| Seeded RNG (ising, pop-coding) | `js/core/Random.js` — `new Random(seed)`, `.next()`, `.normalSeeded()` |
| LinAlg (WC Jacobian stability) | `js/core/LinAlg.js` — `eigen2x2(A)` |
| Two-panel view | `js/benches/biology/ecology/logistic/LogisticView.js` |
| Graph infrastructure (graph-theory) | `js/core/Graph.js` (new — commit 1 of this phase) |

---

## Estimated tests per bench

| Bench | Est. new tests | Running total |
|---|---|---|
| [infra] Graph.js | +7 | 989 |
| ising | +8 | 997 |
| population-coding | +7 | 1004 |
| wilson-cowan | +9 | 1013 |
| graph-theory | +5 | 1018 |
| inequality | +10 | 1028 |
| langmuir | +7 | 1035 |
| competitive-exclusion | +8 | 1043 |
| **Total** | **+61** | **1043** |
