/**
 * RandomWalkBench — symmetric random walk explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { RandomWalkModel } from './RandomWalkModel.js';
import { RandomWalkView } from './RandomWalkView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class RandomWalkBench extends Bench {
  static meta = {
    id: 'random-walk',
    title: 'Random walk',
    navLabel: 'Random walk',
    canvasLabel: '1D walk trajectory and 2D path',
    level: 'intro',
    keywords: [
      'random walk', 'Brownian motion', 'diffusion', 'mean squared displacement',
      "gambler's ruin", 'absorption', 'stochastic', 'Pólya', 'recurrence',
    ],
    related: ['math/probability/markov-chains', 'math/probability/central-limit'],
  };

  static info = {
    formula:
      'E[Xₙ²] = n  (exact)\n' +
      'E[|Xₙ|] = n·C(n,n/2)/2ⁿ  (exact, even n)\n' +
      'E[|Xₙ|] ≈ √(2n/π)  (asymptotic CLT)\n' +
      "Gambler's ruin: P(win) = k/N,  E[T] = k·(N−k)",
    predict: [
      'A walker starts at k=50 of N=100. Compare E[T] to starting at k=10.',
      'Double steps from 100 to 400. By what factor does σ = √n increase?',
      "For k=10, N=100: what are P(win) and E[T]? Check against k/N and k(N−k).",
    ],
    breaks: [
      'Discrete ±1 steps only; Lévy flights give anomalous diffusion.',
      'No drift: biased walk changes P(win).',
      'CLT approximation E[|X|] ≈ √(2n/π) has finite-n corrections.',
      '2D walk is recurrent (Pólya 1921); 3D walk is transient.',
    ],
    derive: [
      { text: 'E[Xₙ²] = Σ E[ξᵢ²] + 2Σᵢ<ⱼ E[ξᵢξⱼ] = n (cross terms vanish by independence).' },
      { text: 'Exact: P(Xₙ=k) = C(n,(n+k)/2)/2ⁿ; E[|Xₙ|] = n·C(n,n/2)/2ⁿ.' },
      { text: "Gambler's ruin: h(k)=P(reach N) satisfies h(k)=½h(k+1)+½h(k-1) → h(k)=k/N." },
      { text: 'E[T]=k(N−k) from the fundamental matrix (I−Q)⁻¹·1.' },
    ],
    research: {
      questions: [
        'Why does σ scale as √n (not n)? What does this say about diffusion?',
        'What changes if the walker is biased (p≠½)?',
      ],
      challenge: 'Verify that the 2D random walk is recurrent using the Pólya theorem.',
      papers: [
        {
          authors: 'F. Spitzer',
          year: 1964,
          title: 'Principles of Random Walk',
          url: 'https://doi.org/10.1007/978-1-4757-4229-9',
        },
      ],
    },
    notePlaceholder: 'Why does E[|X|] scale differently from E[X²]?',
  };

  build() {
    this._n    = 100;
    this._seed = 42;
    this._model = new RandomWalkModel({ seed: this._seed });
    this._view  = new RandomWalkView(this.view);

    this._regenerate();

    this.layout.setStageNote(
      'E[Xₙ²] = n (exact)   E[|Xₙ|] = n·C(n,n/2)/2ⁿ (exact)   ≈ √(2n/π) (asymptotic)',
    );

    this._nSlider = new Slider({
      id: this.controlId('n'),
      label: 'Steps n',
      min: 10, max: 500, step: 10,
      value: this._n,
      format: v => String(Math.round(v)),
      onInput: (v) => { this._n = Math.round(v); this._regenerate(); },
    });
    this.layout.addControl(this._nSlider);

    this._seedSlider = new Slider({
      id: this.controlId('seed'),
      label: 'Seed',
      min: 0, max: 99, step: 1,
      value: this._seed,
      format: v => String(Math.round(v)),
      onInput: (v) => { this._seed = Math.round(v); this._regenerate(); },
    });
    this.layout.addControl(this._seedSlider);

    this._readouts = new ReadoutPanel([
      { key: 'finalX',  label: 'Final X' },
      { key: 'exact',   label: 'E[|X|] exact' },
      { key: 'asymp',   label: 'E[|X|] asymp' },
      { key: 'eT',      label: 'E[T] at k=n/2' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _regenerate() {
    this._model = new RandomWalkModel({ seed: this._seed });
    this._w1D = this._model.walk1D(this._n);
    this._w2D = this._model.walk2D(this._n);
  }

  update(_dt) {}

  draw() {
    this._view.draw({ walk1D: this._w1D, walk2D: this._w2D }, this._n);

    const n = this._n;
    const finalX = this._w1D[n];
    const exact  = n % 2 === 0 ? RandomWalkModel.exactAbsMean(n).toFixed(4) : 'n/a (odd)';
    const asymp  = RandomWalkModel.asymptoticAbsMean(n).toFixed(4);
    const k      = Math.floor(n / 2);
    const eT     = k * (n - k);

    this._readouts.set('finalX', finalX.toFixed(0));
    this._readouts.set('exact',  String(exact));
    this._readouts.set('asymp',  asymp);
    this._readouts.set('eT',     String(eT));
  }
}
