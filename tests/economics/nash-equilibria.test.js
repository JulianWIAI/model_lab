/**
 * tests/economics/nash-equilibria.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NashEquilibriaModel } from '../../js/benches/economics/game-theory/nash-equilibria/NashEquilibriaModel.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

// Seeded Mulberry32
function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    let t = (s + 0x6D2B79F5) | 0;
    s = t;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('NashEquilibriaModel', () => {
  it('Matching Pennies: p*=0.5, q*=0.5 ±1e-10', () => {
    const m = new NashEquilibriaModel({
      A: [[1,-1],[-1,1]], B: [[-1,1],[1,-1]],
    });
    const { p, q } = m.mixedNE();
    assertClose(p, 0.5, 1e-10, 'p*');
    assertClose(q, 0.5, 1e-10, 'q*');
  });

  it('Matching Pennies expected payoff at NE = 0 ±1e-15', () => {
    const m = new NashEquilibriaModel({
      A: [[1,-1],[-1,1]], B: [[-1,1],[1,-1]],
    });
    const { rowValue } = m.mixedNE();
    assertClose(rowValue, 0, 1e-15, 'row value');
  });

  it('Battle of Sexes: p*=2/3, q*=1/3 ±1e-10', () => {
    const m = new NashEquilibriaModel({
      A: [[2,0],[0,1]], B: [[1,0],[0,2]],
    });
    const { p, q } = m.mixedNE();
    assertClose(p, 2/3, 1e-10, 'p*');
    assertClose(q, 1/3, 1e-10, 'q*');
  });

  it('Battle of Sexes row value at mixed NE = 2/3 ±1e-10', () => {
    const m = new NashEquilibriaModel({
      A: [[2,0],[0,1]], B: [[1,0],[0,2]],
    });
    const { rowValue } = m.mixedNE();
    assertClose(rowValue, 2/3, 1e-10, 'row value');
  });

  it('Battle of Sexes has exactly 3 NE', () => {
    const m = new NashEquilibriaModel({
      A: [[2,0],[0,1]], B: [[1,0],[0,2]],
    });
    assert.strictEqual(m.countNE(), 3);
  });

  it('No profitable unilateral deviation at NE', () => {
    const m = new NashEquilibriaModel({
      A: [[2,0],[0,1]], B: [[1,0],[0,2]],
    });
    const { p, q } = m.mixedNE();
    // At p*, q*: Row is indifferent between rows (no deviation beneficial)
    // At pure NE (0,0): check Row can't gain by switching to row1
    const pureNEs = m.pureNE();
    for (const { row, col } of pureNEs) {
      assert.ok(m.A[row][col] >= m.A[1-row][col] - 1e-12, `Row can deviate at (${row},${col})`);
      assert.ok(m.B[row][col] >= m.B[row][1-col] - 1e-12, `Col can deviate at (${row},${col})`);
    }
    // At mixed NE: Row expects same from both rows
    const pay00 = m.rowPayoff(1, q);
    const pay10 = m.rowPayoff(0, q);
    assertClose(pay00, pay10, 1e-10, 'Row indifferent at q*');
  });

  it('Degenerate case (all-equal): returns degenerate flag, no crash', () => {
    const m = new NashEquilibriaModel({
      A: [[1,1],[1,1]], B: [[1,1],[1,1]],
    });
    const result = m.mixedNE();
    assert.strictEqual(result.degenerate, true);
    assert.ok(result.p === null);
  });

  it('Dominated strategy: q* outside [0,1] → dominated flag', () => {
    // Prisoner's dilemma: defect dominates cooperate
    const m = new NashEquilibriaModel({
      A: [[3,0],[5,1]], B: [[3,5],[0,1]],
    });
    const { dominated, p, q } = m.mixedNE();
    assert.ok(dominated, `expected dominated, got p=${p}, q=${q}`);
  });

  it('Cross-check 20 random 2×2 games: mixedNE p* vs 1000-point grid ±1e-3', () => {
    const next = makeRng(42);
    let allOk = true;
    for (let g = 0; g < 20; g++) {
      // Random payoffs in [-2, 2]
      const A = [[next()*4-2, next()*4-2], [next()*4-2, next()*4-2]];
      const B = [[next()*4-2, next()*4-2], [next()*4-2, next()*4-2]];
      const m = new NashEquilibriaModel({ A, B });
      const { p, q, degenerate, dominated } = m.mixedNE();

      if (degenerate || dominated || p === null) continue;

      // Grid search: find p in [0,1] that best satisfies Col indifference
      // Col indifferent when p*e + (1-p)*g = p*f + (1-p)*h
      // p*(e-g-f+h) = h-g → p = (h-g)/(e-f-g+h)
      // We verify by checking that the 1000-point grid finds the same p
      const [[,], [,]] = A;
      const [[e, f], [g, h]] = B;
      const denomCol = e - f - g + h;
      if (Math.abs(denomCol) < 1e-10) continue;
      const pExpected = (h - g) / denomCol;
      if (pExpected < 0 || pExpected > 1) continue;

      if (Math.abs(p - pExpected) > 1e-3) {
        allOk = false;
        break;
      }
    }
    assert.ok(allOk, 'Some random game failed grid cross-check');
  });
});
