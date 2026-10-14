# Model Lab – instructions for Claude Code

Model Lab is a browser-based science lab: interactive simulations ("benches") that let a learner predict, experiment, find where a model breaks, and trace every equation back to its derivation and original paper. The goal is wide coverage of physics, chemistry, biology, neuroscience, math and economics, from introductory to graduate level.

Live site: https://julianwiai.github.io/model_lab/
Hosting: GitHub Pages, deployed straight from the `main` branch root. There is no build step.

## Hard constraints

- **Plain HTML, CSS and JavaScript ES modules.** No bundler, no framework, no transpiler. Every file must run in the browser exactly as committed.
- **No runtime npm dependencies.** A library is allowed only if a bench truly needs it (e.g. Three.js for 3D). Load it from a CDN pinned to an exact version via the import map in `index.html`, and note it in README.
- **One class per file.** Small helper functions may live beside the class that uses them.
- **Comment normally.** Every file starts with a doc comment saying what it is. Every class and public method has a JSDoc comment. Every equation has a comment naming it and its units. Do not comment obvious lines.
- **Works everywhere.** Current Chrome, Edge, Firefox and Safari, at phone width (≈400 px) and in light and dark mode.
- **Existing links keep working.** Routes are `#<subject>/<bench-id>`. Never rename a published bench id.

## Architecture

```
js/core/      engine: App, Bench, Router, Axes, CanvasView, TimeSeries, Theme, Random, Storage
js/ui/        reusable controls and the standard BenchLayout
js/data/      reference data (periodic table, genetic code, constants), each with source + retrieval date
js/benches/<subject>/<field>/<topic>/
  <Name>Model.js   the science only: state, equations, step(dt). NO DOM, NO canvas.
  <Name>View.js    drawing only: receives a CanvasView and a model. NO science.
  <Name>Bench.js   extends Bench: static meta, static info, controls, readouts
js/catalog.js     registry of subjects → fields → benches (lazy-loaded)
tests/            node:test unit tests for every Model and every data file
docs/             ROADMAP.md, ADDING_A_BENCH.md, prompts/
```

Rules that keep this scalable:

- Models are pure and testable in Node. If a Model needs randomness, use `core/Random.js`.
- Views take every colour from `theme.color('--token')` and every plot through `core/Axes.js`.
- Shared maths (ODE integrators, root finding, special functions) belongs in `js/core/`, not copied into benches.
- Reference facts that are not simulations (element properties, codon table, amino acids) go in `js/data/` and are shown by **explorer** benches. Never hard-code the same data twice.

## Scientific standards

- Every constant and dataset cites its source (CODATA, NIST, PubChem, PDG, IUPAC, a textbook or paper) in a comment.
- Prefer exact methods over textbook shortcuts (e.g. solve the charge balance for pH rather than using Henderson–Hasselbalch everywhere), and say in "Where it breaks" which simplifications remain.
- The `info.research.papers` list contains only real publications. If you are not certain of a DOI, omit `url`; BenchLayout then links to a Google Scholar search.
- Never invent experimental values. If a value cannot be verified, leave it out and say so in the commit message.
- If a remote data source (script fetch, API call) cannot be reached, stop and tell the user. Never fill the gap from memory.

## Every bench must have

- `static meta`: `id`, `title`, `navLabel`, `canvasLabel`, `level` ('intro' | 'university' | 'graduate'), `keywords` (array, for search), `related` (array of `subject/id` routes).
- `static info`: `formula`, `predict` (2–4 items), `breaks` (1–3 honest limits), `derive` (ordered steps with formulas), `research` (`questions`, `challenge`, `papers`), `notePlaceholder`.
- A test file `tests/<subject>/<topic>.test.js` that checks the Model against known analytic results or published values.
- A row in the README simulation table and a ticked box in `docs/ROADMAP.md`.

## Commands

```
npm test                        # runs node --test on tests/ (no dependencies)
python -m http.server 8000      # serve locally, then open http://localhost:8000
```

## Workflow

1. Start a multi-bench task in plan mode. Show the plan before writing code.
2. Build one bench at a time: Model → test → View → Bench → register in catalog → check in the browser.
3. Run `npm test` before every commit. All tests must pass.
4. One commit per bench, message format: `bench(<subject>/<id>): <what it simulates>`. Infrastructure commits: `core: …`, `ui: …`, `data: …`, `docs: …`, `ci: …`.
5. Do not push or open a pull request unless asked.
6. When something in the science is uncertain, stop and ask rather than guess.

## Definition of done for a bench

- [ ] Model has no DOM code and passes its tests
- [ ] Opens from its route, no console errors
- [ ] Readable in light and dark mode and at 400 px width
- [ ] All `info` cards filled in, papers real
- [ ] Registered in catalog, README table and ROADMAP updated
