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

Source statuses:
- **checked by independent test** — test file exists in `tests/` and currently passes.
- **anchor derived, test planned** — formula is algebraically exact or derivable from first principles; test will be written when the bench is built. A formula written from memory does not qualify.
- **cited, not fetched** — anchor value comes from a publication or dataset; source was not re-fetched during this planning phase, but value is consistent with the literature.
- **unverified** — citation is uncertain, value has not been cross-checked, or source is in doubt.

---

### Physics (19 benches, 5 built)

#### Mechanics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| pendulum ✓ | sim | intro | T = 2π√(L/g) small-angle; exact Bessel period at large amplitude | standard mechanics | checked by independent test |
| orbits | sim | intro | 1 AU = 149 597 870 700 m (IAU 2012 exact); GM_sun = 1.3271244×10²⁰ m³/s² (IAU nominal) → T_Earth = 365.256 d ±0.02 d; energy E=−GMm/(2a) and L=const verified over one orbit | IAU 2012 nominal solar mass parameter | cited, not fetched |
| oscillators | sim | intro | Displacement amplitude peaks at ω_res=√(ω₀²−2γ²); velocity amplitude peaks at ω₀; Q = ω₀/(2γ) | algebraic derivation | anchor derived, test planned |
| special-relativity | sim | university | γ = 1/√(1−β²); at β=0.9994, γ = 1/√(1−0.9994²) = 28.9; muon lives 28.9× longer than at rest | algebraic; PDG muon data | anchor derived, test planned |

#### Waves & Optics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| wave-interference | sim | intro | Fringe spacing Δy = λL/d; dark fringe at d·sinθ = λ/2 | Young 1801; algebraic | anchor derived, test planned |
| standing-waves | sim | intro | Harmonics f_n = n·v/(2L); f_2/f_1 = 2 exactly | algebraic | anchor derived, test planned |

#### Electromagnetism

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| rc-circuit ✓ | sim | intro | V_C(t) = V₀·(1−e^(−t/RC)) charging; V_C(τ) = V₀·(1−1/e) ±1e-6; energy ∫I²R dt = ½CV₀² (independent of R, verified by trapezoid); RK4 cross-check max err < 1e-6 | algebraic | formulas: checked by independent test; data: n/a |
| lc-oscillator | sim | university | ω₀ = 1/√(LC); critical damping when R = 2√(L/C) | algebraic | anchor derived, test planned |

#### Thermodynamics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| ideal-gas ✓ | sim | university | P = NkT/V; ⟨KE⟩ = 3/2 kT | algebraic | checked by independent test |
| maxwell-boltzmann ✓ | sim | university | v_p : v̄ : v_rms = 1 : 1.128 : 1.225 (exact ratios) | algebraic | checked by independent test |
| van-der-waals ✓ | sim | university | Z_c = 3/8 = 0.375 exact algebraic result | algebraic | checked by independent test |
| carnot | sim | intro | η = 1 − T_c/T_h; 500 K/300 K → η = 0.40 exactly | algebraic | anchor derived, test planned |
| entropy-mixing | sim | intro | ΔS = −nR·Σx_i·ln x_i; equimolar binary → nR·ln 2 | algebraic | anchor derived, test planned |

#### Statistical Mechanics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| ising | sim | university | T_c = 2J/[k_B·ln(1+√2)] ≈ 2.269 J/k_B; exact critical condition sinh(2K_c)=1, K_c=ln(1+√2)/2; internal energy per site at T_c: u_c = −√2·J (exact) | Onsager 1944, *Phys. Rev.* 65:117 | cited, not fetched |
| ising-scaling ★ | sim | graduate | β=1/8 (M~\|T−T_c\|^(1/8)); Binder cumulant U*≈0.61 at T_c; Wolff cluster algorithm required for efficient sampling near T_c | Yang 1952, *Phys. Rev.* 85:808 (β=1/8); Binder 1981, *Z. Phys. B* 43:119 (U*≈0.61 — unverified) | unverified |

#### Quantum Mechanics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| particle-in-box | sim | intro | E_n = n²π²ℏ²/(2mL²); E_2/E_1 = 4 exactly | Griffiths §2.2; algebraic | anchor derived, test planned |
| quantum-tunneling ‡ | sim | graduate | Rectangular barrier: T=[1+V₀²sinh²(κa)/(4E(V₀−E))]⁻¹; WKB: T~exp(−2∫κdx); test WKB against exact for κa≫1: T→16E(V₀−E)/V₀²·e^(−2κa) | Griffiths §2.6 (exact); WKB chapter number unverified | unverified |
| schrodinger-1d ★ | sim | graduate | Finite-difference eigenvalues match E_n=n²π²ℏ²/(2mL²) to ±0.1% for n=1–5 | Griffiths §2.2; algebraic | anchor derived, test planned |

#### Particle Physics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| quarks ✓ | explorer | university | proton = uud; mass ≈ 938 MeV/c² | PDG 2022 | checked by independent test |

---

### Neuroscience (13 benches, 2 built)

#### Electrophysiology

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| neuron ✓ | sim | university | Spike threshold; TTX blocks Na⁺ | Hodgkin & Huxley 1952 | checked by independent test |
| goldman ✓ | sim | university | Vm(squid rest) ≈ −59.9 mV; Vm → E_K when P_Na, P_Cl → 0 | Hodgkin & Katz 1949 | checked by independent test |
| integrate-and-fire | sim | university | f = 1/(t_ref + τ_m·ln[I/(I−g_L·V_th)]); fires only above threshold I = g_L·V_th | Lapicque 1907; Tuckwell 1988 | cited, not fetched |
| cable-equation | sim | university | Steady-state analytic V(x)=V₀·e^(−x/λ), λ=√(r_m/r_i) — no PDE solver needed | Rall 1967, *J. Neurophysiol.* 30:1138 | cited, not fetched |
| neuron-bifurcation ★ | sim | graduate | HH at 6.3°C: subcritical Hopf near 9.78 μA/cm² (rest loses stability; spiking onset on upward I-sweep); saddle-node of limit cycles near 6.26 μA/cm² (spiking offset on downward I-sweep); bistable region between. Type II excitability. Both thresholds computed numerically by solver. | Rinzel & Ermentrout 1989, in *Methods in Neuronal Modeling* | unverified |

#### Synapses & Plasticity

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| synapse-kinetics | sim | intro | Alpha-function peak at t = τ exactly (by differentiation) | algebraic | anchor derived, test planned |
| stdp | sim | university | LTP for pre→post Δt > 0; τ⁺ ≈ 17 ms, τ⁻ ≈ 34 ms (Song et al. 2000); τ⁺=τ⁻=20 ms is a common simplification | Song, Miller & Abbott 2000, *Nat. Neurosci.* 3:919; Bi & Poo 1998 | unverified |
| hebbian-learning ‡ | sim | graduate | Oja rule with zero-mean input maximises E[(w·x)²] s.t. ‖w‖=1; ‖w‖→1; w converges to dominant eigenvector of E[xx^T] (zero-mean required: with non-zero mean the rule converges to the mean direction, not the covariance eigenvector) | Oja 1982, *J. Math. Biol.* 15:267 | cited, not fetched |

#### Networks & Coding

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| hopfield ‡ | sim | graduate | Storage capacity ≈ 0.138N (seeded test, finite-N tolerance); spurious mixture states; E=−½Σw_{ij}s_is_j; McEliece et al. 1987 gives asymptotic N/(4 ln N) | Amit, Gutfreund & Sompolinsky 1985, *PRL* 55:1530; McEliece et al. 1987, *IEEE Trans. IT* 33:461 | cited, not fetched |
| population-coding ‡ | sim | graduate | Poisson Fisher info I(θ)=T·Σf_i'(θ)²/f_i(θ); CRB: Var(θ̂)≥1/I(θ); decoding error ∝ 1/√N | Seung & Sompolinsky 1993, *PNAS* 90:10749 | cited, not fetched |
| wilson-cowan ‡ | sim | graduate | Hopf bifurcation: Jacobian eigenvalues cross imaginary axis → limit cycle; nullcline topology | Wilson & Cowan 1972, *Biophys. J.* 12:1 | cited, not fetched |

#### Sensory Systems

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| receptive-fields | explorer | university | Gabor SF bandwidth (octaves): b=log₂[(πσf+√(ln2/2))/(πσf−√(ln2/2))], f=1/λ, σ=envelope SD; verified by FFT of sampled Gabor (not by re-entering formula); orientation half-bandwidth≈30–60° | DeValois et al. 1982 — unverified | unverified |
| perceptron | sim | university | Convergence in ≤(R/γ)² steps for linearly separable data | Novikoff 1962 (proof); Rosenblatt 1962 | cited, not fetched |

---

### Mathematics (13 benches, 1 built)

#### Analysis

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| fourier ✓ | sim | university | Square-wave Gibbs overshoot → 8.9% as N → ∞ (exact) | algebraic | checked by independent test |
| ode-explorer | sim | intro | Euler error O(h), RK4 error O(h⁴); y'=−y → y=e^(−t) exact | algebraic | anchor derived, test planned |

#### Dynamical Systems

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| logistic-map | sim | university | Period-2 onset at r=3.000 exactly; Feigenbaum δ ≈ 4.669 | Feigenbaum 1978, *J. Stat. Phys.* 19:25 | cited, not fetched |
| lyapunov ★ | sim | graduate | λ=ln 2 for tent map x→2x mod 1 (algebraically exact); λ>0 for r>r_∞≈3.5699 | Tent map: algebraic; r_∞: Feigenbaum 1978 | anchor derived, test planned / cited, not fetched |
| mandelbrot | explorer | university | Main cardioid: c=μ/2−μ²/4 (\|μ\|<1), real-axis span −3/4..1/4; period-2 disc: \|c+1\|<1/4; tests: c=0 inside, c=0.26 escapes; c=−1 inside, c=−2.01 escapes | algebraic parametrisation | anchor derived, test planned |
| phase-plane ‡ | sim | graduate | Stable node iff tr<0, det>0, tr²>4det; Jacobian eigenvalues classify all 6 equilibrium types; Hartman-Grobman theorem | Strogatz 2001 §5.2; algebraic | cited, not fetched |

#### Probability & Statistics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| central-limit ✓ | sim | intro | SE=σ/√n; Uniform/Bernoulli/Exp/χ²(3) observedSD ≈ SE ±4×SE_SD; Erlang exact P(X̄<0.8,n=5)=0.371163 tol=4·√(p(1-p)/N); skewness n=30 and n=5 ±4·SE (Stuart-Ord Var=(6/N)(1+γ₂)); Cauchy IQR>1 (CLT fails); erlangCDF log-scale avoids overflow | algebraic (CLT) | formulas: checked by independent test; data: n/a |
| markov-chains ‡ | sim | graduate | π₁=p₂₁/(p₁₂+p₂₁) exact; spectral gap=1−\|λ₂\| (Jacobi symmetric eigensolver); t_mix(ε)≤t_rel·ln(1/(ε·π_min)) for reversible chains only | Algebraic; Levin, Peres & Wilmer 2009 | cited, not fetched |
| bayes | sim | intro | Posterior Beta(α+k, β+n−k) exact conjugate update | algebraic | anchor derived, test planned |
| information-theory | sim | university | H=−Σp_i·log₂p_i; H_max=log₂n uniform (exact); C=B·log₂(1+SNR) | Shannon 1948, *Bell Syst. Tech. J.* 27:379 | cited, not fetched |
| random-walk | sim | intro | 1D: ⟨x²⟩=n, ⟨\|x\|⟩=√(2n/π) (exact); 2D: ⟨r²⟩=4Dt (general 2dDt; Einstein 1905) | algebraic; Einstein 1905 | anchor derived, test planned |

#### Linear Algebra

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| eigenvectors | sim | university | Power iteration → dominant eigenvector; [[2,1],[1,2]] → λ=3,1 exactly | algebraic | anchor derived, test planned |

#### Graph Theory

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| graph-theory | explorer | university | V−E+F=2 (Euler); 2\|E\|=Σdeg(v); Dijkstra correctness on 5-node example | Euler 1736; algebraic | cited, not fetched |

---

### Economics (12 benches, 1 built)

#### Markets

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| tax ✓ | sim | intro | DWL=½·t·ΔQ; burden split=ratio of elasticities | algebraic | checked by independent test |
| supply-demand ✓ | sim | intro | P*=(a−c)/(b+d), Q*=(ad+bc)/(b+d); CS=½Q*²/b; PS=½Q*²/d (any c); Simpson ±1e-4; brent ±1e-6; costShock ΔP*=d·κ/(b+d), ρ=ε_S/(ε_S+|ε_D|); both incidence limits; noTrade iff Q*≤0 | algebraic | formulas: checked by independent test; data: n/a |
| elasticity | sim | intro | Unit elastic E_d=−1 → PQ constant; Lerner index=−1/E_d | algebraic | anchor derived, test planned |

#### Game Theory

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| nash-equilibria | sim | university | Matching pennies NE at (½,½); Battle of Sexes: 2 pure + 1 mixed NE | Nash 1950, *PNAS* 36:48 | cited, not fetched |
| auctions | sim | university | Vickrey: dominant strategy = bid true value; revenue equivalence theorem | Vickrey 1961, *J. Finance* 16:8 | cited, not fetched |
| mechanism-design ★ | sim | graduate | Revelation principle (algebraic); optimal reserve p*=(1−F(p*))/f(p*) | Myerson 1981, *Math. Oper. Res.* 6:58 | cited, not fetched |

#### Growth & Macroeconomics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| compound-growth ✓ | sim | intro | A(t)=P·(1+r/m)^(mt); EAR=(1+r/m)^m−1; t₂=ln2/(m·ln(1+r/m)); rule72_pct(0.05)=71.03, rule72_pct(0.10)=72.73 (exact); PV=FV/(1+r/m)^(mT) discrete, FV·e^(−rT) cont; round-trip PV(A(T))=P ±1e-6 | algebraic | formulas: checked by independent test; data: n/a |
| solow | sim | university | k*=[sA/(n+δ)]^{1/(1−α)}; golden rule α·f(k_GR)=(n+δ)·k_GR | Solow 1956, *QJE* 70:65 | cited, not fetched |

#### Finance

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| options-pricing | sim | graduate | S=100, K=100, r=5%, σ=20%, T=1 → call≈10.45 (computed via Φ); put-call parity C−P=S−K·e^(−rT). **Educational use only — not financial advice.** | Black & Scholes 1973, *JPE* 81:637 | anchor derived, test planned |

#### Voting & Social Choice

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| voting-systems | explorer | intro | Condorcet paradox A>B>C>A; Arrow's impossibility theorem | Arrow 1951 | cited, not fetched |

#### Network Economics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| network-effects | sim | intro | Tipping-point fixed point: adoption model dx/dt=x(1−x)(x−θ) has unstable equilibrium at x=θ; above threshold system converges to full adoption | algebraic | anchor derived, test planned |
| inequality | sim | intro | Gini(Pareto α)=1/(2α−1); Gini(uniform [0,b])=1/3 | algebraic | anchor derived, test planned |

---

### Psychology & Cognition (13 benches, 0 built)

#### Perception & Psychophysics

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| signal-detection ✓ | sim | intro | erf Taylor (|x|≤3) + Laplace CF (|x|>3); erf(2.5) and erf(3.5) ±1e-10; Phi(−6)≈9.866e-10 ±1e-12; AUC=Φ(d′/√2); trapezoid closed ROC ±1e-4; A′: chance=0.5, A′(d)+A′(−d)=1; dprime()=Φ⁻¹(H)−Φ⁻¹(FA); round-trip ±1e-10 | algebraic (unit normals) | formulas: checked by independent test; data: n/a |
| weber-fechner ✓ | sim | intro | JND=k_W·I; S_F=(1/k_W)·ln(I/I₀); S_S=k_S·I^n; JND-step ratio=k_W/ln(1+k_W)≥1 (Fechner UNDERcounts); (I^n−1)/n→ln(I) at n=0.0001 ±0.001 (L'Hôpital) | Weber 1834; Fechner 1860; Stevens 1957 | formulas: checked by independent test; data: unverified (k_W and n modality table) |
| psychometric-function | sim | university | Weibull P(x)=1−exp(−(x/α)^β); 2AFC: P=Φ(d'/√2) | algebraic; Green & Swets 1966 | cited, not fetched |

#### Learning & Decision

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| rescorla-wagner | sim | intro | Asymptote V_A=λ; blocking: ΔV_B≈0 when V_A=λ | Rescorla & Wagner 1972, in *Classical Conditioning II* | cited, not fetched |
| drift-diffusion ‡ | sim | graduate | Boundaries ±a, start 0: P=1/(1+e^(−2μa/σ²)); RT=(a/μ)·tanh(μa/σ²)+t₀; both verified by numerical simulation of the SDE | Ratcliff 1978, *Psychol. Rev.* 85:59 | anchor derived, test planned |
| reinforcement-learning ‡ | sim | graduate | Bellman: Q*(s,a)=R+γ·max Q*(s',a'); convergence via stochastic approximation (Robbins-Monro) | Watkins & Dayan 1992, *Machine Learning* 8:279 | cited, not fetched |
| bayesian-observer | sim | university | σ_comb=1/√(1/σ₁²+1/σ₂²); for σ₁=σ₂ → σ/√2; weights ∝ 1/σ² | Ernst & Banks 2002, *Nature* 415:429 | cited, not fetched |
| bayesian-cognitive ★ | sim | graduate | Analytic limits: P(C=1\|x₁,x₂)→1 as \|x₁−x₂\|→0; →0 as \|x₁−x₂\|→∞; exact posterior from product of Gaussians | Körding et al. 2007, *PLoS ONE* 2:e943 | unverified |

#### Social & Cognitive

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| prisoner-dilemma | sim | intro | Single-play NE=(D,D); cooperation iff δ≥(T−R)/(T−P) (grim trigger) | algebraic; Axelrod 1984 | cited, not fetched |
| opinion-dynamics | sim | university | Deffuant: consensus for ε>0.5; polarisation for ε<0.5 | Deffuant et al. 2000, *Adv. Complex Syst.* 3:87 | cited, not fetched |
| forgetting | sim | intro | Ebbinghaus savings: 58.2% at 20 min, 33.7% at 1 day; one exponential cannot fit both simultaneously (show misfit; power-law R(t)=(1+t)^(−c) as alternative) | Ebbinghaus 1885 (data from tables); Wickelgren 1974 | cited, not fetched |
| matching-law | sim | university | Herrnstein's hyperbola: B=kR/(R+Rₑ); Baum 1974 generalised: B₁/B₂=b·(R₁/R₂)^a; strict matching at a=1, b=1 *(low priority)* | Herrnstein 1961, *J. Exp. Anal. Behav.* 4:267; Baum 1974, 22:231 | cited, not fetched |
| serial-position | sim | university | U-shaped free recall; modal model (Atkinson & Shiffrin 1968): primacy from rehearsal, recency from short-term store; primacy absent under fast presentation *(low priority)* | Murdock 1962, *J. Exp. Psychol.* 64:482 | cited, not fetched |

#### Psychology — Where it breaks

Each model has a documented failure mode for the bench's "Break it" card.

| bench | the model cannot explain |
|---|---|
| signal-detection | Unequal-variance signal/noise; criterion shifts driven by feedback; metacognitive confidence |
| weber-fechner | Stevens power law fits many modalities better; cross-cultural differences in magnitude estimation; Fechner's derivation from Weber assumes log steps are equal in sensation — not always true |
| psychometric-function | Threshold depends on observer's prior; lapse-rate bias at extremes; 2AFC vs. yes–no give different d' |
| rescorla-wagner | Latent inhibition (pre-exposure retards conditioning); second-order conditioning; trial spacing effects |
| drift-diffusion | Constant drift fails when evidence accumulates non-uniformly; urgency signals; collapsing-bound strategies |
| reinforcement-learning | Non-Markovian tasks; non-stationary environments; ε-greedy is a strong simplification of exploration |
| bayesian-observer | Gaussian noise assumed; prior miscalibration produces systematic bias; people do not always weight ∝ 1/σ² |
| bayesian-cognitive | Ideal integration is computationally intractable; people show systematic deviations; prior precision unknown |
| prisoner-dilemma | Grim trigger requires perfect memory and no noise; cooperation fragile under trembling-hand perturbations |
| opinion-dynamics | Deterministic update; ignores network topology, media influence, identity-protective cognition |
| forgetting | Exponential R(t)=e^(−t/S) cannot fit both 58.2% (20 min) and 33.7% (1 day) — show misfit; power-law R(t)=(1+t)^(−c) fits better; Ebbinghaus data is n=1 |
| matching-law | Generalised matching handles bias but not concurrent VR schedules; conflates time allocation with response rate |
| serial-position | Primacy disappears in rapid-serial-visual-presentation; long-term recency challenges the modal two-store model |

---

### Biology & Chemistry — remaining planned benches

#### Biology

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| competitive-exclusion | sim | university | Coexistence iff α₁₂<K₁/K₂ AND α₂₁<K₂/K₁ (necessary and sufficient); equilibrium x₁*=(K₁−α₁₂K₂)/(1−α₁₂α₂₁) | algebraic; Gause 1934 | anchor derived, test planned |
| age-structure | sim | university | Dominant eigenvalue λ=asymptotic growth rate; stable age dist=dominant eigenvector | Leslie 1945, *Biometrika* 33:183 | cited, not fetched |
| pharmacokinetics | sim | university | 1-compartment IV: C(t)=C₀·e^(−ke·t), t_{1/2}=ln2/ke; 2-compartment: C(t)=Ae^(−αt)+Be^(−βt); oral Bateman: t_max=ln(ka/ke)/(ka−ke) | Rowland & Tozer, *Clinical Pharmacokinetics* 4th ed. | cited, not fetched |

#### Chemistry

| id | kind | level | testable anchor | source | status |
|---|---|---|---|---|---|
| radioactive-decay ✓ | sim | intro | N(t)=N₀·e^(−λt) where λ=ln2/t½; A(0)=λ·N₀; Curie anchor 1g Ra-226≈3.66e10 Bq (independent derivation); stochastic M=500 trials mean≈500±2.83 (4×SE), variance≈250±63 | NUBASE2020 (Kondev et al. 2021) | formulas: checked by independent test; data: verified (NUBASE2020 fetched 2026-10-15) |
| phase-diagram | sim | university | dP/dT=ΔH_vap/(T·ΔV); water boils at 100°C at 1 atm | algebraic; NIST water data | cited, not fetched |
| butler-volmer | sim | graduate | i=i₀[exp(αFη/RT)−exp(−(1−α)Fη/RT)]; Tafel slope=RT/(αF)·ln10≈118 mV/dec for α=0.5, 25°C | Bard & Faulkner 2001 §3.4 | cited, not fetched |

---

### Phase 14+ backlog

Unbuilt biology and chemistry topics not scheduled in Phases 5–13. Nothing is dropped
silently; every item is listed explicitly.

#### Phase 14 candidates

| id | title | field | level | notes |
|---|---|---|---|---|
| mwc-allosteric | MWC allosteric model | biochemistry | university | T↔R equilibrium; cooperative binding beyond Hill-equation approximation |
| turing-diffusion | Turing reaction-diffusion | development | graduate | Turing (1952) instability condition; stripe/spot wavelength from dispersion relation |
| goodwin-oscillator | Goodwin biochemical oscillator | molecular | graduate | Limit cycle when Hill n>8 (Goodwin 1965); period from Jacobian eigenvalues |
| van-deemter | Van Deemter equation | analytical | university | H=A+B/u+Cu; optimal flow rate u_opt=√(B/C) |
| binding-energy | Nuclear binding energy | nuclear | university | Weizsäcker semi-empirical formula; Fe-56 maximum ≈ 8.79 MeV/nucleon |
| nmr-larmor | NMR Larmor precession | analytical | university | ν_L=γB₀/(2π); ¹H at 9.4 T → 400 MHz (exact from γ) |
| langmuir | Langmuir adsorption isotherm | surface | university | θ=Kp/(1+Kp); at Kp=1, θ=0.5 exactly |

#### Phase 15 candidates

| id | title | field | level | notes |
|---|---|---|---|---|
| neutral-theory | Kimura neutral theory | evolution | graduate | Fixation probability 1/(2N) for neutral allele (Kimura 1968) |
| coalescence | Coalescent theory | evolution | graduate | E[T_MRCA]=4N generations; E[S]=θ·Σ1/i (Tajima's D numerator) |
| mapk-cascade | MAPK signalling cascade | cell biology | graduate | Ultrasensitivity nH≈n (Huang & Ferrell 1996); bistability for n≥2 |
| marcus-theory | Marcus electron-transfer | physical chemistry | graduate | k_ET=A·exp(−(ΔG°+λ)²/(4λk_BT)); activationless at ΔG°=−λ (Marcus 1956) |
| flory-polymer | Flory polymer chain statistics | physical chemistry | university | R_F=bN^ν; ν=3/5 good solvent vs. ½ ideal chain (Flory 1953) |

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
phase that requires it.  Benches that use analytic formulas (cable-equation: V=V₀e^(-x/λ);
wave-interference: Δy=λL/d; quantum-tunneling rectangular-barrier) need no infrastructure module.

| module | file | pre-phase | used by | key tests |
|---|---|---|---|---|
| LinAlg | js/core/LinAlg.js | 7 | eigenvectors (7), markov-chains (8), hebbian-learning (12) | Power iteration + Jacobi symmetric eigensolver; [[2,1],[1,2]]→λ=3,1; spectral gap of 2-state chain |
| Random.gaussian | js/core/Random.js extension | 8 | drift-diffusion (8) | mean≈0, var≈1 over 10 000 samples (±3σ); seeded for reproducibility |
| Complex | js/core/Complex.js | 10 | lc-oscillator (10, optional), schrodinger-1d (12) | e^(iπ)=−1 ±1e-15; multiply, modulus, arg |
| Graph | js/core/Graph.js | 11 | graph-theory (11) | Dijkstra on 5-node graph; Euler V−E+F=2 |
| PDE1D | js/core/PDE1D.js | 12 | schrodinger-1d (12) | Crank-Nicolson norm conservation ±1e-10 over 1000 steps |
| MandelbrotWorker | js/workers/MandelbrotWorker.js | 13 | mandelbrot (13) | c=0 inside; c=0.26 escapes; c=−1 inside; c=−2.01 escapes |

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
| **5** | rc-circuit ✓ | Physics | intro |
| **5** | radioactive-decay ✓ | Chemistry | intro |
| **5** | supply-demand ✓ | Economics | intro |
| **5** | signal-detection ✓ | Psychology | intro |
| **5** | weber-fechner ✓ | Psychology | intro |
| **5** | central-limit ✓ | Math | intro |
| **5** | compound-growth ✓ | Economics | intro |
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
