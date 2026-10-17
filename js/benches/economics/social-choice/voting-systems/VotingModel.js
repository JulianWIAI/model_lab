/**
 * VotingModel — plurality, Borda, and Condorcet voting rules.
 *
 * Preferences: number[][] — preferences[i] is voter i's ranking of alternative
 * indices (most preferred first). e.g. [0,1,2] means alt 0 > alt 1 > alt 2.
 *
 * The model illustrates Arrow's impossibility theorem by showing which
 * properties (unanimity, IIA, non-dictatorship) each rule violates.
 */

export class VotingModel {
  /**
   * @param {{ alternatives: string[], preferences: number[][] }} opts
   * @throws {RangeError} if alternatives < 2 or if any preference is not a valid permutation
   */
  constructor({ alternatives, preferences }) {
    if (!Array.isArray(alternatives) || alternatives.length < 2)
      throw new RangeError('VotingModel: must have at least 2 alternatives');
    const n = alternatives.length;
    for (let i = 0; i < preferences.length; i++) {
      const pref = preferences[i];
      if (pref.length !== n) throw new RangeError('VotingModel: preference must be a permutation');
      const seen = new Set(pref);
      if (seen.size !== n || [...seen].some(x => x < 0 || x >= n))
        throw new RangeError('VotingModel: preference must be a permutation');
    }
    this.alternatives = alternatives;
    this.preferences = preferences;
    this.n = n;  // number of alternatives
    this.m = preferences.length;  // number of voters
  }

  /**
   * Plurality winner: alternative with most first-place votes.
   * Returns null if tie.
   * @returns {string|null}
   */
  pluralityWinner() {
    const counts = new Array(this.n).fill(0);
    for (const pref of this.preferences) counts[pref[0]]++;
    const max = Math.max(...counts);
    const winners = counts.reduce((acc, c, i) => (c === max ? [...acc, i] : acc), []);
    return winners.length === 1 ? this.alternatives[winners[0]] : null;
  }

  /**
   * Borda scores: each voter awards n-1 points to rank 1, n-2 to rank 2, ..., 0 to last.
   * @returns {Object} {alt_name: score}
   */
  bordaScores() {
    const scores = new Array(this.n).fill(0);
    for (const pref of this.preferences) {
      for (let rank = 0; rank < this.n; rank++) {
        scores[pref[rank]] += (this.n - 1 - rank);
      }
    }
    const result = {};
    for (let i = 0; i < this.n; i++) result[this.alternatives[i]] = scores[i];
    return result;
  }

  /**
   * Borda winner: alternative with highest Borda score.
   * Returns null if tie.
   * @returns {string|null}
   */
  bordaWinner() {
    const scores = this.bordaScores();
    const vals = Object.values(scores);
    const max = Math.max(...vals);
    const winners = this.alternatives.filter(a => scores[a] === max);
    return winners.length === 1 ? winners[0] : null;
  }

  /**
   * Pairwise comparison matrix: M[i][j] = number of voters preferring alt i over alt j.
   * @returns {number[][]}
   */
  pairwiseMatrix() {
    const M = Array.from({length: this.n}, () => new Array(this.n).fill(0));
    for (const pref of this.preferences) {
      for (let a = 0; a < this.n; a++) {
        for (let b = a + 1; b < this.n; b++) {
          const posA = pref.indexOf(a);
          const posB = pref.indexOf(b);
          if (posA < posB) M[a][b]++;
          else M[b][a]++;
        }
      }
    }
    return M;
  }

  /**
   * Condorcet winner: alternative that beats every other in pairwise majority.
   * Returns null if none exists.
   * @returns {string|null}
   */
  condorcetWinner() {
    const M = this.pairwiseMatrix();
    const half = this.m / 2;
    for (let i = 0; i < this.n; i++) {
      let wins = true;
      for (let j = 0; j < this.n; j++) {
        if (i !== j && M[i][j] <= half) { wins = false; break; }
      }
      if (wins) return this.alternatives[i];
    }
    return null;
  }

  /**
   * Check if a Condorcet cycle exists (A > B > ... > A in pairwise majority).
   * Uses DFS to detect a cycle in the strict majority tournament.
   * @returns {boolean}
   */
  condorcetCycle() {
    // Build strict majority tournament adjacency list
    const M = this.pairwiseMatrix();
    const half = this.m / 2;
    const adj = Array.from({length: this.n}, () => []);
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (i !== j && M[i][j] > half) adj[i].push(j);
      }
    }
    // DFS cycle detection
    const WHITE = 0, GREY = 1, BLACK = 2;
    const color = new Array(this.n).fill(WHITE);
    const dfs = (u) => {
      color[u] = GREY;
      for (const v of adj[u]) {
        if (color[v] === GREY) return true;
        if (color[v] === WHITE && dfs(v)) return true;
      }
      color[u] = BLACK;
      return false;
    };
    for (let i = 0; i < this.n; i++) {
      if (color[i] === WHITE && dfs(i)) return true;
    }
    return false;
  }
}
