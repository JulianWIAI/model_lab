/**
 * OpinionDynamicsBench — DeGroot iterative consensus explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { OpinionDynamicsModel } from './OpinionDynamicsModel.js';
import { OpinionDynamicsView } from './OpinionDynamicsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

const PRESET_MATRICES = {
  w3: {
    label: 'W3 (3 agents)',
    W: [[0.5, 0.3, 0.2], [0.2, 0.6, 0.2], [0.1, 0.3, 0.6]],
    x0: [0.2, 0.8, 0.5],
  },
  ring5: {
    label: 'Ring N=5',
    W: (function () {
      return Array.from({ length: 5 }, (_, i) => {
        const row = [0, 0, 0, 0, 0];
        row[i] = 0.5;
        row[(i + 1) % 5] = 0.25;
        row[(i + 4) % 5] = 0.25;
        return row;
      });
    })(),
    x0: [0.1, 0.3, 0.5, 0.7, 0.9],
  },
};

export class OpinionDynamicsBench extends Bench {
  static meta = {
    id: 'opinion-dynamics',
    title: 'Opinion dynamics (DeGroot)',
    navLabel: 'Opinion dynamics',
    canvasLabel: 'Opinion trajectories and current state',
    level: 'university',
    keywords: [
      'DeGroot', 'opinion dynamics', 'consensus', 'Markov chain', 'stationary distribution',
      'left eigenvector', 'social learning', 'network',
    ],
    related: ['psychology/learning/prisoner-dilemma'],
  };

  static info = {
    formula:
      'x(t+1) = W·x(t)\n' +
      'Consensus x* = π·x(0)\n' +
      'where π·W = π (left stationary distribution)',
    predict: [
      'Make agent 1 fully stubborn: W[0]=[1,0,0,...]. What happens to consensus?',
      'Use a cyclic permutation. Does isPrimitive return true or false?',
      'Start with polarised [0,0,1,1]. Does mean-preserving property guarantee consensus=0.5?',
    ],
    breaks: [
      'Reducible W: multiple fixed-point attractors (block-diagonal example).',
      'Cyclic/periodic W: no convergence; isPrimitive = false.',
      'Linear model only; Deffuant bounded-confidence has nonlinear thresholds.',
    ],
    derive: [
      { text: 'x(t+1) = W·x(t). After T steps: x(T) = Wᵀ·x(0). As T→∞: Wᵀ → 1·πᵀ for ergodic W.' },
      { text: 'π: unique left eigenvector with eigenvalue 1 (stationary distribution of Markov chain W).' },
      { text: 'Power iteration on Wᵀ: v ← Wᵀv/‖Wᵀv‖₁ converges to π for primitive W.' },
    ],
    research: {
      questions: [
        'What conditions on W guarantee convergence to a unique consensus?',
        'How does the network topology (star, ring, complete) affect convergence speed?',
      ],
      challenge: 'Derive the exact stationary distribution for a 3-agent W with one stubborn agent.',
      papers: [
        {
          authors: 'DeGroot, M.H.',
          year: 1974,
          title: 'Reaching a consensus',
          url: 'https://doi.org/10.1080/01621459.1974.10480137',
        },
        {
          authors: 'Golub, B., Jackson, M.O.',
          year: 2010,
          title: 'Naive learning in social networks',
          url: 'https://doi.org/10.1257/mic.2.1.112',
        },
      ],
    },
    notePlaceholder: 'Why does the stationary distribution depend on the matrix topology, not just the initial opinions?',
  };

  build() {
    this._presetKey = 'w3';
    this._T         = 60;
    this._updateModel();
    this._view = new OpinionDynamicsView(this.view);

    this.layout.setStageNote('x(t+1) = W·x(t)   x* = π·x(0)   (π·W=π)');

    this._tSlider = new Slider({
      id: this.controlId('T'),
      label: 'Steps T',
      min: 10, max: 200, step: 5,
      value: this._T,
      format: v => v.toFixed(0),
      onInput: (v) => { this._T = v; this._rerun(); },
    });
    this.layout.addControl(this._tSlider);

    this._readouts = new ReadoutPanel([
      { key: 'preset',    label: 'Matrix' },
      { key: 'primitive', label: 'Primitive' },
      { key: 'consensus', label: 'x*' },
      { key: 'xFinal',   label: 'x(T)[0]' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _updateModel() {
    const preset = PRESET_MATRICES[this._presetKey];
    this.model   = new OpinionDynamicsModel({ W: preset.W });
    this._x0     = preset.x0;
    this._rerun();
  }

  _rerun() {
    this._history   = this.model.simulate(this._x0, this._T);
    this._consensus = this.model.consensus(this._x0);
  }

  update(_dt) {}

  draw() {
    this._view.draw(this.model, this._history, this._consensus);
    const xFinal = this._history[this._history.length - 1];
    const preset = PRESET_MATRICES[this._presetKey];
    this._readouts.set('preset',    preset.label);
    this._readouts.set('primitive', String(this.model.primitive));
    this._readouts.set('consensus', this._consensus.toFixed(4));
    this._readouts.set('xFinal',   xFinal[0].toFixed(4));
  }
}
