# Sources

Every constant, dataset, and empirical value used in Model Lab, with the bench that uses it,
the value stored, where it came from, and whether the primary source was actually read.

**Status key:**
- `verified` — the primary source page or document was actually fetched/read during implementation
- `secondary` — taken from a secondary source (textbook, Wikipedia, review) that cites the primary
- `unverified` — not independently checked; value is widely cited or textbook-standard but no source was consulted

---

## Fundamental physical constants

All values are from **NIST CODATA 2018** (`js/data/constants.js`).
The constants page was **not fetched** during implementation; values were taken from prior knowledge
of CODATA 2018. The 2019 SI redefinition made c, h, e, k_B, N_A, R, F exact by definition, so
their values are unambiguous.

| Constant | Value | Unit | Status | Notes |
|---|---|---|---|---|
| c (speed of light) | 299 792 458 | m/s | secondary | Exact by 2019 SI definition |
| h (Planck) | 6.626 070 15 × 10⁻³⁴ | J·s | secondary | Exact by 2019 SI definition |
| ℏ (reduced Planck) | 1.054 571 817 × 10⁻³⁴ | J·s | secondary | Derived from h/2π |
| e (elementary charge) | 1.602 176 634 × 10⁻¹⁹ | C | secondary | Exact by 2019 SI definition |
| k_B (Boltzmann) | 1.380 649 × 10⁻²³ | J/K | secondary | Exact by 2019 SI definition |
| N_A (Avogadro) | 6.022 140 76 × 10²³ | mol⁻¹ | secondary | Exact by 2019 SI definition |
| R (gas constant) | 8.314 462 618 | J/(mol·K) | secondary | Exact (= N_A · k_B) |
| F (Faraday) | 96 485.332 12 | C/mol | secondary | Exact (= N_A · e) |
| G (gravitational) | 6.674 30 × 10⁻¹¹ | N·m²/kg² | secondary | CODATA 2018, ±0.000 15 × 10⁻¹¹ |
| g (standard gravity) | 9.806 65 | m/s² | secondary | Exact by convention (ISO 80000-3) |
| m_e (electron mass) | 9.109 383 7015 × 10⁻³¹ | kg | secondary | CODATA 2018 |
| m_p (proton mass) | 1.672 621 923 69 × 10⁻²⁷ | kg | secondary | CODATA 2018 |
| m_d (deuteron mass) | 3.343 583 7724 × 10⁻²⁷ | kg | secondary | CODATA 2018 |
| R_∞ (Rydberg) | 1.097 373 156 816 0 × 10⁷ | m⁻¹ | secondary | CODATA 2018, ±2.1 × 10⁻³ m⁻¹ |

---

## Periodic table element data

| Dataset | Value | Source | Status | Notes |
|---|---|---|---|---|
| All 118 elements (Z, symbol, name, mass, config, radii, EN, IE) | Full table | PubChem Periodic Table REST API | **verified** | Fetched 2026-10-14; `js/data/elements.js` SOURCE object records URL and date |
| Electron configs, Aufbau exceptions (19 elements) | Cr, Cu, La, Ce, Gd, Ac, Th, Pa, U, Np, Cm, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au | PubChem data, verified against NIST | **verified** | 9 additional exceptions added after Phase 1 review (W2 fix) |

---

## Genetic code

| Dataset | Value | Source | Status | Notes |
|---|---|---|---|---|
| 64 codons → amino acid mapping | All 64 entries | NCBI Translation Table 1 (Standard) | **verified** | Fetched from NCBI; `js/data/geneticCode.js` records URL and retrieval date |

---

## Phase 1 benches

### Pendulum (`physics/pendulum`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Equations of motion (exact + small-angle) | Standard mechanics; Goldstein 3rd ed. | unverified | Textbook-universal; no empirical constants |

### Quarks (`physics/quarks`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Quark masses (u≈2.2, d≈4.7, s≈96 MeV/c²) | PDG 2022 | secondary | Not fetched; well-established consensus values |
| Hadron classification (proton=uud, etc.) | PDG 2022 | secondary | Not fetched |

### Chemical equilibrium (`chemistry/equilibrium`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Arrhenius equation, van 't Hoff equation | Atkins & de Paula, Physical Chemistry | unverified | Textbook-universal; no empirical constants |

### Genetic drift (`biology/drift`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Wright-Fisher model | Wright (1931), Fisher (1930) | secondary | No empirical constants; drift is pure probability |

### Hodgkin–Huxley neuron (`neuroscience/neuron`)

| Value | Source | Status | Notes |
|---|---|---|---|
| g_Na=120, g_K=36, g_L=0.3 mS/cm² | Hodgkin & Huxley (1952) J. Physiol. 117, 500 | secondary | Not checked against primary source |
| E_Na=+55, E_K=−77, E_L=−54.4 mV | Hodgkin & Huxley (1952) | secondary | Not checked against primary source |
| α/β rate equations | Hodgkin & Huxley (1952) | secondary | Not checked against primary source |

### Fourier series (`math/fourier`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Fourier coefficients (square/sawtooth/triangle) | Standard analysis; no empirical constants | unverified | Purely mathematical; no uncertain values |

### Tax incidence (`economics/tax`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Consumer/producer surplus formulas | Mankiw, Principles of Economics | unverified | No empirical constants |

### Central dogma (`biology/central-dogma`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Transcription/translation rules | NCBI genetic code (same as above) | verified | |

### Mendelian genetics (`biology/mendel`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Mendelian ratios, chi-square critical values | Mendel (1866); standard statistics | secondary | No uncertain empirical constants |

### Enzyme kinetics (`biology/enzyme-kinetics`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Michaelis–Menten equation | Michaelis & Menten (1913) | secondary | No empirical constants; K_M and V_max are free parameters |

### Hydrogen orbitals (`chemistry/orbitals`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Radial/angular wavefunctions | Griffiths, Introduction to QM, 2nd ed. | secondary | Exact solutions to the Schrödinger equation; no uncertain values |
| Bohr radius a₀ = 52.917... pm | From CONSTANTS (CODATA 2018) | secondary | |

### Titration curves (`chemistry/titration`)

| Value | Source | Status | Notes |
|---|---|---|---|
| K_w = 1.012 × 10⁻¹⁴ at 25 °C | NIST Chemistry WebBook | secondary | Not fetched; value consistent with Skoog et al. 2014 |
| pKa(AcOH) = 4.756 | Harned & Ehlers (1933) J. Am. Chem. Soc. 55, 2179 | secondary | Not fetched; tabulated value |
| pKa(NH₄⁺) = 9.246 | Bates & Pinching (1949) J. Am. Chem. Soc. 71, 1274 | secondary | Not fetched; 9.25 in NIST WebBook — 0.004 unit discrepancy noted |
| pKa(H₂CO₃, apparent) = 6.352 | Harned & Davis (1943) J. Am. Chem. Soc. 65, 2030 | secondary | Apparent pKa including CO₂(aq) hydration |

---

## Phase 2 benches

### Atomic spectra (`chemistry/spectra`)

| Value | Source | Status | Notes |
|---|---|---|---|
| R_∞ = 1.097 373 156 816 0 × 10⁷ m⁻¹ | NIST CODATA 2018 (via constants.js) | secondary | |
| n_air = 1.000277 | Allen, Astrophysical Quantities 4th ed. (2000) §1.12 | secondary | Not fetched; standard reference value for dry air, 15 °C |
| m_e, m_p, m_d | NIST CODATA 2018 (via constants.js) | secondary | |
| H Balmer-α (vacuum) ≈ 656.46 nm | Computed from R_∞, reduced mass | — | Matches textbook; verified by test |

### Genetic code (`biology/genetic-code`)

| Value | Source | Status | Notes |
|---|---|---|---|
| 64 codons | NCBI Translation Table 1 | verified | See periodic table section |

### Buffer capacity (`chemistry/buffers`)

| Value | Source | Status | Notes |
|---|---|---|---|
| pKa(AcOH) = 4.756 | Harned & Ehlers (1933) | secondary | Same as titration |
| pKa(NH₄⁺) = 9.246 | Bates & Pinching (1949) | secondary | Same as titration |
| pKa(H₃PO₄) = 2.148, 7.198, 12.375 | Martell & Smith, Critical Stability Constants Vol. 4 (1976) | secondary | Table number not verified in this codebase; values consistent with Skoog et al. 2014 |
| pKa(H₂CO₃) = 6.352, 10.329 | Harned & Davis (1943) / Harned & Scholes (1941) | secondary | Not fetched |
| pKa(citric acid) = 3.128, 4.761, 6.396 | Martell & Smith, Critical Stability Constants Vol. 3 (1977) | secondary | Table number not verified; consistent with secondary sources |
| K_w = 1.012 × 10⁻¹⁴ | NIST (same as titration) | secondary | |

### PCR (`biology/pcr`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Exponential amplification formula | Higuchi et al. (1992) Biotechniques 10, 413 | secondary | No uncertain empirical constants; E and N₀ are free parameters |

### Hardy–Weinberg (`biology/hardy-weinberg`)

| Value | Source | Status | Notes |
|---|---|---|---|
| HW equilibrium, selection equations | Hardy (1908); Weinberg (1908) | secondary | Standard genetics; no uncertain constants |

### Genetic linkage (`biology/linkage`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Haldane mapping function | Haldane (1919) J. Genet. 8, 299 | secondary | Exact formula; no empirical constants |
| Kosambi mapping function | Kosambi (1944) Ann. Eugenics 12, 172 | secondary | Exact formula; no empirical constants |

### Lac operon (`biology/lac-operon`)

| Value | Source | Status | Notes |
|---|---|---|---|
| ODE structure | Yildirim & Mackey (2003) Biophys. J. 84, 2841 | secondary | Parameters are **not** from the primary paper; chosen for qualitative bistability. Documented as "qualitative model" in bench |

---

## Phase 3 benches

### Cooperative O₂ binding — Hill equation (`biology/biochemistry/hill-binding`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Hill equation θ = pO₂ⁿ/(P50ⁿ + pO₂ⁿ) | Hill (1910) J. Physiol. 40, iv–vii | secondary | Formula is exact; not checked against primary source |
| P50(HbA) = 26.6 mmHg | Wikipedia → Lehninger Principles of Biochemistry, 6th ed. | secondary | Not checked against primary source |
| n range [1.7, 3.2] for HbA | Wikipedia "Hill equation (biochemistry)" | secondary | Not checked against primary source |
| P50(Mb) ≈ 2.8 mmHg | Approximate; primary sources vary 1–3 mmHg | unverified | UI shows "source varies" warning |

### Goldman equation (`neuroscience/electrophysiology/goldman`)

| Value | Source | Status | Notes |
|---|---|---|---|
| GHK voltage equation | Goldman (1943) J. Gen. Physiol. 27, 37 | secondary | Not checked against primary source |
| Squid axon concentrations (K 400/20, Na 50/440, Cl 52/560 mM) | Hodgkin & Katz (1949) Table 1 | secondary | Not checked against primary source; widely reproduced in textbooks |
| Squid axon permeabilities (PK:PNa:PCl = 1:0.04:0.45) | Hodgkin & Katz (1949) | secondary | Not checked against primary source |
| Squid axon AP peak (PNa/PK = 20) | Hodgkin & Katz (1949) | secondary | Not checked against primary source |
| Mammalian muscle concentrations (K 155/4, Na 12/145, Cl 4/120 mM) | Hille (2001) Ion Channels of Excitable Membranes, Ch. 1 | secondary | Not checked against primary source |
| Mammalian muscle permeabilities (1:0.05:0.45) | Typical mammalian values | unverified | Not from a specific primary source |
| Computed Vm(squid rest) ≈ −59.9 mV | Derived from constants + concentrations | — | Test asserts exact formula match to 1e-8 |
| Computed Vm(mammalian rest) ≈ −74 mV | Derived from constants + concentrations | — | |

### Integrated rate laws (`chemistry/kinetics/rate-laws`)

| Value | Source | Status | Notes |
|---|---|---|---|
| 0th, 1st, 2nd order integrated laws | Atkins & de Paula, Physical Chemistry (2014) | secondary | Not checked against primary source; equations are textbook-universal |

### A→B→C mechanisms (`chemistry/kinetics/mechanisms`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Bateman equations | Bateman (1910) Proc. Cambridge Phil. Soc. 15, 423 | secondary | Not checked against primary source; equations derived from first principles |
| Degenerate case (k₁=k₂): [B] = A₀·k·t·e^(−kt) | Standard L'Hôpital limit | — | Mathematical result; no uncertain values |

### Ideal gas simulation (`physics/thermodynamics/ideal-gas`)

| Value | Source | Status | Notes |
|---|---|---|---|
| P = NkT/V, ⟨KE⟩ = 3/2 kT | Kittel & Kroemer (1980); textbook-universal | secondary | Not checked against primary source; exact in reduced units (k_B=1, m=1) |
| Reduced units (k_B=1, m=1) | Standard computational convention | — | Documented in stage note and formula card |

### Maxwell–Boltzmann distribution (`physics/thermodynamics/maxwell-boltzmann`)

| Value | Source | Status | Notes |
|---|---|---|---|
| f(v) distribution formula | Maxwell (1860); Boltzmann (1871) | secondary | Not checked against primary source; textbook-universal |
| M(He) = 4.0026 g/mol | CIAAW 2024 abridged atomic weights | **verified** | Fetched during implementation |
| M(N) = 14.007 g/mol → M(N₂) = 28.014 g/mol | CIAAW 2024 | **verified** | Fetched during implementation |
| M(O) = 15.999 g/mol → M(O₂) = 31.998 g/mol | CIAAW 2024 | **verified** | Fetched during implementation |
| M(Ar) = 39.95 g/mol | CIAAW 2024 (abridged; interval 39.792–39.963) | **verified** | Fetched; wide isotopic interval noted in source comment |
| M(C) = 12.011 g/mol → M(CO₂) = 44.009 g/mol | CIAAW 2024 | **verified** | Fetched during implementation |

### Van der Waals equation (`physics/thermodynamics/van-der-waals`)

| Value | Source | Status | Notes |
|---|---|---|---|
| VdW equation P = RT/(Vm−b) − a/Vm² | van der Waals (1873); textbook | secondary | No uncertain constants in the general equation |
| Z_c(VdW) = 3/8 = 0.375 | Exact mathematical result | — | Derived algebraically; tested to 10⁻¹⁰ |
| T_c(CO₂) = 304.18 K | NIST WebBook (citing Suehiro et al. 1996) | **verified** | Fetched during implementation |
| P_c(CO₂) = 73.80 bar | NIST WebBook (citing Suehiro et al. 1996) | **verified** | Fetched during implementation |
| ρ_c(CO₂) = 10.6 mol/L → Z_c(real) ≈ 0.275 | NIST WebBook | **verified** | Fetched during implementation; gives V_c = 94.3 mL/mol |
| a, b for CO₂ | Derived from T_c, P_c via inverse critical-point relations | — | Not independently verified against tabulated a, b values |

### Gibbs free energy (`chemistry/thermodynamics/gibbs`)

| Value | Source | Status | Notes |
|---|---|---|---|
| ΔG = ΔH − TΔS, K = exp(−ΔG/RT) | Standard thermodynamics | — | No uncertain constants |
| ΔH_fus(H₂O) = 6010 J/mol | CODATA Key Values — Cox, Wagman, Medvedev (1989), Hemisphere | secondary | Not fetched; NIST WebBook phase-change page returned internal errors. Value from knowledge; consistent with CRC Handbook. **User may wish to verify against current NIST.** |
| T_fus(H₂O) = 273.15 K | Standard definition | — | Exact by convention |
| ΔS_fus = 22.00 J/(mol·K) | Derived: ΔH_fus / T_fus (Clausius relation) | — | Not independently measured; documented in stage note |

---

## Phase 4 benches

### Logistic growth (`biology/ecology/logistic`)

| Value | Source | Status | Notes |
|---|---|---|---|
| N(t) = K/(1+((K−N₀)/N₀)·e^(−rt)) | Verhulst (1845) Nouv. Mém. Acad. Roy. Belg. 18, 1–42 | secondary | Not checked against primary source; textbook-universal |
| Max growth at N = K/2, (dN/dt)_max = rK/4 | Standard calculus result | — | Exact; no uncertain values |

### Predator–prey (`biology/ecology/predator-prey`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Lotka–Volterra ODEs | Lotka (1925) Elements of Physical Biology; Volterra (1926) Mem. Accad. Naz. Lincei | secondary | No uncertain constants; α, β, δ, γ are free parameters |
| Conserved quantity V = δx − γ·ln x + β·y − α·ln y | Standard result (Volterra 1926) | secondary | No uncertain values; tested to ±0.01 over 1000 steps |
| Equilibrium (γ/δ, α/β) | Standard result | — | Exact; tested to ±1e-10 |

### SIR epidemic model (`biology/ecology/sir`)

| Value | Source | Status | Notes |
|---|---|---|---|
| SIR ODE system | Kermack & McKendrick (1927) Proc. Roy. Soc. A 115, 700–721 | secondary | No uncertain constants; β and γ are free parameters |
| Final-size relation r∞ = 1 − e^(−R₀·r∞) | Kermack & McKendrick (1927) | secondary | Solved numerically with brent; R₀=2→r∞≈0.797, R₀=3→r∞≈0.940 tested ±0.002 |
| Herd-immunity threshold h* = 1 − 1/R₀ | Standard result | — | Exact; tested to ±1e-10 |

### Truncation selection (`biology/evolution/selection`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Breeder's equation R = h²·S | Lush (1937) Animal Breeding Plans; Lynch & Walsh (1998) | secondary | No uncertain constants; h² and σ are free parameters |
| Selection intensity i = φ(t)/p | Standard quantitative genetics | secondary | Derived from truncation selection on a normal phenotype distribution |
| Φ⁻¹ rational approximation | Abramowitz & Stegun (1964) §26.2.17 | secondary | |err| < 4.5×10⁻⁴; not checked against primary source |
| i(p=0.2) ≈ 1.400, i(p=0.5) ≈ 0.798, i(p=0.1) ≈ 1.755 | Standard tables | secondary | Tested ±0.001 |

### Nernst cell (`chemistry/electrochemistry/nernst-cell`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Nernst equation E = E° − (RT/nF)·ln Q | Nernst (1889); standard electrochemistry | secondary | No uncertain constants (uses R, F from constants.js) |
| Cu²⁺/Cu: E° = +0.3419 V | Bard, Parsons & Jordan (1985) Standard Potentials in Aqueous Solution. IUPAC | secondary | NIST WebBook fetch attempted 2026-10-15 — CAS page returned "not found". **Not fetched from primary source.** |
| Zn²⁺/Zn: E° = −0.7618 V | Bard, Parsons & Jordan (1985) | secondary | NIST WebBook fetch failed (same as Cu²⁺). **Not fetched from primary source.** |
| E°_cell(Daniell) = 1.1037 V | Derived: 0.3419 − (−0.7618) | — | Computed from above secondary values |

### Hess's law (`chemistry/thermodynamics/hess`)

| Value | Source | Status | Notes |
|---|---|---|---|
| Hess's law formula | Hess (1840) Ann. Phys. 50, 385 | secondary | Not checked against primary source; textbook-universal |
| ΔHf°(CH₄, g) = −74.87 kJ/mol | CODATA/JANAF | secondary | NIST WebBook fetch attempted 2026-10-15 — returned link stubs only, no numerical data. **Not fetched from primary source.** |
| ΔHf°(O₂, g) = 0 kJ/mol | By definition (reference state) | — | Exact |
| ΔHf°(CO₂, g) = −393.51 kJ/mol | CODATA/JANAF | secondary | NIST WebBook fetch failed (same as CH₄). **Not fetched from primary source.** |
| ΔHf°(H₂O, l) = −285.83 kJ/mol | CODATA/JANAF | secondary | NIST WebBook fetch failed. **Not fetched from primary source.** |
| ΔHf°(C₂H₅OH, l) = −277.69 kJ/mol | CODATA/JANAF | secondary | NIST WebBook fetch failed. **Not fetched from primary source.** |
| ΔH°(CH₄ combustion) ≈ −890.30 kJ/mol | Derived from above ΔHf° | — | Tested ±2 kJ/mol |
| ΔH°(C₂H₅OH combustion) ≈ −1366.82 kJ/mol | Derived from above ΔHf° | — | Tested ±5 kJ/mol |

### VSEPR geometries (`chemistry/bonding/vsepr`)

| Value | Source | Status | Notes |
|---|---|---|---|
| VSEPR electron-pair repulsion model | Gillespie & Nyholm (1957) Q. Rev. Chem. Soc. 11, 339 | secondary | Not checked against primary source |
| H₂O bond angle = 104.5° | NIST CCCBDB | secondary | Not checked against primary source during implementation |
| NH₃ bond angle = 107° | NIST CCCBDB | secondary | Not checked against primary source during implementation |
| SO₂ bond angle ≈ 119° | NIST CCCBDB | secondary | Not checked against primary source |
| SF₄ bond angles ≈ 173°/101° | NIST CCCBDB | secondary | Not checked against primary source |
| ClF₃ bond angle ≈ 87° | NIST CCCBDB | secondary | Not checked against primary source |
| Tetrahedral dot product = −1/3 | Exact geometry result | — | All 4 ligand pairs tested ±1e-6 |

---

## Open verification items

The following items were noted as uncertain during implementation and have not been resolved:

1. **Hill P50(HbA) = 26.6 mmHg** — secondary citation. Verify against Lehninger 6th ed. or a primary O₂-dissociation curve paper.
2. **Hill n range [1.7, 3.2]** — secondary citation. Verify against Perutz (1970) or equivalent primary biochemistry source.
3. **Mb P50 ≈ 2.8 mmHg** — value varies 1–3 mmHg in primary sources. UI notes this explicitly.
4. **Phosphoric acid pKa3 = 12.375** — less precisely determined (12.35–12.40 across sources). Verify against physical copy of Martell & Smith Vol. 4.
5. **Citric acid pKas** — Martell & Smith Vol. 3 table number not verified in this codebase.
6. **ΔH_fus(H₂O) = 6010 J/mol** — NIST WebBook was inaccessible during implementation. Verify against current NIST page.
7. **Hodgkin & Katz (1949) concentrations and permeabilities** — not checked against the primary paper.
8. **Mammalian muscle ion concentrations** — cited as Hille (2001) but not verified against that source.
9. **VdW a, b for CO₂** — derived from critical constants, may differ from directly tabulated values.
10. **Ideal gas reduced units** — k_B = 1, m = 1; displayed temperature is in k_B · K, not kelvin.
11. **Nernst cell E°(Cu²⁺/Cu) = +0.3419 V** — Bard et al. (1985) secondary value; NIST WebBook CAS pages returned "not found" (2026-10-15). Verify against IUPAC tables or a current electrochemistry reference.
12. **Nernst cell E°(Zn²⁺/Zn) = −0.7618 V** — same secondary source as above; same verification needed.
13. **ΔHf°(CH₄) = −74.87 kJ/mol** — CODATA/JANAF secondary value; NIST WebBook returned only navigation stubs (2026-10-15). Verify against current NIST Chemistry WebBook or JANAF Tables.
14. **ΔHf°(CO₂) = −393.51 kJ/mol** — same secondary source; same verification needed.
15. **ΔHf°(H₂O, l) = −285.83 kJ/mol** — same secondary source; same verification needed.
16. **ΔHf°(C₂H₅OH, l) = −277.69 kJ/mol** — same secondary source; same verification needed.
17. **VSEPR real angles (H₂O 104.5°, NH₃ 107°, SO₂ 119°, SF₄ 173°/101°, ClF₃ 87°)** — attributed to NIST CCCBDB but not fetched during implementation. Verify against NIST CCCBDB or primary microwave spectroscopy papers.
