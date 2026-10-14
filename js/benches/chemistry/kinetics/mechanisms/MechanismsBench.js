/**
 * MechanismsBench — consecutive first-order reactions A→B→C (Bateman equations).
 */
import { Bench } from '../../../../core/Bench.js';
import { MechanismsModel } from './MechanismsModel.js';
import { MechanismsView } from './MechanismsView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ToggleButton } from '../../../../ui/ToggleButton.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class MechanismsBench extends Bench {
  static meta = {
    id: 'mechanisms',
    title: 'Consecutive reactions A→B→C',
    navLabel: 'A→B→C',
    canvasLabel: '[A], [B], [C] vs time — Bateman equations',
    level: 'university',
    keywords: [
      'consecutive reactions', 'series reactions', 'Bateman', 'intermediate',
      'steady-state approximation', 'SSA', 'rate constant', 'kinetics', 'mechanism',
    ],
    related: ['chemistry/rate-laws', 'chemistry/equilibrium'],
  };

  static info = {
    formula:
      '[A](t) = [A]₀ · e^(−k₁t)\n' +
      '[B](t) = [A]₀ · k₁/(k₂−k₁) · (e^(−k₁t) − e^(−k₂t))\n' +
      '[C](t) = [A]₀ − [A] − [B]\n' +
      't_max  = ln(k₂/k₁) / (k₂ − k₁)',
    predict: [
      'What happens to the peak height of [B] as k₂ increases relative to k₁?',
      'When does the steady-state approximation for [B] break down?',
      'If k₁ >> k₂, which step is rate-determining? Which species accumulates?',
    ],
    breaks: [
      'Exact only for elementary first-order steps (no reversibility, no side reactions).',
      'The SSA for [B] requires k₂ >> k₁ — check this before applying.',
      'The formula for [B] is indeterminate at k₁ = k₂; the model uses the limiting form k·t·e^(−kt) in that case.',
      'Real enzyme or catalytic cycles may involve bimolecular steps not covered here.',
    ],
    derive: [
      { text: 'The system dA/dt = −k₁A, dB/dt = k₁A − k₂B, dC/dt = k₂B is solved exactly by the integrating-factor method (Bateman 1910).', },
      { text: 't_max comes from d[B]/dt = 0: k₁[A] = k₂[B] at the maximum — the rates of formation and consumption of B are equal.' },
      { text: 'SSA sets d[B]/dt ≈ 0: [B]_ss = (k₁/k₂)·[A]. Valid when k₂ >> k₁ and the transient e^(−k₂t) has decayed.' },
    ],
    research: {
      questions: [
        'For a radioactive decay chain (e.g. ²³⁸U→²³⁴Th→²³⁴Pa), what is "secular equilibrium"?',
        'Why does the steady-state approximation underestimate [B] at early times but overestimate at late times?',
      ],
      challenge: 'Extend the Bateman solution to a three-step chain A→B→C→D and derive [B](t) and [C](t).',
      papers: [
        { authors: 'H. Bateman', year: 1910, title: 'The solution of a system of differential equations occurring in the theory of radioactive transformations', url: 'https://doi.org/10.1017/S0305004100003485' },
      ],
    },
    notePlaceholder: 'Under what conditions does [B] reach a maximum? How does t_max change if you double k₂?',
  };

  build() {
    this.model    = new MechanismsModel({ k1: 0.1, k2: 0.5, A0: 1.0 });
    this.mechView = new MechanismsView(this.view);
    this._tEnd    = 30;

    this.layout.addControl(new Slider({
      id: this.controlId('k1'),
      label: 'k₁',
      min: 0.01, max: 2.0, step: 0.01,
      value: this.model.k1,
      format: (v) => `${v.toFixed(2)} s⁻¹`,
      onInput: (v) => { this.model.k1 = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('k2'),
      label: 'k₂',
      min: 0.01, max: 2.0, step: 0.01,
      value: this.model.k2,
      format: (v) => `${v.toFixed(2)} s⁻¹`,
      onInput: (v) => { this.model.k2 = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('a0'),
      label: '[A]₀',
      min: 0.1, max: 2.0, step: 0.05,
      value: this.model.A0,
      format: (v) => `${v.toFixed(2)} mol/L`,
      onInput: (v) => { this.model.A0 = v; },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('tend'),
      label: 't max',
      min: 5, max: 200, step: 5,
      value: this._tEnd,
      format: (v) => `${v} s`,
      onInput: (v) => { this._tEnd = v; },
    }));

    this.layout.addControl(new ToggleButton({
      id: this.controlId('ssa'),
      label: 'Show SSA for [B]',
      value: false,
      onChange: (v) => { this.mechView.showSsa = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'tmax', label: 't_max (B)' },
      { key: 'bmax', label: '[B]_max' },
      { key: 'ratio', label: 'k₂/k₁' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.mechView.draw(this.model, this._tEnd);
    const tM = this.model.tMax;
    const bM = this.model.concentrations(tM).B;
    this.readouts.set('tmax',  `${tM.toFixed(2)} s`);
    this.readouts.set('bmax',  `${bM.toFixed(4)} mol/L`);
    this.readouts.set('ratio', (this.model.k2 / this.model.k1).toFixed(2));
  }
}
