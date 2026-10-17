# Phase 10b Review

## Section 0: Baseline and summary

### Baseline

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| phase-10 | c8144e1 | 960 | Phase 10b baseline |
| phase-10b | (HEAD at tag time) | 979 | Phase 10b complete (+19 tests, 9 fixes) |

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

Test audit: see `docs/reviews/phase-10b-test-audit.md` (979 tests, PRESENT=688, WEAK=205, MISSING=72 — MISSING are mostly structural/ordering tests without numeric tolerances).

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
| Voting Predict 2 | "FALSE for 3 alts, possible for ≥4" | "FALSE for all n≥2 (algebraic proof: Condorcet loser Borda score < average)" | `94536f2` |
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
| hopfield | Capacity ~0.138·N | DOI 10.1103/PhysRevA.32.1007 (Amit 1985); DOI 10.1109/TIT.1987.1057328 (McEliece 1987) | **not fetched** — paywalled; value is standard textbook result |
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

## Section 5: Known deferred items (carried from phase-10)

1. **LOW-2** (auction revenue equivalence test name): The GL5 test now correctly names and tests revenue equivalence — resolved.
2. **LOW-3** (gambler's ruin): Thomas algorithm solve now exercises the corridor chain — resolved.
3. **LOW-4** (RLModel key collision): `${s},${a}` can collide for action/state names containing commas. Deferred.
4. **LOW-5** (bidCurve length): `AuctionModel.bidCurve(200)` returns 201 points. Deferred.
5. **Weber-Fechner modality table**: Still flagged as unverified illustrative values. Not touched.
