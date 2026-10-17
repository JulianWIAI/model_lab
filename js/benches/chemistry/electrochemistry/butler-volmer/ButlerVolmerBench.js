/**
 * ButlerVolmerBench — Butler-Volmer electrode kinetics.
 */
import { Bench } from '../../../../core/Bench.js';
import { ButlerVolmerModel } from './ButlerVolmerModel.js';
import { ButlerVolmerView } from './ButlerVolmerView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class ButlerVolmerBench extends Bench {
  static meta = {
    id: 'butler-volmer',
    title: 'Butler-Volmer kinetics',
    navLabel: 'Butler-Volmer',
    canvasLabel: 'Butler-Volmer electrode current vs overpotential',
    level: 'graduate',
    keywords: ['Butler-Volmer', 'electrode kinetics', 'overpotential', 'Tafel slope',
               'exchange current', 'electrochemistry', 'transfer coefficient'],
    related: ['chemistry/nernst-cell'],
  };

  static info = {
    formula:
      'i = i₀·[exp(αFη/RT) − exp(−(1−α)Fη/RT)]\n' +
      'V_T = RT/F  (thermal voltage)\n' +
      'b = V_T·ln(10)/α  (Tafel slope, V/decade)',
    predict: [
      'Set α=0.5 and increase T from 298 K to 373 K. Does the curve steepen or flatten? Why does higher temperature reduce the Tafel slope?',
      'Set α=0.3 (asymmetric). Is the anodic current larger or smaller than the cathodic current at the same |η|? Which direction is favoured?',
      'Decrease η_max to 0.05 V. Does the i vs η curve look linear? How does this relate to the linear (Ohmic) approximation for small overpotentials?',
    ],
    breaks: [
      'Single-step electron transfer assumed; multi-step mechanisms alter the apparent transfer coefficient.',
      'Concentration of reactants and products held fixed (no mass transport limitations).',
      'i₀ treated as constant; in reality it depends on electrode material, surface area, and concentration.',
      'Temperature-independent α assumed; quantum mechanical tunnelling corrections ignored.',
    ],
    derive: [
      { text: 'Transition-state theory: rate ∝ exp(−ΔG‡/RT). For electrode reaction, ΔG‡ shifts linearly with overpotential η by ±αFη.' },
      { text: 'Anodic rate ka ∝ exp(αFη/RT); cathodic rate kc ∝ exp(−(1−α)Fη/RT). Net current i = i₀(ka − kc).' },
      { text: 'At η=0 equilibrium: ka=kc → i=0 and i₀ is the exchange current (equal forward and reverse rates).' },
      { text: 'For α=0.5: i/i₀ = exp(η/(2V_T)) − exp(−η/(2V_T)) = 2·sinh(η/(2V_T)) — exact sinh form.' },
    ],
    research: {
      questions: [
        'At η = V_T with α=0.5, what is log₁₀(i/i₀)? How does this compare to the Tafel slope b?',
        'Increase α from 0.5 to 0.8. In which direction does the polarization curve become more asymmetric?',
      ],
      challenge: 'Derive the linear approximation i ≈ i₀·η/V_T from the Butler-Volmer equation using a Taylor expansion for small η/V_T.',
      papers: [
        { authors: 'J.A.V. Butler', year: 1924, title: 'Studies in heterogeneous equilibria. Part II. The kinetic interpretation of the Nernst theory of electromotive force', url: 'https://doi.org/10.1039/tf9241900729' },
        { authors: 'A.J. Bard & L.R. Faulkner', year: 2001, title: 'Electrochemical Methods: Fundamentals and Applications, §3.4', url: 'https://www.wiley.com/en-us/Electrochemical+Methods%3A+Fundamentals+and+Applications%2C+2nd+Edition-p-9780471043720' },
      ],
    },
    notePlaceholder: 'What happens to the Tafel slope b as T → 0? Does the BV curve approach a step function? Why?',
  };

  build() {
    this.model = new ButlerVolmerModel({ alpha: 0.5, T_K: 298.15, i0: 1 });
    this.bvView = new ButlerVolmerView(this.view);
    this._etaMax = 0.5;

    // α slider
    this.layout.addControl(new Slider({
      id: this.controlId('alpha'),
      label: 'α',
      min: 0.1, max: 0.9, step: 0.05,
      value: this.model.alpha,
      format: v => v.toFixed(2),
      onInput: v => { this.model.alpha = v; },
    }));

    // T slider
    this.layout.addControl(new Slider({
      id: this.controlId('T'),
      label: 'T (K)',
      min: 273, max: 373, step: 1,
      value: this.model.T_K,
      format: v => v.toFixed(0),
      onInput: v => { this.model.T_K = v; },
    }));

    // η_max slider
    this.layout.addControl(new Slider({
      id: this.controlId('etaMax'),
      label: 'η_max (V)',
      min: 0.1, max: 1.0, step: 0.05,
      value: this._etaMax,
      format: v => v.toFixed(2),
      onInput: v => { this._etaMax = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'vt',       label: 'V_T (mV)' },
      { key: 'b',        label: 'b (mV/dec)' },
      { key: 'iAtVt',    label: 'i(η=V_T)/i₀' },
      { key: 'symmetry', label: 'Symmetry' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.bvView.draw(this.model, this._etaMax);

    const vt  = this.model.thermalVoltage();
    const b   = this.model.tafelSlope();
    const iVt = this.model.currentNorm(vt);

    // Symmetry check: for α=0.5, i(η) = −i(−η) (anti-symmetric)
    const iPos = this.model.current(0.1);
    const iNeg = this.model.current(-0.1);
    const asymm = Math.abs(iPos + iNeg) / (Math.abs(iPos) + 1e-30);
    const symLabel = asymm < 1e-6 ? 'i(η) = −i(−η)' : 'asymmetric';

    this.readouts.set('vt',       vt   != null ? (vt * 1000).toFixed(2) + ' mV' : '—');
    this.readouts.set('b',        b    != null ? (b  * 1000).toFixed(1) + ' mV/dec' : '—');
    this.readouts.set('iAtVt',    iVt  != null ? iVt.toFixed(4) : '—');
    this.readouts.set('symmetry', symLabel);
  }
}
