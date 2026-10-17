# Phase 10 Agent Findings

## Review metadata

**Date:** 2026-10-17 (Phase 10 close-out)
**Reviewer:** fresh general-purpose subagent (Claude Sonnet 4.6)
**Brief (exact):**
> Review these files adversarially. Look for bugs, wrong formulas, off-by-one errors,
> vacuous tests, wrong signs, domain errors, and anything that would give misleading
> educational output. Report every finding as HIGH / MED / LOW with: file:line, description,
> proposed fix. Do not hold back — this is an adversarial review.
>
> Files to review:
> - js/benches/physics/electromagnetism/lc-oscillator/LCOscillatorModel.js
> - js/benches/chemistry/electrochemistry/butler-volmer/ButlerVolmerModel.js
> - js/benches/economics/finance/options-pricing/OptionsPricingModel.js
> - js/benches/neuroscience/networks/hopfield/HopfieldModel.js
> - js/benches/psychology/learning/reinforcement-learning/RLModel.js
> - js/benches/economics/game-theory/auctions/AuctionModel.js
> - js/benches/economics/social-choice/voting-systems/VotingModel.js
> (plus corresponding test files)

---

## HIGH findings

| # | Severity | File:line | Description | Disposition |
|---|---|---|---|---|
| H1 | HIGH | LCOscillatorModel.js:116 | Overdamped step-response formula had wrong denominator sign: `(s₂−s₁)` instead of `(s₁−s₂)`. At t=0 this gave V_C(0)=2V₀ instead of 0; the entire response was mirror-reflected around 1. No existing test covered the overdamped `stepResponseVc` path. | **FIXED** — denominator changed to `(s₁−s₂)`; docstring corrected; two new overdamped tests added: `stepResponseVc(0)=0` and RK4 cross-check < 1e-7. |
| H2 | HIGH | RLModel.js:112–130 | `bellmanError()` computed `|Q(s,a) − γ·maxₐ Q(s,a)|` using the **same** state `s` for both sides instead of the next state `s'`, and omitted the reward `r` entirely. At convergence the function returns `Q*(1−γ) ≠ 0`, so it cannot serve as a convergence metric. Not called in any test or bench. | **FIXED** — `bellmanError()` removed; documented in Section 8 of the review. |

---

## MED findings

| # | Severity | File:line | Description | Disposition |
|---|---|---|---|---|
| M1 | MED | OptionsPricingModel.js:17 | `erf` Taylor series had early-exit threshold at `|x|>6`. For `|x| ∈ [5,6)`, catastrophic floating-point cancellation causes `|erf(x)|>1` (physically impossible), violating the no-arbitrage bound `call ≤ S` for high-volatility inputs. | **FIXED** — threshold lowered to `|x|>4` (where `|1−erf(4)| < 3×10⁻⁸`). |
| M2 | MED | RLModel.js:12 | Docstring had wrong exponents: `γ⁶·10 = γ²·1`. Correct derivation: from state 2, Q*(2,'right')=γ⁵·10 and Q*(2,'left')=γ¹·1, giving γ⁴=0.1 → γ*=10^{−1/4}. | **FIXED** — docstring corrected to `γ⁵·10 = γ¹·1 → γ⁴=0.1`. |
| M3 | MED | reinforcement-learning.test.js:46–57 | Three tests used wrong exponents (`γ⁶·10`, `γ²·1`) inherited from the docstring error. The anchor `5.31441` (= 0.9⁶·10) was off by 10% from the correct `5.9049` (= 0.9⁵·10). Preference comparison tests also used wrong exponents. | **FIXED** — anchor changed to `5.9049`; preference tests use `γ⁵` and `γ¹`. |
| M4 | MED | butler-volmer.test.js:73 | Comment said `i/i₀ = 2·sinh(ln10/2)` — the argument was wrong. The correct formula at η=b with α=0.5 gives argument `ln10` (not `ln10/2`). The assertion itself (`2·sinh(ln10) ≈ 9.9`) was correct. | **FIXED** — comment corrected to `i/i₀ = 2·sinh(ln10)`. |

---

## LOW findings

| # | Severity | File:line | Description | Disposition |
|---|---|---|---|---|
| L1 | LOW | reinforcement-learning.test.js:5–10 | Duplicate test `'V*(s0)=1 for 2-state MDP ±1e-12'` had identical body to the following test at ±1e-14 tolerance. Redundant. | **FIXED** — duplicate removed. |
| L2 | LOW | auctions.test.js:31–38 | Test `'revenue equivalence: E[R_1st] = E[R_2nd]'` only re-asserts `E[R]=1/3` (same as preceding test). Does not compare first-price and second-price revenues. | **Deferred** — behaviour correct; only test label misleading. |
| L3 | LOW | reinforcement-learning.test.js:42–44 | `assert.ok(2 / 8 === 0.25)` is pure arithmetic that exercises no model code. | **Deferred** — low priority. |
| L4 | LOW | RLModel.js:49 | Q-value key `${s},${a}` can collide if state or action names contain commas. Integer corridor states are safe; custom MDPs could silently corrupt Q-values. | **Deferred** — no current test hits this; noted for future improvement. |
| L5 | LOW | AuctionModel.js:111 | `bidCurve(nPoints=200)` returns `nPoints+1` points (loop `i=0` to `i<=nPoints`), inconsistent with BV convention of exactly `nPoints` points. | **Deferred** — no caller assumes `length===nPoints`. |
| L6 | LOW | butler-volmer.test.js:63–70 | `log10(i/i₀)` tolerance was `0.01` (1000× looser than justified). | **FIXED** — tightened to `1e-10`. |

---

## Summary

| Severity | Count | Fixed | Deferred |
|---|---|---|---|
| HIGH | 2 | 2 | 0 |
| MED | 4 | 4 | 0 |
| LOW | 6 | 2 (forced by HIGH/MED) | 4 |

After all fixes: 960 tests pass, 0 fail.
