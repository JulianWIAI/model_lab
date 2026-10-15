# Phase 3 review

**Date:** 2026-10-14
**Tests:** 262 pass, 0 fail
**Commits since Phase 2:** 10 (infrastructure + 8 benches + housekeeping)

---

## Benches delivered

| Bench | Path | Tests | Key equation |
|---|---|---|---|
| Hill binding | biology/biochemistry/hill-binding | 10 | θ = pO₂ⁿ/(P50ⁿ + pO₂ⁿ) |
| Goldman equation | neuroscience/electrophysiology/goldman | 11 | V_m = (RT/F)·ln(num/den) |
| Integrated rate laws | chemistry/kinetics/rate-laws | 15 | [A] = [A]₀·e^(−kt) etc. |
| A→B→C mechanisms | chemistry/kinetics/mechanisms | 10 | Bateman (1910) exact solution |
| Ideal gas | physics/thermodynamics/ideal-gas | 8 | P = NkT/V, ⟨KE⟩ = 3/2 kT |
| Maxwell–Boltzmann | physics/thermodynamics/maxwell-boltzmann | 12 | f(v) = 4π(M/2πRT)^(3/2)·v²·e^(−Mv²/2RT) |
| Van der Waals | physics/thermodynamics/van-der-waals | 14 | Z_c = 3/8 = 0.375 |
| Gibbs free energy | chemistry/thermodynamics/gibbs | 12 | ΔG = ΔH − TΔS |

---

## Infrastructure additions

- `js/core/Random.js`: Added seeded Mulberry32 PRNG instance (constructor + `next()` + `normalSeeded()`). Used in IdealGasModel for reproducible tests.
- `js/data/constants.js`: Added Faraday constant F = 96 485.332 12 C/mol (NIST CODATA 2018, exact).
- New catalog fields: Chemistry → Thermodynamics, Chemistry → Kinetics, Physics → Thermodynamics.

---

## Science-accuracy audit

### Hill binding
- **P50(HbA) = 26.6 mmHg**: Secondary citation only (Wikipedia → Lehninger 6th ed.) — **not checked against primary source**.
- **P50(Mb) ≈ 2.8 mmHg**: Explicitly noted as approximate; primary sources vary (1–3 mmHg). UI shows "≈2.8 mmHg, source varies" warning. **Not checked against primary source.**
- **n range [1.7, 3.2]**: Cited via Wikipedia — **not checked against primary source**.
- **Default n = 2.8**: Within the stated range; user-specified.

### Goldman equation
- **Squid axon concentrations and permeability ratios**: From Hodgkin & Katz (1949), Table 1 — **not checked against primary source** (paper was not fetched; values are widely reproduced in textbooks).
- **Resting potential ≈ −59.9 mV**: num = 1·20 + 0.04·440 + 0.45·52 = 61.0; den = 1·400 + 0.04·50 + 0.45·560 = 654.0; Vm = (RT/F)·ln(61/654)·1000 ≈ −59.9 mV at T = 293.15 K. Test asserts |Vm − expected| < 1e-8 (exact formula, not a range). Note: mammalian neurons at 37 °C with K 155/4, Na 12/145, Cl 4/120 mM give ≈ −74 mV — different system.
- **T = 293.15 K**: Stated explicitly; typical squid-axon experimental temperature.

### Rate laws
- **Integrated rate law equations**: Exact analytical solutions, textbook-standard. Source cited: Atkins & de Paula 2014 — **not checked against primary source** (equations are unambiguous and textbook-universal).
- **No uncertain constants** (k and [A]₀ are free parameters set by user).

### A→B→C mechanisms
- **Bateman equations**: Exact solutions, primary source is Bateman (1910) — **not checked against primary source** (equations are derived from first principles and universally standard).
- **Degenerate k₁=k₂ case**: Limiting form [B] = A₀·kt·e^(−kt) is standard (L'Hôpital's rule derivation).
- **SSA validity**: Test confirms <5% error at k₂/k₁ = 20, t·k₂ >> 1.

### Ideal gas
- **P = NkT/V and ⟨KE⟩ = 3/2 kT**: Exact in reduced units (k_B = 1, m = 1). Simulation conserves total KE to <10⁻⁸ relative error.
- **Reduced units noted** in stage note.
- **Source**: Kittel & Kroemer (1980) — **not checked against primary source**; these are textbook-universal results.

### Maxwell–Boltzmann
- **Molar masses**: **Actually fetched** from CIAAW 2024 abridged atomic weights page during implementation. Values: He 4.0026, N₂ 28.014, O₂ 31.998, Ar 39.95, CO₂ 44.009 g/mol.
- **Ar caveat**: Wide isotopic interval (39.792–39.963); abridged value 39.95 noted.
- **Speed ratios 1:1.1284:1.2247**: Tested to ±0.001.
- **Normalisation**: ∫₀^6v_rms f(v)dv ≈ 1 (±0.001) for He and N₂.

### Van der Waals
- **CO₂ critical constants**: T_c = 304.18 K, P_c = 73.80 bar, ρ_c = 10.6 mol/L — **actually fetched** from NIST WebBook fluid properties page during implementation.
- **Z_c(VdW) = 0.375**: Exact mathematical result; tested to 10⁻¹⁰.
- **Z_c(CO₂ real) = 0.275**: Computed from fetched NIST ρ_c = 10.6 mol/L. Ranges 0.27–0.28.
- **a and b**: Derived from T_c and P_c using inverse critical-point relations; noted explicitly in source comment.
- **NIST WebBook**: Some sub-pages showed internal errors; the fluid-properties page for CO₂ returned values successfully.

### Gibbs free energy
- **ΔH_fus(H₂O) = 6010 J/mol**: CODATA Key Values (Cox, Wagman, Medvedev 1989, Hemisphere) — **not checked against primary source**. NIST WebBook phase-change pages returned internal errors during implementation; value used from knowledge. The value 6010 J/mol is consistent with widely cited sources (CRC Handbook, CODATA) but was not independently fetched or verified.
- **ΔS_fus**: Explicitly noted as derived from ΔH/T_fus (Clausius relation), not independently measured. Stage note and derive section both flag this.
- **K formula**: K = exp(−ΔG/RT); K = 1 at crossoverT tested to 10⁻⁸.

---

## Scientifically uncertain items to report to user

1. **Hill binding P50(HbA) = 26.6 mmHg**: Secondary citation only (Wikipedia → Lehninger 6th ed.). A university library check against the Lehninger primary text would verify.

2. **Hill binding n range [1.7, 3.2]**: Similarly secondary-sourced. Checking Perutz (1970) original paper or a primary biochemistry reference would confirm.

3. **Mb P50 ≈ 2.8 mmHg**: Range ≈1–3 mmHg across primary sources. UI note already present.

4. **Gibbs ΔH_fus = 6010 J/mol**: NIST WebBook was inaccessible for the H₂O phase-change page during implementation. CODATA value is well-established (agrees with CRC), but the user may wish to verify against a current accessible NIST page.

5. **Gibbs ΔS_fus**: Derived, not independently measured here. Explicitly documented.

6. **Van der Waals a and b**: Derived from critical constants, not directly from PVT experimental fits. This gives the best-fit VdW parameters for the critical point but may differ from tabulated textbook a, b values.

7. **Ideal gas reduced units**: k_B = 1, m = 1 — the displayed "temperature" is in units of k_B·K, not Kelvin. Noted in stage note and formula box.

---

## Spot-checks

| Check | Result |
|---|---|
| Hill: θ(26.6 mmHg, n=2.8) = 0.5 | ✓ |
| Goldman: Vm(rest, squid) ≈ −59.9 mV | ✓ (exact formula test, |Vm−expected| < 1e-8) |
| Rate laws: 1st order t½ independent of [A]₀ | ✓ |
| Bateman: [A]+[B]+[C] = [A]₀ | ✓ (to 10⁻¹⁰) |
| Ideal gas: KE conserved in elastic collisions | ✓ (to 10⁻⁸ relative) |
| MB: v_p:v_mean:v_rms ≈ 1:1.1284:1.2247 | ✓ (±0.001) |
| VdW: Z_c = 0.375 for any a, b | ✓ (to 10⁻¹⁰) |
| Gibbs: ΔG = 0 at T_fus = 273.15 K (ice) | ✓ (to 10⁻⁶) |
