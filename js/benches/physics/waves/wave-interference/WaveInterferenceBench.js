/**
 * WaveInterferenceBench — Young's double-slit interference.
 */
import { Bench } from '../../../../core/Bench.js';
import { WaveInterferenceModel } from './WaveInterferenceModel.js';
import { WaveInterferenceView } from './WaveInterferenceView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class WaveInterferenceBench extends Bench {
  static meta = {
    id: 'wave-interference',
    title: 'Double-slit wave interference',
    navLabel: 'Wave interference',
    canvasLabel: 'Intensity vs screen position — Young\'s double slit',
    level: 'university',
    keywords: [
      'double slit', 'Young', 'interference', 'fringe', 'wavelength', 'paraxial',
      'intensity', 'bright fringe', 'dark fringe', 'path difference',
    ],
    related: ['physics/standing-waves'],
  };

  static info = {
    predict: [
      'If you double the slit separation d, what happens to the fringe spacing Δy?',
      'If you use red light (700 nm) instead of violet (400 nm), how does the pattern change?',
      'At what screen position is the first dark fringe for the default settings?',
    ],
    breaks: [
      'The paraxial approximation assumes θ ≪ 1 (y ≪ L). Error ≈ θ²/2 grows for large y or small L.',
      'Real Fraunhofer condition: slit width a must satisfy a²/(λL) ≪ 1 for far-field diffraction.',
      'Single-slit diffraction envelope modulates the pattern when slit width a is not negligible.',
      'Temporal coherence: laser gives stable fringes; white light gives coloured fringes that wash out.',
    ],
    derive: [
      { text: 'Path difference from two slits to point y on screen (paraxial):', formula: 'Δ = d · y / L' },
      { text: 'Constructive interference when path difference is a whole wavelength:', formula: 'Δ = mλ  →  y_bright = m·λL/d' },
      { text: 'Destructive interference (dark fringe) at half-wavelength steps:', formula: 'y_dark = (m + ½)·λL/d' },
      { text: 'Intensity as a function of position (I₀ = peak intensity):', formula: 'I(y) = I₀ cos²(π·d·y / λL)' },
      { text: 'Fringe spacing (distance between adjacent bright fringes):', formula: 'Δy = λL/d' },
    ],
    research: {
      questions: [
        'Young\'s experiment (1804, unverified) demonstrated the wave nature of light. What was the state of the corpuscular vs wave debate at the time?',
        'How does the interference pattern change when one slit is covered? When both slits are open but one photon at a time is sent?',
      ],
      challenge: 'Extend the model to include the single-slit diffraction envelope: I(y) = I₀ · sinc²(πay/λL) · cos²(πdy/λL). At what y values does the envelope zero out a fringe?',
      papers: [
        { authors: 'T. Young', year: 1804, title: 'Experiments and Calculations Relative to Physical Optics (unverified — may be the double-slit source)' },
      ],
    },
    notePlaceholder: 'What happens to the fringe pattern if you change λ…',
  };

  build() {
    this.model = new WaveInterferenceModel({ lambda: 500e-9, d: 1e-3, L: 1.0, I0: 1.0 });
    this.waveView = new WaveInterferenceView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'deltaY',  label: 'Fringe spacing Δy' },
      { key: 'yDark0',  label: 'First dark fringe' },
      { key: 'I_dark',  label: 'I at dark fringe' },
      { key: 'lambda',  label: 'λ (nm)' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('lambda'),
      label: 'Wavelength λ (nm)',
      min: 400, max: 700, step: 1, value: 500,
      format: v => `${v.toFixed(0)} nm`,
      onInput: v => { this.model = new WaveInterferenceModel({ ...this._params(), lambda: v * 1e-9 }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('d'),
      label: 'Slit separation d (mm)',
      min: 0.1, max: 2.0, step: 0.05, value: 1.0,
      format: v => `${v.toFixed(2)} mm`,
      onInput: v => { this.model = new WaveInterferenceModel({ ...this._params(), d: v * 1e-3 }); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('L'),
      label: 'Screen distance L (m)',
      min: 0.5, max: 5.0, step: 0.1, value: 1.0,
      format: v => `${v.toFixed(1)} m`,
      onInput: v => { this.model = new WaveInterferenceModel({ ...this._params(), L: v }); },
    }));
  }

  _params() {
    return { lambda: this.model.lambda, d: this.model.d, L: this.model.L, I0: this.model.I0 };
  }

  update(_dt) {}

  draw() {
    this.waveView.draw(this.model);
    const m = this.model;
    this.readouts.set('deltaY', `${(m.deltaY * 1e3).toFixed(3)} mm`);
    this.readouts.set('yDark0', `${(m.yDark(0) * 1e3).toFixed(3)} mm`);
    this.readouts.set('I_dark', m.intensity(m.yDark(0)).toExponential(2));
    this.readouts.set('lambda', `${(m.lambda * 1e9).toFixed(0)} nm`);
  }
}
