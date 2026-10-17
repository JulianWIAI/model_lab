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
        id: 'quantum',
        name: 'Quantum mechanics',
        benches: [
          {
            id: 'particle-in-box',
            navLabel: 'Particle in a box',
            level: 'intro',
            keywords: [
              'particle in a box', 'infinite square well', 'quantum mechanics',
              'wavefunction', 'energy levels', 'Schrödinger', 'quantum confinement',
            ],
            load: () =>
              import('./benches/physics/quantum/particle-in-box/ParticleInBoxBench.js').then(
                (m) => m.ParticleInBoxBench,
              ),
          },
        ],
      },
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
          {
            id: 'oscillators',
            navLabel: 'Damped oscillator',
            level: 'intro',
            keywords: [
              'harmonic oscillator', 'damping', 'resonance', 'driven oscillator', 'quality factor',
              'log decrement', 'transient', 'steady state', 'frequency response',
            ],
            load: () =>
              import('./benches/physics/mechanics/oscillators/OscillatorsBench.js').then(
                (m) => m.OscillatorsBench,
              ),
          },
          {
            id: 'orbits',
            navLabel: 'Kepler orbits',
            level: 'intro',
            keywords: [
              'Kepler', 'orbit', 'ellipse', 'eccentricity', 'Verlet', 'RK4', 'symplectic',
              'energy conservation', 'angular momentum', 'vis-viva', 'period', 'escape speed',
            ],
            load: () =>
              import('./benches/physics/mechanics/orbits/OrbitsBench.js').then(
                (m) => m.OrbitsBench,
              ),
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
      {
        id: 'electromagnetism',
        name: 'Electromagnetism',
        benches: [
          {
            id: 'rc-circuit',
            navLabel: 'RC circuit',
            level: 'intro',
            keywords: [
              'RC circuit', 'resistor', 'capacitor', 'time constant', 'charging',
              'discharging', 'exponential', 'Kirchhoff', 'electromagnetism', 'filter',
            ],
            load: () =>
              import('./benches/physics/electromagnetism/rc-circuit/RCCircuitBench.js').then(
                (m) => m.RCCircuitBench,
              ),
          },
          {
            id: 'lc-oscillator',
            navLabel: 'RLC oscillator',
            level: 'university',
            keywords: [
              'RLC', 'LC oscillator', 'resonance', 'damping', 'Q factor', 'bandwidth',
              'Laplace', 'poles', 'electromagnetism', 'impedance',
            ],
            load: () =>
              import('./benches/physics/electromagnetism/lc-oscillator/LCOscillatorBench.js').then(
                (m) => m.LCOscillatorBench,
              ),
          },
        ],
      },
      {
        id: 'waves',
        name: 'Waves & Optics',
        benches: [
          {
            id: 'wave-interference',
            navLabel: 'Wave interference',
            level: 'university',
            keywords: ['double slit', 'Young', 'interference', 'fringe', 'wavelength', 'paraxial', 'intensity'],
            load: () =>
              import('./benches/physics/waves/wave-interference/WaveInterferenceBench.js').then(
                (m) => m.WaveInterferenceBench,
              ),
          },
          {
            id: 'standing-waves',
            navLabel: 'Standing waves',
            level: 'university',
            keywords: ['standing wave', 'harmonic', 'fundamental', 'node', 'antinode', 'string', 'pipe', 'resonance'],
            load: () =>
              import('./benches/physics/waves/standing-waves/StandingWavesBench.js').then(
                (m) => m.StandingWavesBench,
              ),
          },
        ],
      },
      {
        id: 'thermodynamics',
        name: 'Thermodynamics',
        benches: [
          {
            id: 'carnot',
            navLabel: 'Carnot cycle',
            level: 'intro',
            keywords: [
              'Carnot', 'heat engine', 'efficiency', 'entropy', 'T-S diagram',
              'heat pump', 'refrigerator', 'second law', 'thermodynamics', 'Kelvin',
            ],
            load: () =>
              import('./benches/physics/thermodynamics/carnot/CarnotBench.js').then(
                (m) => m.CarnotBench,
              ),
          },
          {
            id: 'ideal-gas',
            navLabel: 'Ideal gas',
            level: 'university',
            keywords: [
              'ideal gas', 'kinetic theory', 'equipartition', 'Maxwell-Boltzmann',
              'pressure', 'temperature', 'particle simulation', 'Boltzmann', 'PV=NkT',
            ],
            load: () =>
              import('./benches/physics/thermodynamics/ideal-gas/IdealGasBench.js').then(
                (m) => m.IdealGasBench,
              ),
          },
          {
            id: 'maxwell-boltzmann',
            navLabel: 'Maxwell–Boltzmann',
            level: 'university',
            keywords: [
              'Maxwell-Boltzmann', 'speed distribution', 'kinetic theory', 'temperature',
              'molar mass', 'most probable speed', 'mean speed', 'rms speed', 'ideal gas',
            ],
            load: () =>
              import('./benches/physics/thermodynamics/maxwell-boltzmann/MaxwellBoltzmannBench.js').then(
                (m) => m.MaxwellBoltzmannBench,
              ),
          },
          {
            id: 'van-der-waals',
            navLabel: 'Van der Waals',
            level: 'university',
            keywords: [
              'van der Waals', 'equation of state', 'critical point', 'compressibility factor',
              'reduced variables', 'isotherm', 'corresponding states', 'phase transition',
            ],
            load: () =>
              import('./benches/physics/thermodynamics/van-der-waals/VanDerWaalsBench.js').then(
                (m) => m.VanDerWaalsBench,
              ),
          },
          {
            id: 'entropy-mixing',
            navLabel: 'Entropy of mixing',
            level: 'intro',
            keywords: [
              'entropy', 'mixing', 'ideal', 'mole fraction', 'Gibbs', 'thermodynamics',
              'statistical mechanics', 'Boltzmann', 'gas constant', 'Gibbs paradox',
            ],
            load: () =>
              import('./benches/physics/thermodynamics/entropy-mixing/EntropyMixingBench.js').then(
                (m) => m.EntropyMixingBench,
              ),
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
        id: 'nuclear',
        name: 'Nuclear chemistry',
        benches: [
          {
            id: 'radioactive-decay',
            navLabel: 'Radioactive decay',
            level: 'intro',
            keywords: [
              'radioactive decay', 'half-life', 'decay constant', 'activity',
              'Becquerel', 'Curie', 'Carbon-14', 'Uranium-238', 'stochastic', 'binomial',
              'nuclear chemistry', 'exponential', 'NUBASE2020',
            ],
            load: () =>
              import('./benches/chemistry/nuclear/radioactive-decay/RadioactiveDecayBench.js').then(
                (m) => m.RadioactiveDecayBench,
              ),
          },
        ],
      },
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
        id: 'thermodynamics',
        name: 'Thermodynamics',
        benches: [
          {
            id: 'gibbs',
            navLabel: 'Gibbs free energy',
            level: 'university',
            keywords: [
              'Gibbs free energy', 'ΔG', 'ΔH', 'ΔS', 'spontaneity', 'equilibrium constant',
              'thermodynamics', 'crossover temperature', 'ice fusion',
            ],
            load: () =>
              import('./benches/chemistry/thermodynamics/gibbs/GibbsBench.js').then(
                (m) => m.GibbsBench,
              ),
          },
          {
            id: 'hess',
            navLabel: 'Hess\'s law',
            level: 'intro',
            keywords: ['Hess', 'enthalpy', 'formation enthalpy', 'thermochemistry', 'combustion', 'Hess\'s law'],
            load: () => import('./benches/chemistry/thermodynamics/hess/HessBench.js').then((m) => m.HessBench),
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
          {
            id: 'mechanisms',
            navLabel: 'A→B→C',
            level: 'university',
            keywords: [
              'consecutive reactions', 'series reactions', 'Bateman', 'intermediate',
              'steady-state approximation', 'SSA', 'rate constant', 'kinetics', 'mechanism',
            ],
            load: () =>
              import('./benches/chemistry/kinetics/mechanisms/MechanismsBench.js').then(
                (m) => m.MechanismsBench,
              ),
          },
        ],
      },
      {
        id: 'electrochemistry',
        name: 'Electrochemistry',
        benches: [
          {
            id: 'nernst-cell',
            navLabel: 'Nernst cell',
            level: 'university',
            keywords: ['Nernst equation', 'electrochemistry', 'cell potential', 'EMF', 'Daniell cell', 'reduction potential', 'equilibrium'],
            load: () => import('./benches/chemistry/electrochemistry/nernst-cell/NernstCellBench.js').then((m) => m.NernstCellBench),
          },
          {
            id: 'butler-volmer',
            navLabel: 'Butler-Volmer',
            level: 'graduate',
            keywords: ['Butler-Volmer', 'electrode kinetics', 'overpotential', 'Tafel slope',
                       'exchange current', 'electrochemistry', 'transfer coefficient'],
            load: () => import('./benches/chemistry/electrochemistry/butler-volmer/ButlerVolmerBench.js').then((m) => m.ButlerVolmerBench),
          },
        ],
      },
      {
        id: 'bonding',
        name: 'Bonding',
        benches: [
          {
            id: 'vsepr',
            navLabel: 'VSEPR',
            level: 'intro',
            keywords: ['VSEPR', 'molecular geometry', 'bond angle', 'lone pair', 'tetrahedral', 'octahedral', 'linear', 'electron pair repulsion'],
            load: () => import('./benches/chemistry/bonding/vsepr/VSEPRBench.js').then((m) => m.VSEPRBench),
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
        id: 'ecology',
        name: 'Ecology',
        benches: [
          {
            id: 'competitive-exclusion',
            navLabel: 'Competitive exclusion',
            level: 'university',
            keywords: [
              'competitive exclusion', 'Lotka-Volterra', 'coexistence', 'nullclines',
              'carrying capacity', 'interspecific competition', 'ecology', 'Gause',
            ],
            load: () =>
              import('./benches/biology/ecology/competitive-exclusion/CompetitiveExclusionBench.js').then(
                (m) => m.CompetitiveExclusionBench,
              ),
          },
          {
            id: 'logistic',
            navLabel: 'Logistic growth',
            level: 'intro',
            keywords: ['logistic', 'population growth', 'carrying capacity', 'Verhulst', 'sigmoid', 'dN/dt'],
            load: () => import('./benches/biology/ecology/logistic/LogisticBench.js').then((m) => m.LogisticBench),
          },
          {
            id: 'predator-prey',
            navLabel: 'Predator–prey',
            level: 'university',
            keywords: ['Lotka-Volterra', 'predator', 'prey', 'population dynamics', 'ecology', 'oscillation', 'cycle'],
            load: () => import('./benches/biology/ecology/predator-prey/PredatorPreyBench.js').then((m) => m.PredatorPreyBench),
          },
          {
            id: 'sir',
            navLabel: 'SIR epidemic',
            level: 'university',
            keywords: ['SIR', 'epidemic', 'R0', 'herd immunity', 'Kermack-McKendrick', 'infectious disease', 'final size'],
            load: () => import('./benches/biology/ecology/sir/SIRBench.js').then((m) => m.SIRBench),
          },
          {
            id: 'age-structure',
            navLabel: 'Age structure',
            level: 'university',
            keywords: ['Leslie matrix', 'age structure', 'Perron-Frobenius', 'eigenvalue', 'stable age distribution', 'net reproductive rate', 'Euler-Lotka', 'demography'],
            load: () =>
              import('./benches/biology/ecology/age-structure/AgeStructureBench.js').then(
                (m) => m.AgeStructureBench,
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
      {
        id: 'evolution',
        name: 'Evolution',
        benches: [
          {
            id: 'selection',
            navLabel: 'Truncation selection',
            level: 'university',
            keywords: ['breeder\'s equation', 'truncation selection', 'heritability', 'selection differential', 'response', 'quantitative genetics'],
            load: () => import('./benches/biology/evolution/selection/SelectionBench.js').then((m) => m.SelectionBench),
          },
        ],
      },
      {
        id: 'pharmacology',
        name: 'Pharmacology',
        benches: [
          {
            id: 'pharmacokinetics',
            navLabel: 'Pharmacokinetics',
            level: 'university',
            keywords: ['pharmacokinetics', 'PK', 'Bateman', 'half-life', 'AUC', 'oral bioavailability', 'first-pass', 'elimination', 'absorption', 'one-compartment', 'drug'],
            load: () =>
              import('./benches/biology/pharmacology/pharmacokinetics/PharmacokineticssBench.js').then(
                (m) => m.PharmacokineticssBench,
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
        id: 'synaptic',
        name: 'Synaptic Physiology',
        benches: [
          {
            id: 'synapse-kinetics',
            navLabel: 'Synapse kinetics',
            level: 'university',
            keywords: ['synapse', 'AMPA', 'alpha function', 'synaptic current', 'time constant', 'kinetics'],
            load: () =>
              import('./benches/neuroscience/synaptic/synapse-kinetics/SynapseKineticsBench.js').then(
                (m) => m.SynapseKineticsBench,
              ),
          },
          {
            id: 'stdp',
            navLabel: 'STDP',
            level: 'university',
            keywords: ['STDP', 'Hebbian', 'plasticity', 'LTP', 'LTD', 'synapse', 'spike timing', 'Song 2000', 'neuroscience'],
            load: () =>
              import('./benches/neuroscience/synaptic/stdp/STDPBench.js').then(
                (m) => m.STDPBench,
              ),
          },
        ],
      },
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
          {
            id: 'integrate-and-fire',
            navLabel: 'Integrate-and-fire',
            level: 'university',
            keywords: [
              'integrate-and-fire', 'IAF', 'leaky integrator', 'neuron', 'spike',
              'firing rate', 'rheobase', 'refractory', 'membrane potential', 'ISI',
            ],
            load: () =>
              import('./benches/neuroscience/electrophysiology/integrate-and-fire/IntegrateAndFireBench.js').then(
                (m) => m.IntegrateAndFireBench,
              ),
          },
          {
            id: 'cable-equation',
            navLabel: 'Cable equation',
            level: 'university',
            keywords: [
              'cable equation', 'dendrite', 'space constant', 'lambda', 'input resistance',
              'passive', 'membrane resistance', 'Rall', 'axial resistivity', 'time constant',
            ],
            load: () =>
              import('./benches/neuroscience/electrophysiology/cable-equation/CableEquationBench.js').then(
                (m) => m.CableEquationBench,
              ),
          },
        ],
      },
      {
        id: 'networks',
        name: 'Networks & coding',
        benches: [
          {
            id: 'hopfield',
            navLabel: 'Hopfield',
            level: 'graduate',
            keywords: [
              'Hopfield network', 'associative memory', 'Hebbian learning', 'energy',
              'attractor', 'neuroscience', 'neural network', 'spin glass',
            ],
            load: () =>
              import('./benches/neuroscience/networks/hopfield/HopfieldBench.js').then(
                (m) => m.HopfieldBench,
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
        id: 'linear-algebra',
        name: 'Linear Algebra',
        benches: [
          {
            id: 'eigenvectors',
            navLabel: 'Eigenvectors',
            level: 'university',
            keywords: ['eigenvalue', 'eigenvector', 'Jacobi', 'symmetric', 'power iteration', 'spectral decomposition'],
            load: () =>
              import('./benches/math/linear-algebra/eigenvectors/EigenvectorsBench.js').then(
                (m) => m.EigenvectorsBench,
              ),
          },
        ],
      },
      {
        id: 'dynamics',
        name: 'Dynamical Systems',
        benches: [
          {
            id: 'phase-plane',
            navLabel: 'Phase plane',
            level: 'university',
            keywords: [
              'phase plane', 'dynamical systems', 'eigenvalues', 'stability',
              'trace', 'determinant', 'spiral', 'saddle', 'node', 'center',
            ],
            load: () =>
              import('./benches/math/dynamics/phase-plane/PhasePlaneBench.js').then(
                (m) => m.PhasePlaneBench,
              ),
          },
          {
            id: 'ode-explorer',
            navLabel: 'ODE explorer',
            level: 'intro',
            keywords: [
              'ODE', 'Euler', 'Runge-Kutta', 'RK4', 'numerical integration', 'stability',
              'stiff', 'convergence', 'order', 'logistic', 'backward Euler',
            ],
            load: () =>
              import('./benches/math/dynamics/ode-explorer/OdeExplorerBench.js').then(
                (m) => m.OdeExplorerBench,
              ),
          },
          {
            id: 'logistic-map',
            navLabel: 'Logistic map',
            level: 'university',
            keywords: [
              'logistic map', 'chaos', 'bifurcation', 'period doubling', 'Feigenbaum',
              'Lyapunov exponent', 'attractor', 'cobweb', 'fixed point', 'orbit',
            ],
            load: () =>
              import('./benches/math/dynamics/logistic-map/LogisticMapBench.js').then(
                (m) => m.LogisticMapBench,
              ),
          },
        ],
      },
      {
        id: 'probability',
        name: 'Probability & Statistics',
        benches: [
          {
            id: 'markov-chains',
            navLabel: 'Markov chains',
            level: 'university',
            keywords: [
              'Markov chain', 'transition matrix', 'stationary distribution',
              'mixing time', 'spectral gap', 'eigenvalue', 'stochastic process',
            ],
            load: () =>
              import('./benches/math/probability/markov-chains/MarkovBench.js').then(
                (m) => m.MarkovBench,
              ),
          },
          {
            id: 'central-limit',
            navLabel: 'Central limit',
            level: 'intro',
            keywords: [
              'central limit theorem', 'CLT', 'sample mean', 'normal distribution',
              'standard error', 'uniform', 'exponential', 'Bernoulli', 'Cauchy', 'Lindeberg',
            ],
            load: () =>
              import('./benches/math/probability/central-limit/CentralLimitBench.js').then(
                (m) => m.CentralLimitBench,
              ),
          },
          {
            id: 'bayes',
            navLabel: 'Bayes',
            level: 'university',
            keywords: ['Bayes', 'Beta distribution', 'conjugate prior', 'posterior', 'credible interval', 'Laplace'],
            load: () =>
              import('./benches/math/probability/bayes/BayesBench.js').then(
                (m) => m.BayesBench,
              ),
          },
          {
            id: 'information-theory',
            navLabel: 'Information theory',
            level: 'university',
            keywords: ['Shannon', 'entropy', 'KL divergence', 'bits', 'channel capacity', 'binary entropy'],
            load: () =>
              import('./benches/math/probability/information-theory/InformationTheoryBench.js').then(
                (m) => m.InformationTheoryBench,
              ),
          },
          {
            id: 'random-walk',
            navLabel: 'Random walk',
            level: 'intro',
            keywords: [
              'random walk', 'Brownian motion', 'diffusion', 'mean squared displacement',
              "gambler's ruin", 'absorption', 'stochastic', 'Pólya', 'recurrence',
            ],
            load: () =>
              import('./benches/math/probability/random-walk/RandomWalkBench.js').then(
                (m) => m.RandomWalkBench,
              ),
          },
        ],
      },
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
        id: 'macroeconomics',
        name: 'Growth & Macroeconomics',
        benches: [
          {
            id: 'compound-growth',
            navLabel: 'Compound growth',
            level: 'intro',
            keywords: [
              'compound interest', 'growth', 'exponential', 'doubling time', 'rule of 72',
              'effective annual rate', 'present value', 'compounding', 'continuous compounding',
            ],
            load: () =>
              import('./benches/economics/macroeconomics/compound-growth/CompoundGrowthBench.js').then(
                (m) => m.CompoundGrowthBench,
              ),
          },
          {
            id: 'solow',
            navLabel: 'Solow growth',
            level: 'university',
            keywords: [
              'Solow', 'growth', 'capital', 'steady state', 'golden rule', 'Cobb-Douglas',
              'depreciation', 'savings rate', 'convergence', 'macroeconomics',
            ],
            load: () =>
              import('./benches/economics/macroeconomics/solow/SolowBench.js').then(
                (m) => m.SolowBench,
              ),
          },
        ],
      },
      {
        id: 'markets',
        name: 'Markets',
        benches: [
          {
            id: 'supply-demand',
            navLabel: 'Supply & demand',
            level: 'intro',
            keywords: [
              'supply', 'demand', 'equilibrium', 'consumer surplus', 'producer surplus',
              'elasticity', 'incidence', 'shift', 'Marshall', 'price',
            ],
            load: () =>
              import('./benches/economics/markets/supply-demand/SupplyDemandBench.js').then(
                (m) => m.SupplyDemandBench,
              ),
          },
        ],
      },
      {
        id: 'finance',
        name: 'Finance',
        benches: [
          {
            id: 'options-pricing',
            navLabel: 'Black-Scholes',
            level: 'graduate',
            keywords: ['Black-Scholes', 'options', 'call', 'put', 'delta', 'volatility',
                       'put-call parity', 'finance', 'derivatives'],
            load: () =>
              import('./benches/economics/finance/options-pricing/OptionsPricingBench.js').then(
                (m) => m.OptionsPricingBench,
              ),
          },
        ],
      },
      {
        id: 'game-theory',
        name: 'Game Theory',
        benches: [
          {
            id: 'nash-equilibria',
            navLabel: 'Nash equilibria',
            level: 'university',
            keywords: ['Nash equilibrium', 'game theory', '2×2 game', 'mixed strategy', 'best response'],
            load: () =>
              import('./benches/economics/game-theory/nash-equilibria/NashEquilibriaBench.js').then(
                (m) => m.NashEquilibriaBench,
              ),
          },
          {
            id: 'auctions',
            navLabel: 'Auctions',
            level: 'university',
            keywords: [
              'auction', 'BNE', 'Bayesian Nash equilibrium', 'first-price', 'second-price',
              'Vickrey', 'revenue equivalence', 'private values', 'optimal mechanism',
            ],
            load: () =>
              import('./benches/economics/game-theory/auctions/AuctionBench.js').then(
                (m) => m.AuctionBench,
              ),
          },
        ],
      },
      {
        id: 'social-choice',
        name: 'Social Choice',
        benches: [
          {
            id: 'voting-systems',
            navLabel: 'Voting systems',
            level: 'university',
            keywords: ['voting', 'Condorcet', 'Borda', 'plurality', 'Arrow', 'impossibility', 'social choice', 'preference aggregation'],
            load: () =>
              import('./benches/economics/social-choice/voting-systems/VotingBench.js').then(
                (m) => m.VotingBench,
              ),
          },
        ],
      },
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
  {
    id: 'psychology',
    name: 'Psychology',
    fields: [
      {
        id: 'psychophysics',
        name: 'Perception & Psychophysics',
        benches: [
          {
            id: 'signal-detection',
            navLabel: 'Signal detection',
            level: 'intro',
            keywords: [
              'signal detection', 'SDT', 'd-prime', 'hit rate', 'false alarm', 'ROC',
              'criterion', 'sensitivity', 'AUC', 'psychophysics',
            ],
            load: () =>
              import('./benches/psychology/psychophysics/signal-detection/SignalDetectionBench.js').then(
                (m) => m.SignalDetectionBench,
              ),
          },
          {
            id: 'weber-fechner',
            navLabel: 'Weber–Fechner',
            level: 'intro',
            keywords: [
              'Weber', 'Fechner', 'Stevens', 'psychophysics', 'JND',
              'just-noticeable difference', 'power law', 'logarithmic', 'sensation',
            ],
            load: () =>
              import('./benches/psychology/psychophysics/weber-fechner/WeberFechnerBench.js').then(
                (m) => m.WeberFechnerBench,
              ),
          },
        ],
      },
      {
        id: 'decision-making',
        name: 'Decision making',
        benches: [
          {
            id: 'drift-diffusion',
            navLabel: 'Drift-diffusion',
            level: 'university',
            keywords: [
              'drift-diffusion', 'DDM', 'Ratcliff', 'decision making', 'response time',
              'Wiener process', 'first passage time', 'speed-accuracy tradeoff',
            ],
            load: () =>
              import('./benches/psychology/decision-making/drift-diffusion/DriftDiffusionBench.js').then(
                (m) => m.DriftDiffusionBench,
              ),
          },
        ],
      },
      {
        id: 'learning',
        name: 'Learning & Decision',
        benches: [
          {
            id: 'prisoner-dilemma',
            navLabel: "Prisoner's dilemma",
            level: 'university',
            keywords: ["prisoner's dilemma", 'cooperation', 'defection', 'grim trigger', 'TFT', 'discount factor'],
            load: () =>
              import('./benches/psychology/learning/prisoner-dilemma/PrisonerDilemma_Bench.js').then(
                (m) => m.PrisonerDilemma_Bench,
              ),
          },
          {
            id: 'rescorla-wagner',
            navLabel: 'Rescorla–Wagner',
            level: 'intro',
            keywords: [
              'Rescorla-Wagner', 'associative learning', 'classical conditioning',
              'blocking', 'overshadowing', 'prediction error', 'Pavlov', 'Kamin',
            ],
            load: () =>
              import('./benches/psychology/learning/rescorla-wagner/RescorlaWagnerBench.js').then(
                (m) => m.RescorlaWagnerBench,
              ),
          },
          {
            id: 'opinion-dynamics',
            navLabel: 'Opinion dynamics',
            level: 'university',
            keywords: ['DeGroot', 'opinion dynamics', 'consensus', 'Markov chain', 'stationary distribution', 'left eigenvector', 'social learning', 'network'],
            load: () =>
              import('./benches/psychology/learning/opinion-dynamics/OpinionDynamicsBench.js').then(
                (m) => m.OpinionDynamicsBench,
              ),
          },
          {
            id: 'reinforcement-learning',
            navLabel: 'Q-learning',
            level: 'graduate',
            keywords: ['Q-learning', 'reinforcement learning', 'Bellman equation', 'Markov decision process',
                       'epsilon-greedy', 'discount factor', 'tabular RL'],
            load: () => import('./benches/psychology/learning/reinforcement-learning/RLBench.js').then((m) => m.RLBench),
          },
        ],
      },
    ],
  },
];
