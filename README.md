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
