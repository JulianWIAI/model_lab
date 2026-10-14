# Model Lab roadmap

The curriculum map for the whole lab. Each line is one bench.
Tick a box when the bench meets the definition of done in `CLAUDE.md`.

**Kinds:** `sim` = simulation of a mechanism · `explorer` = interactive reference data
**Levels:** I = introductory · U = university · G = graduate

Benches are grouped by subject → field. The id after the name is its route id and must never change once published.

---

## Biology

### Molecular biology
- [ ] Central dogma: DNA → mRNA → protein, with mutations · `central-dogma` · sim · I–U
- [ ] DNA replication fork: leading and lagging strands, Okazaki fragments · `replication` · sim · U
- [ ] Gene regulation: lac operon switch · `lac-operon` · sim · U
- [ ] Genetic toggle switch and repressilator · `gene-circuits` · sim · G
- [ ] PCR amplification and efficiency · `pcr` · sim · U
- [ ] CRISPR guide matching and off-targets · `crispr` · sim · U
- [ ] Genetic code explorer · `genetic-code` · explorer · I
- [ ] Amino acid explorer: structure, charge, hydrophobicity · `amino-acids` · explorer · I–U

### Genetics
- [ ] Mendelian crosses, Punnett squares, chi-square test · `mendel` · sim · I–U
- [ ] Linkage and recombination mapping · `linkage` · sim · U
- [ ] Hardy–Weinberg equilibrium · `hardy-weinberg` · sim · I
- [x] Genetic drift versus selection · `drift` · sim · U
- [ ] Pedigree analysis: inheritance modes · `pedigree` · sim · I–U
- [ ] Quantitative traits and heritability · `heritability` · sim · U
- [ ] Coalescent: tracing ancestry backwards · `coalescent` · sim · G

### Biochemistry
- [ ] Enzyme kinetics: Michaelis–Menten and inhibitors · `enzyme-kinetics` · sim · U
- [ ] Cooperative binding: haemoglobin and the Hill equation · `hill-binding` · sim · U
- [ ] Protein folding on a lattice (HP model) · `protein-folding` · sim · G
- [ ] Glycolysis flux and regulation · `glycolysis` · sim · U
- [ ] ATP and coupled reactions · `atp-coupling` · sim · U

### Cell biology
- [ ] Diffusion and osmosis across membranes · `osmosis` · sim · I
- [ ] Membrane potential: Nernst and Goldman · `goldman` · sim · U
- [ ] Cell cycle oscillator · `cell-cycle` · sim · G
- [ ] Signal transduction cascade amplification · `signalling` · sim · U

### Physiology
- [ ] Cardiac cycle and pressure–volume loop · `cardiac-cycle` · sim · U
- [ ] Glucose–insulin regulation · `glucose-insulin` · sim · U
- [ ] Pharmacokinetics: one- and two-compartment dosing · `pharmacokinetics` · sim · U
- [ ] Oxygen transport and the Bohr effect · `bohr-effect` · sim · U

### Evolution
- [ ] Natural selection on a continuous trait · `selection` · sim · I–U
- [ ] Evolutionary game theory: hawk–dove · `hawk-dove` · sim · U
- [ ] Gene–culture coevolution · `gene-culture` · sim · G
- [ ] Phylogenetic tree building from sequences · `phylogeny` · sim · U
- [ ] Tree of life explorer · `tree-of-life` · explorer · I

### Ecology
- [ ] Logistic growth and carrying capacity · `logistic` · sim · I
- [ ] Predator–prey (Lotka–Volterra) · `predator-prey` · sim · I–U
- [ ] Competition and coexistence · `competition` · sim · U
- [ ] Epidemics: SIR model and herd immunity · `sir` · sim · I–U
- [ ] Energy flow through food webs · `food-web` · sim · I

### Development
- [ ] Turing patterns (reaction–diffusion) · `turing` · sim · G
- [ ] Morphogen gradients and positional information · `morphogen` · sim · U

### Immunology
- [ ] Clonal selection and immune memory · `clonal-selection` · sim · U

---

## Chemistry

### Atomic structure
- [ ] Hydrogen orbitals: probability density and radial nodes · `orbitals` · sim · U
- [ ] Electron configuration and the Aufbau principle · `electron-config` · sim · I
- [ ] Atomic spectra and the Rydberg formula · `spectra` · sim · I–U
- [ ] Periodic table and periodic trends · `periodic-table` · explorer · I–U

### Bonding and structure
- [ ] VSEPR molecular shapes (3D) · `vsepr` · sim · I
- [ ] Molecular orbitals: H₂ and diatomics (LCAO) · `molecular-orbitals` · sim · U
- [ ] Intermolecular forces and boiling points · `intermolecular` · sim · I
- [ ] Crystal lattices and packing · `lattices` · explorer · U

### States of matter
- [ ] Ideal gas from bouncing molecules · `ideal-gas` · sim · I
- [ ] Maxwell–Boltzmann speed distribution · `maxwell-boltzmann` · sim · U
- [ ] Real gases: van der Waals · `van-der-waals` · sim · U
- [ ] Phase diagrams and vapour pressure · `phase-diagram` · sim · U

### Thermodynamics
- [ ] Hess's law and enthalpy cycles · `hess` · sim · I
- [ ] Entropy, Gibbs energy and spontaneity · `gibbs` · sim · U
- [ ] Calorimetry · `calorimetry` · sim · I

### Kinetics
- [ ] Rate laws and reaction order · `rate-laws` · sim · I–U
- [ ] Mechanisms and the steady-state approximation · `mechanisms` · sim · U
- [ ] Oscillating reactions (Brusselator / BZ) · `oscillator` · sim · G

### Equilibrium
- [x] Reaction rates and equilibrium · `equilibrium` · sim · I–U
- [ ] Solubility and Ksp · `solubility` · sim · U

### Acids and bases
- [ ] Acid–base titration curves · `titration` · sim · I–U
- [ ] Buffers and Henderson–Hasselbalch · `buffers` · sim · U
- [ ] Polyprotic acids and speciation diagrams · `speciation` · sim · U

### Electrochemistry
- [ ] Galvanic cells and the Nernst equation · `nernst-cell` · sim · U
- [ ] Electrolysis and Faraday's laws · `electrolysis` · sim · I

### Organic chemistry
- [ ] Functional groups explorer · `functional-groups` · explorer · I
- [ ] Stereochemistry and chirality (3D) · `chirality` · sim · U
- [ ] SN1 versus SN2 reaction profiles · `substitution` · sim · U
- [ ] Polymerisation and chain-length distribution · `polymerisation` · sim · U

### Analytical chemistry and spectroscopy
- [ ] Beer–Lambert law · `beer-lambert` · sim · I
- [ ] Chromatography separation · `chromatography` · sim · U
- [ ] Mass spectrometry isotope patterns · `isotope-patterns` · sim · U
- [ ] NMR chemical shift and splitting · `nmr` · sim · U–G

### Nuclear chemistry
- [ ] Radioactive decay chains (Bateman) · `decay-chains` · sim · U

### Quantum chemistry
- [ ] Particle in a box · `particle-box` · sim · U
- [ ] 1D Schrödinger solver for any potential · `schrodinger-1d` · sim · G
- [ ] Hückel theory for conjugated molecules · `huckel` · sim · G

---

## Physics, neuroscience, math, economics

To be mapped in a later phase with the same structure. Done so far:

- [x] Pendulum: exact versus small-angle · `pendulum`
- [x] Quarks and hadron masses · `quarks`
- [x] Action potential (Hodgkin–Huxley) · `neuron`
- [x] Fourier series · `fourier`
- [x] Tax incidence · `tax`

---

## Phases

| Phase | Content | Status |
|---|---|---|
| 0 | Foundation for scale: lazy catalog with fields, search, levels, tests, CI, shared integrators, data folder | **done** |
| 1 | Biology: central-dogma, mendel, enzyme-kinetics · Chemistry: orbitals, titration, periodic-table | planned |
| 2 | Rest of molecular biology, genetics, atomic structure, acids and bases | – |
| 3 | Biochemistry, cell biology, states of matter, thermodynamics, kinetics | – |
| 4 | Physiology, evolution, ecology, bonding, electrochemistry | – |
| 5 | Development, immunology, organic, analytical, nuclear, quantum chemistry | – |
| 6 | Map and build physics, neuroscience, math and economics to the same depth | – |
