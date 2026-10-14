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
        id: 'acids-bases',
        name: 'Acids & bases',
        benches: [
          {
            id: 'titration',
            navLabel: 'Titration curves',
            level: 'intro',
            keywords: [
              'titration', 'acid', 'base', 'pH', 'equivalence point', 'buffer',
              'pKa', 'Henderson-Hasselbalch', 'strong acid', 'weak acid', 'indicator',
              'charge balance', 'acetic acid', 'ammonium',
            ],
            load: () =>
              import('./benches/chemistry/acids-bases/titration/TitrationBench.js').then(
                (m) => m.TitrationBench,
              ),
          },
          {
            id: 'buffers',
            navLabel: 'Buffer capacity',
            level: 'university',
            keywords: [
              'buffer', 'buffer capacity', 'pKa', 'species fractions', 'speciation',
              'polyprotic', 'acetic acid', 'phosphoric acid', 'carbonic acid', 'citric acid',
              'ammonium', 'acid-base', 'pH', 'beta',
            ],
            load: () =>
              import('./benches/chemistry/acids-bases/buffers/BufferBench.js').then(
                (m) => m.BufferBench,
              ),
          },
        ],
      },
      {
        id: 'atomic',
        name: 'Atomic structure',
        benches: [
          {
            id: 'orbitals',
            navLabel: 'Hydrogen orbitals',
            level: 'university',
            keywords: [
              'hydrogen', 'orbital', 'wavefunction', 'quantum numbers', 'n', 'l', 'm',
              'radial distribution', 'spherical harmonics', 'Laguerre', 'probability density',
              'atomic structure', 'nodes', 'Bohr radius',
            ],
            load: () =>
              import('./benches/chemistry/atomic/orbitals/OrbitalBench.js').then(
                (m) => m.OrbitalBench,
              ),
          },
          {
            id: 'periodic-table',
            navLabel: 'Periodic table',
            level: 'intro',
            keywords: [
              'periodic table', 'elements', 'electronegativity', 'atomic radius',
              'ionization energy', 'electron configuration', 'Aufbau', 'periodic trends',
              'metals', 'nonmetals', 'noble gases', 'lanthanides', 'actinides',
            ],
            load: () =>
              import('./benches/chemistry/atomic/periodic-table/PeriodicTableBench.js').then(
                (m) => m.PeriodicTableBench,
              ),
          },
          {
            id: 'spectra',
            navLabel: 'Atomic spectra',
            level: 'university',
            keywords: [
              'Rydberg', 'spectral lines', 'Balmer', 'Lyman', 'Paschen', 'Brackett',
              'hydrogen', 'deuterium', 'reduced mass', 'isotope shift',
              'wavelength', 'photon energy', 'emission spectrum', 'absorption',
            ],
            load: () =>
              import('./benches/chemistry/atomic/spectra/SpectraBench.js').then(
                (m) => m.SpectraBench,
              ),
          },
        ],
      },
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
      {
        id: 'kinetics',
        name: 'Kinetics',
        benches: [
          {
            id: 'rate-laws',
            navLabel: 'Rate laws',
            level: 'university',
            keywords: [
              'rate law', 'reaction order', 'zeroth order', 'first order', 'second order',
              'half-life', 'integrated rate law', 'kinetics', 'concentration',
            ],
            load: () =>
              import('./benches/chemistry/kinetics/rate-laws/RateLawsBench.js').then(
                (m) => m.RateLawsBench,
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
        id: 'molecular',
        name: 'Molecular biology',
        benches: [
          {
            id: 'central-dogma',
            navLabel: 'Central dogma',
            level: 'intro',
            keywords: [
              'DNA', 'mRNA', 'protein', 'transcription', 'translation', 'codon',
              'ribosome', 'mutation', 'substitution', 'frameshift', 'silent', 'missense',
              'nonsense', 'genetic code', 'amino acid', 'central dogma',
            ],
            load: () =>
              import('./benches/biology/molecular/central-dogma/CentralDogmaBench.js').then(
                (m) => m.CentralDogmaBench,
              ),
          },
          {
            id: 'genetic-code',
            navLabel: 'Genetic code',
            level: 'intro',
            keywords: [
              'genetic code', 'codon', 'amino acid', 'synonymous', 'silent mutation',
              'missense', 'nonsense', 'degeneracy', 'wobble', 'codon wheel', 'translation',
            ],
            load: () =>
              import('./benches/biology/molecular/genetic-code/GeneticCodeBench.js').then(
                (m) => m.GeneticCodeBench,
              ),
          },
          {
            id: 'pcr',
            navLabel: 'PCR',
            level: 'intro',
            keywords: [
              'PCR', 'polymerase chain reaction', 'Ct', 'threshold cycle',
              'amplification efficiency', 'exponential growth', 'plateau', 'qPCR',
              'copy number', 'template', 'logistic',
            ],
            load: () =>
              import('./benches/biology/molecular/pcr/PCRBench.js').then(
                (m) => m.PCRBench,
              ),
          },
          {
            id: 'lac-operon',
            navLabel: 'Lac operon',
            level: 'university',
            keywords: [
              'lac operon', 'gene regulation', 'bistability', 'toggle switch',
              'E. coli', 'mRNA', 'beta-galactosidase', 'allolactose', 'inducer',
              'catabolite repression', 'glucose', 'lactose', 'Hill function',
            ],
            load: () =>
              import('./benches/biology/molecular/lac-operon/LacOperonBench.js').then(
                (m) => m.LacOperonBench,
              ),
          },
        ],
      },
      {
        id: 'biochemistry',
        name: 'Biochemistry',
        benches: [
          {
            id: 'enzyme-kinetics',
            navLabel: 'Enzyme kinetics',
            level: 'university',
            keywords: [
              'enzyme', 'Michaelis-Menten', 'Km', 'Vmax', 'kinetics', 'inhibition',
              'competitive', 'uncompetitive', 'mixed', 'Lineweaver-Burk', 'biochemistry',
            ],
            load: () =>
              import('./benches/biology/biochemistry/enzyme-kinetics/EnzymeKineticsBench.js').then(
                (m) => m.EnzymeKineticsBench,
              ),
          },
          {
            id: 'hill-binding',
            navLabel: 'Hill binding',
            level: 'university',
            keywords: [
              'Hill equation', 'haemoglobin', 'myoglobin', 'cooperative binding',
              'P50', 'oxygen', 'saturation', 'sigmoid', 'allosteric', 'Hill coefficient',
            ],
            load: () =>
              import('./benches/biology/biochemistry/hill-binding/HillBindingBench.js').then(
                (m) => m.HillBindingBench,
              ),
          },
        ],
      },
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
          {
            id: 'mendel',
            navLabel: 'Mendelian genetics',
            level: 'intro',
            keywords: [
              'Mendel', 'genetics', 'Punnett square', 'dominant', 'recessive',
              'monohybrid', 'dihybrid', 'chi-square', 'linkage', 'recombination',
              'inheritance', 'allele', 'genotype', 'phenotype',
            ],
            load: () =>
              import('./benches/biology/genetics/mendel/MendelBench.js').then((m) => m.MendelBench),
          },
          {
            id: 'hardy-weinberg',
            navLabel: 'Hardy–Weinberg',
            level: 'intro',
            keywords: [
              'Hardy-Weinberg', 'allele frequency', 'genotype frequency', 'selection',
              'mutation', 'migration', 'equilibrium', 'fitness', 'de Finetti',
              'population genetics', 'mutation-selection balance',
            ],
            load: () =>
              import('./benches/biology/genetics/hardy-weinberg/HardyWeinbergBench.js').then(
                (m) => m.HardyWeinbergBench,
              ),
          },
          {
            id: 'linkage',
            navLabel: 'Linkage',
            level: 'university',
            keywords: [
              'linkage', 'Haldane', 'Kosambi', 'recombination frequency', 'genetic distance',
              'Morgans', 'centimorgans', 'LOD score', 'interference', 'mapping function',
              'chromosome', 'meiosis', 'crossover',
            ],
            load: () =>
              import('./benches/biology/genetics/linkage/LinkageBench.js').then(
                (m) => m.LinkageBench,
              ),
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
          {
            id: 'goldman',
            navLabel: 'Goldman equation',
            level: 'university',
            keywords: [
              'Goldman', 'Hodgkin-Katz', 'membrane potential', 'resting potential',
              'action potential', 'Nernst', 'permeability', 'electrophysiology', 'squid axon',
            ],
            load: () =>
              import('./benches/neuroscience/electrophysiology/goldman/GoldmanBench.js').then(
                (m) => m.GoldmanBench,
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
