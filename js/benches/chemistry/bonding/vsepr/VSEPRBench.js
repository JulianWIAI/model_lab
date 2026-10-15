/**
 * VSEPRBench — VSEPR geometry selection and 3D view controls.
 */
import { Bench } from '../../../../core/Bench.js';
import { VSEPRModel } from './VSEPRModel.js';
import { VSEPRView } from './VSEPRView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class VSEPRBench extends Bench {
  static meta = {
    id: 'vsepr', title: 'VSEPR geometry', navLabel: 'VSEPR',
    canvasLabel: 'Rotate molecule with mouse drag',
    level: 'intro',
    keywords: ['VSEPR', 'molecular geometry', 'bond angle', 'lone pair', 'electron pair repulsion', 'tetrahedral', 'octahedral', 'linear'],
    related: ['chemistry/orbitals', 'chemistry/periodic-table'],
  };

  build() {
    this.model = new VSEPRModel('AX4');
    this.vseprView = new VSEPRView(this.view);

    // Geometry selector
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('geom'),
      label: 'Geometry',
      options: VSEPRModel.geometries.map(g => ({ label: g.type, value: g.type })),
      value: 'AX4',
      onChange: v => {
        this.model.geometry = v;
        this.model.resetRotation();
        this._updateStageNote();
      },
    }));

    // Readouts
    this.readouts = new ReadoutPanel([
      { key: 'name',    label: 'Geometry' },
      { key: 'steric',  label: 'Steric no.' },
      { key: 'ideal',   label: 'Ideal angle' },
      { key: 'real',    label: 'Real angle' },
    ]);
    this.layout.setReadouts(this.readouts);

    this._updateStageNote();
  }

  _updateStageNote() {
    const g = this.model.geometry;
    if (g.type === 'AX2E2') {
      this.layout.setStageNote('H₂O: real angle 104.5° vs ideal 109.5°');
    } else if (g.type === 'AX3E') {
      this.layout.setStageNote('NH₃: real 107° vs ideal 109.5°');
    } else {
      this.layout.setStageNote('');
    }
  }

  update(_dt) {}

  draw() {
    this.vseprView.draw(this.model);
    const g = this.model.geometry;
    this.readouts.set('name',   g.name);
    this.readouts.set('steric', g.stericNumber.toString());
    this.readouts.set('ideal',  `${g.idealAngle}°`);
    this.readouts.set('real',   g.realAngle !== null ? `${g.realAngle}°` : '—');
  }
}
