# Phase 11c Changes

**Date:** 2026-10-17
**Baseline:** phase-11b (3bd0c37) / 1071 tests
**Result:** phase-11c / 1080 tests (+9)

## Changes

1. **WC dt-halving bug diagnosis and fix** (`3554898`): The previous dt-halving test recorded only every 10th step, so the last recorded state was at different physical times for each dt (t=0.42 for dt=0.02 vs t=0.41 for dt=0.01 vs t=0.999 for dt=0.0001 with tMax=1). The computed "error" was a finite-difference of the trajectory, giving ratio ~4 (derivative ratio), not RK4 truncation order ~16. Fix: `run()` now also records the final step (k===n-1). Test switched to Hopf-point preset (wEE=8, tr=0, det=2, ω=√2); T_end=0.5; dt/2 halving from 0.02→0.01; observed ratio 15.79 ∈ [12, 20].

2. **girth() BFS method added to Graph.js** (`b6ce96f`): O(V(V+E)) algorithm using BFS back-edge detection. Returns Infinity for acyclic graphs. Five girth tests: K4=3, K3,3=4, Petersen=5, Q3=4, path P5=∞.

3. **Non-planarity tests via girth bound** (`b6ce96f`): K3,3 E=9 > 2V-4=8 (bipartite girth≥4 Euler bound); Petersen E=15 > 5(V-2)/3≈13.33 (girth≥5 bound); Q3 boundary case E=12 = 2V-4=12 (planar).

4. **BF negative-cycle from undirected edge** (`b6ce96f`): Undirected edge A-B:-1 creates cycle A→B→A with total weight −2; bellmanFord() correctly returns null. Tests undirected negative-edge semantics explicitly.

5. **Saddle instability derivation comment** (`79dd2a9`): Added explicit derivation to the test comment: λ₊≈1.506, ε=0.001, t=0.1, expected ≈ 1.163e-3, assert > 0.5×expected.

6. **MWC Hill c=1 tolerance tightened** (`79dd2a9`): ±1e-3 → ±1e-7. Derivation: hillCoeff() uses central FD with eps≈1e-4; FD truncation O(eps^2)≈2e-9; tolerance 1e-7 is 50× the actual error (~3.3e-9).

7. **WC FP positions tolerance tightened** (`79dd2a9`): ±1e-4 → ±1e-6 with derivation comment: Newton converges to ~1e-12; positions accurate to ~1e-9; 1e-6 = 1000× safety margin.

8. **Audit reconciliation**: The phase-11b R12 audit table overcounted by 4 (population-coding: 11 vs 9 actual, wilson-cowan: 14 vs 13, mwc-allosteric: 11 vs 10). No dynamic test generation in Phase 11 files. The discrepancy was a manual counting error in the review.

9. **Review rewrite** (`docs(phase-11c)`): Removed stale statements from phase-11.md (wrong phase-11b note, wrong "no findings resolved inline", wrong R12 counts). Added phase-11c section, corrected all test counts, added audit reconciliation table, added 11c commit list.
