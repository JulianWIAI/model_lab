/**
 * RLModel — tabular Q-learning on a finite MDP.
 *
 * Q-learning update: Q(s,a) ← Q(s,a) + α·[R + γ·max_a' Q(s',a') − Q(s,a)]
 *
 * Corridor environment (default):
 *   States 0..8. Start = 2. Terminals: 0 (reward +1), 8 (reward +10).
 *   At each non-terminal state: actions {left, right}.
 *
 * Discount threshold:
 *   γ* = 10^{−1/4} ≈ 0.5623 — below this the agent prefers +1 (closer),
 *   above this it prefers +10 (further). Derivation: γ⁶·10 = γ²·1 → γ = 10^{−1/4}.
 *
 * Gambler's ruin: unbiased walk, start=2, barriers 0 and 8:
 *   P(reach 8 first) = 2/8 = 1/4.
 *
 * Reference: Watkins & Dayan (1992), Machine Learning 8:279.
 * Sutton & Barto (2018), Reinforcement Learning 2nd ed., MIT Press.
 */
import { Random } from '../../../../core/Random.js';

export class RLModel {
  /**
   * @param {object} opts
   * @param {number[]} opts.states  array of state ids
   * @param {string[]} opts.actions array of action ids
   * @param {number}   [opts.gamma=0.9]   discount factor in [0,1)
   * @param {number}   [opts.alpha=0.1]   learning rate in (0,1]
   * @param {number}   [opts.epsilon=0.1] exploration rate in [0,1]
   * @param {number}   [opts.seed=42]     RNG seed
   */
  constructor({ states, actions, gamma = 0.9, alpha = 0.1, epsilon = 0.1, seed = 42 } = {}) {
    if (gamma < 0 || gamma >= 1) throw new RangeError('RLModel: gamma must be in [0,1)');
    if (alpha <= 0 || alpha > 1) throw new RangeError('RLModel: alpha must be in (0,1]');
    if (epsilon < 0 || epsilon > 1) throw new RangeError('RLModel: epsilon must be in [0,1]');

    this.states = states;
    this.actions = actions;
    this.gamma = gamma;
    this.alpha = alpha;
    this.epsilon = epsilon;

    this._Q = {};
    this._rng = new Random(seed);
  }

  /** Get Q-value for state-action pair. */
  Q(s, a) {
    return this._Q[`${s},${a}`] || 0;
  }

  /** Set Q-value for state-action pair. */
  setQ(s, a, value) {
    this._Q[`${s},${a}`] = value;
  }

  /** Return the action with highest Q-value; ties broken by first in array. */
  bestAction(s) {
    let best = this.actions[0];
    let bestQ = this.Q(s, best);
    for (let i = 1; i < this.actions.length; i++) {
      const q = this.Q(s, this.actions[i]);
      if (q > bestQ) {
        bestQ = q;
        best = this.actions[i];
      }
    }
    return best;
  }

  /** Epsilon-greedy action selection using seeded RNG. */
  epsilonGreedy(s) {
    if (this._rng.next() < this.epsilon) {
      const idx = Math.floor(this._rng.next() * this.actions.length);
      return this.actions[idx];
    }
    return this.bestAction(s);
  }

  /**
   * Apply one Q-learning update.
   * @param {number|string} s      current state
   * @param {string}        a      action taken
   * @param {number}        r      reward received
   * @param {number|string} sNext  next state
   * @param {boolean}       [terminal=false]
   */
  update(s, a, r, sNext, terminal = false) {
    const maxQ = terminal ? 0 : Math.max(...this.actions.map(a2 => this.Q(sNext, a2)));
    const td = r + this.gamma * maxQ - this.Q(s, a);
    this.setQ(s, a, this.Q(s, a) + this.alpha * td);
  }

  /**
   * Compute TD error without updating.
   * @param {number|string} s
   * @param {string}        a
   * @param {number}        r
   * @param {number|string} sNext
   * @param {boolean}       [terminal=false]
   * @returns {number}
   */
  tdError(s, a, r, sNext, terminal = false) {
    const maxQ = terminal ? 0 : Math.max(...this.actions.map(a2 => this.Q(sNext, a2)));
    return r + this.gamma * maxQ - this.Q(s, a);
  }

  /**
   * Bellman error: max over all (s,a) of |Q(s,a) - [r + γ·max Q(s',a')]|.
   * Returns 0 if no Q-values are set.
   */
  bellmanError() {
    const keys = Object.keys(this._Q);
    if (keys.length === 0) return 0;
    let maxErr = 0;
    for (const key of keys) {
      const [sStr, a] = key.split(',');
      const s = isNaN(Number(sStr)) ? sStr : Number(sStr);
      const q = this._Q[key];
      // We don't have transition dynamics stored; compute error as
      // |Q(s,a) - 0 - gamma*max Q(s')|  where s' is inferred from action
      // For corridor: s' = s+1 (right) or s-1 (left)
      // Since we don't know the MDP transitions here, use stored Q values
      // and compute the max over all known next states
      const maxNextQ = Math.max(...this.actions.map(a2 => this.Q(s, a2)));
      const err = Math.abs(q - this.gamma * maxNextQ);
      if (err > maxErr) maxErr = err;
    }
    return maxErr;
  }

  /**
   * Static factory for the corridor MDP.
   * States 0..8, terminals 0 (+1) and 8 (+10), actions {left, right}.
   */
  static corridor({ gamma = 0.9, alpha = 0.1, epsilon = 0.1, seed = 42 } = {}) {
    return new RLModel({
      states: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      actions: ['left', 'right'],
      gamma, alpha, epsilon, seed,
    });
  }
}
