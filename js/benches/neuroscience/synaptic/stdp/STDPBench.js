/**
 * STDPBench — Spike-Timing-Dependent Plasticity explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { STDPModel } from './STDPModel.js';
import { STDPView } from './STDPView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class STDPBench extends Bench {
  static meta = {
    id: 'stdp',
    title: 'Spike-timing-dependent plasticity',
    navLabel: 'STDP',
    canvasLabel: 'STDP kernel Δw(Δt) and cumulative weight trajectory',
    level: 'university',
    keywords: [
      'STDP', 'Hebbian', 'plasticity', 'LTP', 'LTD', 'synapse',
      'spike timing', 'Song 2000', 'neuroscience',
    ],
    related: ['neuroscience/electrophysiology/cable-equation'],
  };

  static info = {
    formula:
      'Δt = t_post − t_pre\n' +
      'Δw = +A₊·e^{−Δt/τ₊}  (Δt > 0, LTP)\n' +
      'Δw = −A₋·e^{ Δt/τ₋}  (Δt < 0, LTD)\n' +
      'W_net = A₊τ₊ − A₋τ₋',
    predict: [
      'Compare A₊τ₊ vs A₋τ₋ with Song 2000 defaults. Which area is larger?',
      'Double τ₊ to 40 ms. Does W_net become LTP-dominant or LTD-dominant?',
      'With w=0.5, Δt=+10 ms: how many isolated pairings to reach w=1?',
    ],
    breaks: [
      'Pair-based only: triplet interactions (Pfister & Gerstner 2006) modify the net rule.',
      'No dendritic effects: location on dendrite changes effective timing.',
      'Deterministic spike times: jitter changes effective kernel shape.',
      'Bimodal weight distribution emerges only in a population under Poisson drive.',
    ],
    derive: [
      { text: 'Hebbian timing: pre before post (Δt>0) → correlated → LTP.' },
      { text: 'Exponential kernel: eligibility trace decays with time constant τ.' },
      { text: 'Net area under Poisson drive: E[Δw] ∝ W_net = A₊τ₊ − A₋τ₋.' },
      { text: 'A₋/A₊=1.05 with τ₊=τ₋ → W_net<0 → LTD-dominant (Song et al. 2000).' },
    ],
    research: {
      questions: [
        'What happens to the synaptic weight distribution when W_net > 0?',
        'How does STDP with hard bounds w∈[0,1] produce a bimodal distribution?',
      ],
      challenge: 'Derive the steady-state weight distribution for a synapse under Poisson input using a Fokker-Planck equation.',
      papers: [
        {
          authors: 'Song, S., Miller, K.D., Abbott, L.F.',
          year: 2000,
          title: 'Competitive Hebbian learning through spike-timing-dependent synaptic plasticity',
          url: 'https://doi.org/10.1038/78829',
        },
        {
          authors: 'Bi, G.Q., Poo, M.M.',
          year: 1998,
          title: 'Synaptic modifications in cultured hippocampal neurons',
          url: 'https://doi.org/10.1523/JNEUROSCI.18-24-10464.1998',
        },
      ],
    },
    notePlaceholder: 'Why is the LTD area slightly larger than the LTP area in the Song 2000 model?',
  };

  build() {
    this._aPlusVal   = 0.005;
    this._aMinusRatio = 1.05;
    this._tauPlus    = 20;
    this._dtPair     = 10;   // ms; Δt for trajectory
    this._nPairs     = 100;

    this._updateModel();
    this._view = new STDPView(this.view);

    this.layout.setStageNote(
      'Δw = +A₊·e^{−Δt/τ₊} (LTP) / −A₋·e^{Δt/τ₋} (LTD);  W_net = A₊τ₊ − A₋τ₋',
    );

    this._aSlider = new Slider({
      id: this.controlId('aplus'),
      label: 'A₊',
      min: 0.001, max: 0.02, step: 0.001,
      value: this._aPlusVal,
      format: v => v.toFixed(3),
      onInput: (v) => { this._aPlusVal = v; this._updateModel(); },
    });
    this.layout.addControl(this._aSlider);

    this._tauSlider = new Slider({
      id: this.controlId('tau'),
      label: 'τ₊ = τ₋ (ms)',
      min: 5, max: 60, step: 1,
      value: this._tauPlus,
      format: v => v.toFixed(0),
      onInput: (v) => { this._tauPlus = v; this._updateModel(); },
    });
    this.layout.addControl(this._tauSlider);

    this._dtSlider = new Slider({
      id: this.controlId('dt'),
      label: 'Δt for trajectory (ms)',
      min: -100, max: 100, step: 1,
      value: this._dtPair,
      format: v => (v >= 0 ? '+' : '') + v.toFixed(0),
      onInput: (v) => { this._dtPair = v; this._updateModel(); },
    });
    this.layout.addControl(this._dtSlider);

    this._readouts = new ReadoutPanel([
      { key: 'ltpArea', label: 'A₊τ₊' },
      { key: 'ltdArea', label: 'A₋τ₋' },
      { key: 'wnet',    label: 'W_net' },
      { key: 'dwPair',  label: 'Δw(Δt)' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _updateModel() {
    this.model = new STDPModel({
      A_plus:       this._aPlusVal,
      A_minus:      this._aPlusVal * this._aMinusRatio,
      tau_plus_ms:  this._tauPlus,
      tau_minus_ms: this._tauPlus,
    });

    // Kernel curve data
    const N = 300;
    const dtArr = [];
    const dwArr = [];
    for (let i = 0; i <= N; i++) {
      const dt = -150 + (i / N) * 300;
      dtArr.push(dt);
      dwArr.push(this.model.kernel(dt));
    }
    this._kernelData = { dt: dtArr, dw: dwArr };

    // Trajectory: repeated identical pairings at fixed Δt
    const ns = [], ws = [];
    let cumW = 0;
    ns.push(0); ws.push(0);
    const dwPerPair = this.model.kernel(this._dtPair);
    for (let i = 1; i <= this._nPairs; i++) {
      cumW += dwPerPair;
      ns.push(i); ws.push(cumW);
    }
    this._trajectoryData = { n: ns, w: ws };
  }

  update(_dt) {}

  draw() {
    this._view.draw(this.model, this._kernelData, this._trajectoryData);
    const ltpArea = this.model.A_plus * this.model.tau_plus_ms;
    const ltdArea = this.model.A_minus * this.model.tau_minus_ms;
    this._readouts.set('ltpArea', ltpArea.toFixed(5));
    this._readouts.set('ltdArea', ltdArea.toFixed(5));
    this._readouts.set('wnet',    this.model.netArea().toFixed(5));
    this._readouts.set('dwPair',  this.model.kernel(this._dtPair).toFixed(6));
  }
}
