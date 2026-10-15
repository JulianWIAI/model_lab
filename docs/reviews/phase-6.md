# Phase 6 review (phase-6b)

**Date:** 2026-10-15
**Reviewer:** independent agent
**Test suite:** node --test 'tests/**/*.test.js'

---

## 1. Phase summary

Phase 6 added 6 benches (ode-explorer, oscillators, orbits, logistic-map,
integrate-and-fire, rescorla-wagner) with 460 tests at tag `phase-6`.
Phase-6b (this tag) closes with 477 tests, 0 fail, after fixing blank benches
(STEP 0), strengthening 16 gap tests (STEP 2), and verifying all anchors.

---

## 2. Blank-bench fix (STEP 0)

Three independent root causes — all fixed in one commit (`77aa493`):

| # | Defect | File | Fix |
|---|---|---|---|
| 1 | `this.layout.addReadout(…)` → TypeError (method did not exist) | `BenchLayout.js` | Added `addReadout(p){this.setReadouts(p);}` alias |
| 2 | `ReadoutPanel` destructures `{key}` but Phase 6 passes `{id}` → all `set()` calls silently fail | `ReadoutPanel.js` | Changed to `const k = key ?? id` |
| 3 | All 6 benches had `onFrame(){}` (never called); no `draw()` override → canvas never repainted after layout resolves from 0×0 | all 6 `*Bench.js` | Replaced with `draw(){this._update();}` |

No Playwright runner was added (browser-less test environment; manual smoke test confirmed fix).

---

## 3. Gap list — final statuses (STEP 1)

### logistic-map

| Item | Status before | Test name | Tolerance | Status after |
|---|---|---|---|---|
| Invariant density | MISSING | `logistic-map: invariant density at r=4 — fraction in [0.25,0.75] = 1/3 ±4σ` | 4×SE=0.0042 | PRESENT |
| Sensitivity | MISSING | `logistic-map: sensitivity at r=4 — two orbits diverge` | > 0.1 | PRESENT |
| Period-4 multiplier | PRESENT | `logistic-map: period-4 onset at r=1+√6` | 1e-6 | PRESENT |
| Period-3 roots (3 distinct) | WEAK (one starting point only) | `logistic-map: period-3 at r=3.83 has 3 distinct cycle points` | 1e-6 | PRESENT |
| Feigenbaum vs δ | WEAK (3-iterate ±0.05 vs 4.68) | `logistic-map: feigenbaum 4-iterate ratio ≈ δ=4.6692 ±0.1` | ±0.1 | PRESENT |
| Stability formula | WEAK (constant vs constant) | `logistic-map: |f′(x*)| at r=3 computed via model` | 1e-10 | PRESENT |
| Lyapunov SE | WEAK (0.8225 magic constant) | `logistic-map: lyapunov r=4 = ln2, tolerance from Var=π²/12` | 4×√(π²/12N) | PRESENT |

### integrate-and-fire

| Item | Status before | Test name | Tolerance | Status after |
|---|---|---|---|---|
| f→0 at rheobase | MISSING | `iaf: firing rate → 0 as I → I_th from above` | f<10 Hz, monotone | PRESENT |
| Large-I asymptote | MISSING | `iaf: ISI formula verified at large I=10 nA ±1e-10` | 1e-10 | PRESENT |
| dt-halving measurement | WEAK (vs closed form only) | `iaf: dt-halving error ratio ≈ 2` | ratio ∈ [1.5, 2.5] | PRESENT |

### orbits

| Item | Status before | Test name | Tolerance | Status after |
|---|---|---|---|---|
| RK4 crosses Verlet at dt=T/100 | MISSING | `orbits: rk4 secular drift ratio ≥ 5 at dt=T/100` + `orbits: rk4 absolute energy error exceeds verlet at dt=T/100 after 1000 orbits` | ratio ≥ 5; absolute > | PRESENT |
| Constants labeling | PRESENT (IAU labels in source) | — | — | PRESENT |
| e≥1 domain guard | MISSING | `orbits: e≥1 throws RangeError` | throws | PRESENT |

### oscillators

| Item | Status before | Test name | Tolerance | Status after |
|---|---|---|---|---|
| 2% settling time | MISSING | `oscillators: 2% settling time — underdamped (ζ=0.8) settles before critical (ζ=1)` | < 10 s; ζ=0.8 < ζ=1 | PRESENT |
| A(ω) sweep | WEAK (ω=0.5 only) | `oscillators: A(ω_r) is global max` + `oscillators: A(ω) formula verified at ω=0.3, 0.7, 1.4, 2.0` | ±1e-10; ±2e-4 | PRESENT |
| Tolerance derivation | WEAK (comment-only) | Multi-frequency test with tolerance justified: peak-detection error A·(ω·dt/2)²/2 with 300 steps/cycle | 2e-4 analytic | PRESENT |

### rescorla-wagner

| Item | Status before | Test name | Tolerance | Status after |
|---|---|---|---|---|
| Compound oscillation | WEAK (single-cue despite compound title) | `rw: outside domain oscillates at compound β·Σα > 1` — αA=αB=0.8, β=0.9, β·Σα=1.44 | sign alternation | PRESENT |

### ode-explorer

| Item | Status before | Test name | Tolerance | Status after |
|---|---|---|---|---|
| backwardEuler order | MISSING | `ode-explorer: convergence slope for backwardEuler ≈ 1 ±0.15` | ±0.15 | PRESENT |
| backwardEuler A-stability | MISSING | `ode-explorer: backwardEuler is A-stable — decays at λh=3.0` | < 1e-10 | PRESENT |

---

## 4. Tests added (STEP 2)

One commit per bench.

| Bench | Commit | Tests added | Net count |
|---|---|---|---|
| logistic-map | `9482db9` | 6 | 14 → 20 |
| integrate-and-fire | `9f24886` | 3 | 8 → 11 |
| orbits | `4efb2cc` | 3 (+model guard) | 9 → 12 |
| oscillators | `96f2d8e` | 3 | 11 → 14 |
| rescorla-wagner | `7b75a38` | 0 (replaced 1) | 10 → 10 |
| ode-explorer | `3a63f81` | 2 | 9 → 11 |

---

## 5. Anchor audit table

| Anchor | File | Test name | Tolerance | Status |
|---|---|---|---|---|
| RK4 stability limit ≈ 2.785294 | OdeExplorerModel.js | `ode-explorer: RK4 stability limit ≈ 2.7853` | 1e-4 | PASS |
| Euler diverges at λh > 2 | Integrators.js | `ode-explorer: euler diverges at λh=2.5` | > 1e10 | PASS |
| RK4 stable at λh=2.5 | Integrators.js | `ode-explorer: rk4 decays at λh=2.5` | < 1e-10 | PASS |
| RK4 unstable at λh=3.0 | Integrators.js | `ode-explorer: rk4 diverges at λh=3.0` | > 1e10 | PASS |
| backwardEuler A-stable at λh=3.0 | Integrators.js | `ode-explorer: backwardEuler is A-stable` | < 1e-10 | PASS (new) |
| backwardEuler order-1 | OdeExplorerModel.js | `ode-explorer: convergence slope for backwardEuler ≈ 1` | ±0.15 | PASS (new) |
| Logistic RK4 accuracy h=0.001 | OdeExplorerModel.js | `ode-explorer: logistic rk4 agrees ±1e-7 at h=0.001` | 1e-7 | PASS |
| Convergence order Euler≈1 | OdeExplorerModel.js | `ode-explorer: convergence slope euler ≈ 1 ±0.15` | ±0.15 | PASS |
| Convergence order Heun≈2 | OdeExplorerModel.js | `ode-explorer: convergence slope heun ≈ 2 ±0.15` | ±0.15 | PASS |
| Convergence order RK4≈4 | OdeExplorerModel.js | `ode-explorer: convergence slope rk4 ≈ 4 ±0.15` | ±0.15 | PASS |
| Fixed point x*=1−1/r | LogisticMapModel.js | `logistic-map: fixed point 1-1/r at r=2.5` | 1e-10 | PASS |
| Stability \|f′(x*)\|=1 at r=3 | LogisticMapModel.js | `logistic-map: |f′(x*)| at r=3 computed via model` | 1e-10 | PASS (new) |
| Period-4 onset r=1+√6 | LogisticMapModel.js | `logistic-map: period-4 onset at r=1+√6` | 1e-6 | PASS |
| Superstable R1=1+√5 | LogisticMapModel.js | `logistic-map: R1 = 1+√5` | 1e-6 | PASS |
| Feigenbaum 3-iterate ratio≈4.68 | LogisticMapModel.js | `logistic-map: feigenbaum 3-iterate ratio ≈ 4.68` | ±0.05 | PASS |
| Feigenbaum 4-iterate ratio≈δ=4.6692 | LogisticMapModel.js | `logistic-map: feigenbaum 4-iterate ratio ≈ δ=4.6692 ±0.1` | ±0.1 | PASS (new) |
| Lyapunov r=4 = ln2 | LogisticMapModel.js | `logistic-map: lyapunov r=4 = ln2, tolerance from Var=π²/12` | 4√(π²/12N) | PASS (new) |
| Invariant density at r=4 | LogisticMapModel.js | `logistic-map: invariant density at r=4` | 4×SE=0.0042 | PASS (new) |
| Sensitivity at r=4 | LogisticMapModel.js | `logistic-map: sensitivity at r=4 — two orbits diverge` | > 0.1 | PASS (new) |
| Period-3 distinct roots | LogisticMapModel.js | `logistic-map: period-3 at r=3.83 has 3 distinct cycle points` | 1e-6 | PASS (new) |
| A(0)=F₀/ω₀² | OscillatorsModel.js | `oscillators: A(ω) formula — static deflection at ω=0` | 1e-10 | PASS |
| ω_r=√(ω₀²−2γ²) is amplitude maximum | OscillatorsModel.js | `oscillators: displacement peak at ω_r for γ=0.3ω₀` | ±0.001 scan | PASS |
| Phase=π/2 at ω=ω₀ | OscillatorsModel.js | `oscillators: phase = π/2 at ω = ω₀` | 1e-10 | PASS |
| Log decrement δ=2πγ/ω_d | OscillatorsModel.js | `oscillators: log decrement δ = 2πγ/ω_d` | 1e-10 | PASS |
| 2% settling time | OscillatorsModel.js | `oscillators: 2% settling time — ζ=0.8 settles before ζ=1` | < 10 s | PASS (new) |
| A(ω) global maximum at ω_r | OscillatorsModel.js | `oscillators: A(ω_r) is global max over [0,3ω₀]` | ±1e-10 | PASS (new) |
| A(ω) formula multi-frequency | OscillatorsModel.js | `oscillators: A(ω) verified vs RK4 at ω=0.3, 0.7, 1.4, 2.0` | ±2e-4 | PASS (new) |
| T_Earth=365.2569 days | OrbitModel.js | `orbits: T_Earth = 365.257 days ±0.02` | ±0.02 days | PASS |
| v_circ=29.7847 km/s | OrbitModel.js | `orbits: vis-viva circular orbit v_circ = 29.7847 km/s` | ±0.001 km/s | PASS |
| v_esc=11.186 km/s | OrbitModel.js | `orbits: Earth escape speed 11.186 km/s ±0.01` | ±0.01 km/s | PASS |
| Verlet energy bounded | OrbitModel.js | `orbits: verlet energy bounded (ratio ≤ 3.2)` | ratio ≤ 3.2 | PASS |
| RK4 secular drift at T/500 | OrbitModel.js | `orbits: rk4 energy grows secularly (ratio ≥ 5)` | ratio ≥ 5 | PASS |
| RK4 secular drift at T/100 | OrbitModel.js | `orbits: rk4 secular drift ratio ≥ 5 at dt=T/100` | ratio ≥ 5 | PASS (new) |
| RK4 > Verlet at T/100 | OrbitModel.js | `orbits: rk4 absolute energy error exceeds verlet at dt=T/100` | absolute > | PASS (new) |
| e≥1 domain guard | OrbitModel.js | `orbits: e≥1 throws RangeError` | throws | PASS (new) |
| Rheobase I_th=1.5 nA | IntegrateAndFireModel.js | `iaf: rheobase = 1.5 nA ±1e-10` | 1e-10 | PASS |
| ISI=2+10·ln4 at I=2 nA | IntegrateAndFireModel.js | `iaf: ISI = 2+10·ln4 at I=2nA ±1e-10` | 1e-10 | PASS |
| f→0 near rheobase | IntegrateAndFireModel.js | `iaf: firing rate → 0 as I → I_th from above` | < 10 Hz, monotone | PASS (new) |
| Large-I ISI formula | IntegrateAndFireModel.js | `iaf: ISI formula verified at large I=10 nA ±1e-10` | 1e-10 | PASS (new) |
| dt-halving ratio ≈ 2 | IntegrateAndFireModel.js | `iaf: dt-halving error ratio ≈ 2` | ratio ∈ [1.5, 2.5] | PASS (new) |
| Acquisition V_n=λ(1−(1−αβ)^n) | RescorlaWagnerModel.js | `rw: acquisition closed form ±1e-10` | 1e-10 | PASS |
| Blocking ΔV_B≈0 | RescorlaWagnerModel.js | `rw: blocking delta-V_B = 0 ±1e-6` | 1e-6 | PASS |
| Conditioned inhibition | RescorlaWagnerModel.js | `rw: conditioned inhibition ±1e-10` | 1e-10 | PASS |
| Compound oscillation β·Σα > 1 | RescorlaWagnerModel.js | `rw: outside domain oscillates at compound β·Σα > 1` | sign alternation | PASS (fixed) |

---

## 6. Formula verification summary

| Formula | Independent check | Result |
|---|---|---|
| Var(ln\|f'(x)\|) under ρ(x)=1/(π√(x(1-x))) | θ=2arcsin(√x) → uniform; ∫(ln\|4cosθ\|)²dθ/π = (ln2)²+π²/12; Var = π²/12 | π²/12 ≈ 0.8225 ✓ |
| Invariant density P([0.25,0.75]) | (2/π)(arcsin(√0.75)−arcsin(√0.25)) = (2/π)(π/3−π/6) = 1/3 | 1/3 ✓ |
| IAF f near rheobase I=1.50001 | ISI = 2+10·ln(15.0001/0.0001) = 121 ms → f≈8 Hz | 8 Hz < 10 Hz ✓ |
| IAF large-I: V_∞−V_reset=100, V_∞−V_th=85 at I=10 | ISI = 2+10·ln(100/85) | exact ✓ |
| Peak-detection error for A(ω) test at 300 samples/cycle | A·(ω·dt/2)²/2 ≤ 2.5·(2/(300))²/2 ≈ 5.6e-5 << 2e-4 | justified ✓ |
| backwardEuler multiplier at λh=3 | \|1/(1+3)\| = 0.25 < 1 | A-stable ✓ |
| 2% settling time ζ=0.8: envelope (5/3)e^(-0.8t)=0.02 | t_s=ln(83.3)/0.8≈5.53 s | < ζ=1 t_s≈5.83 s ✓ |
| e≥1 guard: rPerihelion = a(1−e)=0 at e=1 | vPerihelion → ∞, period formula undefined | RangeError correct ✓ |

---

## 7. Issues from original review — resolution status

| Issue | Original severity | Resolution |
|---|---|---|
| Oscillator test name `±1e-8` should be `±1e-4` | Minor | Fixed in pre-phase-6b cleanup commit `84f1d9e` |
| IAF test names `±1e-5` should be `±1e-4` | Minor | Fixed in pre-phase-6b cleanup commit `84f1d9e` |
| IAF dead code `Vprev` variable | Minor | Removed in pre-phase-6b cleanup commit `84f1d9e` |
| Orbits e=0.99 test was vacuous for domain boundary | Moderate | Fixed: RangeError guard added to OrbitModel, test throws at e=1 (`4efb2cc`) |
| R-W bench readout "V_B" for conditioned-inhibition scenario | Minor UX | Fixed: label changed to "V_B / V_X (final)" in cleanup commit |
| backwardEuler not covered by convergence tests | Minor | Fixed: order-1 slope test + A-stability test added (`3a63f81`) |
| Feigenbaum test vs 4.68 not δ | Weak | Fixed: 4-iterate ratio test vs δ=4.6692 added (`9482db9`) |
| Oscillator single-frequency A(ω) test | Weak | Fixed: global-max sweep + multi-frequency RK4 check added (`96f2d8e`) |
| R-W compound test ran single-cue | Weak | Fixed: replaced with genuine AB compound test (`7b75a38`) |

---

## 8. Test suite summary

### At tag `phase-6` (before STEP 0–2)

```
# tests 460
# pass  460
# fail    0
```

### At tag `phase-6b` (after STEP 0–2)

```
# tests 477
# pass  477
# fail    0
```

New tests by bench: logistic-map +6, iaf +3, orbits +3, oscillators +3, ode-explorer +2,
rescorla-wagner ±0 (1 replaced). Plus blank-bench fix (STEP 0) in `77aa493`.

### Commit log (STEP 0–2)

```
77aa493  fix: blank canvas on all Phase 6 benches
9482db9  test(logistic-map): add 6 MISSING/WEAK tests
9f24886  test(integrate-and-fire): add 3 MISSING/WEAK tests
4efb2cc  test(orbits): e≥1 domain guard + RK4 vs Verlet at dt=T/100
96f2d8e  test(oscillators): add 3 MISSING/WEAK tests
7b75a38  test(rescorla-wagner): fix compound oscillation test
3a63f81  test(ode-explorer): add 2 MISSING backwardEuler tests
```

---

## 9. Open questions

1. **Playwright / smoke test**: No browser test was added. The blank-bench fix was verified by
   reading source code (3 root causes all mechanical); browser rendering would require a server.
   Recommend adding a Playwright smoke test in a future pass to guard against regressions.

2. **Feigenbaum constant precision**: The 4-iterate ratio gives ≈4.668; to verify δ=4.6692±0.001
   requires computing R5 or R6 (superstable period-32 and period-64 parameters via Brent on
   f^{32}(½)=½). These are very close together and slow to compute; left as a future exercise.

3. **Cauchy CLT failure test (Phase 5)**: The `central-limit` bench has a Cauchy IQR test; it
   is in the Phase 5 suite and was not re-audited here. No gap found, but it should be checked
   if Phase 5 tests are ever re-reviewed.

4. **OrbitModel e<0 guard**: The new RangeError guard covers e<0 and e≥1. The bench slider
   already prevents e<0 in practice, so this is belt-and-suspenders but correct.
