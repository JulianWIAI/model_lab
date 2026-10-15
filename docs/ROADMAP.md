# Roadmap

## Phase 4 benches (complete)

| Bench | Path | Status |
|---|---|---|
| Logistic growth | biology/ecology/logistic | ✓ done |
| Predator–prey (Lotka–Volterra) | biology/ecology/predator-prey | ✓ done |
| SIR epidemic model | biology/ecology/sir | ✓ done |
| Truncation selection | biology/evolution/selection | ✓ done |
| Nernst cell (Daniell cell) | chemistry/electrochemistry/nernst-cell | ✓ done |
| Hess's law | chemistry/thermodynamics/hess | ✓ done |
| VSEPR geometries | chemistry/bonding/vsepr | ✓ done |

New catalog fields added in Phase 4: Biology → Ecology, Biology → Evolution,
Chemistry → Electrochemistry, Chemistry → Bonding.

---

## Phase 3 benches (complete)

| Bench | Path | Status |
|---|---|---|
| Hill binding | biology/biochemistry/hill-binding | ✓ done |
| Goldman equation | neuroscience/electrophysiology/goldman | ✓ done |
| Rate laws | chemistry/kinetics/rate-laws | ✓ done |
| A→B→C mechanisms | chemistry/kinetics/mechanisms | ✓ done |
| Ideal gas | physics/thermodynamics/ideal-gas | ✓ done |
| Maxwell–Boltzmann | physics/thermodynamics/maxwell-boltzmann | ✓ done |
| Van der Waals | physics/thermodynamics/van-der-waals | ✓ done |
| Gibbs free energy | chemistry/thermodynamics/gibbs | ✓ done |

New catalog fields added in Phase 3: Chemistry → Kinetics, Chemistry → Thermodynamics,
Physics → Thermodynamics.

---

## Curriculum map

Every bench has a testable anchor: an analytic solution, published numerical value, or named
textbook result that a unit test can verify.  ✓ = already built.  Levels: intro / university / graduate.

---

### Physics (17 benches, 5 built)

#### Mechanics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| pendulum ✓ | Pendulum | sim | intro | T = 2π√(L/g) small-angle; exact Bessel period at large amplitude |
| orbits | Planetary orbits | sim | intro | circular period T = 2π√(a³/GM); Kepler III: T²∝a³ |
| oscillators | Driven oscillator & resonance | sim | intro | amplitude peak at ω = ω₀ (zero damping); Q = ω₀/(2γ) |
| special-relativity | Special relativity | sim | university | γ = 1/√(1−β²); muon at β=0.9994 lives 28× longer than at rest |

#### Waves & Optics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| wave-interference | Wave interference (double-slit) | sim | intro | fringe spacing Δy = λL/d; first dark fringe at d·sinθ = λ/2 |
| standing-waves | Standing waves | sim | intro | harmonics f_n = n·v/(2L); ratio f_2/f_1 = 2 exactly |

#### Electromagnetism

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| rc-circuit | RC circuit | sim | intro | V(t) = V₀·e^(−t/RC); half-life = RC·ln 2 |
| lc-oscillator | LC/RLC oscillator | sim | university | ω₀ = 1/√(LC); critical damping when R = 2√(L/C) |

#### Thermodynamics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| ideal-gas ✓ | Ideal gas simulation | sim | university | P = NkT/V; ⟨KE⟩ = 3/2 kT (exact in reduced units) |
| maxwell-boltzmann ✓ | Maxwell–Boltzmann | sim | university | v_p : v̄ : v_rms = 1 : 1.128 : 1.225 (exact ratios) |
| van-der-waals ✓ | Van der Waals | sim | university | Z_c = 3/8 = 0.375 (Onsager; exact algebraic result) |
| carnot | Carnot engine | sim | intro | η_max = 1 − T_c/T_h; T_h=500 K, T_c=300 K → η = 0.40 |
| entropy-mixing | Entropy of mixing | sim | intro | ΔS = −nR·Σx_i·ln x_i; equimolar binary → nR·ln 2 ≈ 5.76 J/(mol·K) |

#### Statistical Mechanics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| ising | Ising model | sim | university | 2D critical T_c = 2J/[k_B·ln(1+√2)] ≈ 2.269 J/k_B (Onsager 1944) |

#### Quantum Mechanics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| particle-in-box | Particle in a box | sim | intro | E_n = n²π²ℏ²/(2mL²); E_2/E_1 = 4 exactly |
| quantum-tunneling | Quantum tunnelling | sim | university | T = [1 + V₀²·sinh²(κa)/(4E(V₀−E))]⁻¹; T → 1 as V₀ → 0 |

#### Particle Physics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| quarks ✓ | Quarks | explorer | university | proton = uud; mass ≈ 938 MeV/c² from quark + binding contributions |

---

### Neuroscience (12 benches, 2 built)

#### Electrophysiology

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| neuron ✓ | Action potential (HH) | sim | university | spike threshold, refractory period; TTX blocks Na⁺ channel |
| goldman ✓ | Goldman equation (GHK) | sim | university | Vm(squid rest) ≈ −59.9 mV; Vm → E_K when P_Na, P_Cl → 0 |
| integrate-and-fire | Integrate-and-fire neuron | sim | university | steady-state f = 1/(t_ref + τ_m·ln[I/(I − g_L·V_th)]); fires only above threshold I |
| cable-equation | Passive cable & dendrite | sim | university | V(x) = V₀·e^(−x/λ); space constant λ = √(r_m/r_i) |

#### Synapses & Plasticity

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| synapse-kinetics | Synaptic waveforms | sim | intro | alpha-function peak at t = τ; EPSP decay time constant |
| stdp | Spike-timing-dependent plasticity | sim | university | LTP for pre→post Δt>0; Bi & Poo (1998) τ⁺ ≈ τ⁻ ≈ 20 ms |
| hebbian-learning | Hebbian learning (Oja rule) | sim | university | weight ‖w‖ → 1; w aligns with first PC of input (Oja 1982) |

#### Networks & Coding

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| hopfield | Hopfield network | sim | university | storage capacity ≈ 0.138N patterns (McEliece et al. 1987); energy E = −½Σw_{ij}s_is_j |
| population-coding | Neural population coding | sim | university | decoding error ∝ 1/√N (Fisher information); population vector readout |
| wilson-cowan | Wilson–Cowan E–I model | sim | university | fixed points from nullcline intersections; Hopf bifurcation → limit cycle (Wilson & Cowan 1972) |

#### Sensory Systems

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| receptive-fields | Visual receptive fields | explorer | university | Gabor filter peak SF at chosen ν; orientation bandwidth ≈ 30° (DeValois et al. 1982) |
| perceptron | Perceptron | sim | university | converges in ≤ (R/γ)² steps for linearly separable data (Rosenblatt 1962) |

---

### Mathematics (12 benches, 1 built)

#### Analysis

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| fourier ✓ | Fourier series | sim | university | square-wave Gibbs overshoot → 8.9% as N → ∞ (exact) |
| ode-explorer | ODE explorer | sim | intro | Euler error O(h), RK4 error O(h⁴); exact check: y'=−y gives y=e^(−t) |

#### Dynamical Systems

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| logistic-map | Logistic map & chaos | sim | university | period-2 onset at r=3.000; Feigenbaum δ ≈ 4.669 (Feigenbaum 1978) |
| mandelbrot | Mandelbrot set | explorer | university | period-1 cardioid boundary: c inside iff |c−1/4|<1/4 (approx); period-2 bulb centre at c=−1 |
| phase-plane | Phase plane & stability | sim | university | stable node when tr<0, det>0, tr²>4det; eigenvalues of Jacobian classify equilibria |

#### Probability & Statistics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| central-limit | Central limit theorem | sim | intro | SE = σ/√n; 95% CI coverage verified by simulation |
| markov-chains | Markov chains | sim | university | 2-state stationary distribution: π₁ = p₂₁/(p₁₂+p₂₁) (exact) |
| bayes | Bayesian inference | sim | intro | beta-binomial posterior Beta(α+k, β+n−k) after k heads in n flips (exact) |
| random-walk | Random walk & diffusion | sim | intro | ⟨x²⟩ = n steps; ⟨|x|⟩ = √(2n/π) (exact); 2D: ⟨r²⟩ = 2Dt (Einstein 1905) |

#### Linear Algebra

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| eigenvectors | Eigenvalues, PCA | sim | university | power iteration → dominant eigenvector; for [[2,1],[1,2]] eigenvalues = 3,1 (exact) |

#### Graph Theory

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| graph-theory | Graph theory | explorer | university | Euler's formula V−E+F=2; handshaking 2|E|=Σdeg(v); Dijkstra shortest path |
| information-theory | Information theory | sim | university | H = −Σp_i·log₂p_i; H_max = log₂n for uniform (exact); Shannon capacity C = B·log₂(1+SNR) |

---

### Economics (12 benches, 1 built)

#### Markets

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| tax ✓ | Tax incidence | sim | intro | DWL = ½·t·ΔQ; burden split = ratio of elasticities |
| supply-demand | Supply & demand | sim | intro | equilibrium P*, Q* at intersection; CS = ½(P_max−P*)Q* (linear case) |
| elasticity | Price elasticity | sim | intro | unit elastic E_d = −1 → revenue PQ constant; Lerner index = −1/E_d at monopoly optimum |

#### Game Theory

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| nash-equilibria | Nash equilibria | sim | university | matching pennies unique NE at (½,½); Battle of Sexes: two pure + one mixed NE (Nash 1950) |
| auctions | Auction theory | sim | university | Vickrey second-price: dominant strategy = bid true value (Vickrey 1961); revenue equivalence theorem |

#### Growth & Macroeconomics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| compound-growth | Compound growth | sim | intro | doubling time = ln 2/r ≈ 72/r%; Rule of 72; A = P·e^(rt) continuous limit |
| solow | Solow growth model | sim | university | steady state k* = [sA/(n+δ)]^{1/(1−α)} (Cobb-Douglas); golden rule α·f(k_GR) = (n+δ)·k_GR (Solow 1956) |

#### Finance

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| compound-interest | Compound interest & NPV | sim | intro | (1+1/n)^n → e as n → ∞ (exact); PV = FV·e^(−rT) |
| options-pricing | Options pricing (Black-Scholes) | sim | graduate | put-call parity C−P = S−K·e^(−rT); at expiry C = max(S−K, 0) (Black & Scholes 1973) |

#### Voting & Social Choice

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| voting-systems | Voting systems | explorer | intro | Condorcet paradox: A>B>C>A preference cycle; Arrow's impossibility theorem |

#### Network Economics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| network-effects | Network effects | sim | intro | Metcalfe value V ∝ n²; tipping point in two-sided markets; S-curve adoption (Schelling 1971 type) |
| inequality | Lorenz curve & inequality | sim | intro | Gini(Pareto α) = 1/(2α−1); Gini(uniform [0,b]) = 1/3 (exact) |

---

### Psychology & Cognition (12 benches, 0 built)

#### Perception & Psychophysics

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| signal-detection | Signal detection theory | sim | intro | d' = z(H) − z(FA); at d'=1: H=0.841, FA=0.159 (unit normal separation, exact) |
| weber-fechner | Weber–Fechner & Stevens | sim | intro | S = k·I^n; for brightness n≈0.33: doubling S requires 8× increase in I (Stevens 1957) |
| psychometric-function | Psychometric functions | sim | university | Weibull P(x) = 1−exp(−(x/α)^β); threshold at 75% criterion; 2AFC: P = Φ(d'/√2) |

#### Learning & Decision

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| rescorla-wagner | Rescorla–Wagner model | sim | intro | asymptote V_A = λ; blocking: ΔV_B ≈ 0 when V_A already = λ (Rescorla & Wagner 1972) |
| drift-diffusion | Drift–diffusion model | sim | university | P(correct) = 1/(1+e^(−2μa/σ²)); mean RT = (a/2μ)·tanh(μa/σ²) + t_0 (Ratcliff 1978) |
| reinforcement-learning | Reinforcement learning (Q-learning) | sim | university | Bellman: Q*(s,a) = R + γ·max Q*(s',a'); converges to Q* with ε-greedy exploration (Watkins & Dayan 1992) |
| bayesian-observer | Bayesian sensory combination | sim | university | σ_comb = 1/√(1/σ₁²+1/σ₂²); for σ₁=σ₂ → σ/√2; weights ∝ 1/σ² (Ernst & Banks 2002) |

#### Social & Cognitive

| id | title | kind | level | testable anchor |
|---|---|---|---|---|
| prisoner-dilemma | Prisoner's dilemma (repeated) | sim | intro | single-play NE = (Defect,Defect); cooperation iff δ ≥ (T−R)/(T−P) (grim trigger; Axelrod 1984) |
| opinion-dynamics | Opinion dynamics | sim | university | Deffuant bounded-confidence: consensus for ε>0.5; polarisation for ε<0.5 (Deffuant et al. 2000) |
| forgetting | Ebbinghaus forgetting curve | sim | intro | R(t) = e^(−t/S); retention ≈ 58% at 20 min, ≈ 33% at 1 day (Ebbinghaus 1885 data) |
| matching-law | Matching law | sim | university | B₁/B₂ = R₁/R₂; at equal reward rates, 50% allocation; generalised: B_i = R_i/(ΣR + k) (Herrnstein 1961) |
| serial-position | Serial position effect | sim | university | U-shaped free recall; items 1–3 and last 3 recalled >70% in Murdock (1962) published data |

---

### Biology & Chemistry — remaining planned benches

These add to the fields already built in Phases 1–4.

#### Biology

| id | title | field | kind | level | testable anchor |
|---|---|---|---|---|---|
| competitive-exclusion | Competitive exclusion (LV) | ecology | sim | university | coexistence iff α₁₂·α₂₁ < 1; x* = (K₁−α₁₂K₂)/(1−α₁₂α₂₁) (Lotka-Volterra; Gause 1934) |
| age-structure | Age-structured populations | ecology | sim | university | dominant eigenvalue λ = asymptotic growth rate; stable age dist = dominant eigenvector (Leslie 1945) |
| pharmacokinetics | Pharmacokinetics (1-compartment) | physiology | sim | university | C(t) = C₀·e^(−ke·t); t_{1/2} = ln 2/ke; clearance CL = Vd·ke (Rowland & Tozer) |

#### Chemistry

| id | title | field | kind | level | testable anchor |
|---|---|---|---|---|---|
| radioactive-decay | Radioactive decay | nuclear | sim | intro | N(t) = N₀·2^(−t/t_{1/2}); t_{1/2}(¹⁴C) = 5730 y (published); t = t_{1/2}·log₂(N₀/N) |
| phase-diagram | Phase diagrams (Clausius-Clapeyron) | thermodynamics | sim | university | dP/dT = ΔH_vap/(T·ΔV); water boils at 100°C when P = 1 atm (exact by definition) |
| butler-volmer | Butler-Volmer electrode kinetics | electrochemistry | sim | graduate | i = i₀[exp(αFη/RT)−exp(−(1−α)Fη/RT)]; Tafel slope = RT/(αF)·ln10 ≈ 118 mV/dec for α=0.5 |

---

## Phase plan (Phases 5–13)

Seven benches per phase.  Order prioritises intro-level accessibility, then builds
on established infrastructure.  All phases require `npm test` green before committing.

| Phase | Bench (id) | Subject | Level |
|---|---|---|---|
| **5** | rc-circuit | Physics | intro |
| 5 | radioactive-decay | Chemistry | intro |
| 5 | supply-demand | Economics | intro |
| 5 | signal-detection | Psychology | intro |
| 5 | weber-fechner | Psychology | intro |
| 5 | central-limit | Math | intro |
| 5 | compound-growth | Economics | intro |
| **6** | orbits | Physics | intro |
| 6 | oscillators | Physics | intro |
| 6 | ode-explorer | Math | intro |
| 6 | logistic-map | Math | university |
| 6 | integrate-and-fire | Neuroscience | university |
| 6 | rescorla-wagner | Psychology | intro |
| 6 | compound-interest | Economics | intro |
| **7** | wave-interference | Physics | intro |
| 7 | standing-waves | Physics | intro |
| 7 | synapse-kinetics | Neuroscience | intro |
| 7 | eigenvectors | Math | university |
| 7 | nash-equilibria | Economics | university |
| 7 | prisoner-dilemma | Psychology | intro |
| 7 | bayes | Math | intro |
| **8** | particle-in-box | Physics | intro |
| 8 | carnot | Physics | intro |
| 8 | markov-chains | Math | university |
| 8 | drift-diffusion | Psychology | university |
| 8 | phase-plane | Math | university |
| 8 | competitive-exclusion | Biology | university |
| 8 | pharmacokinetics | Biology | university |
| **9** | entropy-mixing | Physics | intro |
| 9 | stdp | Neuroscience | university |
| 9 | cable-equation | Neuroscience | university |
| 9 | random-walk | Math | intro |
| 9 | solow | Economics | university |
| 9 | opinion-dynamics | Psychology | university |
| 9 | forgetting | Psychology | intro |
| **10** | lc-oscillator | Physics | university |
| 10 | quantum-tunneling | Physics | university |
| 10 | hopfield | Neuroscience | university |
| 10 | reinforcement-learning | Psychology | university |
| 10 | auctions | Economics | university |
| 10 | voting-systems | Economics | intro |
| 10 | age-structure | Biology | university |
| **11** | ising | Physics | university |
| 11 | population-coding | Neuroscience | university |
| 11 | wilson-cowan | Neuroscience | university |
| 11 | psychometric-function | Psychology | university |
| 11 | bayesian-observer | Psychology | university |
| 11 | graph-theory | Math | university |
| 11 | elasticity | Economics | intro |
| **12** | special-relativity | Physics | university |
| 12 | options-pricing | Economics | graduate |
| 12 | inequality | Economics | intro |
| 12 | network-effects | Economics | intro |
| 12 | receptive-fields | Neuroscience | university |
| 12 | perceptron | Neuroscience | university |
| 12 | hebbian-learning | Neuroscience | university |
| **13** | mandelbrot | Math | university |
| 13 | information-theory | Math | university |
| 13 | phase-diagram | Chemistry | university |
| 13 | butler-volmer | Chemistry | graduate |
| 13 | matching-law | Psychology | university |
| 13 | serial-position | Psychology | university |

**Total planned:** 62 new benches across 9 phases (Phases 5–13).
**Cumulative total at Phase 13:** 97 benches (35 built + 62 planned).

---

## Open science-accuracy items

### Verify pKa sources for phosphoric and citric acid

`BufferModel.js` cites Martell & Smith *Critical Stability Constants* (Vol. 3 and 4)
for the phosphoric and citric acid pKa values.  The table numbers have **not** been
verified against physical copies; the values are confirmed consistent with Skoog et al.
2014 and Wikipedia (I→0 extrapolations), but an independent primary-source check is
still outstanding.

- Phosphoric acid: 2.148, 7.198, 12.375 (pKa3 uncertain: 12.35–12.40 across sources)
- Citric acid: 3.128, 4.761, 6.396

Primary source to check: Martell & Smith, *Critical Stability Constants*,
Vol. 3 (1977) pp. ? and Vol. 4 (1976) pp. ?.  NIST SRD 46 (the standard online check)
was discontinued.  Goldberg et al. (2002) *J. Phys. Chem. Ref. Data* 31, 231–370
(doi:10.1063/1.1416902) covers both compounds but is paywalled.

**Action:** Check physical copies of Martell & Smith, or access Goldberg 2002 via a
library, and update the `pKas` array and source comments if the values differ.
Remove the `note` field from those two presets and drop the `⚠ unverified` UI note
once verified.
