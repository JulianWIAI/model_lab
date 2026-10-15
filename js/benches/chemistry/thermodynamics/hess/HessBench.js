/**
 * HessBench — Hess's law controls and layout.
 */
import { Bench } from '../../../../core/Bench.js';
import { HessModel, REACTIONS } from './HessModel.js';
import { HessView } from './HessView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class HessBench extends Bench {
  static meta = {
    id: 'hess', title: 'Hess\'s law', navLabel: 'Hess\'s law',
    canvasLabel: 'Enthalpy level diagram',
    level: 'intro',
    keywords: ['Hess', 'enthalpy', 'formation enthalpy', 'thermochemistry', 'combustion', 'Hess\'s law', 'ΔH'],
    related: ['chemistry/gibbs'],
  };

  build() {
    this.model = new HessModel(0);
    this.hessView = new HessView(this.view);

    // Reaction selector
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('reaction'),
      label: 'Reaction',
      options: REACTIONS.map((rxn, i) => ({ label: rxn.name, value: i })),
      value: 0,
      onChange: v => { this.model.reactionIndex = Number(v); },
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'dH',   label: 'ΔH° (kJ/mol)' },
      { key: 'type', label: 'Type' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.hessView.draw(this.model);
    const dH = this.model.deltaH();
    this.readouts.set('dH',   dH.toFixed(2));
    this.readouts.set('type', dH < 0 ? 'exothermic' : 'endothermic');
  }
}
