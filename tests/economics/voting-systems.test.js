import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VotingModel } from '../../js/benches/economics/social-choice/voting-systems/VotingModel.js';

// Generate all n! permutations of [0, 1, ..., n-1].
function permsOf(n) {
  const result = [];
  (function recurse(cur, rem) {
    if (rem.length === 0) { result.push(cur); return; }
    for (let i = 0; i < rem.length; i++)
      recurse([...cur, rem[i]], rem.filter((_, j) => j !== i));
  })([], Array.from({ length: n }, (_, i) => i));
  return result;
}

// Count profiles (m-voter, n-alternative) where the unique Borda winner is a
// Condorcet loser (loses to every other alternative by strict majority).
// perms must be all n! permutations of [0..n-1].
function countBordaLoserWins(perms, m) {
  const P = perms.length;
  const n = perms[0].length;
  // Strict majority: more than half = > m/2.  Works for any integer m:
  //   odd m (e.g. 3): half=1.5, jBeats>1.5 ↔ jBeats≥2 ✓ (ceil(m/2)+0 = 2)
  //   even m (e.g. 4): half=2, jBeats>2 ↔ jBeats≥3 ✓ (strict majority of 4 = 3)
  const half = m / 2;
  let count = 0;
  const indices = new Array(m).fill(0);
  const total = P ** m;
  for (let t = 0; t < total; t++) {
    // Borda scores
    const borda = new Array(n).fill(0);
    for (let v = 0; v < m; v++) {
      const pref = perms[indices[v]];
      for (let rank = 0; rank < n; rank++) borda[pref[rank]] += (n - 1 - rank);
    }
    // Find unique Borda winner
    const maxB = Math.max(...borda);
    let bwIdx = -1, tie = false;
    for (let i = 0; i < n; i++) {
      if (borda[i] === maxB) {
        if (bwIdx >= 0) { tie = true; break; }
        bwIdx = i;
      }
    }
    if (!tie) {
      // Check if bwIdx is a Condorcet loser: every other alt beats it by strict majority
      let isLoser = true;
      for (let j = 0; j < n && isLoser; j++) {
        if (j === bwIdx) continue;
        let jBeats = 0;
        for (let v = 0; v < m; v++) {
          const pref = perms[indices[v]];
          if (pref.indexOf(j) < pref.indexOf(bwIdx)) jBeats++;
        }
        if (jBeats <= half) isLoser = false;
      }
      if (isLoser) count++;
    }
    // Increment base-P counter
    for (let k = m - 1; k >= 0; k--) {
      if (++indices[k] < P) break;
      indices[k] = 0;
    }
  }
  return count;
}

describe('VotingModel', () => {
  // Classic Condorcet paradox: 3 voters, 3 alternatives
  const paradox = new VotingModel({
    alternatives: ['A', 'B', 'C'],
    preferences: [[0,1,2], [1,2,0], [2,0,1]],
  });

  it("Condorcet cycle: A beats B 2:1", () => {
    const M = paradox.pairwiseMatrix();
    assert.strictEqual(M[0][1], 2);
  });

  it("Condorcet cycle: B beats C 2:1", () => {
    const M = paradox.pairwiseMatrix();
    assert.strictEqual(M[1][2], 2);
  });

  it("Condorcet cycle: C beats A 2:1", () => {
    const M = paradox.pairwiseMatrix();
    assert.strictEqual(M[2][0], 2);
  });

  it("condorcetWinner() = null for cycle", () => {
    assert.strictEqual(paradox.condorcetWinner(), null);
  });

  it("Borda tie A=B=C=3", () => {
    const scores = paradox.bordaScores();
    assert.strictEqual(scores['A'], 3);
    assert.strictEqual(scores['B'], 3);
    assert.strictEqual(scores['C'], 3);
  });

  it("bordaWinner() = null for tie", () => {
    assert.strictEqual(paradox.bordaWinner(), null);
  });

  it("Condorcet winner exists when A beats all", () => {
    // 3 voters all prefer A > B > C
    const clear = new VotingModel({
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2], [0,1,2], [0,2,1]],
    });
    assert.strictEqual(clear.condorcetWinner(), 'A');
  });

  it("pluralityWinner = null for 3-way tie", () => {
    assert.strictEqual(paradox.pluralityWinner(), null);
  });

  it("pairwiseMatrix[i][j] + pairwiseMatrix[j][i] = n_voters", () => {
    const M = paradox.pairwiseMatrix();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i !== j) assert.strictEqual(M[i][j] + M[j][i], 3);
      }
    }
  });

  it("12 cycles in 216 three-voter profiles", () => {
    // Exhaustive check: all 6^3 = 216 ordered triples of permutations of [0,1,2]
    const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
    let cycleCount = 0;
    for (const p1 of perms) {
      for (const p2 of perms) {
        for (const p3 of perms) {
          const m = new VotingModel({
            alternatives: ['A','B','C'],
            preferences: [p1, p2, p3],
          });
          if (m.condorcetCycle()) cycleCount++;
        }
      }
    }
    assert.strictEqual(cycleCount, 12);
  });

  it("Borda winner ≠ Condorcet loser: 0 counterexamples in 216 profiles (3 alts, 3 voters)", () => {
    const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
    let counterexamples = 0;
    for (const p1 of perms) {
      for (const p2 of perms) {
        for (const p3 of perms) {
          const m = new VotingModel({
            alternatives: ['A','B','C'],
            preferences: [p1, p2, p3],
          });
          const bw = m.bordaWinner();
          if (bw === null) continue;
          const M = m.pairwiseMatrix();
          const idx = ['A','B','C'].indexOf(bw);
          const half = 3 / 2;
          const isCondorcetLoser = ['A','B','C'].every((_, j) => j === idx || M[j][idx] > half);
          if (isCondorcetLoser) counterexamples++;
        }
      }
    }
    assert.strictEqual(counterexamples, 0);
  });

  it("Borda winner ≠ Condorcet loser: 0 counterexamples, 3 alts 5 voters (7776 profiles)", () => {
    // Proof: Condorcet loser X has Borda score < n(m-1)/2 (average), so cannot win.
    assert.strictEqual(countBordaLoserWins(permsOf(3), 5), 0);
  });

  it("Borda winner ≠ Condorcet loser: 0 counterexamples, 4 alts 3 voters (13824 profiles)", () => {
    assert.strictEqual(countBordaLoserWins(permsOf(4), 3), 0);
  });

  it("Borda winner ≠ Condorcet loser: 0 counterexamples, 4 alts 4 voters (331776 profiles)", () => {
    assert.strictEqual(countBordaLoserWins(permsOf(4), 4), 0);
  });

  it("3×ABC+2×BCA: Condorcet winner=A, Borda scores A=6 B=7 C=2, Borda winner=B", () => {
    // 3 voters: A>B>C, 2 voters: B>C>A
    // Pairwise: A beats B (3:2), A beats C (3:2) → A is Condorcet winner
    // Borda: A=3×2+2×0=6, B=3×1+2×2=7, C=3×0+2×1=2 → B wins Borda despite A being Condorcet winner
    const m = new VotingModel({
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2],[0,1,2],[0,1,2],[1,2,0],[1,2,0]],
    });
    const scores = m.bordaScores();
    assert.strictEqual(scores['A'], 6);
    assert.strictEqual(scores['B'], 7);
    assert.strictEqual(scores['C'], 2);
    assert.strictEqual(m.bordaWinner(), 'B');
    assert.strictEqual(m.condorcetWinner(), 'A');
  });

  it("3×ABC+2×BCA+2×CBA: plurality=A (Condorcet loser), Condorcet winner=B, Borda=(6,9,6) winner=B", () => {
    // 7 voters: 3×A>B>C, 2×B>C>A, 2×C>B>A
    // Plurality: A has 3 first-place votes (B=2, C=2) → A wins plurality
    // Pairwise: B beats A 4:3, B beats C 5:2 → B is Condorcet winner
    //           C beats A 4:3 → A loses to both B and C → A is Condorcet loser
    // Borda: A=3×2+0+0=6, B=3×1+2×2+2×1=9, C=0+2×1+2×2=6 → B wins Borda
    const m = new VotingModel({
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2],[0,1,2],[0,1,2],[1,2,0],[1,2,0],[2,1,0],[2,1,0]],
    });
    const scores = m.bordaScores();
    assert.strictEqual(scores['A'], 6);
    assert.strictEqual(scores['B'], 9);
    assert.strictEqual(scores['C'], 6);
    assert.strictEqual(m.bordaWinner(), 'B');
    assert.strictEqual(m.condorcetWinner(), 'B');
    assert.strictEqual(m.pluralityWinner(), 'A');
    // Verify A is Condorcet loser: M[B][A]=4>3.5 and M[C][A]=4>3.5
    const M = m.pairwiseMatrix();
    assert.strictEqual(M[1][0], 4);  // B beats A 4:3
    assert.strictEqual(M[2][0], 4);  // C beats A 4:3
  });

  it("invalid permutation throws RangeError", () => {
    assert.throws(
      () => new VotingModel({ alternatives: ['A','B','C'], preferences: [[0,0,2]] }),
      RangeError,
    );
  });
});
