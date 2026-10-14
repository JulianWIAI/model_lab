# Phase 1 review

Benches reviewed: `biology/central-dogma`, `biology/mendel`,
`biology/enzyme-kinetics`, `chemistry/orbitals`, `chemistry/titration`,
`chemistry/periodic-table`.

Also checked: quark model test (carried forward from Phase 0 gap).

---

## Wrong science (must fix)

### W1 — `js/data/elements.js` was typed from memory, not fetched

The file header claims:

```js
export const SOURCE = Object.freeze({
  name: 'IUPAC / WebElements',
  url: 'https://www.webelements.com/',
  retrieved: '2026-10-14',
});
```

The data was never downloaded. It was typed from memory by the model that
generated it. This violates CLAUDE.md: *"Never invent experimental values."*
Several values are known to differ from the real WebElements / PubChem data:

- Atomic radii: the stored values are Bohr radii of the wavefunction (e.g.
  H = 53 pm) rather than the measured van der Waals radii PubChem provides
  (H = 120 pm). The two scales are incompatible, so plotting them together is
  misleading.
- Electron configurations for Ga (Z=31) through Kr (Z=36) include the 3d¹⁰
  sub-shell in the typed data. PubChem shows this too, but the ordering
  differs. More importantly, for several actinide and lanthanide elements the
  stored configs disagree with PubChem (see W2).
- Claim of a retrieval date with no actual retrieval is a fabricated citation.

**Fix:** rewrite `tools/fetch-elements.js` so it genuinely fetches
`https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON`,
run it, and commit the generated file with the real retrieval date.

### W2 — `PeriodicTableModel` has only 10 Aufbau exceptions; 9 are missing

The model hard-codes exceptions only for d-block anomalies (Cr, Cu, Nb, Mo,
Ru, Rh, Pd, Ag, Pt, Au). Confirmed by running
`aufbauConfig(Z)` against PubChem configs for all elements, these 9
elements are missing from EXCEPTIONS and produce wrong configurations:

| Z  | Symbol | `aufbauConfig()` output | PubChem actual |
|----|--------|------------------------|----------------|
| 57 | La | `[Xe] 4f¹ 6s²` | `[Xe] 5d¹ 6s²` |
| 58 | Ce | `[Xe] 4f² 6s²` | `[Xe] 4f¹ 5d¹ 6s²` |
| 64 | Gd | `[Xe] 4f⁸ 6s²` | `[Xe] 4f⁷ 5d¹ 6s²` |
| 89 | Ac | `[Rn] 5f¹ 7s²` | `[Rn] 6d¹ 7s²` |
| 90 | Th | `[Rn] 5f² 7s²` | `[Rn] 6d² 7s²` |
| 91 | Pa | `[Rn] 5f³ 7s²` | `[Rn] 5f² 6d¹ 7s²` |
| 92 | U  | `[Rn] 5f⁴ 7s²` | `[Rn] 5f³ 6d¹ 7s²` |
| 93 | Np | `[Rn] 5f⁵ 7s²` | `[Rn] 5f⁴ 6d¹ 7s²` |
| 96 | Cm | `[Rn] 5f⁸ 7s²` | `[Rn] 5f⁷ 6d¹ 7s²` |

A learner opening the periodic table and clicking La would be shown a wrong
configuration. Total correct exception count is 19, not 10.

Note: Lr (Z=103) is *not* an exception vs PubChem — PubChem gives
`[Rn] 7s² 5f¹⁴ 6d¹`, which matches the Aufbau generator's output.
The stored `electronConfig` for Lr in elements.js (`[Rn] 5f¹⁴ 7s² 7p¹`)
is the more recent experimental value (Jensen, 2015) which PubChem has not
yet adopted; the data file must cite whichever source it actually uses.

**Fix:** add the 9 missing elements to `EXCEPTIONS` after fetching the real
data; update the test to list every exception it finds automatically.

---

## Broken (must fix)

### B1 — `tools/fetch-elements.js` would produce wrong data if run

The script uses `parseInt(col(row, 'GroupBlock'), 10)` for the group number.
PubChem's `GroupBlock` column contains category strings such as "Nonmetal",
"Transition metal", "Lanthanide" — not group numbers. `parseInt("Nonmetal")`
returns `NaN`, coerced to `null`. Every element's `group` would be `null`.

Similarly, `block: col(row, 'GroupBlock')` would store "Transition metal"
instead of "d". The `period` field is absent from the mapping entirely (the
column does not exist in PubChem; it must be derived from the configuration).

**Fix:** rewrite the script to (a) print column names for transparency,
(b) derive `group` from a Z→group lookup table, (c) derive `period` from
the highest principal quantum number in the configuration string, (d) derive
`block` from the GroupBlock category → {s, p, d, f}, (e) convert plain
digit exponents to superscript (PubChem uses "3d5" not "3d⁵"), and
(f) exit with a non-zero error code if the fetch fails.

---

## Rough edges (do not block)

### R1 — OrbitalModel.js comment typo

The normalisaton formula in the JSDoc for `R(r)` reads
`((n+l)!)³` but should be `(n+l)!` (no exponent 3). The code itself is
correct; only the comment is wrong.

### R2 — Quark model test ✅

The quark model (`HadronBuilder`) now has 6 tests in
`tests/physics/quarks.test.js` covering uud→Proton, ud̄→π⁺, udd→Neutron,
us̄→K⁺, and both `canAdd` directions. The earlier gap is closed.

### R3 — NH₄⁺ pKa: 9.246 vs commonly cited 9.25

`TitrationModel` cites NIST for pKa(NH₄⁺) = 9.246. NIST WebBook lists
9.25 (25°C); 9.246 appears in Atkins' Physical Chemistry tables. The
difference (0.004 units) is within the spread of literature values. The
cited NIST reference should be made more specific (NIST SRD 46) so the
value can be verified directly.

### R4 — `classifyMutation` does not detect all nonsense mutations

A substitution that truncates the protein by exactly one amino acid
(`mut.length === orig.length - 1`) is caught by the `mut.length < orig.length`
branch and correctly returns `'nonsense'`. However a substitution that
removes the stop codon and extends the protein (`mut.length > orig.length`)
returns the correct `'missense'` classification (since `mut.length` is now
larger than `orig.length`). No learner-visible error; listed for completeness.

---

## Summary

| ID | Severity | Item | Status |
|----|----------|------|--------|
| W1 | Wrong science | elements.js typed from memory, false citation | **fix** |
| W2 | Wrong science | 9 missing Aufbau exceptions in PeriodicTableModel | **fix** |
| B1 | Broken | fetch-elements.js would produce wrong group/block/period | **fix** |
| R1 | Rough edge | OrbitalModel comment typo `((n+l)!)³` | fix if easy |
| R2 | — | Quarks test now present | ✅ |
| R3 | Rough edge | NH₄⁺ pKa source imprecise | annotate |
| R4 | Rough edge | classifyMutation edge case with extended protein | acceptable |
