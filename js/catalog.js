/**
 * The list of subjects and the simulations ("benches") inside each.
 * To add a simulation: import its Bench class here and put it in a subject's list.
 * The order here is the order of the tabs and chips on screen.
 */
import { PendulumBench } from './benches/physics/pendulum/PendulumBench.js';
import { QuarkBench } from './benches/physics/quarks/QuarkBench.js';
import { EquilibriumBench } from './benches/chemistry/equilibrium/EquilibriumBench.js';
import { DriftBench } from './benches/biology/drift/DriftBench.js';
import { NeuronBench } from './benches/neuroscience/neuron/NeuronBench.js';
import { FourierBench } from './benches/math/fourier/FourierBench.js';
import { TaxBench } from './benches/economics/tax/TaxBench.js';

/** @type {{id: string, name: string, benches: (typeof import('./core/Bench.js').Bench)[]}[]} */
export const catalog = [
  { id: 'physics', name: 'Physics', benches: [PendulumBench, QuarkBench] },
  { id: 'chemistry', name: 'Chemistry', benches: [EquilibriumBench] },
  { id: 'biology', name: 'Biology', benches: [DriftBench] },
  { id: 'neuroscience', name: 'Neuroscience', benches: [NeuronBench] },
  { id: 'math', name: 'Math', benches: [FourierBench] },
  { id: 'economics', name: 'Economics', benches: [TaxBench] },
];
