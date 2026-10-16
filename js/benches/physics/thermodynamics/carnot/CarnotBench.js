/**
 * CarnotBench — ideal Carnot cycle explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { CarnotModel } from './CarnotModel.js';
import { CarnotView } from './CarnotView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class CarnotBench extends Bench {
  static meta = {
    id: 'carnot',
    title: 'Carnot cycle',
    navLabel: 'Carnot cycle',
    canvasLabel: 'T-S diagram for the ideal Carnot cycle',
    level: 'intro',
    keywords: [
      'Carnot', 'heat engine', 'thermodynamics', 'efficiency', 'entropy',
      'T-S diagram', 'heat pump', 'refrigerator', 'second law', 'Kelvin',
    ],
    related: [],
  };

  static info = {
    formula:
      'η = 1 − T_c/T_h\n' +
      'COP_hp = T_h/(T_h−T_c) = 1/η\n' +
      'COP_ref = T_c/(T_h−T_c) = COP_hp − 1\n' +
      'W = (T_h − T_c)·ΔS',
    predict: [
      'Set T_h=873 K and find T_c giving η=0.33. What is the minimum T_c?',
      'Set T_c close to T_h. What does COP_hp approach? Set T_c=0: what is COP_hp?',
      'Increase T_c from 100 K to 200 K, then 200→300 K. Is the drop in η the same?',
    ],
    breaks: [
      'Assumes reversible, quasi-static processes. Real engines are irreversible.',
      'T must be in Kelvin. Celsius inputs produce wrong answers.',
      'Real working fluids have non-rectangular T-S curves.',
    ],
    derive: [
      { text: 'Isothermal expansion at T_h absorbs Q_h = T_h·ΔS.' },
      { text: 'Isothermal compression at T_c rejects Q_c = T_c·ΔS.' },
      { text: 'Work W = Q_h − Q_c; efficiency η = W/Q_h = 1 − T_c/T_h.' },
      { text: 'COP_hp = Q_h/W = 1/η; COP_ref = Q_c/W; COP_hp − COP_ref = 1 (always).' },
    ],
    research: {
      questions: [
        'Why is no real engine more efficient than the Carnot cycle between the same reservoirs?',
        'A steam power plant has T_h=600°C, T_c=30°C. What is the Carnot limit?',
      ],
      challenge: 'Prove using entropy considerations that any irreversible cycle has η < η_Carnot.',
      papers: [
        {
          authors: 'S. Carnot',
          year: 1824,
          title: 'Réflexions sur la puissance motrice du feu',
          url: 'https://doi.org/10.1017/CBO9781139872669',
        },
      ],
    },
    notePlaceholder: 'Why can no engine exceed the Carnot efficiency?',
  };

  build() {
    this.model    = new CarnotModel({ Th: 500, Tc: 300, dS: 1 });
    this.carnotView = new CarnotView(this.view);

    this.layout.setStageNote('Carnot: η = 1 − T_c/T_h  (temperatures in Kelvin)');

    // T_h slider 300–1200 K
    this._thSlider = new Slider({
      id: this.controlId('Th'),
      label: 'T_h (K)',
      min: 300, max: 1200, step: 5,
      value: this.model.Th,
      format: v => v.toFixed(0),
      onInput: (v) => {
        const newTh = v;
        // Clamp Tc if needed
        if (this.model.Tc >= newTh) {
          this.model._Tc = newTh - 5;
          this._tcSlider?.setValue(this.model.Tc);
        }
        this.model._Th = newTh;
      },
    });
    this.layout.addControl(this._thSlider);

    // T_c slider 0–700 K
    this._tcSlider = new Slider({
      id: this.controlId('Tc'),
      label: 'T_c (K)',
      min: 0, max: 700, step: 5,
      value: this.model.Tc,
      format: v => v.toFixed(0),
      onInput: (v) => {
        if (v >= this.model.Th) return;   // silently ignore invalid
        this.model._Tc = v;
      },
    });
    this.layout.addControl(this._tcSlider);

    this.readouts = new ReadoutPanel([
      { key: 'eta',    label: 'η' },
      { key: 'copHP',  label: 'COP_hp' },
      { key: 'copRef', label: 'COP_ref' },
      { key: 'W',      label: 'W' },
      { key: 'Qh',     label: 'Q_h' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.carnotView.draw(this.model);
    const { model } = this;
    this.readouts.set('eta',    `${(model.eta * 100).toFixed(2)} %`);
    this.readouts.set('copHP',  model.copHeatPump.toFixed(3));
    this.readouts.set('copRef', model.copRefrigerator.toFixed(3));
    this.readouts.set('W',      `${model.W.toFixed(2)} J`);
    this.readouts.set('Qh',     `${model.Qh.toFixed(2)} J`);
  }
}
