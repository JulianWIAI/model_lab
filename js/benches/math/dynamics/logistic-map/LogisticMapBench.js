/**
 * LogisticMapBench — logistic map bifurcation and chaos.
 * Controls: r slider, x0 slider. Readouts: λ, fixed point, period.
 */
import { Bench } from '../../../../core/Bench.js';
import { LogisticMapModel } from './LogisticMapModel.js';
import { LogisticMapView } from './LogisticMapView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class LogisticMapBench extends Bench {
  static meta = {
    id: 'logistic-map',
    title: 'Logistic map',
    navLabel: 'Logistic map',
    canvasLabel: 'Logistic map: bifurcation diagram and cobweb',
    level: 'university',
    keywords: [
      'logistic map', 'chaos', 'bifurcation', 'period doubling', 'Feigenbaum',
      'Lyapunov exponent', 'attractor', 'cobweb', 'fixed point', 'orbit',
    ],
    related: ['math/dynamics/ode-explorer', 'math/probability/central-limit'],
  };

  static info = {
    formula:
      'x_{n+1} = r·x_n·(1−x_n)\n' +
      'x* = 1−1/r   stable for 1<r<3\n' +
      'λ = (1/N)·Σ ln|r(1−2x_n)|',
    predict: [
      'At r=3.2, does the map settle to one fixed point or two?',
      'For r=4, the Lyapunov exponent equals ln2. What does this mean for two trajectories starting 10⁻¹⁰ apart?',
      'At r=3.83, can you find a stable 3-cycle by iterating from x=0.5?',
    ],
    breaks: [
      '1D map only; higher-dimensional maps have richer bifurcation structures.',
      'Feigenbaum constant δ≈4.6692 is universal across unimodal maps; this bench shows the logistic map specifically.',
      'r > 4: map is no longer self-mapping on [0,1]; trajectories escape — domain banner shown.',
      'Bifurcation diagram resolution depends on nR; very thin windows may not be visible.',
    ],
    derive: [
      { text: 'Fixed point: x*=r·x*(1−x*) → x*(1−r+rx*)=0 → x*=1−1/r.' },
      { text: 'Stability: f\'(x*)=r(1−2x*)=r(1−2+2/r)=2−r; stable iff |2−r|<1, i.e. 1<r<3.' },
      { text: 'Period-2: solve f(f(x))=x, factor out fixed points → quadratic in remaining factor.' },
      { text: 'Period-doubling cascade: superstable parameter R_n found by f^(2^n)(½)=½; ratios converge to δ.' },
      { text: 'r=4: x_n=sin²(2^n·arcsin(√x_0)); λ = E[ln|4(1−2x)|] = ln4−ln2 = ln2.' },
    ],
    research: {
      questions: [
        'What is the connection between the Feigenbaum constant and universality in period-doubling cascades?',
        'Why does the Cauchy distribution have infinite variance — and what does this have to do with the logistic map at r=4?',
      ],
      challenge: 'Show that at r=4, the substitution x_n=sin²(θ_n) transforms the logistic map into θ_{n+1}=2θ_n (angle doubling), and derive the Lyapunov exponent λ=ln2.',
      papers: [
        { authors: 'R.M. May', year: 1976, title: 'Simple mathematical models with very complicated dynamics', journal: 'Nature 261:459–467', url: 'https://doi.org/10.1038/261459a0' },
        { authors: 'M.J. Feigenbaum', year: 1978, title: 'Quantitative universality for a class of nonlinear transformations', journal: 'J.Stat.Phys. 19:25–52', url: 'https://doi.org/10.1007/BF01020332' },
        { authors: 'T.Y. Li & J.A. Yorke', year: 1975, title: 'Period three implies chaos', journal: 'Am.Math.Monthly 82:985–992', url: 'https://doi.org/10.2307/2318254' },
      ],
    },
    notePlaceholder: 'What is the Lyapunov exponent at r=3.57 (just before chaos)?',
  };

  build() {
    this.model = new LogisticMapModel({ r: 3.5, x0: 0.5, N: 10000 });
    this.mapView = new LogisticMapView(this.view);

    this.layout.setStageNote('Period-doubling cascade: r=3 (2-cycle), r≈3.449 (4-cycle), r≈3.544 (8-cycle), r≈3.569 (chaos)');

    this.layout.addControl(new Slider({
      id: this.controlId('r'),
      label: 'r',
      min: 0, max: 4, step: 0.001,
      value: 3.5,
      format: v => v.toFixed(3),
      onInput: (v) => { this.model.r = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('x0'),
      label: 'x₀',
      min: 0.01, max: 0.99, step: 0.01,
      value: 0.5,
      format: v => v.toFixed(2),
      onInput: (v) => { this.model.x0 = v; this._update(); },
    }));

    this._readout = new ReadoutPanel([
      { id: 'lyapunov', label: 'λ (Lyapunov)' },
      { id: 'fixedPoint', label: 'x*' },
      { id: 'stable', label: 'Fixed pt stable?' },
      { id: 'domain', label: 'Domain' },
    ]);
    this.layout.addReadout(this._readout);
    this._update();
  }

  _update() {
    const m = this.model;
    const lam = m.lyapunov(5000, m.x0);
    this._readout.set('lyapunov', isNaN(lam) ? 'n/a' : lam.toFixed(4));
    this._readout.set('fixedPoint', m.r > 1 ? m.fixedPoint.toFixed(4) : '0');
    this._readout.set('stable', m.r > 1 && m.r < 3 ? 'yes' : 'no');
    this._readout.set('domain', m.r > 4 ? 'OUTSIDE [0,4]' : 'ok');
    this.mapView.draw(m);
  }

  draw() { this._update(); }
}
