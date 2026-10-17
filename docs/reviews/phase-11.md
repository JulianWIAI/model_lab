# Phase 11 Review

## Section 0: Baseline and summary

### Baseline

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| phase-10c | 0b68143 | 982 | Phase 11 true baseline |
| phase-11 | 191d793 | 1061 | Phase 11 complete (+79 tests, 8 benches) |
| phase-11b | 3bd0c37 | 1071 | Phase 11b fix pass (+10 tests) |
| phase-11c | (HEAD) | 1080 | Phase 11c fix pass (+9 tests, girth+tolerances) |

### Tests added (phase-11 through phase-11c)

| Bench / file | Tests at phase-11c | Delta from 982 |
|---|---|---|
| graph.test.js | 26 | +26 |
| ising.test.js | 9 | +9 |
| population-coding.test.js | 9 | +9 |
| wilson-cowan.test.js | 13 | +13 |
| graph-theory.test.js | 2 | +2 |
| inequality.test.js | 14 | +14 |
| langmuir.test.js | 15 | +15 |
| mwc-allosteric.test.js | 10 | +10 |
| **Total** | **98** | **+98** |

(982 + 98 = 1080 at phase-11c. The runner count matches static `test(` counts in all files — no dynamic test generation in Phase 11 files.)

### Audit reconciliation (93 vs 89 discrepancy in phase-11b review)

The R12 audit table in the phase-11b review listed totals of 93 across phase-11 files. The runner at phase-11b reported 89 (1071 − 982 = 89). The 4-test gap was a manual counting error in the R12 table:

| File | R12 table count | Actual runner count | Over-count |
|---|---|---|---|
| population-coding.test.js | 11 | 9 | +2 |
| wilson-cowan.test.js | 14 | 13 | +1 |
| mwc-allosteric.test.js | 11 | 10 | +1 |
| **Sum** | **93** | **89** | **+4** |

There is no dynamic test generation in Phase 11 files. (The `no-hardcoded-colours.test.js` generates 16 tests dynamically from a loop over 8 files × 2 checks, but that is a Phase 7/8 artifact.)

### R12 Audit (post-phase-11c)

**After phase-11c:** PRESENT: 98, WEAK: 0, MISSING: 5

Classification per test file (post-11c):

| File | Tests | PRESENT | WEAK | MISSING-notes |
|---|---|---|---|---|
| graph.test.js | 26 | 26 | 0 | — (girth, non-planarity, BF negative-cycle added in 11c) |
| ising.test.js | 9 | 9 | 0 | — |
| population-coding.test.js | 9 | 9 | 0 | — |
| wilson-cowan.test.js | 13 | 13 | 0 | — (dt-halving fixed, FP tol tightened, saddle comment in 11c) |
| graph-theory.test.js | 2 | 2 | 0 | — |
| inequality.test.js | 14 | 14 | 0 | — |
| langmuir.test.js | 15 | 15 | 0 | — |
| mwc-allosteric.test.js | 10 | 10 | 0 | — (Hill c=1 tol tightened 1e-3→1e-7 in 11c) |

MISSING items remaining (5): WilsonCowan Jacobian rE=rI=0 vs rE≠0 distinction; Ising critical slowing-down; Langmuir kinetic K_kin ≠ m.K edge case; inequality Lorenz convexity for Pareto with non-integer alpha; MWC enumeratedSaturation n>12 RangeError.

---

## Section 1: Commits

### Phase 11 commits (0b68143 → 191d793)

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

### Phase 11b commits (191d793 → 3bd0c37)

| Commit | Message | Tests |
|---|---|---|
| `e050c65` | fix(inequality): topShare exponential formula | +1 |
| `d2e6a6a` | fix(ising): runtime 2^16 enumeration replaces literal | +1 |
| `beba415` | fix(population-coding): remove +0.15 from popvec tolerance | 0 |
| `831ec92` | fix(graph-theory): remove 4 duplicate tests | −4 |
| `d6ecbd9` | fix(multiple): DFS discovery times, concavity <0, dt-halving escape removed | +12 |

### Phase 11c commits (3bd0c37 → HEAD)

| Commit | Message | Tests |
|---|---|---|
| `3554898` | fix(wilson-cowan): dt-halving endpoint alignment; run() records final step | 0 |
| `b6ce96f` | feat(graph): girth() BFS; K4/K3,3/Petersen/Q3/path; non-planarity; BF negative-cycle | +9 |
| `79dd2a9` | fix(tolerances): saddle derivation comment, MWC Hill 1e-3→1e-7, WC FP 1e-4→1e-6 | 0 |

---

## Section 2: R8 flags corrected

| Phase | Finding | Fix commit | Description |
|---|---|---|---|
| 11b | HIGH-1: topShare exponential wrong formula | `e050c65` | `-(1-q)ln(1-q)` → `(1-q)(1-ln(1-q))` |
| 11b | LOW-3: dt-halving vacuous escape clause | `d6ecbd9` | Removed `|| err2 < 1e-12` escape |
| 11c | LOW-3 follow-up: dt-halving different endpoints | `3554898` | Fixed run() recording; Hopf-point preset; ratio 15.79∈[12,20] |

---

## Section 3: SOURCES fetch attempts

| Bench | Constant/value | Fetch attempt | Result |
|---|---|---|---|
| ising | Tc = 2J/(kB·ln(1+√2)) | Onsager (1944), Yang (1952) — cited, not fetched | Algebraically verified: sinh(2·Kc)=1 and Kc = ln(1+√2)/2 ✓ |
| langmuir | R = 8.314462618 J/(mol·K) | CODATA 2022 value — cited | Matches CODATA 2022 value used in other benches ✓ |
| mwc-allosteric | Hill coeff ~2.362 (n=4, L=100, c=0.01) | Monod et al. (1965) — cited, not fetched | Numerically reproduced from closed-form formula ✓ |
| inequality | Gini for Pareto: 1/(2α−1) | Lorenz (1905), Gini (1912) — cited, not fetched | Algebraically verified ✓ |
| population-coding | Fisher info formula | Seung & Sompolinsky (1993) — cited, not fetched | Formula verified from first principles ✓ |
| ising | MC anchor <\|m\|>_{L=4,T=2.5} | Phase-11b: runtime 2^16 enumeration | Self-certified via inline partition function ✓ (MED-1 fixed) |

---

## Section 4: Full commit list (phase-11 through phase-11c)

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
| `e050c65` | fix(inequality): correct topShare exponential formula | +1 |
| `d2e6a6a` | fix(ising): replace literal with runtime 2^16 enumeration | +1 |
| `beba415` | fix(population-coding): remove +0.15 from popvec tolerance | 0 |
| `831ec92` | fix(graph-theory): remove 4 duplicate tests | −4 |
| `d6ecbd9` | fix(multiple): DFS discovery times, concavity <0, dt-halving escape removed | +12 |
| `3554898` | fix(wilson-cowan): dt-halving endpoint alignment; run() records final step | 0 |
| `b6ce96f` | feat(graph): girth() BFS; K4/K3,3/Petersen/Q3/path; non-planarity; BF negative-cycle | +9 |
| `79dd2a9` | fix(tolerances): saddle derivation comment, MWC Hill 1e-3→1e-7, WC FP 1e-4→1e-6 | 0 |

---

## Section 5: Known deferred items

1. WilsonCowan Jacobian rE=rI=0 vs rE≠0 distinction (no test currently distinguishes these paths)
2. Ising critical slowing-down (correlation time divergence near Tc)
3. Langmuir kinetic K_kin ≠ m.K edge case
4. Inequality Lorenz convexity for Pareto with non-integer alpha
5. MWC enumeratedSaturation n>12 RangeError

---

## Section 6: R9 smoke results

All 84 benches × 4 viewports: 84/84 PASS, 0 failures.

Run at phase-11c HEAD (2026-10-17).

---

## Section 7: R12 audit with dispositions

See Section 0 for current PRESENT/WEAK/MISSING breakdown. All WEAK items from phases 11–11b have been resolved in phase-11c. No WEAK items remain.

---

## Section 8: Phase 11b fix checklist

| Item | Implemented? | Evidence |
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
| Girth K3,3 (girth≥4, E>2V-4) | ✓ | graph.test.js (added phase-11c) |
| Girth Petersen (girth=5, E>5(V-2)/3) | ✓ | graph.test.js (added phase-11c) |
| Pop-coding finite-difference Fisher route | ✓ | population-coding.test.js line 8 |
| Pop-coding rMax·T RangeError | ✓ | population-coding.test.js line 131 |
| Langmuir kinetic via RK4 | ✓ | langmuir.test.js line 54 |
| lorenz(p) RangeError outside [0,1] | ✓ | inequality.test.js line 86 |
| "cited, not fetched" marks | ✓ | All 8 bench files confirmed |

**Phase 11c additions beyond the 11b plan:**
- WC dt-halving: run() now records final step (k===n-1); Hopf-point preset; ratio 15.79 ∈ [12, 20]
- girth() BFS method added to Graph.js (5 girth tests + 3 non-planarity tests + 1 BF negative-cycle)
- Tolerance tightening: saddle derivation comment; MWC Hill ±1e-3→±1e-7; WC FP ±1e-4→±1e-6

---

## Section 9: Agent review

Full findings: `docs/reviews/phase-11-agent-findings.md`

Summary:
- **HIGH:** 1 (fixed in phase-11b: e050c65)
- **MED:** 3 (all fixed in phase-11b)
- **LOW:** 3 (all fixed in phase-11b/11c)

All findings resolved. Dispositions in `phase-11-agent-findings.md` Section "Dispositions".

Phase-11c agent review brief and findings: `docs/reviews/phase-11b-agent-brief.md`, `docs/reviews/phase-11b-agent-findings.md`.
