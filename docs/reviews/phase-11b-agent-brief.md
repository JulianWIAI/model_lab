# Phase 11b Independent Agent Review Brief

**Reviewer:** independent agent
**Scope:** Phase 11b diff (commits e050c65 through 3bd0c37) vs phase-11 baseline (191d793)
**Date:** 2026-10-17

## What to check

1. HIGH-1 fix (inequality topShare exponential): does the model return (1-q)*(1-ln(1-q))?
   Check: InequalityModel.js topShare() exponential branch; verify via test.
2. MED-1 fix (Ising enumeration): is the partition function correct?
   Check: BFS enumeration loops over all 2^16 configs with correct E and |m| computation.
3. MED-2 fix (popvec tolerance): is +0.15 removed and SE derived correctly?
4. MED-3 fix (duplicate removal): are exactly 4 tests removed from graph-theory.test.js?
5. LOW-1 (DFS discovery times): are times 0..n-1 and distinct for path/star/disconnected?
6. LOW-2 (concavity d2<0): is the threshold exactly `< 0`?
7. LOW-3 (dt-halving): is there no escape clause and is ratio in [12,20]?
8. WEAK fixes: WC FP positions ±1e-6; saddle growth derivation stated; popvec sigma-scaling tight.

## Rating scale
- HIGH: wrong formula, wrong sign, wrong constant
- MED: tolerance too loose, vacuous test, important edge case missing
- LOW: minor style issue

## Output
Write findings in `docs/reviews/phase-11b-agent-findings.md` with:
- Summary (HIGH/MED/LOW counts)
- Per-finding: file:line, what's wrong, what it should be
- Fresh findings (not just checklist of known issues)
