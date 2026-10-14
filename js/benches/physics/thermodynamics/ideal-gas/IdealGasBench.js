/**
 * IdealGasBench — 3D ideal-gas particle simulation projected onto 2D.
 * Demonstrates P = NkT/V and ⟨KE⟩ = 3/2 kT.
 */
import { Bench } from '../../../../core/Bench.js';
import { IdealGasModel } from './IdealGasModel.js';
import { IdealGasView } from './IdealGasView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

const DT   = 0.005;   // simulation time step
const STEPS_PER_FRAME = 4;
const P_RESET_INTERVAL = 2.0;   // seconds of simulation time between pressure resets

export class IdealGasBench extends Bench {
  static meta = {
    id: 'ideal-gas',
    title: 'Ideal gas simulation',
    navLabel: 'Ideal gas',
    canvasLabel: 'Particle simulation — XY projection (3D), coloured by speed',
    level: 'university',
    keywords: [
      'ideal gas', 'kinetic theory', 'equipartition', 'Maxwell-Boltzmann',
      'pressure', 'temperature', 'particle simulation', 'Boltzmann', 'PV=NkT',
    ],
    related: ['physics/maxwell-boltzmann', 'chemistry/equilibrium'],
  };

  static info = {
    formula:
      'P·V = N·k_B·T\n' +
      '⟨KE⟩ = (3/2)·k_B·T\n' +
      'Simulation: reduced units (k_B = 1, m = 1)\n' +
      'k_B = 1.380 649 × 10⁻²³ J K⁻¹ (NIST CODATA 2018, exact)',
    predict: [
      'If you double T, how does P change (at fixed N and V)?',
      'If you double N, how does P change?',
      'Which particles are coloured red? Which are blue?',
    ],
    breaks: [
      'Reduced units: k_B = 1, m = 1. The displayed "temperature" is in units of k_B·K.',
      'No inter-particle collisions — this is an ideal (non-interacting) gas.',
      'Pressure is estimated from the ideal gas law P = N·T/V; direct measurement from wall impulse is also shown.',
      '2D projection: all particles are drawn on the XY plane regardless of z; depth shown by opacity.',
    ],
    derive: [
      { text: 'Each particle has 3 translational degrees of freedom. Equipartition: each contributes (1/2)k_BT, giving ⟨KE⟩ = (3/2)k_BT.' },
      { text: 'Pressure is force per area; force is rate of momentum transfer to walls. For elastic reflections, each wall collision transfers 2m|v_⊥|. Summing over all particles reproduces P = NkT/V.' },
    ],
    research: {
      questions: [
        'At what pressure and temperature does a real gas deviate significantly from PV = NkT? (Hint: van der Waals equation)',
        'How does the speed distribution of the particles relate to the Maxwell–Boltzmann distribution?',
      ],
      challenge: 'Derive P = NkT/V from the kinetic theory by computing the time-averaged force on one wall.',
      papers: [
        { authors: 'C. Kittel & H. Kroemer', year: 1980, title: 'Thermal Physics, 2nd ed. (Chapter 3)', url: 'https://doi.org/10.1119/1.13516' },
      ],
    },
    notePlaceholder: 'How does the pressure change as you increase T? Is the relationship linear?',
  };

  build() {
    this._T  = 1.0;
    this._N  = 80;
    this.model    = new IdealGasModel({ N: this._N, L: 1.0, T: this._T });
    this.gasView  = new IdealGasView(this.view);
    this._simTime = 0;
    this._lastPReset = 0;

    this.layout.addControl(new Slider({
      id: this.controlId('temp'),
      label: 'Temperature T',
      min: 0.2, max: 5.0, step: 0.1,
      value: this._T,
      format: (v) => v.toFixed(1),
      onInput: (v) => {
        this._T = v;
        this.model.setTemperature(v);
      },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'T',     label: 'T (measured)' },
      { key: 'P',     label: 'P = NkT/V' },
      { key: 'KE',    label: '⟨KE⟩/particle' },
      { key: 'vmax',  label: 'v_rms' },
    ]);
    this.layout.setReadouts(this.readouts);
    this.layout.setStageNote('Reduced units: k_B = 1, m = 1, L = 1. No particle–particle interactions.');
  }

  update(_dt) {
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      this.model.step(DT);
    }
    this._simTime += DT * STEPS_PER_FRAME;
    if (this._simTime - this._lastPReset > P_RESET_INTERVAL) {
      this.model.resetPressure();
      this._lastPReset = this._simTime;
    }
  }

  draw() {
    const T   = this.model.temperatureMeasured;
    const vRms = Math.sqrt(3 * T);   // v_rms = sqrt(3 k_B T / m)
    const KE  = this.model.totalKE / this.model.N;

    this.gasView.draw(this.model, vRms * 1.5);

    this.readouts.set('T',    T.toFixed(3));
    this.readouts.set('P',    this.model.pressureFormula.toFixed(3));
    this.readouts.set('KE',   `${KE.toFixed(3)}  (= 3/2·T = ${(1.5 * T).toFixed(3)})`);
    this.readouts.set('vmax', vRms.toFixed(3));
  }
}
