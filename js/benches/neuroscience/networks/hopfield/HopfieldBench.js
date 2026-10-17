/**
 * HopfieldBench — Hopfield associative memory explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { HopfieldModel } from './HopfieldModel.js';
import { HopfieldView } from './HopfieldView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

/** Generate a random ±1 pattern of length N using a seeded-ish simple LCG. */
function randomPattern(N, seed) {
  const pat = [];
  let s = seed;
  for (let i = 0; i < N; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    pat.push((s >>> 16) & 1 ? 1 : -1);
  }
  return pat;
}

/** Flip `noiseBits` random bits in state. */
function addNoise(state, noiseBits, seed) {
  const s = state.slice();
  const N = s.length;
  let rng = seed;
  const indices = new Set();
  while (indices.size < Math.min(noiseBits, N)) {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    indices.add((rng >>> 16) % N);
  }
  for (const idx of indices) s[idx] = -s[idx];
  return s;
}

export class HopfieldBench extends Bench {
  static meta = {
    id: 'hopfield',
    title: 'Hopfield network',
    navLabel: 'Hopfield',
    canvasLabel: 'Hopfield associative memory: stored patterns and recall',
    level: 'graduate',
    keywords: [
      'Hopfield network', 'associative memory', 'Hebbian learning', 'energy',
      'attractor', 'neuroscience', 'neural network', 'spin glass',
    ],
    related: ['psychology/reinforcement-learning'],
  };

  static info = {
    formula:
      'w_ij = (1/N) Σ_μ ξ^μ_i ξ^μ_j  (i≠j),  w_ii = 0\n' +
      'E = −½ s^T W s\n' +
      'h_i = Σ_j w_ij s_j\n' +
      's_i ← sign(h_i)',
    predict: [
      'Store 1 pattern in N=16. What is the energy of the stored pattern vs a random state?',
      'Increase noise to 8 bits. Does recall succeed? At what noise level does it fail?',
      'Store M=5 patterns in N=16. Is recall still reliable? Compare capacity ≈ 0.138N.',
    ],
    breaks: [
      'Spurious attractors: mixtures of stored patterns (e.g., ±(ξ¹±ξ²)/2) can be stable.',
      'Correlated patterns reduce effective capacity below 0.138N.',
      'Synchronous update can oscillate; async update guarantees energy descent.',
      'Beyond capacity, retrieval fails and the network settles on a spurious state.',
    ],
    derive: [
      { text: 'Hebbian rule: w_ij = (1/N)Σ_μ ξ_i ξ_j stores correlations.' },
      { text: 'Energy function E = −½s^TWs is bounded below; async update decreases it.' },
      { text: 'Fixed points satisfy s_i = sign(Σ_j w_ij s_j) for all i.' },
      { text: 'Capacity ~0.138N from replica / signal-to-noise analysis (Amit et al. 1985).' },
    ],
    research: {
      questions: [
        'Why does the energy landscape have spurious minima at pattern mixtures?',
        'How does the Basin of attraction size depend on M/N (load parameter)?',
      ],
      challenge: 'Derive the critical load α_c ≈ 0.138 using a signal-to-noise argument.',
      papers: [
        {
          authors: 'Hopfield, J.J.',
          year: 1982,
          title: 'Neural networks and physical systems with emergent collective computational abilities',
          url: 'https://doi.org/10.1073/pnas.79.8.2554',
        },
        {
          authors: 'Amit, D.J., Gutfreund, H., Sompolinsky, H.',
          year: 1985,
          title: 'Storing infinite numbers of patterns in a spin-glass model of neural networks',
          url: 'https://doi.org/10.1103/PhysRevLett.55.1530',
        },
      ],
    },
    notePlaceholder: 'What happens to recall when M > 0.138·N patterns are stored?',
  };

  build() {
    this._N        = 16;
    this._M        = 2;
    this._noiseBits = 2;
    this._patternIdx = 0;   // which pattern to display overlap with

    this._buildModel();
    this._recall();

    this._view = new HopfieldView(this.view);

    this.layout.setStageNote(
      'E = −½ s^T W s;  capacity ≈ 0.138·N;  async update: s_i ← sign(Σ_j w_ij s_j)',
    );

    // N slider
    this._nSlider = new Slider({
      id: this.controlId('N'),
      label: 'N (neurons)',
      min: 4, max: 100, step: 4,
      value: this._N,
      format: v => String(v),
      onInput: (v) => { this._N = v; this._buildModel(); this._recall(); },
    });
    this.layout.addControl(this._nSlider);

    // M slider
    this._mSlider = new Slider({
      id: this.controlId('M'),
      label: 'M (patterns)',
      min: 1, max: 5, step: 1,
      value: this._M,
      format: v => String(v),
      onInput: (v) => { this._M = v; this._buildModel(); this._recall(); },
    });
    this.layout.addControl(this._mSlider);

    // Noise slider
    this._noiseSlider = new Slider({
      id: this.controlId('noise'),
      label: 'Noise (bits flipped)',
      min: 0, max: 8, step: 1,
      value: this._noiseBits,
      format: v => String(v),
      onInput: (v) => { this._noiseBits = v; this._recall(); },
    });
    this.layout.addControl(this._noiseSlider);

    // Readouts
    this._readouts = new ReadoutPanel([
      { key: 'E',        label: 'E (energy)' },
      { key: 'm',        label: 'm (overlap pat 1)' },
      { key: 'N',        label: 'N' },
      { key: 'M',        label: 'M stored' },
      { key: 'capacity', label: 'capacity ≈ 0.138·N' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _buildModel() {
    const patterns = [];
    for (let mu = 0; mu < this._M; mu++) {
      patterns.push(randomPattern(this._N, 0xDEAD + mu * 0x1337));
    }
    this.model = new HopfieldModel({ N: this._N, patterns });
  }

  _recall() {
    if (!this.model) return;
    // Start from pattern 0 + noise
    const pat0 = this.model.patterns[0];
    const noisy = addNoise(pat0, this._noiseBits, 0xBEEF);
    this._currentState = this.model.asyncRun(noisy, 200);
  }

  update(_dt) {}

  draw() {
    if (!this.model || !this._currentState) return;

    this._view.draw(this.model, this._currentState, 0);

    const E = this.model.energy(this._currentState);
    const m = this.model.overlapWith(this._currentState, 0);
    const cap = (0.138 * this._N).toFixed(1);

    this._readouts.set('E',        E != null ? E.toFixed(4) : '–');
    this._readouts.set('m',        m != null ? m.toFixed(4) : '–');
    this._readouts.set('N',        String(this._N));
    this._readouts.set('M',        String(this._M));
    this._readouts.set('capacity', cap);
  }
}
