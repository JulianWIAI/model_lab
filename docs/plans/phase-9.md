# Phase 9 plan

**Date drafted:** 2026-10-16
**Carries forward:** 756 tests pass (phases 1–8).
**Tag at start:** `phase-8c`

---

## Plan changes (applied 2026-10-16)

Corrections applied to the initial draft before any bench was built:

| ID | Section | Change |
|---|---|---|
| G-1 | Catalog table | Verified real field IDs from `js/catalog.js`; opinion-dynamics moved to `psychology/learning` (where prisoner-dilemma lives), not `psychology/social` |
| G-2 | Key reuse | Added `LinAlg.isPrimitive(M)` — tests already written and passing |
| G-3 | All R2 anchors | No `0 (exact)` for non-integer outputs; pure-component ΔS and other float zeros now use `1e-15` relative or sign-check |
| G-4 | R4 table | Added domain validation rows for all benches (cable, opinion, age-structure were missing) |
| G-5 | STDP paper | Song 2000 PDF: binary/FlateDecode, pdftotext unavailable — status "cited, not fetched (PDF binary)" |
| B1-1 | Entropy critical trap | Deleted misleading note that framed volume-expansion as a "trap"; added it as an *independent derivation* anchor instead |
| B1-2 | Entropy anchors | R = 8.31446261815324 J/(mol·K) (all 15 digits, 1e-12 relative); pure-component anchor uses `Object.is(v, -0)` check instead of `0 (exact)` |
| B1-3 | Entropy model | Constructor validates Σxᵢ=1 and xᵢ∈[0,1]; throws RangeError otherwise |
| B1-4 | Entropy anchors | Added Stirling/lgamma multinomial anchor (N=1e6 binary, error ≤ 2e-5) |
| B1-5 | Entropy Predict | Added Q4 on Gibbs paradox |
| B2-1 | Random walk | E[\|X₁₀₀\|] BigInt exact = 7.958923738717877; tolerance 1e-12 |
| B2-2 | Random walk | 2D NN Var(r²) = n²−n = 9900 at n=100 (not 2n²−2n; that is the 1D formula) |
| B2-3 | Random walk | Fundamental matrix Thomas-algorithm anchor added (N=100, k=30) |
| B3-1 | Cable Predict Q1 | "Double from 1μm to 4μm" → "Quadruple from 1μm to 4μm; by what factor does λ change?" (4× diameter → 2× λ) |
| B3-2 | Cable anchors | Added R_in = (2/π)√(Rm·Ra)·d^{−3/2} = 2.0131×10⁸ Ω; Rall 3/2 law; finite cable (sealed/killed) formulas |
| B3-3 | Cable anchors | λ relative tolerance 1e-14 (was 1e-10 absolute); V(x) tests use 1e-15 rel |
| B3-4 | Cable tests | Added finite-difference residual test (λ²V''≈V at x=0.5λ) |
| B4-1 | Solow R4 | Removed stray "d (cable)" row from domain validation table |
| B4-2 | Solow Predict Q3 | Corrected: α=1/2 gives k_GR=(50/9)^{3/2}=13.09; inserted correct α=1/2 example |
| B4-3 | Solow anchors | RK4 dt-halving: T=40 with dt=4 (10 steps) vs dt=2 (20 steps); errors 2.3e-5/1.5e-6, ratio≈15.6 ∈ [12,20] |
| B4-4 | Solow anchors | Convergence test: \|k(600,dt=1)−k*\| < 1e-9 (not T=500; exp(-0.04×600)=5e-11 < 1e-9) |
| B5-1 | STDP Predict | Rewrote Q1–Q3: bimodality removed (single synapse cannot show distribution shape); Q3 now asks about isolated pair count to saturation |
| B5-2 | STDP Where-it-breaks | Added bimodality bullet here |
| B5-3 | STDP anchors | Replaced Poisson-drift MC test with Campbell's theorem analytic SE (r=0.01/ms, M=1e5, 4·SE≈2.9e-5) |
| B5-4 | STDP R4 | Added: A₊≤0 RangeError, τ₊≤0 RangeError |
| B6-1 | Opinion Derive-it | Fixed typo: "W^T" (transpose) → "W^t" (power t) |
| B6-2 | Opinion anchors | W3 consensus = 39/70 = 0.5571428571... at 1e-12 (exact algebraic) |
| B6-3 | Opinion anchors | Added doubly-stochastic ring N=5 test; `isPrimitive` check; cyclic permutation "periodic: no consensus" |
| B6-4 | Opinion anchors | Added reducible case (block-diagonal W) |
| B6-5 | Opinion Where-it-breaks | Deleted "No stubborn agents" bullet (not universally true; stubborn agent is just W[i][i]=1) |
| B7-1 | Age-structure tests | L^5 first positive power assertion loop (k=1..4: not all-pos; k=5: all-pos) |
| B7-2 | Age-structure tests | Fixed imprimitive ratio assert: `Math.abs(Math.abs(ratio)−1)<1e-15` (old form `Math.abs(ratio-1)` was vacuous for ratio≈−1) |
| B7-3 | Age-structure tests | Power-iteration oscillation test for 2-age matrix |
| B7-4 | Age-structure tests | Simulate n0=(1,0,0), T=200: total abundance grows as λ^t |

---

## Pre-plan anchor computations (R1)

All numerical anchors computed in `tools/anchors-phase9.mjs` (no model code).
Run `node tools/anchors-phase9.mjs` to reproduce all values below.
Every `assert()` in that file throws if the anchor is wrong.

---

## Implementation order

1. `physics/thermodynamics/entropy-mixing`        — intro, closed-form
2. `math/probability/random-walk`                 — intro, closed-form + simulation
3. `neuroscience/electrophysiology/cable-equation`— university, closed-form SS
4. `economics/macroeconomics/solow`               — university, ODE + closed-form SS
5. `neuroscience/synaptic/stdp`                   — university, kernel + simulation
6. `psychology/learning/opinion-dynamics`         — university, discrete update
7. `biology/ecology/age-structure`                — university, matrix + power iter

One commit per bench. `npm test` before every commit. Run `npm run smoke -- --bench <id>` before
every commit (bench id = last path component). No push.

---

## New catalog fields

Fields verified against `js/catalog.js` as of phase-9 draft.

| Subject | Field id | Label | Benches | Verified |
|---|---|---|---|---|
| Physics | `thermodynamics` | Thermodynamics | entropy-mixing | existing (confirmed) |
| Math | `probability` | Probability & statistics | random-walk | existing (confirmed) |
| Neuroscience | `electrophysiology` | Electrophysiology | cable-equation | existing (confirmed) |
| Neuroscience | `synaptic` | Synaptic | stdp | existing (confirmed) |
| Economics | `macroeconomics` | Macroeconomics | solow | existing (Phase 5) |
| Psychology | `learning` | Learning & cognition | opinion-dynamics | existing (prisoner-dilemma lives here) |
| Biology | `ecology` | Ecology | age-structure | existing (confirmed) |

No new subject or field is required for Phase 9.

---

## Key reuse

| Module | Used by |
|---|---|
| `js/core/Integrators.js` (RK4) | solow (ODE to steady state) |
| `js/core/LinAlg.js` (eigen2x2) | age-structure (2-age eigenvalues) |
| `js/core/LinAlg.js` (matMul) | age-structure (L·n step, power test) |
| `js/core/LinAlg.js` (isPrimitive) | age-structure (primitivity check), opinion-dynamics |
| `js/core/Random.js` (seeded RNG) | random-walk simulation, stdp simulation |

---

## Visual rules (R9)

Every bench view must satisfy:

| Rule | Requirement |
|---|---|
| Colors | All colors from `theme.color('--token')` — no hardcoded hex values |
| Background | `ctx.fillStyle = theme.color('--surface'); ctx.fillRect(0, 0, w, h)` — NOT clearRect |
| Axis labels | Use `js/core/Axes.js` standard axis drawing |
| Canvas size | Use `js/core/CanvasView.js` for responsive sizing |

---

## File layout

Each bench lives at:
```
js/benches/<subject>/<field>/<bench>/
  <Bench>Model.js
  <Bench>View.js
  <Bench>Bench.js
```
e.g. `js/benches/physics/thermodynamics/entropy-mixing/EntropyMixingModel.js`

---

## Bench 1 — `physics/thermodynamics/entropy-mixing`

**Path:** `js/benches/physics/thermodynamics/entropy-mixing/`
**Level:** intro

### Note on independent derivations

ΔS = −nR Σᵢ xᵢ ln xᵢ (ideal mixing entropy) can be derived two independent ways:

1. **Statistical**: S = k_B ln W where W = N!/(N₁!…Nₖ!) (Stirling). Gives the same formula.
2. **Thermodynamic**: each component i expands isothermally from volume xᵢ·V to V.
   ΔSᵢ = nᵢ R ln(V / xᵢV) = nᵢ R ln(1/xᵢ).  Sum: ΔS_mix = −R Σ xᵢ ln xᵢ. ← independent check.

These two routes agree, which is the anchor: cross-check both in the test.

Pure component limit: x=1 → ΔS=0 EXACTLY. The term x·ln(x) → 0 as x→0 by
L'Hôpital. Code MUST guard: if xᵢ=0, the term contributes 0, not NaN.
Use `−x·ln(x)` inside the accumulator (not `−(sum of x·ln x)`) to avoid `-0`.

**Gibbs paradox**: mixing two samples of the SAME gas gives ΔS=0 classically (no
entropy of mixing). Classical thermodynamics is consistent only if gases are
distinguishable. This bench models distinguishable ideal gases.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| n | amount of substance | mol | — |
| R | universal gas constant | J/(mol·K) | CODATA 2018 exact: 8.31446261815324 J/(mol·K) |
| xᵢ | mole fraction of component i | — | xᵢ = nᵢ / Σnⱼ |
| ΔS_mix | molar entropy of mixing | J/(mol·K) | −R Σᵢ xᵢ ln xᵢ |
| ΔG_mix | molar Gibbs free energy of mixing | J/mol | RT Σᵢ xᵢ ln xᵢ = −T·ΔS_mix |

### Model class

`EntropyMixingModel` in `js/benches/physics/thermodynamics/entropy-mixing/EntropyMixingModel.js`:
- `constructor(components)` — array of `{name, x}` with Σxᵢ validation (±1e-10), xᵢ∈[0,1] (RangeError otherwise)
- `deltaS()` — returns ΔS_mix in J/(mol·K); accumulates `−xᵢ ln xᵢ` (not `−Σ xᵢ ln xᵢ`) to ensure +0 for pure component
- `deltaG(T)` — returns ΔG_mix at temperature T
- `maxMixingComposition()` — returns xᵢ=1/N for N components

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| R | 8.31446261815324 J/(mol·K) | 1×10⁻¹² relative | CODATA 2018 exact: N_A·k_B = 6.02214076×10²³ × 1.380649×10⁻²³ |
| binary equimolar ΔS | R·ln 2 = 5.763146322 J/(mol·K) | 1×10⁻¹⁵ relative | −R(0.5·ln0.5 + 0.5·ln0.5) = R·ln2 algebraically |
| ternary equimolar ΔS | R·ln 3 = 9.134370806 J/(mol·K) | 1×10⁻¹⁵ relative | −R·3·(1/3)·ln(1/3) = R·ln3 algebraically |
| pure component (x=1) | +0 (not −0) | sign check via Object.is | `−x·ln x` form; accumulator starts at 0, result must be +0 |
| zero-fraction component | 0 (no NaN) | — | Guard: xᵢ=0 contributes 0 |
| equimolar binary ≥ asymmetric | ΔS(0.5,0.5) ≥ ΔS(0.3,0.7) | — | Concavity of −Σxᵢlnxᵢ |
| Stirling/lgamma multinomial | \|lnW/N − ln2\| ≤ 2×10⁻⁵ at N=10⁶ | — | O(ln N/N) Stirling remainder; anchor verifies the bound |
| Σxᵢ=1.01 → RangeError | RangeError | — | Constructor validation |
| xᵢ=−0.1 → RangeError | RangeError | — | Constructor validation |

### Status words

ΔS formula: *algebraic*.
R = 8.31446261815324: *cited (CODATA 2018 exact SI definition; value is definitional)*.
Stirling bound: *algebraic*.

### Predict questions

1. Start with two equal-fraction components. Add a third equal fraction. Does ΔS increase or
   decrease, and by how much relative to the binary case?
2. Set one component to x=0.99 and a trace component to x=0.01. Is the mixing entropy
   closer to pure or to equimolar? What does this say about trace impurities?
3. For an ideal binary mixture at T=298 K, where is the minimum of ΔG_mix? Why does
   spontaneous mixing occur?
4. Two beakers of pure nitrogen are mixed. What is ΔS according to this formula? This is
   the Gibbs paradox — why does classical statistical mechanics fail here, and what
   resolves it?

### Derive it

1. Statistical definition: S = k_B Σᵢ pᵢ ln pᵢ. For Nᵢ molecules of species i in
   total N, pᵢ = xᵢ = Nᵢ/N.
2. Multiplying by N·k_B = n·R: ΔS_mix = −R Σᵢ xᵢ ln xᵢ ≥ 0 for all xᵢ ∈ (0,1].
3. At x→0: lim_{x→0⁺} x·ln(x) = 0 by L'Hôpital. The sum is well-defined.
4. Maximum: dΔS/dxᵢ = 0 → xᵢ = 1/N for all i. Maximum = R·ln N.

### Research papers

- Atkins, P., de Paula, J. (2014). *Physical Chemistry*, 10th ed., §5A. Oxford.
  (cited, not fetched)
- Ben-Naim, A. (2008). *A Farewell to Entropy*. World Scientific. DOI: 10.1142/6469
  (cited, not fetched)

### Where it breaks

- Ideal mixing only: no enthalpy of mixing (ΔH=0 assumed). Real solutions have
  activity coefficients.
- Assumes distinguishable species: Gibbs paradox — mixing identical gases gives
  ΔS=0 classically; quantum statistics resolves this.
- No pressure or volume effects: molar volumes assumed equal.
- Temperature-independent: entropy of mixing here has no T-dependence (unlike real
  solutions).

---

## Bench 2 — `math/probability/random-walk`

**Path:** `js/benches/math/probability/random-walk/`
**Level:** intro

### Critical trap — read before coding

For a 1D symmetric random walk of n steps (±1 equally likely):
- **⟨X²⟩ = n** (EXACT, by independence)
- **E[|X|] = n·C(n,n/2)/2ⁿ** (EXACT for even n) — computed exactly by BigInt script
  - At n=100: **7.958923738717877** (tolerance 1×10⁻¹²)
- **E[|X|] ≈ √(2n/π)** (ASYMPTOTIC — CLT half-normal; at n=100: 7.9788, overestimates by 0.020)
  Do NOT use the asymptotic as the test anchor for the exact formula.

For 2D walk — MC variance of r²:
- **Nearest-neighbour** (4 directions): Var(r²) = **n²−n** = 9900 at n=100
  (not 2n²−2n=19800; that is the 1D formula Var(X²)=2n²−2n)
- SE of Var(r²) estimate at trials=10000: √(9900/10000) ≈ 0.995; 4·SE ≈ 3.98

Gambler's ruin fundamental matrix: (I−Q)·t = 1, where Q is the (N−1)×(N−1)
sub-matrix of the transition matrix (excluding absorbing states). Solving via
Thomas algorithm gives E[T] = k(N−k) exactly. At k=30, N=100: E[T] = 2100.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| n | number of steps | — | — |
| Xₙ | position after n steps | steps | Xₙ = Σᵢ ξᵢ, ξᵢ ∈ {−1,+1} |
| ⟨X²⟩ | mean squared displacement | steps² | n (EXACT) |
| E[\|X\|] | mean absolute displacement | steps | n·C(n,n/2)/2ⁿ (EXACT, even n) |
| k | gambler's starting position | steps | — |
| N | gambler's ruin barrier | steps | — |
| P(win) | win probability | — | k/N (EXACT) |
| E[T] | mean absorption time | steps | k(N−k) (EXACT) |

### Model class

`RandomWalkModel` in `js/benches/math/probability/random-walk/RandomWalkModel.js`:
- `constructor({seed})` — seeded RNG via `js/core/Random.js`
- `walk1D(n)` — returns array of positions length n+1
- `walk2D(n)` — returns array of {x,y} length n+1 (nearest-neighbour)
- `msd(n, trials)` — Monte Carlo estimate of ⟨X²⟩ over `trials` simulations
- `gamblersRuin({k, N})` — returns `{pWin: k/N, meanTime: k*(N-k)}`

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| ⟨X²⟩ formula at n=100 | 100 | 0 (integer output, exact) | E[X²]=n algebraically |
| E[\|X\|] EXACT at n=100 | 7.958923738717877 | 1×10⁻¹² | BigInt: 100·C(100,50)/2¹⁰⁰; computed exactly |
| E[\|X\|] asymptotic √(200/π) | 7.978845608 | 1×10⁻¹² | CLT half-normal; algebraic |
| asymptotic > exact | yes | — | √(2n/π) overestimates for finite n |
| gambler's ruin P(win) k=30, N=100 | 0.30 | 0 (integer fraction) | k/N = 30/100 algebraically |
| gambler's ruin E[T] k=30, N=100 | 2100 | 0 (integer) | k(N−k) = 30·70 algebraically |
| 2D nearest-neighbour ⟨r²⟩ at n=100 | 100 | 1×10⁻¹⁵ relative | ⟨r²⟩ = n (each step moves 1 axis) |
| MC MSD (n=100, trials=10000) | 100 | 4·√(Var(X²)/trials) = 4·√(19800/10000) ≈ 5.63 | 1D: Var(X²)=2n²−2n=19800 |
| MC 2D MSD (n=100, trials=10000) | 100 | 4·√((n²−n)/trials) = 4·√(9900/10000) ≈ 3.98 | 2D NN: Var(r²)=n²−n=9900 |
| X₀ = 0 | 0 | exact integer | Initial condition |
| walk1D returns length n+1 | n+1 | exact integer | Array length |
| gambler's ruin MC vs exact | within 4·SE | 4·√(0.3·0.7/5000) ≈ 0.026 | MC trials=5000; fundamental matrix exact P=0.3 |

### Status words

⟨X²⟩=n: *algebraic*.
E[|X|]=n·C(n,n/2)/2ⁿ: *algebraic* (exact combinatorial formula for even n).
E[|X|]≈√(2n/π): *asymptotic* (half-normal limit; NOT exact).
Gambler's ruin P=k/N, E[T]=k(N-k): *algebraic* (optional stopping theorem).
BigInt value 7.958923738717877: *anchor derived, test planned*.

### Predict questions

1. A random walker starts at k=50 of N=100. Compare the mean absorption time to
   k=10. What does the shape of E[T] = k(N−k) tell you about which starting
   positions are most "dangerous"?
2. Double the number of steps from 100 to 400. By what factor does σ=√n increase?
   Does the walker cover distance proportional to time or to √(time)?
3. For gambler's ruin with k=10, N=100, what is P(win) and E[T]? Check: does
   your answer agree with the formula k/N and k(N−k)?

### Derive it

1. Each step ξᵢ is ±1. E[ξᵢ]=0, E[ξᵢ²]=1. Steps are independent.
2. Xₙ = Σᵢ ξᵢ. E[Xₙ²] = Σ E[ξᵢ²] = n (cross terms vanish).
3. Exact E[|Xₙ|] for even n: P(Xₙ=k) = C(n,(n+k)/2)/2ⁿ; sum k·P over k≥0 → n·C(n,n/2)/2ⁿ.
4. Asymptotic: by CLT, Xₙ→N(0,n); E[|N(0,n)|] = √(2n/π).
5. Gambler's ruin: h(k)=P(reach N | k) satisfies h(k)=½h(k+1)+½h(k-1), h(0)=0, h(N)=1
   → h(k)=k/N. Fundamental matrix: E[T]=k(N-k).

### Research papers

- Spitzer, F. (1964). *Principles of Random Walk*. Springer. (cited, not fetched)
- Feller, W. (1968). *An Introduction to Probability Theory*, Vol. 1, Ch. 14. Wiley.
  (cited, not fetched)

### Where it breaks

- Discrete ±1 steps only: Lévy flights (heavy-tailed steps) give anomalous diffusion.
- No drift: biased walk changes P(win).
- Gaussian CLT approximation for E[|X|] has finite-n corrections; exact formula preferred.
- 2D recurrence: returns with probability 1 (Pólya 1921); 3D walk is transient.

---

## Bench 3 — `neuroscience/electrophysiology/cable-equation`

**Path:** `js/benches/neuroscience/electrophysiology/cable-equation/`
**Level:** university

### Critical trap — read before coding

Space constant λ = √(r_m / r_i) where r_m is membrane resistance per unit length [Ω·m]
and r_i is axial resistance per unit length [Ω/m]. In terms of specific quantities:
λ = (1/2)·√(d·Rm/Ra) where Rm [Ω·m²] is specific membrane resistance and Ra [Ω·m]
is specific axial resistivity. λ scales as √d (NOT d, NOT d²).

Do NOT confuse:
- Rm [Ω·m²] — specific membrane resistance (per unit area)
- rm [Ω·m] — membrane resistance per unit length = Rm/(π·d)

For d=1 μm, Rm=0.1 Ω·m², Ra=1 Ω·m:
λ = (1/2)·√(1e-6·0.1/1) = 1.5811×10⁻⁴ m = 158.11 μm.

**Input resistance (semi-infinite cable):**
R_in = √(r_m·r_i) = (2/π)·√(Rm·Ra)·d^{−3/2}
At d=1 μm: R_in = (2/π)·√(0.1·1)·(1e-6)^{−3/2} = 2.0131×10⁸ Ω.
Rall 3/2 power law: R_in(10μm)/R_in(1μm) = (10)^{−3/2} ≈ 0.03162.

**Finite cable (sealed end):** V(x) = V₀·cosh((L−x)/λ)/cosh(L/λ); R_in = r_i·λ·coth(L/λ).
**Finite cable (killed end):** V(x) = V₀·sinh((L−x)/λ)/sinh(L/λ); R_in = r_i·λ·tanh(L/λ).
Both → R_in_semi = r_i·λ as L→∞.

λ ratio for d=10 μm vs d=1 μm: √10 ≈ 3.1623 (NOT 10).

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| d | dendrite diameter | m | — |
| Rm | specific membrane resistance | Ω·m² | — |
| Ra | specific axial resistivity | Ω·m | — |
| λ | space constant | m | (1/2)·√(d·Rm/Ra) |
| τ_m | membrane time constant | s | Rm·Cm |
| V(x) | steady-state voltage | V | V₀·e^(−x/λ) (semi-infinite) |
| R_in | input resistance | Ω | √(r_m·r_i) = (2/π)√(Rm·Ra)·d^{−3/2} |

### Model class

`CableEquationModel` in `js/benches/neuroscience/electrophysiology/cable-equation/CableEquationModel.js`:
- `constructor({d_m, Rm_ohm_m2, Ra_ohm_m, Cm_F_m2})`
- `spaceConstant()` — returns λ in metres
- `timeConstant()` — returns τ_m = Rm·Cm in seconds
- `steadyState(x, V0)` — returns V(x) = V₀·e^(−x/λ)
- `inputResistance()` — returns R_in = √(r_m·r_i) for semi-infinite cable
- `finiteCable(x, V0, L, endCondition)` — returns V at x for finite cable
  (`endCondition`: `'sealed'` or `'killed'`)

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| λ(d=1μm, Rm=0.1, Ra=1) formula 1 | 1.58113883×10⁻⁴ m | 1×10⁻¹⁴ relative | (1/2)√(1e-6·0.1/1); verified by formula 1 |
| λ(d=1μm) formula 2 = formula 1 | same | 1×10⁻¹⁵ relative | √(r_m/r_i) must equal (1/2)√(d·Rm/Ra) |
| λ(d=10μm)/λ(d=1μm) | √10 = 3.16228 | 1×10⁻¹⁵ relative | λ∝√d; ratio = √10 algebraically |
| R_in (d=1μm) | 2.01316848×10⁸ Ω | 1×10⁻¹⁴ relative | (2/π)√(0.1·1)·(1e-6)^{−3/2} |
| Rall 3/2 law ratio R_in(10μm)/R_in(1μm) | 10^{−3/2} = 0.031623 | 1×10⁻¹⁵ relative | R_in ∝ d^{−3/2} |
| V(λ)/V₀ | e^(−1) = 0.36788 | 1×10⁻¹⁵ relative | algebraic |
| V(0)/V₀ | 1 | 1×10⁻¹⁵ relative | e^0=1 |
| V(2λ)/V₀ | e^(−2) = 0.13534 | 1×10⁻¹⁵ relative | algebraic |
| τ_m(Rm=0.1, Cm=0.01) | 0.001 s | 1×10⁻¹⁵ relative | exact multiplication |
| finite-difference residual \|λ²V''−V\| at x=0.5λ | < 1×10⁻⁸ | — | numerical FD with dx=λ/1000 on semi-infinite cable |
| d≤0 → RangeError | RangeError | — | Defensive guard |

### Status words

λ formula: *algebraic* (standard cable theory).
V(x) formula: *algebraic* (steady-state solution of λ²V''=V).
R_in formula: *algebraic*.
Rall (1959): *cited, not fetched*.

### Predict questions

1. Quadruple the dendrite diameter from 1 μm to 4 μm. By what factor does λ change?
   (λ ∝ √d, so 4× diameter → 2× λ.)
2. Set Rm to a very low value (leaky membrane). What happens to λ?
3. A synapse is at x=2λ. What fraction of input voltage reaches the soma?

### Derive it

1. Cable equation: τ_m ∂V/∂t = λ²∂²V/∂x² − V. Steady-state: λ²V'' = V.
2. General solution: V = Ae^{x/λ} + Be^{-x/λ}. Finiteness at ∞: A=0. V(0)=V₀: B=V₀.
3. λ = √(r_m/r_i). In cylindrical geometry: r_m=Rm/(πd), r_i=4Ra/(πd²) →
   λ = (1/2)√(d·Rm/Ra).
4. R_in: I = V₀/r_i/λ (slope at x=0 of V·r_i·λ). R_in = V₀/I = r_i·λ.

### Research papers

- Rall, W. (1959). Branching dendritic trees and motoneuron membrane resistivity.
  *Exp Neurol*, 1(5), 491–527. DOI: 10.1016/0014-4886(59)90046-9 (cited, not fetched)
- Koch, C. (1999). *Biophysics of Computation*, Ch. 2. Oxford. (cited, not fetched)

### Where it breaks

- Passive cable only: no voltage-gated channels, no action potentials.
- Infinite geometry: real dendrites have sealed ends and branching.
- Uniform diameter: real dendrites taper.
- Finite cable boundary conditions (sealed vs killed end) produce different V profiles;
  this bench implements both but does not show RC time-domain transients.

---

## Bench 4 — `economics/macroeconomics/solow`

**Path:** `js/benches/economics/macroeconomics/solow/`
**Level:** university

### Critical trap — read before coding

Steady-state capital per effective worker:
k* = (sA/(n+δ+g))^{1/(1−α)}

where **g is the labour-augmenting (TFP) growth rate** (growth rate of A·L, not of A
or L separately). Do NOT omit g from the denominator. The effective depreciation of k
is (n+δ+g) because population grows at n, technology at g, and capital depreciates at δ.

With α = 1/3 EXACTLY, s=0.3, A=1, n=0.01, δ=0.05, g=0:
- k* = 5^{3/2} = 5√5 = **11.18034** (tolerance 1×10⁻¹²)
- y* = √5 = **2.23607** (tolerance 1×10⁻¹²)
- c* = 0.7√5 = **1.56525** (tolerance 1×10⁻¹²)
- k_GR = (50/9)^{3/2} = **13.09457** (tolerance 1×10⁻¹²)
- c_GR = 10√2/9 = **1.57135** (tolerance 1×10⁻¹²)
- s_GR = α = 1/3 for any A (tolerance 1×10⁻¹²)

Do NOT use α=0.333 (rounded). Use 1/3 exactly.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| k | capital per effective worker | — | — |
| y | output per effective worker | — | A·k^α |
| s | savings rate | — | ∈ (0,1) |
| α | capital share | — | ∈ (0,1); RangeError at 0 or 1 |
| A | TFP | — | > 0 |
| n | population growth rate | 1/yr | — |
| δ | depreciation rate | 1/yr | — |
| g | labour-augmenting growth rate | 1/yr | — |
| k* | steady-state k | — | (sA/(n+δ+g))^{1/(1-α)} |
| k_GR | golden rule k | — | (αA/(n+δ+g))^{1/(1-α)} |
| s_GR | golden rule savings rate | — | α (for any A) |

### Domain validation (R4)

| Parameter | Valid range | Behaviour outside |
|---|---|---|
| α | (0,1) exclusive | RangeError at α=0 or α=1 |
| s | [0,1) | RangeError at s≥1 or s<0 |
| n+δ+g | > 0 | RangeError if ≤0 |

### Model class

`SolowModel` in `js/benches/economics/macroeconomics/solow/SolowModel.js`:
- `constructor({s, alpha, A, n, delta, g})`
- `steadyState()` — returns `{kStar, yStar, cStar}`
- `goldenRule()` — returns `{sGR, kGR, cGR}`
- `dk(k)` — returns dk/dt = s·A·k^α − (n+δ+g)·k
- `simulate(k0, T, dt)` — returns `[{t, k, y, c}]` via RK4

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| k* (α=1/3 exact) | 5√5 = 11.18034 | 1×10⁻¹² relative | (0.3/0.06)^{3/2} = 5^{3/2} algebraically |
| y* | √5 = 2.23607 | 1×10⁻¹² relative | (k*)^{1/3} = 5^{1/2} algebraically |
| c* | 0.7√5 = 1.56525 | 1×10⁻¹² relative | (1−s)·y* = 0.7·√5 algebraically |
| k_GR | (50/9)^{3/2} = 13.09457 | 1×10⁻¹² relative | (α/denom)^{3/2} = (1/3/0.06)^{3/2} algebraically |
| c_GR | 10√2/9 = 1.57135 | 1×10⁻¹² relative | y_GR − (n+δ+g)·k_GR algebraically |
| s_GR = α | 1/3 | 1×10⁻¹² relative | golden rule s=α for any A (algebraic identity) |
| investment = breakeven at k* | s·y* = (n+δ+g)·k* | 1×10⁻¹² relative | steady-state definition |
| RK4 dt-halving error ratio | ∈ [12, 20] | — | Richardson extrapolation for O(dt⁴) solver; T=40, dt=4 vs dt=2 |
| \|k(600,dt=1)−k*\| | < 1×10⁻⁹ | — | T=600: exp(-0.04×600)=5e-11 < 1e-9 |
| dk at k* | 0 | 1×10⁻¹⁰ relative | definition of steady state |
| α=0 → RangeError | RangeError | — | domain guard |
| α=1 → RangeError | RangeError | — | domain guard |
| s≥1 → RangeError | RangeError | — | domain guard |

**RK4 dt-halving anchor**: use z=k^{1-α} exact solution:
z(t) = z* + (z₀−z*)·exp(−(1−α)(n+δ+g)·t), z*=(k*)^{1-α}=5, μ=2/3·0.06=0.04.
k₀=2. At T=40: err(dt=4)≈2.3×10⁻⁵, err(dt=2)≈1.5×10⁻⁶, ratio≈15.6 ∈ [12,20]. ✓

### Status words

k* formula: *algebraic*.
s_GR=α: *algebraic* (Cobb-Douglas golden rule).
Numerical values (5√5 etc.): *anchor derived, test planned*.

### Predict questions

1. Increase the savings rate from 0.3 to 0.5. Does k* double? What is the elasticity
   of k* with respect to s, and how does α determine it?
2. Set g=0.02 (TFP growth). Does the economy converge to a fixed k*? What actually
   converges when TFP grows?
3. What golden-rule savings rate maximises steady-state consumption? With α=1/3, this
   is s_GR=1/3. If α were 1/2 instead, would s_GR be higher or lower?

### Derive it

1. Capital accumulation: K̇ = sY − δK. In intensive form: k̇ = s·A·k^α − (n+δ+g)·k.
2. Steady state k̇=0: k* = (sA/(n+δ+g))^{1/(1-α)}.
3. Golden rule: maximize c*=y*−(n+δ+g)k* over k → α·A·k_GR^{α-1}=n+δ+g → s_GR=α.
4. Exact linearization: z=k^{1-α} satisfies ż = −μ(z−z*), μ=(1-α)(n+δ+g)=0.04.

### Research papers

- Solow, R.M. (1956). A contribution to the theory of economic growth. *Quarterly
  Journal of Economics*, 70(1), 65–94. DOI: 10.2307/1884513 (cited, not fetched)
- Romer, D. (2012). *Advanced Macroeconomics*, 4th ed., Ch. 1. McGraw-Hill.
  (cited, not fetched)

### Where it breaks

- Exogenous savings rate: no utility maximisation (Ramsey model extends this).
- TFP is exogenous: no endogenous growth (Romer 1990).
- Cobb-Douglas only: constant elasticity assumed; real factor shares vary.

---

## Bench 5 — `neuroscience/synaptic/stdp`

**Path:** `js/benches/neuroscience/synaptic/stdp/`
**Level:** university

### Critical trap — read before coding

**Convention: Δt = t_post − t_pre** (post-minus-pre).
- Δt > 0 (pre fires before post) → LTP: Δw = +A₊·exp(−Δt/τ₊)
- Δt < 0 (post fires before pre) → LTD: Δw = −A₋·exp( Δt/τ₋)

Song et al. (2000) parameters:
**A₊ = 0.005, A₋ = A₊·1.05 = 0.00525, τ₊ = τ₋ = 20 ms.**
Net area = A₊τ₊ − A₋τ₋ = 0.1 − 0.105 = **−0.005 ms** (LTD-dominant).

A COMMON MISTAKE: using A₊=0.01. The Song 2000 value is 0.005.

**Pairing scheme: all-to-all** (each pre spike paired with every post spike in
a window; not nearest-neighbour). The `simulate` method must implement this.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| Δt | t_post − t_pre | ms | — |
| A₊ | LTP amplitude | — | Song et al. (2000): 0.005 |
| A₋ | LTD amplitude | — | 0.00525 = A₊·1.05 |
| τ₊ | LTP time constant | ms | Song et al. (2000): 20 ms |
| τ₋ | LTD time constant | ms | Song et al. (2000): 20 ms |
| Δw(Δt) | synaptic weight change | — | A₊e^{−Δt/τ₊} if Δt>0; −A₋e^{Δt/τ₋} if Δt<0 |
| W_net | integral of STDP kernel | ms | A₊τ₊ − A₋τ₋ = −0.005 ms |

### Domain validation (R4)

| Parameter | Valid range | Behaviour outside |
|---|---|---|
| A₊ | > 0 | RangeError |
| A₋ | > 0 | RangeError |
| τ₊ | > 0 | RangeError |
| τ₋ | > 0 | RangeError |

### Model class

`STDPModel` in `js/benches/neuroscience/synaptic/stdp/STDPModel.js`:
- `constructor({A_plus, A_minus, tau_plus_ms, tau_minus_ms})`
- `kernel(dt_ms)` — returns Δw for scalar Δt in ms (Δt = t_post − t_pre)
- `netArea()` — returns A₊τ₊ − A₋τ₋ (ms)
- `simulate(spike_times_pre_ms, spike_times_post_ms)` — all-to-all pairing,
  returns cumulative Δw

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| `kernel(+10)` | A₊·e^{−0.5} = 0.003032653299 | 1×10⁻¹⁵ relative | algebraic |
| `kernel(−10)` | −A₋·e^{−0.5} = −0.003184285963 | 1×10⁻¹⁵ relative | algebraic; negative (LTD) |
| `kernel(0)` | 0 (by convention) | — | simultaneous spikes → no plasticity |
| LTP area | A₊·τ₊ = 0.1 ms | 1×10⁻¹⁵ relative | analytic integral |
| LTD area | A₋·τ₋ = 0.105 ms | 1×10⁻¹⁵ relative | analytic integral |
| Net area | −0.005 ms | 1×10⁻¹⁵ relative | algebraic: 0.1 − 0.105 |
| `simulate([0], [10])` | kernel(10) = 0.003033 | 1×10⁻¹⁵ relative | single pair; all-to-all gives one pairing |
| Campbell drift (r=0.01/ms, M=10⁵) | mean Δw ≈ −5×10⁻⁵ | 4×SE ≈ 2.9×10⁻⁵ | E[Δw]=r·W_net=−5e-5; SE=√(Var/M), Var=r(A₊²τ₊/2+A₋²τ₋/2)≈5.256e-6 |
| A₊≤0 → RangeError | RangeError | — | domain guard |
| τ₊≤0 → RangeError | RangeError | — | domain guard |

Campbell's theorem anchor: for Poisson pre-rate r=0.01 spikes/ms paired with each
post spike, E[Δw per trial] = r·W_net = 0.01·(−0.005) = −5×10⁻⁵.
Var[Δw] = r·(A₊²·τ₊/2 + A₋²·τ₋/2) ≈ 5.256×10⁻⁶.
SE(M=10⁵) = √(Var/M) ≈ 7.25×10⁻⁶; 4·SE ≈ 2.9×10⁻⁵.

### Status words

Kernel formula: *algebraic*.
Song et al. parameters (A₊=0.005, τ=20ms): *cited, not fetched (PDF binary, pdftotext unavailable)*.
Campbell's theorem SE bound: *algebraic* (Poisson shot noise formula).

### Predict questions

1. Compare the LTP area (A₊·τ₊) to the LTD area (A₋·τ₋) with the default Song 2000
   parameters. Which is larger, and what does this imply about the long-run average
   weight change for a synapse receiving uncorrelated Poisson input?
2. If you double τ₊ to 40 ms (keeping A₊=0.005 and all LTD parameters unchanged),
   how does W_net change? Does the net kernel become LTP-dominant or LTD-dominant?
3. With hard bounds w∈[0,1] and initial w=0.5, a pre spike always fires 10 ms before
   a post spike (kernel value ≈ 0.003033). How many isolated pairings (T≫τ between
   pairings, so no overlap) does it take to reach w=1?
   (Each pairing adds ≈0.003033; need 0.5/0.003033 ≈ 164.9 → 165 pairings.)

### Derive it

1. Hebbian plasticity: timing-sensitive version. Pre before post (Δt>0) → LTP.
   Post before pre (Δt<0) → LTD.
2. Exponential kernel models decay of eligibility trace.
3. Net change under Poisson pairing: ∝ W_net = A₊τ₊ − A₋τ₋.
4. Song et al. choice A₋/A₊=1.05 with τ₊=τ₋ → W_net<0 → LTD-dominant.

### Research papers

- Song, S., Miller, K.D., Abbott, L.F. (2000). Competitive Hebbian learning through
  spike-timing-dependent synaptic plasticity. *Nature Neuroscience*, 3, 919–926.
  DOI: 10.1038/78829 (cited, not fetched — PDF binary, pdftotext unavailable)
- Bi, G.Q., Poo, M.M. (1998). Synaptic modifications in cultured hippocampal neurons.
  *J Neurosci*, 18(24), 10464–10472. DOI: 10.1523/JNEUROSCI.18-24-10464.1998
  (cited, not fetched)

### Where it breaks

- Pair-based STDP only: triplet interactions (Pfister & Gerstner 2006) modify net
  rule and can reverse sign.
- No dendritic effects: location on dendrite changes effective timing.
- Deterministic spike times: jitter changes effective kernel shape.
- Bimodal weight distribution (Song et al. Fig. 3) emerges only in a population of
  synapses under Poisson drive — a single synapse weight trajectory does not show
  the distribution shape.

---

## Bench 6 — `psychology/learning/opinion-dynamics`

**Path:** `js/benches/psychology/learning/opinion-dynamics/`
**Level:** university

### Critical trap — read before coding

DeGroot consensus = **π·x₀** where π is the LEFT eigenvector of W (stationary
distribution satisfying π·W = π as a row vector).

The RIGHT eigenvector of row-stochastic W is always [1,1,...,1]. This does NOT
give the consensus.

`js/core/LinAlg.jacobiEigen` is symmetric-only. A general W is NOT symmetric.
Do NOT use jacobiEigen on W. Use power iteration on Wᵀ (or left-multiply w·W).

The Derive-it section says x(T) = W^t·x₀ (W raised to power t), not W^T·x₀
(W transposed once).

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| xᵢ(t) | opinion of agent i | ∈ [0,1] | — |
| Wᵢⱼ | weight of agent j on agent i | ∈ [0,1] | Σⱼ Wᵢⱼ = 1 per row |
| x(t+1) | opinion update | — | W·x(t) |
| π | left eigenvector | — | π·W = π; Σπᵢ = 1 |
| x* | consensus | — | π·x(0) |

### Model class

`OpinionDynamicsModel` in `js/benches/psychology/learning/opinion-dynamics/OpinionDynamicsModel.js`:
- `constructor({W})` — validates row sums = 1
- `step(x)` — returns W·x (one DeGroot step)
- `simulate(x0, T)` — returns `[x₀, x₁, ..., x_T]`
- `stationary(maxIter)` — power iteration on Wᵀ, returns π
- `consensus(x0)` — returns π·x₀
- uses `isPrimitive(W)` from `js/core/LinAlg.js` to detect periodic/reducible matrices

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| mean conserved (doubly-stochastic ring N=5, x₀=[0.1,0.3,0.5,0.7,0.9]) | mean 0.5 at all t | 1×10⁻¹⁵ | doubly-stochastic W preserves mean |
| doubly-stochastic ring N=5: W^40 consensus ≈ mean | 0.5 within 1×10⁻⁶ | 1×10⁻⁶ | \|λ₂\|^40 ≈ 4.3×10⁻⁸ (from anchor) |
| W3 π exact = (5/21, 9/21, 7/21) | each component | 1×10⁻¹² | linear system π·W=π solved exactly |
| W3 consensus (x₀=[0.2,0.8,0.5]) | 39/70 = 0.557142857... | 1×10⁻¹² | π·x₀ with exact π |
| W^200·x₀ matches π·x₀ | same within 1×10⁻⁶ | 1×10⁻⁶ | cross-check: long-run simulation vs algebraic |
| π·W = π residual | < 1×10⁻¹⁰ | 1×10⁻¹⁰ | left eigenvector property |
| π·1 = 1 | 1 | 1×10⁻¹⁴ | normalization |
| W·[1,…,1] = [1,…,1] | row-stochastic identity | 1×10⁻¹⁵ | all rows sum to 1 |
| isPrimitive(ring N=5) | true | — | W^2 > 0 (from core tests) |
| cyclic permutation (N=4) isPrimitive | false | — | periodic, period 4 → no consensus |
| reducible W (block diagonal) | no consensus (two fixed points) | — | non-ergodic: each block has its own π |

### Status words

DeGroot update rule: *algebraic*.
Consensus π·x₀: *algebraic* (DeGroot 1974 Theorem 1).
W3 consensus = 39/70: *algebraic* (exact rational computation).

### Predict questions

1. Make agent 1 completely stubborn (W[0] = [1,0,0,…]). What happens to the
   long-run consensus? Does the system still converge?
2. Use a cyclic permutation (agent i influences i+1 mod N, otherwise 0). Is this
   matrix primitive? What does the opinion vector do over time?
3. Start with polarised [0.0, 0.0, 1.0, 1.0]. Does the mean-preserving property
   guarantee consensus=0.5? Does this depend on W?

### Derive it

1. x(t+1) = W·x(t). After T steps: x(T) = W^t·x₀. As T→∞: W^t→1·πᵀ for ergodic W.
2. π: unique left eigenvector with eigenvalue 1 (stationary distribution of Markov chain).
3. Found by power iteration on Wᵀ: v ← Wᵀv / ‖Wᵀv‖₁.

### Research papers

- DeGroot, M.H. (1974). Reaching a consensus. *Journal of the American Statistical
  Association*, 69(345), 118–121. DOI: 10.1080/01621459.1974.10480137 (cited, not fetched)
- Golub, B., Jackson, M.O. (2010). Naive learning in social networks. *American
  Economic Journal: Microeconomics*, 2(1), 112–149. DOI: 10.1257/mic.2.1.112
  (cited, not fetched)

### Where it breaks

- Assumes convergence: non-ergodic (reducible) W produces multiple limit opinions.
- Linear model only: bounded confidence (Deffuant) has nonlinear thresholds.
- Cyclic/periodic matrices do not converge: use `isPrimitive` to detect.

---

## Bench 7 — `biology/ecology/age-structure`

**Path:** `js/benches/biology/ecology/age-structure/`
**Level:** university

### Critical trap — read before coding

`js/core/LinAlg.jacobiEigen` is SYMMETRIC-ONLY. Leslie matrices are generally
asymmetric. Do NOT use jacobiEigen for Leslie matrices.

**PRIMITIVE vs IMPRIMITIVE matrices:**
- A non-negative matrix is primitive if it is irreducible AND aperiodic.
- Perron-Frobenius guarantees a unique positive dominant eigenvalue only for
  **primitive** (not just non-negative) matrices.
- The 2-age matrix [[0,4],[0.5,0]] is **IMPRIMITIVE**: char poly λ²=2 gives
  eigenvalues ±√2, so |λ₂/λ₁|=1. Power iteration oscillates — direction alternates
  each step. No stable age distribution exists.
- Primitivity check: uses `LinAlg.isPrimitive(M)` (Wielandt bound: k ≤ (n−1)²+1).

**L^5 first all-positive power for 3-age Leslie**:
For L=[[0,1,5],[0.4,0,0],[0,0.6,0]]:
- L^1…L^4 are NOT all positive (test each).
- L^5 IS all positive (first such power; Wielandt bound for n=3: (3−1)²+1=5).

**Power iteration oscillation test for 2-age**:
Iterate v ← L·v / ‖L·v‖ for 20 steps starting from v₀=[1,0]. Each step negates
the first-to-second-component ratio (ratio alternates sign). Test:
`Math.abs(Math.abs(ratio_k) − 1) < 1e-15` (not `Math.abs(ratio_k − 1) < 1e-15`
which would fail for ratio≈−1).

**Closed form for λ=1** (stationary population): char poly at λ=1 gives
s₀ = 1/(f₁ + s₁·f₂). For f₁=1, f₂=5, s₁=0.6: s₀=0.25 exactly.

**Guard r=ln(λ)**: if λ≤0 (imprimitive or degenerate), ln is undefined. Model must
guard: if λ≤0, either throw RangeError or return `{r: null, reason: "..."}`.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| fᵢ | age-specific fecundity | offspring/individual | L[0][i] |
| sᵢ | age-specific survival | per step | L[i+1][i] |
| λ | dominant eigenvalue | 1/step | characteristic polynomial |
| r | intrinsic growth rate | 1/step | ln(λ); guarded at λ≤0 |
| R₀ | net reproductive rate | — | Σᵢ lᵢ·fᵢ |
| lᵢ | survivorship to age i | — | l₀=1, lᵢ=s₀·…·s_{i-1} |
| w | stable age distribution | — | dominant right eigenvector (primitive only) |

### Domain validation (R4)

| Parameter | Valid range | Behaviour outside |
|---|---|---|
| fᵢ | ≥ 0 | RangeError for negative fecundity |
| sᵢ | (0, 1] | RangeError for sᵢ≤0 or sᵢ>1 |
| n0 (initial vector) | all ≥ 0 | RangeError for negative counts |
| λ | > 0 | r=ln(λ) guarded; returns null or throws for λ≤0 |

### Model class

`LeslieModel` in `js/benches/biology/ecology/age-structure/LeslieModel.js`:
- `constructor({fecundities, survivals})` — builds L matrix
- `isPrimitive()` — delegates to `LinAlg.isPrimitive(L)`
- `step(n)` — returns L·n (one time step)
- `simulate(n0, T)` — time series array
- `dominantEigen(maxIter=400)` — power iteration; returns `{lambda, stableAge}` if
  primitive, `{lambda, imprimitive: true}` otherwise
- `netReproductiveRate()` — returns R₀ = Σ lᵢ·fᵢ
- `intrinsicRate()` — returns r = ln(λ); guarded at λ≤0

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| 2-age L=[[0,4],[0.5,0]]: λ₁=+√2 | 1.41421356 | 1×10⁻¹² | char poly λ²=2; eigen2x2 |
| 2-age L=[[0,4],[0.5,0]]: λ₂=−√2 | −1.41421356 | 1×10⁻¹² | char poly; sign negative → imprimitive |
| 2-age: isPrimitive | false | — | Wielandt bound: L^2 is diagonal (not all-positive) |
| 2-age power iter sign alternation | ratio alternates sign | abs(abs(ratio)−1) < 1×10⁻¹⁵ | |λ₂/λ₁|=1 → imprimitive oscillation |
| L^k not all-positive for k=1..4 (3-age) | false×4 | — | assert ¬(Mk.every(r=>r.every(x=>x>0))) |
| L^5 all positive (3-age) | true | — | first k with Mk>0; Wielandt bound n=3 → k≤5 |
| 3-age λ (L=[[0,1,5],[0.4,0,0],[0,0.6,0]]) | 1.18761471 | 1×10⁻⁵ | power iter 400 steps |
| 3-age char poly residual \|λ³−0.4λ−1.2\| | < 1×10⁻¹³ | 1×10⁻¹³ | algebraic |
| Euler-Lotka: l₁f₁/λ²+l₂f₂/λ³=1 | 1 | 1×10⁻¹³ | algebraic rearrangement |
| R₀ (3-age) | 1.6 | 1×10⁻¹⁵ | 0.4·1+0.24·5=1.6 algebraically |
| λ=1 closed form: s₀=0.25 | λ=1.0 | 1×10⁻⁸ | s₀=1/(f₁+s₁f₂)=0.25; power iter confirms |
| r = ln(1.18761) | 0.17195 | 1×10⁻⁵ | algebraic log |
| r at λ→0⁺ → guard | RangeError or null | — | ln(0)=−∞ defence |
| L·w = λ·w eigenvector check | residual < 1×10⁻⁸ | 1×10⁻⁸ | power-iterated vector |
| simulate n0=(1,0,0) T=200: total grows as λ^t | ratio N(t+1)/N(t) → λ | 1×10⁻³ at t=200 | Perron-Frobenius; 400 iter precision |

### Status words

Leslie matrix formulation: *algebraic*.
Char poly of 3-age: *algebraic*.
λ≈1.18761: *anchor derived, test planned*.
R₀ formula: *algebraic*.
Perron-Frobenius (for **primitive** matrices): *algebraic*.
Leslie (1945): *cited, not fetched*.

### Predict questions

1. Increase fecundity f₂ from 5 to 10 in the 3-age model. Does λ increase? By
   how much does R₀ change?
2. Set s₀=0.25 (the stationary value). Verify that λ=1 and the population is stable.
   What does R₀ equal at this s₀?
3. The 2-age matrix [[0,4],[0.5,0]] is imprimitive. What does the population
   vector do over time if you simulate it? Does total population grow?

### Derive it

1. n(t+1) = L·n(t). Long-run: n(t) ≈ cλᵗw (primitive Perron-Frobenius).
2. 3-age char poly: det(L−λI) = −λ³ + f₁s₀λ + f₂s₀s₁ = 0.
3. Divide by λ³: l₁f₁/λ² + l₂f₂/λ³ = 1 (Euler-Lotka equation).
4. At λ=1: s₀(f₁+s₁f₂)=1 → s₀=1/(f₁+s₁f₂) (exact stationary formula).

### Research papers

- Leslie, P.H. (1945). On the use of matrices in certain population mathematics.
  *Biometrika*, 33(3), 183–212. DOI: 10.1093/biomet/33.3.183 (cited, not fetched)
- Caswell, H. (2001). *Matrix Population Models*, 2nd ed. Sinauer. (cited, not fetched)

### Where it breaks

- Deterministic: no demographic stochasticity.
- Time-invariant fecundities and survivals.
- Age structure only: stage-structured models use Lefkovitch matrices.
- No spatial structure.

---

## Test count target

| Bench | Estimated new tests |
|---|---|
| entropy-mixing | 14 |
| random-walk | 16 |
| cable-equation | 14 |
| solow | 16 |
| stdp | 14 |
| opinion-dynamics | 16 |
| age-structure | 18 |
| isprimitive (core) | 9 |
| **Total new** | **~117** |
| **Cumulative** | **~873** |

---

## Domain / boundary test checklist (R4)

| Bench | Boundary condition | Expected behaviour |
|---|---|---|
| entropy-mixing | pure state x=1 | ΔS=+0 (not −0) |
| entropy-mixing | trace component x=0 | term=0, no NaN |
| entropy-mixing | Σxᵢ≠1 | RangeError |
| entropy-mixing | xᵢ<0 | RangeError |
| cable-equation | d≤0 | RangeError |
| solow | α=0 or α=1 | RangeError |
| solow | s≥1 | RangeError |
| solow | n+δ+g≤0 | RangeError |
| random-walk | n=0 | X₀=0, walk length 1 |
| stdp | A₊≤0 | RangeError |
| stdp | τ₊≤0 | RangeError |
| opinion-dynamics | row sum ≠ 1 | RangeError |
| opinion-dynamics | cyclic W (isPrimitive=false) | no consensus; detected |
| age-structure | fᵢ<0 | RangeError |
| age-structure | sᵢ>1 or sᵢ≤0 | RangeError |
| age-structure | imprimitive matrix | `imprimitive: true`; no stable age dist |
| age-structure | λ≤0 | r=ln(λ) guarded |

---

## Commit discipline

- One commit per bench
- `npm test` before every commit (0 failures)
- `npm run smoke -- --bench <bench-id>` before every commit
- Catalog entry in same commit as model/view/test
- Commit message: `feat(bench): add <bench-name> with N tests`
- No push until phase complete and reviewed

---

## Constants register

| Constant | Value | Status |
|---|---|---|
| R (gas constant) | 8.31446261815324 J/(mol·K) | exact (CODATA 2018 SI definition) |
| A₊ (STDP LTP amplitude) | 0.005 | cited, not fetched (Song et al. 2000; PDF binary) |
| A₋ (STDP LTD amplitude) | 0.00525 | cited, not fetched (Song et al. 2000) |
| τ₊=τ₋ (STDP time constants) | 20 ms | cited, not fetched (Song et al. 2000) |
| Rm (cable, default) | 0.1 Ω·m² | unverified (illustrative textbook value) |
| Ra (cable, default) | 1.0 Ω·m | unverified (illustrative textbook value) |

---

STOP — submit for review before coding.
