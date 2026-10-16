# Phase 9 Independent Agent Review Findings

**Date:** 2026-10-16
**Reviewer:** Independent subagent (Claude Sonnet 4.6)
**Scope:** All 8 Phase 9 test files + 7 bench model files + js/core/LinAlg.js isPrimitive

---

## Summary

| Severity | Count | Status |
|---|---|---|
| HIGH | 0 | — |
| MED | 3 | All fixed (see below) |
| LOW | 6 | Documented; non-blocking |

---

## Findings

### MED — Fixed

**MED | tests/biology/age-structure.test.js | line 81–84 | Hardcoded loose anchor `1.18761471 ±1e-5`**

The test used `1.18761471` as a hardcoded approximation with a tolerance of `1e-5` (relative), which is ~5× the actual power-iteration error. The correct anchor is the Newton root of λ³−0.4λ−1.2=0, which in double precision is `1.1876147134391675` (residual = 0). The test should assert to `1e-12` relative.

**Fix:** Replaced hardcoded `1.18761471 ±1e-5` with Newton root `1.1876147134391675 ±1e-12 relative`.
Newton iteration: start x=1.2, iterate x ← x − p(x)/p'(x) where p(x)=x³−0.4x−1.2; converges in 4 iterations (residual = 0 at double precision boundary). Model lambda matches to ~4.4e-16 (1 ULP).

---

**MED | tests/biology/age-structure.test.js | line 105–113 | `r ≈ 0.17195 ±1e-4` loose anchor with redundant "order of magnitude" check**

Two issues:
1. The test had an "order of magnitude" absolute check `|r − 0.17195| < 1e-4` which is far looser than needed and gives false assurance.
2. The description said "≈0.17195 ±1e-4" but the correct value is `ln(1.1876147134391675) = 0.17194685305198154`.

**Fix:** Replaced with `r = ln(Newton_root) ±1e-12 relative`. Deleted the loose `|r − 0.17195| < 1e-4` check. The algebraic check `|r − ln(λ)| < 1e-15` is preserved.

---

**MED | tests/neuroscience/cable-equation.test.js | line 121–134 | FD residual tolerance `5e-7` without derivation**

The tolerance `5e-7` was noted as "loosened without derivation" in the R8 flags. The actual derivation:
- V(x) = V₀·e^{−x/λ}; central difference Vpp = (Vm−2V+Vp)/h²
- Truncation error: λ²·Vpp − V = h²·V/(12λ²) (leading term from Taylor expansion)
- At h = λ/10000: truncation ≈ V·(1e−4)²/12 ≈ 8.3e−10·V
- Round-off bound (naive): 4·ε·V·(λ/h)² ≈ 5.4e−8·V; actual measured: ~6.8e−10·V
- Derived tolerance: 2e−7·V(0.5λ) (3.7× naive bound)

**Fix:** Updated tolerance to `2e-7` (tighter than old `5e-7`) with derivation comment. Added halving-ratio test asserting ratio ∈ [3, 5] at dx=λ/50 vs dx=λ/100 (truncation regime, ratio ≈ 4).

---

### LOW — Documented, not fixed

**LOW | js/core/LinAlg.js | isPrimitive | maxPow = (n-1)²+1 — correct Wielandt bound**

Verified: for n=3, (n-1)²+1 = 5 (correct; L^5 is first all-positive power for the test Leslie matrix). For n=4, bound = 10. The bound is tight and correct per Wielandt (1950). No fix needed.

---

**LOW | js/benches/neuroscience/synaptic/stdp/STDPModel.js | kernel | Δt sign convention documented**

Convention `Δt = t_post − t_pre` matches Song et al. (2000) exactly:
- `kernel(dt > 0)` → LTP (pre before post) → `+A₊·exp(−dt/τ₊)` ✓
- `kernel(dt < 0)` → LTD (post before pre) → `−A₋·exp(dt/τ₋)` ✓
  Note: `dt < 0`, so `exp(dt/τ)` correctly decays as |dt| increases. ✓

No bug found. Documented as confirmed correct.

---

**LOW | tests/biology/age-structure.test.js | line 115–120 | eigenvector residual tolerance `1e-8` — could be tighter**

`maxRes < 1e-8` is correct but could be `1e-12` since power iteration at 400 iterations converges well. At current state the test passes and the tolerance is safe (not wrong). No change required; leave as low priority note.

---

**LOW | docs/reviews/phase-9.md | Section 4 Smoke | "70 benches × 4 viewports = 280 pages"**

The smoke run actually tests light/1280 + dark/400 only (2 viewports, not 4). The "280 pages" statement is incorrect. The smoke tests 70 × 2 = 140 pages. The per-bench table only shows light/1280 and dark/400. (See Section 7 fix in phase-9b review update.)

---

**LOW | tests/core/isprimitive.test.js | Wielandt bound test comment**

Comment says "Wielandt bound for n=5: (5-1)²+1=17, but W²suffices." This is correct; W² for the doubly-stochastic ring is all-positive. The isPrimitive function would find it at p=2, well within the bound of 17. No code issue.

---

**LOW | js/benches/psychology/learning/opinion-dynamics/OpinionDynamicsModel.js | stationary() convergence**

The loop uses `diff < 1e-14` break condition with `maxIter=1000`. For very slowly-mixing chains (e.g., near-cyclic), 1000 iterations may not reach 1e-14. This is acceptable for current test cases but could fail for adversarial inputs. No current test exercises this edge. Noted as future improvement.

---

## CSS Token Audit

Checked all Phase 9 view files for invalid token names (--fg, --ok, --warn, --err, --accent2):

| File | Result |
|---|---|
| EntropyMixingView.js | PASS — no invalid tokens found |
| RandomWalkView.js | PASS — no invalid tokens found |
| CableEquationView.js | PASS — no invalid tokens found |
| SolowView.js | PASS — no invalid tokens found |
| STDPView.js | PASS — no invalid tokens found |
| OpinionDynamicsView.js | PASS — no invalid tokens found |
| AgeStructureView.js | PASS — no invalid tokens found |

---

## Readout '--' (undefined) Audit

Checked all bench files for readouts that could show '--' or undefined:

| File | Result |
|---|---|
| AgeStructureBench.js | PASS — `r !== null ? r.toFixed(5) : 'N/A'` guard present |
| CableEquationBench.js | PASS — all values always defined |
| STDPBench.js | PASS — kernel values are numeric |
| SolowBench.js | PASS — steadyState() always returns defined values (RangeError guards prevent degenerate inputs) |
| OpinionDynamicsBench.js | PASS — consensus() always returns a number |
| EntropyMixingBench.js | PASS — deltaS() always ≥ 0 |
| RandomWalkBench.js | PASS — sim always returns non-empty array |

---

## Formula Correctness Audit

| Model | Formula checked | Result |
|---|---|---|
| EntropyMixingModel | ΔS = −R·Σxᵢlnxᵢ; R = N_A·k_B | CORRECT (CODATA 2018 exact) |
| RandomWalkModel | MSD = n; E[\|X_n\|] via exact BigInt | CORRECT |
| CableEquationModel | λ = (1/2)√(d·Rm/Ra); R_in = (2/π)√(Rm·Ra)·d^{-3/2} | CORRECT |
| SolowModel | k* = (sA/(n+δ+g))^{1/(1-α)}; s_GR = α | CORRECT |
| STDPModel | kernel: +A₊e^{-dt/τ₊} for dt>0; −A₋e^{dt/τ₋} for dt<0 | CORRECT |
| OpinionDynamicsModel | x(t+1) = W·x(t); π via power iter on Wᵀ | CORRECT |
| LeslieModel | n(t+1) = L·n(t); λ via power iter; r = ln(λ) | CORRECT |
| LinAlg.isPrimitive | Wielandt bound (n-1)²+1; iterative matMul check | CORRECT |

---

## Conclusion

No HIGH severity issues found. Three MED issues were identified and fixed (two in age-structure test, one in cable-equation test). All fixes are test-only (no model code changed). After fixes, `npm test` passes with 872 tests (was 871; +1 FD halving ratio test).
