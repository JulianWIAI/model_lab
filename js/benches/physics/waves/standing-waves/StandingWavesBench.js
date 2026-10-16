/**
 * StandingWavesBench — string and pipe harmonics.
 */
import { Bench } from '../../../../core/Bench.js';
import { StandingWavesModel } from './StandingWavesModel.js';
import { StandingWavesView } from './StandingWavesView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class StandingWavesBench extends Bench {
  static meta = {
    id: 'standing-waves',
    title: 'Standing waves',
    navLabel: 'Standing waves',
    canvasLabel: 'Animated standing wave with node positions',
    level: 'university',
    keywords: [
      'standing wave', 'harmonic', 'fundamental', 'node', 'antinode',
      'string', 'open pipe', 'closed pipe', 'resonance', 'frequency',
    ],
    related: ['physics/wave-interference'],
  };

  static info = {
    predict: [
      'For a 1 m string at v=343 m/s, what is the fundamental frequency?',
      'How does the number of nodes change when you go from n=1 to n=3?',
      'Why does a closed pipe only have odd harmonics?',
    ],
    breaks: [
      'End correction: real pipes have effective length L + 0.6r (r = bore radius). v_air at 20°C ≈ 343 m/s (unverified; real value depends on humidity and temperature).',
      'Pressure vs displacement: for pipes, pressure nodes occur at displacement antinodes and vice versa.',
      'Inharmonicity: real strings are stiff, raising higher modes above integer multiples.',
    ],
    derive: [
      { text: 'String fixed at both ends: boundary conditions y(0,t)=y(L,t)=0 require integer half-wavelengths.', formula: 'λₙ = 2L/n  →  fₙ = n·v/(2L)' },
      { text: 'Open pipe (pressure antinodes at both ends):', formula: 'fₙ = n·v/(2L), n=1,2,3,…' },
      { text: 'Closed pipe (closed end = pressure antinode, open end = pressure node):', formula: 'fₘ = m·v/(4L), m=1,3,5,… (odd only)' },
      { text: 'Node positions for harmonic n (string):', formula: 'xₖ = k·L/n,  k=0,1,…,n' },
    ],
    research: {
      questions: [
        'Why does a clarinet (cylindrical, one closed end) play mostly odd harmonics, while a saxophone (conical, both open) plays all harmonics?',
        'What determines the timbre (tone colour) of an instrument?',
      ],
      challenge: 'Add end correction to the closed-pipe formula: L_eff = L + 0.6r. How does the correction change the pitch for a 1 cm radius pipe?',
      papers: [],
    },
    notePlaceholder: 'Why do closed pipes only produce odd harmonics…',
  };

  build() {
    this.model = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n: 1 });
    this.swView = new StandingWavesView(this.view);
    this.t = 0;

    this.readouts = new ReadoutPanel([
      { key: 'f1',    label: 'f₁ (Hz)' },
      { key: 'fn',    label: 'fₙ (Hz)' },
      { key: 'ratio', label: 'fₙ/f₁' },
      { key: 'nodes', label: 'Nodes' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('mode'),
      label: 'Mode',
      options: [
        { value: 'string', label: 'String' },
        { value: 'open',   label: 'Open pipe' },
        { value: 'closed', label: 'Closed pipe' },
      ],
      value: 'string',
      onChange: v => {
        const n = v === 'closed' ? 1 : this.model.n;
        this.model = new StandingWavesModel({ L: this.model.L, v: this.model.v, mode: v, n });
      },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('n'),
      label: 'Harmonic n',
      min: 1, max: 9, step: 1, value: 1,
      format: v => v.toFixed(0),
      onInput: v => {
        let n = Math.round(v);
        if (this.model.mode === 'closed') n = n % 2 === 0 ? n + 1 : n;
        this.model = new StandingWavesModel({ L: this.model.L, v: this.model.v, mode: this.model.mode, n });
      },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('L'),
      label: 'Length L (m)',
      min: 0.1, max: 3.0, step: 0.05, value: 1.0,
      format: v => `${v.toFixed(2)} m`,
      onInput: v => { this.model = new StandingWavesModel({ L: v, v: this.model.v, mode: this.model.mode, n: this.model.n }); },
    }));

    this.layout.addAction(this.createPauseButton());
  }

  update(dt) {
    this.t += dt;
  }

  draw() {
    this.swView.draw(this.model, this.t);
    const m = this.model;
    const f1 = m.frequency(m.mode === 'closed' ? 1 : 1);
    const fn = m.frequency();
    this.readouts.set('f1',    `${f1.toFixed(2)} Hz`);
    this.readouts.set('fn',    `${fn.toFixed(2)} Hz`);
    this.readouts.set('ratio', (fn / f1).toFixed(4));
    this.readouts.set('nodes', String(m.nodePositions().length));
  }
}
