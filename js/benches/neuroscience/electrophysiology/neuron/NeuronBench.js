import { Bench } from '../../../../core/Bench.js';
import { TimeSeries } from '../../../../core/TimeSeries.js';
import { Slider } from '../../../../ui/Slider.js';
import { ActionButton } from '../../../../ui/ActionButton.js';
import { ToggleButton } from '../../../../ui/ToggleButton.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { Legend } from '../../../../ui/Legend.js';
import { el } from '../../../../ui/el.js';
import { HodgkinHuxleyModel } from './HodgkinHuxleyModel.js';
import { NeuronView } from './NeuronView.js';

/** Simulated milliseconds per real second at 1× speed. */
const MS_PER_SECOND = 25;
/** Integration step in ms. */
const DT = 0.01;
/** Record one sample every this many steps (= every 0.1 ms). */
const SAMPLE_EVERY = 10;

/**
 * Neuron bench: a single patch of membrane firing action potentials,
 * with drugs that block each ion channel.
 */
export class NeuronBench extends Bench {
  static meta = {
    id: 'neuron',
    title: 'A neuron firing (Hodgkin–Huxley)',
    navLabel: 'Action potential',
    canvasLabel: 'Membrane voltage and ion channel gates over time',
    level: 'university',
    keywords: ['hodgkin-huxley', 'action potential', 'neuron', 'sodium', 'potassium', 'TTX', 'TEA', 'spike', 'membrane'],
    related: ['physics/pendulum', 'chemistry/equilibrium'],
  };

  static info = {
    formula:
      'C·dV/dt = I − gNa·m³h·(V − ENa)\n' +
      '            − gK·n⁴·(V − EK)\n' +
      '            − gL·(V − EL)\n\n' +
      'dx/dt = αx(V)·(1 − x) − βx(V)·x    for x = m, h, n\n' +
      'ENa = +50 mV    EK = −77 mV',
    predict: [
      'Raise the current slowly from 0. Does the firing rate climb smoothly from zero, or jump?',
      'Before pressing TEA: will the spike get taller, wider, or both?',
      'Send two pulses very close together. Does the second one fire?',
    ],
    breaks: [
      'This is a squid giant axon at 6 °C, measured in 1952. Mammalian neurons have dozens of channel types, dendrites and synapses.',
      'The model nails the spike but says nothing about learning, hormones or mood. Those act at synapses and through gene expression, one level up.',
    ],
    derive: [
      { text: 'The cell membrane is a thin insulator with salty water on both sides, so it behaves like a capacitor.', formula: 'I = C·dV/dt' },
      { text: 'Ions flow through channels. Each channel type acts like a resistor pulling the voltage towards its own reversal potential.', formula: 'I_ion = g·(V − E_ion)' },
      { text: 'The reversal potential comes from the concentration difference across the membrane (Nernst equation).', formula: 'E = (RT/zF)·ln([out]/[in])' },
      { text: 'Hodgkin and Huxley found that channels open and close at voltage-dependent rates. Each gate flips between shut and open.', formula: 'dm/dt = αm(V)·(1−m) − βm(V)·m' },
      { text: 'A sodium channel conducts when three fast m gates are open and its slow h gate has not yet shut. A potassium channel needs four n gates.', formula: 'gNa = ḡNa·m³h     gK = ḡK·n⁴' },
      { text: 'Add up all the currents. Sodium rushes in (the upstroke), h shuts it, potassium flows out (the downstroke). The slow recovery of h and n is the refractory period.' },
    ],
    research: {
      questions: [
        'Why does the firing rate jump from zero to about 50 spikes per second instead of rising smoothly? Look up “type II excitability” and “Hopf bifurcation”.',
        'Where in this model could a hormone or a drug act? Change one conductance and predict the result first.',
      ],
      challenge: 'Add temperature: multiply every α and β by 3^((T − 6.3)/10). Find the temperature at which the neuron stops firing.',
      papers: [
        { authors: 'A. L. Hodgkin & A. F. Huxley', year: 1952, title: 'A quantitative description of membrane current and its application to conduction and excitation in nerve', url: 'https://doi.org/10.1113/jphysiol.1952.sp004764' },
        { authors: 'R. FitzHugh', year: 1961, title: 'Impulses and physiological states in theoretical models of nerve membrane' },
        { authors: 'E. M. Izhikevich', year: 2003, title: 'Simple model of spiking neurons' },
        { authors: 'B. Hille', year: 2001, title: 'Ion Channels of Excitable Membranes' },
      ],
    },
    notePlaceholder: 'The spike ends because…',
  };

  build() {
    this.model = new HodgkinHuxleyModel();
    this.trace = new TimeSeries(100); // ms
    this.speed = 1;
    this.stepCounter = 0;
    this.neuronView = new NeuronView(this.view);

    this.layout.addAction(new ActionButton({ label: 'Inject 1 ms pulse', onClick: () => this.model.pulse(1) }));
    this.layout.addAction(this.createPauseButton());
    this.layout.setLegend(new Legend([
      { label: 'voltage', token: '--accent' },
      { label: 'm · Na⁺ opens', token: '--signal' },
      { label: 'h · Na⁺ shuts', token: '--third' },
      { label: 'n · K⁺ opens', token: '--good' },
    ]));

    this.readouts = new ReadoutPanel([
      { key: 'V', label: 'Voltage' },
      { key: 'rate', label: 'Spikes / 100 ms' },
      { key: 'ina', label: 'Na⁺ current' },
      { key: 'ik', label: 'K⁺ current' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new Slider({
      id: this.controlId('current'), label: 'Steady input current', min: 0, max: 40, step: 0.5, value: 0,
      format: (v) => `${v.toFixed(1)} µA/cm²`,
      onInput: (v) => { this.model.inputCurrent = v; },
    }));
    this.layout.addControl(new Slider({
      id: this.controlId('speed'), label: 'Playback speed', min: 0.25, max: 3, step: 0.25, value: 1,
      format: (v) => `${v}×`,
      onInput: (v) => { this.speed = v; },
    }));

    this.ttx = new ToggleButton({ label: 'TTX · block Na⁺', onToggle: (on) => { this.model.blockSodium = on; } });
    this.tea = new ToggleButton({ label: 'TEA · block K⁺', onToggle: (on) => { this.model.blockPotassium = on; } });
    this.layout.addControl(el('div', { class: 'row' }, [
      this.ttx.element,
      this.tea.element,
      new ActionButton({ label: 'Reset cell', onClick: () => this.resetCell() }).element,
    ]));
    this.layout.addHint('TTX is pufferfish toxin. TEA is a lab compound that plugs potassium channels.');
  }

  resetCell() {
    this.model.blockSodium = false;
    this.model.blockPotassium = false;
    this.ttx.pressed = false;
    this.tea.pressed = false;
    this.model.reset();
    this.trace.clear();
  }

  update(dt) {
    const steps = Math.round((dt * MS_PER_SECOND * this.speed) / DT);
    for (let i = 0; i < steps; i++) {
      this.model.step(DT);
      if (++this.stepCounter % SAMPLE_EVERY === 0) {
        const m = this.model;
        this.trace.push(m.time, [m.V, m.m, m.h, m.n]);
      }
    }
  }

  draw() {
    const m = this.model;
    this.neuronView.draw(this.trace, m);
    this.readouts.set('V', `${m.V.toFixed(1)} mV`);
    this.readouts.set('rate', String(m.spikesInLast(100)));
    // Shown as inward-positive so the sodium rush reads as a positive number.
    this.readouts.set('ina', (-m.sodiumCurrent).toFixed(1));
    this.readouts.set('ik', (-m.potassiumCurrent).toFixed(1));
  }
}
