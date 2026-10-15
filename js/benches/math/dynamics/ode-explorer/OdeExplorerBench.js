/**
 * OdeExplorerBench — interactive ODE integrator explorer.
 * Controls: preset selector, method selector, h slider.
 * Readouts: convergence order, stability status.
 */
import { Bench } from '../../../../core/Bench.js';
import { OdeExplorerModel } from './OdeExplorerModel.js';
import { OdeExplorerView } from './OdeExplorerView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class OdeExplorerBench extends Bench {
  static meta = {
    id: 'ode-explorer',
    title: 'ODE explorer',
    navLabel: 'ODE explorer',
    canvasLabel: 'Numerical ODE integrators: solution curve and convergence',
    level: 'intro',
    keywords: [
      'ODE', 'Euler', 'Runge-Kutta', 'RK4', 'numerical integration', 'stability',
      'stiff', 'convergence', 'order', 'logistic', 'backward Euler',
    ],
    related: ['physics/mechanics/orbits', 'physics/electromagnetism/rc-circuit'],
  };

  static info = {
    formula:
      'Euler:         y_{n+1} = y_n + h·f(y_n, t_n)   O(h)\n' +
      'Heun:          predictor-corrector              O(h²)\n' +
      'RK4:           4-stage weighted average         O(h⁴)\n' +
      'Backward Euler: implicit, Newton iteration      O(h)\n' +
      'RK4 stable for λh < 2.785; Euler stable for λh < 2',
    predict: [
      'What happens to Euler\'s solution of y\'=−y when you set h=2.5? Why?',
      'If you double h, how does RK4\'s error change compared to Euler\'s error?',
      'At λ=1000, what is the largest step size RK4 can use without diverging?',
    ],
    breaks: [
      'Only scalar ODEs shown; systems (predator–prey) need vector y — not modelled here.',
      'Fixed-step methods only; adaptive step-size control (RKF45, DOPRI) not shown.',
      'Stability analysis is for linear problems; nonlinear stability is more complex.',
      'Backward Euler uses Newton iteration; may fail to converge for very nonlinear f.',
    ],
    derive: [
      { text: 'Euler: y_{n+1} = y_n + h·f(y_n) — first-order Taylor expansion of y(t+h).' },
      { text: 'Global error ≈ O(h) because each step accumulates O(h²) local truncation error over O(1/h) steps.' },
      { text: 'RK4 uses four derivative samples; matches Taylor through order 4 → global error O(h⁴).' },
      { text: 'Stability: y_{n+1} = (1+z)·y_n for Euler (z=−λh); |1+z|<1 iff −2<z<0, i.e. 0<λh<2.' },
      { text: 'Backward Euler: y_{n+1} = y_n/(1+λh); |y_{n+1}/y_n| = 1/(1+λh) < 1 for all λh>0 — unconditionally stable.' },
    ],
    research: {
      questions: [
        'Why does RK4 have a larger stability region than Euler on the imaginary axis?',
        'How do adaptive step-size methods like Dormand–Prince choose their step size?',
      ],
      challenge: 'Show algebraically that the RK4 stability polynomial p(z) = 1+z+z²/2+z³/6+z⁴/24 satisfies |p(z)| < 1 for all z ∈ (−2.785, 0).',
      papers: [
        { authors: 'L. Euler', year: 1768, title: 'Institutionum Calculi Integralis' },
        { authors: 'C. Runge', year: 1895, title: 'Ueber die numerische Auflösung von Differentialgleichungen', journal: 'Math. Ann. 46, 167–178' },
        { authors: 'W. Kutta', year: 1901, title: 'Beitrag zur näherungsweisen Integration totaler Differentialgleichungen', journal: 'Z. Math. Phys. 46, 435–453' },
      ],
    },
    notePlaceholder: 'Why does the stability region of RK4 extend further than Euler on the real axis?',
  };

  build() {
    this.model = new OdeExplorerModel({ preset: 'decay', method: 'rk4', h: 0.1 });
    this.odeView = new OdeExplorerView(this.view);

    this.layout.setStageNote('RK4 is stable for λh < 2.785; Euler diverges for λh > 2');

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Equation',
      options: [
        { label: "y'=−y", value: 'decay' },
        { label: "y'=y", value: 'growth' },
        { label: 'logistic', value: 'logistic' },
        { label: 'stiff', value: 'stiff' },
      ],
      value: 'decay',
      onChange: (v) => { this.model.preset = v; this._update(); },
    }));

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('method'),
      label: 'Method',
      options: [
        { label: 'Euler', value: 'euler' },
        { label: 'Heun', value: 'heun' },
        { label: 'RK4', value: 'rk4' },
        { label: 'Bwd Euler', value: 'backwardEuler' },
      ],
      value: 'rk4',
      onChange: (v) => { this.model.method = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('h'),
      label: 'h (step size)',
      min: 0.005, max: 0.5, step: 0.005,
      value: this.model.h,
      format: v => v.toFixed(3),
      onInput: (v) => { this.model.h = v; this._update(); },
    }));

    this._readout = new ReadoutPanel([
      { id: 'slope', label: 'Obs. order' },
      { id: 'error', label: 'Error at t=1' },
      { id: 'stable', label: 'Status at λh' },
    ]);
    this.layout.addReadout(this._readout);

    this._update();
  }

  _update() {
    if (this.model.method !== 'backwardEuler') {
      const { slope, errors } = this.model.convergence();
      this._readout.set('slope', slope.toFixed(2));
      this._readout.set('error', errors[1].toExponential(2));
    } else {
      this._readout.set('slope', 'n/a');
      this._readout.set('error', 'n/a');
    }
    const lh = this.model.lambda * this.model.h;
    const limit = OdeExplorerModel.rk4StabilityLimit();
    const stable = this.model.method === 'euler' ? lh < 2
      : this.model.method === 'rk4' ? lh < limit
      : true;
    this._readout.set('stable', stable ? 'stable' : 'UNSTABLE');
    this.odeView.draw(this.model);
  }

  onFrame() { /* static display, no animation needed */ }
}
