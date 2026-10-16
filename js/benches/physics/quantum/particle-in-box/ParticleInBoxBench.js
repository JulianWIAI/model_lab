/**
 * ParticleInBoxBench — infinite square well (1D particle in a box).
 */
import { Bench } from '../../../../core/Bench.js';
import { ParticleInBoxModel } from './ParticleInBoxModel.js';
import { ParticleInBoxView } from './ParticleInBoxView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

const EV_J  = 1.602176634e-19;
const H_JS  = 6.62607015e-34;
const C_SI  = 299792458;

export class ParticleInBoxBench extends Bench {
  static meta = {
    id: 'particle-in-box',
    title: 'Particle in a box',
    navLabel: 'Particle in a box',
    canvasLabel: 'Wavefunction ψ_n(x) and energy levels for a 1D infinite square well',
    level: 'intro',
    keywords: [
      'particle in a box', 'infinite square well', 'quantum mechanics', 'wavefunction',
      'energy levels', 'Schrödinger', 'quantum confinement', 'de Broglie',
    ],
    related: [],
  };

  static info = {
    formula:
      'E_n = n²π²ℏ²/(2 m_e L²)\n' +
      'ψ_n(x) = √(2/L) · sin(nπx/L)\n' +
      '⟨x⟩ = L/2    ⟨x²⟩ = L²(1/3 − 1/(2n²π²))',
    predict: [
      'Drag the L slider from 1 nm to 2 nm. By what factor does E₁ change?',
      'Select n=1 and n=2. Is the spacing E₂−E₁ equal to E₃−E₂?',
      'Switch to n=2. What is the probability of finding the particle in the left third of the box?',
    ],
    breaks: [
      'Infinite potential walls: real quantum dots have finite barriers and effective mass m* ≠ m_e.',
      'Single non-interacting electron: Coulomb interactions between electrons ignored.',
      '1D only: 3D box has degenerate levels absent here.',
    ],
    derive: [
      { text: 'Schrödinger: −(ℏ²/2m)(d²ψ/dx²) = Eψ with ψ(0)=ψ(L)=0.' },
      { text: 'General solution: ψ=A sin(kx), boundary → k=nπ/L. Normalise: A=√(2/L).' },
      { text: 'E_n = ℏ²k²/(2m) = n²π²ℏ²/(2mL²). Levels scale as n².' },
      { text: '⟨x⟩=L/2 by parity; ⟨x²⟩ from ∫x²ψ² dx (integrate by parts twice).' },
    ],
    research: {
      questions: [
        'How do energy levels change in a 3D cubic box of side L?',
        'What is the classical limit of ⟨x²⟩ as n→∞?',
      ],
      challenge: 'Show that ⟨x²⟩_n → L²/3 as n→∞, consistent with a uniform distribution.',
      papers: [
        {
          authors: 'D.J. Griffiths',
          year: 1995,
          title: 'Introduction to Quantum Mechanics, §2.2',
          url: 'https://doi.org/10.1017/9781316995433',
        },
      ],
    },
    notePlaceholder: 'Why does E_n scale as n²?',
  };

  build() {
    this.model = new ParticleInBoxModel({ L: 1e-9, n: 1 });
    this.pibView = new ParticleInBoxView(this.view);

    this.layout.setStageNote('ψ_n(x) = √(2/L)·sin(nπx/L)   |   E_n = n²·E₁');

    // n slider 1–5
    this.layout.addControl(new Slider({
      id: this.controlId('n'),
      label: 'n',
      min: 1, max: 5, step: 1,
      value: this.model.n,
      format: v => String(v),
      onInput: (v) => { this.model.n = v; },
    }));

    // L slider 0.1–5 nm (stored in nm, model in m)
    this.layout.addControl(new Slider({
      id: this.controlId('L'),
      label: 'L (nm)',
      min: 0.1, max: 5, step: 0.1,
      value: this.model.L * 1e9,
      format: v => v.toFixed(1),
      onInput: (v) => { this.model.L = v * 1e-9; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'E1',     label: 'E₁' },
      { key: 'En',     label: 'Eₙ' },
      { key: 'ratio',  label: 'Eₙ/E₁' },
      { key: 'photon', label: 'λ(n→n-1)' },
      { key: 'xmean',  label: '⟨x⟩' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.pibView.draw(this.model);
    const { model } = this;
    const E1  = model.energy(1) / EV_J;
    const En  = model.energyEV();
    const ratio = model.n ** 2;   // exact integer

    this.readouts.set('E1',    `${E1.toFixed(4)} eV`);
    this.readouts.set('En',    `${En.toFixed(4)} eV`);
    this.readouts.set('ratio', `${ratio} (= n²)`);

    if (model.n >= 2) {
      const lam = model.photonWavelength() * 1e9;
      this.readouts.set('photon', `${lam.toFixed(1)} nm`);
    } else {
      this.readouts.set('photon', '—');
    }

    const xMean = model.L / 2;
    this.readouts.set('xmean', `${(xMean * 1e9).toFixed(3)} nm`);
  }
}
