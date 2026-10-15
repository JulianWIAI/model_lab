# Phase 5 review

**Date:** 2026-10-15
**Tests:** 393 pass, 0 fail  (304 carried forward + 89 new)
**Commits:** 7 (one per bench) + 2 housekeeping (test-gap fixes, CI/engine)

---

## Benches delivered

| # | id | subject | field | tests | formulas status | data status |
|---|---|---|---|---|---|---|
| 1 | rc-circuit | Physics | Electromagnetism | 10 | checked by independent test | n/a (no empirical constants) |
| 2 | radioactive-decay | Chemistry | Nuclear chemistry | 11 | checked by independent test | verified (NUBASE2020, fetched 2026-10-15) |
| 3 | compound-growth | Economics | Growth & Macroeconomics | 13 | checked by independent test | n/a (no empirical constants) |
| 4 | supply-demand | Economics | Markets | 12 | checked by independent test | n/a (no empirical constants) |
| 5 | weber-fechner | Psychology | Perception & Psychophysics | 9 | checked by independent test | unverified (k_W and n modality table) |
| 6 | signal-detection | Psychology | Perception & Psychophysics | 24 | checked by independent test | n/a (no empirical constants) |
| 7 | central-limit | Math | Probability & Statistics | 10 | checked by independent test | n/a (no empirical constants) |

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

## Infrastructure changes

- `package.json`: `"test"` script now uses quoted glob `'tests/**/*.test.js'` so Node.js (not the shell) expands `**`; required for depth-3 test files on any shell including GitHub Actions bash/dash.
- `package.json`: added `"engines": {"node": ">=22"}` to document the Node 22 requirement.
- `.github/workflows/test.yml`: upgraded `node-version` from `'20'` to `'22'`. Node 20 cannot expand `**` globs when passed as a literal string argument to `node --test`.
- **Why Node ≥ 22 is needed**: the quoted `'tests/**/*.test.js'` form relies on Node's own glob expansion (not the shell). Node's built-in `**` glob traversal was stabilised in v22. Under Node 20 the pattern is treated as a literal path that does not exist, and all depth-3 files are silently skipped.

---

## Corrections applied during build (post-plan fixes)

**radioactive-decay**
- Curie anchor: exact inputs N=N_A/226.0254=2.6643×10²¹, t½=1600×3.15576×10⁷=5.0492×10¹⁰ s (not 5730×3.15576×10⁷ s)
- Stochastic test: M=500 trials; tolerances analytically derived: mean ±2.83 (4×SE), variance ±63
- NUBASE2020 C-14 stored as 5700 y; Godwin (5730 y) and Libby (5568 y) preserved as display variants
- JS property name: `tHalf` not `t½` (Unicode ½ caused `SyntaxError` in Node v22)

**compound-growth**
- Rule-of-72 test uses EXACT t₂_exact(r,m=1)×r% (not approximate); 71.033 at r=5%, 72.725 at r=10%
- `PV(FV, T)` uses same m as growth: `FV/(1+r/m)^(mT)` discrete, `FV·e^(-rT)` continuous. Round-trip `PV(A(T))=P` tested ±1e-6 for both m=12 and m=Infinity.

**supply-demand**
- CS = ½·Q*²/b (corrected from ½(P_max−P*)·Q*)
- CS verified by Simpson integration ∫₀^{Q*}(P_D−P_S)dQ ±1e-4, with c<0 case (proving formula holds for any c)
- noTrade condition: Q*≤0 iff a·d+b·c≤0 (corrected from a<c); noTrade tested with c=−5 (Q*=−2≤0) and with c=−10 (Q*=35>0, trade despite negative c)
- costShock: c_new = c − d·κ (corrected from c − κ); ΔP*=d·κ/(b+d), ΔQ*=−b·d·κ/(b+d)
- Pass-through ρ=d/(b+d)=ε_S/(ε_S+|ε_D|) verified; buyer-bears-all (b→0) and seller-bears-all (d→0) limits tested
- PS=½·Q*²/d proved algebraically for any c (supply P-intercept=−c/d; P*+c/d=Q*/d)

**signal-detection**
- Math.erf does not exist in JS → implemented from scratch: Taylor series (|x|≤3) + Laplace CF back-substitution (|x|>3, 60 terms)
- Φ⁻¹(p) via RootFinding.brent(−8, 8, 1e-12); no approximation
- AUC primary; A′ (Grier 1971) for both H≥FA and H<FA branches
- Trapezoid AUC: closed with (0,0)/(1,1) endpoints, tested d′∈{0.5,1,2,3} ±1e-4 (was ±0.002 with open curve)
- erf CF branch tested: Phi(−6)≈9.866e-10 ±1e-12, Phi(5) ±1e-9; erf(2.5) and erf(3.5) ±1e-10
- A′ boundary: A′(d=0)=0.5, A′(d=8)≈1, A′(d=1)+A′(d=−1)=1 (symmetry)
- `dprime()` method added: Φ⁻¹(H)−Φ⁻¹(FA) recovers d′ regardless of c, ±1e-6
- PhiInverse round-trip ±1e-10

**weber-fechner**
- Fechner UNDERcounts steps: ratio = k_W/ln(1+k_W) ≥ 1 (corrected from "overcounts")
- L'Hôpital test uses n=0.0001 (n=0.001 gives error ≈0.00265 > 0.002 tolerance)

**central-limit**
- Erlang exact: P(X̄<0.8,n=5)=0.371163 via regularised lower incomplete gamma (DLMF 8.7), log-scale to avoid overflow: `exp(−t + a·ln t − ln(a!))`
- Erlang observed-fraction tolerance: 4·sqrt(p(1-p)/N)≈0.0432 (was fixed at 0.02, too tight)
- Skewness tolerances now use Stuart-Ord (Kendall's Vol.1 §12.38): Var(g1)≈(6/N)(1+γ₂) where γ₂=6/n for Gamma(n,n). No unexplained safety factor.
  - n=30: γ₂=6/30=0.2 → tol=4×√(6×1.2/2000)=4×0.060=0.240
  - n=5:  γ₂=6/5=1.2  → tol=4×√(6×2.2/5000)=4×0.0514=0.206; passes 0/500 seeds empirically
- Cauchy CLT failure: IQR of sample means (n=30) ≈ 2 (Cauchy IQR), not 2/√30≈0.365 — confirms CLT does not apply
- seed=42 is the default, not hand-tuned for any test

---

## Science-accuracy audit

### RC circuit

- **Equations**: V_C(t) = V₀(1−e^(−t/τ)) charging; V₀·e^(−t/τ) discharging; τ=RC. Exact closed-form; no uncertain constants.
- **V_C(τ)** = V₀(1−1/e) ≈ 0.63212·V₀ — tested to ±1e-6 (independent check: 1−Math.exp(−1)).
- **Energy dissipation**: ∫₀^{10τ} I²R dt ≈ ½CV₀² — trapezoid, 10000 steps, ±0.001·½CV₀². Verified with R=1 kΩ and R=10 kΩ giving the same energy (independent of R). ✓
- **RK4 cross-check**: max |V_rk4−V_closed| < 1e-6 over 5000 steps. ✓
- **tHalf** = τ·ln2 — tested to ±1e-10. ✓
- **Reference**: Kirchhoff (1847) KVL — textbook-universal; not checked against primary source.

### Radioactive decay

- **Decay law** N(t)=N₀·e^(−λt), λ=ln2/t½: exact.
- **Half-life tests**: N(t½)=N₀/2 ±1e-10; N(2t½)=N₀/4 ±1e-10. ✓
- **Age inversion**: age(0.5)=t½, age(0.25)=2t½, both ±1e-10. ✓
- **Curie anchor** (1g Ra-226): N=2.6643×10²¹, t½=5.0492×10¹⁰ s, A(0)=3.66×10¹⁰ Bq ±0.05×10¹⁰. Independent derivation, not read from a table. ✓
- **Stochastic binomial**: M=500 trials; mean per step ≈ N₀·p ±2.83 (4×SE), variance ≈ N₀·p·(1−p) ±63 (4×SE). ✓
- **Half-life values**: fetched from NUBASE2020 via AMDC text file 2026-10-15 (IAEA LiveChart returned 403, NNDC NuDat3 returned 404). See fetched-data table below.

### Compound growth

- **A(0) = P**: exact for all m, including Infinity. ✓
- **Doubling time** for m=1,12,Inf: A(t₂)=2P ±1e-6. ✓
- **EAR** = (1+r/m)^m−1 (discrete); e^r−1 (continuous). Tested to ±1e-10. ✓
- **Daily vs continuous**: |A_daily−A_cont| < 1e-3·P at r=0.10, t=10. ✓
- **Rule-of-72 exact errors**: t₂_exact(0.05,m=1)×5 = 71.033 ±0.01; ×10 = 72.725 ±0.01. NOT the approximate 72. ✓
- **PV round-trip**: PV(A(T)) = P to ±1e-6 for m=12 and m=Inf. ✓
- **Reference**: Bernoulli (1690), compound interest and the constant e — not checked against primary source.

### Supply and demand

- **Closed-form equilibrium**: P*=(a−c)/(b+d), Q*=(ad+bc)/(b+d). Both tested to ±1e-10. ✓
- **CS=½Q*²/b**: verified by Simpson integration ±1e-4 with c=−10 (proving formula holds for any c). ✓
- **PS=½Q*²/d for any c**: proved algebraically (supply P-intercept=−c/d; P*+c/d=Q*/d). ✓
- **Numerical brent**: solveNumerical() agrees with closed form ±1e-6. ✓
- **noTrade condition**: tested at a=1,b=1,c=−5,d=1 (Q*=−2≤0, noTrade) and a=80,b=1,c=−10,d=1 (Q*=35>0, trade). ✓
- **Cost-shock incidence**: ΔP*=d·κ/(b+d) ±1e-10; ρ=d/(b+d)=ε_S/(ε_S+|ε_D|) ±1e-10; buyer- and seller-bears-all limits ±0.01. ✓
- **Reference**: Marshall (1890); Cournot (1838) — not checked against primary sources.

### Weber–Fechner & Stevens

- **Weber's law** JND=k_W·I: tested to ±1e-10; doubling I doubles JND. ✓
- **Stevens power ratio** S(2I)/S(I)=2^n: tested to ±1e-10. ✓
- **Fechner step-count ratio** = k_W/ln(1+k_W) ≥ 1 (Fechner UNDERcounts): ratio≈1.049 at k_W=0.1, tested to ±0.001 independently (0.1/Math.log(1.1)). ✓
- **L'Hôpital limit** (I^n−1)/n→ln(I) as n→0: at n=0.0001, error < 0.001. ✓
- **Modality table** (k_W and n for brightness, loudness, length, shock): **UNVERIFIED, ILLUSTRATIVE ONLY.** Values assembled from memory; not checked against Gescheider (1997) or Stevens (1957) primary tables. Not tested numerically (not falsifiable without primary source).
- **Reference**: Weber (1834); Fechner (1860); Stevens (1957) doi:10.1037/h0046162 — Fechner and Weber not checked against primary sources.

### Signal detection theory

- **erf Taylor series** (|x|≤3): recurrence term_n = term_{n-1}·(−x²/n)·(2n−1)/(2n+1); iterates to relative change <1e-15. Values: erf(2.5)=0.999593047982553 ±1e-10. ✓
- **erf Laplace CF** (|x|>3): 60 back-substituted terms; Phi(−6)≈9.865876e-10 ±1e-12; erf(3.5)=0.999999256901628 ±1e-10. ✓
- **Phi continuity** at series/CF boundary: erf(2.5) and erf(3.5) each ±1e-10 vs cross-check values. ✓
- **Simpson integration cross-check**: ∫_{−6}^{x} φ(t)dt ≈ Phi(x) ±1e-6 for x∈{1, 1.96, −1}. ✓
- **PhiInverse round-trip**: Phi(PhiInverse(p))≈p for p∈{0.1,0.5,0.9,0.99}; PhiInverse(Phi(x))≈x for x∈{−2,0,1.5,2.5} ±1e-10. ✓
- **dprime()**: PhiInverse(H)−PhiInverse(FA) = d′ regardless of c, ±1e-6. ✓
- **AUC=Phi(d′/√2)**: trapezoid closed-curve integral ±1e-4 for d′∈{0.5,1,2,3}. ✓
- **A′** (Grier 1971): A′(d=0)=0.5=AUC(d=0); A′(d=8)≈1 ±0.001; A′(d=1)+A′(d=−1)=1 ±1e-10 (H<FA symmetry). ✓
- **β=1 at c=0** (unbiased criterion). ✓
- **Reference**: Tanner & Swets (1954) doi:10.1037/h0058700; Grier (1971) doi:10.1037/h0031246 — formulae correct per cited sources; not checked against printed copies.

### Central Limit Theorem

- **SE getter** = σ/√n: tested to ±1e-10, no simulation. ✓
- **Uniform, Bernoulli, Exponential observedSD**: tested against SE ±4×SE_SD (analytically derived). ✓
- **Skewness (n=30)**: Gamma(30,30) population; Var(g1)≈(6/N)(1+γ₂)=(6/2000)(1.2); tol=0.240; passes all seeds. ✓
- **Skewness (n=5)**: Gamma(5,5) population; γ₂=6/5; tol=0.206; passes 0/500 seeds empirically. ✓
- **Erlang exact** P(X̄<0.8,n=5,Exp): DLMF 8.7 series in log scale; P=0.371163 ±0.003 (formula alone). ✓
- **Erlang observed fraction**: |observed−P|<4·√(p(1-p)/N)≈0.0432. ✓
- **erlangCDF log-scale implementation**: `exp(−t + a·ln(t) − ln(a!))` avoids overflow for large a. Covered by the formula test (test 8).
- **Cauchy CLT failure**: IQR of 500 sample means (n=30) > 1 (expected ≈2, not 2/√30≈0.365). Covered by test 10. ✓
- **Reference**: Lindeberg (1922) Mathematische Zeitschrift 15:211; Cramér (1946) Mathematical Methods of Statistics §28.4.

---

## Extreme-slider results

Results computed programmatically from each Model class (no browser required):

### rc-circuit

| Slider extreme | Result | OK? |
|---|---|---|
| R=0.001 Ω, C=1μF | τ=1e-9 s (1 ns); charging complete in ns | ✓ finite |
| R=1MΩ, C=1mF | τ=1000 s; essentially no charging over typical 5τ window | ✓ finite |
| V0=0 | V_C(t)=0 everywhere (charging and discharging) | ✓ |
| mode=discharge, t=0 | V_C(0)=V0 exactly | ✓ |
| mode=charge, t=0 | V_C(0)=0 exactly | ✓ |

### radioactive-decay

| Slider extreme | Result | OK? |
|---|---|---|
| N0=0 | N(t)=0 for all t | ✓ |
| t½=1 s, N0=1e6, t=100 s | N(100)≈7.9×10⁻²⁵ (effectively 0) | ✓ finite |
| C-14, N0=1e6, t=100·t½ | N≈0 (exact: 0 to float precision) | ✓ |
| C-14, A(0) | 3.85×10⁻⁶ Bq for N0=1×10⁶ (= λ·N0, finite) | ✓ |
| Stochastic mode, N0=0 | No decays; model returns empty steps | ✓ |

### compound-growth

| Slider extreme | Result | OK? |
|---|---|---|
| r=0, any m | A(t)=P for all t (flat line) | ✓ |
| r=100% (r=1), m=Inf, t=10 | A=P·e^10≈22 026 466·P (finite) | ✓ |
| m=Infinity, r=0.07 | Continuous compounding path; EAR=e^0.07−1 | ✓ |
| P=0 | A(t)=0 for all t | ✓ |
| t=0, any m | A(0)=P exactly | ✓ |

### supply-demand

| Slider extreme | Result | OK? |
|---|---|---|
| a=1, b=1, c=−5, d=1 | Q*=−2≤0, noTrade=true (banner) | ✓ |
| a=1000, b=0.001, d=100 | P*=10.00, Q*=999.99 (finite) | ✓ |
| b→0 (b=0.001, d=1) | ρ→1: buyers absorb >99% of cost shock | ✓ |
| d→0 (b=1, d=0.001) | ρ→0: sellers absorb >99% of cost shock | ✓ |
| a=c, b=1, d=1 | Q*=0, noTrade=true (boundary case) | ✓ |

### weber-fechner

| Slider extreme | Result | OK? |
|---|---|---|
| k_W=0.001 | jnd(10)=0.01 (very fine discrimination) | ✓ |
| k_W=5 | jnd(10)=50 (JND > intensity; model still valid numerically) | ✓ |
| n=0.001 (Stevens) | stevens(10)≈1.0023 (approaches ln-law limit 1+0.001·ln10≈1.002) | ✓ |
| n=5 | stevens(10)=100000 (pain-like acceleration) | ✓ |
| k_W=1e-9 | fechner(100) finite (log formula still valid) | ✓ |

### signal-detection

| Slider extreme | Result | OK? |
|---|---|---|
| d′=0, c=0 | H=FA=0.5, AUC=0.5, ROC=diagonal | ✓ |
| d′=5, c=0 | H=0.9938, FA=0.0062 (near-perfect) | ✓ |
| d′=1, c=4 (conservative) | H=2.3×10⁻⁴, FA=3.4×10⁻⁶ (both near zero) | ✓ |
| d′=1, c=−4 (liberal) | H≈1, FA≈1 (both near one) | ✓ |
| d′<0 (reversed observer) | A′<0.5, dprime()<0 (correct) | ✓ |

### central-limit

| Slider extreme | Result | OK? |
|---|---|---|
| n=1 | observedSD ≈ parent σ (not SE=σ/√n); histogram = parent shape | ✓ |
| n=30, Uniform | Histogram visually bell-shaped; observedSD≈SE | ✓ |
| Cauchy, any n | IQR of sample means ≈ 2 (Cauchy IQR), not shrinking | ✓ |
| N=1 sample | observedSD=0 (only one sample mean); run() handles N=1 | ✓ |
| Bernoulli n=1 | observedSD ≈ 0.5 (parent σ); all draws are 0 or 1 | ✓ |

---

## Browser checks

**Status: pending manual verification.**

The following checks require a browser and cannot be automated. They should be done manually before pushing:

1. **400 px width, light mode**: Navigation must show all 7 subjects without overflow. Psychology subject and its benches must be reachable. Check for text clipping in the subject/field nav.
2. **400 px width, dark mode**: Same layout checks. Slider labels and readout values must be legible.
3. **1280 px width, light mode**: Stage and cards must fill the standard two-column layout.
4. **1280 px width, dark mode**: No inverted colour artifacts.
5. **Console errors**: Open DevTools → Console for each of the 7 new benches and confirm 0 errors at default slider positions and after moving all sliders to extreme values.
6. **"No trade" banner** (supply-demand): reduce demand intercept a below supply intercept c and confirm the noTrade banner replaces the diagram.
7. **Stochastic overlay** (radioactive-decay): switch to stochastic mode; confirm noisy trace overlays the deterministic curve; confirm "Reset walk" re-seeds correctly.

Known limitation: navigation at 400 px with 7 subjects is not automated. The phase-3 nav was tested at 5 subjects; phase-5 adds 2. This must be visually verified.

---

## Fetched data (radioactive-decay)

Half-lives fetched from **NUBASE2020 via AMDC** (`https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt`) on **2026-10-15**.
Citation: F.G. Kondev, M. Wang, W.J. Huang, S. Naimi, and G. Audi, *Chin. Phys. C* **45**, 030001 (2021).
IAEA LiveChart returned HTTP 403; NNDC NuDat3 returned HTTP 404; AMDC text file was accessible.

| Isotope | t½ (NUBASE2020) | ± | Unit | Bench value | Notes |
|---|---|---|---|---|---|
| C-14 | 5700 | 30 | y | 5700 y (tHalf) | Physical value. Godwin (1962) 5730 y and Libby (1955) 5568 y preserved as display variants; bench shows all three. |
| U-238 | 4.463 | 0.003 | Gy | 4.463 Gy | Julian year = 3.15576×10⁷ s used for conversion. |
| I-131 | 8.0249 | 0.0006 | d | 8.0249 d | |
| Ra-226 | 1600 | 7 | y | 1600 y | Curie anchor: 1g Ra-226 ≈ 3.66×10¹⁰ Bq (N=N_A/226.0254=2.6643×10²¹, t½=5.0492×10¹⁰ s, tested ±0.05×10¹⁰). |

Year unit: **Julian year = 3.15576×10⁷ s** (= 365.25 × 86400 s).
Molar mass Ra-226 used: **226.0254 g/mol**.
N_A used: **6.02214076×10²³ mol⁻¹** (from `js/data/constants.js`, CODATA 2018 exact).

---

## Scientifically uncertain items to report

1. **Weber-Fechner modality table** (k_W and n for brightness, loudness, length, shock): **ILLUSTRATIVE AND UNVERIFIED.** Values assembled from memory; not checked against Gescheider (1997) *Psychophysics: The Fundamentals* or Stevens (1957) primary power-law table. Reference variable matters for loudness (n≈0.67 for sound pressure level, n≈0.3 for intensity). Flagged in model source comments, SOURCES.md, and the bench "Where it breaks" card. Do not use for teaching without consulting primary sources.

2. **Signal-detection A′ formula** (Grier 1971): cited but not checked against the printed journal article. Formula implemented as published in Stanislaw & Todorov (1999) *Behavior Research Methods* 31:137. The H<FA branch is a sign-symmetric extension; not in Grier's original paper.

3. **erf implementation**: no external library used; Taylor series and Laplace CF implemented from scratch. Both branches cross-checked against Simpson integration and known reference values. No residual uncertainty identified.

---

## ROADMAP, README, and SOURCES.md updates

- **ROADMAP.md**: 7 bench entries added with ✓; status column split into "formulas" and "data"; `compound-growth` PV formula corrected; `supply-demand` ΔP* formula corrected; `signal-detection` and `central-limit` anchors updated.
- **README.md**: 7 new simulation rows added to the table.
- **SOURCES.md**: Phase 5 section added with radioactive-decay fetched-data table (NUBASE2020, 2026-10-15).

---

## Spot-checks

| Check | Result |
|---|---|
| RC: V_C(τ) = V₀·(1−1/e) ±1e-6 | ✓ |
| RC: V_C(5τ) > 0.993·V₀ | ✓ |
| RC: energy ∫I²R dt = ½CV₀² ±0.001·½CV₀² | ✓ |
| RC: RK4 max err < 1e-6 | ✓ |
| Decay: N(t½) = N₀/2 ±1e-10 | ✓ |
| Decay: Curie anchor A(Ra-226) ≈ 3.66×10¹⁰ Bq ±5% | ✓ |
| Decay: stochastic mean per step ≈ N₀·p ±2.83 (4×SE) | ✓ |
| Growth: A(t₂) = 2P ±1e-6 (annual, monthly, continuous) | ✓ |
| Growth: rule72_pct(0.05) = 71.033 ±0.01 (exact) | ✓ |
| Growth: PV(A(T)) = P ±1e-6 (m=12 and m=Inf) | ✓ |
| SD: P*=(a−c)/(b+d), Q*=(ad+bc)/(b+d) ±1e-10 | ✓ |
| SD: CS+PS = Simpson ∫₀^{Q*}(P_D−P_S)dQ ±1e-4 (c=−10) | ✓ |
| SD: ρ = d/(b+d) = ε_S/(ε_S+|ε_D|) ±1e-10 | ✓ |
| SD: noTrade at Q*≤0 (a=1,b=1,c=−5,d=1 → Q*=−2) | ✓ |
| WF: ratio = k_W/ln(1+k_W) ≈ 1.049 at k_W=0.1 ±0.001 | ✓ |
| WF: L'Hôpital (I^n−1)/n→ln(I) at n=0.0001 ±0.001 | ✓ |
| SDT: Phi(0)=0.5, Phi(1)=0.8413447, Phi(1.96)=0.9750021 ±1e-6 | ✓ |
| SDT: Phi(−6) ≈ 9.866e-10 ±1e-12 (CF branch) | ✓ |
| SDT: dprime() = d′ ±1e-6 regardless of c | ✓ |
| SDT: A′(d=1)+A′(d=−1) = 1 ±1e-10 | ✓ |
| SDT: trapezoid AUC ±1e-4 for d′∈{0.5,1,2,3} | ✓ |
| CLT: SE = σ/√n ±1e-10 (exact) | ✓ |
| CLT: Erlang P(X̄<0.8,n=5) = 0.371163 ±0.003 (formula) | ✓ |
| CLT: Erlang observed fraction ±4·√(p(1-p)/N)≈0.0432 | ✓ |
| CLT: Cauchy IQR of means > 1 (CLT failure confirmed) | ✓ |
| CLT: skewness n=30 ±4×SE (Stuart-Ord) = 0.240 | ✓ |
| CLT: skewness n=5  ±4×SE (Stuart-Ord) = 0.206 | ✓ |
