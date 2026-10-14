# Prompt 1 – Foundation for scale, then biology and chemistry phase 1

Paste everything below the line into Claude Code, opened in the `model_lab` repository.

---

You are working on Model Lab, a browser-based science lab hosted on GitHub Pages (https://julianwiai.github.io/model_lab/). Read `CLAUDE.md`, `README.md`, `docs/ADDING_A_BENCH.md` and `docs/ROADMAP.md` first. Then read the existing pendulum, equilibrium and drift benches to learn the patterns. Follow `CLAUDE.md` strictly.

The lab will grow from 7 benches to several hundred. This task has two parts: first make the foundation scale (Phase 0), then build six new benches (Phase 1). Start in plan mode and show me the plan for Phase 0 before writing code.

## Phase 0 – Foundation for scale

Do each item as its own commit, keeping the site working after every commit.

**0.1 Lazy-loaded, three-level catalog**
- Restructure `js/catalog.js` into subjects → fields → bench entries. Each entry holds only what navigation needs: `id`, `navLabel`, `level`, `keywords`, and `load: () => import('./benches/…/XBench.js').then((m) => m.XBench)`.
- `App` loads a bench module only when it is first opened, and shows a short loading state meanwhile.
- Move existing benches into field folders, e.g. `js/benches/biology/genetics/drift/`, `js/benches/chemistry/equilibrium/equilibrium/`. Route ids stay the same, so `#biology/drift` keeps working.
- Navigation: subject tabs stay; under them, benches are grouped under field headings. Show a small level badge (Intro / University / Graduate) on each chip.

**0.2 Search**
- A search field in the header that filters across all subjects by `navLabel`, `keywords` and field name, and jumps to a bench on selection. Keyboard accessible.

**0.3 Bench metadata**
- Add `level`, `keywords` and `related` to every existing bench's `static meta`.
- `BenchLayout` shows a "Related" card linking to the related routes.

**0.4 Tests and CI**
- Add `package.json` with `"type": "module"`, no dependencies, and `"test": "node --test tests/"`.
- Write `tests/` files for every existing Model, checking against known results: pendulum period equals T₀/AGM(1, cos(θ₀/2)); neutral drift fixes at frequency p₀ on average; Fourier square-wave overshoot ≈ 8.9 % at 60 terms; Hodgkin–Huxley fires repetitively at 10 µA/cm² and not at 0; equilibrium settles at Q = K; tax revenue peaks at t = 35.
- Add `.github/workflows/test.yml` that runs `npm test` on every push and pull request (Node 20 or newer).

**0.5 Shared numerics**
- `js/core/Integrators.js`: a class with static `rk4(f, y, t, dt)` for vector ODEs and `backwardEuler` for stiff ones. Refactor the pendulum to use it.
- `js/core/RootFinding.js`: static `bisect` and `brent`.
- Add tests for both.

**0.6 Data folder and explorer benches**
- Create `js/data/` for reference datasets. Each file exports frozen data plus a `SOURCE` object `{ name, url, retrieved }`.
- If a dataset is fetched (e.g. the periodic table), add a script in `tools/` that regenerates the data file from the source, so it is reproducible.
- Support explorer benches: benches that show data interactively and may not animate. Add a short section about them to `docs/ADDING_A_BENCH.md`.

Update `README.md` (structure and how to run tests) and `CLAUDE.md` if any convention changed. Then stop and give me a summary before Phase 1.

## Phase 1 – Six new benches

Build them in this order, one commit each, following the definition of done in `CLAUDE.md`. For every bench: write the Model and its tests first, then the View and Bench. Each spec lists what must be true; you design the details.

### Biology

**1. `biology/molecular/central-dogma` – DNA → mRNA → protein**
- The user edits a DNA coding strand (or loads examples, e.g. the start of human β-globin). Show template strand, mRNA, codons and amino acid chain, with an animated ribosome reading along.
- Use the standard genetic code from a new `js/data/geneticCode.js` (all 64 codons, NCBI translation table 1, cited).
- Translation starts at the first AUG and stops at UAA, UAG or UGA.
- Mutation tools: substitution, insertion and deletion at a chosen position. The bench classifies the result as silent, missense, nonsense or frameshift and highlights what changed. Include the sickle-cell mutation (GAG → GTG, Glu → Val) as a preset.
- Tests: every codon maps correctly; a known sequence translates correctly; each mutation type is classified correctly.

**2. `biology/genetics/mendel` – Crosses, Punnett squares and the chi-square test**
- Monohybrid and dihybrid crosses with complete dominance, incomplete dominance and codominance.
- Animated Punnett square, then a simulated litter of N offspring. Compare observed counts with the expected ratio using a chi-square test with the p-value (implement the chi-square CDF; test it against table values).
- Optional linkage: a recombination-frequency slider that bends 9:3:3:1 away from independent assortment.
- Tests: expected ratios 3:1, 1:2:1, 9:3:3:1; chi-square statistic and p-value for known examples, including Mendel's own pea counts (315 : 108 : 101 : 32).

**3. `biology/biochemistry/enzyme-kinetics` – Michaelis–Menten and inhibition**
- Plot v against [S] and switch to a Lineweaver–Burk plot.
- Sliders for Vmax, Km and inhibitor concentration. Inhibitor types: competitive, uncompetitive and mixed (with non-competitive as the special case), using apparent Km and Vmax with Ki and Ki′.
- "Run an experiment" adds noisy measurements; fit Km and Vmax by nonlinear least squares and show why the double-reciprocal fit is distorted by noise.
- Tests: v = Vmax/2 at [S] = Km; apparent parameters for each inhibitor type; the fit recovers known parameters from noise-free data.

### Chemistry

**4. `chemistry/atomic/orbitals` – Hydrogen orbitals**
- Choose n (1–4), l and m (real orbitals: s, p, d, f with labels like 3dz²). Show a 2D cross-section of probability density |ψ|² as a heat map, plus the radial distribution r²R(r)² with nodes marked.
- Compute ψ from the analytic solution: radial part with associated Laguerre polynomials, angular part with real spherical harmonics, in units of the Bohr radius.
- Readouts: energy −13.6 eV/n², number of radial nodes (n − l − 1) and angular nodes (l), most probable radius.
- Render with a Web Worker or cached ImageData if needed to keep it smooth.
- Tests: ∫r²R² dr = 1 numerically for every (n, l); node counts; most probable radius of 1s equals a₀.

**5. `chemistry/acids-bases/titration` – Titration curves**
- Strong acid with strong base, weak acid with strong base, weak base with strong acid. Preset acids with literature pKa values (acetic acid, ammonium, carbonic acid's first step), cited.
- Compute pH exactly by solving the charge balance with `RootFinding` at every titrant volume. Do not use Henderson–Hasselbalch for the curve itself.
- Mark the equivalence point and half-equivalence point (pH = pKa), shade the buffer region, plot dpH/dV, and show which indicator (phenolphthalein, methyl orange, bromothymol blue) changes colour at the equivalence point.
- Tests: strong–strong equivalence pH = 7.00 at 25 °C; acetic acid half-equivalence pH = 4.76 ± 0.02; the volume at equivalence is correct.

**6. `chemistry/atomic/periodic-table` – Periodic table and trends (explorer)**
- Data for all 118 elements in `js/data/elements.js`: Z, symbol, name, atomic mass, group, period, block, Pauling electronegativity, atomic radius, first ionisation energy, and electron configuration. Fetch it from PubChem's periodic table data (or another authoritative source) with a `tools/` script; do not type the values from memory.
- Interactive table coloured by a chosen property, with a missing-data colour. A second view plots the property against Z, so periodicity is visible.
- Clicking an element shows its details and its electron configuration. Use the Aufbau order and list the known exceptions (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au and others) explicitly, with a note on why they happen.
- Tests: 118 unique elements; the configurations of Fe, Cr and Cu are correct; the Aufbau generator agrees with the dataset except for the listed exceptions.

## When finished

- Tick the six benches and Phase 0 and 1 in `docs/ROADMAP.md`, and update the README table.
- All tests pass and every bench opens without console errors.
- Give me a short summary: what was built, anything you were unsure about scientifically, and suggestions for Phase 2.
