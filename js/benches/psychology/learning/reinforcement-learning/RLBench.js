/**
 * RLBench — Q-learning on the corridor MDP.
 */
import { Bench } from '../../../../core/Bench.js';
import { RLModel } from './RLModel.js';
import { RLView } from './RLView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ActionButton } from '../../../../ui/ActionButton.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

const GAMMA_STAR = Math.pow(10, -0.25); // ≈ 0.5623

export class RLBench extends Bench {
  static meta = {
    id: 'reinforcement-learning',
    title: 'Q-learning',
    navLabel: 'Q-learning',
    canvasLabel: 'Q-learning on the corridor MDP: values and policy',
    level: 'graduate',
    keywords: [
      'Q-learning', 'reinforcement learning', 'Bellman equation', 'Markov decision process',
      'epsilon-greedy', 'discount factor', 'tabular RL',
    ],
    related: ['psychology/prisoner-dilemma'],
  };

  static info = {
    formula:
      'Q(s,a) ← Q(s,a) + α·[R + γ·max_a\' Q(s\',a\') − Q(s,a)]\n' +
      'γ* = 10^{−1/4} ≈ 0.5623 (threshold: prefer +10 above, +1 below)\n' +
      'P(reach 8 | start=2, unbiased) = 2/8 = 1/4',
    predict: [
      'Set γ = 0.50 (below γ* ≈ 0.56). Which terminal does the agent prefer after training?',
      'Set ε = 0 (pure greedy from the start). Does the agent converge to the optimal policy? Why or why not?',
      'Set α = 1. How does convergence speed and stability change compared to α = 0.1?',
    ],
    breaks: [
      'Tabular Q-learning does not scale to large or continuous state spaces.',
      'ε-greedy exploration can be inefficient; UCB or Thompson sampling do better.',
      'No function approximation: each (s,a) is independent — no generalisation across states.',
      'Assumes MDP stationarity; non-stationary rewards require adaptive learning rates.',
    ],
    derive: [
      { text: 'Bellman optimality: Q*(s,a) = E[R + γ·max_a\' Q*(s\',a\') | s,a].' },
      { text: 'Q-learning converges to Q* for finite MDPs given all (s,a) visited infinitely often and α_t → 0 at the right rate (Watkins & Dayan 1992).' },
      { text: 'Corridor threshold: agent prefers +10 iff γ^6·10 > γ^2·1 → γ^4 > 1/10 → γ > 10^{−1/4}.' },
      { text: 'Gambler\'s ruin formula: P(reach b | start=k, barriers 0 and b) = k/b for unbiased walk. Here k=2, b=8 → P = 1/4.' },
    ],
    research: {
      questions: [
        'Why does Q-learning converge off-policy while SARSA is on-policy?',
        'How does the discount factor γ trade off between immediate and delayed rewards?',
      ],
      challenge: 'Derive the exact Q* for every state in the corridor for γ = 0.9, then verify numerically.',
      papers: [
        {
          authors: 'Watkins, C.J.C.H., Dayan, P.',
          year: 1992,
          title: 'Q-learning',
          url: 'https://doi.org/10.1007/BF00992698',
        },
        {
          authors: 'Sutton, R.S., Barto, A.G.',
          year: 2018,
          title: 'Reinforcement Learning: An Introduction (2nd ed.)',
          url: 'http://incompleteideas.net/book/the-book-2nd.html',
        },
      ],
    },
    notePlaceholder: 'Why does a higher discount factor make the agent prefer the distant large reward?',
  };

  build() {
    this._gamma   = 0.9;
    this._alpha   = 0.1;
    this._epsilon = 0.1;
    this._episodes = 0;

    this._model = RLModel.corridor({
      gamma: this._gamma,
      alpha: this._alpha,
      epsilon: this._epsilon,
      seed: 42,
    });

    this._view = new RLView(this.view);

    this.layout.setStageNote('Q(s,a) ← Q(s,a) + α·[R + γ·max Q(s\',a\') − Q(s,a)]');

    // Gamma slider
    this._gammaSlider = new Slider({
      id: this.controlId('gamma'),
      label: 'γ (discount)',
      min: 0.0, max: 0.99, step: 0.01,
      value: this._gamma,
      format: v => v.toFixed(2),
      onInput: (v) => { this._gamma = v; this._resetModel(); },
    });
    this.layout.addControl(this._gammaSlider);

    // Alpha slider
    this._alphaSlider = new Slider({
      id: this.controlId('alpha'),
      label: 'α (learning rate)',
      min: 0.01, max: 0.5, step: 0.01,
      value: this._alpha,
      format: v => v.toFixed(2),
      onInput: (v) => { this._alpha = v; this._resetModel(); },
    });
    this.layout.addControl(this._alphaSlider);

    // Epsilon slider
    this._epsilonSlider = new Slider({
      id: this.controlId('epsilon'),
      label: 'ε (exploration)',
      min: 0.0, max: 0.5, step: 0.01,
      value: this._epsilon,
      format: v => v.toFixed(2),
      onInput: (v) => { this._epsilon = v; this._resetModel(); },
    });
    this.layout.addControl(this._epsilonSlider);

    // Train button
    this._trainBtn = new ActionButton({
      label: 'Train 1000 episodes',
      onClick: () => this._trainEpisodes(1000),
    });
    this.layout.addControl(this._trainBtn);

    // Readouts
    this._readouts = new ReadoutPanel([
      { key: 'episodes', label: 'Episodes trained' },
      { key: 'V2',       label: 'V*(state 2)' },
      { key: 'prefer',   label: 'Preferred terminal' },
      { key: 'gammastar', label: 'γ* threshold' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _resetModel() {
    this._episodes = 0;
    this._model = RLModel.corridor({
      gamma: this._gamma,
      alpha: this._alpha,
      epsilon: this._epsilon,
      seed: 42,
    });
  }

  _trainEpisodes(n) {
    const model = this._model;
    for (let ep = 0; ep < n; ep++) {
      let s = 2;
      while (s !== 0 && s !== 8) {
        const a = model.epsilonGreedy(s);
        const sNext = a === 'left' ? s - 1 : s + 1;
        const terminal = sNext === 0 || sNext === 8;
        const r = terminal ? (sNext === 8 ? 10 : 1) : 0;
        model.update(s, a, r, sNext, terminal);
        s = sNext;
      }
    }
    this._episodes += n;
  }

  update(_dt) {}

  draw() {
    this._view.draw(this._model, this._episodes);

    const V2 = Math.max(
      this._model.Q(2, 'left'),
      this._model.Q(2, 'right'),
    );

    // Preferred terminal: compare expected discounted return from state 2
    const vLeft  = this._model.Q(2, 'left');
    const vRight = this._model.Q(2, 'right');
    const prefer  = vRight >= vLeft ? '+10' : '+1';

    this._readouts.set('episodes',  String(this._episodes));
    this._readouts.set('V2',        (V2 != null ? V2.toFixed(4) : '–'));
    this._readouts.set('prefer',    prefer);
    this._readouts.set('gammastar', GAMMA_STAR.toFixed(4));
  }
}
