/**
 * SynapseKineticsBench — alpha function synaptic current.
 */
import { Bench } from '../../../../core/Bench.js';
import { SynapseKineticsModel } from './SynapseKineticsModel.js';
import { SynapseKineticsView } from './SynapseKineticsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class SynapseKineticsBench extends Bench {
  static meta = {
    id: 'synapse-kinetics',
    title: 'Synaptic current kinetics',
    navLabel: 'Synapse kinetics',
    canvasLabel: 'Alpha-function synaptic current h(t)',
    level: 'university',
    keywords: [
      'synapse', 'AMPA', 'alpha function', 'synaptic current', 'time constant',
      'peak', 'decay', 'neurotransmitter', 'kinetics',
    ],
    related: ['neuroscience/neuron'],
  };

  static info = {
    predict: [
      'Real AMPA receptors have τ ≈ 1–2 ms. How does the alpha function at τ=5ms differ from that faster time scale?',
      'If you double τ (A fixed), does the peak current change? Does the total charge transfer change?',
      'At what time does h fall back to exactly half its peak value? (τ is held fixed, only A changes.)',
    ],
    breaks: [
      'The alpha function is phenomenological — it fits the rising and falling phases but has no mechanistic derivation.',
      'Real AMPA receptors are faster (τ ≈ 1–2 ms); NMDA receptors are slower (τ ≈ 50–100 ms).',
      'For very large τ, the peak current A·e⁻¹ is unchanged but the current persists longer.',
      'Double-exponential: h(t) = A·(e^{-t/τ_d} - e^{-t/τ_r}) with separate rise τ_r and decay τ_d time constants. The peak occurs at t_peak = τ_r·τ_d/(τ_d-τ_r)·ln(τ_d/τ_r).',
    ],
    derive: [
      { text: 'Alpha function: amplitude A and time constant τ (units ms).', formula: 'h(t) = A·(t/τ)·e^{-t/τ},  t ≥ 0' },
      { text: 'Peak: dh/dt = 0 → (1-t/τ)·e^{-t/τ}·A/τ = 0 → t = τ.', formula: 'h(τ) = A·e^{-1} ≈ 0.368A' },
      { text: 'Half-decay: h falls to h(τ)/e = A·e^{-2} when x·e^{-x}=e^{-2}, x≈3.146.', formula: 't½ ≈ 3.146·τ' },
      { text: 'Total charge: ∫₀^∞ h dt = A·∫₀^∞ (t/τ)·e^{-t/τ} dt = A·τ·Γ(2) = A·τ.', formula: 'Q = A·τ' },
    ],
    research: {
      questions: [
        'What neurotransmitter receptor subtypes have kinetics best described by the alpha function?',
        'How would you measure τ experimentally from a recorded synaptic current?',
      ],
      challenge: 'Implement the double-exponential model h(t)=A(e^{-t/τ_d}-e^{-t/τ_r}) and compare its charge transfer and peak time to the alpha function.',
      papers: [],
    },
    notePlaceholder: 'How does the area under the curve (charge transfer) depend on τ…',
  };

  build() {
    this.model = new SynapseKineticsModel({ tau: 5.0, A: 1.0 });
    this.synView = new SynapseKineticsView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'hpeak',    label: 'h(τ) = Ae⁻¹' },
      { key: 'tpeak',    label: 'Peak time (ms)' },
      { key: 'halfdecay',label: 't½ decay (ms)' },
      { key: 'integral', label: '∫h dt = Aτ' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('tau'),
      label: 'Time constant τ (ms)',
      min: 0.5, max: 50, step: 0.5, value: 5,
      format: v => `${v.toFixed(1)} ms`,
      onInput: v => { this.model = new SynapseKineticsModel({ tau: v, A: this.model.A }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('A'),
      label: 'Amplitude A',
      min: 0.1, max: 5.0, step: 0.1, value: 1.0,
      format: v => v.toFixed(1),
      onInput: v => { this.model = new SynapseKineticsModel({ tau: this.model.tau, A: v }); },
    }));
  }

  update(_dt) {}

  draw() {
    this.synView.draw(this.model);
    const m = this.model;
    this.readouts.set('hpeak',     m.hPeak.toFixed(4));
    this.readouts.set('tpeak',     `${m.tPeak.toFixed(2)} ms`);
    this.readouts.set('halfdecay', `${m.halfDecayTime().toFixed(2)} ms`);
    this.readouts.set('integral',  (m.A * m.tau).toFixed(3));
  }
}
