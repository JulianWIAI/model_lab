/**
 * RescorlaWagnerBench — Rescorla–Wagner associative learning model.
 * Controls: scenario selector, αA, αB, β, λ, nTrials.
 * Readouts: V_A final, V_B final, αβ domain status.
 */
import { Bench } from '../../../../core/Bench.js';
import { RescorlaWagnerModel } from './RescorlaWagnerModel.js';
import { RescorlaWagnerView } from './RescorlaWagnerView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class RescorlaWagnerBench extends Bench {
  static meta = {
    id: 'rescorla-wagner',
    title: 'Rescorla–Wagner',
    navLabel: 'Rescorla–Wagner',
    canvasLabel: 'Rescorla–Wagner associative learning: V_i vs trial',
    level: 'intro',
    keywords: [
      'Rescorla-Wagner', 'associative learning', 'classical conditioning',
      'blocking', 'overshadowing', 'prediction error', 'Pavlov', 'Kamin',
    ],
    related: [
      'psychology/psychophysics/signal-detection',
      'psychology/psychophysics/weber-fechner',
    ],
  };

  static info = {
    formula:
      'ΔV_i = α_i·β·(λ − ΣV)\n' +
      'V_n = λ·(1−(1−αβ)^n)  [acquisition]\n' +
      'Converges for αβ < 1; oscillates for αβ > 1',
    predict: [
      'After 20 A-only trials (αβ=0.25, λ=1), what is V_A? (Formula: 1−(0.75)²⁰.)',
      'In a blocking experiment, why does B never get conditioned even though it is always paired with the US?',
      'If α_A=0.8 and α_B=0.2 (same β), what is the long-run ratio V_A/V_B in an overshadowing experiment?',
    ],
    breaks: [
      'Latent inhibition: pre-exposing a CS before conditioning retards acquisition — not captured.',
      'Extinction is not unlearning: spontaneous recovery after extinction contradicts V returning to 0.',
      'No attention changes: Mackintosh (1975) and Pearce–Hall (1980) models add dynamic α_i.',
      'Trial-level model only: no timing within a trial, no inter-trial intervals.',
      'Human blocking results are mixed: robust in animals, inconsistent in humans.',
    ],
    derive: [
      { text: 'Rule: ΔV_i = α_i·β·(λ−ΣV). Total prediction error λ−ΣV is shared by all stimuli present.' },
      { text: 'Single cue: ΔV = αβ(λ−V) → V_{n+1}=(1−αβ)V_n+αβλ → V_n=λ(1−(1−αβ)^n).' },
      { text: 'Blocking: V_A=λ before AB phase → error = λ−λ−V_B = −V_B ≈ 0 → B learns nothing.' },
      { text: 'Overshadowing: ΔV_A/ΔV_B = α_A/α_B always → V_A/V_B = α_A/α_B at equilibrium.' },
      { text: 'Conditioned inhibition: A+ gives V_A↑; AX− gives λ=0, so V_X driven negative to cancel V_A.' },
    ],
    research: {
      questions: [
        'How does the Rescorla-Wagner model explain the inverse base-rate effect?',
        'What is the key difference between the Rescorla-Wagner and Mackintosh (1975) models?',
      ],
      challenge: 'Show that in overshadowing (AB+ trials from V_A=V_B=0), the ratio V_A/V_B = α_A/α_B is maintained at every trial, not just at asymptote.',
      papers: [
        { authors: 'R.A. Rescorla & A.R. Wagner', year: 1972, title: 'A theory of Pavlovian conditioning', journal: 'In Classical Conditioning II, Appleton-Century-Crofts, pp. 64–99' },
        { authors: 'L.J. Kamin', year: 1969, title: 'Predictability, surprise, attention, and conditioning', journal: 'In Punishment and Aversive Behavior, Appleton-Century-Crofts, pp. 279–296' },
        { authors: 'R.R. Miller, R.C. Barnet & N.J. Grahame', year: 1995, title: 'Assessment of the Rescorla-Wagner model', journal: 'Psychol. Bull. 117(3):363–386', url: 'https://doi.org/10.1037/0033-2909.117.3.363' },
      ],
    },
    notePlaceholder: 'Why does blocking demonstrate that surprise, not mere pairing, drives learning?',
  };

  build() {
    this._scenario = 'acquisition';
    this._nTrials = 100;
    this.model = new RescorlaWagnerModel({ alphaA: 0.5, alphaB: 0.3, beta: 0.5, lambda: 1 });
    this.rwView = new RescorlaWagnerView(this.view);

    this.layout.setStageNote('ΔV_i = α_i·β·(λ − ΣV): prediction error drives all learning');

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('scenario'),
      label: 'Scenario',
      options: [
        { label: 'Acquisition', value: 'acquisition' },
        { label: 'Extinction', value: 'extinction' },
        { label: 'Blocking', value: 'blocking' },
        { label: 'Overshadow', value: 'overshadowing' },
        { label: 'Overexp.', value: 'overexpectation' },
        { label: 'Cond. inhib.', value: 'conditioned-inhibition' },
      ],
      value: 'acquisition',
      onChange: (v) => { this._scenario = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('alphaA'),
      label: 'α_A',
      min: 0, max: 1, step: 0.05,
      value: 0.5,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.alphaA = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('alphaB'),
      label: 'α_B',
      min: 0, max: 1, step: 0.05,
      value: 0.3,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.alphaB = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('beta'),
      label: 'β',
      min: 0, max: 1, step: 0.05,
      value: 0.5,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.beta = v; this._update(); },
    }));

    this._readout = new ReadoutPanel([
      { id: 'VA',     label: 'V_A (final)' },
      { id: 'VB',     label: 'V_B / V_X (final)' },
      { id: 'domain', label: 'Domain (αβ)' },
    ]);
    this.layout.addReadout(this._readout);
    this._update();
  }

  _update() {
    const { VA, VB } = this.model.simulate(this._scenario, this._nTrials);
    this._readout.set('VA', VA[VA.length - 1].toFixed(4));
    // VB tracks V_X in conditioned-inhibition; label notes both roles
    this._readout.set('VB', VB[VB.length - 1].toFixed(4));
    const ab = this.model.alphaA * this.model.beta;
    this._readout.set('domain', ab < 1 ? `${ab.toFixed(2)} (converges)` : `${ab.toFixed(2)} OSCILLATES`);
    this.rwView.draw(this.model, this._scenario, this._nTrials);
  }

  onFrame() {}
}
