# Phase 11 Review

## Section 0: Baseline and summary

### Baseline

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| phase-10b | a4194b1 | 979 | Phase 11 baseline (pre-phase-11) |
| — | 191d793 | 1061 | Phase 11 complete (+79 tests, 8 benches) |

Note: the runner reports 1061 tests at the end of Phase 11 (start of session was also 1061 — Phase 11 is already committed on `main`).

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

### R12 Audit

PRESENT: 58, WEAK: 12, MISSING: 9

Classification per test file:

| File | Tests | PRESENT | WEAK | MISSING-notes |
|---|---|---|---|---|
| graph.test.js | 14 | 14 | 0 | DFS return values never checked |
| ising.test.js | 9 | 8 | 1 | MC anchor unverified (MED-1) |
| population-coding.test.js | 7 | 5 | 2 | sigma-scaling tol=0.1; popvec SD/CRB tol loose |
| wilson-cowan.test.js | 10 | 5 | 5 | 3 FPs type-only; saddle dist>0.1; limit cycle>0.1; dt-halving escape clause |
| graph-theory.test.js | 6 | 6 | 0 | 4 tests duplicate graph.test.js (MED-3) |
| inequality.test.js | 11 | 11 | 0 | exponential topShare untested (HIGH-1) |
| langmuir.test.js | 13 | 12 | 1 | concavity threshold 1e-6 instead of <0 |
| mwc-allosteric.test.js | 9 | 8 | 1 | c=1→h=1 tolerance ±0.05 |

MISSING items (properties not tested at all): DFS return values; exponential topShare; BF on undirected graph; WilsonCowan Jacobian for rE=rI=0 case separately; MWC rStateFraction saturation for large alpha; Ising critical slowing-down; population coding MLE vs popvec comparison; Langmuir kinetic equilibrium consistency (K_kin ≠ m.K case); inequality Lorenz convexity for Pareto with non-integer alpha edge cases.

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
