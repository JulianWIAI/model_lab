# Phase 10b Review

## Section 0: Baseline and summary

### Baseline

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| phase-10 | c8144e1 | 960 | Phase 10b baseline |
| phase-10b | a4194b1 | 979 | Phase 10b complete (+19 tests, 9 fixes) |

### Tests added this phase

| Fix / module | Tests added | Cumulative |
|---|---|---|
| voting-systems (Borda impossibility exhaustive + profiles) | +4 | 964 |
| auctions (GL5 revenue equivalence replaces vacuous) | ±0 (replaced) | 964 |
| reinforcement-learning (Thomas algorithm replaces vacuous) | ±0 (replaced) | 964 |
| options-pricing (Phi tail anchors ×5; erf/Lentz CF) | +5 | 969 |
| lc-oscillator (critical, I(0)=0, gain, half-power) | +6 | 975 |
| butler-volmer (RangeError; x²/24 threshold) | +2 | 977 |
| hopfield (exact ΔE; E=(1−N·m²)/2) | +2 | 979 |
| **Total new** | **+19** | **979** |

Note: 2 vacuous tests (auctions revenue-equivalence; RL gambler's-ruin) were replaced in-place — count shows 0 net change for those items.

Test audit: see `docs/reviews/phase-10b-test-audit.md` (PRESENT=688, WEAK=205, MISSING=72; audit total=965).

Audit-vs-runner discrepancy (14 tests): `gen-test-audit-phase10b.mjs` finds tests by regex-matching `test(` and `it(` at the start of a source line. `tests/no-hardcoded-colours.test.js` generates `it()` calls dynamically inside a `for` loop (2 template-string patterns × 8 view files at runtime = 16 runner tests; regex extracts only the 2 static patterns). The 14 extra runner tests are all from this one file. PRESENT+WEAK+MISSING+14(dynamic) = 979 ✓.

---

## Section 1: Items fixed

| # | Description | Commit | Tests affected |
|---|---|---|---|
| 1 | Voting: Predict 2 FALSE for all n≥2; algebraic proof + exhaustive 331776-profile check | `94536f2` | +4 |
| 2 | Auctions/RL: replace two vacuous tests with GL5 quadrature and Thomas algorithm | `cae8f4d` | ±0 (in-place) |
| 3 | Options/erf: Lentz backward-recurrence CF for x>4; Phi cancellation fix; 5 mpmath anchors | `1dbbf30` | +5 |
| 4 | LC oscillator: critical V_C(1/α)=1−2/e; I(0)=0 all regimes; peak gain ω₀²/(2αωd); half-power bisection | `5b406e9` | +6 |
| 5 | BV: bound |η|/V_T ≤ 700 (RangeError); Predict 3 updated with x²/24 = 0.01 threshold | `ab4a108`, `f8c4815` | +2 |
| 6 | Options: review Section 6 row corrected from "intrinsic value" to max(S−Ke^{−rT},0)=4.877 | `6dc1997` | 0 |
| 7 | Hopfield: exact ΔE=−(|h_i|−s_old·h_i) test; explicit E=(1−N·m²)/2 identity test | `a2cefaf`, `41d0c77` | +2 |
| 8 | Report, audit (gen-test-audit-phase10b.mjs), SOURCES fetch verification for CODATA constants | this commit | 0 |
| 9 | Independent agent review #2 | next commit | — |

---

## Section 2: R8 flags corrected this phase

| Flag | Old value | Corrected value | Commit |
|---|---|---|---|
| Voting Predict 2 | "FALSE for 3 alts, possible for ≥4" | "FALSE for all n≥2 voters and any number of alternatives m≥2 (algebraic proof: Condorcet loser Borda score < average n(m−1)/2)" | `94536f2` |
| Auctions revenue equivalence test | Repeated E[R]=1/3 assertion (vacuous) | GL5 quadrature ∫₀¹ b*(v)N·v^{N-1}dv = (N-1)/(N+1) for N=2,3,8 ±1e-12 | `cae8f4d` |
| RL gambler's ruin test | `assert.ok(2/8 === 0.25)` (no model code) | Thomas algorithm direct solve of 7×7 tridiagonal system ±1e-12 | `cae8f4d` |
| Options Phi(z) for z ≤ −5.66 | (1+erf(z/√2))/2 — ~8 digits lost to cancellation | erfc_cf(−z/√2)/2 for t = z/√2 ≤ −4; 5 mpmath anchors ±1e-12 rel | `1dbbf30` |
| BV clamping (R4) | Silent ±700 clamp — wrong values, no error | RangeError when |η|/V_T > 700 | `f8c4815` |
| BV Predict 3 | No quantitative reason | x²/24 = 0.01 at x = √0.24 ≈ 0.49 → η ≈ 12.6 mV | `f8c4815` |
| Options Section 6 | "C→intrinsic value" | "C→max(S−Ke^{−rT},0)=4.877; no NaN" | `6dc1997` |
| Hopfield energy sign (R8 row) | Garbled: "E=(1/2)ΣΣ…" confused E and ΔE | Clarified: E=−½ΣΣw_{ij}s_is_j = (1−N·m²)/2; ΔE formula tested explicitly | `a2cefaf`, `41d0c77` |

---

## Section 3: SOURCES fetch attempts

| Bench | Constant | Fetch attempt | Result |
|---|---|---|---|
| butler-volmer | F = 96485.33212 C/mol | physics.nist.gov/cuu/Constants/Table/allascii.txt (2026-10-17) | **verified** — CODATA 2022: 96485.33212(exact) ✓ |
| butler-volmer | R = 8.31446261815324 J/(mol·K) | physics.nist.gov/cuu/Constants/Table/allascii.txt (2026-10-17) | **verified** — CODATA 2022: 8.314462618(exact); full 2019 SI value used ✓ |
| hopfield | Capacity ~0.138·N | DOI 10.1103/PhysRevA.32.1007 (Amit, Gutfreund & Sompolinsky, PRL 55:1530, 1985) | **not fetched** — paywalled; ~0.138·N is the finite-temperature capacity from Amit 1985. McEliece et al. (IEEE Trans. IT 33:461, 1987) gives an asymptotic capacity N/(4 ln N) — a different (zero-error) notion that is smaller for realistic N. |
| all others (phase-10b) | All formulas | — | algebraic — no empirical constants to fetch |

---

## Section 4: Commit list

| Commit | Message | Tests |
|---|---|---|
| `94536f2` | fix(phase-10b/1): Voting Predict 2 FALSE for all n≥2 | +4 |
| `cae8f4d` | fix(phase-10b/2): replace two vacuous tests with mathematical derivations | ±0 |
| `1dbbf30` | fix(options-pricing): overhaul erf/Phi — Lentz CF for tails, fix cancellation | +5 |
| `5b406e9` | test(lc-oscillator): add critical/IC/frequency-response/half-power tests | +6 |
| `ab4a108` | fix(butler-volmer): replace silent ±700 clamp with RangeError | +1 |
| `6dc1997` | fix(options-pricing): correct σ→0 language in phase-10 review | 0 |
| `a2cefaf` | fix(hopfield): add exact ΔE test, clarify R8 row, document capacity source | +1 |
| `f8c4815` | fix(butler-volmer): bound |η|/V_T ≤ 700; add Predict 3 x²/24 reason | +1 |
| `41d0c77` | test(hopfield): add explicit E=(1−N·m²)/2 test for single stored pattern | +1 |
| (this) | docs(phase-10b): review, audit, SOURCES fetch verification | 0 |

---

## Section 9: Independent agent review #2

Full findings: `docs/reviews/phase-10b-agent-findings.md`.

Summary:
- **HIGH:** 0 (one tentative — putPrice — immediately self-retracted)
- **MED:** 7 (4 pre-existing; 3 phase-10b-adjacent)
- **LOW:** 5

All 7 MED items resolved in phase-10c (commit 0b68143):
- MED-1 (BV sinh wording): comment clarified — mathematical identity vs IEEE 754.
- MED-2 (BV x²/24 window): O(x⁴) residual (≈3×10⁻⁵) documented; exact value 0.010030 within [0.009, 0.011].
- MED-3 (Options σ→∞ tolerance): tightened `< 1` → `< 1e-10`; Φ(d₂=−500) = 0 exactly in IEEE 754.
- MED-4 (LC overdamped abs): justified in comment; |V_C|≈0.9933, so abs ≈ rel to < 1%.
- MED-5 (Hopfield inline erf cutoff): updated `|x|>6` → `|x|>4` to match OptionsPricingModel.js.
- MED-6 (RL Q-learning ±0.5): justification added (Watkins & Dayan 1992; 3σ bound ≈ 0.3 for 10 000 episodes).
- MED-7 (Voting half = m/2): comment proves `> m/2` is correct strict majority for all integer m.
All 5 LOW items remain deferred.

---

## Section 5: Known deferred items (carried from phase-10)

1. **LOW-2** (auction revenue equivalence test name): The GL5 test now correctly names and tests revenue equivalence — resolved.
2. **LOW-3** (gambler's ruin): Thomas algorithm solve now exercises the corridor chain — resolved.
3. **LOW-4** (RLModel key collision): `${s},${a}` can collide for action/state names containing commas. Deferred.
4. **LOW-5** (bidCurve length): `AuctionModel.bidCurve(200)` returns 201 points. Deferred.
5. **Weber-Fechner modality table**: Still flagged as unverified illustrative values. Not touched.
