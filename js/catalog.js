/**
 * Three-level catalog: subjects → fields → bench entries.
 *
 * Each bench entry contains only what navigation and search need:
 *   id, navLabel, level, keywords, and a lazy load() function.
 *
 * App.js calls entry.load() the first time a bench is opened, so only the
 * modules the user actually visits are downloaded.
 *
 * Levels: 'intro' | 'university' | 'graduate'
 */

/** @typedef {{ id: string, navLabel: string, level: string, keywords: string[], load: () => Promise }} BenchEntry */
/** @typedef {{ id: string, name: string, benches: BenchEntry[] }} Field */
/** @typedef {{ id: string, name: string, fields: Field[] }} Subject */

/** @type {Subject[]} */
export const catalog = [
  {
    id: 'physics',
    name: 'Physics',
    fields: [
      {
        id: 'mechanics',
        name: 'Mechanics',
        benches: [
          {
            id: 'pendulum',
            navLabel: 'Pendulum',
            level: 'intro',
            keywords: ['pendulum', 'oscillation', 'harmonic oscillator', 'runge-kutta', 'small-angle', 'period'],
            load: () =>
              import('./benches/physics/mechanics/pendulum/PendulumBench.js').then((m) => m.PendulumBench),
          },
        ],
      },
      {
        id: 'particle-physics',
        name: 'Particle physics',
        benches: [
          {
            id: 'quarks',
            navLabel: 'Quarks',
            level: 'university',
            keywords: ['quarks', 'hadrons', 'proton', 'neutron', 'pion', 'kaon', 'QCD', 'color charge'],
            load: () =>
              import('./benches/physics/particle-physics/quarks/QuarkBench.js').then((m) => m.QuarkBench),
          },
        ],
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    fields: [
      {
        id: 'equilibrium',
        name: 'Equilibrium',
        benches: [
          {
            id: 'equilibrium',
            navLabel: 'Equilibrium',
            level: 'intro',
            keywords: ['equilibrium', 'le chatelier', 'arrhenius', 'rate constant', 'reaction', 'concentration'],
            load: () =>
              import('./benches/chemistry/equilibrium/equilibrium/EquilibriumBench.js').then(
                (m) => m.EquilibriumBench,
              ),
          },
        ],
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    fields: [
      {
        id: 'genetics',
        name: 'Genetics',
        benches: [
          {
            id: 'drift',
            navLabel: 'Genetic drift',
            level: 'university',
            keywords: ['genetic drift', 'wright-fisher', 'selection', 'allele', 'fixation', 'kimura', 'population'],
            load: () =>
              import('./benches/biology/genetics/drift/DriftBench.js').then((m) => m.DriftBench),
          },
        ],
      },
    ],
  },
  {
    id: 'neuroscience',
    name: 'Neuroscience',
    fields: [
      {
        id: 'electrophysiology',
        name: 'Electrophysiology',
        benches: [
          {
            id: 'neuron',
            navLabel: 'Action potential',
            level: 'university',
            keywords: ['hodgkin-huxley', 'action potential', 'neuron', 'sodium channel', 'TTX', 'TEA', 'spike'],
            load: () =>
              import('./benches/neuroscience/electrophysiology/neuron/NeuronBench.js').then(
                (m) => m.NeuronBench,
              ),
          },
        ],
      },
    ],
  },
  {
    id: 'math',
    name: 'Math',
    fields: [
      {
        id: 'analysis',
        name: 'Analysis',
        benches: [
          {
            id: 'fourier',
            navLabel: 'Fourier series',
            level: 'university',
            keywords: ['fourier', 'harmonics', 'square wave', 'sawtooth', 'triangle wave', 'Gibbs phenomenon'],
            load: () =>
              import('./benches/math/analysis/fourier/FourierBench.js').then((m) => m.FourierBench),
          },
        ],
      },
    ],
  },
  {
    id: 'economics',
    name: 'Economics',
    fields: [
      {
        id: 'taxation',
        name: 'Public economics',
        benches: [
          {
            id: 'tax',
            navLabel: 'Tax incidence',
            level: 'intro',
            keywords: ['tax', 'incidence', 'deadweight loss', 'supply', 'demand', 'elasticity', 'revenue'],
            load: () =>
              import('./benches/economics/taxation/tax/TaxBench.js').then((m) => m.TaxBench),
          },
        ],
      },
    ],
  },
];
