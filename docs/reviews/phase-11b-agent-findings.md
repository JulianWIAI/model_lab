# Phase 11b Independent Agent Review Findings

**Reviewer:** inline agent review (phase-11c session)
**Scope:** Phase 11b diff (e050c65 through 3bd0c37) + phase-11c changes
**Date:** 2026-10-17

## Summary
- **HIGH:** 0
- **MED:** 0
- **LOW:** 1 (dt-halving endpoint alignment — pre-existing, now fixed in phase-11c)

---

## Checklist verification

### 1. HIGH-1 fix: topShare exponential

**File:** `js/benches/economics/distribution/inequality/InequalityModel.js` line 52

Formula is `(1-q) * (1 - Math.log(1-q))` which equals `(1-q) - (1-q)·ln(1-q)` = `1 − [q + (1-q)·ln(1-q)]` = `1 − lorenz(q)` ✓

The identity test in `inequality.test.js` checks `topShare(q) === 1 - lorenz(q)` at q ∈ {0.1, 0.5, 0.8, 0.99} for all 3 distributions with tolerance ±1e-10. Verified correct.

**Status: RESOLVED**

---

### 2. MED-1 fix: Ising 2^16 enumeration

**File:** `tests/physics/ising.test.js` lines 55–100

Enumeration loops over all 65536 configurations. For each `cfg` (bit-string):
- 32 bond pairs constructed correctly (right + down, periodic BC for 4×4)
- E = −Σ s_i·s_j, correct (J=1 ferromagnet)
- |m| = |Σ s_i| / N, correct (magnetisation per site)
- Boltzmann weight w = exp(−E/T), correct (kB=1 units)
- Final: num/Z = `<|m|>` canonical

The computed exact value ~0.7647... is used directly as the reference (no hardcoded literal). Self-certified.

**Status: RESOLVED**

---

### 3. MED-2 fix: popvec tolerance +0.15 removed

**File:** `tests/neuroscience/population-coding.test.js` line 85

Current test: `Math.abs(ratio - 1.04) < 4 * se`. The fixed +0.15 term has been removed.
With 1000 trials and ratio ≈ 1.04, SE ≈ 0.023, tolerance ≈ 0.092. This is statistically
rigorous — fails only if |ratio − 1.04| > ~4σ.

**Status: RESOLVED**

---

### 4. MED-3 fix: 4 duplicate tests removed

**File:** `tests/math/graph-theory.test.js`

Now has exactly 2 tests (Euler K4 wrapper and handshaking lemma via GraphTheoryBench). The 4 duplicates of graph.test.js assertions have been removed. Confirmed count = 2.

**Status: RESOLVED**

---

### 5. LOW-1: DFS discovery times

**File:** `tests/math/graph.test.js` lines 123–147

Three tests added:
- Path A→B→C→D: 4 entries, distinct times 0–3, A=0 ✓
- Star center→{A,B,C}: 4 entries ✓
- Disconnected X and Y: dfs(X) returns {X:0} ✓

Verified the assertions are non-vacuous: they would fail if DFS returned incorrect times or visited disconnected nodes.

**Status: RESOLVED**

---

### 6. LOW-2: Langmuir concavity threshold

**File:** `tests/chemistry/langmuir.test.js` line 92

Changed to `d2 < 0` (exact zero threshold). The comment "expected < 0" matches the assertion. ✓

**Status: RESOLVED**

---

### 7. LOW-3: dt-halving (pre-existing issue, fixed in phase-11c)

**Phase-11b state:** The escape clause `|| err2 < 1e-12` was removed (d6ecbd9) and test used
wEE=8.5 limit-cycle preset with dt ratio 4× (0.02 vs 0.005). The comment said "ratio ~3-4
reflects non-linear phase effects." However, the actual ratio was only ~3-4 because the three
runs (dt=0.02, dt=0.005, dt=0.0001) ended at DIFFERENT physical times — the `% 10` recording
filter caused the last recorded state to be at t=0.42, t=0.41, t=0.999 respectively. The
"error" was a trajectory finite-difference, not a truncation error.

**Phase-11c fix:** `run()` now records the final step unconditionally (k===n-1). Switched to
Hopf-point preset (wEE=8, tr=0, det=2). With T_end=0.5, dt1=0.02→dt2=0.01 (2× halving):
all three runs now end at exactly t=0.5. Observed ratio = 15.79 ∈ [12, 20]. ✓

**Status: RESOLVED in phase-11c**

---

### 8. WEAK fixes

**WC FP positions:** Changed from ±1e-4 to ±1e-6 with derivation comment (Newton converges
to ~1e-12; positions accurate ~1e-9; 1e-6 = 1000× safety margin). ✓

**Saddle instability:** Added explicit derivation comment: λ₊≈1.506, ε=0.001, t=0.1,
expected ≈ 1.163e-3, assert > 0.5×expected. ✓

**Popvec sigma-scaling:** Test checks ratio = 2.043982952864164 ± 1e-9 (tight). ✓

**MWC Hill c=1:** Changed from ±1e-3 to ±1e-7 with derivation (FD eps≈1e-4, truncation
~2e-9, safety margin 50×). ✓

---

## Fresh findings (not in prior checklist)

### FINDING-1 (LOW): `run()` `% 10` recording is a silent trap for convergence tests

**File:** `js/benches/neuroscience/networks/wilson-cowan/WilsonCowanModel.js` line 91

The recording filter `if (k % 10 === 0 || k === n - 1)` was added in phase-11c as a bugfix.
However, the `% 10` filter still means that the trajectory contains sparse intermediate
samples (every 10th step). Any future test that accesses `traj[i]` for 0 < i < last must
account for the sparse sampling. The final state is always present, but intermediate states
are not.

This is documented by the bugfix; no code change needed. Severity: LOW (informational).

### FINDING-2 (LOW): `girth()` method does not support directed graphs

**File:** `js/benches/math/graph-theory/graph-theory/Graph.js` — new `girth()` method

The method uses BFS back-edge detection, which correctly finds shortest cycles only in
undirected graphs. For directed graphs, cycle detection requires DFS with color-coding (white/
gray/black). The method's JSDoc says "Assumes undirected graph" but the Graph class supports
both directed and undirected (via `{ directed: true }`). Calling `girth()` on a directed graph
could produce incorrect results.

Recommended: add a guard `if (this._directed) throw new Error('girth() only supports undirected graphs')` or document the limitation clearly. Current tests all use undirected graphs, so no test fails.

Severity: LOW.

---

## Overall verdict

All phase-11b checklist items are resolved. Two fresh LOW findings noted (both informational).
No HIGH or MED findings remain at phase-11c.
