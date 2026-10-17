# Phase 11 Review

## Section 0: Baseline and summary

### Baseline

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| phase-10c | 0b68143 | 982 | Phase 11 true baseline |
| phase-11 | 191d793 | 1061 | Phase 11 complete (+79 tests, 8 benches) |
| phase-11b | (see tag) | 1071 | Phase 11b fix pass (+10 tests) |

Push status: pending user approval

Note: the runner reports 1061 tests at the end of Phase 11 (start of session was also 1061 — Phase 11 is already committed on `main`). Phase-11b adds 10 tests from fix/tighten pass.

### Tests added this phase

| Bench | Tests added | Cumulative |
|---|---|---|
| Graph.js infra (graph.test.js) | +14 | 993 |
| ising | +9 | 1002 |
| population-coding | +7 | 1009 |
| wilson-cowan | +10 | 1019 |
| graph-theory (GraphTheoryBench wrapper) | +6 | 1025 |
| inequality | +11 | 1036 |
| langmuir | +13 | 1049 |
| mwc-allosteric | +9 | 1058 |
| **Total new** | **+79** | **1061** |

Note: The cumulative total in this table uses 982 as the phase-11 baseline (1061 − 79 = 982). The discrepancy with the tag-level baseline of 979 reflects 3 tests added between a4194b1 and the phase-11 start that are not tracked here.

### R12 Audit (post-phase-11b)

**Before phase-11b:** PRESENT: 58, WEAK: 12, MISSING: 9

**After phase-11b:** PRESENT: 75, WEAK: 2, MISSING: 7

Classification per test file (post-11b):

| File | Tests | PRESENT | WEAK | MISSING-notes |
|---|---|---|---|---|
| graph.test.js | 17 | 17 | 0 | — (DFS times now tested) |
| ising.test.js | 9 | 9 | 0 | — (runtime enumeration replaces literal) |
| population-coding.test.js | 11 | 10 | 1 | sigma-scaling tightened; MLE added; FD Fisher present |
| wilson-cowan.test.js | 14 | 13 | 1 | FP positions+saddle instability+LC amplitude added; dt-halving now non-vacuous |
| graph-theory.test.js | 2 | 2 | 0 | — (4 duplicate tests removed) |
| inequality.test.js | 14 | 14 | 0 | — (topShare identity+integration tests added; lorenzCurve) |
| langmuir.test.js | 15 | 15 | 0 | — (concavity <0; langmuirPlot/isothermCurve added) |
| mwc-allosteric.test.js | 11 | 11 | 0 | — (Hill ±1e-3; rStateFraction large alpha; curve added) |

MISSING items remaining (7): BF on undirected graph (negative cycle detection); WilsonCowan Jacobian rE=rI=0 vs rE≠0 distinction; Ising critical slowing-down; Langmuir kinetic K_kin ≠ m.K edge case; inequality Lorenz convexity for Pareto with non-integer alpha; Girth computation from graph for K3,3 and Petersen; MWC enumeratedSaturation n>12 RangeError.

---

## Section 1: Commits

| # | Bench | Commit | Tests |
|---|---|---|---|
| 1 | ising | `1f3091f` | +9 |
| 2 | population-coding | `5a575d2` | +7 |
| 3 | wilson-cowan | `8ad049a` | +10 |
| 4 | graph-theory / Graph.js | `9603455` | +20 |
| 5 | inequality | `5a94987` | +11 |
| 6 | langmuir | `d4e1b71` | +13 |
| 7 | mwc-allosteric | `994c8f9` | +9 |
| 8 | catalog / plan / anchors | `191d793` | 0 |

---

## Section 2: R8 flags (mathematical correctness flags corrected this phase)

No R8 flags were corrected this phase. The HIGH-1 finding (inequality `topShare` exponential formula) is a new issue identified in this review.

---

## Section 3: SOURCES fetch attempts

| Bench | Constant/value | Fetch attempt | Result |
|---|---|---|---|
| ising | Tc = 2J/(kB·ln(1+√2)) | Onsager (1944), Yang (1952) — cited, not fetched | Algebraically verified: sinh(2·Kc)=1 and Kc = ln(1+√2)/2 ✓ |
| langmuir | R = 8.314462618 J/(mol·K) | CODATA 2022 value — cited | Matches CODATA 2022 value used in other benches ✓ |
| mwc-allosteric | Hill coeff ~2.362 (n=4, L=100, c=0.01) | Monod et al. (1965) — cited, not fetched | Numerically reproduced from closed-form formula ✓ |
| inequality | Gini for Pareto: 1/(2α−1) | Lorenz (1905), Gini (1912) — cited, not fetched | Algebraically verified ✓ |
| population-coding | Fisher info formula | Seung & Sompolinsky (1993) — cited, not fetched | Formula verified from first principles ✓ |
| ising | MC anchor <\|m\|>_{L=4,T=2.5} = 0.76471239322120 | "partition function enumeration" — no code or external source provided | **not verified** (MED-1) |

---

## Section 4: Commit list

| Commit | Message | Tests |
|---|---|---|
| `1f3091f` | feat(ising): add 2D Ising model with Metropolis dynamics | +9 |
| `5a575d2` | feat(population-coding): add Gaussian tuning + Poisson Fisher info bench | +7 |
| `8ad049a` | feat(wilson-cowan): add E-I neural population dynamics with Hopf bifurcation | +10 |
| `9603455` | feat(graph-theory): add graph explorer bench with Euler and Dijkstra | +20 |
| `5a94987` | feat(inequality): add Lorenz curve and Gini coefficient bench | +11 |
| `d4e1b71` | feat(langmuir): add Langmuir adsorption isotherm with kinetic route | +13 |
| `994c8f9` | feat(mwc-allosteric): add Monod-Wyman-Changeux two-state allosteric model | +9 |
| `191d793` | feat(catalog): register 8 Phase 11 benches + update plan and anchors | 0 |

---

## Section 9: Independent agent review

Full findings: `docs/reviews/phase-11-agent-findings.md`

Summary:
- **HIGH:** 1
- **MED:** 3
- **LOW:** 3

**HIGH-1 (inequality — topShare exponential):** `InequalityModel.topShare` returns `−(1−q)·log(1−q)` for the exponential distribution, but the correct income share of the top (1−q) is `1 − L(q) = (1−q)·(1 − log(1−q))`. The model formula is short by exactly `(1−q)`. At q=0.5 the error is 59%. The bug is latent because the only `topShare` test covers Pareto, not exponential.

**MED-1 (ising — unverified MC anchor):** The hardcoded value `0.76471239322120` is cited as "from partition function enumeration" with no supporting code or external reference.

**MED-2 (population-coding — loose popvec tolerance):** The `SD/CRB ~ 1.04` test uses a tolerance of `4·SE + 0.15`; the fixed +0.15 term is not statistically derived and inflates the acceptance window to ±0.24, making the test insensitive to factor-of-1.5 decoder bias.

**MED-3 (graph duplication):** Four tests in `graph-theory.test.js` are exact duplicates of tests in `graph.test.js` (Euler K4, Euler Q3, Handshaking K4, Dijkstra reference), inflating the test count without adding mathematical coverage.

**LOW-1:** DFS return values untested.
**LOW-2:** Langmuir concavity threshold uses `< 1e-6` instead of `< 0`.
**LOW-3:** Wilson-Cowan dt-halving test has a vacuous escape clause (`|| err2 < 1e-12`) that can make the RK4 order check unreachable.

No findings were resolved inline (review-only).

---

## Section 8: Phase 11b fix checklist (v4 plan items)

| Item | Implemented? | Evidence (file:line or justification) |
|---|---|---|
| Gini bound 2·\|ζ(−1/2)\|·h^1.5 | ✓ | inequality.test.js line 72 |
| Ising stripe test E=−448J | ✓ | ising.test.js line 101 |
| Ising L=4 exact averages | ✓ | ising.test.js line 55 (runtime enumeration, 2^16 configs) |
| WC Hopf-point preset (wEE=8, tr=0, det=2) | ✓ | wilson-cowan.test.js line 127 |
| WC limit-cycle preset (wEE=8.5, amplitude ~0.289) | ✓ | wilson-cowan.test.js line 145 (amplitude [0.2, 0.4]) |
| Directed Bellman-Ford | ✓ | graph.test.js line 33 |
| Dijkstra {allowNegative} flag | ✓ | graph.test.js line 26 |
| removeEdge / removeNode | ✓ | graph.test.js line 105, 115 |
| faces() K4 face count | ✓ | graph.test.js line 60 |
| faces() Q3 face count | ✓ | graph.test.js line 72 |
| Girth computed from graph for K3,3 (girth≥4, E>2V-4) | ✗ | No girth() method in Graph.js; out of scope |
| Girth computed from graph for Petersen (girth=5, E>5(V-2)/3) | ✗ | Same; out of scope |
| Pop-coding finite-difference Fisher route | ✓ | population-coding.test.js line 8 (Fisher two-way) |
| Pop-coding rMax·T RangeError | ✓ | population-coding.test.js line 131 |
| Langmuir kinetic via RK4 | ✓ | langmuir.test.js line 54 |
| lorenz(p) RangeError outside [0,1] | ✓ | inequality.test.js line 86 |
| "cited, not fetched" marks on all research.papers | ✓ | All 8 bench files confirmed (grep verified) |

**Phase 11b additions beyond the v4 plan:**
- topShare exponential fix: inequality.test.js (topShare identity + integration tests)
- MLE SD/CRB test: population-coding.test.js line 88
- DFS discovery times: graph.test.js lines 124, 132, 140
- WC FP positions ±1e-4: wilson-cowan.test.js (Default FPs test)
- Saddle instability test: wilson-cowan.test.js
- nullclineI wII=0 branch: wilson-cowan.test.js
- hopf-point stability type: wilson-cowan.test.js
- sigma-scaling tightened to ±1e-9: population-coding.test.js
- MWC Hill c=1 tightened to ±1e-3: mwc-allosteric.test.js
- MWC rStateFraction saturation: mwc-allosteric.test.js
- Coverage tests for utility methods: lorenzCurve, langmuirPlot, isothermCurve, tuningCurves, curve()
