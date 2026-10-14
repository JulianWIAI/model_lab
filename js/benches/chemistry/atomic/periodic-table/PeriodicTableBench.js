/**
 * PeriodicTableBench — interactive periodic table explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { PeriodicTableModel } from './PeriodicTableModel.js';
import { PeriodicTableView } from './PeriodicTableView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';

export class PeriodicTableBench extends Bench {
  static meta = {
    id: 'periodic-table',
    title: 'Periodic table',
    navLabel: 'Periodic table',
    canvasLabel: 'Periodic properties of the elements',
    isExplorer: true,
    level: 'intro',
    keywords: [
      'periodic table', 'elements', 'electronegativity', 'atomic radius',
      'ionization energy', 'electron configuration', 'Aufbau', 'periodic trends',
      'metals', 'nonmetals', 'noble gases', 'lanthanides', 'actinides',
    ],
    related: ['chemistry/orbitals', 'chemistry/equilibrium'],
  };

  static info = {
    formula: 'Aufbau order: 1s 2s 2p 3s 3p 4s 3d … | E_1 = 13.6 eV/n²',
    predict: [
      'Which element has the highest electronegativity?',
      'Why does atomic radius decrease across a period?',
      'What makes the ionization energy of noble gases so high?',
    ],
    breaks: [
      'Aufbau model fails for ~20 transition metal exceptions (Cr, Cu, Nb, Mo …).',
      'Only first ionization energies are shown; second and beyond are not included.',
      'f-block elements are shown in two extra rows; their group numbers are not standard.',
    ],
    derive: [
      { text: 'Electrons fill subshells in order of increasing n+l, then n (Madelung rule).', formula: '1s 2s 2p 3s 3p 4s 3d 4p 5s 4d …' },
      { text: 'Electronegativity (Pauling scale) measures an atom\'s pull on shared electrons.' },
      { text: 'First ionization energy = minimum energy to remove one electron from a neutral gas-phase atom.' },
    ],
    research: {
      questions: [
        'Why does Cr prefer 3d⁵ 4s¹ over 3d⁴ 4s²?',
        'What is the next noble gas beyond oganesson (Z=118)?',
      ],
      challenge: 'Plot ionization energy vs Z and explain the dips at B, Al (full s²) and O, S (half-filled p³ broken).',
      papers: [
        { authors: 'D. I. Mendeleev', year: 1869, title: 'Über die Beziehungen der Eigenschaften zu den Atomgewichten der Elemente' },
        { authors: 'G. N. Lewis', year: 1916, title: 'The Atom and the Molecule' },
      ],
    },
    notePlaceholder: 'Note periodic trends across periods and down groups…',
  };

  build() {
    this.model = new PeriodicTableModel();
    this.tableView = new PeriodicTableView(this.view);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('property'),
      label: 'Property',
      options: [
        { label: 'Electronegativity', value: 'electronegativity' },
        { label: 'Atomic radius', value: 'atomicRadius' },
        { label: 'Ionization E', value: 'ionizationEnergy' },
      ],
      value: 'electronegativity',
      onChange: (v) => { this.model.property = v; },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('view'),
      label: 'View',
      options: [
        { label: 'Table', value: 'table' },
        { label: 'Trend', value: 'trend' },
      ],
      value: 'table',
      onChange: (v) => { this.tableView.showTrend = v === 'trend'; },
    }));
  }

  update(_dt) {}

  draw() {
    this.tableView.draw(this.model);
    if (this.model.selected) {
      const el = this.model.byZ(this.model.selected);
      if (el) {
        this.layout.setReadout('name', el.name);
        this.layout.setReadout('symbol', el.symbol);
        this.layout.setReadout('Z', String(el.Z));
        this.layout.setReadout('config', this.model.aufbauConfig(el.Z));
      }
    }
  }
}
