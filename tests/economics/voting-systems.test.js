import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VotingModel } from '../../js/benches/economics/social-choice/voting-systems/VotingModel.js';

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

  it("Borda winner ≠ Condorcet loser: 0 counterexamples in 216 profiles (3 alts)", () => {
    // For 3 alternatives, Borda winner cannot be Condorcet loser.
    // Condorcet loser = loses to all others pairwise.
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
          if (bw === null) continue;  // tie, skip
          // Check if Borda winner is a Condorcet loser
          const M = m.pairwiseMatrix();
          const idx = ['A','B','C'].indexOf(bw);
          const half = 3 / 2;  // = 1.5; M[j][idx] > 1.5 means j beats idx by majority
          const isCondorcetLoser = ['A','B','C'].every((_, j) => j === idx || M[j][idx] > half);
          if (isCondorcetLoser) counterexamples++;
        }
      }
    }
    assert.strictEqual(counterexamples, 0);
  });

  it("Borda: B wins 3xABC+2xBCA (B_score=7, A_score=6)", () => {
    // 3 voters: A>B>C, 2 voters: B>C>A
    const m = new VotingModel({
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2],[0,1,2],[0,1,2],[1,2,0],[1,2,0]],
    });
    const scores = m.bordaScores();
    assert.strictEqual(scores['B'], 7);
    assert.strictEqual(scores['A'], 6);
    assert.strictEqual(m.bordaWinner(), 'B');
  });

  it("invalid permutation throws RangeError", () => {
    assert.throws(
      () => new VotingModel({ alternatives: ['A','B','C'], preferences: [[0,0,2]] }),
      RangeError,
    );
  });
});
