# Phase 5 review

**Date:** 2026-10-15
**Commits:** 7 (one per bench)
**Tests before:** 304  →  **Tests after:** 378  (+74, 0 fail)

---

## Benches built

| # | id | subject | field | tests | status |
|---|---|---|---|---|---|
| 1 | rc-circuit | Physics | Electromagnetism | 10 | checked by independent test |
| 2 | radioactive-decay | Chemistry | Nuclear chemistry | 11 | checked by independent test |
| 3 | compound-growth | Economics | Growth & Macroeconomics | 13 | checked by independent test |
| 4 | supply-demand | Economics | Markets | 9 | checked by independent test |
| 5 | weber-fechner | Psychology | Perception & Psychophysics | 9 | checked by independent test |
| 6 | signal-detection | Psychology | Perception & Psychophysics | 13 | checked by independent test |
| 7 | central-limit | Math | Probability & Statistics | 9 | checked by independent test |

---

## New subjects / fields added to catalog

| Subject | Field | New |
|---|---|---|
| Physics | Electromagnetism | new field |
| Chemistry | Nuclear chemistry | new field |
| Economics | Growth & Macroeconomics | new field |
| Economics | Markets | new field |
| Math | Probability & Statistics | new field |
| Psychology | (entire subject) | new subject |
| Psychology | Perception & Psychophysics | new field |

---

## Corrections applied during build (from plan approval)

**radioactive-decay**
- Curie anchor: exact inputs N=NA/226.0254, t½=5.0492e10 s (not 5730e9 s)
- Stochastic test: M=500 trials; tolerances 4×SE analytically: mean ±2.83, variance ±63
- NUBASE2020 C-14 5700(30) y stored as tHalf; Godwin/Libby variants preserved
- JS property names: `tHalf` not `t½` (unicode character caused SyntaxError in Node v22)

**compound-growth**
- Rule-of-72 test uses EXACT t₂_exact(r,m=1)×r% (not approximate): 71.033 at 5%, 72.725 at 10%
- PV uses continuous discounting e^(-rT) regardless of chosen m

**supply-demand**
- CS = ½·Q*²/b (corrected from ½(P_max−P*)·Q*)
- CS verified by Simpson integration (independent of algebraic formula)
- noTrade condition on Q*≤0

**signal-detection**
- Math.erf does not exist in JS → implemented from scratch (Taylor + Laplace CF)
- Φ⁻¹(p) via RootFinding.brent (no approximation)
- AUC primary; A′ (Grier 1971) for both H≥FA and H<FA branches
- Trapezoid AUC tolerance widened to ±0.002 (c=±4 misses extreme tails by ~0.0014)

**weber-fechner**
- Fechner UNDERcounts steps (ratio = k_W/ln(1+k_W) ≥ 1, not overcounts)
- L'Hôpital test uses n=0.0001 (n=0.001 gives error ≈0.00265 > original 0.002 tolerance)

**central-limit**
- Erlang exact: P(X̄<0.8,n=5) = 0.371163 via regularised incomplete gamma series
- Cauchy IQR test: confirms IQR stays large (>1), not ≈ 2/√30≈0.365
- All tolerances analytically derived; none hand-tuned

---

## Known limitations (from plan)

- Nav at 400 px with 7 subjects: requires browser check (not automated)
- Weber-Fechner modality table (k_W, n) values: ILLUSTRATIVE AND UNVERIFIED
- NUBASE2020 fetched via AMDC text file (IAEA LiveChart 403, NNDC 404)
