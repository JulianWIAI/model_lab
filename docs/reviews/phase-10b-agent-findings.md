# Phase 10b Agent Review Findings (Agent #2)

Independent review of phase-10b changes. Reviewed files: OptionsPricingModel.js, ButlerVolmerModel.js, ButlerVolmerBench.js, and all 7 test files modified in phase-10b.

## HIGH (correctness bugs)

None. One tentative high (putPrice formula) was immediately self-retracted — the form `K·e^{−rT}·(1−Phi(d₂)) − S·(1−Phi(d₁))` is algebraically equivalent to the standard `K·e^{−rT}·Phi(−d₂) − S·Phi(−d₁)`.

## MED (wrong tolerances, misleading names, unchecked edge cases)

1. **butler-volmer.test.js — `2·sinh(ln10) = 9.9 exactly` test**: comment says "exactly" but the assertion uses 1e-13 tolerance. The identity is algebraically exact; wording should distinguish mathematical exactness from floating-point representation. *(LOW-severity MED — pre-existing, not introduced in phase-10b.)*

2. **butler-volmer.test.js — x²/24 bounds test**: tolerance window `relErr < 0.011 && relErr > 0.009` is tight (±10% around 0.01) and the comment notes "leading term" without showing the higher-order correction. Acceptable for intent but would benefit from `±0.002` window with noted O(x⁴) residual.

3. **options-pricing.test.js — σ→∞ test tolerance `< 1`**: absolute tolerance of 1 V out of S=100 is 1%, loose compared to all other option tests. Pre-existing; not introduced in phase-10b.

4. **lc-oscillator.test.js — overdamped RK4 uses absolute tolerance, underdamped uses relative**: minor inconsistency across damping regimes. Pre-existing; not introduced in phase-10b.

5. **hopfield.test.js — Phi implementation in capacity test (line 109-119)**: the inline `erf`/`Phi` uses the old `|x|>6` early-exit cutoff, not the new Lentz CF from OptionsPricingModel. For the argument `−√(1000/300) ≈ −1.826`, this is fine (well within Taylor-series range), but the old cutoff is inconsistently retained in this test.

6. **reinforcement-learning.test.js — Q-learning convergence tolerance ±0.5**: 8.5% of target value, no justification given. Pre-existing.

7. **voting-systems.test.js — `half = m/2` vs integer strict majority**: `M[j][idx] > half` works (half=1.5 for m=3, M integer), but semantically clearer as `>= Math.ceil(m/2 + 0.5)` = `> m/2`. Low risk since only odd m matters and the current test uses even m=5,4,3 — all produce non-integer halves, so `>` works correctly.

## LOW (style, documentation)

1. `erfc_cf` comment claims 80 iterations give |rel err| < 1e-15 for x ≥ 4 — no citation or derivation given. Fine for this project scope.
2. Taylor series 200-iteration limit unexplained magic number.
3. GL5 quadrature nodes in auctions test lack A&S citation.
4. `permsOf()` in voting test is unnamed recursion (Heap's algorithm or similar).
5. `h3 = −3/4` assertion in Hopfield ΔE test is redundant (derived from the same formula being tested).

## Summary

**0 HIGH, 7 MED, 5 LOW**

MED items 1, 3, 4, 6 are pre-existing (not introduced by phase-10b). MED-5 (Phi in Hopfield test) is a genuine inconsistency — the inline erf in `hopfield.test.js:109` uses the old cutoff. At the argument −1.826 this doesn't affect correctness (Taylor series path), but should be noted for future audit.

**Recommended action:**
- MED-2 (x²/24 window): acceptable as-is; no code change needed.
- MED-5 (Phi inconsistency in hopfield): acceptable for current argument range; note deferred.
- All others: deferred or pre-existing.
