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

1. `particle-in-box`       — pure math, new `quantum` catalog field
2. `carnot`                — pure math, existing `thermodynamics` field
3. `markov-chains`         — power iteration, existing `probability` field
4. `drift-diffusion`       — SDE simulation, new `decision-making` catalog field
5. `phase-plane`           — add `LinAlg.eigen2x2`, existing `dynamics` field
6. `competitive-exclusion` — RK4 ODE, existing `ecology` field
7. `pharmacokinetics`      — Bateman limit + multi-dose, new `pharmacology` catalog field

---

## New catalog fields

| Subject | Field id | Label | Benches |
|---|---|---|---|
| Physics | `quantum` | Quantum mechanics | particle-in-box |
| Psychology | `decision-making` | Decision making | drift-diffusion |
| Biology | `pharmacology` | Pharmacology | pharmacokinetics |

Fields `thermodynamics`, `probability`, `dynamics`, `ecology` already exist.

---

## Key reuse

| Module | Used by |
|---|---|
| `js/core/Integrators.js` (RK4) | phase-plane, competitive-exclusion |
| `js/core/Random.js` (normalSeeded) | drift-diffusion SDE simulation |
| `js/core/RootFinding.brent` | pharmacokinetics oral t_max cross-check |
| `js/core/LinAlg.js` (add eigen2x2) | phase-plane classification |
| `js/data/constants.js` (add h, c, me) | particle-in-box |

---

## Bench 1 — `physics/quantum/particle-in-box`

**Level:** intro

**Infrastructure first:** add `quantum` field to `js/catalog.js`; add `h`, `hbar`, `me`, `eV`
to `js/data/constants.js` with CODATA 2018 citations. `me` — *unverified* (cited, not fetched).

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

### Parameter domain

| Parameter | Domain | Behaviour at boundary |
|---|---|---|
| n | {1, 2, 3, …} | n < 1 → `RangeError` |
| L | (0, ∞) m | L ≤ 0 → `RangeError` |

### Anchor → test table

| Anchor | Expected (from anchor script) | Tolerance | Test name |
|---|---|---|---|
| E₁ at L=1nm | 6.02467×10⁻²⁰ J = 0.376030 eV | 1×10⁻²⁷ J | `E_1(L=1nm) in J ±1e-27` |
| E₂/E₁ | 4 | 1×10⁻¹⁵ relative | `E_2/E_1 = 4 ±1e-15 rel` |
| E₃/E₁ | 9 | 1×10⁻¹⁵ relative | `E_3/E_1 = 9 ±1e-15 rel` |
| photon λ(2→1) at L=1nm | ≈ 1099 nm | 1 nm | `photon λ(2→1) ≈ 1099nm ±1nm` |
| ∫₀ᴸ ψ₁² dx | 1 | 1×10⁻⁸ | `normalization n=1 ±1e-8 (Simpson)` |
| ∫₀ᴸ ψ₂² dx | 1 | 1×10⁻⁸ | `normalization n=2 ±1e-8 (Simpson)` |
| ∫₀ᴸ ψ₁·ψ₂ dx | 0 | 1×10⁻⁸ | `orthogonality ψ₁,ψ₂ ±1e-8 (Simpson)` |
| P(0<x<L/3) n=1 | 0.195501 | 1×10⁻⁶ | `P(0<x<L/3) n=1 ±1e-6` |
| ⟨x²⟩₁ = L²(1/3−1/(2π²)) | 2.82673×10⁻¹⁹ m² | 1×10⁻³⁰ | `<x²>_1 formula ±1e-30` |
| E₁(2L)/E₁(L) | 0.25 | 1×10⁻¹⁵ relative | `E_1(2L)/E_1(L) = 0.25 ±1e-15 rel` |
| Energies strictly increasing | E₁<E₂<E₃<E₄<E₅ | — | `energies strictly increasing n=1..5` |
| n<1 throws RangeError | — | — | `n<1 → RangeError` |

### Source status

Energy formula E_n = n²π²ℏ²/(2m_e L²): *anchor derived, test planned*.
Constants h, c exact SI 2019; m_e CODATA 2018 — *cited, not fetched* (marked unverified in code).

### View description

Left panel: wavefunction ψ_n(x) and |ψ_n|² vs x (solid and filled). Right panel: energy
level diagram E₁…E₅ as horizontal bars; selected level highlighted. Slider for n (1–5) and
L (0.1–5 nm).

### Predict questions

1. Drag the L slider from 1 nm to 2 nm. By what factor does E₁ change? What does this imply about confining a particle to a smaller space?
2. Select n=1 and n=2. Is the spacing E₂−E₁ equal to E₃−E₂? What does the pattern say about level spacing at high n?
3. Switch to n=2. Where are the nodes of ψ₂? What is the probability of finding the electron in the left third of the box?

### Derive it

1. Schrödinger equation: −(ℏ²/2m)(d²ψ/dx²) = Eψ, with ψ(0)=ψ(L)=0.
2. General solution: ψ=A sin(kx), boundary → k=nπ/L. Normalization: A=√(2/L).
3. E_n = ℏ²k²/(2m) = n²π²ℏ²/(2mL²).
4. ⟨x⟩ = L/2 by parity; ⟨x²⟩ = L²/3 − L²/(2n²π²) by direct integration.

### Research papers

- Griffiths, D.J. (1995). *Introduction to Quantum Mechanics*, §2.2. Prentice Hall. (cited, not fetched)
- CODATA 2018 constants: https://physics.nist.gov/cuu/Constants/ (cited, not fetched)

### Where it breaks

- Infinite potential walls: real quantum dots have finite barriers and effective mass m* ≠ m_e.
- Single non-interacting electron: Coulomb interactions between electrons ignored.
- 1D only: 3D box has degenerate levels absent here.

---

## Bench 2 — `physics/thermodynamics/carnot`

**Level:** intro

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| T_h | hot reservoir temperature | K |
| T_c | cold reservoir temperature | K |
| η | Carnot efficiency = 1−T_c/T_h | — |
| W | net work | J |
| Q_h | heat absorbed from hot reservoir | J |
| Q_c | heat rejected to cold reservoir | J |
| COP_hp | heat pump COP = T_h/(T_h−T_c) | — |
| COP_ref | refrigerator COP = T_c/(T_h−T_c) | — |
| ΔS | entropy change per cycle | J/K |

### Parameter domain

| Parameter | Domain | Behaviour at boundary |
|---|---|---|
| T_h | (0, ∞) K | — |
| T_c | [0, T_h) K | T_c ≥ T_h → `RangeError` |

### Anchor → test table

| Anchor | Expected (from anchor script) | Tolerance | Test name |
|---|---|---|---|
| η(T_h=500K, T_c=300K) | 0.40 | 1×10⁻¹⁵ | `η(500,300) = 0.4 ±1e-15` |
| η(T_h=500K, T_c=0K) | 1.0 | 1×10⁻¹⁵ | `η(500,0) = 1 ±1e-15` |
| COP_hp(500,300) | 2.5 | 1×10⁻¹⁰ | `COP_hp(500,300) = 2.5 ±1e-10` |
| COP_ref(500,300) | 1.5 | 1×10⁻¹⁰ | `COP_ref(500,300) = 1.5 ±1e-10` |
| COP_hp − COP_ref | 1 | 1×10⁻¹⁵ | `COP_hp - COP_ref = 1 ±1e-15` |
| η × COP_hp (same T) | 1.0 | 1×10⁻¹⁵ | `η × COP_hp = 1 ±1e-15` |
| COP_hp(T_c=0) | 1.0 | 1×10⁻¹⁵ | `COP_hp(T_c=0) = 1 ±1e-15` |
| T-S rectangle area = W = Q_h·η | (T_h−T_c)·ΔS | 1×10⁻¹⁰ | `T-S shoelace area = W ±1e-10` |
| η monotone decreasing in T_c | — | — | `η(T_c=100) > η(T_c=200) > η(T_c=300)` |
| T_c ≥ T_h throws RangeError | — | — | `T_c >= T_h → RangeError` |

### Source status

η = 1−T_c/T_h: *anchor derived, test planned* (follows from entropy balance).
COP formulas exact from definition. No empirical constants.

### View description

Interactive T-S (temperature–entropy) diagram showing the rectangular Carnot cycle.
Horizontal axis: ΔS (0 to 1 J/K). Vertical axis: T (K). Shaded W rectangle, labelled
Q_h and Q_c. Sliders for T_h and T_c. Readouts: η, W/Q_h, COP_hp, COP_ref.

### Predict questions

1. Set T_h = 873 K (≈ 600°C) and find the T_c that gives exactly η = 0.33. Read T_c from the slider. What is the minimum cold-reservoir temperature a real engine could achieve at this efficiency?
2. Set T_c close to T_h (e.g., 490 K at T_h=500 K). What does COP_hp approach? Set T_c = 0. What is COP_hp now and why?
3. Keeping T_h = 500 K, increase T_c from 100 K to 200 K (+100 K), then from 200 K to 300 K (+100 K). Is the drop in η the same both times? (Yes — η is linear in T_c.)

### Derive it

1. Carnot cycle: isothermal expansion at T_h absorbs Q_h = T_h·ΔS; isothermal compression at T_c rejects Q_c = T_c·ΔS.
2. Work: W = Q_h − Q_c = (T_h − T_c)·ΔS. Efficiency: η = W/Q_h = 1 − T_c/T_h.
3. COP_hp = Q_h/W = T_h/(T_h−T_c) = 1/η; COP_ref = Q_c/W = T_c/(T_h−T_c).
4. Identity: COP_hp = COP_ref + 1 (always, from definitions).

### Research papers

- Carnot, S. (1824). *Réflexions sur la puissance motrice du feu*. Bachelier. (cited, not fetched)
- Callen, H.B. (1985). *Thermodynamics and an Introduction to Thermostatistics*, Ch. 4. (cited, not fetched)

### Where it breaks

- Assumes reversible, quasi-static processes. Real engines are irreversible.
- T must be in Kelvin. Celsius inputs will produce wrong answers.
- T-S diagram is idealised: real working fluids have non-rectangular T-S curves.

---

## Bench 3 — `math/probability/markov-chains`

**Level:** university

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| P | transition matrix (row-stochastic) | — |
| p | P(state 0 → state 1) | — |
| q | P(state 1 → state 0) | — |
| π | stationary distribution | — |
| λ₂ | second eigenvalue of P | — |
| gap | spectral gap = 1 − |λ₂| | — |
| t_rel | relaxation time = 1/gap | steps |
| t_mix(ε) | first k with TV(k) ≤ ε | steps |
| TV(k) | total variation distance after k steps | — |

**Implementation note:** 2-state P is NOT symmetric (unless p=q). Eigenvalue λ₂=1−p−q is
a closed form — do NOT use `jacobiEigen` (symmetric only). Use power iteration on Pᵀ for
the stationary distribution; verify against the closed form.

### Parameter domain

| Parameter | Domain | Behaviour at boundary |
|---|---|---|
| p | [0, 1] | p=0 → state 0 absorbing; p=q=0 → no unique π |
| q | [0, 1] | q=0 → state 1 absorbing |
| p+q | (0, 2] | p+q=0 → "no unique stationary distribution" warning |

### Anchor → test table (p=0.3, q=0.4 unless noted)

| Anchor | Expected (from anchor script) | Tolerance | Test name |
|---|---|---|---|
| π₀ = q/(p+q) | 4/7 ≈ 0.571429 | 1×10⁻¹⁰ | `π₀ = q/(p+q) ±1e-10` |
| π₁ = p/(p+q) | 3/7 ≈ 0.428571 | 1×10⁻¹⁰ | `π₁ = p/(p+q) ±1e-10` |
| λ₂ = 1−p−q (closed form) | 0.3 | 1×10⁻¹⁵ | `λ₂ = 1-p-q ±1e-15` |
| spectral gap = p+q | 0.7 | 1×10⁻¹⁵ | `gap = p+q ±1e-15` |
| π·P = π (stationarity) | residual 0 | 1×10⁻¹⁴ | `π P = π residual ±1e-14` |
| detailed balance π₀·p = π₁·q | equal | 1×10⁻¹² | `detailed balance ±1e-12` |
| Exact TV(k) = |λ₂|^k·max(π₀,π₁) | TV(4) ≈ 0.00777 ≤ 0.01 | 1×10⁻¹⁰ | `TV(4) ≤ 0.01 → t_mix = 4` |
| TV(3) > 0.01 | TV(3) ≈ 0.02590 > 0.01 | — | `TV(3) > 0.01 (t_mix not 3)` |
| Power iteration converges to π | |π_iter − π|₁ | 1×10⁻¹⁰ | `powerIteration convergence ±1e-10` |
| p=q=0.6 (p+q>1): λ₂ = −0.2 | −0.2 | 1×10⁻¹⁵ | `λ₂ < 0 when p+q > 1 ±1e-15` |
| 3-state preset π·P = π | residual 0 | 1×10⁻¹⁰ | `3-state stationarity ±1e-10` |
| 3-state second eigenvalue | 0.5 | 1×10⁻¹⁰ | `3-state λ₂ = 0.5 ±1e-10` |

**TV distance formula:** TV(k) = |λ₂|^k · max(π₀, π₁) — this is the *exact* formula for
2-state chains, not the LPW upper bound. The LPW bound ≈ 7.789 is a stated bound only.

**3-state preset:** P = [[0.5,0.5,0],[0.25,0.5,0.25],[0,0.5,0.5]], π = (¼,½,¼),
eigenvalues {1, 0.5, 0}.

**Boundary cases to define:** p=q=0 → show "no unique stationary distribution" (not an error);
p=q=1 → λ₂=−1 (periodic chain), defined and valid.

### Source status

Stationarity and spectral gap: *anchor derived, test planned*.
Mixing theory (Levin, Peres, Wilmer 2009): *cited, not fetched*.

### View description

Transition diagram with animated probability flow. Line plot of π^(t) → π vs t. Readouts:
λ₂, gap, t_rel, exact t_mix(ε). Sliders for p, q. Toggle between 2-state and 3-state preset.

### Predict questions

1. Set p=q=0.5. What is λ₂? What does λ₂=0 mean for how fast the chain mixes?
2. Set p=0.6, q=0.6 (p+q=1.2). What sign is λ₂? Does the chain still mix? Watch the convergence plot.
3. Use the 3-state preset. The second eigenvalue is 0.5. After 10 steps, how close is the distribution to π? (TV ≈ 0.5^10 · max(π) ≈ 0.00024.)

### Derive it

1. Stationarity: πP = π → π₀(1−p)+π₁q = π₀ → π₀ = q/(p+q).
2. Eigenvalues of P: char. poly. gives λ₁=1 (always) and λ₂=1−p−q (closed form).
3. Mixing: TV(k) = |λ₂|^k · max(π₀,π₁); t_mix(ε) = smallest k with TV(k) ≤ ε.

### Research papers

- Levin, D.A., Peres, Y. & Wilmer, E.L. (2009). *Markov Chains and Mixing Times*. AMS. (cited, not fetched)
- Markov, A.A. (1906). Extension of the law of large numbers to dependent events. (cited, not fetched)

### Where it breaks

- Non-symmetric P: jacobiEigen requires symmetric input; use closed form or power iteration.
- Periodic chains (λ₂=−1): absolute value |λ₂| determines mixing, not λ₂.
- For n > 2 states: λ₂ must be found numerically (no simple closed form).

---

## Bench 4 — `psychology/decision-making/drift-diffusion`

**Level:** university

**Infrastructure first:** add `decision-making` field to `psychology` in `js/catalog.js`.

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| μ | drift rate | units/s |
| σ | noise amplitude | units/√s |
| a | absorbing boundary (half-range) | units |
| t₀ | non-decision time | s |
| P+ | P(upper boundary hit) | — |
| E[T] | mean first-passage time (excluding t₀) | s |
| RT | mean response time = E[T]+t₀ | s |

### Parameter domain

| Parameter | Domain | Behaviour at boundary |
|---|---|---|
| σ | (0, ∞) | σ ≤ 0 → `RangeError` |
| a | (0, ∞) | a ≤ 0 → `RangeError` |
| μ | (−∞, ∞) | μ=0 exact formula used |
| t₀ | [0, ∞) | — |

### Anchor → test table (μ=1, a=1, σ=1, t₀=0.3 unless noted)

| Anchor | Expected (from anchor script) | Tolerance | Test name |
|---|---|---|---|
| P+ (μ=1,a=1,σ=1) | 1/(1+e⁻²) ≈ 0.880797 | 1×10⁻⁶ | `P_upper(1,1,1) ±1e-6` |
| E[T]+t₀ | (a/μ)tanh(μa/σ²)+t₀ ≈ 1.06159 s | 1×10⁻⁶ | `RT_mean ±1e-6` |
| P+ (μ=0) | 0.5 | 1×10⁻¹⁵ | `P_upper(μ=0) = 0.5 ±1e-15` |
| E[T] (μ=0) | a²/σ² = 1 (at a=σ=1) | 1×10⁻¹⁰ | `E[T](μ=0) = a²/σ² ±1e-10` |
| Continuity: lim_{μ→0} E[T] | → a²/σ² | 1×10⁻⁴ | `E[T](μ=1e-8) ≈ a²/σ² ±1e-4` |
| σ ≤ 0 → RangeError | — | — | `σ<=0 → RangeError` |
| Simulation P+ vs formula (N=5000, seed=42) | within 3σ̂ ≈ 0.0138 | 3√(P+(1−P+)/5000) | `simulation P+ within 3σ̂` |
| dt-halving convergence | |P+_dt − P+_dt/2| < |P+_dt/2 − P+_dt/4| | — | `dt-halving: P+ converges monotone` |
| RT_mean > t₀ | always | — | `RT_mean > t₀` |

**μ=0 continuity:** E[T] = (a/μ)tanh(μa/σ²) → a²/σ² as μ→0 (L'Hôpital). Use this limit
directly in code when |μ| < ε to avoid 0/0.

**BGK note:** Broadie-Glasserman-Kou boundary correction ≈ 0.5826σ√dt. The dt-halving test
(not the BGK constant) is the primary check. Report the estimated bias in a readout.

### Source status

P+ and E[T] from backward Kolmogorov equation: *anchor derived, test planned*.
BGK correction — *cited, not fetched* (Broadie, Glasserman & Kou 1997).

### View description

Left: RT distribution histogram for upper/lower boundary responses. Right: drift path
animation of a single simulated SDE trajectory with boundary lines. Sliders: μ, a, σ, t₀.
Readout: P+, E[T], RT, dt-bias estimate.

### Predict questions

1. Increase a from 1 to 2 with μ=1, σ=1. Does P+ change? Does mean RT change? What does this say about the speed-accuracy trade-off?
2. Set μ=0. What is P+ and mean RT? Now slowly increase μ to 2. How do P+ and RT change together?
3. Double σ from 1 to 2, keeping μ and a fixed. What happens to P+? Why does more noise hurt accuracy?

### Derive it

1. Ẋ = μ + σṄ (Wiener process with drift). Absorbing boundaries at ±a.
2. Backward Kolmogorov for P+(x): (σ²/2)P+'' + μP+' = 0. General solution P+(x) = A + B·e^{−2μx/σ²}; BC gives P+(0) = 1/(1+e^{−2μa/σ²}).
3. For E[T]: (σ²/2)T'' + μT' = −1. Solution T(0) = (a/μ)tanh(μa/σ²).
4. μ=0 limit: (a/μ)tanh(μa/σ²) → a²/σ² via L'Hôpital.

### Research papers

- Ratcliff, R. (1978). A theory of memory retrieval. *Psychological Review*, 85(2), 59–108. https://doi.org/10.1037/0033-295X.85.2.59
- Bogacz, R., Brown, E., Moehlis, J., Holmes, P. & Cohen, J.D. (2006). The physics of optimal decision making. *Psychological Review*, 113(4), 700–765. https://doi.org/10.1037/0033-295X.113.4.700
- Broadie, M., Glasserman, P. & Kou, S.G. (1997). A continuity correction for discrete barrier options. *Mathematical Finance*, 7(4), 325–349. (BGK; cited, not fetched)

### Where it breaks

- Equal-variance, constant-drift assumption. Real RT distributions have heavier tails.
- Drift varies trial-to-trial in empirical data (variability model not included).
- Collapsing boundaries improve fit but have no closed-form solution included here.

---

## Bench 5 — `math/dynamics/phase-plane`

**Level:** university

**Infrastructure first:** add `LinAlg.eigen2x2(A)` to `js/core/LinAlg.js`. Returns
`{ lambda: [λ₁,λ₂], real: [re₁,re₂], imag: [im₁,im₂], repeated: bool, defective: bool }`.
Uses τ=tr(A), Δ=det(A), disc=τ²−4Δ. Real eigenvalues when disc≥0; complex when disc<0.
Defective flag: repeated eigenvalue AND A ≠ λI (i.e., at least one off-diagonal non-zero).

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| A | 2×2 system matrix | — |
| τ | trace = a+d | — |
| Δ | determinant = ad−bc | — |
| disc | τ²−4Δ | — |
| λ₁, λ₂ | eigenvalues | 1/time |
| μ | nonlinear gain parameter | 1/(unit²·time) |

### Classification table

| Condition | Type |
|---|---|
| Δ < 0 | Saddle |
| τ = 0, Δ > 0 | Center |
| disc < 0, τ < 0 | Stable spiral |
| disc < 0, τ > 0 | Unstable spiral |
| disc > 0, τ < 0, Δ > 0 | Stable node |
| disc > 0, τ > 0, Δ > 0 | Unstable node |
| disc = 0 (τ²=4Δ) | Star node (if A=λI) or Improper node (defective) |
| Δ = 0, τ ≠ 0 | Degenerate (zero eigenvalue) |
| τ = Δ = 0 | Fully degenerate (nilpotent) |

### Anchor → test table

| Anchor | Expected (from anchor script) | Tolerance | Test name |
|---|---|---|---|
| A=[[-1,0],[0,-2]]: τ=−3, Δ=2, λ=−1,−2 → stable node | τ=−3 | 1×10⁻¹⁵ | `stable node τ=-3 ±1e-15` |
| A=[[0,-1],[1,0]]: τ=0, Δ=1, λ=±i → center | Δ=1 | 1×10⁻¹⁵ | `center Δ=1 ±1e-15` |
| A=[[-1,-1],[1,-1]]: disc=−4 → stable spiral | disc=−4 | 1×10⁻¹⁵ | `stable spiral disc=-4 ±1e-15` |
| A=[[1,0],[0,-1]]: Δ=−1 → saddle | Δ=−1 | 1×10⁻¹⁵ | `saddle Δ=-1 ±1e-15` |
| A=[[1,0],[0,2]]: τ=3, Δ=2 → unstable node | τ=3 | 1×10⁻¹⁵ | `unstable node τ=3 ±1e-15` |
| A=[[2,0],[0,2]]: disc=0, A=λI → star | repeated=true, defective=false | — | `star: repeated non-defective` |
| RK4 orbit |x(2π)| for A=[[-1,-1],[1,-1]] | e^{-2π} ≈ 0.00186744 | 1×10⁻⁶ | `spiral |x(2π)| = e^{-2π} ±1e-6` |
| RK4 orbit |x(2π)| for A=[[0,-1],[1,0]] | 1.0 | 1×10⁻⁵ | `center |x(2π)| = 1 ±1e-5` |
| Nonlinear r(1): r₀/√(1−2μr₀²t), μ=−1, r₀=1 | 1/√3 ≈ 0.577350 | 1×10⁻⁶ | `nonlinear r(1) = 1/√3 ±1e-6` |
| Τ=Δ=0 classification | "fully degenerate" | — | `τ=Δ=0 → fully degenerate` |

**RK4 checks use 10 000 steps over [0, 2π] with Integrators.rk4.**

### Source status

Classification from τ-Δ diagram: *anchor derived, test planned* (Strogatz §5.2).
Nonlinear r(t) exact: *anchor derived, test planned*. `eigen2x2` closed form: exact.

### View description

Left: τ-Δ plane (trace–determinant diagram) with parabola τ²=4Δ and stability region labels.
Draggable point for current A. Right: phase portrait (quiver field + RK4 trajectories from
multiple ICs). Nonlinear toggle activates ẋ = Ax + μ·r²·x presets.

### Predict questions

1. Move the operating point into the saddle region (Δ<0). Do trajectories spiral in or diverge? Start from several initial conditions — do they all go the same direction?
2. Move to τ=0, Δ>0 (center). Does the orbit close exactly? Now nudge τ slightly negative — what happens to the spiral?
3. Activate the nonlinear preset with μ=−0.5 (stable). Does the orbit spiral in or converge to a limit cycle? Change μ to +0.5 — what happens?

### Derive it

1. ẋ = Ax; ansatz x = e^{λt}v → characteristic equation λ²−τλ+Δ = 0.
2. Roots: λ = (τ ± √(τ²−4Δ))/2. Sign of Re(λ) = τ/2 determines stability.
3. disc > 0: two real eigenvalues (node or saddle); disc < 0: complex conjugate pair (spiral or center).
4. Nonlinear radial: ṙ = μr³ → dr/r³ = μ dt → r(t) = r₀/√(1−2μr₀²t).

### Research papers

- Strogatz, S.H. (1994). *Nonlinear Dynamics and Chaos*, §5.2. Addison-Wesley. (cited, not fetched)
- Hartman, P. (1960). A lemma in the theory of structural stability. *Proceedings AMS*, 11(4), 610–620. (cited, not fetched)

### Where it breaks

- Centers (τ=0) are structurally unstable: any nonlinear term can make them spiral.
- Hartman-Grobman does not apply to non-hyperbolic fixed points (τ=0 or Δ=0).
- This bench shows only 2D linear systems; 3D systems can have chaotic behaviour.

---

## Bench 6 — `biology/ecology/competitive-exclusion`

**Level:** university

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| N₁, N₂ | populations | individuals |
| r₁, r₂ | intrinsic growth rates | 1/time |
| K₁, K₂ | carrying capacities | individuals |
| α₁₂ | effect of sp2 on sp1 (per capita) | — |
| α₂₁ | effect of sp1 on sp2 (per capita) | — |
| N₁*, N₂* | interior equilibrium | individuals |

### Parameter domain

| Parameter | Domain | Notes |
|---|---|---|
| K₁, K₂ | (0, ∞) | — |
| α₁₂, α₂₁ | [0, ∞) | 0 = no competition |
| r₁, r₂ | (0, ∞) | — |

### Anchor → test table

| Anchor | Expected (from anchor script) | Tolerance | Test name |
|---|---|---|---|
| N₁* (K=100, α₁₂=α₂₁=0.5) | 200/3 ≈ 66.667 | 1×10⁻¹⁰ | `coexistence N₁* = 200/3 ±1e-10` |
| N₂* (same) | 200/3 ≈ 66.667 | 1×10⁻¹⁰ | `coexistence N₂* = 200/3 ±1e-10` |
| Counterexample N₂* (α₁₂=0.5, α₂₁=1.5) | −200 (negative → sp1 wins) | 1×10⁻¹⁰ | `counterexample N₂* < 0 ±1e-10` |
| Jacobian eigenvalues at coexistence | −1 and −1/3 | 1×10⁻¹⁰ | `Jacobian λ = -1 and -1/3 ±1e-10` |
| sp2-wins: α₁₂=1.5, α₂₁=0.5 → N₁*<0 | N₁* = −200 | 1×10⁻¹⁰ | `sp2 wins: N₁* = -200 ±1e-10` |
| α₁₂=α₂₁=1 (parallel nullclines) from IC=(10,20) | N₁→100/3, N₂→200/3 | 1% | `α=1 parallel nullclines ±1%` |
| RK4 trajectory at t=100 ≈ coexistence equil. | within 1% of N* | 0.01·N* | `RK4 convergence to coexist ±1%` |
| Coexistence iff N*>0 AND 1−α₁₂α₂₁>0 | combined condition | — | `coexistence condition check` |

**Counterexample:** K₁=K₂=100, α₁₂=0.5, α₂₁=1.5: product α₁₂α₂₁=0.75<1 so the product
criterion alone says "coexistence possible", but N₂*=(K₂−α₂₁K₁)/(1−α₁₂α₂₁)=(100−150)/0.25=−200<0.
Species 1 wins. Both conditions (N*>0 AND product<1) are required.

**α=1 parallel nullclines:** when α₁₂=α₂₁=1 and K₁=K₂=K, nullclines are identical; the
system conserves N₁/(N₁+N₂) along trajectories (r₁=r₂ assumed). IC=(10,20): ratio 1:2,
so steady state is (K/3, 2K/3) = (33.33, 66.67).

**Outcomes to implement:** coexistence, sp1-wins, sp2-wins, bistable (α₁₂α₂₁>1, both N*>0).

### Source status

Lotka-Volterra equations: *anchor derived, test planned*.
Gause (1934), Hardin (1960): *cited, not fetched*.

### View description

Phase portrait (N₁ vs N₂): nullclines, equilibria (open/closed circles), RK4 trajectories
from multiple ICs. Outcome banner. Sliders for α₁₂, α₂₁, K₁, K₂, r₁, r₂.

### Predict questions

1. Set α₁₂=α₂₁=0.5 and K₁=K₂=100. Both species coexist. Now increase α₂₁ to 1.5. What happens to species 2? Where is the new equilibrium?
2. Set α₁₂=α₂₁=1. Where do the nullclines intersect? Start from (10,20) and (20,10) — do both trajectories end at the same place?
3. Set α₁₂=1.5, α₂₁=1.5 (both > 1, K equal). Start near (90,10) and near (10,90). Do both ICs give the same outcome?

### Derive it

1. dN₁/dt = r₁N₁(1−N₁/K₁−α₁₂N₂/K₁). Nullcline: N₁ = K₁−α₁₂N₂.
2. Similarly for N₂. Intersection: N₁* = (K₁−α₁₂K₂)/(1−α₁₂α₂₁); N₂* = (K₂−α₂₁K₁)/(1−α₁₂α₂₁).
3. Coexistence requires N₁*>0 AND N₂*>0. Both require K₁>α₁₂K₂ AND K₂>α₂₁K₁ (mutual invasibility).
4. Jacobian at coexistence: τ = −r₁N₁*/K₁ − r₂N₂*/K₂ < 0; Δ = (r₁r₂N₁*N₂*/K₁K₂)(1−α₁₂α₂₁) > 0 iff product < 1.

### Research papers

- Gause, G.F. (1934). *The Struggle for Existence*. Williams & Wilkins. (cited, not fetched)
- Hardin, G. (1960). The competitive exclusion principle. *Science*, 131(3409), 1292–1297. https://doi.org/10.1126/science.131.3409.1292

### Where it breaks

- Real competition is indirect (shared resources), not the direct Lotka-Volterra coupling.
- Ignores spatial structure, demographic stochasticity, environmental fluctuations.
- For n > 2 species the exclusion/coexistence conditions are far more complex.

---

## Bench 7 — `biology/pharmacology/pharmacokinetics`

**Level:** university

**Infrastructure first:** add `pharmacology` field to `biology` in `js/catalog.js`.

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| C(t) | plasma concentration | mg/L |
| C₀ | initial IV concentration = D/V_d | mg/L |
| k_e | elimination rate | 1/h |
| t_{½} | half-life = ln2/k_e | h |
| AUC | ∫₀^∞ C dt (IV: C₀/k_e; oral: FD/(V_d k_e)) | mg·h/L |
| V_d | volume of distribution | L |
| k_a | absorption rate (oral) | 1/h |
| F | bioavailability | — |
| D | dose | mg |
| t_max | time to peak concentration | h |
| C_max | peak concentration | mg/L |
| τ | dosing interval | h |
| R | accumulation ratio = 1/(1−e^{−k_e τ}) | — |

### Parameter domain

| Parameter | Domain | Behaviour at boundary |
|---|---|---|
| k_e | (0, ∞) | k_e ≤ 0 → `RangeError` |
| k_a | (0, ∞) | k_a ≤ 0 → `RangeError`; k_a = k_e → use limit |
| V_d | (0, ∞) | — |

### Anchor → test table (k_e=0.1, C₀=100, V_d=10, k_a=1, F=1, D=100 unless noted)

| Anchor | Expected (from anchor script) | Tolerance | Test name |
|---|---|---|---|
| IV C(5h) | 100·e^{-0.5} ≈ 60.653 mg/L | 1×10⁻⁸ | `IV C(5h) ≈ 60.653 ±1e-8` |
| t_{½} = ln2/k_e | 6.9315 h | 1×10⁻¹⁰ | `t_half = ln2/ke ±1e-10` |
| AUC_IV = C₀/k_e | 1000 mg·h/L | 1×10⁻⁶ | `AUC_IV = C0/ke ±1e-6` |
| C₀ = D/V_d | 10 mg/L (D=100, V_d=10) | 1×10⁻¹⁵ | `C0 = D/Vd ±1e-15` |
| t_max (oral) = ln(k_a/k_e)/(k_a−k_e) | ≈ 2.5584 h | 1×10⁻¹⁰ | `t_max ±1e-10` |
| dC/dt at t_max | ≈ 0 | 1×10⁻⁷ | `dC/dt ≈ 0 at t_max ±1e-7` |
| AUC_oral = FD/(V_d k_e) | 100 mg·h/L | 1×10⁻⁶ | `AUC_oral = FD/(Vd ke) ±1e-6` |
| AUC_oral/AUC_IV = F | 0.1 (F=1, AUC_oral=100, AUC_IV=1000) | 1×10⁻¹⁰ | `AUC ratio = F ±1e-10` |
| k_a = k_e limit: C → FDk_e·t·e^{-k_e t}/V_d | continuous at k_a=k_e | 1×10⁻⁶ | `ka=ke limit continuous ±1e-6` |
| Flip-flop: k_e·C(t;k_a,k_e) = k_a·C(t;k_e,k_a) | residual ≈ 0 | 1×10⁻¹⁰ | `flip-flop symmetry ±1e-10` |
| Accumulation ratio R (t_{½}=24h, τ=12h) | 1/(1−e^{-ln2/2}) = 2+√2 ≈ 3.4142 | 1×10⁻⁶ | `accumulation ratio = 2+√2 ±1e-6` |
| IV C(t) strictly decreasing | for t=0..5 half-lives | — | `IV C strictly decreasing` |

**k_a = k_e limit:** use L'Hôpital: as k_a→k_e, C → (F·D·k_e·t·e^{-k_e t})/V_d.
Implement with expm1 form to avoid catastrophic cancellation: when |k_a−k_e| < ε, use
the limit formula directly.

**Flip-flop:** k_e·C(t; k_a, k_e) = k_a·C(t; k_e, k_a) — this is an algebraic identity
of the Bateman function. Provides an independent test of both orderings.

**Bateman attribution:** the two-exponential oral PK formula is widely attributed to
Bateman (1910), but the original paper has not been fetched for this bench. Mark as
*cited, not fetched* in code and SOURCES.md.

### Source status

IV formula exact: *anchor derived, test planned*. Bateman oral formula: *cited, not fetched*.
Accumulation ratio R: *anchor derived, test planned*.

### View description

Semi-log plot of C(t) vs t for IV bolus and oral Bateman (both overlaid). Readouts:
t_{½}, AUC, t_max, C_max, R (multi-dose). Sliders: k_e, k_a, D, F. Toggle: IV / oral /
multi-dose (steady-state trough/peak).

### Predict questions

1. Set k_e=0.1 (t_{½}=6.9h) and τ=12h in multi-dose mode. Read the accumulation ratio R. Now set t_{½}=24h with τ=12h. What is R now? (Answer readable from the readout: R=2+√2.)
2. In oral mode, set k_a very close to k_e (e.g., k_a=0.101, k_e=0.1). Does C_max change smoothly, or does the model blow up?
3. Set k_a=1, k_e=0.1. Now swap them: k_a=0.1, k_e=1. Does the area under the curve (AUC) change? Does C_max change? (AUC unchanged; C_max and t_max change.)

### Derive it

1. IV: dC/dt = −k_e C → C(t) = C₀·e^{-k_e t}; AUC = C₀/k_e; t_{½} = ln2/k_e.
2. Oral (1-compartment): dA/dt = −k_a A (gut); dC/dt = k_a A(t)/V_d − k_e C. Solve: C(t) = (k_a FD)/(V_d(k_a−k_e))·(e^{-k_e t}−e^{-k_a t}).
3. t_max: set dC/dt=0 → k_a e^{-k_a t} = k_e e^{-k_e t} → t_max = ln(k_a/k_e)/(k_a−k_e).
4. Multi-dose at steady state: C_trough = C₀·e^{-k_e τ}/(1−e^{-k_e τ}); R = C_peak/C₀_singledose = 1/(1−e^{-k_e τ}).

### Research papers

- Rowland, M. & Tozer, T.N. (1995). *Clinical Pharmacokinetics*, 3rd ed. Williams & Wilkins. (cited, not fetched)
- Bateman, H. (1910). The solution of a system of differential equations occurring in the theory of radioactive transformations. *Proceedings of the Cambridge Philosophical Society*, 15, 423–427. (attribution unverified — cited, not fetched)

### Where it breaks

- 1-compartment assumes instantaneous mixing. Real drugs distribute into multiple compartments.
- Non-linear (Michaelis-Menten) elimination at high doses: C(t) is not monoexponential.
- Protein binding, active transport, enterohepatic circulation not modelled.

---

## Test count estimate

| Bench | Expected tests |
|---|---|
| particle-in-box | ~12 |
| carnot | ~10 |
| markov-chains | ~12 |
| drift-diffusion | ~9 |
| phase-plane | ~10 |
| competitive-exclusion | ~8 |
| pharmacokinetics | ~11 |
| **Total** | **~72 new tests** |

Projected total after Phase 8: 614 + 72 ≈ **686 tests**.
