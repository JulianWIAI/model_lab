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

Every bench has a testable anchor with a named source and source status.
✓ = already built.  ★ = new bench added in this revision.  ‡ = level elevated to graduate.
Levels: intro / university / graduate.
Source status: **verified** = algebraically exact or checked during implementation;
**secondary** = textbook or paper value consistent with primary sources, not re-fetched;
**unverified** = cited but not cross-checked.

---

### Physics (19 benches, 5 built)

#### Mechanics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| pendulum ✓ | sim | intro | T = 2π√(L/g) small-angle; exact Bessel period at large amplitude | standard mechanics | verified |
| orbits | sim | intro | T = 2π√(a³/GM); Kepler III T²∝a³ | Kepler 1619; Newton *Principia* | secondary |
| oscillators | sim | intro | amplitude peak at ω = ω₀; Q = ω₀/(2γ) | algebraic | verified |
| special-relativity | sim | university | γ = 1/√(1−β²); muon at β=0.9994 lives 28× longer than at rest | algebraic + PDG muon data | secondary |

#### Waves & Optics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| wave-interference | sim | intro | fringe spacing Δy = λL/d; dark fringe at d·sinθ = λ/2 | Young 1801; algebraic | verified |
| standing-waves | sim | intro | harmonics f_n = n·v/(2L); f_2/f_1 = 2 exactly | algebraic | verified |

#### Electromagnetism

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| rc-circuit | sim | intro | V(t) = V₀·e^(−t/RC); half-life = RC·ln 2 | algebraic | verified |
| lc-oscillator | sim | university | ω₀ = 1/√(LC); critical damping when R = 2√(L/C) | algebraic | verified |

#### Thermodynamics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| ideal-gas ✓ | sim | university | P = NkT/V; ⟨KE⟩ = 3/2 kT | algebraic | verified |
| maxwell-boltzmann ✓ | sim | university | v_p : v̄ : v_rms = 1 : 1.128 : 1.225 (exact ratios) | algebraic | verified |
| van-der-waals ✓ | sim | university | Z_c = 3/8 = 0.375 exact algebraic result | Onsager; algebraic | verified |
| carnot | sim | intro | η = 1 − T_c/T_h; 500 K/300 K → η = 0.40 | algebraic | verified |
| entropy-mixing | sim | intro | ΔS = −nR·Σx_i·ln x_i; equimolar binary → nR·ln 2 | algebraic | verified |

#### Statistical Mechanics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| ising | sim | university | T_c = 2J/[k_B·ln(1+√2)] ≈ 2.269 J/k_B | Onsager 1944, *Phys. Rev.* 65:117 | secondary |
| ising-scaling ★ | sim | graduate | β = 1/8: M ~ \|T−T_c\|^(1/8); ν = 1: ξ ~ \|T−T_c\|^(−1) (exact 2D) | Onsager 1944 (exact analytic exponents) | secondary |

#### Quantum Mechanics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| particle-in-box | sim | intro | E_n = n²π²ℏ²/(2mL²); E_2/E_1 = 4 | Griffiths §2.2; algebraic | verified |
| quantum-tunneling ‡ | sim | graduate | Rectangular barrier: T = [1 + V₀²sinh²(κa)/(4E(V₀−E))]⁻¹; WKB for smooth barrier: T ~ exp(−2∫κdx) — comparison of both is the graduate exercise | Griffiths §2.6 (exact), §9.2 (WKB) | secondary |
| schrodinger-1d ★ | sim | graduate | Finite-difference eigenvalues match E_n = n²π²ℏ²/(2mL²) to ±0.1% for n = 1–5 | Griffiths §2.2; algebraic | verified |

#### Particle Physics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| quarks ✓ | explorer | university | proton = uud; mass ≈ 938 MeV/c² | PDG 2022 | verified |

---

### Neuroscience (13 benches, 2 built)

#### Electrophysiology

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| neuron ✓ | sim | university | spike threshold; TTX blocks Na⁺ | Hodgkin & Huxley 1952 | verified |
| goldman ✓ | sim | university | Vm(squid rest) ≈ −59.9 mV; Vm → E_K when P_Na, P_Cl → 0 | Hodgkin & Katz 1949 | verified |
| integrate-and-fire | sim | university | f = 1/(t_ref + τ_m·ln[I/(I − g_L·V_th)]); fires only above threshold | Lapicque 1907; Tuckwell 1988 | secondary |
| cable-equation | sim | university | V(x) = V₀·e^(−x/λ); λ = √(r_m/r_i) — steady-state analytic, no PDE solver needed | Rall 1967, *J. Neurophysiol.* 30:1138 | secondary |
| neuron-bifurcation ★ | sim | graduate | Saddle-node (type I) vs. subcritical Hopf (type II); I_∞ ≈ 9.78 μA/cm² for HH | Rinzel & Ermentrout 1989, in *Methods in Neuronal Modeling* | secondary |

#### Synapses & Plasticity

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| synapse-kinetics | sim | intro | alpha-function peak at t = τ (exact by differentiation) | algebraic | verified |
| stdp | sim | university | LTP for pre→post Δt > 0; τ⁺ ≈ τ⁻ ≈ 20 ms | Bi & Poo 1998, *J. Neurosci.* 18:10464 | secondary |
| hebbian-learning ‡ | sim | graduate | ‖w‖ → 1; w aligns with dominant eigenvector of input covariance (online PCA equivalence) | Oja 1982, *J. Math. Biol.* 15:267 | secondary |

#### Networks & Coding

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| hopfield ‡ | sim | graduate | Storage capacity ≈ 0.138N; spurious mixture states; E = −½Σw_{ij}s_is_j | McEliece et al. 1987, *IEEE Trans. IT* 33:461 | secondary |
| population-coding ‡ | sim | graduate | CRB: Var(θ̂) ≥ 1/I(θ); decoding error ∝ 1/√N for Poisson neurons | Seung & Sompolinsky 1993, *PNAS* 90:10749 | secondary |
| wilson-cowan ‡ | sim | graduate | Hopf bifurcation: Jacobian eigenvalues cross imaginary axis → limit cycle; nullcline topology | Wilson & Cowan 1972, *Biophys. J.* 12:1 | secondary |

#### Sensory Systems

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| receptive-fields | explorer | university | Gabor peak SF at chosen ν; orientation bandwidth ≈ 30° | DeValois et al. 1982, *J. Neurosci.* 2:1137 | secondary |
| perceptron | sim | university | Convergence in ≤ (R/γ)² steps for linearly separable data | Novikoff 1962 (proof); Rosenblatt 1962 | secondary |

---

### Mathematics (13 benches, 1 built)

#### Analysis

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| fourier ✓ | sim | university | Square-wave Gibbs overshoot → 8.9% as N → ∞ | algebraic (exact) | verified |
| ode-explorer | sim | intro | Euler error O(h), RK4 error O(h⁴); y'=−y → y = e^(−t) exact | algebraic | verified |

#### Dynamical Systems

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| logistic-map | sim | university | Period-2 onset at r = 3.000; Feigenbaum δ ≈ 4.669 | Feigenbaum 1978, *J. Stat. Phys.* 19:25 | secondary |
| lyapunov ★ | sim | graduate | λ = ln 2 for tent map (algebraically exact); λ > 0 for r > r_∞ ≈ 3.5699 | Tent map: verified; r_∞: Feigenbaum 1978 | verified / secondary |
| mandelbrot | explorer | university | Period-1 cardioid \|c−1/4\| < 1/4; period-2 bulb centre at c = −1 | algebraic; Mandelbrot 1980 | secondary |
| phase-plane ‡ | sim | graduate | tr < 0, det > 0, tr² > 4det → stable node; Jacobian eigenvalues + Hartman-Grobman theorem | Strogatz 2001 §5.2; algebraic | secondary |

#### Probability & Statistics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| central-limit | sim | intro | SE = σ/√n; 95% CI coverage verified by simulation | algebraic (CLT) | verified |
| markov-chains ‡ | sim | graduate | π₁ = p₂₁/(p₁₂+p₂₁) exact; spectral gap = 1−\|λ₂\|; τ_mix ≤ (1/gap)·ln(1/ε) | Algebraic; Levin et al. 2009, *Markov Chains and Mixing Times* | secondary |
| bayes | sim | intro | Posterior Beta(α+k, β+n−k) exact conjugate update | algebraic | verified |
| information-theory | sim | university | H = −Σp_i·log₂p_i; H_max = log₂n; C = B·log₂(1+SNR) | Shannon 1948, *Bell Syst. Tech. J.* 27:379 | secondary |
| random-walk | sim | intro | ⟨x²⟩ = n; ⟨\|x\|⟩ = √(2n/π); 2D ⟨r²⟩ = 2Dt | algebraic; Einstein 1905 | verified |

#### Linear Algebra

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| eigenvectors | sim | university | Power iteration → dominant eigenvector; [[2,1],[1,2]] → λ = 3, 1 exactly | algebraic | verified |

#### Graph Theory

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| graph-theory | explorer | university | V−E+F = 2; 2\|E\| = Σdeg(v); Dijkstra shortest path | Euler 1736; algebraic | secondary |

---

### Economics (12 benches, 1 built)

#### Markets

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| tax ✓ | sim | intro | DWL = ½·t·ΔQ; burden split = ratio of elasticities | algebraic | verified |
| supply-demand | sim | intro | P*, Q* at intersection; CS = ½(P_max−P*)Q* linear case | algebraic | verified |
| elasticity | sim | intro | Unit elastic E_d = −1 → PQ constant; Lerner index = −1/E_d | algebraic | verified |

#### Game Theory

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| nash-equilibria | sim | university | Matching pennies NE at (½,½); Battle of Sexes: 2 pure + 1 mixed NE | Nash 1950, *PNAS* 36:48 | secondary |
| auctions | sim | university | Vickrey: dominant strategy = bid true value; revenue equivalence theorem | Vickrey 1961, *J. Finance* 16:8 | secondary |
| mechanism-design ★ | sim | graduate | Revelation principle; optimal reserve p* = (1−F(p*))/f(p*) | Myerson 1981, *Math. Oper. Res.* 6:58 | secondary |

#### Growth & Macroeconomics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| compound-growth | sim | intro | Doubling time = ln 2/r; A = P·e^(rt); PV = FV·e^(−rT) continuous limit | algebraic | verified |
| solow | sim | university | k* = [sA/(n+δ)]^{1/(1−α)}; golden rule α·f(k_GR) = (n+δ)·k_GR | Solow 1956, *QJE* 70:65 | secondary |

#### Finance

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| options-pricing | sim | graduate | S=100, K=100, r=5%, σ=20%, T=1 → call ≈ 10.45 (algebraically computed); put-call parity C−P = S−K·e^(−rT). **Educational use only — not financial advice.** | Black & Scholes 1973, *JPE* 81:637 | secondary / verified |

#### Voting & Social Choice

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| voting-systems | explorer | intro | Condorcet paradox: A>B>C>A cycle; Arrow's impossibility theorem | Arrow 1951 (algebraic) | secondary |

#### Network Economics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| network-effects | sim | intro | Metcalfe value V ∝ n²; tipping point; S-curve adoption | Schelling 1971 type; Metcalfe | secondary |
| inequality | sim | intro | Gini(Pareto α) = 1/(2α−1); Gini(uniform [0,b]) = 1/3 | algebraic | verified |

---

### Psychology & Cognition (13 benches, 0 built)

#### Perception & Psychophysics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| signal-detection | sim | intro | d' = z(H) − z(FA); at d'=1: H=0.841, FA=0.159 | algebraic (unit normals) | verified |
| weber-fechner | sim | intro | S = k·I^n; brightness n ≈ 0.33: doubling S requires 8× increase in I | Stevens 1957, *Psychol. Rev.* 64:153 | secondary |
| psychometric-function | sim | university | Weibull P(x) = 1−exp(−(x/α)^β); 2AFC: P = Φ(d'/√2) | algebraic; Green & Swets 1966 | secondary |

#### Learning & Decision

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| rescorla-wagner | sim | intro | Asymptote V_A = λ; blocking ΔV_B ≈ 0 when V_A = λ | Rescorla & Wagner 1972, in *Classical Conditioning II* | secondary |
| drift-diffusion ‡ | sim | graduate | P(correct) = 1/(1+e^(−2μa/σ²)); mean RT = (a/2μ)·tanh(μa/σ²) + t_0 — derived via Fokker-Planck | Ratcliff 1978, *Psychol. Rev.* 85:59 | secondary |
| reinforcement-learning ‡ | sim | graduate | Bellman: Q*(s,a) = R + γ·max Q*(s',a'); convergence via stochastic approximation with ε-greedy | Watkins & Dayan 1992, *Machine Learning* 8:279 | secondary |
| bayesian-observer | sim | university | σ_comb = 1/√(1/σ₁²+1/σ₂²); for σ₁=σ₂ → σ/√2; weights ∝ 1/σ² | Ernst & Banks 2002, *Nature* 415:429 | secondary |
| bayesian-cognitive ★ | sim | graduate | P(C=1\|x₁,x₂) from GHK integral; well-separated stimuli → P(C=1) → 0; matches Körding & Wolpert (2004) Fig. 2 qualitative pattern | Körding & Wolpert 2004, *Nat. Neurosci.* 7:69 | secondary |

#### Social & Cognitive

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| prisoner-dilemma | sim | intro | Single-play NE = (D,D); cooperation iff δ ≥ (T−R)/(T−P) (grim trigger) | algebraic; Axelrod 1984 | secondary |
| opinion-dynamics | sim | university | Deffuant: consensus for ε > 0.5; polarisation for ε < 0.5 | Deffuant et al. 2000, *Adv. Complex Syst.* 3:87 | secondary |
| forgetting | sim | intro | R(t) = e^(−t/S); 58% at 20 min, 33% at 1 day | Ebbinghaus 1885 (data from tables) | secondary |
| matching-law | sim | university | B₁/B₂ = R₁/R₂; generalised: B_i = R_i/(ΣR + k) *(low priority)* | Herrnstein 1961, *J. Exp. Anal. Behav.* 4:267 | secondary |
| serial-position | sim | university | Items 1–3 and last 3 recalled > 70% *(low priority)* | Murdock 1962, *J. Exp. Psychol.* 64:482 | secondary |

#### Psychology — Where it breaks

Each model has a documented failure mode that belongs in the bench's "Break it" card.

| bench | the model cannot explain |
|---|---|
| signal-detection | Unequal-variance signal/noise; criterion shifts driven by feedback; metacognitive confidence |
| weber-fechner | Stevens power law fits many modalities better; cross-cultural differences in magnitude estimation |
| psychometric-function | Threshold depends on observer's prior; lapse-rate bias at extremes; 2AFC vs. yes–no give different d' |
| rescorla-wagner | Latent inhibition (pre-exposure retards conditioning); second-order conditioning; trial spacing effects |
| drift-diffusion | Constant drift fails when evidence accumulates non-uniformly; urgency signals; collapsing-bound strategies |
| reinforcement-learning | Non-Markovian tasks; non-stationary environments; ε-greedy is a strong simplification of exploration |
| bayesian-observer | Gaussian noise assumed; prior miscalibration produces systematic bias; people do not always weight ∝ 1/σ² |
| bayesian-cognitive | Ideal integration is computationally intractable; people show systematic deviations; prior precision unknown |
| prisoner-dilemma | Grim trigger requires perfect memory and no noise; cooperation fragile under trembling-hand perturbations |
| opinion-dynamics | Deterministic update; ignores network topology, media influence, identity-protective cognition |
| forgetting | Power-law forgetting (Wickelgren 1974) fits many datasets better than exponential; Ebbinghaus data is n = 1 |
| matching-law | Generalised matching handles bias but not concurrent VR schedules; conflates time allocation with response rate |
| serial-position | Primacy disappears in rapid-serial-visual-presentation; long-term recency challenges the modal two-store model |

---

### Biology & Chemistry — remaining planned benches

#### Biology

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| competitive-exclusion | sim | university | Coexistence iff α₁₂·α₂₁ < 1; x* = (K₁−α₁₂K₂)/(1−α₁₂α₂₁) | algebraic; Gause 1934 | secondary |
| age-structure | sim | university | Dominant eigenvalue λ = asymptotic growth rate; stable age dist = dominant eigenvector | Leslie 1945, *Biometrika* 33:183 | secondary |
| pharmacokinetics | sim | university | C(t) = C₀·e^(−ke·t); t_{1/2} = ln 2/ke; CL = Vd·ke | Rowland & Tozer, *Clinical Pharmacokinetics* 4th ed. | secondary |

#### Chemistry

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| radioactive-decay | sim | intro | N(t) = N₀·2^(−t/t_{1/2}); t_{1/2}(¹⁴C) = 5730 y | IAEA; NIST published value | secondary |
| phase-diagram | sim | university | dP/dT = ΔH_vap/(T·ΔV); water boils at 100°C at P = 1 atm | algebraic; NIST water data | secondary |
| butler-volmer | sim | graduate | i = i₀[exp(αFη/RT)−exp(−(1−α)Fη/RT)]; Tafel slope = RT/(αF)·ln10 ≈ 118 mV/dec for α = 0.5 | Bard & Faulkner 2001 §3.4 | secondary |

---

### Phase 14+ backlog

Unbuilt biology and chemistry topics not scheduled in Phases 5–13. Every item is
explicitly listed; nothing is dropped silently.

#### Phase 14 candidates

| id | title | field | level | notes |
|---|---|---|---|---|
| mwc-allosteric | MWC allosteric model | biochemistry | university | T↔R equilibrium; cooperative binding beyond Hill-equation approximation |
| turing-diffusion | Turing reaction-diffusion | development | graduate | Turing (1952) instability condition; stripe/spot wavelength λ = 2π/√k_c |
| goodwin-oscillator | Goodwin biochemical oscillator | molecular | graduate | Limit cycle when Hill n > 8 (Goodwin 1965); period from Jacobian eigenvalues |
| van-deemter | Van Deemter equation | analytical | university | H = A + B/u + Cu; optimal flow rate u_opt = √(B/C) |
| binding-energy | Nuclear binding energy | nuclear | university | Weizsäcker semi-empirical formula; Fe-56 maximum ≈ 8.79 MeV/nucleon |
| nmr-larmor | NMR Larmor precession | analytical | university | ν_L = γB₀/(2π); ¹H at 9.4 T → 400 MHz (exact from γ) |
| langmuir | Langmuir adsorption isotherm | surface | university | θ = Kp/(1+Kp); at Kp = 1, θ = 0.5 (exact) |

#### Phase 15 candidates

| id | title | field | level | notes |
|---|---|---|---|---|
| neutral-theory | Kimura neutral theory | evolution | graduate | Fixation probability 1/(2N) for neutral allele (Kimura 1968) |
| coalescence | Coalescent theory | evolution | graduate | E[T_MRCA] = 4N generations; E[S] = θ·Σ1/i (Tajima's D numerator) |
| mapk-cascade | MAPK signalling cascade | cell biology | graduate | Ultrasensitivity nH ≈ n (Huang & Ferrell 1996); bistability for n ≥ 2 |
| marcus-theory | Marcus electron-transfer | physical chemistry | graduate | k_ET = A·exp(−(ΔG°+λ)²/(4λk_BT)); activationless at ΔG° = −λ (Marcus 1956) |
| flory-polymer | Flory polymer chain statistics | physical chemistry | university | R_F = bN^ν; ν = 3/5 good solvent vs. ½ ideal chain (Flory 1953) |

#### Deferred (no phase assigned)

| id | topic | reason deferred |
|---|---|---|
| protein-folding | Protein structure & folding | Requires MD or AlphaFold API; no closed-form testable anchor |
| cell-cycle | Cell cycle control network | >10 coupled ODE species; high effort, specialist topic |
| somitogenesis | Somitogenesis clock | Spatiotemporal PDE + delay ODE; specialist topic |
| organic-mechanisms | Organic reaction mechanisms | Qualitative explorer; no single numeric anchor |
| crystal-field-theory | Crystal-field splitting | Requires matrix diagonalisation and spectroscopy data |
| immunology-clonal | Clonal selection & affinity maturation | Stochastic agent model; data-fitting required |
| pharmacodynamics | PK/PD receptor models | Extension of pharmacokinetics; schedule after that bench |
| electrophoresis | Gel electrophoresis (Ferguson plot) | Data-table bench; low algorithmic interest |
| nmr-coupling | NMR J-coupling and spin systems | Requires product-operator formalism |
| scattering | Rutherford scattering | Good intro bench; lower priority than Phases 5–13 |

---

## Shared infrastructure modules

Each module ships as its own commit (with unit tests) immediately before the first
phase that requires it.  Benches that use an analytic formula (cable-equation,
wave-interference, quantum-tunneling rectangular-barrier) need no infrastructure module.

| module | file | pre-phase | used by | key test |
|---|---|---|---|---|
| LinAlg | js/core/LinAlg.js | 7 | eigenvectors (7), markov-chains (8), hebbian-learning (12) | [[2,1],[1,2]] → eigenvalues 3, 1 (exact) |
| Random.gaussian | js/core/Random.js extension | 8 | drift-diffusion (8) | mean ≈ 0, var ≈ 1 over 10 000 samples (±3σ) |
| Complex | js/core/Complex.js | 10 | lc-oscillator (10, optional), schrodinger-1d (12) | e^(iπ) = −1 ±1e-15; multiply, modulus, arg |
| Graph | js/core/Graph.js | 11 | graph-theory (11) | Dijkstra on 5-node graph; Euler V−E+F=2 |
| PDE1D | js/core/PDE1D.js | 12 | schrodinger-1d (12) | Crank-Nicolson norm conservation ±1e-10 over 1000 steps |
| MandelbrotWorker | js/workers/MandelbrotWorker.js | 13 | mandelbrot (13) | period-1 cardioid test; c=−1 period-2 bulb |

---

## Phase plan (Phases 5–13)

`[infra]` rows are standalone commits with tests, not benches.  † = graduate.
All phases: `npm test` green before committing each item.

**Count reconciliation:**
Previous plan had 62 unbuilt benches.  This revision removes `compound-interest`
(merged into `compound-growth`; −1) and adds 6 new ★ graduate benches (+6): net 67.
Graduate: 2 original (options-pricing, butler-volmer) + 6 new ★ + 9 elevated ‡ = **17 / 67 = 25.4%**.

| Phase | id | Subject | Level |
|---|---|---|---|
| **5** | rc-circuit | Physics | intro |
| 5 | radioactive-decay | Chemistry | intro |
| 5 | supply-demand | Economics | intro |
| 5 | signal-detection | Psychology | intro |
| 5 | weber-fechner | Psychology | intro |
| 5 | central-limit | Math | intro |
| 5 | compound-growth | Economics | intro |
| **[infra]** | LinAlg.js | — | — |
| **6** | orbits | Physics | intro |
| 6 | oscillators | Physics | intro |
| 6 | ode-explorer | Math | intro |
| 6 | logistic-map | Math | university |
| 6 | integrate-and-fire | Neuroscience | university |
| 6 | rescorla-wagner | Psychology | intro |
| 6 | forgetting | Psychology | intro |
| **7** | wave-interference | Physics | intro |
| 7 | standing-waves | Physics | intro |
| 7 | synapse-kinetics | Neuroscience | intro |
| 7 | eigenvectors | Math | university |
| 7 | nash-equilibria | Economics | university |
| 7 | prisoner-dilemma | Psychology | intro |
| 7 | bayes | Math | intro |
| 7 | information-theory | Math | university |
| **[infra]** | Random.gaussian() | — | — |
| **8** | particle-in-box | Physics | intro |
| 8 | carnot | Physics | intro |
| 8 | markov-chains | Math | graduate † |
| 8 | drift-diffusion | Psychology | graduate † |
| 8 | phase-plane | Math | graduate † |
| 8 | competitive-exclusion | Biology | university |
| 8 | pharmacokinetics | Biology | university |
| **9** | entropy-mixing | Physics | intro |
| 9 | stdp | Neuroscience | university |
| 9 | cable-equation | Neuroscience | university |
| 9 | random-walk | Math | intro |
| 9 | solow | Economics | university |
| 9 | opinion-dynamics | Psychology | university |
| 9 | age-structure | Biology | university |
| **[infra]** | Complex.js | — | — |
| **10** | lc-oscillator | Physics | university |
| 10 | butler-volmer | Chemistry | graduate † |
| 10 | options-pricing | Economics | graduate † |
| 10 | hopfield | Neuroscience | graduate † |
| 10 | reinforcement-learning | Psychology | graduate † |
| 10 | auctions | Economics | university |
| 10 | voting-systems | Economics | intro |
| 10 | psychometric-function | Psychology | university |
| **[infra]** | Graph.js | — | — |
| **11** | ising | Physics | university |
| 11 | population-coding | Neuroscience | graduate † |
| 11 | wilson-cowan | Neuroscience | graduate † |
| 11 | bayesian-observer | Psychology | university |
| 11 | graph-theory | Math | university |
| 11 | elasticity | Economics | intro |
| 11 | inequality | Economics | intro |
| **[infra]** | PDE1D.js | — | — |
| **12** | quantum-tunneling | Physics | graduate † |
| 12 | schrodinger-1d | Physics | graduate † |
| 12 | special-relativity | Physics | university |
| 12 | hebbian-learning | Neuroscience | graduate † |
| 12 | neuron-bifurcation | Neuroscience | graduate † |
| 12 | receptive-fields | Neuroscience | university |
| 12 | perceptron | Neuroscience | university |
| 12 | network-effects | Economics | intro |
| **[infra]** | MandelbrotWorker | — | — |
| **13** | mandelbrot | Math | university |
| 13 | lyapunov | Math | graduate † |
| 13 | ising-scaling | Physics | graduate † |
| 13 | phase-diagram | Chemistry | university |
| 13 | mechanism-design | Economics | graduate † |
| 13 | bayesian-cognitive | Psychology | graduate † |
| 13 | matching-law *(low priority)* | Psychology | university |
| 13 | serial-position *(low priority)* | Psychology | university |

**Total planned:** 67 new benches across Phases 5–13 (7–8 per phase).
**Graduate benches:** 17 / 67 = 25.4%.
**Cumulative total at Phase 13:** 102 benches (35 built + 67 planned).

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
