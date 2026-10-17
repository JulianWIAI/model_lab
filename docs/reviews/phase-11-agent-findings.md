# Phase 11 — Independent Agent Review

## Summary
- HIGH: 1
- MED: 3
- LOW: 3

---

## Findings

### HIGH-1: inequality — `topShare` for exponential distribution uses wrong formula

**File:** `js/benches/economics/distribution/inequality/InequalityModel.js`, line 45

```js
return -(1-q)*Math.log(1-q);
```

**What it should be:** `(1-q)*(1 - Math.log(1-q))`

**Derivation:** The income share of the top (1−q) fraction is 1 − L(q), where L is the Lorenz curve. For the exponential distribution, L(q) = q + (1−q)·ln(1−q). Therefore:

```
topShare(q) = 1 − L(q)
            = 1 − q − (1−q)·ln(1−q)
            = (1−q) − (1−q)·ln(1−q)
            = (1−q)·(1 − ln(1−q))
```

The model returns `−(1−q)·ln(1−q)` which is short by exactly `(1−q)`. At q=0.5 the model returns 0.347 instead of the correct 0.847 — a relative error of 59%.

**Why undetected:** The only `topShare` test is for Pareto alpha=2 (`tests/economics/inequality.test.js` line 65), which exercises the `Math.pow(...)` branch. The exponential branch is never tested.

**For comparison:** Pareto and Uniform branches are correct:
- Pareto: `Math.pow(1-q, (alpha-1)/alpha)` = `(1-q)^{(α-1)/α}` = 1 − L(q) ✓
- Uniform: `1 - q*q` = 1 − L(q) ✓

---

### MED-1: ising — MC exact value `0.76471239322120` is unverified

**File:** `tests/physics/ising.test.js`, line 56

```js
const exact = 0.76471239322120;
```

The comment says "from partition function enumeration" but no code or external citation is provided. The value `<|m|>_{L=4, T=2.5}` requires summing over all 2^16 = 65536 configurations of a 4×4 Ising lattice — a perfectly finite computation, but it is not performed in the test or in any auxiliary file. There is no way to verify that 0.76471239322120 is the correct value from inspection alone.

The MC test itself uses a tolerance of 4·SE (standard error of 20 seeds), which is appropriate statistically, but the anchor point it is testing against is unverified.

**Recommendation:** Either add inline partition-function enumeration as a checked-against reference, or cite the exact source from which this value was taken.

---

### MED-2: population-coding — `popvec SD/CRB` test tolerance is too loose

**File:** `tests/neuroscience/population-coding.test.js`, lines 81–84

```js
assert.ok(
  Math.abs(ratio - 1.04) < 4 * se + 0.15,
  ...
);
```

The tolerance is `4·SE + 0.15`. With 1000 trials and `ratio ≈ 1.04`, SE ≈ 0.023, giving a total tolerance of `4·0.023 + 0.15 ≈ 0.24`. This means the test passes as long as `ratio < 1.28`. A factor-of-1.5 bias in the population vector decoder would still pass this test. The extra fixed `+0.15` term is not derived from any statistical bound — it inflates the window arbitrarily.

The 4·SE bound alone (without the fixed term) would be statistically rigorous. The extra 0.15 makes the test nearly vacuous for detecting bias.

---

### MED-3: graph — `graph.test.js` and `graph-theory.test.js` have substantial test duplication

**Files:** `tests/math/graph.test.js`, `tests/math/graph-theory.test.js`

Six of the 6 tests in `graph-theory.test.js` replicate tests already in `graph.test.js`:
- Euler K4 (exact same assertion in both files)
- Euler Q3 (exact same assertion in both files)
- Handshaking K4 (exact same construction and assertion)
- Dijkstra 5-node (same graph topology, same expected distance)

These contribute 79 to the runner test count without increasing mathematical coverage. They inflate the PRESENT audit count without testing additional properties.

---

### LOW-1: graph — DFS return values are never tested

**File:** `js/benches/math/graph-theory/graph-theory/Graph.js` lines 109–119

`dfs(source)` returns a `Map` of (node → discovery time). Neither `graph.test.js` nor `graph-theory.test.js` contains any assertion on the DFS return values. The DFS implementation could be silently wrong — for example, if the discovery times were always 0 — and all tests would still pass. The only implicit test is that DFS does not throw.

**Missing test:** Verify that DFS assigns times 0 through n−1 on a simple path or star graph, and that BFS/DFS component connectivity is consistent.

---

### LOW-2: langmuir — concavity test threshold `< 1e-6` should be `< 0`

**File:** `tests/chemistry/langmuir.test.js`, line 92

```js
assert.ok(d2 < 1e-6, `Concavity at p=${p}: d2f=${d2}, expected < 0`);
```

The comment correctly states "expected < 0", but the assertion allows d2 up to +1e-6. The second derivative of θ(p) = Kp/(1+Kp) is −2K³p/(1+Kp)³ × p, which is always strongly negative (around −6 at K=2.5, p=0.1). The 1e-6 threshold does not actually weaken the test in practice — it never fires — but it is inconsistent with the intent documented in the comment. The correct assertion is `d2 < 0`.

---

### LOW-3: wilson-cowan — `dt-halving` test has vacuous escape clause

**File:** `tests/neuroscience/wilson-cowan.test.js`, lines 160–161

```js
assert.ok(err1 > err2 * 4 || err2 < 1e-12,
  `dt-halving: ...`);
```

The `|| err2 < 1e-12` clause means the test trivially passes if the fine-dt error happens to be below machine precision (which can occur when the trajectory is very smooth or the endpoint lies near a fixed point). This means the test never verifies the RK4 convergence order in that regime. A more robust test would use a trajectory that stays in a region of non-trivial dynamics and check `err1 / err2 > 10` (RK4 fourth-order: factor of (0.02/0.005)^4 = 256, but accounting for step count the ratio should be at least 16).
