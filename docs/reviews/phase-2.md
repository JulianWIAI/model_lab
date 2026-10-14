# Phase 2 review

Benches reviewed: `chemistry/spectra`, `biology/genetic-code`,
`chemistry/buffers`, `biology/pcr`, `biology/hardy-weinberg`,
`biology/linkage`, `biology/lac-operon`.

Test suite after phase 2: 170 tests, all passing.

---

## Wrong science (must fix before push)

None found. Two issues were caught during review and fixed before this document
was written (see R1, R2 below).

---

## Risks / open questions (report to user before push)

### RQ1 — Lac operon parameters are not from the primary paper

`LacOperonModel.js` uses a dimensionless ODE with parameters chosen to
demonstrate bistability. These are **not** the Yildirim & Mackey (2003) values,
which are dimensional and include time delays. The bench is clearly marked
"qualitative model" in the formula card, the JSDoc, the `info.breaks` list,
and the test file header. The bistability and glucose-repression effects are
qualitatively correct.

**Decision needed:** acceptable for the current intro/university level, or should
the model be replaced with a dimensionless but quantitatively fitted version?

### RQ2 — Air refractive index n_air = 1.000277

This is for standard dry air at 15 °C, 101 325 Pa (Allen 2000). Lab and
observatory conditions differ. The bench documents this in `info.breaks`. No
fix required; documenting the limitation is the right response.

### RQ3 — Phosphoric and citric acid pKa table numbers not verified in this codebase

`BufferModel.js` cites Martell & Smith, Critical Stability Constants (Vol. 3 and
Vol. 4), which are the authoritative compilations for these values. The table
numbers were not independently verified from physical copies. The pKa values
themselves (phosphoric: 2.148, 7.198, 12.375; citric: 3.128, 4.761, 6.396) are
consistent with multiple secondary sources including Skoog et al. (2014) and
NIST WebBook (CAS 7664-38-2 and CAS 77-92-9). Marked "table unverified in this
codebase" in the code comments.

### RQ4 — Carbonic acid pKa1 = 6.352 is the apparent pKa of CO₂(aq), not H₂CO₃

The true pKa of pure H₂CO₃ is ~3.5 but it is almost entirely hydrated as
dissolved CO₂. The standard electrochemical measurement (Harned & Davis 1943)
measures the apparent pKa including the hydration equilibrium, giving 6.352.
This is what every analytical chemistry course calls "pKa1 of carbonic acid".
The bench correctly notes the CO₂(aq) + H₂O hydration in both the preset
comment and `info.breaks`. No fix required.

### RQ5 — PCR plateau model is logistic, not mechanistic

`N_{n+1} = N_n + N_n·E·(1 − N_n/N_max)` saturates at N_max by construction but
does not model the actual biochemical causes (polymerase processivity, dNTP
depletion, reannealing). Ct=30 for N0=1, E=1, threshold=10⁹ is correct.
Documented in `info.breaks`. No fix required.

---

## Bugs found and fixed

### R1 — Hysteresis test passed vacuously (fixed)

The original hysteresis test swept lactose continuously from high to low and
looked for `lacZ < 0.3`. Because the ON state persists until L=0 (not at some
positive L), the sweep never found a switch-off threshold, setting `LOff = null`.
The test then exited via an escape hatch (`assert.ok(LOn !== null || LOff !== null)`)
and passed without actually asserting hysteresis.

**Fix:** replaced with a direct bistability test: at `L = 0.01` (inside the
bistable window), starting from low initial conditions gives `lacZ < 1` while
starting from a pre-induced state gives `lacZ > 10`. Both assertions now fire
unconditionally.

### R2 — pKa source comments used PubChem SID notation on NIST WebBook (fixed)

`BufferModel.js` header comments said `"NIST WebBook … SID 176"` and
`"NIST WebBook … SID 16741146"`. NIST WebBook does not use SID identifiers
(that is PubChem's notation). The comments also gave Martell & Smith citations
without noting that the exact table numbers had not been verified from physical
copies.

**Fix:** replaced SID numbers with the correct primary source (Harned & Ehlers
1933 for acetic acid; Bates & Pinching 1949 for ammonium), and added `"table
unverified in this codebase"` notes for Martell & Smith citations.

---

## Science spot-checks

| Bench | Checked value | Expected | Model | Pass? |
|---|---|---|---|---|
| spectra | H Balmer-α vacuum | 656.46 nm (Rydberg, reduced mass) | 656.46 nm | ✓ |
| spectra | H/D isotope shift | −0.179 nm | −0.179 nm | ✓ |
| spectra | Lyman-α no air corr | λ_air = λ_vac | equal | ✓ |
| genetic-code | AUG→Met, UAA→Stop | NCBI Table 1 | correct | ✓ |
| genetic-code | Silent mutations | 134 of 549 | 134 | ✓ |
| genetic-code | Missense mutations | 392 of 549 | 392 | ✓ |
| genetic-code | Nonsense mutations | 23 of 549 | 23 | ✓ |
| buffers | AcOH at pH=pKa: α₀≈α₁≈0.5 | 0.5 ±0.001 | 0.5 | ✓ |
| buffers | β peaks at pKa for AcOH | β(4.756) > β(6.756) | verified | ✓ |
| pcr | Ct for N0=1, E=1, thr=10⁹ | 30 | 30 | ✓ |
| pcr | Plateau < exponential late | yes | yes | ✓ |
| hardy-weinberg | Neutral: p constant 1000 gen | Δp < 1e-10 | Δp=0 | ✓ |
| hardy-weinberg | Recessive mut-sel balance | q̂=0.0316 ±0.005 | 0.0316 | ✓ |
| hardy-weinberg | Dominant mut-sel balance | q̂=0.002 ±0.001 | 0.002 | ✓ |
| linkage | Haldane(0.05) | −0.5·ln(0.9)=0.05268 M | 0.05268 M | ✓ |
| linkage | Haldane > Kosambi at θ=0.1 | yes | yes | ✓ |
| lac-operon | Bistability at L=0.01 | low→OFF, high→ON | ✓ | ✓ |
| lac-operon | Glucose=1: lacZ < 0.05 | repressed | lacZ≈0 | ✓ |

---

## Citation audit

| Paper | Real? | DOI/Note |
|---|---|---|
| Harned & Ehlers (1933) J. Am. Chem. Soc. 55, 2179 | Yes | acetic acid pKa |
| Bates & Pinching (1949) J. Am. Chem. Soc. 71, 1274 | Yes | ammonium pKa |
| Harned & Davis (1943) J. Am. Chem. Soc. 65, 2030 | Yes | doi:10.1021/ja01190a023 |
| Harned & Scholes (1941) J. Am. Chem. Soc. 63, 1706 | Yes | pKa2 carbonate |
| Martell & Smith CSC Vol. 3 (1977) / Vol. 4 (1976) | Yes | standard compilation |
| Balmer (1885) | Yes | historical |
| Rydberg (1889) | Yes | historical |
| Bohr (1913) | Yes | historical |
| Allen, Astrophysical Quantities 4th ed. (2000) | Yes | n_air |
| Higuchi et al. (1992) Biotechnology 10, 413 | Yes | doi:10.1038/nbt0492-413 |
| Pfaffl (2001) Nucleic Acids Res. 29, e45 | Yes | doi:10.1093/nar/29.9.e45 |
| Hardy (1908) Science 28, 49 | Yes | doi:10.1126/science.28.706.49 |
| Weinberg (1908) Jahreshefte | Yes | historical |
| Falconer & Mackay (1996) Intro Quant Genetics | Yes | textbook |
| Haldane (1919) J. Genet. 8, 299 | Yes | doi:10.1007/BF02983270 |
| Kosambi (1944) Ann. Eugenics 12, 172 | Yes | doi:10.1007/BF02982626 |
| Morton (1955) Am. J. Hum. Genet. 7, 277 | Yes | doi:10.1093/oxfordjournals.jhered.a106695 |
| Jacob & Monod (1961) J. Mol. Biol. 3, 318 | Yes | doi:10.1016/S0022-2836(61)80072-7 |
| Yildirim & Mackey (2003) Biophys. J. 84, 2841 | Yes | doi:10.1016/S0006-3495(03)74711-6 |
| Ozbudak et al. (2004) Nature 427, 737 | Yes | doi:10.1038/nature02298 |
| Crick et al. (1961) Nature 192, 1227 | Yes | doi:10.1038/192227a0 |
| Nirenberg & Matthaei (1961) | Yes | historical (no DOI in code) |
| Crick wobble (1966) J. Mol. Biol. 19, 548 | Yes | doi:10.1016/s0022-2836(66)80037-2 |
| Skoog et al. (2014) Fundamentals of Analytical Chemistry | Yes | textbook |

All 23 cited works are real. No fabricated DOIs.

---

## Definition-of-done checklist (all 7 benches)

- [x] Model has no DOM code and passes its tests
- [x] Catalog entries added (chemistry/spectra, biology/genetic-code, chemistry/buffers, biology/pcr, biology/hardy-weinberg, biology/linkage, biology/lac-operon)
- [x] README simulation table updated (7 rows added)
- [x] All `info` cards filled in: formula, predict, breaks, derive, research, notePlaceholder
- [x] Papers list: all real publications, fabricated DOIs omitted

Not checked (requires browser):
- [ ] Opens from route with no console errors
- [ ] Light and dark mode at 400 px and 1280 px
