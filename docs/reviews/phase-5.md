# Phase 5 review

**Date:** 2026-10-15
**Commits:** 7 (one per bench) + 1 (test-gap fixes)
**Tests before:** 304  →  **Tests after:** 393  (+89, 0 fail)

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
- PV uses same m as growth: FV/(1+r/m)^(mT) discrete, FV·e^(−rT) continuous
- Round-trip PV(A(T)) ≈ P ±1e-6 tested for both m=12 (discrete) and continuous

**supply-demand**
- CS = ½·Q*²/b (corrected from ½(P_max−P*)·Q*)
- CS verified by Simpson integration (independent of algebraic formula)
- noTrade condition: Q*≤0 iff a·d+b·c≤0 (corrected from a<c; tested with c<0 cases)
- costShock: c_new = c − d·κ (corrected from c − κ); ΔP*=d·κ/(b+d)
- Pass-through ρ=d/(b+d)=ε_S/(ε_S+|ε_D|) verified; both incidence limits tested
- PS=½·Q*²/d proved for any c (supply P-intercept = −c/d)

**signal-detection**
- Math.erf does not exist in JS → implemented from scratch (Taylor + Laplace CF)
- Φ⁻¹(p) via RootFinding.brent (no approximation)
- AUC primary; A′ (Grier 1971) for both H≥FA and H<FA branches
- Trapezoid AUC: closed with (0,0)/(1,1) endpoints, tested d′∈{0.5,1,2,3} ±1e-4
- erf CF branch tested: Phi(−6)≈9.866e-10 ±1e-12, Phi(5) ±1e-9
- erf boundary cross-check: erf(2.5) and erf(3.5) each ±1e-10
- A′ boundary tests: chance=0.5, near-perfect≈1, H<FA symmetry A′(d)+A′(−d)=1
- dprime() method added; round-trip recovers d′ regardless of c ±1e-6
- PhiInverse round-trip ±1e-10

**weber-fechner**
- Fechner UNDERcounts steps (ratio = k_W/ln(1+k_W) ≥ 1, not overcounts)
- L'Hôpital test uses n=0.0001 (n=0.001 gives error ≈0.00265 > original 0.002 tolerance)

**central-limit**
- Erlang exact: P(X̄<0.8,n=5) = 0.371163 via regularised incomplete gamma series
- Erlang observed-fraction tolerance: 4·sqrt(p(1-p)/N)≈0.0432 (corrected from 0.02)
- Added Exp n=5, N=5000 skewness test: expected 2/√5, tol=4×1.5×sqrt(6/N)
- Cauchy IQR test: confirms IQR stays large (>1), not ≈ 2/√30≈0.365
- All tolerances analytically derived; seed=42 is default, not hand-tuned

---

## Known limitations (from plan)

- Nav at 400 px with 7 subjects: requires browser check (not automated)
- Weber-Fechner modality table (k_W, n) values: ILLUSTRATIVE AND UNVERIFIED
- NUBASE2020 fetched via AMDC text file (IAEA LiveChart 403, NNDC 404)
