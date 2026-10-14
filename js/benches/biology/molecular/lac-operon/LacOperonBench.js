/**
 * LacOperonBench — qualitative model of the E. coli lac operon bistable switch.
 */
import { Bench } from '../../../../core/Bench.js';
import { LacOperonModel } from './LacOperonModel.js';
import { LacOperonView } from './LacOperonView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class LacOperonBench extends Bench {
  static meta = {
    id: 'lac-operon',
    title: 'Lac operon switch',
    navLabel: 'Lac operon',
    canvasLabel: 'mRNA, LacZ and allolactose time series — lac operon bistable switch',
    level: 'university',
    keywords: [
      'lac operon', 'gene regulation', 'bistability', 'toggle switch',
      'E. coli', 'mRNA', 'beta-galactosidase', 'allolactose', 'inducer',
      'catabolite repression', 'glucose', 'lactose', 'Hill function',
    ],
    related: ['biology/central-dogma', 'biology/enzyme-kinetics'],
  };

  static info = {
    formula:
      'dM/dt = αM·Aʰ/(Krʰ+Aʰ)·1/(1+g/Kg) − γM·M\n' +
      'dB/dt = αB·M − γB·B\n' +
      'dA/dt = κ·B·L/(KL+L) − δA·A\n' +
      '⚠ Qualitative model — parameters are dimensionless, not\n' +
      '  experimental values (see Yildirim & Mackey 2003).',
    predict: [
      'With glucose=0 and lactose=1, does LacZ stay high if you suddenly add glucose?',
      'Start with glucose=0, lactose=0. Slowly increase lactose. At what level does the switch flip?',
      'If you reduce lactose from high to low, does the switch flip at the same level?',
    ],
    breaks: [
      'Qualitative model: parameters are chosen to show bistability, not fitted to experimental data.',
      'Time delays (mRNA processing, translation, protein folding) in the real system are omitted.',
      'The model treats the cell as a well-mixed compartment with no spatial structure or stochastic noise.',
    ],
    derive: [
      { text: 'LacI repressor blocks transcription. Allolactose binds LacI, releasing the operator → mRNA is produced.' },
      { text: 'A Hill function captures cooperative binding of allolactose to the LacI tetramer.', formula: 'f(A) = Aʰ/(Krʰ+Aʰ), h≈3' },
      { text: 'Positive feedback: lactose → allolactose (via LacZ) → more LacZ. This loop creates bistability.' },
      { text: 'Glucose inhibits adenylate cyclase, lowering cAMP and CRP activation → reduced transcription (catabolite repression).' },
    ],
    research: {
      questions: [
        'Does the switch exhibit hysteresis? Set up the simulation to test it.',
        'What minimum Hill coefficient h is needed for bistability?',
      ],
      challenge: 'Find the two stable steady states and the unstable saddle point by numerically solving dM/dt=dB/dt=dA/dt=0.',
      papers: [
        { authors: 'F. Jacob & J. Monod', year: 1961, title: 'Genetic regulatory mechanisms in the synthesis of proteins', url: 'https://doi.org/10.1016/S0022-2836(61)80072-7' },
        { authors: 'N. Yildirim & M. C. Mackey', year: 2003, title: 'Feedback dynamics and bistability of gene expression in the lac operon', url: 'https://doi.org/10.1016/S0006-3495(03)74711-6' },
        { authors: 'E. M. Ozbudak et al.', year: 2004, title: 'Multistability in the lactose utilization network of Escherichia coli', url: 'https://doi.org/10.1038/nature02298' },
      ],
    },
    notePlaceholder: 'Describe what happens to each variable when you add or remove lactose…',
  };

  build() {
    this.model = new LacOperonModel({ glucose: 0, lactose: 0 });
    this.lacView = new LacOperonView(this.view);
    this._stepsPerFrame = 5;

    this.layout.setStageNote('⚠ Qualitative model — parameters are dimensionless and not fitted to experimental data');

    this.layout.addAction(this.createPauseButton());
    this.paused = false;

    this.layout.addControl(new Slider({
      id: this.controlId('lactose'),
      label: 'Lactose',
      min: 0,
      max: 1,
      step: 0.01,
      value: 0,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.lactose = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('glucose'),
      label: 'Glucose',
      min: 0,
      max: 1,
      step: 0.01,
      value: 0,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.glucose = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'mRNA',  label: 'mRNA' },
      { key: 'lacZ',  label: 'LacZ' },
      { key: 'allo',  label: 'Allolactose' },
      { key: 'time',  label: 'Time' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {
    for (let i = 0; i < this._stepsPerFrame; i++) {
      this.model.step(0.05);
    }
    this.lacView.record(this.model);
  }

  draw() {
    this.lacView.draw(this.model);
    this.readouts.set('mRNA',  this.model.mRNA.toFixed(4));
    this.readouts.set('lacZ',  this.model.lacZ.toFixed(4));
    this.readouts.set('allo',  this.model.allolactose.toFixed(4));
    this.readouts.set('time',  this.model.time.toFixed(1));
  }
}
