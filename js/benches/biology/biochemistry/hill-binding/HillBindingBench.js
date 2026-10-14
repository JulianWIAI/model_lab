/**
 * HillBindingBench — cooperative O₂ binding with the Hill equation.
 * Compares haemoglobin (sigmoidal) with myoglobin (hyperbolic, n=1).
 */
import { Bench } from '../../../../core/Bench.js';
import { HillBindingModel } from './HillBindingModel.js';
import { HillBindingView } from './HillBindingView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class HillBindingBench extends Bench {
  static meta = {
    id: 'hill-binding',
    title: 'Cooperative O₂ binding',
    navLabel: 'Hill binding',
    canvasLabel: 'Fractional O₂ saturation θ vs partial pressure pO₂',
    level: 'university',
    keywords: [
      'Hill equation', 'haemoglobin', 'myoglobin', 'cooperative binding',
      'P50', 'oxygen', 'saturation', 'sigmoid', 'allosteric', 'Hill coefficient',
    ],
    related: ['biology/enzyme-kinetics'],
  };

  static info = {
    formula: 'θ = pO₂ⁿ / (P50ⁿ + pO₂ⁿ)',
    predict: [
      'What happens to the sigmoid shape as you increase n from 1 to 4?',
      'At what pO₂ is HbA 90% saturated? At what pO₂ is it 10% saturated?',
      'Compare haemoglobin and myoglobin curves: which unloads O₂ more readily at pO₂ = 20 mmHg?',
    ],
    breaks: [
      'Fixed T and pH. Real HbA shifts P50 with CO₂ and pH (the Bohr effect) — not modelled here.',
      'The Hill equation is a phenomenological curve-fit; it does not describe the four-site MWC mechanism.',
      'Myoglobin P50 ≈ 2.8 mmHg is an approximate value; published primary sources give a range of ≈1–3 mmHg.',
      'Fetal haemoglobin (HbF) has a lower P50 than HbA; this bench shows only HbA.',
    ],
    derive: [
      { text: 'At half-saturation (θ = 0.5), setting pO₂ = P50 in the Hill equation gives a denominator of 2·P50ⁿ and θ = 0.5 exactly.' },
      { text: 'For n = 1 the Hill equation is identical to Michaelis–Menten kinetics.', formula: 'θ = pO₂ / (P50 + pO₂)' },
      { text: 'Positive cooperativity (n > 1) steepens the transition. The four haem sites in HbA communicate via conformational changes (T→R state, Monod–Wyman–Changeux model).' },
    ],
    research: {
      questions: [
        'Why does the Hill coefficient n for HbA fall between 1 and 4, not equal 4?',
        'How does 2,3-BPG lower P50? What physiological advantage does this give?',
      ],
      challenge: 'Derive the Monod–Wyman–Changeux (MWC) equation and show that the Hill equation is a special limiting case.',
      papers: [
        { authors: 'A. V. Hill', year: 1910, title: 'The possible effects of the aggregation of the molecules of haemoglobin on its dissociation curves', url: 'https://doi.org/10.1113/jphysiol.1910.sp001386' },
        { authors: 'J. Monod, J. Wyman & J.-P. Changeux', year: 1965, title: 'On the nature of allosteric transitions: a plausible model', url: 'https://doi.org/10.1016/S0022-2836(65)80285-6' },
        { authors: 'M. F. Perutz', year: 1970, title: 'Stereochemistry of cooperative effects in haemoglobin', url: 'https://doi.org/10.1038/228726a0' },
      ],
    },
    notePlaceholder: 'How does the shape of the HbA curve help it both load O₂ in the lungs and unload it in the tissues?',
  };

  build() {
    this.model   = new HillBindingModel({ P50: HillBindingModel.HBA.P50, n: HillBindingModel.HBA.nDefault });
    this.mbModel = new HillBindingModel({ P50: HillBindingModel.MB.P50,  n: HillBindingModel.MB.n });
    this.hillView = new HillBindingView(this.view);
    this._cursorPO2 = 40;
    this._preset = 'hba';

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Preset',
      options: [
        { label: 'HbA', value: 'hba' },
        { label: 'Mb (n=1)', value: 'mb' },
        { label: 'Custom', value: 'custom' },
      ],
      value: 'hba',
      onChange: (v) => {
        this._preset = v;
        if (v === 'hba') {
          this.model.P50 = HillBindingModel.HBA.P50;
          this.model.n   = HillBindingModel.HBA.nDefault;
          this.hillView.showMb = false;
          this.layout.setStageNote('');
          this._p50Slider.setValue(this.model.P50);
          this._nSlider.setValue(this.model.n);
        } else if (v === 'mb') {
          this.model.P50 = HillBindingModel.MB.P50;
          this.model.n   = HillBindingModel.MB.n;
          this.hillView.showMb = false;
          this.layout.setStageNote('⚠ Myoglobin P50 ≈ 2.8 mmHg — approximate value; primary sources vary (≈1–3 mmHg)');
          this._p50Slider.setValue(this.model.P50);
          this._nSlider.setValue(this.model.n);
        } else {
          this.hillView.showMb = false;
          this.layout.setStageNote('');
        }
      },
    }));

    this._p50Slider = new Slider({
      id: this.controlId('p50'),
      label: 'P50',
      min: 1, max: 60, step: 0.5,
      value: this.model.P50,
      format: (v) => `${v.toFixed(1)} mmHg`,
      onInput: (v) => {
        this.model.P50 = v;
        this._preset = 'custom';
      },
    });
    this.layout.addControl(this._p50Slider);

    this._nSlider = new Slider({
      id: this.controlId('n'),
      label: 'Hill coefficient n',
      min: 0.5, max: 5, step: 0.1,
      value: this.model.n,
      format: (v) => v.toFixed(1),
      onInput: (v) => {
        this.model.n = v;
        this._preset = 'custom';
      },
    });
    this.layout.addControl(this._nSlider);

    this.layout.addControl(new Slider({
      id: this.controlId('cursor'),
      label: 'pO₂ cursor',
      min: 0, max: 150, step: 0.5,
      value: this._cursorPO2,
      format: (v) => `${v.toFixed(1)} mmHg`,
      onInput: (v) => { this._cursorPO2 = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'theta', label: 'θ at cursor' },
      { key: 'p50',   label: 'P50' },
      { key: 'n',     label: 'n (Hill)' },
    ]);
    this.layout.setReadouts(this.readouts);
    this.hillView.mbModel = this.mbModel;
  }

  update(_dt) {}

  draw() {
    this.hillView.draw(this.model, this._cursorPO2);
    this.readouts.set('theta', this.model.theta(this._cursorPO2).toFixed(4));
    this.readouts.set('p50',   `${this.model.P50.toFixed(1)} mmHg`);
    this.readouts.set('n',     this.model.n.toFixed(1));
  }
}
