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
- **P50(HbA) = 26.6 mmHg**: Cited via Wikipedia (secondary), tracing to Lehninger 6th ed. Primary verification pending.
- **P50(Mb) ≈ 2.8 mmHg**: Explicitly noted as approximate; primary sources vary (1–3 mmHg). UI shows "≈2.8 mmHg, source varies" warning.
- **n range [1.7, 3.2]**: Cited via Wikipedia → primary not verified independently.
- **Default n = 2.8**: Within the stated range; user-specified.

### Goldman equation
- **Squid axon concentrations and permeability ratios**: From Hodgkin & Katz (1949), Table 1. Primary paper accessible at doi:10.1113/jphysiol.1949.sp004310.
- **Resting potential ≈ −61 mV**: Computed from NIST R and F constants + H&K concentrations. Test confirms −65 to −58 mV range.
- **T = 293.15 K**: Stated explicitly; typical squid-axon experimental temperature.

### Rate laws
- **Integrated rate law equations**: Exact analytical solutions, textbook-standard. Source cited: Atkins & de Paula 2014.
- **No uncertain constants** (k and [A]₀ are free parameters set by user).

### A→B→C mechanisms
- **Bateman equations**: Exact solutions, primary source is Bateman (1910). DOI accessible.
- **Degenerate k₁=k₂ case**: Limiting form [B] = A₀·kt·e^(−kt) is standard.
- **SSA validity**: Test confirms <5% error at k₂/k₁ = 20, t·k₂ >> 1.

### Ideal gas
- **P = NkT/V and ⟨KE⟩ = 3/2 kT**: Exact in reduced units (k_B = 1, m = 1). Simulation conserves total KE to <10⁻⁸ relative error.
- **Reduced units noted** in stage note.
- **Source**: Kittel & Kroemer (1980).

### Maxwell–Boltzmann
- **Molar masses**: Fetched from CIAAW 2024 abridged atomic weights (reachable at time of writing). Values: He 4.0026, N₂ 28.014, O₂ 31.998, Ar 39.95, CO₂ 44.009 g/mol.
- **Ar caveat**: Wide isotopic interval (39.792–39.963); abridged value 39.95 noted.
- **Speed ratios 1:1.1284:1.2247**: Tested to ±0.001.
- **Normalisation**: ∫₀^6v_rms f(v)dv ≈ 1 (±0.001) for He and N₂.

### Van der Waals
- **CO₂ critical constants**: T_c = 304.18 K, P_c = 73.80 bar from NIST WebBook (Suehiro et al. 1996).
- **Z_c(VdW) = 0.375**: Exact mathematical result; tested to 10⁻¹⁰.
- **Z_c(CO₂ real) = 0.275**: Computed from NIST ρ_c = 10.6 mol/L. Ranges 0.27–0.28.
- **a and b**: Derived from T_c and P_c using inverse critical-point relations; noted explicitly in source comment.
- **NIST WebBook**: Was accessible (T_c, P_c, ρ_c retrieved); however the WebBook showed internal errors on several specific sub-pages.

### Gibbs free energy
- **ΔH_fus(H₂O) = 6010 J/mol**: CODATA Key Values (Cox, Wagman, Medvedev 1989, Hemisphere). NIST WebBook phase-change pages returned internal errors during implementation; value cross-checked against CRC Handbook (same 6.010 kJ/mol).
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
| Goldman: Vm(rest, squid) ≈ −61 mV | ✓ (test range −65 to −58) |
| Rate laws: 1st order t½ independent of [A]₀ | ✓ |
| Bateman: [A]+[B]+[C] = [A]₀ | ✓ (to 10⁻¹⁰) |
| Ideal gas: KE conserved in elastic collisions | ✓ (to 10⁻⁸ relative) |
| MB: v_p:v_mean:v_rms ≈ 1:1.1284:1.2247 | ✓ (±0.001) |
| VdW: Z_c = 0.375 for any a, b | ✓ (to 10⁻¹⁰) |
| Gibbs: ΔG = 0 at T_fus = 273.15 K (ice) | ✓ (to 10⁻⁶) |
