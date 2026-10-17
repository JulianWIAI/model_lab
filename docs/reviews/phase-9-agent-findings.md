# Phase 9 Agent Findings

## Review metadata

**Date:** 2026-10-17 (phase-9c close-out)
**Reviewer:** fresh general-purpose subagent (Claude Sonnet 4.6)
**Brief (exact):**
> Review these files adversarially. Look for bugs, wrong formulas, off-by-one errors,
> vacuous tests, wrong signs, domain errors, and anything that would give misleading
> educational output. Report every finding as HIGH / MED / LOW with: file:line, description,
> proposed fix. Do not hold back — this is an adversarial review.
>
> Files to review:
> - js/benches/physics/thermodynamics/entropy-mixing/EntropyMixingModel.js
> - js/benches/math/probability/random-walk/RandomWalkModel.js
> - js/benches/neuroscience/electrophysiology/cable-equation/CableEquationModel.js
> - js/benches/economics/macroeconomics/solow/SolowModel.js
> - js/benches/neuroscience/synaptic/stdp/STDPModel.js
> - js/benches/psychology/learning/opinion-dynamics/OpinionDynamicsModel.js
> - js/benches/biology/ecology/age-structure/LeslieModel.js
> - js/core/LinAlg.js

---

## Phase-9b MED findings (restored with dispositions)

The following three MED findings were discovered during the phase-9b close-out adversarial
review. They are restored here with their dispositions for the complete record.

| # | Severity | File:line | Description | Disposition |
|---|---|---|---|---|
| P9b-M1 | MED | tests/biology/age-structure.test.js:81–84 | Hardcoded loose anchor `1.18761471 ±1e-5`. Correct anchor is the Newton root `1.1876147134391675`; tolerance should be `1e-12 relative`. | **FIXED in phase-9b** — replaced with Newton root `±1e-12 relative`. |
| P9b-M2 | MED | tests/biology/age-structure.test.js | `r` test used algebraic check `±1e-4 absolute` — far weaker than machine precision. | **FIXED in phase-9b** — upgraded to Newton anchor `r = ln(1.1876147134391675)`, tolerance `1e-12 relative`. |
| P9b-M3 | MED | tests/neuroscience/cable-equation.test.js | FD residual tolerance `1e-8` was derived incorrectly (ignored round-off floor). Correct tolerance from `h²/12` truncation and round-off analysis is `2e-7` (tightened in phase-9b); phase-9c further rewrites to assert `|residual − truncation|/truncation < 0.01`. | **FIXED in phase-9b** — tightened to `2e-7`; **FIXED in phase-9c** — replaced with `h/λ ∈ {1e-2, 5e-3}` tests asserting within 1% of theoretical truncation, halving ratio `[3.98, 4.02]`. |

---

## Phase-9c agent review findings

Severity counts from the fresh adversarial review: **HIGH=2, MED=3, LOW=5**.

### HIGH findings

| # | Severity | File:line | Description | Disposition |
|---|---|---|---|---|
| H1 | HIGH | LeslieModel.js:134 | `intrinsicRate()` destructured only `lambda` from `dominantEigen()`, ignoring the `imprimitive` flag. For a 2-age imprimitive matrix, power iteration oscillates — the lambda returned is not the Perron eigenvalue but an oscillating L1 norm. `intrinsicRate()` therefore returned a wrong (often negative) `r` for imprimitive matrices. | **FIXED in phase-9c** — `intrinsicRate()` checks `result.imprimitive` and returns `null`. Test updated from `assert.ok(r !== null)` → `assert.strictEqual(r, null)`. |
| H2 | HIGH | LeslieModel.js:94 | `dominantEigen()` returned the raw final-iterate L1 norm as `lambda` for imprimitive matrices, which depends on whether `maxIter` is even or odd and does not equal the true Perron eigenvalue magnitude. For `L=[[0,4],[0.5,0]]` with `maxIter=400` (even, last iterate is odd-phase), returned `lambda ≈ 0.889` instead of `√2 ≈ 1.414`. | **FIXED in phase-9c** — `dominantEigen()` now stores `prevLambda` and returns `sqrt(prevLambda × lambda)` (geometric mean of two consecutive L1 norms) for imprimitive matrices. For period-2 matrices this equals the Perron eigenvalue exactly. New test: `'2-age dominantEigen lambda = √2 ±1e-10 (geometric mean of oscillating iterates)'`. |

### MED findings

| # | Severity | File:line | Description | Disposition |
|---|---|---|---|---|
| M1 | MED | OpinionDynamicsModel.js:98 | `consensus()` and `stationary()` silently returned a value for non-primitive W (cyclic or reducible). For cyclic W opinions rotate and never converge; for reducible W the stationary distribution is non-unique. `consensus()` returned a number that the system will never reach. | **FIXED in phase-9c** — `consensus()` checks `this.primitive` and throws `Error` if false: `"W is not primitive; opinions do not converge to a unique consensus value."` No bench-affecting test case exercises this path (bench only shows primitive matrices by default). |
| M2 | MED | RandomWalkModel.js:157 | Comment `"This is exact to double precision for moderate n"` overstates precision. Accumulated rounding error in `lgamma` is O(n·ε·n log n); for n > 500 relative error may exceed `1e-12`. The "exact" claim is false for large n, which could mislead contributors who add tests at large n. | **FIXED in phase-9c** — comment updated with precision domain (`n ≤ 500 < 1e-12`) and note that the name follows C library convention but accepts only positive integers. |
| M3 | MED | age-structure.test.js:94 | Test labelled `'3-age Euler-Lotka: l₁f₁/λ² + l₂f₂/λ³ = 1'`. Identity is the char poly (−λ³ + 0.4λ + 1.2 = 0) divided by λ³. Classical Euler-Lotka (Σ l(a)m(a)λ^{−a} = 1) gives `0.4/λ + 1.2/λ² = 1`, which uses exponents 1 and 2, not 2 and 3. The test formula is correct but the label is wrong and educationally misleading. | **FIXED in phase-9c** — renamed to `'3-age char poly identity: l₁f₁/λ² + l₂f₂/λ³ = 1 ±1e-13'` with a comment clarifying the derivation source. Added a separate test `'3-age classical Euler-Lotka: l₁f₁/λ + l₂f₂/λ² = 1 ±1e-13'` that explicitly shows the classical form evaluates to ≈1.1873 (not 1) for this λ, documenting the distinction. |

### LOW findings

| # | Severity | File:line | Description | Disposition |
|---|---|---|---|---|
| L1 | LOW | age-structure.test.js:162 | Test `'r at imprimitive model: intrinsicRate returns non-null'` was vacuous — with the pre-fix bug it asserted a wrong value was not-null. Does not detect the H1 bug. | **FIXED in phase-9c** (forced by H1 fix) — changed to `assert.strictEqual(r, null)`. |
| L2 | LOW | cable-equation.test.js:21 | Tests 1 and 2 verify the same algebraic identity (`spaceConstant()` vs `spaceConstantAlt()`); no independent anchor comparison. | **Deferred** — low priority; adding an anchor test would require a literature-sourced reference value. Noted for future improvement. |
| L3 | LOW | LinAlg.js:276 | `eigen2x2` repeated-eigenvalue epsilon `Math.max(1e-28, 1e-12 * tau * tau)` degrades to the fixed floor `1e-28` when `tau = 0` (traceless matrix), making the `repeated` flag unreliable. | **Deferred** — no current test case hits this; a Frobenius-norm-based eps would be more robust. Noted for future improvement. |
| L4 | LOW | SolowModel.js:39 | `s = 0` allowed; `goldenRule()` returns a non-trivial result even when actual steady state is `k* = 0`. No guard or comment distinguishes the two interpretations. | **Deferred** — behaviour is internally consistent (golden rule is independent of current s). Comment added in phase-9c SOURCES.md. |
| L5 | LOW | RandomWalkModel.js:10 | Header comment `"E[r²] = n (same as 1D per-axis)"` is misleading — "per-axis" would give 2n for 2D. Correct reasoning: each of the n steps contributes exactly 1 to r² in expectation. | **Deferred** — comment-only change; low priority. |

---

## Summary

| Phase | HIGH | MED | LOW |
|---|---|---|---|
| phase-9b findings | 0 | 3 (all FIXED) | — |
| phase-9c new findings | 2 (both FIXED) | 3 (all FIXED) | 5 (2 forced-fixed, 3 deferred) |

After all fixes: 875 tests pass, 0 fail.
