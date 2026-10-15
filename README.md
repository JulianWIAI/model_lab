# Model Lab

Interactive science simulations you can push until they break.

Every simulation ("bench") follows the same study loop:

1. **Predict** – commit to what you think will happen.
2. **Run** – move the sliders and watch.
3. **Break it** – find where the model stops matching reality.
4. **Explain** – write one sentence about what you saw.

Each bench also has two deeper layers: **Derive it** (where the equations come from, step by step) and **Research it** (open questions, a build challenge, and the original papers).

## Simulations

| Subject | Bench | What you can do |
|---|---|---|
| Physics | Pendulum | Compare the exact pendulum with the textbook small-angle shortcut |
| Physics | Quarks | Build protons, neutrons, pions and kaons; see where their mass comes from |
| Chemistry | Equilibrium | Change temperature, barrier height and catalysts; test Le Chatelier |
| Biology | Genetic drift | Pit natural selection against chance in many populations at once |
| Neuroscience | Action potential | Fire a Hodgkin–Huxley neuron; block channels with TTX and TEA |
| Math | Fourier series | Build square, sawtooth and triangle waves from rotating circles |
| Economics | Tax incidence | See who really pays a tax and what it destroys |
| Biology | Central dogma | Transcribe and translate DNA; apply mutations and classify their effects |
| Biology | Mendelian genetics | Cross plants with Punnett squares; test ratios with chi-square |
| Biology | Enzyme kinetics | Explore Michaelis–Menten kinetics and three inhibitor types; fit noisy data |
| Chemistry | Hydrogen orbitals | Visualise 1s–4f probability densities and radial distributions |
| Chemistry | Titration curves | Titrate strong and weak acids; see equivalence points and buffer regions |
| Chemistry | Periodic table | Compare electronegativity, atomic radius and ionisation energy across all 118 elements |
| Chemistry | Atomic spectra | See Lyman, Balmer, Paschen and Brackett lines for hydrogen and deuterium (Rydberg formula with reduced-mass correction) |
| Chemistry | Buffer capacity | Explore exact species fractions and buffer capacity β for five polyprotic acids |
| Biology | Genetic code | Codon wheel for all 64 codons; classify every single-base mutation as silent, missense or nonsense |
| Biology | PCR | Amplify templates with adjustable efficiency and plateau model; read off the threshold cycle Ct |
| Biology | Hardy–Weinberg equilibrium | Track allele frequencies under selection, mutation and migration; trace the path in a de Finetti triangle |
| Biology | Genetic linkage | Compare Haldane and Kosambi mapping functions; compute LOD scores |
| Biology | Lac operon switch | Qualitative bistable ODE model of the lac operon; explore hysteresis by sweeping lactose up and down |
| Biology | Cooperative O₂ binding | Hill equation for haemoglobin vs myoglobin; compare sigmoid and hyperbolic saturation curves |
| Neuroscience | Goldman equation | GHK voltage equation for resting and action-potential membrane potentials; compare Nernst limits |
| Chemistry | Integrated rate laws | 0th, 1st and 2nd order decay; compare half-lives and curve shapes |
| Chemistry | A→B→C mechanisms | Consecutive first-order reactions; explore the steady-state approximation for the intermediate |
| Physics | Ideal gas simulation | 3D elastic particle simulation projected onto 2D; verify P = NkT/V and ⟨KE⟩ = 3/2 kT |
| Physics | Maxwell–Boltzmann | Speed distribution for He, N₂, O₂, Ar, CO₂; compare v_p, v̄ and v_rms |
| Physics | Van der Waals | Reduced isotherms P_r vs V_r; compare VdW Z_c = 0.375 with real CO₂ Z_c ≈ 0.275 |
| Chemistry | Gibbs free energy | ΔG = ΔH − TΔS; find crossover T* and equilibrium constant K for ice fusion |
| Biology | Logistic growth | Watch a population follow dN/dt = rN(1−N/K); find the inflection at K/2 |
| Biology | Predator–prey | Lotka–Volterra oscillations; watch prey and predator cycle around the equilibrium |
| Biology | SIR epidemic | Tune R₀ = β/γ past the herd-immunity threshold; compute the final epidemic size |
| Biology | Truncation selection | Breeder's equation R = h²S; vary heritability and selection intensity |
| Chemistry | Nernst cell (Daniell) | E = E° − (RT/nF)·ln Q; drive the Daniell cell away from standard state |
| Chemistry | Hess's law | Build reaction enthalpy from formation enthalpies; compare combustion cycles |
| Chemistry | VSEPR geometries | Rotate all 12 electron-pair geometries in 3D; compare ideal and real bond angles |
| Physics | RC circuit | Charge and discharge a capacitor; read off τ = RC and the energy stored or lost |
| Chemistry | Radioactive decay | N(t)=N₀·e^(−λt); switch between C-14, U-238, I-131, Ra-226; continuous or stochastic (Binomial) mode |
| Economics | Compound growth | A(t)=P·(1+r/m)^(mt); compare compounding frequencies; exact doubling time vs rule-of-72 error curve |
| Economics | Supply & demand | P*=(a−c)/(b+d); shift supply/demand; CS, PS, elasticities, cost-shock incidence |

## Running tests

```
npm test
```

No packages to install. Uses the built-in `node:test` runner (Node 18+).

## Running it on your computer

The lab is plain HTML, CSS and JavaScript. There is nothing to install or build.

Browsers refuse to load JavaScript modules from a file opened by double-click, so start a tiny local web server in the project folder. Pick one:

- **VS Code:** install the *Live Server* extension, right-click `index.html`, choose *Open with Live Server*.
- **PyCharm:** right-click `index.html` → *Open In* → *Browser*. PyCharm serves it for you.
- **Terminal (macOS or Windows):**
  ```
  python -m http.server 8000
  ```
  then open <http://localhost:8000>.

## Publishing on GitHub Pages

1. Push this folder to a GitHub repository.
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`, then save.
4. After a minute the lab is live at `https://<your-username>.github.io/<repository-name>/`.

The empty `.nojekyll` file tells GitHub to serve the files exactly as they are.

## How the code is organised

Every class lives in its own file. Each bench is split into three parts, so the science is never tangled up with the drawing code.

```
index.html              page shell
css/
  tokens.css            colours and fonts (light and dark)
  layout.css            page and bench layout
  components.css        buttons, sliders, cards, readouts
js/
  main.js               starts the app
  catalog.js            subjects → fields → bench entries (lazy-loaded)
  core/                 shared engine
    App.js              navigation, lazy loading, search, animation loop
    Bench.js            base class every bench extends
    Router.js           #subject/bench links
    Axes.js             plot area: data → pixels, grids, lines
    CanvasView.js       sharp canvas on any screen
    TimeSeries.js       rolling history for scrolling traces
    Theme.js            CSS colours for canvas drawings
    Random.js           random numbers for stochastic models
    Storage.js          safe localStorage wrapper
    Integrators.js      rk4 and backwardEuler for vector ODEs
    RootFinding.js      bisect and brent root-finding
  ui/                   reusable controls
    BenchLayout.js      the standard bench page (stage + cards)
    Slider.js, ToggleButton.js, ActionButton.js, ButtonGroup.js,
    ReadoutPanel.js, Legend.js, NotesBox.js, ThemeToggle.js, el.js
  benches/<subject>/<field>/<topic>/
    XxxModel.js         the science: equations only, no drawing
    XxxView.js          the drawing: canvas only, no science
    XxxBench.js         controls, readouts and the texts for the cards
  data/                 frozen reference datasets, each with a SOURCE object
tests/                  node:test unit tests for every Model
tools/                  scripts that regenerate data files from upstream sources
docs/
  ADDING_A_BENCH.md     step-by-step guide for new simulations (incl. explorer benches)
  ROADMAP.md            curriculum map for all planned benches
```

To read the science of a simulation, open its `Model` file. It has no page code, only the equations with comments.

## Adding a simulation

See [docs/ADDING_A_BENCH.md](docs/ADDING_A_BENCH.md). The pendulum (`js/benches/physics/pendulum/`) is the smallest complete example to copy.

## Browser support

Any current version of Chrome, Edge, Firefox or Safari, on macOS, Windows, Linux, iOS or Android.

## License

MIT – see [LICENSE](LICENSE).
