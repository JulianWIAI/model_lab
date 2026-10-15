import { Bench } from '../../../../core/Bench.js';
import { ActionButton } from '../../../../ui/ActionButton.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { el } from '../../../../ui/el.js';
import { QUARKS } from './QuarkData.js';
import { HadronBuilder } from './HadronBuilder.js';
import { QuarkView } from './QuarkView.js';

/** Writes a charge like 2/3 as "+2/3", and whole numbers as "+1" or "0". */
function formatCharge(value) {
  const thirds = Math.round(value * 3);
  if (thirds === 0) return '0';
  const sign = thirds > 0 ? '+' : '−';
  return thirds % 3 === 0 ? `${sign}${Math.abs(thirds / 3)}` : `${sign}${Math.abs(thirds)}/3`;
}

/**
 * Quark bench: combine quarks into protons, neutrons, pions and more,
 * and see how little of their mass the quarks themselves provide.
 */
export class QuarkBench extends Bench {
  static meta = {
    id: 'quarks',
    title: 'Building hadrons from quarks',
    navLabel: 'Quarks',
    canvasLabel: 'Quarks joined by gluon flux tubes',
    level: 'university',
    keywords: ['quarks', 'hadrons', 'proton', 'neutron', 'pion', 'kaon', 'QCD', 'color charge', 'gluon', 'baryon', 'meson'],
    related: ['physics/pendulum'],
  };

  static info = {
    formula:
      'charge:  u = +2/3    d = s = −1/3\n' +
      'baryon = q q q      meson = q q̄\n\n' +
      'proton  uud:  2/3 + 2/3 − 1/3 = +1\n' +
      'neutron udd:  2/3 − 1/3 − 1/3 =  0\n\n' +
      'E = m·c²   binding energy counts as mass',
    predict: [
      'Proton (uud) and neutron (udd) differ by one quark. How different are their masses?',
      'Quark charges come in thirds. Why does every particle you can build end up with a whole-number charge?',
      'Guess what fraction of a proton’s mass comes from its three quarks before you build one.',
    ],
    breaks: [
      '“Three quarks” is a cartoon. Inside a proton is a boiling sea of gluons and short-lived quark–antiquark pairs.',
      'The proton (uud) and the Δ⁺ (also uud) cannot be told apart here: this model ignores spin, which decides which one you get.',
    ],
    derive: [
      { text: 'In the 1950s and 60s, accelerators found dozens of “elementary” particles. Gell-Mann and Zweig noticed they fit symmetric patterns of eight and ten.' },
      { text: 'The patterns follow automatically if these particles are built from three kinds of smaller objects with charges in thirds.', formula: 'u = +2/3   d = −1/3   s = −1/3' },
      { text: 'The Δ⁺⁺ (uuu) has three identical quarks with aligned spins, which the Pauli principle forbids. The fix: a new three-valued property called colour. Each quark in a baryon carries a different colour, and the total is colourless.' },
      { text: 'The colour force (quantum chromodynamics) grows with distance like a stretched rubber band. Pull hard enough and the energy creates a new quark–antiquark pair instead of a free quark. This is confinement.' },
      { text: 'Mass and energy are the same thing. The energy in the gluon field and the quarks’ motion is most of the proton’s mass. Supercomputer calculations (lattice QCD) reproduce it from the theory within a few percent.', formula: 'm_proton ≈ 938 MeV   quarks ≈ 9 MeV' },
    ],
    research: {
      questions: [
        'Why is the neutron slightly heavier than the proton, and what would the universe look like if it were the other way round?',
        'Proton and Δ⁺ are both uud. What exactly is different between them?',
      ],
      challenge: 'Add the charm quark (c, +2/3, about 1270 MeV) and the J/ψ meson (cc̄, 3097 MeV). What fraction of its mass do the quarks provide now, and why are heavy quarks different?',
      papers: [
        { authors: 'M. Gell-Mann', year: 1964, title: 'A schematic model of baryons and mesons' },
        { authors: 'G. Zweig', year: 1964, title: 'An SU(3) model for strong interaction symmetry and its breaking' },
        { authors: 'O. W. Greenberg', year: 1964, title: 'Spin and unitary-spin independence in a paraquark model of baryons and mesons' },
        { authors: 'S. Dürr et al.', year: 2008, title: 'Ab initio determination of light hadron masses' },
      ],
    },
    notePlaceholder: 'Most of my mass comes from…',
  };

  build() {
    this.builder = new HadronBuilder();
    this.time = 0;
    this.quarkView = new QuarkView(this.view);

    this.modeGroup = new ButtonGroup({
      label: 'Particle family',
      value: 'baryon',
      options: [
        { value: 'baryon', label: '3 quarks' },
        { value: 'meson', label: 'Quark + antiquark' },
      ],
      onChange: (mode) => { this.builder.setMode(mode); this.refresh(); },
    });
    this.layout.addAction(this.modeGroup);

    this.readouts = new ReadoutPanel([
      { key: 'name', label: 'Particle' },
      { key: 'charge', label: 'Charge' },
      { key: 'bare', label: 'Bare quark mass' },
      { key: 'mass', label: 'Measured mass' },
      { key: 'share', label: 'Mass from quarks' },
    ]);
    this.layout.setReadouts(this.readouts);

    // One button per quark; disabled when it would make an invalid combination.
    this.quarkButtons = Object.keys(QUARKS).map((symbol) => {
      const button = new ActionButton({
        label: `${symbol}  ${formatCharge(QUARKS[symbol].charge)}`,
        onClick: () => { this.builder.add(symbol); this.refresh(); },
      });
      button.symbol = symbol;
      return button;
    });
    this.layout.addControl(el('div', { class: 'row' }, this.quarkButtons.map((b) => b.element)));
    this.layout.addControl(el('div', { class: 'row' }, [
      new ActionButton({ label: 'Clear', onClick: () => { this.builder.clear(); this.refresh(); } }).element,
      new ActionButton({ label: 'Load proton', onClick: () => this.loadProton() }).element,
    ]));
    this.layout.addHint('Solid circles are quarks, rings are antiquarks. Masses in MeV (938 MeV ≈ one proton).');

    this.loadProton();
  }

  loadProton() {
    this.modeGroup.setValue('baryon');
    this.builder.setMode('baryon');
    ['u', 'u', 'd'].forEach((s) => this.builder.add(s));
    this.refresh();
  }

  /** Updates buttons and readouts after any change. */
  refresh() {
    const b = this.builder;
    for (const button of this.quarkButtons) button.disabled = !b.canAdd(button.symbol);

    const particle = b.identify();
    const missing = b.capacity - b.slots.length;
    this.readouts.set('name', b.complete ? (particle ? particle.name : 'unnamed state') : `add ${missing} more`);
    this.readouts.set('charge', b.slots.length ? formatCharge(b.charge) : '–');
    this.readouts.set('bare', b.slots.length ? `${b.bareMass.toFixed(1)} MeV` : '–');
    this.readouts.set('mass', particle ? `${particle.mass.toFixed(1)} MeV` : '–');
    this.readouts.set('share', particle ? `${((b.bareMass / particle.mass) * 100).toFixed(1)}%` : '–');
    this.layout.setStageNote(particle ? particle.note : '');
  }

  update(dt) {
    this.time += dt;
  }

  draw() {
    this.quarkView.draw(this.builder, this.time, this.reduceMotion);
  }
}
