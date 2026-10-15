/**
 * OrbitsBench — Kepler two-body orbit with Verlet vs RK4 comparison.
 * Controls: a (AU), e, integrator selector, nOrbits.
 * Readouts: T, v_p, escape speed (Earth surface), Verlet/RK4 energy error.
 */
import { Bench } from '../../../../core/Bench.js';
import { OrbitModel, GM_SUN, GM_EARTH, AU, R_EARTH } from './OrbitModel.js';
import { OrbitsView } from './OrbitsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class OrbitsBench extends Bench {
  static meta = {
    id: 'orbits',
    title: 'Kepler orbits',
    navLabel: 'Kepler orbits',
    canvasLabel: 'Kepler orbit: trajectory and Verlet vs RK4 energy drift',
    level: 'intro',
    keywords: [
      'Kepler', 'orbit', 'ellipse', 'eccentricity', 'Verlet', 'RK4', 'symplectic',
      'energy conservation', 'angular momentum', 'vis-viva', 'period', 'escape speed',
    ],
    related: ['math/dynamics/ode-explorer', 'physics/mechanics/oscillators'],
  };

  static info = {
    formula:
      'T = 2π√(a³/GM)\n' +
      'v² = GM·(2/r − 1/a)  (vis-viva)\n' +
      'v_esc = √(2GM/r)\n' +
      'Verlet: bounded |ΔE/E|; RK4: secular drift',
    predict: [
      'A comet has semi-major axis 4 AU. What is its period (in years)?',
      'Does increasing the eccentricity of an orbit change the period (at fixed a)?',
      'Why does a Verlet integrator keep an orbit stable for hundreds of periods when RK4 does not?',
    ],
    breaks: [
      'Two-body problem only; no N-body perturbations, no general relativistic precession.',
      'Symplectic Verlet is not time-reversible for variable-step integration; use fixed dt.',
      'Point masses; no tidal forces, oblateness, or solar radiation pressure.',
    ],
    derive: [
      { text: 'F = GMm/r²; centripetal: v²/r = GM/r² → v_circ = √(GM/r).' },
      { text: 'Kepler III: ellipse area πab swept at rate L/2; T = 2πab/L with L=√(GMa(1−e²)) → T = 2π√(a³/GM).' },
      { text: 'Vis-viva: energy conservation E = ½v²−GM/r = −GM/(2a) → v²=GM(2/r−1/a).' },
      { text: 'Escape: set E=0 → v_esc = √(2GM/r).' },
    ],
    research: {
      questions: [
        'Why is the Verlet integrator called "symplectic" and why does this matter for long integrations?',
        'What is the Runge-Lenz vector and why is it conserved in the Kepler problem?',
      ],
      challenge: 'Show that the period formula T=2π√(a³/GM) is unchanged when e is varied at fixed a, by computing the area of an ellipse and the angular momentum.',
      papers: [
        { authors: 'J. Kepler', year: 1619, title: 'Harmonices Mundi' },
        { authors: 'IAU Working Group', year: 2015, title: 'IAU 2015 Resolution B3 (nominal solar mass parameter)' },
        { authors: 'IAU', year: 2012, title: 'IAU 2012 Resolution B2 (1 AU = 149 597 870 700 m)' },
      ],
    },
    notePlaceholder: 'Why does Verlet preserve energy better than RK4 over long times?',
  };

  build() {
    this._nOrbits = 50;
    this._a_AU = 1;
    this._e = 0.5;
    this.model = new OrbitModel({ a: AU, e: 0.5, integrator: 'verlet' });
    this.orbitsView = new OrbitsView(this.view);
    this._energyData = null;

    this.layout.setStageNote('Verlet energy error is bounded; RK4 drift grows linearly with orbit count');

    this.layout.addControl(new Slider({
      id: this.controlId('a'),
      label: 'a (AU)',
      min: 0.3, max: 5, step: 0.1,
      value: 1,
      format: v => v.toFixed(1),
      onInput: (v) => { this._a_AU = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('e'),
      label: 'e',
      min: 0, max: 0.95, step: 0.05,
      value: 0.5,
      format: v => v.toFixed(2),
      onInput: (v) => { this._e = v; this._update(); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('nOrbits'),
      label: 'Orbits',
      min: 10, max: 200, step: 10,
      value: 50,
      format: v => v.toFixed(0),
      onInput: (v) => { this._nOrbits = v; this._update(); },
    }));

    this._readout = new ReadoutPanel([
      { id: 'T',     label: 'Period' },
      { id: 'vp',    label: 'v_perihelion' },
      { id: 'vesc',  label: 'v_esc (Earth)' },
      { id: 'verletErr', label: 'Verlet |ΔE/E|' },
      { id: 'rk4Err',    label: 'RK4 |ΔE/E|' },
    ]);
    this.layout.addReadout(this._readout);

    this._update();
  }

  _update() {
    const a = this._a_AU * AU;
    this.model = new OrbitModel({ a, e: this._e });

    const T_days = this.model.period / 86400;
    this._readout.set('T', T_days > 365 ? `${(T_days / 365.25).toFixed(2)} yr` : `${T_days.toFixed(1)} d`);
    this._readout.set('vp', `${(this.model.vPerihelion / 1000).toFixed(2)} km/s`);
    this._readout.set('vesc', `${(Math.sqrt(2 * GM_EARTH / R_EARTH) / 1000).toFixed(3)} km/s`);

    // Run both integrators for nOrbits
    const mV = new OrbitModel({ a, e: this._e, integrator: 'verlet' });
    const mR = new OrbitModel({ a, e: this._e, integrator: 'rk4' });
    mV._dt = mV.period / 500;
    mR._dt = mR.period / 500;

    const { energyErrors: vErrors } = mV.integrateOrbits(this._nOrbits);
    const { energyErrors: rErrors } = mR.integrateOrbits(this._nOrbits);

    this._energyData = { verletErrors: vErrors, rk4Errors: rErrors };

    const lastV = vErrors[vErrors.length - 1];
    const lastR = rErrors[rErrors.length - 1];
    this._readout.set('verletErr', lastV.toExponential(2));
    this._readout.set('rk4Err', lastR.toExponential(2));

    this.orbitsView.draw(this.model, this._energyData);
  }

  draw() { this._update(); }
}
