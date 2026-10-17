/**
 * WilsonCowanBench — excitatory-inhibitory neural population dynamics.
 */
import { Bench } from '../../../../core/Bench.js';
import { WilsonCowanModel } from './WilsonCowanModel.js';
import { WilsonCowanView } from './WilsonCowanView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class WilsonCowanBench extends Bench {
  static meta = {
    id: 'wilson-cowan',
    title: 'Wilson-Cowan model',
    navLabel: 'Wilson-Cowan',
    canvasLabel: 'E-I phase plane with nullclines',
    level: 'graduate',
    keywords: [
      'Wilson-Cowan', 'excitatory', 'inhibitory', 'neural population',
      'nullcline', 'phase plane', 'Hopf bifurcation', 'limit cycle', 'sigmoid',
    ],
    related: ['neuroscience/hopfield', 'math/phase-plane'],
  };

  static info = {
    formula: 'tau_E dE/dt = -E + (1-r_E*E)*S(w_EE*E - w_EI*I + P_E)',
    predict: [
      'With default parameters, the system has 3 fixed points: two stable nodes and one saddle.',
      'With the limit-cycle preset (wEE=8.5), a trajectory from any initial condition spirals outward to a sustained oscillation.',
    ],
    breaks: [
      'Only two populations (E, I). Real cortex has many cell types.',
      'The sigmoid is a phenomenological firing rate; it does not model spike timing.',
      'No spatial extent or propagation delays.',
    ],
    derive: [
      { text: 'Fixed points satisfy E = S(wEE*E - wEI*I + PE) and I = S(wIE*E - wII*I + PI).' },
      { text: 'The Hopf point occurs when tr(J) = 0 and det(J) > 0. At wEE=8, wEI=4, wIE=12, wII=0, PE=2, PI=-2: FP=(0.5,0.5), tr=0, det=2.' },
      { text: 'Increasing wEE past the Hopf point (e.g. wEE=8.5) makes tr > 0, destabilising the fixed point and creating a limit cycle.' },
    ],
    research: {
      questions: [
        'How does the frequency of the limit cycle depend on the time constants?',
        'What is the biological interpretation of the E and I nullclines?',
      ],
      challenge: 'Find the exact wEE at which the Hopf bifurcation occurs for the given parameter set.',
      papers: [
        { authors: 'H. R. Wilson & J. D. Cowan', year: 1972, title: 'Excitatory and inhibitory interactions in localized populations of model neurons', note: '(cited, not fetched)' },
      ],
    },
    notePlaceholder: 'What happens to the oscillation when you change wEE?',
  };

  build() {
    this.model = new WilsonCowanModel();
    this.wcView = new WilsonCowanView(this.view);
    this._traj = this.model.run(0.1, 0.1, 50);

    this.layout.addControl(new Slider({
      id: this.controlId('wEE'),
      label: 'wEE',
      min: 4, max: 16, step: 0.5,
      value: this.model.wEE,
      format: (v) => v.toFixed(1),
      onInput: (v) => {
        this.model.wEE = v;
        this._traj = this.model.run(0.1, 0.1, 50);
      },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Preset',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Hopf point', value: 'hopf' },
        { label: 'Limit cycle', value: 'limit' },
      ],
      value: 'default',
      onChange: (v) => {
        if (v === 'default') {
          Object.assign(this.model, { wEE: 12, wEI: 4, wIE: 13, wII: 11, PE: -2, PI: -3.5 });
        } else if (v === 'hopf') {
          Object.assign(this.model, { wEE: 8, wEI: 4, wIE: 12, wII: 0, PE: 2, PI: -2 });
        } else {
          Object.assign(this.model, { wEE: 8.5, wEI: 4, wIE: 12, wII: 0, PE: 2, PI: -2 });
        }
        this._traj = this.model.run(0.1, 0.1, 50);
      },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'fps', label: 'Fixed points' },
      { key: 'stability', label: 'FP1 stability' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.wcView.draw(this.model, this._traj);
    const fps = this.model.fixedPoints();
    this.readouts.set('fps', String(fps.length));
    if (fps.length > 0) {
      const s = this.model.stability(fps[0].E, fps[0].I);
      this.readouts.set('stability', s.type);
    }
  }
}
