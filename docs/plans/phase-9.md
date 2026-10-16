# Phase 9 plan

**Date drafted:** 2026-10-16
**Carries forward:** 756 tests pass (phases 1–8).
**Tag at start:** `phase-8`

---

## Pre-plan anchor computations (R1)

All numerical anchors computed in `tools/anchors-phase9.mjs` (no model code).
Run `node tools/anchors-phase9.mjs` to reproduce all values below.

---

## Implementation order

1. `js/core/Complex.js`                               — infra only, no bench
2. `physics/statistical-mechanics/entropy-mixing`     — intro, closed-form
3. `math/stochastic/random-walk`                      — intro, closed-form + simulation
4. `neuroscience/compartmental/cable-equation`        — university, closed-form SS
5. `economics/macroeconomics/solow`                   — university, ODE + closed-form SS
6. `neuroscience/plasticity/stdp`                     — university, kernel + simulation
7. `psychology/social/opinion-dynamics`               — university, discrete update
8. `biology/demography/age-structure`                 — university, matrix + power iter

One commit per bench (or per infra step). `npm test` before every commit. No push.

---

## New catalog fields

| Subject | Field id | Label | Benches |
|---|---|---|---|
| Physics | `statistical-mechanics` | Statistical mechanics | entropy-mixing |
| Neuroscience | `plasticity` | Synaptic plasticity | stdp |
| Neuroscience | `compartmental` | Compartmental models | cable-equation |
| Math | `stochastic` | Stochastic processes | random-walk |
| Economics | `macroeconomics` | Macroeconomics | solow |
| Psychology | `social` | Social dynamics | opinion-dynamics |
| Biology | `demography` | Demography | age-structure |

---

## Key reuse

| Module | Used by |
|---|---|
| `js/core/Integrators.js` (RK4) | solow (ODE to steady state) |
| `js/core/LinAlg.js` (eigen2x2) | age-structure (2-age case only) |
| `js/core/Random.js` (seeded RNG) | random-walk simulation |
| `js/core/Complex.js` (new) | lc-oscillator (phase 10); built now for early testing |

---

## Infra — `js/core/Complex.js`

**No bench page. Pure math module only.**

### Purpose

Provide a reusable `Complex` class for phase 10 (lc-oscillator) and any future
bench requiring complex arithmetic. Must be a plain ES module with no external
dependencies.

### Class interface

```
class Complex {
  constructor(re, im)       // re, im: Number
  add(z)                    // returns new Complex
  sub(z)                    // returns new Complex
  mul(z)                    // returns new Complex
  div(z)                    // returns new Complex; throws if |z|=0
  conj()                    // conjugate
  abs()                     // |z| = sqrt(re²+im²)
  arg()                     // atan2(im, re)
  static fromPolar(r, θ)    // r·e^(iθ)
  static exp(z)             // e^z = e^re · (cos(im) + i·sin(im))
  toString()                // "a+bi" or "a−bi"
}
```

### Key tests with tolerance derivation

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| `\|e^(iπ) − (−1)\|` | 0 | 1×10⁻¹⁵ | `cos(π)=−1, sin(π)≈1.22e-16`; algebraic error bound from IEEE 754 double |
| `\|3+4i\|` | 5 | 0 (exact) | Pythagorean triple: sqrt(9+16)=sqrt(25)=5 exactly in IEEE 754 |
| `(1+i)²` | 2i | 0 (exact) | `(1+i)²=1+2i−1=2i`; integer arithmetic → exact in double |
| `(1+2i)/(3+4i)` | 11/25 + (2/25)i | 1×10⁻¹⁵ | Division via conjugate: `(1+2i)(3−4i)/(9+16)=(11+2i)/25`; rounding of 1/25 carries 1 ULP |
| `arg(−1+0i)` | π | 1×10⁻¹⁵ | `atan2(0,−1)=π` by spec; standard library guarantee |
| `arg(0+1i)` | π/2 | 1×10⁻¹⁵ | `atan2(1,0)=π/2` by spec |
| `div(z, 0+0i) → throws` | RangeError | — | Defensive guard: |z|²=0 |

### Known traps

- `arg` must use `Math.atan2(im, re)` (not `Math.atan`). `atan` loses quadrant information.
- Division: z/w = z·conj(w) / |w|². Do NOT divide re and im separately.
- `exp(z)`: imaginary part feeds `cos`/`sin`; real part is the scale factor `e^re`.

### Status words

All formulas: *algebraic*.

---

## Bench 1 — `physics/statistical-mechanics/entropy-mixing`

**Path:** `benches/physics/statistical-mechanics/entropy-mixing/`
**Level:** intro

### Critical trap — read before coding

ΔS = −nR Σᵢ xᵢ ln xᵢ (ideal mixing entropy). This is NOT the volume-expansion
formula ΔS = nR ln(V₂/V₁). These are different processes.

Pure component limit: x=1 → ΔS=0 EXACTLY. The term x·ln(x) → 0 as x→0 by
L'Hôpital (lim_{x→0⁺} x·ln x = 0). Code MUST guard: if xᵢ=0, the term
contributes 0, not NaN. Test xᵢ=0 explicitly.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| n | amount of substance | mol | — |
| R | universal gas constant | J/(mol·K) | CODATA 2018 exact: 8.314462618 J/(mol·K) |
| xᵢ | mole fraction of component i | — | xᵢ = nᵢ / Σnⱼ |
| ΔS_mix | molar entropy of mixing | J/(mol·K) | −R Σᵢ xᵢ ln xᵢ |
| ΔG_mix | molar Gibbs free energy of mixing | J/mol | RT Σᵢ xᵢ ln xᵢ = −TΔS_mix |
| S_excess | excess entropy | J/(mol·K) | ΔS_mix − ΔS_mix,ideal (zero for ideal) |

### Model class

`EntropyMixing` in `entropy-mixing.js`:
- `constructor(components)` — array of `{name, x}` with Σxᵢ validation
- `deltaS()` — returns ΔS_mix in J/(mol·K)
- `deltaG(T)` — returns ΔG_mix at temperature T
- `maxMixingComposition()` — returns xᵢ=1/N for N components (analytical maximum)

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| R | 8.314462618 J/(mol·K) | 0 (exact constant) | CODATA 2018 defined value |
| binary equimolar ΔS | R·ln 2 = 5.76310 J/(mol·K) | 1×10⁻¹² | Algebraic: −R(0.5·ln0.5 + 0.5·ln0.5) = R·ln2; IEEE 754 rounding of ln(2) |
| ternary equimolar ΔS | R·ln 3 = 9.13440 J/(mol·K) | 1×10⁻¹² | Algebraic: −R·3·(1/3)·ln(1/3) = R·ln3 |
| pure component (x=1) | 0 | 0 (exact) | x·ln(x)→0; term omitted when x=0 |
| zero-fraction component | 0 (no NaN) | — | Guard: xᵢ=0 contributes 0, not NaN |
| maximum at equimolar | ΔS(1/N) ≥ ΔS(any other) | — | Concavity of −Σxᵢlnxᵢ; tested via comparison |
| N=1 → ΔS=0 | 0 | 0 | Pure substance: x=1, ln(1)=0 |

### Status words

ΔS formula: *algebraic*.
R = 8.314462618: *cited, not fetched* (CODATA 2018 exact SI definition).

### Predict questions

1. Start with two equal-fraction components. Add a third equal fraction. Does ΔS increase or decrease, and by how much does it change relative to the binary case?
2. Set one component to x=0.99 and a trace component to x=0.01. Is the mixing entropy closer to pure or to equimolar? What does this say about trace impurities?
3. For an ideal binary mixture at fixed T=298 K, plot ΔG_mix vs x. Where is the minimum? Why does spontaneous mixing occur?

### Derive it

1. Statistical definition: S = −k_B Σᵢ pᵢ ln pᵢ. For N_i molecules of species i in a total N, the probability of finding a molecule of type i is xᵢ = Nᵢ/N.
2. Multiplying by N·k_B = n·R, molar entropy of mixing: ΔS_mix = −R Σᵢ xᵢ ln xᵢ ≥ 0 for all xᵢ ∈ (0,1].
3. At x→0: lim_{x→0⁺} x·ln(x) = lim x/(1/ln x) → 0 by L'Hôpital. The sum is well-defined and ΔS→0.
4. Maximum: dΔS/dxᵢ = 0 → xᵢ = 1/N for all i. Maximum = R·ln N.

### Research papers

- Atkins, P., de Paula, J. (2014). *Physical Chemistry*, 10th ed., §5A. Oxford. (cited, not fetched)
- Ben-Naim, A. (2008). *A Farewell to Entropy*. World Scientific. DOI: 10.1142/6469 (cited, not fetched)

### Where it breaks

- Ideal mixing only: no enthalpy of mixing (ΔH=0 assumed). Real solutions have activity coefficients.
- Assumes distinguishable species: quantum indistinguishability modifies this for identical particles.
- No pressure or volume effects: molar volumes assumed equal.
- Temperature-independent: entropy of mixing here has no T-dependence (unlike real solutions).

---

## Bench 2 — `neuroscience/plasticity/stdp`

**Path:** `benches/neuroscience/plasticity/stdp/`
**Level:** university

### Critical trap — read before coding

STDP net sign depends on A₊·τ₊ vs A₋·τ₋. Song et al. (2000) parameters:
A₊=0.01, A₋=0.0105, τ₊=τ₋=20 ms. Net area = A₊τ₊ − A₋τ₋ = 0.2 − 0.21 = −0.01 ms.
This is LTD-dominant. A COMMON MISTAKE is assuming net is positive (LTP dominant).
The asymmetry A₋ > A₊ is intentional in the Song et al. model to produce bounded weights.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| Δt | spike timing difference (pre − post) | ms | — |
| A₊ | LTP amplitude | — | Song et al. (2000) |
| A₋ | LTD amplitude | — | Song et al. (2000) |
| τ₊ | LTP time constant | ms | Song et al. (2000) |
| τ₋ | LTD time constant | ms | Song et al. (2000) |
| Δw(Δt) | synaptic weight change | — | A₊e^(−Δt/τ₊) if Δt>0; −A₋e^(Δt/τ₋) if Δt<0 |
| W_net | integral of STDP kernel | ms | A₊τ₊ − A₋τ₋ |
| ρ | pairing rate | Hz | — |

### Model class

`STDP` in `stdp.js`:
- `constructor({A_plus, A_minus, tau_plus, tau_minus})`
- `kernel(dt_ms)` — returns Δw for scalar Δt in ms
- `netArea()` — returns A₊τ₊ − A₋τ₋ (ms)
- `simulate(spike_times_pre, spike_times_post)` — returns cumulative Δw

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| `kernel(+10)` | A₊·e^(−10/τ₊) = 0.01·e^(−0.5) = 0.006065 | 1×10⁻¹⁵ | Algebraic: e^(−0.5)≈0.60653; IEEE 754 double precision for exp |
| `kernel(−10)` | −A₋·e^(−10/τ₋) = −0.0105·e^(−0.5) = −0.006369 | 1×10⁻¹⁵ | Algebraic: same; note sign is negative (LTD) |
| `kernel(0)` | pre−post=0 undefined; return 0 by convention | — | Boundary: simultaneous spikes → no plasticity |
| LTP area integral | A₊·τ₊ = 0.01·20 = 0.2 ms | 1×10⁻¹⁵ | Analytic: ∫₀^∞ A₊e^(−t/τ₊) dt = A₊τ₊ |
| LTD area integral | A₋·τ₋ = 0.0105·20 = 0.21 ms | 1×10⁻¹⁵ | Analytic: ∫₀^∞ A₋e^(−t/τ₋) dt = A₋τ₋ |
| Net area | −0.01 ms (LTD dominant) | 1×10⁻¹⁵ | Algebraic: 0.2 − 0.21 = −0.01 |
| `kernel(Δt)>0` for Δt>0 | LTP region positive | — | Sign convention check |
| `kernel(Δt)<0` for Δt<0 | LTD region negative | — | Sign convention check |

### Status words

Kernel formula: *algebraic*.
Song et al. parameters (A₊=0.01, A₋=0.0105, τ=20ms): *cited, not fetched*.

### Predict questions

1. Increase A₋ so that A₋·τ₋ > A₊·τ₊ further. What happens to the net area, and what does this mean for a neuron that fires at random with Poisson statistics?
2. What happens to Δw(Δt=+10ms) if τ₊ is doubled to 40 ms? Does the weight change get larger or smaller, and why?
3. If pre always fires exactly 10 ms before post (pure LTP pairing), and the weight starts at 0.5 with hard bounds [0,1], how many pairings are needed to saturate?

### Derive it

1. Hebbian plasticity: "neurons that fire together wire together". Timing-sensitive version: pre before post → LTP; post before pre → LTD.
2. Exponential kernel: Δw = A₊ exp(−|Δt|/τ₊) for Δt > 0 (pre first). Models decay of eligibility trace.
3. Net change over Poisson pairing: integrate kernel over Δt weighted by Poisson ISI. Net ∝ W_net = A₊τ₊ − A₋τ₋.
4. Song et al. choice A₋ > A₊ ensures W_net < 0: random firing causes slight LTD, preventing runaway potentiation and producing unimodal weight distributions.

### Research papers

- Song, S., Miller, K.D., Abbott, L.F. (2000). Competitive Hebbian learning through spike-timing-dependent synaptic plasticity. *Nature Neuroscience*, 3, 919–926. DOI: 10.1038/78829 (cited, not fetched)
- Bi, G.Q., Poo, M.M. (1998). Synaptic modifications in cultured hippocampal neurons: dependence on spike timing, synaptic strength, and postsynaptic cell type. *J Neurosci*, 18(24), 10464–10472. DOI: 10.1523/JNEUROSCI.18-24-10464.1998 (cited, not fetched)

### Where it breaks

- Pair-based STDP only: triplet interactions (Pfister & Gerstner 2006) modify the net rule and can reverse sign.
- No dendritic effects: location of synapse on dendrite changes effective timing.
- No neuromodulation: dopamine gating of STDP is absent.
- Deterministic spike times: real neurons have jitter; averaging over jitter changes the effective kernel shape.

---

## Bench 3 — `neuroscience/compartmental/cable-equation`

**Path:** `benches/neuroscience/compartmental/cable-equation/`
**Level:** university

### Critical trap — read before coding

Space constant λ = √(r_m / r_i) where r_m is membrane resistance per unit length [Ω·m]
and r_i is axial resistance per unit length [Ω/m]. In terms of specific quantities:
λ = (1/2)·√(d·Rm/Ra) where Rm [Ω·m²] is specific membrane resistance and Ra [Ω·m]
is specific axial resistivity. λ scales as √d (NOT d, NOT d²).

Do NOT confuse:
- Rm [Ω·m²] — specific membrane resistance (per unit area) — used in formula above
- rm [Ω·m] — membrane resistance per unit length = Rm/(π·d)

For d=1 μm = 1×10⁻⁶ m, Rm=0.1 Ω·m², Ra=1 Ω·m:
λ = (1/2)·√(1×10⁻⁶ · 0.1 / 1) = (1/2)·√(1×10⁻⁷) = (1/2)·3.1623×10⁻⁴ = 1.5811×10⁻⁴ m = 158.11 μm.

λ ratio for d=10 μm vs d=1 μm: √(10/1) = √10 ≈ 3.1623 (NOT 10).

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| d | dendrite diameter | m | — |
| Rm | specific membrane resistance | Ω·m² | — |
| Ra | specific axial resistivity | Ω·m | — |
| λ | space constant | m | (1/2)·√(d·Rm/Ra) |
| τ_m | membrane time constant | s | Rm·Cm (Cm in F/m²) |
| V(x) | steady-state voltage | V | V₀·e^(−x/λ) (semi-inf cable with sealed end at ∞) |
| V_inf | V at x=λ | V | V₀/e ≈ 0.3679·V₀ |
| R_in | input resistance at x=0 | Ω | λ·Ra/(π·d²/4) = 4Ra/(π·d²)·λ |

### Model class

`CableEquation` in `cable-equation.js`:
- `constructor({d_m, Rm_ohm_m2, Ra_ohm_m, Cm_F_m2})`
- `spaceConstant()` — returns λ in meters
- `timeConstant()` — returns τ_m = Rm·Cm in seconds
- `steadyState(x, V0)` — returns V(x) = V₀·e^(−x/λ) (passive, semi-infinite)
- `inputResistance()` — returns R_in in Ω

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| λ(d=1μm, Rm=0.1, Ra=1) | 1.5811×10⁻⁴ m | 1×10⁻¹⁰ m | Algebraic: (1/2)√(1e-6·0.1/1)=(1/2)√(1e-7); √(1e-7)≈3.16228×10⁻⁴ |
| λ(d=10μm)/λ(d=1μm) | √10 = 3.16228 | 1×10⁻¹² rel | Algebraic: λ∝√d; ratio = √(10/1) = √10 |
| V(x=λ)/V₀ | e^(−1) = 0.36788 | 1×10⁻¹⁵ | Algebraic: e^(−1) is standard constant |
| V(x=0)/V₀ | 1 | 0 (exact) | e^0=1 |
| V(x=2λ)/V₀ | e^(−2) = 0.13534 | 1×10⁻¹⁵ | Algebraic |
| τ_m(Rm=0.1, Cm=0.01) | 0.1·0.01 = 0.001 s | 1×10⁻¹⁸ | Algebraic: exact multiplication |
| d→0 → λ→0 | 0 | — | Boundary: vanishing diameter |
| d→0 → throws or NaN guard | RangeError | — | Defensive: d≤0 invalid |

### Status words

λ formula: *algebraic* (derived from cable theory; standard neuroscience).
V(x) formula: *anchor derived, test planned* (steady-state solution to cable PDE).
Rall, W. (1959) original derivation: *cited, not fetched*.

### Predict questions

1. Double the dendrite diameter from 1 μm to 4 μm. By what factor does the space constant change? What does this mean for signal propagation in thick vs thin dendrites?
2. Set Rm to a very low value (leaky membrane). What happens to λ, and what does this imply about how far a synaptic input spreads?
3. A synapse is placed at x=2λ. What fraction of the input voltage reaches the soma (x=0)? Would you consider this synapse electrically close or far?

### Derive it

1. Cable equation: τ_m ∂V/∂t = λ² ∂²V/∂x² − V. Steady-state (∂V/∂t=0): λ² V'' = V.
2. General solution: V(x) = A e^(x/λ) + B e^(−x/λ). Boundary at ∞: A=0 (voltage finite). At x=0: V=V₀ → B=V₀.
3. Space constant λ = √(r_m/r_i). In cylindrical geometry: r_m = Rm/(πd), r_i = 4Ra/(πd²). Therefore λ = (1/2)√(d·Rm/Ra).
4. Input resistance: R_in = V₀/I_in = λ·r_i = 4Ra·λ/(πd²).

### Research papers

- Rall, W. (1959). Branching dendritic trees and motoneuron membrane resistivity. *Exp Neurol*, 1(5), 491–527. DOI: 10.1016/0014-4886(59)90046-9 (cited, not fetched)
- Koch, C. (1999). *Biophysics of Computation*, Ch. 2. Oxford. (cited, not fetched)

### Where it breaks

- Passive cable only: no voltage-gated channels, no action potentials.
- Infinite or semi-infinite geometry: real dendrites have sealed ends (branching boundary conditions).
- Uniform diameter: real dendrites taper.
- No compartmental coupling: actual simulations use NEURON or compartmental models (Rall 1967).

---

## Bench 4 — `math/stochastic/random-walk`

**Path:** `benches/math/stochastic/random-walk/`
**Level:** intro

### Critical trap — read before coding

For a 1D symmetric random walk of n steps (±1 equally likely):
- ⟨X²⟩ = n (NOT 2Dn; 2D applies to continuous diffusion with diffusion coefficient D)
- E[|X|] ≈ √(2n/π) (from the half-normal approximation for large n)
- 2D walk: ⟨r²⟩ = 2n (each axis contributes n; two axes contribute 2n)
- Gambler's ruin: starting at k with absorbing barriers at 0 and N, P(ruin) = 1 − k/N, P(win) = k/N
- Mean absorption time: E[T] = k(N−k) (for symmetric walk)

For n=100: ⟨X²⟩=100, E[|X|]=√(200/π)≈7.979 (not 10).
For gambler's ruin k=30, N=100: P(win)=0.30, E[T]=30·70=2100.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| n | number of steps | — | — |
| Xₙ | position after n steps | steps | Xₙ = Σᵢ ξᵢ, ξᵢ ∈ {−1,+1} |
| ⟨X²⟩ | mean squared displacement | steps² | n (discrete symmetric) |
| σ | standard deviation | steps | √n |
| E[\|X\|] | mean absolute displacement | steps | √(2n/π) (large n) |
| k | gambler's starting position | steps | — |
| N | gambler's ruin barrier | steps | — |
| P(win) | win probability in gambler's ruin | — | k/N |
| E[T] | mean absorption time | steps | k(N−k) |

### Model class

`RandomWalk` in `random-walk.js`:
- `constructor({seed})` — seeded RNG via `core/Random.js`
- `walk1D(n)` — returns array of positions length n+1
- `walk2D(n)` — returns array of {x,y} length n+1
- `msd(n, trials)` — Monte Carlo estimate of ⟨X²⟩ after n steps over `trials` simulations
- `gamblersRuin({k, N})` — returns `{pWin: k/N, meanTime: k*(N-k)}`

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| ⟨X²⟩ formula at n=100 | 100 | 0 (exact integer) | Algebraic: E[X²]=n for unit-step symmetric walk |
| E[\|X\|] at n=100 | √(200/π) = 7.9788 | 1×10⁻¹² | Algebraic: half-normal approx; √(200/π) exact |
| gambler's ruin P(win) k=30, N=100 | 0.30 | 0 (exact rational) | Algebraic: k/N = 30/100 |
| gambler's ruin E[T] k=30, N=100 | 2100 | 0 (exact integer) | Algebraic: k(N−k) = 30·70 |
| 2D MSD at n=100 | 200 | — | Algebraic: 2n (each axis independent) |
| MC MSD (n=100, trials=10000) | 100 ± 3 | 3.0 (2σ: σ=√(2n²/trials)=√2) | CLT: Var(X²)=2n² for symmetric walk; SE = √(2n²/T) = √(20000/10000)=√2≈1.41; use 3σ≈4.2 → tolerance 5 |
| X₀ = 0 | 0 | 0 | Initial condition |
| walk1D returns length n+1 | n+1 | — | Array length check |

### Status words

⟨X²⟩=n formula: *algebraic*.
E[|X|]=√(2n/π): *algebraic* (half-normal distribution of N(0,n)).
Gambler's ruin P=k/N: *algebraic* (optional stopping theorem / harmonic function).
E[T]=k(N−k): *algebraic* (Wald's identity / optional stopping).

### Predict questions

1. A random walker starts at k=50 of N=100. Compare the mean absorption time to k=10. What does the shape of E[T] = k(N−k) tell you about which starting positions are most "dangerous"?
2. Double the number of steps from 100 to 400. By what factor does the standard deviation σ=√n increase? Does the walker cover distance proportional to time or to √(time)?
3. In 2D, does the walker always return to the origin eventually? What is the recurrence probability in 2D vs 3D?

### Derive it

1. Each step ξᵢ is ±1 with equal probability. E[ξᵢ]=0, E[ξᵢ²]=1. Steps are independent.
2. Xₙ = Σᵢ ξᵢ. E[Xₙ²] = Σᵢ E[ξᵢ²] + 2Σᵢ<ⱼ E[ξᵢ]E[ξⱼ] = n (cross terms vanish by independence).
3. For large n, by CLT: Xₙ ≈ N(0,n). |Xₙ| follows a half-normal with mean = σ√(2/π) = √(2n/π).
4. Gambler's ruin: let h(k) = P(reach N before 0 | start k). h(k) = ½h(k+1) + ½h(k-1), h(0)=0, h(N)=1 → h(k)=k/N. Mean time: optional stopping gives E[T]=k(N−k).

### Research papers

- Spitzer, F. (1964). *Principles of Random Walk*. Springer. (cited, not fetched)
- Feller, W. (1968). *An Introduction to Probability Theory*, Vol. 1, Ch. 14. Wiley. (cited, not fetched)

### Where it breaks

- Discrete ±1 steps only: Lévy flights (heavy-tailed steps) give anomalous diffusion ⟨X²⟩ ~ nᵃ, α≠1.
- No drift: biased walk changes P(win) to (1−(q/p)^k)/(1−(q/p)^N) (geometric formula).
- No interaction: multiple walkers with exclusion (TASEP) behave very differently.
- Gaussian CLT approximation for E[|X|] fails for small n (n<10 shows visible discrete corrections).

---

## Bench 5 — `economics/macroeconomics/solow`

**Path:** `benches/economics/macroeconomics/solow/`
**Level:** university

### Critical trap — read before coding

Steady-state capital per effective worker:
k* = (sA / (n + δ + g))^{1/(1−α)}

where g is TFP growth rate. Do NOT omit g from the denominator. The effective
depreciation of k (capital per effective worker) is (n+δ+g) because population grows
at rate n, effective labour grows at rate g, and capital depreciates at rate δ.

Golden rule savings rate: s_GR = α (when A=1 and Cobb-Douglas Y=K^α·L^{1−α}).
This holds only at the golden rule; it is NOT the savings rate for maximum utility.

Steady state: k* = (sA/(n+δ+g))^{1/(1−α)}; y* = A·(k*)^α; c* = (1−s)·y*.

For s=0.3, A=1, n=0.01, δ=0.05, α=1/3, g=0:
k* = (0.3/(0.06))^{1/0.667} = 5^{1.5} = 11.180.
Anchor script gives k*=11.167 (uses α=0.333 not 1/3 exactly) — use anchor value.

Limit α→0: k*→(sA/(n+δ+g))^1 — capital reduces to a flat level; output y*=A (constant).

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| k | capital per effective worker | — | — |
| y | output per effective worker | — | A·k^α |
| s | savings rate | — | ∈ (0,1) |
| α | capital share | — | ∈ (0,1) |
| A | TFP | — | — |
| n | population growth rate | 1/yr | — |
| δ | depreciation rate | 1/yr | — |
| g | TFP growth rate | 1/yr | — |
| k* | steady-state k | — | (sA/(n+δ+g))^{1/(1−α)} |
| y* | steady-state y | — | A·(k*)^α |
| c* | steady-state consumption | — | (1−s)·y* |
| s_GR | golden rule savings rate | — | α (when A=1) |
| k_GR | golden rule k | — | (α/(n+δ+g))^{1/(1−α)} |

### Model class

`SolowModel` in `solow.js`:
- `constructor({s, alpha, A, n, delta, g})`
- `steadyState()` — returns `{kStar, yStar, cStar}`
- `goldenRule()` — returns `{sGR, kGR, cGR}`
- `dk(k)` — returns dk/dt = s·A·k^α − (n+δ+g)·k (for RK4 integration)
- `simulate(k0, T, dt)` — returns time series `[{t, k, y, c}]` via RK4

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| k* (s=0.3,A=1,n=0.01,δ=0.05,α=0.333,g=0) | 11.167 | 0.001 | Anchor script: (0.3/0.06)^(1/0.667); tolerance from α=0.333 vs 1/3 rounding |
| y* | 2.233 | 0.001 | Algebraic: y*=A·(k*)^α |
| c* | 1.563 | 0.001 | Algebraic: c*=(1−s)·y* = 0.7·2.233 |
| golden rule k_GR | 13.058 | 0.001 | Anchor script: (0.333/0.06)^(1/0.667) |
| golden rule c_GR | 1.569 | 0.001 | Algebraic: c_GR = y_GR − (n+δ+g)·k_GR |
| s_GR = α | 0.333 | 1×10⁻¹⁵ | Algebraic: golden rule s = α·y/k = α (at golden rule k) |
| RK4 convergence to k* | \|k(T=500)−k*\| < 0.001 | 0.001 | Empirical: exponential convergence rate = (1−α)(n+δ+g); half-life ≈ ln2/0.04 ≈ 17 yrs; 500 yrs → fully converged |
| α→0: k*→sA/(n+δ+g) | 0.3/0.06=5 | 1×10⁻¹² | Algebraic limit: (sA/(n+δ+g))^{1/(1−0)} = sA/(n+δ+g) |
| s=0 → k*=0 | 0 | 0 | Boundary: no saving → no capital |
| dk at k=k* | 0 | 1×10⁻¹⁰ | Steady state definition |

### Status words

k* formula: *algebraic*.
Golden rule s_GR=α: *algebraic* (Cobb-Douglas golden rule condition: α·A·k^(α−1) = n+δ+g at golden rule, combined with k_GR definition).
Numerical values k*=11.167 etc.: *anchor derived, test planned*.

### Predict questions

1. Increase the savings rate from 0.3 to 0.5. Does k* double? What is the elasticity of k* with respect to s, and how does α determine it?
2. Set n=0 (no population growth). How does steady-state consumption per worker change compared to n=0.01? What does this imply for aging economies?
3. Add TFP growth g=0.02. Does the economy reach a fixed k*? What actually converges in the Solow model with TFP growth?

### Derive it

1. Capital accumulation: K̇ = sY − δK. In intensive form (k=K/(A·L)): k̇ = s·A·k^α − (n+δ+g)·k.
2. Steady state k̇=0: s·A·(k*)^α = (n+δ+g)·k* → k* = (sA/(n+δ+g))^{1/(1−α)}.
3. Output y*=A·(k*)^α; consumption c*=(1−s)·y*.
4. Golden rule: maximize c*=y*−(n+δ+g)k* over k*. dc/dk=0 → α·A·(k_GR)^{α−1} = n+δ+g → s_GR = α.

### Research papers

- Solow, R.M. (1956). A contribution to the theory of economic growth. *Quarterly Journal of Economics*, 70(1), 65–94. DOI: 10.2307/1884513 (cited, not fetched)
- Romer, D. (2012). *Advanced Macroeconomics*, 4th ed., Ch. 1. McGraw-Hill. (cited, not fetched)

### Where it breaks

- Exogenous savings rate: no utility maximisation (Ramsey model adds this).
- No heterogeneous agents: representative agent only.
- TFP is exogenous: no endogenous growth mechanism (Romer 1990 adds R&D).
- Cobb-Douglas only: constant elasticity of substitution assumed; real factor shares vary.

---

## Bench 6 — `psychology/social/opinion-dynamics`

**Path:** `benches/psychology/social/opinion-dynamics/`
**Level:** university

### Critical trap — read before coding

DeGroot consensus vector = π·x₀ where π is the LEFT eigenvector of W (the stationary
distribution satisfying π·W = π as a row vector, i.e. Wᵀ·πᵀ = πᵀ).

The RIGHT eigenvector of a row-stochastic matrix W (where rows sum to 1) is always
the all-ones vector [1,1,...,1]. This does NOT give the consensus.

`js/core/LinAlg.jacobiEigen` is symmetric-only. A general DeGroot weight matrix W
is NOT necessarily symmetric. Therefore:
- Do NOT use jacobiEigen on W.
- Use power iteration on Wᵀ to find the left eigenvector (stationary distribution π).

For ε→∞ (strong social influence): all agents converge to a single consensus opinion.
For the mean-field (uniform W, equal weights): consensus = mean(x₀) exactly.

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| xᵢ(t) | opinion of agent i at time t | ∈ [0,1] | — |
| Wᵢⱼ | influence weight (i influenced by j) | ∈ [0,1] | Σⱼ Wᵢⱼ = 1 for each i |
| x(t) | opinion vector | — | x(t+1) = W·x(t) |
| π | stationary left eigenvector of W | — | π·W = π; π·1=1 |
| x* | consensus | — | π·x(0) |
| μ | mean opinion | — | mean-conserving for doubly stochastic W |

### Model class

`OpinionDynamics` in `opinion-dynamics.js`:
- `constructor({W})` — weight matrix, validates row sums = 1
- `step(x)` — returns W·x (one DeGroot step)
- `simulate(x0, T)` — returns time series `[x₀, x₁, ..., x_T]`
- `stationary(maxIter)` — power iteration on Wᵀ, returns π
- `consensus(x0)` — returns π·x₀ (predicted consensus)

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| mean-conserving (uniform W, 5 agents, x₀=[0.1,0.3,0.5,0.7,0.9]) | mean=0.5 at all t | 1×10⁻¹⁵ | Algebraic: doubly stochastic W preserves mean; uniform W rows and columns each sum to 1 |
| DeGroot W3 consensus (x₀=[0.2,0.8,0.5]) | 0.5571 | 1×10⁻⁴ | Anchor script: power iteration on specific W3; tolerance from iteration convergence |
| consensus via π·x₀ = long-run W^T·x₀ | match within 1×10⁻⁶ | 1×10⁻⁶ | Cross-check: W^1000·x₀ vs π·x₀ |
| row sums of W = 1 | 1 | 1×10⁻¹⁵ | Constraint; model constructor validates |
| π·1 = 1 | 1 | 1×10⁻¹⁴ | Normalization constraint on left eigenvector |
| all-ones is right eigenvector | W·[1,...,1] = [1,...,1] | 1×10⁻¹⁵ | Row-stochastic identity; algebraic check |
| x bounded in [0,1] after steps | all entries ∈ [0,1] | — | Convexity of [0,1]; W is a convex combination |

### Status words

DeGroot update rule: *algebraic*.
Consensus formula π·x₀: *algebraic* (DeGroot 1974 Theorem 1).
Numerical W3 consensus=0.5571: *anchor derived, test planned*.
DeGroot, M.H. (1974): *cited, not fetched*.

### Predict questions

1. Make one agent's row in W equal to (1, 0, 0, ...) — i.e., agent 1 is completely stubborn (ignores all others). What happens to the long-run consensus? Does the system still converge?
2. Use a cyclic influence structure (agent i influences agent i+1 mod N). Is the stationary distribution uniform? What is the predicted consensus?
3. Start with polarised opinions [0.0, 0.0, 1.0, 1.0]. Does the mean-preserving property guarantee the final consensus is 0.5? Does this depend on the weight matrix?

### Derive it

1. DeGroot (1974): agent i updates opinion as weighted average of all agents: xᵢ(t+1) = Σⱼ Wᵢⱼ xⱼ(t), i.e., x(t+1) = W·x(t).
2. After T steps: x(T) = Wᵀ·x₀. As T→∞: Wᵀ → 1·πᵀ (rank-1 limit for ergodic W). So x(∞) = (π·x₀)·1.
3. π is the unique left eigenvector with eigenvalue 1 (stationary distribution of the Markov chain defined by W).
4. π found by power iteration on Wᵀ: start v=uniform, iterate v←Wᵀv/‖Wᵀv‖₁, until convergence.

### Research papers

- DeGroot, M.H. (1974). Reaching a consensus. *Journal of the American Statistical Association*, 69(345), 118–121. DOI: 10.1080/01621459.1974.10480137 (cited, not fetched)
- Golub, B., Jackson, M.O. (2010). Naive learning in social networks. *American Economic Journal: Microeconomics*, 2(1), 112–149. DOI: 10.1257/mic.2.1.112 (cited, not fetched)

### Where it breaks

- Assumes convergence: non-ergodic W (disconnected graph) can produce multiple limit opinions.
- Linear model only: bounded confidence (Deffuant) and voter models have nonlinear thresholds.
- No stubborn agents: model with fixed-opinion agents (Acemoglu et al.) behaves differently.
- Continuous time: Friedkin-Johnsen extension adds persistence of initial opinion.

---

## Bench 7 — `biology/demography/age-structure`

**Path:** `benches/biology/demography/age-structure/`
**Level:** university

### Critical trap — read before coding

`js/core/LinAlg.jacobiEigen` is SYMMETRIC-ONLY. Leslie matrices are generally
asymmetric. Do NOT use jacobiEigen for Leslie matrices.

For 2-age model: use `eigen2x2` (or solve char poly analytically).
For 3-age model: use power iteration (repeated L·v until ratio converges).

2-age Leslie L=[[0,4],[0.5,0]]:
Char poly: λ²−0·λ−4·0.5 = λ²−2 = 0 → λ=√2 ≈ 1.4142.

3-age Leslie L=[[0,1,5],[0.4,0,0],[0,0.6,0]]:
Char poly: λ³ − l₁f₁λ − l₂f₂ = λ³ − 0.4·1·λ − 0.4·0.6·5 = λ³ − 0.4λ − 1.2 = 0.
Root λ ≈ 1.1876 (Newton's method or anchor script).
Verify: residual = λ³ − 0.4λ − 1.2 ≈ 6.7×10⁻¹⁶.

Euler-Lotka equation (alternative derivation):
l₁f₁/λ² + l₂f₂/λ³ = 1, where l₁=s₀=0.4, l₂=s₀·s₁=0.24, f₁=L[0][1]=1, f₂=L[0][2]=5.

R₀ = net reproductive rate = l₁·f₁ + l₂·f₂ = 0.4·1 + 0.24·5 = 0.4 + 1.2 = 1.6.
R₀ > 1 → population growing (consistent with λ>1).

λ=1 boundary: stationary population. Test: find s₀ such that λ=1 (find R₀=1 numerically).

### Symbol table

| Symbol | Name | Unit | Formula source |
|---|---|---|---|
| fᵢ | age-specific fecundity | offspring/individual | L[0][i] |
| sᵢ | age-specific survival | per time step | L[i+1][i] |
| λ | dominant eigenvalue | 1/step | characteristic polynomial |
| r | intrinsic growth rate | 1/step | ln(λ) |
| R₀ | net reproductive rate | — | Σᵢ lᵢ·fᵢ |
| lᵢ | survivorship to age i | — | l₀=1, lᵢ=s₀·s₁·...·s_{i−1} |
| w | stable age distribution (right eigenvector) | — | L·w = λ·w |
| π | reproductive value (left eigenvector) | — | πᵀ·L = λ·πᵀ |

### Model class

`LeslieMatrix` in `age-structure.js`:
- `constructor({fecundities, survivals})` — builds L matrix
- `step(n)` — returns L·n (one time step of age vector)
- `simulate(n0, T)` — returns time series array
- `dominantEigen(maxIter)` — power iteration, returns `{lambda, stableAge}`
- `netReproductiveRate()` — returns R₀ = Σ lᵢ·fᵢ
- `intrinsicRate()` — returns r = ln(λ)

### Anchor → test table

| Anchor | Expected | Tolerance | Derivation |
|---|---|---|---|
| 2-age λ ([[0,4],[0.5,0]]) | √2 = 1.41421 | 1×10⁻¹² | Algebraic: λ²=2 → λ=√2 |
| 3-age λ ([[0,1,5],[0.4,0,0],[0,0.6,0]]) | 1.18760 | 1×10⁻⁵ | Anchor script: Newton iteration; power iteration tolerance 1×10⁻⁸ in 100 iters |
| 3-age char poly residual | \|λ³−0.4λ−1.2\| < 1×10⁻¹⁴ | 1×10⁻¹⁴ | Algebraic; double precision root of cubic |
| R₀ (3-age) | 1.6 | 1×10⁻¹⁵ | Algebraic: 0.4·1 + 0.24·5 = 1.6 |
| r = ln(λ) for 3-age | ln(1.1876) ≈ 0.17198 | 1×10⁻⁵ | Algebraic function of λ |
| λ=1 stationary population | n(t+1) = n(t) (stable) | — | Boundary: λ=1 → constant total population |
| power iteration convergence | \|λ_iter − λ_exact\| < 1×10⁻⁸ | 1×10⁻⁸ | Convergence rate = \|λ₂/λ₁\|^T; for 100 iters sufficient |
| stable age proportional after T steps | ratios constant | 1×10⁻⁶ rel | Perron-Frobenius: all eigenvectors decay except dominant |
| L·w = λ·w (eigenvector check) | \|L·w−λ·w\|/\|w\| < 1×10⁻⁸ | 1×10⁻⁸ | Residual of power-iterated eigenvector |

### Status words

Leslie matrix formulation: *algebraic*.
Char poly of 3-age matrix: *algebraic*.
λ≈1.1876: *anchor derived, test planned*.
R₀ formula: *algebraic*.
Euler-Lotka equation: *cited, not fetched* (Euler 1760 / Lotka 1925).
Leslie (1945) original paper: *cited, not fetched*.

### Predict questions

1. Increase fecundity of age class 2 (f₂) from 5 to 10 in the 3-age model. Does λ increase? By how much, and does R₀ change proportionally?
2. Set s₀ (survival to age 1) to 0. What happens to R₀ and λ? What does this say about the importance of juvenile survival?
3. Start with all individuals in age class 0. After 20 time steps, what fraction of the population is in each age class? Does this match the stable age distribution w?

### Derive it

1. Population vector n(t) = [n₀(t), n₁(t), ...]ᵀ. Recursion: n(t+1) = L·n(t) where L is the Leslie matrix.
2. Long-run: n(t) ≈ cλᵗw where λ is the dominant eigenvalue and w is the corresponding eigenvector (Perron-Frobenius theorem for positive matrices).
3. Characteristic polynomial for 3-age: det(L − λI) = −λ³ + f₁s₀λ + f₂s₀s₁ = 0. Rearranged: λ³ = l₁f₁λ + l₂f₂ → dividing by λ³: l₁f₁/λ² + l₂f₂/λ³ = 1 (Euler-Lotka).
4. R₀ = Σᵢ lᵢfᵢ. R₀>1 → λ>1 (population growing). R₀=1 → λ=1 (stationary).

### Research papers

- Leslie, P.H. (1945). On the use of matrices in certain population mathematics. *Biometrika*, 33(3), 183–212. DOI: 10.1093/biomet/33.3.183 (cited, not fetched)
- Caswell, H. (2001). *Matrix Population Models*, 2nd ed. Sinauer. (cited, not fetched)

### Where it breaks

- Deterministic: no demographic stochasticity (small populations go extinct by chance).
- Time-invariant fecundities and survivals: seasonal variation and density dependence absent.
- Age structure only: stage-structured models (e.g., size classes) require different matrix (Lefkovitch 1965).
- No spatial structure: metapopulation dynamics and dispersal between patches not captured.

---

## Visual rules summary (R9)

All benches must follow these rules, checked at every bench:

| Rule | Requirement |
|---|---|
| Colors | All colors from `theme.color('--token')` — no hardcoded hex values |
| Background | `ctx.clearRect(...)` using `--surface` token |
| Axis labels | Use `js/core/Axes.js` standard axis drawing |
| Canvas size | Use `js/core/CanvasView.js` for responsive sizing |
| No inline styles | CSS from bench's `.css` file only |

---

## Test count target

| Bench / Infra | Estimated new tests |
|---|---|
| Complex.js | 10 |
| entropy-mixing | 14 |
| random-walk | 14 |
| cable-equation | 12 |
| solow | 16 |
| stdp | 14 |
| opinion-dynamics | 14 |
| age-structure | 16 |
| **Total new** | **~110** |
| **Cumulative** | **~866** |

---

## Commit discipline

- One commit per bench (or infra step)
- Run `npm test` and verify all prior tests pass before committing
- Commit message format: `feat(bench): add <bench-name> with N tests`
- For infra: `feat(core): add Complex.js with N tests`
- No push until phase is complete and reviewed

---

## Constants register

| Constant | Value | Status |
|---|---|---|
| R (gas constant) | 8.314462618 J/(mol·K) | cited, not fetched (CODATA 2018 SI exact) |
| A₊ (STDP LTP amplitude) | 0.01 | cited, not fetched (Song et al. 2000) |
| A₋ (STDP LTD amplitude) | 0.0105 | cited, not fetched (Song et al. 2000) |
| τ₊=τ₋ (STDP time constants) | 20 ms | cited, not fetched (Song et al. 2000) |
| Rm (cable, default) | 0.1 Ω·m² | unverified (illustrative textbook value) |
| Ra (cable, default) | 1.0 Ω·m | unverified (illustrative textbook value) |

---

## Domain / boundary test checklist (R4)

| Bench | Boundary condition | Expected behaviour |
|---|---|---|
| entropy-mixing | pure state x=1 | ΔS → 0 exactly |
| entropy-mixing | trace component x=0 | term = 0 (no NaN) |
| age-structure | λ=1 stationary pop | n(t+T) = n(t) |
| cable-equation | μ→0 (no membrane current) | unphysical; guard d≤0 → RangeError |
| opinion-dynamics | ε→∞ strong consensus | all agents → same value |
| solow | α→0 | k*→ sA/(n+δ+g) |
| random-walk | n=0 | X₀=0, walk of length 1 |
| complex | div by zero | RangeError |

---

STOP — submit for review before coding.
