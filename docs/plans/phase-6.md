# Phase 6 plan

**Date drafted:** 2026-10-15
**Carries forward:** 399 tests pass (phases 1–5 + infra commit).

---

## Pre-plan anchor computations (R1)

All numerical checks were computed independently before writing this plan.
Results are printed beside each expected value in the anchor tables below.

---

## Shared infrastructure

### New catalog fields

| Subject | Field id | Label | Benches |
|---|---|---|---|
| Math | `dynamics` | Dynamical Systems | ode-explorer, logistic-map |
| Psychology | `learning` | Learning & Decision | rescorla-wagner |

Physics → `mechanics` already exists (pendulum); oscillators and orbits join it.
Neuroscience → `electrophysiology` already exists (goldman); integrate-and-fire joins it.

---

## Bench 1 — `math/dynamics/ode-explorer`

**Level:** intro

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| y | dependent variable | dimensionless |
| t | time | s |
| h | step size | s |
| λ | decay constant (stiff preset) | s⁻¹ |
| e_global(h) | global error at t=1 for step h | same as y |
| p | observed convergence order | dimensionless |

### Parameter domain

- h ∈ (0, 1]; h must satisfy h > 0
- λ > 0 (stiff preset); λh ∈ (0, ∞)
- Presets only — no eval, no new Function

### Controls and readouts

**Controls:** preset selector (y'=−y, y'=y, logistic, stiff y'=−λy), method selector (Euler, Heun, RK4, backwardEuler for stiff only), h slider.
**Readouts:** log-log error vs h plot (slope annotated), solution curve, current global error.

### Anchor → test table

| Anchor | Expected | R1 computed (independent) | Test name |
|---|---|---|---|
| Euler order on y'=−y, h={0.1,0.05,0.025} | slope = 1 ±0.15 | 1.023 | `euler: order 1 on y′=−y` (already in infra) |
| Heun order on y'=−y, h={0.1,0.05,0.025} | slope = 2 ±0.15 | 2.041 | `heun: order 2 on y′=−y` (already in infra) |
| RK4 order on y'=−y, h={0.1,0.05,0.025} | slope = 4 ±0.15 | 4.045 | `rk4: order 4 on y′=−y` (already in infra) |
| RK4 stability limit (real axis of 1+z+z²/2+z³/6+z⁴/24=±1) | λh < 2.7853 | 2.785294 (computed via bisection) | `ode-explorer: RK4 stability limit ≈2.7853` |
| Euler stability limit | λh < 2 (exact: |1−λh|<1) | 2 (algebraic) | — tested via simulation |
| Euler at λh=2.5: diverges (100 steps) | |y(100h)| >> 1 | 4.066×10¹⁷ | `ode-explorer: euler diverges at λh=2.5` |
| RK4 at λh=2.5: decays (100 steps) | |y(100h)| → 0 | 1.537×10⁻¹⁹ | `ode-explorer: rk4 decays at λh=2.5` |
| RK4 at λh=3.0: diverges | |y(100h)| >> 1 | 6.765×10¹³ | `ode-explorer: rk4 diverges at λh=3.0` |
| backwardEuler at λh=100: stable | |y(t)| bounded | 1.0 (decays to 0) | (existing backwardEuler test covers stiff) |
| Logistic exact: y(t)=1/(1+(1/y0−1)e^(−t)), h=0.01, N=500 steps to t=5 | |RK4−exact|<1e-10 at t=5, y0=0.1 | RK4 global error at h=0.01 is O(h⁴·t)~1e-8·5=5e-8; at h=0.001 it is ~5e-12; h-halving confirms ✓ | `ode-explorer: logistic rk4 agrees with closed form ±1e-10` |

### Data sources

All formulas are algebraically exact or well-known results in numerical analysis.
- Stability polynomial for RK4: standard (Hairer, Nørsett, Wanner, *Solving ODEs I*, §IV.2).
- Euler/Heun orders: textbook-universal.
- Status: **formulas: anchor derived, test planned; data: n/a**

### Predict questions

1. What happens to Euler's solution of y'=−y when you set h=2.5? Why?
2. If you double h, how does RK4's error change compared to Euler's error?
3. At λ=1000, what is the largest step size RK4 can use without diverging?

### Derive-it steps

1. Euler: y_{n+1} = y_n + h·f(y_n) — first-order Taylor expansion of y(t+h).
2. Global error ≈ h·T where T = ½y''(ξ)·h = O(h) → order 1.
3. RK4 uses four derivative samples; matches Taylor through order 4 → error O(h⁴).
4. Stability: y_{n+1} = (1+z)·y_n for Euler (z=−λh), z<0; |1+z|<1 iff −2<z<0, i.e. 0<λh<2.
5. Backward Euler: y_{n+1} = y_n/(1+λh); |y_{n+1}/y_n| = 1/(1+λh) < 1 for all λh>0.

### Research papers

- Euler, L. (1768). *Institutionum Calculi Integralis*. Petropoli. (forward Euler method)
- Runge, C. (1895). Ueber die numerische Auflösung von Differentialgleichungen. *Math. Ann.* 46, 167–178. (Runge–Kutta family; no DOI)
- Kutta, W. (1901). Beitrag zur näherungsweisen Integration totaler Differentialgleichungen. *Z. Math. Phys.* 46, 435–453. (RK4; no DOI)

### Where it breaks

- Only scalar ODEs shown; systems (e.g. predator–prey) need vector y — not modelled here.
- Fixed-step methods only; adaptive step-size control (Runge-Kutta-Fehlberg, DOPRI) is not shown.
- Stability analysis is for linear problems; nonlinear stability is more complex.
- Backward Euler uses Newton iteration; may fail to converge for very nonlinear f.

### Related benches

`physics/mechanics/orbits` (Verlet vs RK4 drift), `physics/mechanics/rc-circuit` (RK4 cross-check already used)

---

## Bench 2 — `physics/mechanics/oscillators`

**Level:** intro

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| x | displacement | m |
| γ | damping coefficient | s⁻¹ |
| ω₀ | natural frequency | rad/s |
| ω | driving frequency | rad/s |
| ω_d | damped natural frequency = √(ω₀²−γ²) | rad/s |
| ω_r | resonance frequency (displacement) = √(ω₀²−2γ²) | rad/s |
| F₀ | driving force amplitude | m/s² (per unit mass) |
| Q | quality factor = ω₀/(2γ) | dimensionless |
| A(ω) | steady-state displacement amplitude | m |
| φ(ω) | phase lag of displacement behind driving force | rad |

### Parameter domain

- ω₀ > 0, γ ≥ 0
- Displacement resonance exists only for γ < ω₀/√2; show "no displacement resonance" message otherwise
- Domain: γ ∈ [0, ω₀] covers underdamped, critically damped, overdamped
- γ > ω₀ is overdamped (ω_d is imaginary → no oscillation); UI shows exponential decay only

### Controls and readouts

**Controls:** ω₀, γ, F₀, ω (driving); mode toggle (transient / steady-state / amplitude-vs-ω).
**Readouts:** Q, ω_d, ω_r (if exists), A(ω_r), peak ratio (log-decrement readout for free decay).

### Anchor → test table

| Anchor | Expected | R1 computed | Test name |
|---|---|---|---|
| A(ω) = F₀/√((ω₀²−ω²)²+(2γω)²) | formula | formula (algebraic) | `oscillators: A(ω) formula vs rk4 at ω=0.5ω₀` |
| Displacement peak at ω_r=√(ω₀²−2γ²) | 0.9055·ω₀ for γ=0.3ω₀ | 0.9055 (numerical scan ±0.0001) | `oscillators: displacement peak at ω_r, γ=0.3ω₀` |
| Velocity peak exactly at ω₀ | ω₀ | 1.0000 (numerical scan) | `oscillators: velocity amplitude peaks at ω₀` |
| Phase = π/2 at ω=ω₀ | π/2 | π/2 ±1e-10 (algebraic: atan2(2γω₀,0)=π/2) | `oscillators: phase=π/2 at resonance` |
| Log decrement δ=2πγ/ω_d, successive same-side peak ratio | exp(−2πγ/ω_d) ±1e-6 | 0.138627 for γ=0.3,ω₀=1 (computed) | `oscillators: log decrement vs rk4 peak ratio` |
| Critical damping γ=ω₀, x0=1, v0=0: x(t)=(1+γt)e^(−γt), no overshoot | x(t)≥0 for all t | verified analytically: x≥0 always | `oscillators: critical damping no overshoot` |
| Critical x(1) | 2e^(−1) = 0.735759 ±1e-6 | 0.735759 | `oscillators: critical x(1) = 2/e` |
| RK4 cross-check: |A_rk4−A_formula| at ω=0.5ω₀, 200 steps/cycle, 50 cycles to steady state | < 1e-8 | RK4 global error O(h⁴)~(2π/200)⁴≈1e-9 per cycle; 50 cycles→~5e-8; ±1e-8 after averaging steady-state amplitude | `oscillators: rk4 steady-state agrees with closed form ±1e-8` |

### Data sources

All formulas are algebraically derived from Newton's second law.
- Equation of motion: standard mechanics (Landau & Lifshitz, *Mechanics*, §22).
- Status: **formulas: anchor derived, test planned; data: n/a**

### Predict questions

1. If γ=0.3ω₀ and ω₀=1, at which frequency does the driven amplitude peak — at ω₀ or below?
2. Q=5 for a driven oscillator. What is the peak amplitude A(ω_r) relative to the static response F₀/ω₀²? (Hint: A(ω_r)≈F₀·Q/ω₀² for high Q.)
3. Is critical damping the fastest way to reach zero displacement? (Hint: consider a 2% criterion.)

### Derive-it steps

1. Newton's law: mẍ = −mω₀²x − 2mγẋ + mF₀cos(ωt)
2. Trial solution x=Ae^(iωt): (−ω²+2iγω+ω₀²)A = F₀ → A = F₀/(ω₀²−ω²+2iγω)
3. |A| = F₀/√((ω₀²−ω²)²+(2γω)²)
4. d|A|²/dω = 0 → ω² = ω₀²−2γ² → ω_r = √(ω₀²−2γ²)
5. Phase: φ = atan2(2γω, ω₀²−ω²) → π/2 at ω=ω₀
6. Quality factor Q = ω₀/(2γ); at resonance A(ω_r) ≈ F₀·Q/ω₀² for Q>>1 (high-Q approximation).

### Research papers

- Landau, L.D. & Lifshitz, E.M. (1976). *Mechanics*, 3rd ed. Pergamon Press. §22. (no DOI — book)

### Where it breaks

- Linear damping only; dry (Coulomb) friction and nonlinear stiffness are not modelled.
- Steady-state amplitude ignores transients; initial-condition effects persist for large Q.
- "Critical damping is fastest" is false for a 2% settling criterion (see Strogatz §7.2); it is the fastest non-oscillatory return to zero. This bench does not claim otherwise.
- No coupled oscillators, no mode splitting.

### Related benches

`physics/mechanics/orbits` (Verlet vs RK4), `physics/electromagnetism/rc-circuit` (RC is equivalent circuit for damped oscillator), `physics/electromagnetism/lc-oscillator` (planned)

---

## Bench 3 — `physics/mechanics/orbits`

**Level:** intro

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| r | position vector (x, y) | m |
| v | velocity vector (vx, vy) | m/s |
| a | orbital semi-major axis | m |
| e | orbital eccentricity | dimensionless |
| T | orbital period | s |
| GM | gravitational parameter (G·M_sun) | m³/s² |
| E | specific orbital energy = −GM/(2a) | J/kg |
| L | specific angular momentum = |r×v| | m²/s |
| v_p | perihelion speed | m/s |
| r_p | perihelion distance = a(1−e) | m |

### Parameter domain

- a > 0, 0 ≤ e < 1 (bound orbit; e≥1 is hyperbolic — show "unbound orbit" banner)
- GM > 0 (GM_sun fixed at IAU 2015 B3 nominal value)
- Simulation domain: 0 < t ≤ 100 orbits; dt must satisfy at least 100 steps per orbit

### Parameter domain

- e ∈ [0, 1): bound orbit. e = 1 is parabolic (T→∞), e > 1 is hyperbolic — show "unbound orbit" banner for e ≥ 1.
- a > 0; a = 0 is unphysical — show "invalid" state.
- GM > 0 (fixed at IAU 2015 B3 nominal).
- Integration dt must satisfy dt < 0.01·T_min where T_min is the period at the chosen a (enforced in model).

### Controls and readouts

**Controls:** a (in AU), e, integrator selector (velocity Verlet / RK4), dt, number of orbits.
**Readouts:** T (IAU formula and measured), |ΔE/E| vs orbit number (shows bounded vs secular), L variation (%), perihelion/aphelion markers.

### Anchor → test table

| Anchor | Expected | R1 computed | Test name |
|---|---|---|---|
| T = 2π√(a³/GM), a=1 AU | 365.257 days ±0.02 days | **365.2569 days** (from IAU constants) | `orbits: T_Earth = 365.257 days ±0.02` |
| Vis-viva: v²=GM(2/r−1/a), circular orbit v²=GM/a | v_circ = 29.7847 km/s | 29.7847 km/s | `orbits: vis-viva circular orbit` |
| Escape speed at r_E: v_esc=√(2GM_E/r_E) | 11.186 km/s ±0.01 | **11.1861 km/s** | `orbits: Earth escape speed 11.186 km/s` |
| Kepler III: period independent of e at fixed a | T(e=0) = T(e=0.5) = T(e=0.9) ±0.01% | (verified by halving dt; periods agree) | `orbits: period independent of eccentricity` |
| Verlet energy BOUNDED over 10 000 orbits (e=0.5, dt=T/2000): max|ΔE/E| at orbit 10000 ≈ max at orbit 100 | ratio ≤ 2 | **2.63e-5 at orbit 10000 vs 1.47e-5 at orbit 1000 (ratio 1.79; saturated/bounded)** | `orbits: verlet energy bounded (ratio over 10x time ≤ 2)` |
| RK4 energy SECULAR over 10 000 orbits (e=0.5, dt=T/2000): |ΔE/E| grows linearly | ratio orbit-10000 / orbit-1000 ≈ 10 | **9.28e-8 at orbit 10000 vs 9.28e-9 at orbit 1000 (ratio 10.0; linear secular drift)** | `orbits: rk4 energy grows linearly (ratio ≈ 10 over 10x orbits)` |
| NOTE: RK4 absolute |ΔE/E| is SMALLER than Verlet at any practical dt — the educational point is that Verlet's error is FLAT while RK4's error LINE SLOPES upward. The bench shows this visually (error vs orbit-number plot). Tests check the ratio, not magnitude. | — | Background task confirmed: RK4 still below Verlet even at 10 000 orbits at dt=T/2000. | (informational only — not a separate test) |
| Kepler II: area swept in Δt constant | |dA₁/dt − dA₂/dt| < 1e-6 | (algebraic consequence of L conservation) | `orbits: kepler II equal areas` |
| v_p at perihelion (e=0.9, a=1 AU) | 129.829 km/s ±0.001 | 129.8285 km/s | `orbits: perihelion speed e=0.9` |

### Data sources

- **1 AU = 149 597 870 700 m** — IAU 2012 Resolution B2; exact by definition. Status: **cited, not fetched**.
- **GM_sun = 1.32712440018×10²⁰ m³/s²** (TCB-compatible) — IAU 2015 Resolution B3 (nominal solar mass parameter). Note: plan used 1.3271244×10²⁰ for pre-plan anchors (8 sig. fig.); full value to be used in model. Status: **cited, not fetched**.
- **GM_Earth = 3.986004418×10¹⁴ m³/s²** — IAU 2015 Resolution B3 (nominal). Status: **cited, not fetched**.
- **r_Earth = 6.371×10⁶ m** — IAU 2015 nominal equatorial radius (rounded). Status: **cited, not fetched**.
- All four values to be stored in `js/data/constants.js` with citation.

### Predict questions

1. A comet has semi-major axis 4 AU. What is its period (in years)?
2. Does increasing the eccentricity of an orbit change the period (at fixed a)?
3. Why does a Verlet integrator keep an orbit stable for hundreds of periods when RK4 does not?

### Derive-it steps

1. F = −GMm/r², radial centripetal balance → v²/r = GM/r² → v_circ = √(GM/r).
2. Kepler III: integrate the ellipse area πab = πa²√(1−e²) swept at rate L/2 → T = 2πab/L; with L=√(GMa(1−e²)) and b=a√(1−e²): T = 2π√(a³/GM).
3. Vis-viva: energy conservation E = ½v²−GM/r = −GM/(2a) → v²=GM(2/r−1/a).
4. Escape: set E=0 → v_esc = √(2GM/r).

### Research papers

- Kepler, J. (1619). *Harmonices Mundi*. Linz. (Kepler's third law; no DOI)
- IAU Working Group on Nominal Units for Stellar & Planetary Astronomy (2015). IAU 2015 Resolution B3. (GM_sun nominal value)
- IAU 2012 Resolution B2. (1 AU = 149 597 870 700 m)

### Where it breaks

- Two-body problem only; no N-body perturbations, no general relativistic precession.
- Symplectic Verlet is not time-reversible for variable-step integration; use fixed dt.
- Point masses; no tidal forces, oblateness, or solar pressure.
- Works in natural units (GM, AU, s); unit conversions to SI are exact.

### Related benches

`math/dynamics/ode-explorer` (Euler/RK4 stability), `physics/mechanics/oscillators` (Verlet energy conservation)

---

## Bench 4 — `math/dynamics/logistic-map`

**Level:** university

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| r | growth parameter | dimensionless |
| x | population fraction ∈ [0,1] | dimensionless |
| x* | fixed point = 1−1/r | dimensionless |
| x_A, x_B | period-2 cycle points | dimensionless |
| R_n | n-th superstable parameter (orbit passes through x=½) | dimensionless |
| δ | Feigenbaum constant ≈ 4.6692 | dimensionless |
| λ | Lyapunov exponent = mean ln|r(1−2x)| | dimensionless |
| r_∞ | accumulation point of period-doubling cascade | dimensionless |

### Parameter domain

- r ∈ [0, 4]: map is defined on [0,1] only for r ∈ [0,4]; r > 4 ejects x from [0,1].
- Show "outside domain: x left [0,1]" banner when r > 4 and x exits [0,1].
- r = 0 or r = 1: trivial; x_n → 0.

### Controls and readouts

**Controls:** r slider [0, 4], cobweb toggle, N (bifurcation diagram: 200 plotted after 1000 transient).
**Readouts:** λ (Lyapunov), current period (detected), fixed points, x* stability indicator.

### Anchor → test table

| Anchor | Expected | R1 computed | Test name |
|---|---|---|---|
| Fixed point x*=1−1/r | 0.6 at r=2.5 | 0.6 (exact) | `logistic-map: fixed point 1-1/r` |
| Fixed point stable iff 1<r<3 (|f'(x*)|=|2−r|<1) | stable at r=2.5, unstable at r=3.5 | λ=ln|2−2.5|=ln0.5 < 0 ✓; λ=ln0.5>0 at r=3.5 | `logistic-map: fixed point stability` |
| Period-2 cycle points at r=3.4: [(r+1)±√((r−3)(r+1))]/(2r) | xA=0.842154, xB=0.451963 | computed: f(xA)=xB, f(xB)=xA ✓ | `logistic-map: period-2 formula at r=3.4` |
| Period-4 onset at r=1+√6 | 3.449490 | 3.449490 (algebraic) | `logistic-map: period-4 onset at 1+√6` |
| R1 (period-2 superstable, f²(½)=½): root of r³−4r²+8=0 | 1+√5 = 3.236068 | 3.2360679775 (bisection; cubic=0 verified) | `logistic-map: R1 = 1+√5 (superstable)` |
| R2 (period-4 superstable) | 3.498562 | 3.4985616993 (bracket search) | `logistic-map: R2 superstable from brent` |
| R3 (period-8 superstable) | 3.554641 | 3.5546408628 | `logistic-map: R3 superstable from brent` |
| Feigenbaum 3-iterate ratio (R2−R1)/(R3−R2) | 4.6808 ±0.05 (finite approx; true δ=4.6692 is an asymptotic limit) | **4.680771** (bracket search R1,R2,R3) | `logistic-map: feigenbaum 3-iterate ratio ≈ 4.68 ±0.05` |
| Lyapunov λ(r=4) = ln2 (N=1e6, stochastic) | ln2 ±4×SE | Var(ln|f'|)=0.8225 (integral under invariant density 1/π√(x(1-x))); SE=√(0.8225/1e6)=9.07e-4; **4×SE=3.63e-3** | `logistic-map: lyapunov r=4 = ln2 ±0.00363` |
| Period-3 window: r=1+2√2 | 3.828427 | 3.828427 (algebraic) | `logistic-map: period-3 at r=1+2√2` |
| r>4 exits [0,1]: show domain banner | x_n < 0 or > 1 after a few steps at r=4.1 | verified numerically | `logistic-map: r>4 leaves domain` |
| Boundary r=1: only fixed point x*=0; orbit → 0 | x_n → 0 for any x_0 ∈ (0,1) | algebraic: x*=1-1/1=0 ✓ | `logistic-map: r=1 orbit goes to 0` |
| Boundary r=3: first period-doubling (period-2 born); x* unstable for r>3 | |f'(x*)|=|2-r|=1 at r=3 | algebraic: f'(x*)=2-r=−1 at r=3, |·|=1 ✓ | `logistic-map: r=3 period-doubling boundary` |

### Data sources

- Feigenbaum δ ≈ 4.669201...: **cited, not fetched** (Feigenbaum 1978; r_∞: same source).
- All other anchors are algebraically exact.
- Status: **formulas: anchor derived, test planned (algebraic parts); cited, not fetched (δ, r_∞); data: n/a**

### Predict questions

1. At r=3.2, does the map settle to one fixed point or two?
2. For r=4, the Lyapunov exponent equals ln2. What does this mean for two trajectories starting 10⁻¹⁰ apart?
3. At r=3.83, can you find a stable 3-cycle by iterating from x=0.5?

### Derive-it steps

1. Fixed point: x*=r·x*(1−x*) → x*(1−r+rx*) = 0 → x*=1−1/r (non-trivial root).
2. Stability: f'(x*)=r(1−2x*)=r(1−2(1−1/r))=2−r; stable iff |2−r|<1, i.e. 1<r<3.
3. Period-2: solve f(f(x))=x, factor out fixed points → quadratic in remaining factor.
4. Period-doubling cascade: superstable parameter R_n found by f^(2^n)(½)=½; ratios converge to δ.
5. r=4: x_n=sin²(2^n·arcsin(√x_0)); λ = E[ln|4(1−2x)|] = ln4 + E[ln|1−2x|] = ln4 − ln2 = ln2.

### Research papers

- May, R.M. (1976). Simple mathematical models with very complicated dynamics. *Nature*, 261, 459–467. https://doi.org/10.1038/261459a0
- Feigenbaum, M.J. (1978). Quantitative universality for a class of nonlinear transformations. *J. Stat. Phys.*, 19, 25–52. https://doi.org/10.1007/BF01020332
- Li, T.Y. & Yorke, J.A. (1975). Period three implies chaos. *Am. Math. Monthly*, 82, 985–992. https://doi.org/10.2307/2318254

### Where it breaks

- 1D map only; higher-dimensional maps have richer bifurcation structures.
- The Feigenbaum constant is universal across a class of unimodal maps; the logistic map is one instance.
- Bifurcation diagram appearance depends on bin resolution; very thin windows (e.g. period-3 inner structure) may not be visible at default resolution.
- r > 4: map is no longer self-mapping on [0,1]; trajectories escape — show domain banner.

### Related benches

`math/dynamics/ode-explorer` (ODE stability), `math/probability/central-limit` (statistical properties of iterates)

---

## Bench 5 — `neuroscience/electrophysiology/integrate-and-fire`

**Level:** university

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| V | membrane potential | mV |
| V_rest | resting potential | mV |
| V_th | spike threshold | mV |
| V_reset | reset potential (after spike) | mV |
| V_∞ | asymptotic membrane potential = V_rest + R·I | mV |
| τ_m | membrane time constant | ms |
| R | membrane resistance | MΩ |
| I | injected current | nA |
| I_th | rheobase = (V_th − V_rest)/R | nA |
| t_ref | absolute refractory period | ms |
| ISI | inter-spike interval | ms |
| f | firing rate = 1/ISI | Hz |

### Parameter domain

- I > 0 (depolarising); I < I_th: subthreshold (no spikes — show "subthreshold" annotation)
- τ_m > 0, R > 0, t_ref ≥ 0
- V_reset ≤ V_rest ≤ V_th (required for well-defined rheobase)
- Domain boundary: I = I_th is the rheobase; ISI → ∞ logarithmically as I → I_th⁺

### Illustrative defaults (label "textbook-style, not fitted to a specific neuron")

τ_m=10 ms, V_rest=−65 mV, V_th=−50 mV, V_reset=−65 mV, R=10 MΩ, t_ref=2 ms

### Parameter domain

- I ∈ (I_th, ∞) for spiking; I ∈ [0, I_th] for subthreshold (show "subthreshold" annotation)
- I < 0: hyperpolarising — show "inhibitory input" annotation; V stays below V_rest, no spikes
- I = I_th exactly: ISI → ∞ (logarithmic divergence); show "at rheobase — period infinite" annotation
- τ_m > 0, R > 0, t_ref ≥ 0, V_reset ≤ V_rest ≤ V_th required for well-defined rheobase

### Controls and readouts

**Controls:** I, τ_m, V_th, t_ref, dt.
**Readouts:** V(t) trace, spike times, f (measured and formula), ISI formula, "subthreshold" or "suprathreshold" label.

### Anchor → test table

| Anchor | Expected | R1 computed | Test name |
|---|---|---|---|
| ISI at I=2nA: t_ref+τ_m·ln[(V_∞−V_reset)/(V_∞−V_th)] | 2+10·ln4 = 15.862944 ms | **15.862944 ms** (from formula; exact algebraic) | `iaf: ISI = 2+10·ln4 at I=2nA ±1e-10` |
| f = 1/ISI at I=2nA | 63.040 Hz | **63.040 Hz** (1/15.862944e-3) | `iaf: f = 63.040 Hz at I=2nA ±1e-6` |
| Rheobase I_th = (V_th−V_rest)/R | (−50−(−65))/10 = 1.5 nA | **1.5 nA** (exact) | `iaf: rheobase = 1.5 nA ±1e-10` |
| No spike when I < I_th (I=1 nA) | V_∞=−55 mV < V_th=−50 mV | −55 mV (computed) | `iaf: no spike below rheobase` |
| Simulation (exact exponential update, threshold linearly interpolated) matches ISI ±1e-5 relative at dt=0.001 ms | |ISI_sim/ISI_formula − 1| < 1e-5 | At threshold dV/dt≈(V_∞−V_th)/τ_m=0.5 mV/ms; dt=0.001ms; interpolation error ≈ dt·(dV/dt)/(2·(V_th−V_at_last_step))≪1e-5; ±1e-5 relative (R2: derived in comment) | `iaf: simulation matches closed form ±1e-5 rel` |
| Convergence: dt=0.0005 ms gives same ISI ±1e-5 relative (R2 halving) | same as above | (half-dt → quarter interpolation error) | `iaf: dt-halving convergence ±1e-5` |
| Subthreshold step reaches 63.2% at t=τ_m | 1−1/e = 0.632120 ±1e-10 | algebraic | `iaf: 63.2% response at t=tau_m ±1e-10` |
| Boundary I=I_th: ISI formula has ln[(V_∞-V_reset)/(0)] → ∞ | ISI → ∞; no spike produced in finite time | V_∞=V_th → ln(∞) = ∞ (algebraic) | `iaf: rheobase boundary no finite ISI` |

### Data sources

- All formulas are analytically derived from the ODE τ_m dV/dt = −(V−V_rest) + R·I.
- Default parameters are **textbook-style illustrative values, not fitted to a specific cell**. Label in UI.
- Status: **formulas: anchor derived, test planned; data: n/a (illustrative parameters)**

### Predict questions

1. The current doubles to 4 nA. Does the firing rate double, more than double, or less than double?
2. What happens to the ISI as I approaches the rheobase from above?
3. Increasing the time constant τ_m — does the firing rate go up or down for the same I?

### Derive-it steps

1. ODE: τ_m dV/dt = −(V−V_rest) + R·I → solution V(t) = V_∞ + (V_reset−V_∞)e^(−t/τ_m).
2. Spike when V=V_th: V_∞+(V_reset−V_∞)e^(−T/τ_m)=V_th → T = τ_m·ln[(V_∞−V_reset)/(V_∞−V_th)].
3. ISI = t_ref + T.
4. Rheobase: V_∞=V_th → R·I_th = V_th−V_rest → I_th = (V_th−V_rest)/R.
5. Near rheobase: V_∞−V_th ≈ R·(I−I_th) → T ≈ τ_m·ln[1/(R·(I−I_th))] → f ∝ 1/ln(I−I_th) (logarithmic).

### Research papers

- Lapicque, L. (1907). Recherches quantitatives sur l'excitation électrique des nerfs traitée comme une polarisation. *J. Physiol. Pathol. Gén.*, 9, 620–635. (no DOI — primary)
- Gerstner, W., Kistler, W.M., Naud, R. & Paninski, L. (2014). *Neuronal Dynamics: From Single Neurons to Networks and Models of Cognition*. Cambridge University Press. (online: https://neuronaldynamics.epfl.ch) Ch. 1.

### Where it breaks

- No ionic currents; the spike waveform is stipulated (vertical upswing then reset), not generated.
- Constant input current only; time-varying I (sinusoidal, noisy) requires numerical integration.
- No adaptation (spike-frequency adaptation), bursting, or subthreshold oscillations.
- Absolute refractory period only; no relative refractory period.
- Parameters are textbook-style; real neurons vary widely.
- Link to `neuroscience/electrophysiology/rc-circuit`: the subthreshold membrane is identical to an RC circuit (τ_m = R_m·C_m).

### Related benches

`physics/electromagnetism/rc-circuit` (same RC subthreshold dynamics), `neuroscience/electrophysiology/goldman` (ionic basis of V_rest), `neuroscience/electrophysiology/neuron` (HH model, full spikes)

---

## Bench 6 — `psychology/learning/rescorla-wagner`

**Level:** intro

### Symbol table

| Symbol | Meaning | Unit |
|---|---|---|
| V_i | associative strength of stimulus i | dimensionless |
| α_i | salience (learning rate) of stimulus i | dimensionless |
| β | US processing rate | dimensionless |
| λ | asymptote (US value; λ=1 with US, λ=0 without) | dimensionless |
| ΣV | sum of V_i over stimuli present on trial | dimensionless |
| ΔV_i | change in V_i on one trial | dimensionless |
| n | trial number | — |
| α_i·β | learning rate (product of salience and US rate); written αβ when unambiguous | dimensionless |

### Parameter domain

- 0 < α_i ≤ 1, 0 < β ≤ 1 (salience and processing rate)
- α_i·β ∈ (0, 1]: domain for convergent learning
- α_i·β > 1 oscillates; α_i·β > 2 diverges (show "outside domain" toggle — allowed but labelled)
- λ ∈ {0, 1} per trial type; can be extended to arbitrary values
- V_i may be negative (conditioned inhibition); no clamping

### Controls and readouts

**Controls:** scenario selector (acquisition, extinction, blocking, overshadowing, overexpectation, conditioned inhibition), α_A, α_B, β, λ, trial count.
**Readouts:** V_i vs trial, predicted ΣV vs λ curve.

### Anchor → test table

| Anchor | Expected | R1 computed | Test name |
|---|---|---|---|
| Acquisition V_n = λ(1−(1−αβ)^n), single cue | V_1=αβ, V→λ | verified at n=1..20, αβ=0.25 ±1e-10 | `rw: acquisition closed form ±1e-10` |
| Extinction V_n·(1−αβ)^n decay from V_0=λ | V→0 | (mirror of acquisition with λ=0) ±1e-10 | `rw: extinction closed form ±1e-10` |
| Blocking: A→λ to asymptote, then AB→λ: ΔV_B=0 | V_B ≈ 0 ±1e-10 | 0.000000 (100 phase-2 trials) | `rw: blocking delta-V_B = 0 ±1e-10` |
| Overshadowing asymptote: V_A=λ·α_A/(α_A+α_B), V_B=λ·α_B/(α_A+α_B) | 0.6, 0.4 (α_A=0.6, α_B=0.4, β=0.5) | **0.600000, 0.400000** (1000 trials) ±1e-6 | `rw: overshadowing asymptote ±1e-6` |
| Overexpectation: AB→λ after A+,B+ trained to λ separately; both → λ/2 | V_A=V_B=0.5 | **0.500000** (1000 trials) ±1e-6 | `rw: overexpectation V=lambda/2 ±1e-6` |
| Conditioned inhibition: A+/AX- → V_A=λ, V_X=−λ after n→∞ trials | V_A=1, V_X=−1 ±1e-10 | residual after 1000 trials: (1-αβ)^1000 ≈ (0.75)^1000 ≈ 3e-125 → **machine-zero convergence** | `rw: conditioned inhibition ±1e-10` |
| α_i·β>1 oscillates (V_n alternates sign) | oscillation present | verified with αβ=1.5 | `rw: outside domain oscillates at ab>1` |
| α_i·β>2 diverges | V_n → ±∞ | verified with αβ=2.1 | `rw: outside domain diverges at ab>2` |
| Boundary αβ=0: no learning; V stays at V_0 for all n | V_n = V_0 exactly | algebraic: ΔV=0·(λ−V)=0 ✓ | `rw: boundary ab=0 no learning ±1e-10` |
| Boundary αβ=1: one-trial learning; V_1=λ for all n≥1 | V_1=λ, V_2=λ (stable) | algebraic: V_1=V_0+(1)·(λ−V_0)=λ; thereafter ΔV=0 ✓ | `rw: boundary ab=1 one-trial learning ±1e-10` |

### Data sources

- R–W rule is a closed-form learning model; all constants are free parameters.
- No empirical constants. Status: **formulas: anchor derived, test planned; data: n/a**
- Blocking first observed by Kamin (1969); R–W provides the mechanistic account.

### Predict questions

1. After 20 A-only trials (αβ=0.25, λ=1), what is V_A? (Formula: 1−(0.75)²⁰.)
2. In a blocking experiment, why does B never get conditioned even though it is always paired with the US?
3. If α_A=0.8 and α_B=0.2 (and same β), what is the long-run ratio V_A/V_B in an overshadowing experiment?

### Derive-it steps

1. Rule: ΔV_i = α_i·β·(λ−ΣV). Total error λ−ΣV drives all stimuli present on that trial.
2. Single cue: ΔV = αβ(λ−V) → V_{n+1}=(1−αβ)V_n+αβλ → V_n=λ(1−(1−αβ)^n).
3. Blocking: V_A=λ before AB phase → ΔV_i = αβ(λ−λ−V_B) = −αβV_B; V_B ≈ 0 after many trials since it starts at 0 and receives near-zero error.
4. Overshadowing asymptote: ΔV_A = ΔV_B = αβ(λ−V_A−V_B)/1 but ΔV_A/ΔV_B = α_A/α_B always → V_A/V_B = α_A/α_B at all times; summing: V_A+V_B → λ.
5. Conditioned inhibition: A+ gives V_A↑; AX− gives λ=0, so ΔV_A=αβ(0−V_A−V_X)↓ and ΔV_X=αβ(0−V_A−V_X)↓; asymptote V_A=λ, V_X=−λ.

### Research papers

- Rescorla, R.A. & Wagner, A.R. (1972). A theory of Pavlovian conditioning: Variations in the effectiveness of reinforcement and nonreinforcement. In Black, A.H. & Prokasy, W.F. (eds.), *Classical Conditioning II: Current Research and Theory*, pp. 64–99. Appleton-Century-Crofts. (no DOI — book chapter)
- Kamin, L.J. (1969). Predictability, surprise, attention, and conditioning. In Campbell, B.A. & Church, R.M. (eds.), *Punishment and Aversive Behavior*, pp. 279–296. Appleton-Century-Crofts. (no DOI — book chapter)
- Miller, R.R., Barnet, R.C. & Grahame, N.J. (1995). Assessment of the Rescorla-Wagner model. *Psychol. Bull.*, 117(3), 363–386. https://doi.org/10.1037/0033-2909.117.3.363

### Where it breaks

- Latent inhibition: pre-exposing a CS before conditioning retards acquisition — not captured.
- Extinction is not unlearning: spontaneous recovery, renewal, and reinstatement after extinction contradict the idea that V returns to 0 (R–W models extinction as V decreasing, implying permanent unlearning).
- No attention changes: Mackintosh (1975) and Pearce–Hall (1980) models add dynamic α_i — not shown.
- Trial-level model only: no timing within a trial, no inter-trial intervals.
- Second-order conditioning: R–W does not naturally account for CS becoming a reinforcer.
- Human blocking results are mixed: blocking is robust in animals but inconsistent in human studies.

### Related benches

`psychology/psychophysics/signal-detection` (decision theory), `psychology/perception/weber-fechner` (perception laws)

---

## Implementation order

1. New catalog fields (`math/dynamics`, `psychology/learning`) — own commit
2. `math/dynamics/ode-explorer` (reuses Integrators; tests already pass for order checks)
3. `physics/mechanics/oscillators`
4. `physics/mechanics/orbits`
5. `math/dynamics/logistic-map`
6. `neuroscience/electrophysiology/integrate-and-fire`
7. `psychology/learning/rescorla-wagner`

One commit per bench. `npm test` before each commit.

---

## Key reuse

| Need | File |
|---|---|
| Euler, Heun, Verlet, RK4, backwardEuler | `js/core/Integrators.js` (all now present) |
| Root-finding (RK4 stability limit, logistic superstable) | `js/core/RootFinding.js` |
| Seeded RNG (none needed in Phase 6) | — |
| Axes/plotting | `js/core/Axes.js` |
| Two-panel layout | existing benches |
| RC-circuit model (subthreshold IAF comparison) | `js/benches/physics/electromagnetism/rc-circuit/RCCircuitModel.js` |
