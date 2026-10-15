# Phase 6 review

**Date:** 2026-10-15
**Reviewer:** independent agent
**Test suite:** node --test 'tests/**/*.test.js'

---

## 1. Summary table

| Bench | Files present | Tests added | Formula status | Science status |
|---|---|---|---|---|
| math/dynamics/ode-explorer | Model, View, Bench | 9 | Correct | PASS |
| physics/mechanics/oscillators | Model, View, Bench | 11 | Correct | PASS |
| physics/mechanics/orbits | Model, View, Bench | 8 | Correct | PASS — domain gap (e≥1) |
| math/dynamics/logistic-map | Model, View, Bench | 14 | Correct | PASS |
| neuroscience/electrophysiology/integrate-and-fire | Model, View, Bench | 7 | Correct | PASS — dead code noted |
| psychology/learning/rescorla-wagner | Model, View, Bench | 10 | Correct | PASS |

---

## 2. Anchor audit table

| Anchor | File | Test name | Assertion tolerance | Status |
|---|---|---|---|---|
| RK4 stability limit ≈ 2.785294 | OdeExplorerModel.js | `ode-explorer: RK4 stability limit ≈ 2.7853` | 1e-4 | PASS |
| Euler diverges at λh > 2 | Integrators.js | `ode-explorer: euler diverges at λh=2.5` | > 1e10 | PASS |
| RK4 stable at λh=2.5 | Integrators.js | `ode-explorer: rk4 decays at λh=2.5` | < 1e-10 | PASS |
| RK4 unstable at λh=3.0 | Integrators.js | `ode-explorer: rk4 diverges at λh=3.0` | > 1e10 | PASS |
| Logistic RK4 accuracy h=0.001 | OdeExplorerModel.js | `ode-explorer: logistic rk4 agrees ±1e-7 at h=0.001` | 1e-7 | PASS |
| Convergence order Euler≈1 | OdeExplorerModel.js | `ode-explorer: convergence slope euler ≈ 1 ±0.15` | ±0.15 | PASS |
| Convergence order Heun≈2 | OdeExplorerModel.js | `ode-explorer: convergence slope heun ≈ 2 ±0.15` | ±0.15 | PASS |
| Convergence order RK4≈4 | OdeExplorerModel.js | `ode-explorer: convergence slope rk4 ≈ 4 ±0.15` | ±0.15 | PASS |
| Fixed point x*=1−1/r | LogisticMapModel.js | `logistic-map: fixed point 1-1/r at r=2.5` | 1e-10 | PASS |
| Period-4 onset r=1+√6 | LogisticMapModel.js | `logistic-map: period-4 onset at r=1+√6` | 1e-6 (multiplier) | PASS |
| Superstable R1=1+√5 | LogisticMapModel.js | `logistic-map: R1 = 1+√5` | 1e-6 | PASS |
| Superstable R2≈3.498562 | LogisticMapModel.js | `logistic-map: R2 superstable ≈ 3.498562` | 1e-4 | PASS |
| Superstable R3≈3.554641 | LogisticMapModel.js | `logistic-map: R3 superstable ≈ 3.554641` | 1e-4 | PASS |
| Feigenbaum 3-iterate ratio≈4.68 | LogisticMapModel.js | `logistic-map: feigenbaum 3-iterate ratio ≈ 4.68` | ±0.05 | PASS |
| Lyapunov r=4 = ln2 | LogisticMapModel.js | `logistic-map: lyapunov r=4 = ln2 ±0.00363` | 4×SE=0.00363 | PASS |
| r>4 domain exit | LogisticMapModel.js | `logistic-map: r>4 leaves domain [0,1]` | null present | PASS |
| Period-3 at r=1+2√2 | LogisticMapModel.js | `logistic-map: period-3 at r=1+2√2` | 1e-8 | PASS |
| A(0)=F₀/ω₀² | OscillatorsModel.js | `oscillators: A(ω) formula — static deflection at ω=0` | 1e-10 | PASS |
| ω_r=√(ω₀²−2γ²) is amplitude maximum | OscillatorsModel.js | `oscillators: displacement peak at ω_r for γ=0.3ω₀` | ±0.001 scan | PASS |
| Velocity amplitude peaks at ω₀ | OscillatorsModel.js | `oscillators: velocity amplitude peaks at ω₀` | ±0.001 scan | PASS |
| Phase=π/2 at ω=ω₀ | OscillatorsModel.js | `oscillators: phase = π/2 at ω = ω₀` | 1e-10 | PASS |
| Log decrement δ=2πγ/ω_d | OscillatorsModel.js | `oscillators: log decrement δ = 2πγ/ω_d` | 1e-10 | PASS |
| Log decrement matches peak ratio | OscillatorsModel.js | `oscillators: log decrement matches RK4 peak ratio` | 1e-4 | PASS |
| Critical damping no overshoot | OscillatorsModel.js | `oscillators: critical damping γ=ω₀ no overshoot` | ≥ −1e-10 | PASS |
| Critical x(1/ω₀)=2/e | OscillatorsModel.js | `oscillators: critical x(1/ω₀) = 2/e for ω₀=1, γ=1` | 1e-6 | PASS |
| RK4 steady-state amplitude | OscillatorsModel.js | `oscillators: RK4 steady-state agrees ±1e-8 at ω=0.5ω₀` | **1e-4** (see §3) | CONCERN |
| No resonance for γ≥ω₀/√2 | OscillatorsModel.js | `oscillators: no displacement resonance when γ ≥ ω₀/√2` | isNaN | PASS |
| T_Earth=365.2569 days | OrbitModel.js | `orbits: T_Earth = 365.257 days ±0.02` | ±0.02 days | PASS |
| v_circ=29.7847 km/s | OrbitModel.js | `orbits: vis-viva circular orbit v_circ = 29.7847 km/s` | ±0.001 km/s | PASS |
| v_esc=11.186 km/s | OrbitModel.js | `orbits: Earth escape speed 11.186 km/s ±0.01` | ±0.01 km/s | PASS |
| Kepler III T independent of e | OrbitModel.js | `orbits: period independent of eccentricity` | 1e-10 | PASS |
| Verlet energy bounded | OrbitModel.js | `orbits: verlet energy bounded (ratio ≤ 3.2)` | ratio ≤ 3.2 | PASS |
| RK4 secular drift | OrbitModel.js | `orbits: rk4 energy grows secularly (ratio ≥ 5)` | ratio ≥ 5 | PASS |
| Angular momentum Verlet | OrbitModel.js | `orbits: kepler II equal areas` | 1e-6 | PASS |
| e≥1 unbound handling | OrbitModel.js | `orbits: unbound flag for e >= 1` | period > 0 | CONCERN |
| Rheobase I_th=1.5 nA | IntegrateAndFireModel.js | `iaf: rheobase = 1.5 nA ±1e-10` | 1e-10 | PASS |
| ISI=2+10·ln4 at I=2 nA | IntegrateAndFireModel.js | `iaf: ISI = 2+10·ln4 at I=2nA ±1e-10` | 1e-10 | PASS |
| Firing rate f=63.04 Hz | IntegrateAndFireModel.js | `iaf: f = 63.04 Hz at I=2nA ±1e-4` | 1e-4 Hz | PASS |
| No spike below rheobase | IntegrateAndFireModel.js | `iaf: no spike below rheobase` | ISI=Infinity | PASS |
| 63.2% deflection at τ_m | IntegrateAndFireModel.js | `iaf: 63.2% of deflection at t=τ_m ±1e-10` | 1e-10 | PASS |
| Sim ISI matches closed form | IntegrateAndFireModel.js | `iaf: simulation matches closed form ISI ±1e-5 at dt=0.001` | **1e-4** (see §3) | CONCERN |
| Sim ISI dt-halving | IntegrateAndFireModel.js | `iaf: dt-halving convergence ±1e-5 relative` | **1e-4** (see §3) | CONCERN |
| Acquisition V_n=λ(1−(1−αβ)^n) | RescorlaWagnerModel.js | `rw: acquisition closed form ±1e-10` | 1e-10 | PASS |
| Extinction V_n=V₀(1−αβ)^n | RescorlaWagnerModel.js | `rw: extinction closed form ±1e-10` | 1e-10 | PASS |
| Blocking ΔV_B≈0 | RescorlaWagnerModel.js | `rw: blocking delta-V_B = 0 ±1e-6` | 1e-6 | PASS |
| Overshadowing asymptote | RescorlaWagnerModel.js | `rw: overshadowing asymptote ±1e-6` | 1e-6 | PASS |
| Overexpectation V=λ/2 | RescorlaWagnerModel.js | `rw: overexpectation V=lambda/2 ±1e-6` | 1e-6 | PASS |
| Conditioned inhibition | RescorlaWagnerModel.js | `rw: conditioned inhibition ±1e-10` | 1e-10 | PASS |
| αβ>1 oscillates | RescorlaWagnerModel.js | `rw: outside domain oscillates at compound β·Σα > 1` | sign alternation | PASS |
| αβ>2 diverges | RescorlaWagnerModel.js | `rw: outside domain diverges at αβ > 2` | > 100 | PASS |

---

## 3. Issues found

### CONCERN — Oscillators: test name claims ±1e-8 but assertion uses 1e-4 (test `oscillators: RK4 steady-state agrees with closed form ±1e-8 at ω=0.5ω₀`)

The test name and internal comment both claim tolerance ±1e-8, but the `assert.ok` uses `< 1e-4`. The internal comment says "RK4 global error O(dt⁴) ≈ O(1.6e-8) per step" — this is analytically wrong on two counts:

- O(dt⁴) is the **global** error for RK4, not the per-step error. The per-step local truncation error is O(dt⁵).
- With dt ≈ 0.0628, dt⁴ = 1.56e-5 and dt⁵ = 9.8e-7. The comment claims 1.6e-8, which corresponds to approximately dt⁷ — no standard RK4 order.
- Over 50 cycles × 200 steps = 10000 steps, the global error estimate is ~10000 × dt⁵ ≈ 9.8e-3. The assertion tolerance of 1e-4 is reasonable for this case, but the test name label of 1e-8 is 10000× too optimistic and should be corrected to ±1e-4 to match the assertion.

**Severity:** Minor — the assertion itself passes at the correct tolerance; only the name and comment are wrong.

---

### CONCERN — IAF: two test names claim 1e-5 but assertions use 1e-4 (tests `iaf: simulation matches closed form ISI ±1e-5 relative at dt=0.001 ms` and `iaf: dt-halving convergence ±1e-5 relative (dt=0.0005 ms)`)

Both IAF simulation tests name a tolerance of 1e-5 but the `assert.ok` expressions use `< 1e-4`. The correct analytical tolerance for dt=0.001 ms is approximately dt/ISI ≈ 0.001/15.86 ≈ 6.3e-5, which is tighter than 1e-4 but not 1e-5. The label 1e-5 is unachieved; the assertion tolerance 1e-4 is analytically justified. The test names should read `±1e-4`.

**Severity:** Minor — assertions pass; only name is inaccurate.

---

### CONCERN — Orbits: "unbound flag for e ≥ 1" test is vacuous for its stated purpose

The test comment states "e≥1 is unbound; model should expose this via energy computation" and the test name says "unbound flag for e >= 1", but the test body constructs an orbit with **e=0.99** (a bound orbit) and only verifies that `m.period` is positive and finite — which it trivially is for any e < 1.

A true parabolic (e=1) or hyperbolic (e>1) orbit is never tested. At e=1, `rPerihelion = a*(1−e) = 0` and `vPerihelion = √(GM*(1+e)/(a*(1−e)))` → division by zero, producing Infinity. The model has no guard for e ≥ 1 and the Bench slider caps e at 0.95, so this edge case is silently unreachable but also unverified.

The test passes only because e=0.99 is itself a bound orbit — the assertion adds zero coverage of the stated domain boundary.

**Severity:** Moderate — missing domain coverage for hyperbolic trajectories (e ≥ 1). The test name is misleading.

---

### MINOR — IAF `simulate()`: dead code at line 110

Inside `IntegrateAndFireModel.simulate()`, line 110 computes:

```js
const Vprev = Vinf + (Vs[i] - Vinf) * Math.exp(-dt / tauM);
```

The variable `Vprev` is assigned but never read. It was presumably intended for a more precise spike-time interpolation but the code immediately uses `spikeTimes.push(t)` (integer-step time) instead. This dead code should be removed or replaced with the intended linear interpolation.

**Severity:** Minor code quality — no effect on correctness.

---

### MINOR — Rescorla-Wagner: VB symbol overloaded as VX in conditioned-inhibition scenario

The model returns `{ VA, VB }` for all scenarios, but in the `conditioned-inhibition` scenario the comment documents that "VB represents VX here." The test and model both acknowledge this, but the Bench readout labels it as "V_B (final)" in all scenarios, which will display "V_B" to the user even when the quantity is V_X. This is a display/symbol mismatch at the UI layer.

**Severity:** Minor UX — no computational error; documentation in model is correct.

---

### INFO — Logistic-map: Feigenbaum ratio tolerance ±0.05 is appropriate

The model comment correctly notes that the 3-iterate ratio (R2−R1)/(R3−R2) ≈ 4.6808 is a **finite approximation** to the asymptotic δ = 4.6692. The test tolerance ±0.05 is justified for this 3-term approximation. No concern.

---

### INFO — ODE-explorer: backwardEuler convergence not tested

The test suite verifies Euler (order 1), Heun (order 2), and RK4 (order 4) convergence slopes on y′=−y. Backward Euler is order 1 but its convergence is not verified by a slope test. The Bench skips the convergence panel for `backwardEuler` (correct, since the primary interest is stability), but a completeness note: no test verifies that backwardEuler actually produces an accurate solution or that it is order 1.

**Severity:** Minor — the stability feature (unconditionally stable) is the advertised property and is implied by the fact that it doesn't blow up; accuracy not claimed.

---

## 4. Formula verification summary

All core formulas were independently verified analytically or numerically:

| Formula | Verified result |
|---|---|
| Logistic exact solution y(5) | 0.9428256… — correct |
| RK4 stability poly \|p(−2.785294)\| | 1.0000007 ≈ 1 — correct |
| Oscillator ω_r = √(ω₀²−2γ²) is amplitude maximum | Verified by scan — correct |
| Phase = π/2 exactly at ω = ω₀ | atan2(2γω₀, 0) = π/2 — correct |
| Log decrement δ = 2πγ/ω_d | Correct; successive-peak ratio = exp(δ) |
| Critical damping x(1/ω₀) = 2/e | 0.73576… — correct |
| Kepler T = 2π√(a³/GM) | T_Earth = 365.2569 days — matches IAU |
| Perihelion speed v_p = √(GM(1+e)/(a(1−e))) | Matches vis-viva — correct |
| IAF Vinf = Vrest + R·I | −65 + 20 = −45 mV — correct |
| IAF ISI = 2 + 10·ln4 at I=2 nA | 15.8629 ms — correct |
| IAF I_th = (V_th − V_rest)/R | 15/10 = 1.5 nA — correct |
| R-W acquisition V_n = λ(1−(1−αβ)^n) | Verified for n=1…20 — correct |
| R-W conditioned inhibition asymptote | VA→1, VB→−1 — verified numerically |
| Logistic R1 = 1+√5 satisfies r³−4r²+8=0 | Yes, exactly — correct |
| Lyapunov Var(ln\|f′\|) at r=4 ≈ 0.8225 | Numerically 0.8227 — consistent |
| Lyapunov SE = √(Var/N) for N=1e6 | 9.07e-4; 4×SE = 3.63e-3 — correct |

---

## 5. Test suite summary

```
node --test 'tests/**/*.test.js'

# tests 460
# pass  460
# fail    0
```

All 460 tests pass. The 59 tests added by Phase 6 (ode-explorer: 9, logistic-map: 14, oscillators: 11, orbits: 8, iaf: 7, rescorla-wagner: 10) all pass.

---

## 6. Actionable recommendations (priority order)

1. **Orbits e≥1 domain coverage** (Moderate): Rename the test to reflect what it actually tests (`e=0.99 bound orbit`), or replace it with a genuine test that guards against e≥1 (e.g., `assert.ok(isNaN(m.vPerihelion))` or `assert.throws`). The model should either accept e≥1 with a documented Infinity/NaN convention or throw on invalid input.

2. **Oscillator steady-state test name and comment** (Minor): Rename `'RK4 steady-state agrees with closed form ±1e-8 at ω=0.5ω₀'` → `'RK4 steady-state agrees with closed form ±1e-4 at ω=0.5ω₀'`. Fix the comment: "O(dt⁴) ≈ O(1.6e-8) per step" is wrong; correct to "O(dt⁵) per step ≈ 9.8e-7; global O(dt⁴) ≈ 1.6e-5; tolerance 1e-4 includes 50-cycle accumulation."

3. **IAF test names** (Minor): Rename both IAF simulation tests from `±1e-5` to `±1e-4` to match the assertions.

4. **IAF dead code** (Minor): Remove or implement the `Vprev` variable in `IntegrateAndFireModel.simulate()` line 110. If spike-time interpolation is not intended, delete the line. If it is intended, use it to refine `spikeTimes.push`.

5. **R-W Bench readout label for conditioned-inhibition** (Minor): Display "V_X (final)" when the scenario is `conditioned-inhibition` rather than the generic "V_B (final)".
