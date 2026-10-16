# Phase 8 plan

**Date drafted:** 2026-10-16
**Carries forward:** 614 tests pass (phases 1–7b).
**Tag at start:** `phase-7b`

---

## Pre-plan anchor computations (R1)

All numerical anchors computed in `tools/anchors-phase8.mjs` (no model code).
Run `node tools/anchors-phase8.mjs` to reproduce all values below.

---

## Implementation order

1. particle-in-box (no new infra; pure math)
2. carnot (no new infra; pure math)
3. markov-chains (needs LinAlg.powerIteration for large chains; 2-state uses closed form)
4. drift-diffusion (needs Random.gaussianSeeded for SDE simulation)
5. phase-plane (jacobiEigen already in LinAlg.js; only 2×2 needed here)
6. competitive-exclusion (RK4 from Integrators.js; Lotka-Volterra ODE)
7. pharmacokinetics (RootFinding.brent for oral t_max; RK4 for 2-compartment)

## Key reuse

| Module | Used by |
|---|---|
| `js/core/Integrators.js` (RK4) | competitive-exclusion ODE, pharmacokinetics 2-compartment |
| `js/core/Random.js` (gaussianSeeded) | drift-diffusion SDE simulation |
| `js/core/RootFinding.brent` | pharmacokinetics oral t_max |
| `js/core/LinAlg.powerIteration` | markov-chains stationary distribution (large chains) |

---

## New catalog fields

| Subject | Field id | Label | Benches |
|---|---|---|---|
| Physics | `intro` | Introduction | particle-in-box, carnot |
| Math | `graduate` | Graduate topics | markov-chains, phase-plane |
| Psychology | `graduate` | Graduate topics | drift-diffusion |
| Biology | `university` | University | competitive-exclusion, pharmacokinetics |

---

## Bench 1 — `physics/intro/particle-in-box`

**Level:** intro

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| n | quantum number | — |
| ℏ | reduced Planck constant | J·s |
| m_e | electron mass | kg |
| L | box length | m |
| E_n | energy of level n | J |
| ψ_n | wavefunction | m^{-½} |
| ⟨x⟩_n | position expectation | m |
| ⟨x²⟩_n | second moment | m² |

### Constants (CODATA 2018)

| Constant | Value |
|---|---|
| ℏ | 1.054571817×10⁻³⁴ J·s |
| m_e | 9.1093837015×10⁻³¹ kg |
| eV | 1.602176634×10⁻¹⁹ J |

### Parameter domain

| Parameter | Domain | Boundary tests |
|---|---|---|
| L | [0.1nm, 10nm] | L→0: E_1→∞; L→∞: E_1→0 |
| n | {1, 2, 3, …} | n=1: ground state; n→∞: classical limit |

### Anchor → test table

| Anchor | Expected value (computed) | Tolerance | Test name |
|---|---|---|---|
| E_1 at L=1nm | 6.02467×10⁻²⁰ J = 0.37603 eV | 1×10⁻²⁷ J | `E_1(L=1nm) ≈ 6.0247e-20 J ±1e-27` |
| E_2/E_1 | 4 | 0 (exact) | `E_2/E_1 = 4 exactly` |
| E_3/E_1 | 9 | 0 (exact) | `E_3/E_1 = 9 exactly` |
| E_2 − E_1 | 3·E_1 = 1.12809 eV | 1×10⁻⁴ eV | `E_2 - E_1 = 3E_1 in eV ±1e-4` |
| ∫₀ᴸ ψ₁² dx | 1 | 1×10⁻⁸ | `normalization n=1 ±1e-8 (Simpson)` |
| ∫₀ᴸ ψ₂² dx | 1 | 1×10⁻⁸ | `normalization n=2 ±1e-8 (Simpson)` |
| ∫₀ᴸ ψ₁·ψ₂ dx | 0 | 1×10⁻⁸ | `orthogonality ψ₁,ψ₂ ±1e-8 (Simpson)` |
| ⟨x⟩₁ = L/2 | L/2 (exact, by symmetry) | 1×10⁻¹² | `<x>_1 = L/2 exactly` |
| ⟨x²⟩₁ = L²(1/3−1/(2π²)) | 2.82673×10⁻¹⁹ m² at L=1nm | 1×10⁻³⁰ | `<x²>_1 = L²(1/3-1/(2π²)) ±1e-30` |
| σ_x,1 = √(⟨x²⟩₁−L²/4) | 1.80756×10⁻¹⁰ m | 1×10⁻²² | `σ_x,1 ±1e-22` |
| E_n level ordering | E_1 < E_2 < E_3 | — | `energies strictly increasing for n=1..5` |

### Source status

Formulas from standard QM (Griffiths, "Introduction to Quantum Mechanics", §2.2).
Constants from CODATA 2018 (cited, not fetched). 1 nm box chosen for pedagogical clarity.

### View description

Left panel: wavefunction ψ_n(x) and |ψ_n|² vs x. Right panel: energy level diagram
showing E_1…E_5 as horizontal bars; selected level highlighted. Slider for n and L.

### Predict questions

1. Why does E_n scale as n²? What does this imply for the spacing between levels at high n?
2. If you double L, by what factor does E_1 change? What does this say about confinement energy?
3. A photon is emitted when the electron drops from n=2 to n=1. Calculate the photon wavelength.

### Derive it

1. Schrödinger equation in box: −(ℏ²/2m)(d²ψ/dx²) = Eψ, ψ(0)=ψ(L)=0.
2. General solution: ψ=A sin(kx), k=nπ/L. Normalization gives A=√(2/L).
3. E_n = ℏ²k²/(2m) = n²π²ℏ²/(2mL²).
4. Expectation values: ⟨x⟩ = L/2 by parity; ⟨x²⟩ = L²/3 − L²/(2n²π²) from integral tables.

### Research papers

- Griffiths (1995) "Introduction to Quantum Mechanics": cited, not fetched.
- CODATA 2018 constants: cited, not fetched.

### Where it breaks

- Real quantum dots have finite potential walls and effective mass m* ≠ m_e.
- Coulomb interactions between electrons are ignored.
- 3D box has degeneracies absent in 1D.

---

## Bench 2 — `physics/intro/carnot`

**Level:** intro

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| T_h | hot reservoir temperature | K |
| T_c | cold reservoir temperature | K |
| η | Carnot efficiency | — |
| W | net work output | J |
| Q_h | heat absorbed from hot | J |
| COP_hp | coefficient of performance (heat pump) | — |
| COP_ref | coefficient of performance (refrigerator) | — |

### Parameter domain

| Parameter | Domain | Boundary tests |
|---|---|---|
| T_h | (0, ∞) K | T_h > T_c always |
| T_c | [0, T_h) K | T_c=0: η=1; T_c=T_h: η=0 |

### Anchor → test table

| Anchor | Expected value (computed) | Tolerance | Test name |
|---|---|---|---|
| η(T_h=500, T_c=300) | 0.40 | 0 (exact) | `η = 0.40 exactly` |
| η(T_h=500, T_c=0) | 1.0 | 0 (exact) | `η = 1.0 exactly at T_c=0` |
| dη/dT_c at T_h=500 | −1/500 = −0.002 | 1×10⁻¹⁵ | `dη/dT_c = -1/T_h ±1e-15` |
| COP_hp(T_h=300, T_c=273) | 300/27 ≈ 11.111 | 1×10⁻¹⁰ | `COP_hp = T_h/(T_h-T_c) ±1e-10` |
| COP_ref(T_h=300, T_c=273) | 273/27 ≈ 10.111 | 1×10⁻¹⁰ | `COP_ref = T_c/(T_h-T_c) ±1e-10` |
| η × COP_hp (same T) | 1.0 (exact) | 1×10⁻¹⁵ | `η * COP_hp = 1 exactly (same temperatures)` |
| η < 1 for T_c > 0 | always | — | `η < 1 for 10 random T_c in (0, T_h)` |
| η monotone in T_c | decreasing | — | `η(T_c=100) > η(T_c=200) > η(T_c=300)` |

### Source status

Second law / Carnot theorem: standard thermodynamics (Callen "Thermodynamics", Ch.4).
Cited, not fetched.

### View description

Interactive T-S (temperature-entropy) diagram showing the rectangular Carnot cycle.
Sliders for T_h and T_c. Readouts: η, W/Q_h, COP_hp, COP_ref.

### Predict questions

1. A real steam turbine achieves η = 0.33. If T_h = 600°C, what is the minimum T_c consistent with the second law?
2. Why can't a heat pump with COP_hp = ∞ exist? What would it violate?
3. If T_c doubles (in Kelvin), what happens to η?

### Derive it

1. Carnot cycle: isothermal expansion at T_h, adiabatic expansion, isothermal compression at T_c, adiabatic compression.
2. Efficiency: η = W/Q_h = 1 − |Q_c|/Q_h = 1 − T_c/T_h (by entropy balance).
3. COP_hp = Q_h/W = 1/η; COP_ref = Q_c/W = T_c/(T_h−T_c).

### Research papers

- Carnot (1824) "Réflexions sur la puissance motrice du feu": cited, not fetched.

### Where it breaks

- Real engines are irreversible (friction, finite temperature gradients).
- T must be in Kelvin (absolute), not Celsius.
- The Carnot cycle is reversible and quasi-static; real processes are neither.

---

## Bench 3 — `math/graduate/markov-chains`

**Level:** graduate

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| P | transition matrix | — |
| p | P(0→1) | — |
| q | P(1→0) | — |
| π | stationary distribution | — |
| λ₂ | second eigenvalue of P | — |
| gap | spectral gap = 1 − |λ₂| | — |
| t_rel | relaxation time = 1/gap | steps |
| t_mix | mixing time | steps |

**IMPORTANT:** 2-state Markov chain P is NON-SYMMETRIC (unless p=q). The eigenvalue
λ₂ = 1−p−q is computed as a CLOSED FORM, NOT via jacobiEigen (which requires
symmetric matrices). For larger chains, use LinAlg.powerIteration on P (power iteration
on the Markov chain directly converges to the stationary distribution).

### Parameter domain

| Parameter | Domain | Boundary tests |
|---|---|---|
| p | (0, 1) | p=0: absorbing state 0; p+q=1: uniform stationary |
| q | (0, 1) | q=0: absorbing state 1 |
| p+q | ≤ 1 | p+q=1: λ₂=0, immediate mixing |

### Anchor → test table (p=0.3, q=0.4)

| Anchor | Expected value (computed) | Tolerance | Test name |
|---|---|---|---|
| π₀ = q/(p+q) | 4/7 ≈ 0.571429 | 1×10⁻¹⁰ | `π₀ = q/(p+q) = 4/7 ±1e-10` |
| π₁ = p/(p+q) | 3/7 ≈ 0.428571 | 1×10⁻¹⁰ | `π₁ = p/(p+q) = 3/7 ±1e-10` |
| λ₂ = 1−p−q | 0.3 | 1×10⁻¹⁵ | `λ₂ = 1-p-q = 0.3 (closed form) ±1e-15` |
| spectral gap | 0.7 | 1×10⁻¹⁵ | `spectral gap = p+q = 0.7 ±1e-15` |
| π·P = π (stationarity) | 0 residual | 1×10⁻¹⁴ | `π P = π residual ±1e-14` |
| detailed balance π₀·p = π₁·q | 0.171429 both | 1×10⁻¹² | `detailed balance ±1e-12` |
| t_mix(ε=0.01) ≤ bound | ≤ 7.789 | — | `t_mix bound ≤ 7.789` |
| Power iteration converges to π | |π_iter − π|₁ < 1×10⁻¹⁰ | 1×10⁻¹⁰ | `powerIteration convergence ±1e-10` |

### Source status

Markov chain mixing theory: Levin, Peres, Wilmer "Markov Chains and Mixing Times" (2009).
Cited, not fetched.

### View description

Transition diagram with animated probability flow. Line plot of π^(t) vs t converging
to stationary distribution. Readouts: λ₂, gap, t_rel, π. Slider for p and q.

### Predict questions

1. If p = q = 0.5, what is the stationary distribution? What does λ₂ = 0 mean for mixing?
2. For a 3-state chain, can you still use the closed-form λ₂ = 1−p−q? (No — why not?)
3. The Google PageRank algorithm is a Markov chain on web pages. What is the stationary distribution measuring?

### Derive it

1. Stationarity: πP = π → π₀ = π₀(1−p) + π₁q; π₁ = π₀p + π₁(1−q). Solve: π₀ = q/(p+q).
2. Eigenvalues of P = [[1−p,p],[q,1−q]]: det(P−λI) = 0 → (1−p−λ)(1−q−λ) − pq = 0.
   Roots: λ₁ = 1 (always), λ₂ = 1−p−q (closed form; no numerical solver needed).
3. Mixing: after k steps |π^(k) − π|_TV ≤ |λ₂|^k/(2π_min).

### Research papers

- Levin, Peres, Wilmer (2009): cited, not fetched.
- Markov (1906) original paper: cited, not fetched.

### Where it breaks

- Non-symmetric P: jacobiEigen cannot be used (requires symmetric matrix). Use closed form.
- Periodic chains (λ₂ = −1): mixing time analysis requires |λ₂| not λ₂.
- Lazy chains: P' = (I+P)/2 breaks periodicity, λ₂' = (1+λ₂)/2 ≥ 0.

---

## Bench 4 — `psychology/graduate/drift-diffusion`

**Level:** graduate

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| μ | drift rate | units/s |
| σ | noise (diffusion) | units/√s |
| a | boundary (half-range) | units |
| t₀ | non-decision time | s |
| P_upper | probability of upper boundary hit | — |
| RT | mean response time | s |

### Parameter domain

| Parameter | Domain | Boundary tests |
|---|---|---|
| μ | (−∞, ∞) | μ=0: P=0.5; μ→∞: P→1 |
| a | (0, ∞) | a→0: RT→t₀; a→∞: P→Heaviside(μ) |
| σ | (0, ∞) | σ→0: deterministic drift |
| t₀ | [0, ∞) | t₀=0: RT = mean first-passage time only |

### Anchor → test table (μ=1, a=1, σ=1, t₀=0.3 unless noted)

| Anchor | Expected value (computed) | Tolerance | Test name |
|---|---|---|---|
| P(upper) | 1/(1+exp(−2)) ≈ 0.880797 | 1×10⁻⁶ | `P_upper(μ=1,a=1,σ=1) ±1e-6` |
| RT_mean | tanh(1) + 0.3 ≈ 1.06159 s | 1×10⁻⁶ | `RT_mean ±1e-6` |
| P(upper) at μ=0 | 0.5 (exact) | 1×10⁻¹⁵ | `P_upper(μ=0) = 0.5 exactly` |
| P(upper) at μ<0 | < 0.5 | — | `P_upper monotone in μ` |
| Simulated P vs formula | within 3σ | 3×sqrt(P(1-P)/5000) ≈ 0.0138 | `simulation N=5000 within 3σ ±0.014` |
| RT_mean > t₀ | always | — | `RT_mean > t₀ for μ=1,a=1,σ=1` |

**Simulation note:** Use `Random.gaussianSeeded(42)` for reproducible SDE trials.
σ of P̂ with N=5000 = √(0.8808·0.1192/5000) ≈ 0.00458; 3σ tolerance = 0.0138 (R1).

### Source status

Ratcliff (1978) "A theory of memory retrieval": cited, not fetched.
Bogacz et al. (2006) "The physics of optimal decision making": cited, not fetched.

### View description

Left: RT distribution histogram for upper/lower boundary responses. Right: drift path
animation showing simulated SDE trajectory with boundaries. Sliders for μ, a, σ, t₀.

### Predict questions

1. Why does the model predict a right-skewed RT distribution even for constant drift μ?
2. How does increasing a (cautiousness) affect the speed-accuracy tradeoff?
3. What does the non-decision time t₀ represent, and how could it be measured independently?

### Derive it

1. Fokker-Planck for Ornstein-Uhlenbeck with absorbing boundaries at ±a.
2. P(upper) = 1/(1+exp(−2μa/σ²)) — from balance of exponential factors at boundaries.
3. ⟨T⟩ = (a/μ)tanh(μa/σ²) — from Green's function of the FP equation.

### Research papers

- Ratcliff (1978): cited, not fetched.
- Bogacz et al. (2006): cited, not fetched.

### Where it breaks

- Real RT distributions have heavier tails than the DDM predicts.
- Drift μ varies trial-to-trial in empirical data (variability model needed).
- Collapse boundaries (a decreasing over time) improve fit but complicate analytics.

---

## Bench 5 — `math/graduate/phase-plane`

**Level:** graduate

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| A | 2×2 system matrix | — |
| τ | trace = tr(A) | — |
| Δ | determinant = det(A) | — |
| λ₁, λ₂ | eigenvalues of A | 1/time |
| stability | qualitative classification | enum |

### Classification table

| Condition | Type |
|---|---|
| Δ < 0 | Saddle |
| τ = 0, Δ > 0 | Center |
| τ < 0, Δ > 0, τ² > 4Δ | Stable node |
| τ > 0, Δ > 0, τ² > 4Δ | Unstable node |
| τ < 0, Δ > 0, τ² < 4Δ | Stable spiral |
| τ > 0, Δ > 0, τ² < 4Δ | Unstable spiral |
| Δ = 0 | Degenerate (zero eigenvalue) |

### Anchor → test table

| Anchor | Expected value (computed) | Tolerance | Test name |
|---|---|---|---|
| A=[[-1,0],[0,-2]]: τ=−3,Δ=2 → stable node; λ=−1,−2 | τ=−3 exact | 1×10⁻¹⁵ | `stable node trace=-3 ±1e-15` |
| A=[[0,-1],[1,0]]: τ=0,Δ=1 → center; λ=±i | τ=0 exact | 1×10⁻¹⁵ | `center trace=0 ±1e-15` |
| A=[[-1,-1],[1,-1]]: τ=−2,Δ=2 → stable spiral; λ=−1±i | τ²−4Δ=−4 < 0 | 1×10⁻¹⁵ | `stable spiral discriminant=-4 ±1e-15` |
| A=[[1,0],[0,-1]]: Δ=−1 → saddle | Δ=−1 exact | 1×10⁻¹⁵ | `saddle determinant=-1 ±1e-15` |
| A=[[1,0],[0,2]]: τ=3,Δ=2 → unstable node | τ=3 exact | 1×10⁻¹⁵ | `unstable node trace=3 ±1e-15` |
| Hartman-Grobman: non-center/non-degenerate → same type as linearization | — | — | `classify agrees with eigenvalue signs for 20 cases` |
| Continuous τ,Δ→0 boundaries correctly handled | — | — | `boundary cases: τ=0 → center; Δ=0 → degenerate` |

### Source status

Strogatz (1994) "Nonlinear Dynamics and Chaos" §5.2: cited, not fetched.

### View description

τ-Δ plane (trace–determinant diagram) with parabola τ²=4Δ and axes. A point indicating
current A moves as sliders change. Phase portrait panel (quiver plot of flow field).

### Predict questions

1. A 2×2 matrix with all positive entries — can it have a stable fixed point?
2. If τ = 0 exactly (center), is the equilibrium stable? (Lyapunov-stable but not asymptotically so.)
3. How does the Hartman-Grobman theorem break down at centers? (Nonlinear terms determine stability.)

### Derive it

1. ẋ = Ax; ansatz x = e^{λt}v → (A−λI)v = 0 → char. poly.: λ²−τλ+Δ = 0.
2. Discriminant τ²−4Δ: negative → complex eigenvalues (spiral/center); positive → real (node/saddle).
3. Sign of real part Re(λ) = τ/2 determines stability.

### Research papers

- Strogatz (1994): cited, not fetched.
- Hartman (1960), Grobman (1959): cited, not fetched.

### Where it breaks

- Centers (τ=0) are structurally unstable: any perturbation breaks the exact symmetry.
- Hartman-Grobman does not apply to centers or degenerate equilibria.
- Nonlinear terms near the origin change spiral vs center classification.

---

## Bench 6 — `biology/university/competitive-exclusion`

**Level:** university

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| N₁, N₂ | species 1, 2 population | individuals |
| r₁, r₂ | intrinsic growth rates | 1/time |
| K₁, K₂ | carrying capacities | individuals |
| α₁₂ | interspecific competition of sp2 on sp1 | — |
| α₂₁ | interspecific competition of sp1 on sp2 | — |
| N₁*, N₂* | coexistence equilibrium | individuals |

### Parameter domain

| Parameter | Domain | Boundary tests |
|---|---|---|
| α₁₂, α₂₁ | [0, ∞) | 0 = no competition; 1 = symmetric |
| K₁, K₂ | (0, ∞) | coexistence iff α₁₂ < K₁/K₂ AND α₂₁ < K₂/K₁ |

### Anchor → test table

| Anchor | Expected value (computed) | Tolerance | Test name |
|---|---|---|---|
| Coexistence N₁* (K=100, α₁₂=α₂₁=0.5) | 66.667 | 1×10⁻¹⁰ | `coexistence N₁* = 200/3 ±1e-10` |
| Coexistence N₂* (same) | 66.667 | 1×10⁻¹⁰ | `coexistence N₂* = 200/3 ±1e-10` |
| α₁₂<K₁/K₂ AND α₂₁<K₂/K₁ → coexist | true | — | `coexistence condition check` |
| α₁₂<K₁/K₂ AND α₂₁>K₂/K₁ → sp1 wins | sp2 → 0 | — | `exclusion sp1 wins` |
| α₁₂>K₁/K₂ AND α₂₁>K₂/K₁ → bistable | IC-dependent | — | `bistability: 2 outcomes from different ICs` |
| RK4 trajectory N₁(t=100)≈N₁* | within 1% of N₁* | 0.01 N₁* | `RK4 converges to coexistence ±1%` |

### Source status

Lotka-Volterra competition: Gause (1934) "The Struggle for Existence". Cited, not fetched.
Hardin (1960) "The Competitive Exclusion Principle", Science. Cited, not fetched.

### View description

Phase portrait (N₁ vs N₂) with nullclines, equilibria, and RK4 trajectories from
multiple initial conditions. Color-coded outcomes: coexistence (both persist),
exclusion (one goes to 0), bistability (outcome depends on IC).

### Predict questions

1. If α₁₂ = α₂₁ = 1 and K₁ = K₂, what is the stability of the coexistence equilibrium?
2. The competitive exclusion principle says two species cannot occupy the same niche indefinitely. What condition translates this formally?
3. If species 1 is a superior competitor (α₂₁ >> 1) but species 2 has a higher K₂, can they coexist?

### Derive it

1. dN₁/dt = r₁N₁(1 − N₁/K₁ − α₁₂N₂/K₁); nullcline: N₁ = K₁ − α₁₂N₂.
2. Similarly for N₂. Intersection of nullclines = coexistence equilibrium.
3. N₁* = (K₁ − α₁₂K₂)/(1 − α₁₂α₂₁); N₂* = (K₂ − α₂₁K₁)/(1 − α₁₂α₂₁).
4. Stability: Jacobian at N* has det > 0, tr < 0 iff 1−α₁₂α₂₁ > 0 (same coexistence condition).

### Research papers

- Gause (1934): cited, not fetched.
- Hardin (1960): cited, not fetched.

### Where it breaks

- Real competition is often indirect (via shared resources), not the Lotka-Volterra simplification.
- Ignores spatial structure, stochasticity, and environmental fluctuations.
- For n > 2 species: coexistence conditions are much more complex.

---

## Bench 7 — `biology/university/pharmacokinetics`

**Level:** university

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| C(t) | plasma concentration | mg/L |
| C₀ | initial concentration (IV) | mg/L |
| k_e | elimination rate constant | 1/h |
| t_{1/2} | half-life | h |
| AUC | area under the curve | mg·h/L |
| V_d | volume of distribution | L |
| k_a | absorption rate (oral) | 1/h |
| F | bioavailability | — |
| D | dose | mg |
| t_max | time to peak (oral) | h |
| C_max | peak concentration (oral) | mg/L |

### Parameter domain

| Parameter | Domain | Boundary tests |
|---|---|---|
| k_e | (0, ∞) | k_e→0: drug never clears; k_e→∞: instantaneous elimination |
| k_a | (k_e, ∞) | k_a=k_e: Bateman undefined (use limit); k_a → ∞: IV-like |
| t_{1/2} = ln2/k_e | — | verify t_{1/2} for any k_e |

### Anchor → test table

| Anchor | Expected value (computed) | Tolerance | Test name |
|---|---|---|---|
| C(t=5h) IV, C₀=100, k_e=0.1 | 100·e⁻⁰·⁵ ≈ 60.653 mg/L | 1×10⁻⁸ | `C(5h) = 60.653 mg/L ±1e-8` |
| t_{1/2} = ln2/0.1 | 6.9315 h | 1×10⁻¹⁰ | `t_half = 6.9315 h ±1e-10` |
| AUC = C₀/k_e | 1000 mg·h/L | 1×10⁻⁶ | `AUC = C₀/ke = 1000 ±1e-6` |
| t_max (oral, k_a=1, k_e=0.1) | ln(10)/0.9 ≈ 2.5584 h | 1×10⁻¹⁰ | `t_max ±1e-10` |
| dC/dt = 0 at t_max | 0 | 1×10⁻¹⁰ | `dC/dt ≈ 0 at t_max ±1e-10` |
| AUC oral = F·D/(V_d·k_e) | 100 mg·h/L (F=1,D=100,V_d=10,k_e=0.1) | 1×10⁻⁶ | `AUC_oral ±1e-6` |
| C(t) IV: strictly decreasing | for 10 t-values | — | `C(t) strictly decreasing for t>0` |

### Source status

Rowland & Tozer "Clinical Pharmacokinetics" (1995): cited, not fetched.
Bateman (1910) original: cited, not fetched.

### View description

Semi-log plot of C(t) vs t for IV bolus and oral Bateman. Readouts: t_{1/2}, AUC, t_max, C_max.
Sliders: k_e, k_a, dose D, F. Toggle between 1-compartment and oral. Optional 2-compartment overlay.

### Predict questions

1. If k_a = k_e, what happens to the Bateman formula? (It becomes indeterminate; real drugs always have k_a ≠ k_e.)
2. A drug with t_{1/2} = 24h is given every 12h. After many doses, what is the accumulation ratio?
3. Why is a semi-log plot useful for pharmacokinetics?

### Derive it

1. IV: dC/dt = −k_e C → C(t) = C₀·e^{−k_e·t}; t_{1/2} = ln2/k_e.
2. Oral (1-compartment Bateman): dA/dt = −k_a A; dC/dt = k_a F D/(V_d) · e^{−k_a t} − k_e C.
3. Solution: C(t) = (k_a F D)/(V_d(k_a−k_e)) · (e^{−k_e t} − e^{−k_a t}).
4. t_max: set dC/dt=0 → k_a e^{−k_a t} = k_e e^{−k_e t} → t_max = ln(k_a/k_e)/(k_a−k_e).

### Research papers

- Rowland & Tozer (1995): cited, not fetched.
- Bateman (1910): cited, not fetched.

### Where it breaks

- 1-compartment assumes instantaneous mixing in blood. Real drugs have multi-compartment kinetics.
- Non-linear elimination (Michaelis-Menten): C(t) ≠ monoexponential at high doses.
- Protein binding, active transport, and enterohepatic circulation all complicate the model.

---

## Test count estimate

| Bench | Expected tests |
|---|---|
| particle-in-box | ~10 |
| carnot | ~8 |
| markov-chains | ~8 |
| drift-diffusion | ~7 |
| phase-plane | ~8 |
| competitive-exclusion | ~8 |
| pharmacokinetics | ~8 |
| **Total** | **~57 new tests** |

Projected total after Phase 8: 614 + 57 ≈ **671 tests**.

---

## STOP

Phase 8 plan is complete. Do NOT build Phase 8 here. Return to user.
