# Phase 10 plan

**Date drafted:** 2026-10-16
**Carries forward:** 872 tests pass (phases 1–9 + phase-9b).
**Tag at start:** `phase-9b`

---

## Plan changes (applied)

| ID | Section | Change | Reason |
|---|---|---|---|
| G-1 | Justification | Added 7-bench justification paragraph and candidates-considered note | Required by plan template |
| G-2 | Catalog § voting | Changed field id from `voting` to `social-choice` | Correct catalog field name |
| LC-1 | LC predict Q=20Ω | Verified: R=20Ω → Q=√1000/20=√10/2≈1.581 (underdamped, R_crit≈63Ω) | Confirm calculation |
| LC-2 | LC half-power note | Clarified: ω1·ω2=ω0², Δω=R/L hold for impedance half-power (ω±=±α+√(α²+ω₀²)), not for |V_C| half-power | Anchor script R8 flag |
| BV-1 | BV model class | Added sinh form: for α=0.5, i/i₀ = 2·sinh(η/(2V_T)) | More elegant form; verified in anchors |
| BV-2 | BV predict 3 | Changed answer from "η≈6.3mV" to "η≈12.57mV" | Plan used (η/V_T)²/6 coefficient; correct is (η/V_T)²/24 giving η=V_T·√0.24 |
| BV-3 | BV anchor table | Added log10(i/i₀) at η=b = 0.9956351945975499; tightened to 0.01 abs | Exact value; sinh form gives 2·sinh(ln10)=9.9, log10(9.9) |
| BV-4 | BV domain note | Added |η|/V_T ≤ 700 domain guard (overflow beyond) | Prevent exp overflow |
| BS-1 | BS call price | Changed anchor 10.4506 → 10.450583572185565 at 1e-12 abs | Higher precision anchor from Taylor-series Φ |
| BS-2 | BS σ→∞ limit | Changed C→S−K to C→S (at σ→∞, Φ(d1)→1, Ke^{-rT}Φ(d2)→0, C→S=100) | Correct asymptote |
| BS-3 | BS σ→0 limit | Added anchor: C→100(1−e^{-0.05})=4.877057549928594 | Intrinsic-value limit |
| BS-4 | BS predict 1 | Changed answer from "yes" to "no": call is concave in σ (C→S=100 as σ→∞); doubling σ from 20% to 40% gives C≈18.01 < 2×10.45=20.90 | Convex vs concave confusion |
| BS-5 | BS anchor table | Added deep ITM put: S=50,K=100,r=5%,σ=20%,T=1 → 45.12534186762472 | Tests deep ITM regime |
| H-1 | Hopfield ΔE | Changed ΔE = −(h_i·s_i − |h_i|) → ΔE = −(|h_i| − s_old·h_i) ≤ 0 | Sign in original formula was wrong (s_i ambiguously referenced s_new) |
| H-2 | Hopfield E formula | Added E = (1−N·m²)/2 where m=(1/N)Σξ_is_i: E_stored=(1-N)/2=-1.5, E_orth=+0.5 | General formula beyond N=4 case |
| H-3 | Hopfield predict 1 | Changed answer: E(state_between)=(1-N*m²)/2 with m∈(-1,1), energy between E_stored and E_orth | Use general formula |
| RL-1 | RL corridor env | Added corridor environment: states 0..8, start=2, terminals 0(+1) and 8(+10) | More interesting than abstract MDP; γ* derivable |
| RL-2 | RL γ* | Added γ* = 10^{-1/4} = 0.5623413251903491 threshold (agent prefers +10 for γ>γ*) | Derived from 10γ^4=1 |
| RL-3 | RL gambler's ruin | Added P(reach 8 before 0 | start=2) = 2/8 = 1/4 (unbiased walk) | Gambler's ruin connection |
| V-1 | Voting predict 2 | Changed "yes" → "no for 3 alternatives (exhaustive proof); yes for 4+ alternatives" | With 3 alts, Borda score = pairwise wins → Condorcet loser = min Borda |
| V-2 | Voting test profile | Added 3xABC+2xBCA: Borda winner=B, plurality winner=A, Condorcet winner=A | Shows Borda ≠ plurality |
| V-3 | Voting cycle count | Added: 12 out of 216 three-voter three-alt profiles have Condorcet cycle (exhaustive) | Verified in anchor script |

---

## Pre-plan anchor computations (R1)

All numerical anchors computed in `tools/anchors-phase10.mjs` and
`tools/anchors-phase10-lc.mjs` (no model code imported).

Run:
```
node tools/anchors-phase10-lc.mjs   # LC oscillator trap verification
node tools/anchors-phase10.mjs      # all 7 bench anchors
```

Both scripts pass all asserts. See §§ below for per-bench details.

### R8 flags caught at anchor time

| Flag | Brief said | Actual | Correction |
|---|---|---|---|
| Q for R=10Ω, L=1mH, C=1μF | Q≈10 | Q = √10 ≈ 3.162 | Q=10 needs R=√10≈3.16Ω; revised all frequency formulas |
| ωC_peak formula | ω₀√(1−1/200) | ω₀√(1−1/(2Q²))=ω₀√(0.95) | With Q=√10: 1/(2Q²)=1/20; ωC=10⁴√9.5 |
| "BW = 10000 exactly" | integer exact | floating point: 10000+3.6e-12 | Changed assert to `< 1e-8` |

---

## Infrastructure note (Complex.js)

**Complex.js is NOT added in Phase 10.** Reason: only lc-oscillator would use it
(optional, for displaying pole location as a complex number), which is fewer than
the required 2 benches. Complex.js will be added as `[infra]` in Phase 12, just
before `schrodinger-1d` and `quantum-tunneling` which genuinely need it.

lc-oscillator will compute all quantities using real arithmetic (poles are displayed
as `-α ± ωd·j` using string formatting, not a Complex class).

---

## Bench selection justification

**Seven benches were chosen for Phase 10** to cover physically meaningful ODE models,
electrochemical kinetics, derivative pricing, associative memory, policy optimisation,
mechanism design, and social-choice theory — one each from physics, chemistry, economics
(×3), neuroscience, and social science.

**Candidates considered and deferred:**

| Candidate | Reason deferred |
|---|---|
| Population STDP (spiking network, Phase 9-adjacent) | Too close to Phase 9 STDP bench; would need Complex.js for spectrum |
| Lotka-Volterra (Phase 11 candidate) | Already on ROADMAP under ecology |
| Stochastic SIR (epidemic) | Requires birth-death chain which belongs in Phase 11 probability block |
| Kalman filter | Requires matrix square-root; better after LinAlg extensions in Phase 12 |
| Quantum harmonic oscillator | Requires Complex.js; deferred to Phase 12 with schrodinger-1d |

**ROADMAP reshaping:** No bench was removed from the ROADMAP. The `economics/voting`
entry is relabelled to `economics/social-choice` to match the catalog field id `social-choice`.

---

## Implementation order

1. `physics/electromagnetism/lc-oscillator`         — university, ODE + closed-form
2. `chemistry/electrochemistry/butler-volmer`        — graduate, closed-form
3. `economics/finance/options-pricing`               — graduate, closed-form + parity
4. `neuroscience/networks/hopfield`                  — graduate, matrix + energy
5. `psychology/learning/reinforcement-learning`      — graduate, tabular Q-learning
6. `economics/game-theory/auctions`                  — university, algebraic + BNE
7. `economics/voting/voting-systems`                 — intro, combinatorial

One commit per bench. `npm test` before every commit.
Run `npm run smoke -- --bench <id>` before every commit.
No push.

---

## New catalog fields

Fields verified against `js/catalog.js` as of phase-10 draft.

| Subject | Field id | Label | Benches | Verified |
|---|---|---|---|---|
| Physics | `electromagnetism` | Electromagnetism | lc-oscillator | existing (rc-circuit lives here) |
| Chemistry | `electrochemistry` | Electrochemistry | butler-volmer | existing (nernst-cell lives here) |
| Economics | `finance` | Finance | options-pricing | **NEW** |
| Neuroscience | `networks` | Networks & coding | hopfield | **NEW** |
| Psychology | `learning` | Learning & cognition | reinforcement-learning | existing (prisoner-dilemma, opinion-dynamics live here) |
| Economics | `game-theory` | Game Theory | auctions | existing (nash-equilibria lives here) |
| Economics | `social-choice` | Voting & social choice | voting-systems | **NEW** |

Three new fields required: `economics/finance`, `neuroscience/networks`, `economics/social-choice`.

---

## Key reuse

| Module | Used by |
|---|---|
| `js/core/Integrators.js` (RK4) | lc-oscillator (underdamped step response) |
| `js/core/LinAlg.js` (matVec) | hopfield (h_i = W·s; energy) |
| `js/core/Random.js` | reinforcement-learning (ε-greedy exploration) |

---

## Visual rules (R9) reminder

- Only valid CSS tokens: `--accent`, `--accent-soft`, `--bg`, `--f-body`, `--f-display`,
  `--f-mono`, `--good`, `--grid`, `--ink`, `--line`, `--muted`, `--on-surface`, `--panel`,
  `--qb`, `--qg`, `--qr`, `--signal`, `--surface`, `--text`, `--third`
- INVALID: `--fg`, `--ok`, `--warn`, `--err`, `--accent2`
- All readouts: guard against undefined/null before calling `.toFixed()`

---

## File layout

```
js/benches/physics/electromagnetism/lc-oscillator/
  LCOscillatorModel.js
  LCOscillatorView.js
  LCOscillatorBench.js
js/benches/chemistry/electrochemistry/butler-volmer/
  ButlerVolmerModel.js
  ButlerVolmerView.js
  ButlerVolmerBench.js
js/benches/economics/finance/options-pricing/
  OptionsPricingModel.js
  OptionsPricingView.js
  OptionsPricingBench.js
js/benches/neuroscience/networks/hopfield/
  HopfieldModel.js
  HopfieldView.js
  HopfieldBench.js
js/benches/psychology/learning/reinforcement-learning/
  RLModel.js
  RLView.js
  RLBench.js
js/benches/economics/game-theory/auctions/
  AuctionModel.js
  AuctionView.js
  AuctionBench.js
js/benches/economics/voting/voting-systems/
  VotingModel.js
  VotingView.js
  VotingBench.js
tests/physics/lc-oscillator.test.js
tests/chemistry/butler-volmer.test.js
tests/economics/options-pricing.test.js
tests/neuroscience/hopfield.test.js
tests/psychology/reinforcement-learning.test.js
tests/economics/auctions.test.js
tests/economics/voting-systems.test.js
```

---

## Bench 1 — LC Oscillator

### Critical trap

**There are THREE distinct frequencies** for a series RLC circuit, not one:
1. Free-ringing: ωd = √(ω₀²−α²)  (the natural mode of the unforced oscillator)
2. Current resonance: ω₀ = 1/√(LC)  (peak of |I(jω)| in AC drive = maximum power transfer)
3. Voltage peak across C: ωC = √(ω₀²−2α²)  (where d|V_C(ω)|/dω = 0)

For high-Q circuits these three are nearly equal; at Q=√10 they differ noticeably.
A model must expose all three or clearly document which is being called "resonance".

**R8 flag:** The task brief claimed Q≈10 for R=10Ω, L=1mH, C=1μF. This is **wrong**.
Q = √(L/C)/R = √1000/10 = √10 ≈ 3.162. All anchors below use the corrected value.

### Symbol table

| Symbol | Meaning | Value for test case | Status |
|---|---|---|---|
| R | resistance | 10 Ω | exact SI |
| L | inductance | 1 mH = 1e-3 H | exact SI |
| C | capacitance | 1 μF = 1e-6 F | exact SI |
| α | neper freq R/(2L) | 5000 rad/s | algebraic |
| ω₀ | natural freq 1/√(LC) | 10⁴√10 rad/s | algebraic |
| Q | quality factor √(L/C)/R | √10 | algebraic |
| ωd | damped nat. freq √(ω₀²−α²) | 10⁴√9.75 rad/s | algebraic |
| ωC | V_C peak freq √(ω₀²−2α²) | 10⁴√9.5 rad/s | algebraic |
| Δω | half-power bandwidth R/L | 10000 rad/s | algebraic |
| R_crit | crit. damping 2√(L/C) | 20√10 Ω | algebraic |

### Domain validation (R4)

| Parameter | Guard | RangeError message |
|---|---|---|
| R | > 0 | `LCOscillatorModel: R must be > 0` |
| L | > 0 | `LCOscillatorModel: L must be > 0` |
| C | > 0 | `LCOscillatorModel: C must be > 0` |
| t (step response) | ≥ 0 | `LCOscillatorModel: t must be ≥ 0` |

### Model class

```javascript
export class LCOscillatorModel {
  constructor({ R, L, C })      // throws RangeError
  alpha()                       // R/(2L)
  omega0()                      // 1/√(LC)
  Q()                           // √(L/C)/R
  omegaDamped()                 // √(ω₀²−α²) — null if overdamped
  omegaVcPeak()                 // √(ω₀²−2α²) — null if α > ω₀/√2
  bandwidth()                   // R/L = 2α
  criticalDamping()             // R_crit = 2√(L/C)
  dampingRegime()               // 'underdamped'|'critical'|'overdamped'
  stepResponseVc(t)             // V_C(t) for unit step, V_C(0)=0, I(0)=0
  simulate(t0, T, dt)           // [{t, Vc, I}] via RK4
  frequencyResponse(omega)      // |Z(jω)| for series circuit
}
```

### Anchor → test table

| Test name | Anchor | Tolerance | Source |
|---|---|---|---|
| `α = R/(2L) = 5000` | 5000 (exact) | === | algebraic |
| `ω₀ = 10⁴√10` | 31622.77... | 1e-12 rel | algebraic |
| `Q = √10` | 3.16227... | 1e-12 rel | algebraic |
| `ωd = 10⁴√9.75` | 31224.99... | 1e-12 rel | algebraic |
| `ωC_peak = 10⁴√9.5` | 30822.07... | 1e-12 rel | algebraic |
| `Δω = R/L = 10000` | 10000 | 1e-8 abs | algebraic |
| `R_crit = 20√10` | 63.2455... | 1e-12 rel | algebraic |
| `ordering: ωC < ωd < ω₀` | strict inequality | boolean | algebraic |
| `stepResponseVc(t_qtr) = 0.87548...` | 0.8754825657666366 | 1e-10 rel | algebraic |
| `RK4 vs formula < 1e-7 rel` | ratio | [3.5, 4.5]×RK4 | algebraic |
| `V_C(0) = 0` | IC | 1e-15 abs | algebraic |
| `R≤0 throws RangeError` | guard | throw | — |
| `overdamped: omegaDamped = null` | R > R_crit | null | algebraic |

### Predict questions

1. Increase R from 10 Ω to 20 Ω. Does the system become overdamped? What is Q now?
   *(Answer: Q = √(L/C)/R = √1000/20 ≈ 1.58; still underdamped since R_crit ≈ 63 Ω)*
2. Set R=0. What is the oscillation frequency? Why doesn't it decay?
   *(Answer: ωd = ω₀ = 10⁴√10; no damping — perfect LC tank oscillator)*
3. At what R does ωd = ωC_peak exactly?
   *(Answer: ω₀²−α² = ω₀²−2α² → impossible unless α=0; they are never equal for R>0)*

### Derive it (step by step)

1. KVL: L·dI/dt + RI + V_C = V_in; I = C·dV_C/dt
2. Eliminate I: L·C·d²V_C/dt² + RC·dV_C/dt + V_C = V_in
3. Char. eq: Ls² + Rs + 1/C = 0; roots s = [−R ± √(R²−4L/C)] / (2L) = −α ± j·ωd
4. Underdamped (R < 2√(L/C)): V_C(t) = V_in·[1 − e^{−αt}(cos(ωd·t) + (α/ωd)sin(ωd·t))]
5. Q = ω₀/(2α) = energy stored / energy dissipated per radian
6. Bandwidth from half-power: |Z(ω)|² = 2R² → ωL−1/(ωC)=±R → Δω = 2α = R/L (exact)
7. V_C peak: |V_C(jω)| = |1/(jωC)| / |R + jωL + 1/(jωC)|; maximize over ω → ωC = √(1/LC−R²/(2L²))

### Research papers

| Authors | Year | Title | DOI | Status |
|---|---|---|---|---|
| Heaviside, O. | 1894 | Electrical Papers Vol. II | — | cited-not-fetched |
| Landau & Lifshitz | 1960 | Mechanics §22 | — | cited-not-fetched |

### Where it breaks

- Model assumes lumped components; real inductors have winding resistance and self-capacitance.
- Assumes linear components; real capacitors have voltage-dependent capacitance (ferroelectric).
- No radiation resistance; at RF frequencies, antenna effects dominate.
- Driving voltage assumed ideal; source impedance shifts ω₀ and Q.

---

## Bench 2 — Butler-Volmer

### Critical trap

**Two separate asymptotic limits exist** and must not be confused:
- Small η: Butler-Volmer → linear (Ohm's law), i ≈ i₀·η/V_T
- Large η: anodic branch → Tafel, log₁₀(i/i₀) ≈ η/b where b = V_T/(α·ln10)

For α ≠ 0.5 there is **no symmetry** i(−η) = −i(η); this must be tested explicitly.

### Symbol table

| Symbol | Meaning | Test value | Status |
|---|---|---|---|
| F | Faraday constant | 96485.33212 C/mol | CODATA 2018 exact |
| R | gas constant | 8.31446261815324 J/(mol·K) | CODATA 2018 exact |
| T | temperature | 298.15 K | exact SI (25°C) |
| V_T | thermal voltage RT/F | 0.02569257912 V | algebraic |
| α | transfer coefficient | 0.5 | dimensionless |
| i₀ | exchange current density | parameter | — |
| η | overpotential | variable | — |
| b | anodic Tafel slope V_T/α·ln10 | 0.11832 V/dec | algebraic |

### Domain validation (R4)

| Parameter | Guard | RangeError |
|---|---|---|
| alpha_bv | ∈ (0,1) | `ButlerVolmerModel: alpha must be in (0,1)` |
| T | > 0 | `ButlerVolmerModel: T must be > 0` |
| i0 | > 0 | `ButlerVolmerModel: i0 must be > 0` |

### Model class

```javascript
export class ButlerVolmerModel {
  constructor({ alpha = 0.5, T_K = 298.15, i0 = 1 })
  thermalVoltage()         // RT/F
  tafelSlope()             // V_T/alpha * ln(10) [anodic, V/decade]
  current(eta)             // i0*[exp(alpha*eta/VT) - exp(-(1-alpha)*eta/VT)]
  currentNorm(eta)         // current(eta)/i0 (dimensionless)
  tafelApprox(eta)         // i0*exp(alpha*eta/VT) [large anodic eta]
  linearApprox(eta)        // i0*eta/VT [small eta]
  polarizationCurve(etaMax, nPoints) // [{eta, i}]
}
```

### Anchor → test table

| Test name | Anchor | Tolerance | Source |
|---|---|---|---|
| `V_T = RT/F at 25°C` | 0.02569257912 V | 1e-12 rel | CODATA 2018 |
| `Tafel slope = V_T/0.5·ln10` | 0.11832 V/dec | 1e-10 rel | algebraic |
| `i(0) = 0 (equilibrium)` | 0 | === 0 | algebraic |
| `i(η) = −i(−η) at α=0.5` | symmetry | 1e-14 rel | algebraic |
| `linear limit at η=1mV` | i₀·η/V_T | 1e-5 rel | algebraic |
| `Tafel limit at η=0.5V` | cathodic fraction < 1e-4 | boolean | algebraic |
| `log10(i) at η=b ≈ 1 decade` | 0.9956 | 0.05 abs | algebraic |
| `log10(i/i₀) at η=b = 0.9956351946` | 0.9956351945975499 | 0.01 abs | algebraic (2·sinh(ln10)=9.9) |
| `sinh form: 2·sinh(η/(2V_T)) for α=0.5` | verified | 1e-12 rel | algebraic |
| `α=0.3 breaks symmetry` | i(−η) ≠ −i(η) | boolean | algebraic |
| `α∈(0,1) guard` | RangeError | throw | — |

### Predict questions

1. Double α from 0.5 to closer to 1. Does the anodic branch steepen or flatten?
   *(Answer: steepens — Tafel slope b = V_T/α·ln10 decreases as α increases)*
2. Raise temperature from 25°C to 60°C. How does the exchange current change?
   *(Answer: V_T increases; Tafel slope increases; linear region widens)*
3. At what η does the linear approximation introduce 1% error?
   *(Answer: for α=0.5, relative deviation ≈ (η/V_T)²/24 ≈ 0.01 → η = V_T·√0.24 ≈ 12.57 mV)*

### Derive it

1. Arrhenius rate theory: k_f = A·exp(−ΔG_act/(RT)); k_b = A·exp(−(ΔG_act−FΔφ)/(RT))
2. Transfer coefficient α: fraction of Faradaic potential lowering activation barrier
3. i = F(k_f·[O] − k_b·[R]) at equilibrium → i₀ = F·k_f·[O]_eq = F·k_b·[R]_eq
4. i = i₀·[exp(αFη/RT) − exp(−(1−α)Fη/RT)]

### Research papers

| Authors | Year | Title | DOI | Status |
|---|---|---|---|---|
| Bard & Faulkner | 2001 | Electrochemical Methods §3.4 | — | cited-not-fetched |
| Butler, J.A.V. | 1924 | Trans. Faraday Soc. 19:729 | 10.1039/tf9241900729 | cited-not-fetched |

### Where it breaks

- Assumes elementary single-electron transfer; multi-step mechanisms have apparent α ≠ 0.5.
- Concentration terms absorbed into i₀; mass transport not modelled.
- Does not include double-layer charging current (transient terms).
- Temperature assumed uniform; large currents cause local heating.

---

## Bench 3 — Options Pricing (Black-Scholes)

### Critical trap

**Put-call parity is an exact algebraic identity**, not a numerical approximation:
C − P = S − K·e^{−rT}. Any implementation that violates this to more than machine
epsilon has a bug. Tests must check parity at 1e-10 absolute.

The formula uses Φ (standard normal CDF) which must be implemented without
the Abramowitz & Stegun polynomial approximation (error ≈ 1.5e-7) — use Taylor
series or erf from the standard library. **This bench is for educational use only
and explicitly NOT financial advice.**

### Symbol table

| Symbol | Meaning | Test value | Status |
|---|---|---|---|
| S | spot price | 100 USD | parameter |
| K | strike price | 100 USD (ATM) | parameter |
| r | risk-free rate | 5% = 0.05 | parameter |
| σ | volatility | 20% = 0.20 | parameter |
| T | time to expiry | 1 year | parameter |
| d₁ | (ln(S/K)+(r+σ²/2)T)/(σ√T) | 0.35 (exact ATM) | algebraic |
| d₂ | d₁ − σ√T | 0.15 (exact ATM) | algebraic |
| Φ | standard normal CDF | | algebraic |

### Domain validation (R4)

| Parameter | Guard | RangeError |
|---|---|---|
| S | > 0 | `OptionsPricingModel: S must be > 0` |
| K | > 0 | `OptionsPricingModel: K must be > 0` |
| sigma | > 0 | `OptionsPricingModel: sigma must be > 0` |
| T | > 0 | `OptionsPricingModel: T must be > 0` |

### Model class

```javascript
export class OptionsPricingModel {
  constructor({ S, K, r, sigma, T })
  d1()                  // (ln(S/K) + (r+σ²/2)T) / (σ√T)
  d2()                  // d1 - σ√T
  callPrice()           // S·Φ(d1) - K·e^{-rT}·Φ(d2)
  putPrice()            // K·e^{-rT}·Φ(-d2) - S·Φ(-d1)
  delta(type)           // Φ(d1) for call, Φ(-d1)-1 for put
  intrinsicValue(type)  // max(S-K,0) or max(K-S,0)
  timeValue(type)       // price - intrinsicValue
  impliedVol(marketPrice, type, tol)  // Newton-Raphson for σ; tol≥1e-6
}
```

### Anchor → test table

| Test name | Anchor | Tolerance | Source |
|---|---|---|---|
| `d₁ = 0.35 for ATM params` | 0.35 | === (ln(1)=0) | algebraic |
| `d₂ = 0.15 for ATM params` | 0.15 | === | algebraic |
| `call = 10.4506` | 10.450583572185565 | 1e-12 abs | algebraic+cited |
| `put-call parity error < 1e-10` | C−P = S−Ke^{-rT} | 1e-10 abs | algebraic |
| `delta_call = Φ(0.35)` | 0.6368306511756191 | 1e-12 rel | algebraic |
| `call > 0 for any S,K,T,σ>0` | positivity | boolean | algebraic |
| `call → S for σ→∞` | ordering | boolean | algebraic |
| `impliedVol round-trip ±1e-4` | Newton-Raphson | 1e-4 rel | algebraic |
| `S≤0 throws RangeError` | guard | throw | — |

### Predict questions

1. Double volatility from 20% to 40%. Does the call price more than double?
   *(Answer: no — call is concave in σ (saturates to S=100 as σ→∞); C(40%)≈18.01 < 2×C(20%)≈20.90)*
2. Deep in the money (S=150, K=100). What is the delta?
   *(Answer: Φ(d₁) → 1 as S>>K, since d₁ → ∞)*
3. What is the call price for S=K=100, r=0, σ→0, T→0?
   *(Answer: → 0, since intrinsic value = S−K = 0 ATM and time value vanishes)*

### Derive it

1. Geometric Brownian motion: dS = μS·dt + σS·dW
2. Replicating portfolio Δ·S − B eliminates stochastic term (Ito's lemma)
3. No-arbitrage PDE: ∂C/∂t + ½σ²S²∂²C/∂S² + rS·∂C/∂S − rC = 0
4. Boundary condition: C(S,T) = max(S−K,0)
5. Heat-equation transformation → Φ(d₁) form

### Research papers

| Authors | Year | Title | DOI | Status |
|---|---|---|---|---|
| Black & Scholes | 1973 | The pricing of options and corporate liabilities | 10.1086/260062 | cited-not-fetched |
| Merton | 1973 | Theory of rational option pricing | 10.2307/3003143 | cited-not-fetched |

### Where it breaks

- Log-normal model: real returns have fat tails; Black-Scholes underprices OTM options.
- Constant volatility assumed; implied vol surface (volatility smile) not captured.
- European options only; American options require different methods.
- No dividends; no transaction costs; continuous trading assumed.
- **This bench is for educational purposes only and is not financial advice.**

---

## Bench 4 — Hopfield Network

### Critical trap

**Energy is a Lyapunov function**: each async update decreases E (or leaves it unchanged),
guaranteeing convergence to a local minimum. The test must verify E(state_before) ≥ E(state_after)
for every async update step, not just that the final state is a fixed point.

The Hebb rule without normalization causes interference between stored patterns. With M patterns
stored in N neurons, retrieval probability drops sharply above ~0.138N.

### Symbol table

| Symbol | Meaning | Test value | Status |
|---|---|---|---|
| N | number of neurons | 4 | — |
| ξ^μ | pattern μ (∈ {±1}^N) | [1,1,−1,−1] | — |
| w_ij | weight (1/N)Σ_μ ξ^μ_i ξ^μ_j | 1/4 for i≠j, 0 diagonal | algebraic |
| E | energy −½ΣΣ w_ij s_i s_j | −(N−1)/2 = −1.5 for stored | algebraic |
| c | capacity ~0.138N | — | cited-not-fetched |

### Domain validation (R4)

| Parameter | Guard | RangeError |
|---|---|---|
| patterns | all ∈ {±1} | `HopfieldModel: patterns must be ±1` |
| N | ≥ 1 | `HopfieldModel: N must be ≥ 1` |
| state | same length as N | `HopfieldModel: state length must equal N` |

### Model class

```javascript
export class HopfieldModel {
  constructor({ N, patterns })  // patterns: number[][] of ±1
  setWeights()                  // Hebbian: w_ij = (1/N)Σ ξ^μ_i ξ^μ_j
  energy(state)                 // −½ Σ_{i≠j} w_ij s_i s_j
  asyncUpdate(state)            // update one neuron deterministically; return new state
  asyncRun(state, maxSteps)     // iterate until fixed point or maxSteps
  overlapWith(state, mu)        // m^μ = (1/N) Σ_i ξ^μ_i s_i (order parameter)
}
```

### Anchor → test table

| Test name | Anchor | Tolerance | Source |
|---|---|---|---|
| `w_01 = 1/4 for N=4, single pattern` | 1/N | === 1/4 | algebraic |
| `w_02 = −1/4` | −1/N | === −1/4 | algebraic |
| `E_stored = −(N−1)/2 = −1.5` | formula | 1e-14 abs | algebraic |
| `E_inverted = E_stored (symmetry)` | E(−ξ)=E(ξ) | 1e-14 abs | algebraic |
| `E_orthogonal > E_stored` | ordering | boolean | algebraic |
| `recall from 1-bit error (N=4)` | converges to ξ | exact match | algebraic |
| `asyncUpdate decreases E` | E_before ≥ E_after | boolean | algebraic |
| `overlapWith stored pattern = 1` | m^μ = 1 | 1e-14 abs | algebraic |
| `patterns not ±1 throws RangeError` | guard | throw | — |

### Predict questions

1. Store two orthogonal patterns. What happens to the energy of a state between them?
   *(Answer: E = (1−N·m²)/2; a mixture state has m∈(−1,1) relative to each pattern → energy between E_stored=−(N−1)/2 and E_orth=+1/2; the mixture is a spurious attractor — a local energy minimum not corresponding to any stored pattern)*
2. Set all weights to zero. What does the energy landscape look like?
   *(Answer: flat E=0; no attractors — all states are fixed points)*
3. With N=4 neurons, what is the maximum number of reliably stored patterns?
   *(Answer: ~0.138×4 ≈ 0.55 → 0 or 1 pattern; 2 patterns leads to interference)*

### Derive it

1. Hebbian rule: w_ij ∝ E[ξ_i·ξ_j] — Hebb's postulate (co-activation strengthens synapses)
2. Energy E = −½ s^T W s (with w_ii=0); this is negative definite at stored patterns
3. Async update: s_i ← sign(h_i) where h_i = Σ_j w_ij s_j; ΔE = −(|h_i| − s_old·h_i) ≤ 0
   (s_old is state BEFORE update; general formula: E = (1−N·m²)/2 where m = (1/N)Σ ξ_i s_i)
4. Convergence: energy bounded below → always reaches fixed point

### Research papers

| Authors | Year | Title | DOI | Status |
|---|---|---|---|---|
| Hopfield, J.J. | 1982 | Neural networks and physical systems with emergent collective computational abilities | 10.1073/pnas.79.8.2554 | cited-not-fetched |
| Amit, Gutfreund & Sompolinsky | 1985 | Storing infinite numbers of patterns in a spin-glass model of neural networks | 10.1103/PhysRevLett.55.1530 | cited-not-fetched |

### Where it breaks

- Hebbian weights require O(N²) storage; biologically implausible.
- Binary ±1 neurons; real neurons are graded and stochastic.
- Capacity ~0.138N is for random uncorrelated patterns; correlated patterns capacity drops sharply.
- Spurious states (mixtures, reversed patterns) exist alongside stored patterns.

---

## Bench 5 — Reinforcement Learning (Q-learning)

### Critical trap

**Convergence of Q-learning requires two conditions** (Watkins & Dayan 1992):
1. Every (s,a) pair visited infinitely often (exploration requirement)
2. Learning rates α_t satisfy Σα_t = ∞ and Σα_t² < ∞

A fixed learning rate violates condition 2 and produces a biased estimate (not Q*)
but still converges to a neighbourhood. Tests must distinguish between Bellman
correctness (algebraic, exact) and empirical convergence (MC, approximate).

### Symbol table

| Symbol | Meaning | Test value | Status |
|---|---|---|---|
| γ | discount factor | 0.9 | parameter |
| α | learning rate | 0.1 | parameter |
| ε | exploration rate | 0.1 | parameter |
| R | reward | 1 (terminal) | parameter |
| Q*(s,a) | optimal action-value | V*(s0)=1 (2-state) | algebraic |
| δ | TD error R+γ·maxQ(s')−Q(s) | 0 at Q* | algebraic |
| γ* | threshold discount | 10^{-1/4} = 0.5623 | algebraic |

### Domain validation (R4)

| Parameter | Guard | RangeError |
|---|---|---|
| gamma | ∈ [0,1) | `RLModel: gamma must be in [0,1)` |
| alpha | ∈ (0,1] | `RLModel: alpha must be in (0,1]` |
| epsilon | ∈ [0,1] | `RLModel: epsilon must be in [0,1]` |

### Model class

```javascript
export class RLModel {
  constructor({ states, actions, gamma = 0.9, alpha = 0.1, epsilon = 0.1 })
  Q(s, a)                    // current Q-value
  setQ(s, a, value)          // set Q-value
  bestAction(s)              // argmax_a Q(s,a)
  epsilonGreedy(s)           // ε-greedy action selection
  update(s, a, r, sNext)     // Q-learning update step
  bellmanError()             // max |Q(s,a) - r - γ·max Q(s',a')| (for testing)
}
```

### Anchor → test table

| Test name | Anchor | Tolerance | Source |
|---|---|---|---|
| `V*(s0)=1 for 2-state MDP` | algebraic | 1e-12 abs | algebraic |
| `TD error at Q* = 0` | Bellman | 1e-14 abs | algebraic |
| `V*(s0)=0.9 for 3-chain` | γ·V*(s1)=0.9 | 1e-12 abs | algebraic |
| `G_discounted = 0.81 (2 steps)` | γ²·R = 0.81 | 1e-14 abs | algebraic |
| `P(optimal|ε=0.1, |A|=2) = 0.95` | algebraic | 1e-14 abs | algebraic |
| `Q-learning converges to Q* (MC)` | |Q−Q*|<0.1 | 0.1 abs | MC (10000 ep) |
| `γ* = 10^{-1/4} = 0.5623413251903491` | threshold discount | 1e-14 abs | algebraic |
| `P(reach 8 before 0, start=2) = 1/4` | gambler's ruin | exact | algebraic |
| `V*(γ=0.9, start=2, via +10) = 5.31441` | 0.9^6·10 | 1e-10 abs | algebraic |
| `gamma≥1 throws RangeError` | guard | throw | — |

### Predict questions

1. In the corridor (start=2, terminals 0(+1) and 8(+10)): at what γ does the agent switch from preferring +1 to preferring +10?
   *(Answer: γ* = 10^{-1/4} ≈ 0.562; below γ* agent prefers +1 (2 steps), above γ* prefers +10 (6 steps))*
2. Set ε=0 (no exploration). Can Q-learning get stuck?
   *(Answer: yes — if Q initialised to 0, may never explore suboptimal but informative paths)*
3. Set α=1. What happens to previous experience?
   *(Answer: completely replaced by latest sample; unstable for stochastic rewards)*

### Derive it

1. Markov Decision Process: (S, A, P, R, γ)
2. Bellman optimality: Q*(s,a) = E[R + γ·max_{a'} Q*(s',a')]
3. Q-learning update: Q←Q + α·[R + γ·maxQ(s')−Q]; stochastic approximation of Bellman
4. Convergence: tabular Q-learning converges to Q* under Robbins-Monro conditions

### Research papers

| Authors | Year | Title | DOI | Status |
|---|---|---|---|---|
| Watkins & Dayan | 1992 | Q-learning | 10.1007/BF00992698 | cited-not-fetched |
| Sutton & Barto | 2018 | Reinforcement Learning 2nd ed., MIT Press | — | cited-not-fetched |

### Where it breaks

- Tabular Q-learning scales as O(|S|×|A|); intractable for large state spaces.
- ε-greedy is a strong simplification of exploration; Boltzmann / UCB better in practice.
- Assumes Markovian transitions; partial observability requires POMDP/belief-state methods.
- Non-stationary rewards (R changes over time) require adaptive learning rates.

---

## Bench 6 — Auctions

### Critical trap

**Symmetric IPV and asymmetric IPV have different BNE strategies.** The bench
must be explicit that the first-price BNE formula b*(v) = (N−1)/N·v applies only
to symmetric independent private values with uniform [0,1] distribution.

The Revenue Equivalence Theorem is an algebraic identity for symmetric IPV; testing
it for non-uniform distributions requires numerical integration.

### Symbol table

| Symbol | Meaning | Test value | Status |
|---|---|---|---|
| N | number of bidders | 2, 3 | parameter |
| v | private value | uniform [0,1] | parameter |
| b*(v,N) | BNE bid | (N−1)/N·v | algebraic |
| E[R] | expected revenue | (N−1)/(N+1) | algebraic |
| r* | optimal reserve | 0.5 for uniform [0,1] | algebraic |

### Domain validation (R4)

| Parameter | Guard | RangeError |
|---|---|---|
| N | ≥ 2 | `AuctionModel: N must be ≥ 2` |
| v | ∈ [0,1] | `AuctionModel: v must be in [0,1]` |
| distribution | 'uniform' (Phase 10) | — |

### Model class

```javascript
export class AuctionModel {
  constructor({ N, distribution = 'uniform' })
  bneBid(v)             // (N-1)/N * v  for symmetric IPV uniform
  expectedRevenue()     // (N-1)/(N+1)
  optimalReserve()      // 0.5 for uniform [0,1]
  truthfulBid(v)        // v (Vickrey dominant strategy)
  // Simulation:
  simulateFirstPrice(nTrials, rng)   // Monte Carlo revenue estimate
  simulateSecondPrice(nTrials, rng)  // Vickrey revenue estimate
}
```

### Anchor → test table

| Test name | Anchor | Tolerance | Source |
|---|---|---|---|
| `b*(0.8, N=2) = 0.4` | (N−1)/N·v = 0.4 | === 0.4 | algebraic |
| `b*(0.8, N=3) = 8/15` | 2/3·0.8 | 1e-14 abs | algebraic |
| `E[revenue] N=2 = 1/3` | (N−1)/(N+1) | 1e-14 abs | algebraic |
| `E[revenue] N=3 = 1/2` | 3/4 | 1e-14 abs | algebraic |
| `revenue equivalence: E[R_1st] = E[R_2nd]` | 0 difference | 1e-14 abs | algebraic |
| `optimal reserve = 0.5 (uniform)` | 1/2 | === 0.5 | algebraic |
| `MC first-price revenue ≈ 1/3 (N=2)` | 4·SE | MC n=1e5 | MC |
| `N<2 throws RangeError` | guard | throw | — |

### Predict questions

1. Add a 4th bidder. Does expected revenue increase? By how much?
   *(Answer: E[R] = 3/5 = 0.60 vs 1/2 = 0.50 for N=3; +10pp)*
2. Vickrey's dominant strategy requires no knowledge of others' values. Why?
   *(Answer: truthful bidding weakly dominates regardless of opponents' strategies — prove by cases)*
3. What is the seller's optimal reserve price when bidders value at uniform [0,1]?
   *(Answer: r*=0.5, because virtual value v−(1−F(v))/f(v) = 2v−1 = 0 at v=0.5)*

### Derive it

1. BNE for symmetric IPV: bidder maximises (v−b)·P(win) = (v−b)·F(b*(v))^{N−1}
2. FOC: (v−b)·f(b*)/b*' + F(b*)^{N−1} = 0 → ODE for b*(v) → b*(v) = E[max(V₁,...,V_{N-1})|V≤v]
3. For uniform [0,1]: E[max_{j<N}V_j | V_j<v] = v(N−1)/N → b*(v) = (N−1)/N·v
4. Revenue equivalence: all symmetric efficient auctions yield same seller revenue

### Research papers

| Authors | Year | Title | DOI | Status |
|---|---|---|---|---|
| Vickrey | 1961 | Counterspeculation, auctions, and competitive sealed tenders | 10.1111/j.1540-6261.1961.tb02789.x | cited-not-fetched |
| Myerson | 1981 | Optimal auction design | 10.1287/moor.6.1.58 | cited-not-fetched |

### Where it breaks

- Common value auctions (oil tracts, company takeovers): winner's curse — winning reveals
  your value estimate was too high; optimal bid must shade further.
- Asymmetric bidders: BNE has no closed form for general distributions.
- Collusion: bidding rings can sustain prices near reserve; mechanism must be robust.
- Risk-averse bidders: bid higher in first-price (overpay relative to risk-neutral BNE).

---

## Bench 7 — Voting Systems

### Critical trap

**Arrow's impossibility theorem** states that no voting rule for ≥3 alternatives
satisfies all of: unanimity, IIA (independence of irrelevant alternatives), and
non-dictatorship simultaneously. The bench must clearly label which property each
counterexample violates — plurality fails IIA, Borda fails IIA, etc.

**Do not claim Condorcet is "the best"** — the Condorcet winner does not always exist
(the paradox must be demonstrated).

### Symbol table

| Symbol | Meaning | Test value | Status |
|---|---|---|---|
| n_voters | number of voters | 3 | parameter |
| n_alts | number of alternatives | 3 | parameter |
| Borda score | Σ(n_alts−1−rank) | A=B=C=3 (paradox) | algebraic |
| Condorcet win | beats all pairwise | none (paradox) | algebraic |

### Domain validation (R4)

| Parameter | Guard | RangeError |
|---|---|---|
| preferences | valid permutations | `VotingModel: preference must be a permutation` |
| n_alts | ≥ 2 | `VotingModel: must have at least 2 alternatives` |

### Model class

```javascript
export class VotingModel {
  constructor({ alternatives, preferences })  // preferences: number[][] (voter→ranked alt indices)
  pluralityWinner()            // alt with most first-place votes (or null for tie)
  bordaScores()                // {alt: score} object
  bordaWinner()                // alt with max Borda score (or null for tie)
  condorcetWinner()            // alt beating all others pairwise (or null if cycle)
  pairwiseMatrix()             // M[i][j] = # voters preferring i over j
  condorcetCycle()             // boolean — cycle exists (A>B>C>...>A)
}
```

### Anchor → test table

| Test name | Anchor | Tolerance | Source |
|---|---|---|---|
| `Condorcet cycle: A beats B 2:1` | 2 | === 2 | algebraic |
| `Condorcet cycle: B beats C 2:1` | 2 | === 2 | algebraic |
| `Condorcet cycle: C beats A 2:1` | 2 | === 2 | algebraic |
| `condorcetWinner() = null for cycle` | null | === null | algebraic |
| `Borda tie A=B=C=3` | 3 each | === 3 | algebraic |
| `bordaWinner() = null for tie` | null | === null | algebraic |
| `Condorcet winner exists when A beats all` | A | === 'A' | algebraic |
| `pluralityWinner = null for 3-way tie` | null | === null | algebraic |
| `pairwiseMatrix[i][j] + pairwiseMatrix[j][i] = n_voters` | sum | === 3 | algebraic |
| `12 cycles in 216 three-voter profiles` | 12 | === 12 | exhaustive |
| `Borda winner ≠ Condorcet loser (3 alts)` | 0 counterexamples | === 0 | exhaustive |
| `Borda: B wins 3xABC+2xBCA (B>A in Borda)` | B_score=7, A_score=6 | exact | algebraic |
| `invalid permutation throws RangeError` | guard | throw | — |

### Predict questions

1. Add a 4th voter with preference C>B>A. Does A still win pairwise?
   *(Answer: depends on pairing; now need to recount — C>A becomes 3:1)*
2. Can the Borda winner be a Condorcet loser?
   *(Answer: NO for 3 alternatives — exhaustive proof: with 3 alts, Borda(X) = #{X>Y}+#{X>Z} = total pairwise wins, so Condorcet loser (min pairwise wins) = min Borda score. Exhaustively verified over all 216 three-voter profiles. YES for 4+ alternatives (Fishburn 1974).)*
3. Manipulate the ballot by adding an "irrelevant" 4th alternative. Can the Borda winner change?
   *(Answer: yes — Borda fails IIA; this is Arrow's IIA violation)*

### Derive it

1. Condorcet: pairwise majority tournament on all (n,2) pairs
2. Borda: each voter assigns n−1−rank points; sum over voters
3. Plurality: count first-place votes only
4. Arrow's theorem: no rule satisfies unanimity + IIA + non-dictatorship for ≥3 alts
5. Gibbard-Satterthwaite: any non-dictatorial rule for ≥3 alts is strategically manipulable

### Research papers

| Authors | Year | Title | DOI | Status |
|---|---|---|---|---|
| Arrow, K. | 1951 | Social Choice and Individual Values | — | cited-not-fetched |
| Condorcet | 1785 | Essai sur l'application de l'analyse... | — | cited-not-fetched |

### Where it breaks

- All methods assume sincere voting; strategic voting changes outcomes.
- Spatial models (Downsian) assume single-peaked preferences — Condorcet winner exists.
- Approval/score voting not covered; they bypass some Arrow impossibilities.
- Real elections have turnout effects, information cascades, polarisation dynamics.
