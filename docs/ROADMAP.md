# Roadmap

## Open science-accuracy items

### Verify pKa sources for phosphoric and citric acid

`BufferModel.js` cites Martell & Smith *Critical Stability Constants* (Vol. 3 and 4)
for the phosphoric and citric acid pKa values.  The table numbers have **not** been
verified against physical copies; the values are confirmed consistent with Skoog et al.
2014 and Wikipedia (I→0 extrapolations), but an independent primary-source check is
still outstanding.

- Phosphoric acid: 2.148, 7.198, 12.375 (pKa3 uncertain: 12.35–12.40 across sources)
- Citric acid: 3.128, 4.761, 6.396

Primary source to check: Martell & Smith, *Critical Stability Constants*,
Vol. 3 (1977) pp. ? and Vol. 4 (1976) pp. ?.  NIST SRD 46 (the standard online check)
was discontinued.  Goldberg et al. (2002) *J. Phys. Chem. Ref. Data* 31, 231–370
(doi:10.1063/1.1416902) covers both compounds but is paywalled.

**Action:** Check physical copies of Martell & Smith, or access Goldberg 2002 via a
library, and update the `pKas` array and source comments if the values differ.
Remove the `note` field from those two presets and drop the `⚠ unverified` UI note
once verified.
