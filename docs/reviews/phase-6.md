# Phase 6 review (phase-6c)

**Date:** 2026-10-15
**Test suite:** `node --test 'tests/**/*.test.js'`

---

## 0. Tag history

| Tag | Tests | Notes |
|---|---|---|
| `phase-6` | 460 | Benches delivered; raw |
| `phase-6b` | 477 | Blank-bench fix; 17 gap tests added |
| `phase-6c` | 493 | CSS token root-cause fix; 16 further gap tests; this document |

---

## 1. Phase 6 summary

Phase 6 delivered 6 benches:

| id | subject | field | level | tests (phase-6c) |
|---|---|---|---|---|
| ode-explorer | Math | Dynamics | intro | 11 |
| logistic-map | Math | Dynamics | university | 28 |
| integrate-and-fire | Neuroscience | Electrophysiology | university | 17 |
| orbits | Physics | Mechanics | intro | 14 |
| oscillators | Physics | Mechanics | intro | 16 |
| rescorla-wagner | Psychology | Learning | intro | 14 |

---

## 2. Visual bug root cause and fix (STEP 0, phase-6c)

### Symptom

Two visual bugs reported on all Phase 6 benches and ~15 older benches (van-der-waals, rc-circuit, ideal-gas):
1. **Solid series colour** — canvas floods with `--accent` blue on every frame (Phase 6 benches)
2. **Black plot background** — canvas shows black area on light theme (older benches)

### Root cause

Three CSS custom property aliases were never defined in `css/tokens.css`:

```
--surface     (canvas background colour)
--text        (canvas label text colour)
--on-surface  (text drawn on the surface)
```

Canvas 2D behaviour: when `ctx.fillStyle = ""` (empty string — returned by `getComputedStyle`
for an undefined CSS variable), the assignment is **silently ignored** and the previous value
is retained. Consequence:

- **First frame** of any bench: `fillStyle` is the browser default `"black"` → fills entire
  canvas black.
- **Subsequent animated frames**: `fillStyle` retains the last series colour (`--accent`)
  assigned during the previous frame's plot → floods the canvas with solid blue on every
  `fillRect(0,0,w,h)` call.

Older benches (tax, fourier, pendulum, quarks) used `clearRect` via `begin()` and relied
on the CSS `background` of the stage element — they never called `fillStyle = theme.color('--surface')`.
Phase 6 benches call it explicitly in their View files, making the bug visible.

### Fix

One change: add three aliases in `:root` in `css/tokens.css`:

```css
/* Canvas aliases (views reference these; must map to a defined token) */
--surface: var(--panel);   /* canvas background */
--text: var(--ink);        /* canvas text labels */
--on-surface: var(--ink);  /* text rendered on the surface */
```

Dark-mode inheritance is automatic: `var(--panel)` and `var(--ink)` are already overridden
in the `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]` blocks.

**Commit:** `c5aa51f`
**Smoke test result after fix:** 48/48 benches PASS (all SOLID and black-fill failures resolved)

---

## 3. Gap list — final statuses (STEP 1 → phase-6b, STEP 2 → phase-6c)

### logistic-map

| Item | Status after phase-6b | Added in phase-6c | Final status |
|---|---|---|---|
| Sensitivity from 1e-12 | PRESENT (divergence check only) | Sensitivity from 1e-10 + growth rate ≈ ln2 ±10% | PRESENT |
| Feigenbaum 4-iterate ±0.1 | PRESENT | 4-iterate ±0.01 (R1–R4 stated) | PRESENT (tightened) |
| Lyapunov tolerance from π²/12 (iid) | PRESENT | Batch-means: batchSE < iidSE confirmed; ±4×batchSE | PRESENT (stronger) |
| Invariant density iid ±4σ | PRESENT | Batch-means density; ±4×batchSE | PRESENT (stronger) |
| Stability at r=3.5 | ABSENT | \|f'(x*)\|=1.5 exact; growth as 1.5^20 ±1% | PRESENT |

### integrate-and-fire

| Item | Status after phase-6b | Added in phase-6c | Final status |
|---|---|---|---|
| f near rheobase | PRESENT (f < 10 Hz, monotone) | f at ε=1e-3/1e-6/1e-9 with stated anchors (13.31/6.93/4.69 Hz) | PRESENT (anchored) |
| Large-I asymptote | WEAK (formula vs formula) | Non-circular: f(10000) > 499 Hz, < 500 Hz; monotone increasing | PRESENT |
| dt-halving ratio | PRESENT (ratio ∈ [1.5,2.5]) | Absolute error values stated: err(0.001)≤2ms, err(0.0005)≤1ms; ratio ≈ 1.90 | PRESENT (values stated) |

### orbits

| Item | Status after phase-6b | Added in phase-6c | Final status |
|---|---|---|---|
| RK4 vs Verlet crossover | PRESENT (RK4 > Verlet after 1000 orbits at e=0.7) | e=0.5, dt=T/100: RK4 < Verlet at orbit 1; > Verlet at orbit 500 (crossover 200–500) | PRESENT (e=0.5 explicit) |
| Constants by name | PRESENT (names in test import) | Values stated: GM_SUN, GM_EARTH, R_EARTH ±tol; derived g≈9.82 m/s² | PRESENT (values checked) |

### oscillators

| Item | Status after phase-6b | Added in phase-6c | Final status |
|---|---|---|---|
| Peak-detection error derivation | PRESENT (comment only) | Test: 1−cos(π/300)=5.48e-5; max bound = 2.5·5.48e-5 = 1.37e-4 < 2e-4; margin ≈ 1.46× | PRESENT (asserted) |

### rescorla-wagner

| Item | Status after phase-6b | Added in phase-6c | Final status |
|---|---|---|---|
| Blocking phase-1 length | ABSENT | VA[50] = 1−(0.75)^50; VB[50] = 0 (B not in phase-1) | PRESENT |
| Conditioned inhibition pair count | PRESENT (600 trials) | 600 trials = 300 pairs explicitly; not converged at 50 pairs | PRESENT (stated) |

### ode-explorer

No changes in phase-6c.

---

## 4. Tests added (phase-6c commits)

| Bench | Commit | Tests added | Count before → after |
|---|---|---|---|
| logistic-map | `def533a` | sensitivity from 1e-10 + growth rate; Feigenbaum ±0.01 (R1–R4); Lyapunov batch-means; density batch-means; r=3.5 stability | 23 → 28 |
| integrate-and-fire | `645433e` | near-rheobase anchors (ε=1e-3/1e-6/1e-9); large-I ceiling (non-circular); dt-halving values stated | 14 → 17 |
| orbits | `60480f6` | constants by name + derived g; RK4/Verlet crossover at e=0.5 dt=T/100 | 12 → 14 |
| oscillators | `edf9667` | peak-detection error bound and margin asserted | 15 → 16 |
| rescorla-wagner | `7c0de07` | blocking phase-1 length (VA[50] formula); conditioned-inhibition 300-pair requirement | 12 → 14 |

Phase-6c visual fix: `c5aa51f` (no test changes; smoke run external).

---

## 5. Anchor audit table (phase-6c additions shown with ✦)

| Anchor | File | Test name | Tolerance | Status |
|---|---|---|---|---|
| **ode-explorer** | | | | |
| RK4 stability limit ≈ 2.785294 | OdeExplorerModel.js | `ode-explorer: RK4 stability limit ≈ 2.7853` | 1e-4 | PASS |
| Euler diverges at λh > 2 | Integrators.js | `ode-explorer: euler diverges at λh=2.5` | > 1e10 | PASS |
| RK4 stable at λh=2.5 | Integrators.js | `ode-explorer: rk4 decays at λh=2.5` | < 1e-10 | PASS |
| RK4 unstable at λh=3.0 | Integrators.js | `ode-explorer: rk4 diverges at λh=3.0` | > 1e10 | PASS |
| backwardEuler A-stable at λh=3.0 | Integrators.js | `ode-explorer: backwardEuler is A-stable` | < 1e-10 | PASS |
| backwardEuler order-1 slope | OdeExplorerModel.js | `ode-explorer: convergence slope for backwardEuler ≈ 1` | ±0.15 | PASS |
| Logistic RK4 accuracy h=0.001 | OdeExplorerModel.js | `ode-explorer: logistic rk4 agrees ±1e-7` | 1e-7 | PASS |
| Convergence slopes Euler/Heun/RK4 | OdeExplorerModel.js | `convergence slope euler ≈ 1 / heun ≈ 2 / rk4 ≈ 4` | ±0.15 each | PASS |
| **logistic-map** | | | | |
| Fixed point x*=1−1/r | LogisticMapModel.js | `fixed point 1-1/r at r=2.5` | 1e-10 | PASS |
| Stability \|f′(x*)\|=1 at r=3 | LogisticMapModel.js | `|f′(x*)| at r=3 computed via model` | 1e-10 | PASS |
| Period-4 onset r=1+√6 | LogisticMapModel.js | `period-4 onset at r=1+√6` | 1e-6 | PASS |
| Superstable R1=1+√5 | LogisticMapModel.js | `R1 = 1+√5` | 1e-6 | PASS |
| Feigenbaum 3-iterate ratio ≈ 4.68 | LogisticMapModel.js | `feigenbaum 3-iterate ratio ≈ 4.68` | ±0.05 | PASS |
| Feigenbaum 4-iterate ratio ≈ 4.6692 ±0.1 | LogisticMapModel.js | `feigenbaum 4-iterate ratio ≈ δ=4.6692 ±0.1` | ±0.1 | PASS |
| Feigenbaum 4-iterate ≈ 4.6692 ±0.01 ✦ | LogisticMapModel.js | `feigenbaum 4-iterate ratio ≈ δ=4.6692 ±0.01 (R1–R4 stated)` | ±0.01 | PASS |
| Lyapunov r=4 = ln2 (iid SE) | LogisticMapModel.js | `lyapunov r=4 = ln2 ±0.00363` | 4√(π²/12N) | PASS |
| Lyapunov r=4 = ln2 (batch SE) ✦ | LogisticMapModel.js | `lyapunov r=4 — batch-means SE tighter than iid` | 4×batchSE | PASS |
| Invariant density 1/3 (iid SE) | LogisticMapModel.js | `invariant density at r=4` | 4×SE=0.0042 | PASS |
| Invariant density 1/3 (batch SE) ✦ | LogisticMapModel.js | `invariant density — batch-means SE` | 4×batchSE | PASS |
| Sensitivity at r=4 (1e-12) | LogisticMapModel.js | `sensitivity at r=4 — two orbits diverge` | > 0.1 | PASS |
| Sensitivity growth rate ln2 ±10% ✦ | LogisticMapModel.js | `sensitivity at r=4 from δ₀=1e-10 — growth rate ≈ ln2 ±10%` | ±10%·ln2 | PASS |
| r=3.5 fixed point \|f'(x*)\|=1.5 ✦ | LogisticMapModel.js | `fixed point at r=3.5 — \|f′(x*)\|=1.5, grows as 1.5^n ±1%` | 1e-10; relErr<1% | PASS |
| Period-3 distinct roots | LogisticMapModel.js | `period-3 at r=3.83 has 3 distinct cycle points` | 1e-6 | PASS |
| **integrate-and-fire** | | | | |
| Rheobase I_th=1.5 nA | IntegrateAndFireModel.js | `iaf: rheobase = 1.5 nA ±1e-10` | 1e-10 | PASS |
| ISI=2+10·ln4 at I=2 nA | IntegrateAndFireModel.js | `iaf: ISI = 2+10·ln4 at I=2nA ±1e-10` | 1e-10 | PASS |
| f near rheobase < 10 Hz | IntegrateAndFireModel.js | `iaf: firing rate → 0 as I → I_th` | f < 10 Hz | PASS |
| Near-rheobase specific f values ✦ | IntegrateAndFireModel.js | `iaf: near-rheobase f at ε=1e-3, 1e-6, 1e-9` | anchors ±0.1 Hz | PASS |
| Large-I ISI formula (WEAK) | IntegrateAndFireModel.js | `iaf: ISI formula verified at large I=10 nA ±1e-10` | 1e-10 | PASS — WEAK (formula vs formula) |
| Large-I refractory ceiling ✦ | IntegrateAndFireModel.js | `iaf: large-I limit f → 1/t_ref = 500 Hz (non-circular)` | f > 499; f < 500 | PASS |
| dt-halving ratio ≈ 2 | IntegrateAndFireModel.js | `iaf: dt-halving error ratio ≈ 2` | ratio ∈ [1.5, 2.5] | PASS |
| dt-halving values stated ✦ | IntegrateAndFireModel.js | `iaf: dt-halving error values stated` | err < 2×dt; ratio ≈ 1.90 | PASS |
| **orbits** | | | | |
| T_Earth=365.2569 days | OrbitModel.js | `orbits: T_Earth = 365.257 days ±0.02` | ±0.02 days | PASS |
| v_circ=29.7847 km/s | OrbitModel.js | `orbits: vis-viva circular orbit v_circ = 29.7847 km/s` | ±0.001 km/s | PASS |
| v_esc=11.186 km/s | OrbitModel.js | `orbits: Earth escape speed 11.186 km/s ±0.01` | ±0.01 km/s | PASS |
| Verlet energy bounded | OrbitModel.js | `orbits: verlet energy bounded (ratio ≤ 3.2)` | ratio ≤ 3.2 | PASS |
| RK4 secular drift at T/500 | OrbitModel.js | `orbits: rk4 energy grows secularly (ratio ≥ 5)` | ratio ≥ 5 | PASS |
| RK4 secular drift at T/100 | OrbitModel.js | `orbits: rk4 secular drift ratio ≥ 5 at dt=T/100` | ratio ≥ 5 | PASS |
| RK4 > Verlet at T/100 after 1000 orbits | OrbitModel.js | `orbits: rk4 absolute error exceeds verlet at dt=T/100` | absolute > | PASS |
| Constants GM_SUN, GM_EARTH, R_EARTH ✦ | OrbitModel.js | `orbits: constants GM_SUN, GM_EARTH, R_EARTH` | ±tol; g≈9.82 | PASS |
| RK4 < Verlet early, > later at e=0.5 ✦ | OrbitModel.js | `orbits: e=0.5 dt=T/100 — crossover between orbit 200–500` | orbit 1: RK4<Verlet; orbit 500: RK4>Verlet | PASS |
| **oscillators** | | | | |
| A(0)=F₀/ω₀² | OscillatorsModel.js | `oscillators: A(ω) formula — static deflection at ω=0` | 1e-10 | PASS |
| ω_r=√(ω₀²−2γ²) is amplitude maximum | OscillatorsModel.js | `oscillators: displacement peak at ω_r` | ±0.001 scan | PASS |
| Phase=π/2 at ω=ω₀ | OscillatorsModel.js | `oscillators: phase = π/2 at ω = ω₀` | 1e-10 | PASS |
| Log decrement δ=2πγ/ω_d | OscillatorsModel.js | `oscillators: log decrement` | 1e-10 | PASS |
| 2% settling time | OscillatorsModel.js | `oscillators: 2% settling time — ζ=0.8 < ζ=1` | < 10 s | PASS |
| A(ω_r) global max | OscillatorsModel.js | `oscillators: A(ω_r) is global max over [0,3ω₀]` | 1e-10 | PASS |
| A(ω) multi-frequency ±2e-4 | OscillatorsModel.js | `oscillators: A(ω) verified vs RK4 at ω=0.3, 0.7, 1.4, 2.0` | ±2e-4 | PASS |
| Peak-detection error bound ✦ | OscillatorsModel.js | `oscillators: peak-detection error ≤ A·5.48e-5, margin ≈1.46×` | bound < 2e-4 | PASS |
| **rescorla-wagner** | | | | |
| Acquisition V_n=λ(1−(1−αβ)^n) | RescorlaWagnerModel.js | `rw: acquisition closed form ±1e-10` | 1e-10 | PASS |
| Blocking ΔV_B≈0 | RescorlaWagnerModel.js | `rw: blocking delta-V_B = 0 ±1e-6` | 1e-6 | PASS |
| Blocking phase-1 = 50 trials ✦ | RescorlaWagnerModel.js | `rw: blocking phase-1 = 50 trials — VA[50] = 1−(0.75)^50` | 1e-10 | PASS |
| Conditioned inhibition | RescorlaWagnerModel.js | `rw: conditioned inhibition ±1e-10` | 1e-10 | PASS |
| Conditioned inhibition 300 pairs ✦ | RescorlaWagnerModel.js | `rw: conditioned inhibition — 300 pairs needed; not at 50` | > 1e-10 at 50; ≤ 1e-10 at 300 | PASS |

---

## 6. Formula verification summary

| Formula | Independent check | Result |
|---|---|---|
| Var(ln\|f'(x)\|) under ρ(x)=1/(π√(x(1-x))) | θ=2arcsin(√x) → uniform; ∫(ln\|4cosθ\|)²dθ/π = (ln2)²+π²/12; Var=π²/12 | π²/12 ≈ 0.8225 ✓ |
| Invariant density P([0.25,0.75]) | (2/π)(arcsin(√0.75)−arcsin(√0.25)) = (2/π)(π/3−π/6) = 1/3 | 1/3 ✓ |
| Logistic-map batch SE < iid SE | Negative autocorrelation at r=4: x near ½ gives small \|f'\|, next iterate near 0 or 1 gives \|f'\|≈4; batchSE ≈ 4.1e-5 ≪ iidSE ≈ 9.1e-4 | confirmed ✓ |
| Feigenbaum 4-iterate ratio | (R3−R2)/(R4−R3); R4=3.5667 computed via superstableR(4,3.555,3.568); ratio=4.663 | \|4.663−4.6692\|=0.006<0.01 ✓ |
| r=3.5 fixed-point growth 1.5^20 | f'(x*)=−3/2 exactly; 20-step linearisation error = O(δ₀·1.5^20)≈O(1e-12) | relErr = 3.7e-7 < 1% ✓ |
| IAF near-rheobase f at ε=1e-3 | ISI = 2+10·ln(15.01/0.01) = 2+10·ln(1501) ≈ 75.13 ms → f ≈ 13.31 Hz | ∈ [13.2, 13.5] ✓ |
| IAF large-I refractory ceiling | As I→∞, ln[(V_∞−V_reset)/(V_∞−V_th)]→0; ISI→t_ref=2ms; f→500 Hz | f(10000)=499.63 Hz > 499 ✓ |
| Orbit crossover between 200–500 | Verlet bounded ≈1.07e-2; RK4 at orbit 200: 5.91e-3 (< Verlet); orbit 500: 1.48e-2 (> Verlet) | crossover confirmed ✓ |
| Peak-detection bound | 1−cos(π/300)=5.48e-5; max A=2.5 at γ=0.2; bound=1.37e-4 < 2e-4 | margin=1.46 ✓ |
| RW VA[50]=1−(0.75)^50 | Acquisition formula V_n=λ(1−(1−αβ)^n), n=50, αβ=0.25 | 1−(0.75)^50 ≈ 1−5.55e-7 ✓ |
| RW conditioned inhibition 300 pairs | Slowest eigenvalue 0.75/pair; (0.75)^300≈1.6e-38 | < 1e-10 ✓ |
| backwardEuler A-stable | \|1/(1+λh)\| at λh=3: 1/4=0.25 < 1 | A-stable ✓ |
| CSS --surface fix: fillStyle behaviour | Undefined CSS variable → getComputedStyle returns ""; Canvas ignores empty string, retains previous value (black on first frame, last series colour on subsequent) | root cause confirmed ✓ |

---

## 7. WEAK tests identified

| Test | Why WEAK | Stronger test added |
|---|---|---|
| `iaf: ISI formula verified at large I=10 nA ±1e-10` | Both sides compute `2 + 10·ln[(V_∞−V_reset)/(V_∞−V_th)]`; cannot catch a systematic formula error | `iaf: large-I limit f → 1/t_ref = 500 Hz` (non-circular: uses only t_ref) ✓ |

The following tests were previously marked WEAK and strengthened in phase-6b (not changed further):

| Test | Resolution |
|---|---|
| `feigenbaum 3-iterate ratio ≈ 4.68 ±0.05` | Still present; tighter 4-iterate ±0.01 test now co-exists |
| `lyapunov r=4 = ln2 ±0.00363` (magic 0.8225) | Replaced by `tolerance from Var=π²/12` and batch-means test |
| `sensitivity at r=4` (1e-12, no rate) | Growth-rate test from 1e-10 added alongside |

---

## 8. Test suite summary

### At tag `phase-6b` (before phase-6c work)

```
# tests 477
# pass  477
# fail    0
```

### At tag `phase-6c` (this document)

```
# tests 493
# pass  493
# fail    0
```

New tests by bench: logistic-map +5, iaf +3, orbits +2, oscillators +1, rescorla-wagner +2. Plus CSS fix (`c5aa51f`).

### Commit log (phase-6c only)

```
c5aa51f  fix(tokens): add missing --surface, --text, --on-surface aliases
def533a  test(logistic-map): add sensitivity, Feigenbaum ±0.01, batch-means, r=3.5 stability
645433e  test(integrate-and-fire): add near-rheobase anchors, large-I ceiling, dt-halving values
60480f6  test(orbits): add constants verification and RK4/Verlet crossover at e=0.5 dt=T/100
edf9667  test(oscillators): state peak-detection error bound and margin for 2e-4 tolerance
7c0de07  test(rescorla-wagner): state phase-1=50 for blocking; state 300 pairs for conditioned inhibition
```

---

## 9. Open questions

1. **Feigenbaum constant precision**: The 4-iterate ratio (R1–R4) gives ≈4.663 vs δ=4.6692 ±0.01.
   To tighten further to ±0.001 requires R5 (period-32 superstable parameter), which needs
   evaluating f^{32}(½)=½ via bisection on a degree-2^32 iterate — computationally feasible
   but slow. Left as a future exercise.

2. **IAF large-I WEAK test**: The test `ISI formula verified at large I=10 nA ±1e-10` is formula
   vs formula (WEAK). The new non-circular test (`f → 500 Hz`) covers the physical limit.
   The WEAK test should be removed in a future pass if it adds no additional coverage.

3. **Orbit crossover at e=0.5 vs e=0.7**: The existing phase-6b test (e=0.7, orbit 1000) and
   the new test (e=0.5, orbit 500) probe different eccentricities. For e=0.5 the crossover
   falls between orbit 200 and 500 (verified numerically at 200: RK4=5.91e-3 < Verlet=1.08e-2;
   at 500: RK4=1.48e-2 > Verlet=1.08e-2). The exact crossover was not bisected; stating
   "crossover between 200–500" is accurate.

4. **CSS regression guard**: The `--surface`, `--text`, `--on-surface` aliases are not covered
   by any automated contract test. A CSS token completeness check (list of required tokens vs
   defined tokens in `tokens.css`) would prevent this class of regression in future phases.

5. **Playwright / smoke test**: Smoke test at `tools/smoke.mjs` runs 48 benches and checks
   for SOLID and black-fill failures. The CSS fix was verified via smoke (48/48 PASS after
   `c5aa51f`). The smoke test is not part of `npm test` (requires a live server); it runs in
   the `smoke` CI job.
