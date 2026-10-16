/**
 * PhasePlaneBench — 2D linear/nonlinear dynamical system explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { PhasePlaneModel } from './PhasePlaneModel.js';
import { PhasePlaneView } from './PhasePlaneView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class PhasePlaneBench extends Bench {
  static meta = {
    id: 'phase-plane',
    title: 'Phase plane',
    navLabel: 'Phase plane',
    canvasLabel: 'τ-Δ classification diagram and phase portrait for a 2D system',
    level: 'university',
    keywords: [
      'phase plane', 'dynamical systems', 'eigenvalues', 'stability', 'trace',
      'determinant', 'spiral', 'saddle', 'node', 'center', 'Strogatz',
    ],
    related: [],
  };

  static info = {
    formula:
      'ẋ = Ax,  τ=tr(A),  Δ=det(A),  disc=τ²−4Δ\n' +
      'Δ<0: Saddle  |  τ=0,Δ>0: Center\n' +
      'disc<0: Spiral  |  disc>0: Node\n' +
      'τ<0: stable  |  τ>0: unstable',
    predict: [
      'Move to saddle region (Δ<0). Do trajectories spiral or diverge?',
      'Set τ=0, Δ>0 (center). Nudge τ slightly negative — what happens?',
      'Activate nonlinear (μ<0 stable). Does orbit spiral in or reach a limit cycle?',
    ],
    breaks: [
      'Centers (τ=0) are structurally unstable: any nonlinear term changes them.',
      'Hartman-Grobman does not apply to non-hyperbolic fixed points.',
      'Only 2D: 3D systems can exhibit chaos absent in 2D.',
    ],
    derive: [
      { text: 'ẋ=Ax; ansatz x=e^{λt}v → λ²−τλ+Δ=0.' },
      { text: 'disc>0: two real eigenvalues (node/saddle); disc<0: complex (spiral/center).' },
      { text: 'Re(λ)=τ/2 determines stability; Δ=λ₁λ₂ determines saddle vs node.' },
      { text: 'Nonlinear ṙ=μr³: exact r(t)=r₀/√(1−2μr₀²t).' },
    ],
    research: {
      questions: [
        'What is the Hartman-Grobman theorem and when does it fail?',
        'How does a Hopf bifurcation appear in the τ-Δ plane?',
      ],
      challenge: 'Show that a center (τ=0) can become a spiral under a small nonlinear perturbation.',
      papers: [
        {
          authors: 'S.H. Strogatz',
          year: 1994,
          title: 'Nonlinear Dynamics and Chaos §5.2',
          url: 'https://doi.org/10.1201/9780429492563',
        },
      ],
    },
    notePlaceholder: 'What determines whether a spiral is stable or unstable?',
  };

  build() {
    this.model     = new PhasePlaneModel({ A: [[-1, -1], [1, -1]], mu: 0 });
    this.ppView    = new PhasePlaneView(this.view);

    this.layout.setStageNote('τ = tr(A)   Δ = det(A)   disc = τ²−4Δ');

    // Matrix entries: a, b, c, d
    for (const [key, label, initVal] of [
      ['a', 'A[0][0]', -1], ['b', 'A[0][1]', -1],
      ['c', 'A[1][0]',  1], ['d', 'A[1][1]', -1],
    ]) {
      this.layout.addControl(new Slider({
        id: this.controlId(key),
        label,
        min: -3, max: 3, step: 0.1,
        value: initVal,
        format: v => v.toFixed(1),
        onInput: (v) => {
          const A = this.model.A.map(r => [...r]);
          if (key === 'a') A[0][0] = v;
          if (key === 'b') A[0][1] = v;
          if (key === 'c') A[1][0] = v;
          if (key === 'd') A[1][1] = v;
          this.model.A = A;
        },
      }));
    }

    this.layout.addControl(new Slider({
      id: this.controlId('mu'),
      label: 'μ (nonlinear)',
      min: -1, max: 1, step: 0.05,
      value: 0,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.mu = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'tau',    label: 'τ' },
      { key: 'det',    label: 'Δ' },
      { key: 'disc',   label: 'disc' },
      { key: 'eig',    label: 'λ₁,λ₂' },
      { key: 'class',  label: 'type' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.ppView.draw(this.model);
    const { model } = this;
    const { real, imag } = model.eigenvalues;
    const fmtEig = (r, im) =>
      Math.abs(im) < 1e-10
        ? r.toFixed(3)
        : `${r.toFixed(2)}±${Math.abs(im).toFixed(2)}i`;

    this.readouts.set('tau',   model.tau.toFixed(4));
    this.readouts.set('det',   model.det.toFixed(4));
    this.readouts.set('disc',  model.disc.toFixed(4));
    this.readouts.set('eig',   fmtEig(real[0], imag[0]));
    this.readouts.set('class', model.classification);
  }
}
